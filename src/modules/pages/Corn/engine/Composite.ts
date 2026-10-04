import * as THREE from 'three';

/**
 * Final image: one or two world targets → wipe / blend → grade LUT (map-grade.png, a contrast
 * curve: 32 → 19, 64 → 47) → optional menu blur (dual-filter, 4 levels) → grain + vignette.
 *
 * Wipe, measured at 29.6 s: the edge is a straight line rising to the right, slope −0.248 px/px
 * (≈ 14°), the new world comes up from below while the old one is pushed up.
 */
const WIPE_SLOPE = 0.248;
export const MOVE_SCALE = 0.72;
const PUSH_OLD = 0.22; // old world moves up by this much of the screen over the wipe
const LIFT_NEW = 0.3; // new world starts this much lower and rises into place

const quadVert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const composeFrag = /* glsl */ `
uniform sampler2D tA, tB, tLut;
uniform float uMode;      // 0 = A only, 1 = wipe A → B, 2 = blend A → B
uniform float uP;
uniform float uSlope;     // edge slope in uv units (px slope × aspect)
uniform float uFade;      // 0 = black, 1 = image (intro)
varying vec2 vUv;

vec3 toSrgb(vec3 c) {
    c = max(c, 0.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
vec3 grade(vec3 c) {
    // 64³ LUT as 8 × 8 tiles of 64 px in a 512 px image; blue picks the tile
    float b = clamp(c.b, 0.0, 1.0) * 63.0;
    float b0 = floor(b);
    float b1 = min(b0 + 1.0, 63.0);
    vec2 rg = (clamp(c.rg, 0.0, 1.0) * 63.0 + 0.5) / 512.0;
    vec2 t0 = vec2(mod(b0, 8.0), floor(b0 / 8.0)) * 64.0 / 512.0;
    vec2 t1 = vec2(mod(b1, 8.0), floor(b1 / 8.0)) * 64.0 / 512.0;
    return mix(texture2D(tLut, t0 + rg).rgb, texture2D(tLut, t1 + rg).rgb, b - b0);
}
void main() {
    vec3 col;
    if (uMode < 0.5) {
        col = texture2D(tA, vUv).rgb;
    } else if (uMode < 1.5) {
        float hs = abs(uSlope) * 0.5;
        float edge = mix(-hs - 0.02, 1.0 + hs + 0.02, uP) + uSlope * (vUv.x - 0.5);
        vec2 ua = vUv - vec2(0.0, ${PUSH_OLD.toFixed(3)} * uP);
        vec2 ub = vUv + vec2(0.0, ${LIFT_NEW.toFixed(3)} * (1.0 - uP));
        col = vUv.y < edge ? texture2D(tB, ub).rgb : texture2D(tA, ua).rgb;
    } else {
        col = mix(texture2D(tA, vUv).rgb, texture2D(tB, vUv).rgb, uP);
    }
    col = grade(toSrgb(col)) * uFade;
    gl_FragColor = vec4(col, 1.0);
}`;

const downFrag = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main() {
    vec2 o = uTexel * 0.5;
    vec4 s = texture2D(tSrc, vUv) * 4.0;
    s += texture2D(tSrc, vUv - o); s += texture2D(tSrc, vUv + o);
    s += texture2D(tSrc, vUv + vec2(o.x, -o.y)); s += texture2D(tSrc, vUv - vec2(o.x, -o.y));
    gl_FragColor = s / 8.0;
}`;

const upFrag = /* glsl */ `
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main() {
    vec2 o = uTexel * 0.5;
    vec4 s = texture2D(tSrc, vUv + vec2(-o.x * 2.0, 0.0));
    s += texture2D(tSrc, vUv + vec2(-o.x, o.y)) * 2.0;
    s += texture2D(tSrc, vUv + vec2(0.0, o.y * 2.0));
    s += texture2D(tSrc, vUv + vec2(o.x, o.y)) * 2.0;
    s += texture2D(tSrc, vUv + vec2(o.x * 2.0, 0.0));
    s += texture2D(tSrc, vUv + vec2(o.x, -o.y)) * 2.0;
    s += texture2D(tSrc, vUv + vec2(0.0, -o.y * 2.0));
    s += texture2D(tSrc, vUv + vec2(-o.x, -o.y)) * 2.0;
    gl_FragColor = s / 12.0;
}`;

const finalFrag = /* glsl */ `
uniform sampler2D tSharp, tBlur, tNoise;
uniform float uBlur;      // 0..1 menu
uniform vec2 uNoiseScale; // screen px / noise px
uniform vec2 uNoiseOffset;
uniform float uGrain;
varying vec2 vUv;
void main() {
    vec3 col = texture2D(tSharp, vUv).rgb;
    if (uBlur > 0.001) col = mix(col, texture2D(tBlur, vUv).rgb * 0.8, uBlur);
    float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.2, 1.0)));
    col *= mix(0.78, 1.0, v);
    float n = texture2D(tNoise, vUv * uNoiseScale + uNoiseOffset).r - 0.5;
    col += n * uGrain;
    gl_FragColor = vec4(col, 1.0);
}`;

function pass(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader, uniforms, depthTest: false, depthWrite: false }));
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    return { scene, mesh, uniforms };
}

const rtOpts = (samples = 0): THREE.RenderTargetOptions => ({
    type: THREE.HalfFloatType,
    depthBuffer: samples > 0,
    samples,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
});

export class Composite {
    /** World render targets (MSAA): A = current, B = incoming. */
    readonly a = new THREE.WebGLRenderTarget(1, 1, rtOpts(2));
    readonly b = new THREE.WebGLRenderTarget(1, 1, rtOpts(2));
    /**
     * Transition targets at 72 %: while two worlds share the screen (a wipe or blend in motion) both
     * render smaller, which keeps the frame inside 60 fps; the moving edge hides the softness, and a
     * parked frame is always full resolution.
     */
    readonly aMove = new THREE.WebGLRenderTarget(1, 1, rtOpts(2));
    readonly bMove = new THREE.WebGLRenderTarget(1, 1, rtOpts(2));
    private sharp = new THREE.WebGLRenderTarget(1, 1, rtOpts());
    private chain: THREE.WebGLRenderTarget[] = Array.from({ length: 4 }, () => new THREE.WebGLRenderTarget(1, 1, rtOpts()));
    private cam = new THREE.Camera();
    private compose;
    private down;
    private up;
    private final;
    private w = 1;
    private h = 1;

    constructor(lut: THREE.Texture, noise: THREE.Texture) {
        this.compose = pass(composeFrag, {
            tA: { value: null },
            tB: { value: null },
            tLut: { value: lut },
            uMode: { value: 0 },
            uP: { value: 0 },
            uSlope: { value: 0 },
            uFade: { value: 1 },
        });
        this.down = pass(downFrag, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
        this.up = pass(upFrag, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
        this.final = pass(finalFrag, {
            tSharp: { value: this.sharp.texture },
            tBlur: { value: this.chain[0].texture },
            tNoise: { value: noise },
            uBlur: { value: 0 },
            uNoiseScale: { value: new THREE.Vector2(1, 1) },
            uNoiseOffset: { value: new THREE.Vector2() },
            uGrain: { value: 0.07 },
        });
    }

    setSize(w: number, h: number, dpr: number) {
        this.w = w;
        this.h = h;
        const W = Math.round(w * dpr);
        const H = Math.round(h * dpr);
        [this.a, this.b, this.sharp].forEach((rt) => rt.setSize(W, H));
        [this.aMove, this.bMove].forEach((rt) => rt.setSize(Math.round(W * MOVE_SCALE), Math.round(H * MOVE_SCALE)));
        this.chain.forEach((rt, i) => rt.setSize(Math.max(1, W >> (i + 1)), Math.max(1, H >> (i + 1))));
        this.compose.uniforms.uSlope.value = WIPE_SLOPE * (w / h);
        this.final.uniforms.uNoiseScale.value.set(W / 512, H / 512);
    }

    /**
     * mode: 0 = only A, 1 = wipe A → B by p, 2 = blend A → B by p.
     * blur: 0..1 menu blur. fade: 0..1 from black (intro).
     */
    render(renderer: THREE.WebGLRenderer, mode: number, p: number, blur: number, fade: number) {
        const c = this.compose.uniforms;
        c.tA.value = (mode ? this.aMove : this.a).texture;
        c.tB.value = (mode ? this.bMove : this.b).texture;
        c.uMode.value = mode;
        c.uP.value = p;
        c.uFade.value = fade;
        renderer.setRenderTarget(this.sharp);
        renderer.render(this.compose.scene, this.cam);

        if (blur > 0.001) {
            let src = this.sharp;
            for (const rt of this.chain) {
                this.down.uniforms.tSrc.value = src.texture;
                this.down.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
                renderer.setRenderTarget(rt);
                renderer.render(this.down.scene, this.cam);
                src = rt;
            }
            for (let i = this.chain.length - 2; i >= 0; i--) {
                this.up.uniforms.tSrc.value = src.texture;
                this.up.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
                renderer.setRenderTarget(this.chain[i]);
                renderer.render(this.up.scene, this.cam);
                src = this.chain[i];
            }
        }
        const f = this.final.uniforms;
        f.uBlur.value = blur;
        f.uNoiseOffset.value.set(Math.random(), Math.random());
        renderer.setRenderTarget(null);
        renderer.render(this.final.scene, this.cam);
    }

    get size() {
        return { w: this.w, h: this.h };
    }

    dispose() {
        [this.a, this.b, this.aMove, this.bMove, this.sharp, ...this.chain].forEach((rt) => rt.dispose());
        [this.compose, this.down, this.up, this.final].forEach((p) => {
            p.mesh.geometry.dispose();
            (p.mesh.material as THREE.Material).dispose();
        });
    }
}
