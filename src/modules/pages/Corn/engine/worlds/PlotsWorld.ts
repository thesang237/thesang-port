import * as THREE from 'three';

import type { Assets } from '../assets';
import { rng } from '../fx/particles';

import { motes } from './shared';
import { damp, type FrameCtx, TILT, World } from './World';

/**
 * Trial plots from above, rebuilt from the reference ("Field-Object"): a 40 × 40 grid of plots, each
 * a stack of transparent height slices of crop (`map-field-diffuse-combined`: 12 frames of 256 px —
 * frames 5–11 for a tall plot of 7 layers, 0–4 for a short one of 5), lifted 0.26 apart (± 0.04), so
 * the perspective camera sees real parallax between leaf layers. Each layer jiggles on cloud noise
 * (wind through the crop), every plot gets its own tint between soil-brown and green, cloud shadows
 * drift over. Post (reference field composite): a tilt-shift blur along the bottom that climbs as
 * the stop leaves, plus a glow from the blurred image's highlights.
 * Measured at 46 s: plot pitch ≈ 107 px at 1920; the field reads darker behind the copy.
 */

const ROWS = 40;
const COLS = 40;
/** Plots are 1 unit here (the reference uses 2 with a closer camera); layer heights scale with it. */
const TILE = 1;
const ELEV = 0.26 * 0.5;

const tileVert = /* glsl */ `
attribute vec3 a_base;
attribute vec4 a_map_frame;
attribute float a_map_rotation;
attribute float a_rand_offset;
attribute float a_color_amount;
uniform float uTime;
uniform vec2 uGrid;
uniform sampler2D tNoise;
varying vec2 vUv;
varying vec2 vUvEnhanced;
varying vec4 vMapFrame;
varying float vMapRotation;
varying float vColorAmount;
varying vec3 vPosBase;
varying vec3 vN;
void main() {
    vec3 p = position;
    vec2 posT = p.xy;
    posT.x -= (uTime * 0.7) * (0.8 * a_rand_offset * 24.0);
    posT.y -= (uTime * 0.7) * (0.1 * a_rand_offset * 24.0);
    float turbulence = (texture2D(tNoise, posT * 0.2).r * 2.0 - 1.0) * a_rand_offset;
    p += vec3(0.04, 0.04, 0.06) * turbulence;
    p *= vec3(1.08, 1.02, 1.0);
    vec3 world = p * vec3(${TILE.toFixed(1)}, ${TILE.toFixed(1)}, 1.0) + a_base;
    vUv = uv;
    vUvEnhanced = (world.xy + uGrid * 0.5) / uGrid;
    vMapFrame = a_map_frame;
    vMapRotation = a_map_rotation;
    vColorAmount = a_color_amount;
    vPosBase = a_base;
    vN = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
}`;

const BLENDS = /* glsl */ `
#define PI 3.141592653589793
vec2 rotateUV(vec2 uv, float r) {
    return vec2(cos(r) * (uv.x - 0.5) + sin(r) * (uv.y - 0.5) + 0.5, cos(r) * (uv.y - 0.5) - sin(r) * (uv.x - 0.5) + 0.5);
}
float overlay1(float b, float s) { return b < 0.5 ? (2.0 * b * s) : (1.0 - 2.0 * (1.0 - b) * (1.0 - s)); }
vec3 blendOverlay(vec3 b, vec3 s) { return vec3(overlay1(b.r, s.r), overlay1(b.g, s.g), overlay1(b.b, s.b)); }
vec3 blendOverlay(vec3 b, vec3 s, float o) { return blendOverlay(b, s) * o + b * (1.0 - o); }
vec3 blendMultiply(vec3 b, vec3 s, float o) { return b * s * o + b * (1.0 - o); }
float fakePointLight(vec3 point, vec3 normal, vec2 res, float amount) {
    vec2 pixel = gl_FragCoord.xy / res;
    vec2 lp = point.xy / res;
    lp.y = 1.0 - lp.y;
    vec3 l = normalize(vec3(lp - pixel, point.z));
    return amount * max(dot(normal, l), 0.0);
}`;

const tileFrag = /* glsl */ `
uniform sampler2D tDiffuseCombined, tNoise;
uniform vec2 uResolution;
uniform float uResolutionTex;
uniform vec3 uPointLight;
uniform float uTime, uGrow;
varying vec2 vUv;
varying vec2 vUvEnhanced;
varying vec4 vMapFrame;
varying float vMapRotation;
varying float vColorAmount;
varying vec3 vPosBase;
varying vec3 vN;
${BLENDS}
void main() {
    vec3 c0 = vec3(0.60, 0.44, 0.28);
    vec3 c1 = vec3(0.33, 0.50, 0.40);
    vec4 frame = vMapFrame / uResolutionTex;
    vec2 st = gl_FragCoord.xy / uResolution;
    vec2 uvS = rotateUV(vUv, PI * vMapRotation + PI * 0.5);
    uvS = vec2(frame.x + uvS.x * frame.z, frame.y + uvS.y * frame.w);
    vec4 tex = texture2D(tDiffuseCombined, uvS);
    // display-space maths as in the reference, back to linear at the end
    vec3 col = pow(tex.rgb, vec3(1.0 / 2.2));
    vec2 s0 = vUvEnhanced - vec2(uTime * 0.8, uTime);
    vec2 s1 = vUvEnhanced - vec2(uTime * 0.1, uTime * 0.2);
    float cloud = texture2D(tNoise, s0 * 0.4).r * texture2D(tNoise, s1 * 0.2).r * 2.0;
    float light = fakePointLight(uPointLight, normalize(vN), uResolution, 1.5);
    float darkened = smoothstep(0.2, 0.7, distance(st, vec2(0.25, 0.45)));
    float elev = clamp(mix(0.3, 1.0, vPosBase.z / ${(0.8 * 0.5).toFixed(2)}), 0.0, 1.0);
    col = blendOverlay(col, mix(c0, c1, vColorAmount));
    col = blendMultiply(col, vec3(0.8 - darkened * 0.12), 1.0 - clamp(elev * cloud, 0.2, 1.0));
    col = blendOverlay(col, vec3(1.0), elev * clamp(cloud * mix(0.0, 4.0, light) + (light * 1.5) * darkened, 0.0, 1.0));
    gl_FragColor = vec4(pow(col, vec3(2.2)), tex.a * uGrow);
}`;

const groundFrag = /* glsl */ `
uniform sampler2D tDiffuse, tNoise;
uniform vec2 uUVScale;
uniform float uTime;
varying vec2 vUv;
void main() {
    vec3 col = pow(texture2D(tDiffuse, vUv * uUVScale).rgb, vec3(1.0 / 2.2));
    float cloud = texture2D(tNoise, vUv * 3.0 - vec2(uTime * 0.8, uTime) * 0.4).r;
    col *= 0.55 + 0.25 * cloud;
    gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
}`;

/** Reference field composite: tilt-shift blur up from the bottom, glow from the blurred highlights. */
const compositeFrag = /* glsl */ `
uniform sampler2D tMap, tBlur;
uniform float blurBottom;
varying vec2 vUv;
vec3 levels(vec3 c, float lo, float g, float hi) { return pow(min(max(c - vec3(lo), 0.0) / vec3(hi - lo), vec3(1.0)), vec3(1.0 / g)); }
void main() {
    vec3 col = texture2D(tMap, vUv).rgb;
    vec3 blur = texture2D(tBlur, vUv).rgb;
    float amount = clamp(((blurBottom * 0.6) + 0.7 - vUv.y) * 2.0, 0.0, 1.0);
    col = mix(col, blur, amount);
    // glow, computed on display values (the reference had no colour management)
    vec3 glow = pow(levels(pow(blur, vec3(1.0 / 2.2)), 50.0 / 255.0, 0.8, 1.0) * 0.7, vec3(2.2));
    col += glow;
    // the field reads darker behind the copy on the left (reference 47 s: left 45, 54, 36)
    col *= mix(0.5, 1.0, smoothstep(0.08, 0.6, vUv.x + (1.0 - vUv.y) * 0.08));
    gl_FragColor = vec4(col, 1.0);
}`;

const blurFrag = /* glsl */ `
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uRadius;
varying vec2 vUv;
void main() {
    vec3 s = vec3(0.0);
    for (int i = 0; i < 12; i++) {
        float a = float(i) / 12.0 * 6.2831853 + 0.37;
        s += texture2D(tSrc, vUv + vec2(cos(a), sin(a)) * uTexel * uRadius).rgb;
    }
    gl_FragColor = vec4(s / 12.0, 1.0);
}`;

const quadVert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function pass(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader, uniforms, depthTest: false, depthWrite: false }));
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    return { scene, mesh, uniforms };
}

/** Atlas frames (reference TexturePacker sheet: 12 frames of 256 px, rows of 4). */
const FRAME = (i: number) => [(i % 4) * 256, Math.floor(i / 4) * 256, 256, 256] as const;

export class PlotsWorld extends World {
    readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
    private field = new THREE.Group();
    private tileMat: THREE.ShaderMaterial;
    private groundMat: THREE.ShaderMaterial;
    private seeds: THREE.Points;
    private pivot = new THREE.Vector3();
    private yaw = 0;
    private pitch = 0;
    private res = new THREE.Vector2(1920, 994);
    private light = new THREE.Vector3();
    // no MSAA: 5–7 layers of soft-edged leaves cover every pixel, the mip-mapped atlas does the smoothing
    private sets = new Map<string, { scene: THREE.WebGLRenderTarget; a: THREE.WebGLRenderTarget; b: THREE.WebGLRenderTarget }>();
    private rtScene!: THREE.WebGLRenderTarget;
    private rtA!: THREE.WebGLRenderTarget;
    private rtB!: THREE.WebGLRenderTarget;
    private blur = pass(blurFrag, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 2.5 } });
    private comp = pass(compositeFrag, { tMap: { value: null }, tBlur: { value: null }, blurBottom: { value: 0 } });
    private postCam = new THREE.Camera();

    constructor(a: Assets) {
        super();
        for (const t of [a.tex.ground, a.tex.clouds]) {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.needsUpdate = true;
        }
        const rand = rng(17);
        // ground under the plots
        this.groundMat = new THREE.ShaderMaterial({
            uniforms: { tDiffuse: { value: a.tex.ground }, tNoise: { value: a.tex.clouds }, uUVScale: { value: new THREE.Vector2(4 * COLS, 4 * ROWS) }, uTime: { value: 0 } },
            vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: groundFrag,
            depthWrite: false,
            depthTest: false,
        });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(COLS * TILE * 1.05, ROWS * TILE * 1.05), this.groundMat);
        ground.position.z = -0.05;
        ground.renderOrder = -1;
        this.field.add(ground);

        // the stacks
        const stacks = Array.from({ length: ROWS * COLS }, () => ({
            quads: rand() < 0.5 ? 7 : 5,
            tint: 0.5 - (Math.floor(rand() * 4) === 0 ? 0.5 : 0) + rand() * (0.5 + (Math.floor(rand() * 4) === 0 ? 0.5 : 0)),
            rot: Math.floor(rand() * 2),
            plus: rand() * 0.08 - 0.04,
        }));
        const total = stacks.reduce((s, t) => s + t.quads, 0);
        const plane = new THREE.PlaneGeometry(1, 1, 4, 4);
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = plane.index;
        geo.setAttribute('position', plane.getAttribute('position'));
        geo.setAttribute('uv', plane.getAttribute('uv'));
        geo.instanceCount = total;
        const base = new Float32Array(total * 3);
        const frame = new Float32Array(total * 4);
        const rot = new Float32Array(total);
        const rnd = new Float32Array(total);
        const tint = new Float32Array(total);
        let h = 0;
        let f = 0;
        for (let d = 0; d < ROWS; d++)
            for (let v = 0; v < COLS; v++) {
                const m = stacks[f++];
                for (let g = 0; g < m.quads; g++) {
                    const idx = m.quads > 5 ? 12 - (g + 1) : 5 - (g + 1);
                    base.set([(v - (COLS - 1) / 2) * TILE, -(d - (ROWS - 1) / 2) * TILE, ELEV + g * (ELEV + m.plus * 0.5)], h * 3);
                    frame.set(FRAME(idx), h * 4);
                    rot[h] = m.rot;
                    rnd[h] = 0.5 + rand() * 0.5;
                    tint[h] = Math.min(1, Math.max(0, m.tint));
                    h++;
                }
            }
        geo.setAttribute('a_base', new THREE.InstancedBufferAttribute(base, 3));
        geo.setAttribute('a_map_frame', new THREE.InstancedBufferAttribute(frame, 4));
        geo.setAttribute('a_map_rotation', new THREE.InstancedBufferAttribute(rot, 1));
        geo.setAttribute('a_rand_offset', new THREE.InstancedBufferAttribute(rnd, 1));
        geo.setAttribute('a_color_amount', new THREE.InstancedBufferAttribute(tint, 1));
        this.tileMat = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuseCombined: { value: a.tex.field },
                tNoise: { value: a.tex.clouds },
                uPointLight: { value: this.light },
                uTime: { value: 0 },
                uGrow: { value: 1 },
                uGrid: { value: new THREE.Vector2(COLS * TILE, ROWS * TILE) },
                uResolution: { value: this.res },
                uResolutionTex: { value: 1024 },
            },
            vertexShader: tileVert,
            fragmentShader: tileFrag,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        const tiles = new THREE.Mesh(geo, this.tileMat);
        tiles.frustumCulled = false;
        this.field.add(tiles);
        // the field lies flat under the camera (plots in x/y, layers rise toward the camera)
        this.field.rotation.x = -0.12;
        this.scene.add(this.field);

        // drifting fluff above the field, between it and the camera
        this.seeds = motes(36, new THREE.Box3(new THREE.Vector3(-9, -6, 6), new THREE.Vector3(9, 6, 15)), new THREE.Color(0.5, 0.55, 0.4), [60, 180]);
        (this.seeds.material as THREE.ShaderMaterial).uniforms.uDrift.value.set(0.12, 0.05, 0);
        this.scene.add(this.seeds);
    }

    update(ctx: FrameCtx) {
        const { time, dt, ptr, local, dwell } = ctx;
        this.updateFx(ctx);
        this.tileMat.uniforms.uTime.value = 0.02 * time;
        this.groundMat.uniforms.uTime.value = 0.02 * time;
        // the camera drifts across the field and pans along it with the scroll (arriving, the in-chapter
        // segment, leaving: one continuous pan); the pointer tilts it
        const pan = local * 3 + dwell * 2.6;
        this.pivot.set(time * 0.03 + dwell * 0.8, pan, 0);
        this.yaw = damp(this.yaw, ptr.x * TILT.yaw * 0.75 + dwell * 0.06, 4, dt);
        this.pitch = damp(this.pitch, ptr.y * TILT.pitch * 0.75 - local * 0.32 - dwell * 0.14, 4, dt);
        // plot pitch ≈ 107 px on screen at 1920 (reference 46 s)
        this.orbit(this.pivot, 14 - dwell * 1.2, this.yaw, this.pitch);
        (this.seeds.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
        this.seeds.position.set(this.pivot.x, this.pivot.y, 0);
        // reference: bottom blur climbs as the stop leaves (progress 0.77 → 0.97), radius 2.5 → 0.625
        // (unclamped, as in the reference: well below zero at rest, so nothing is blurred there)
        const progress = 0.5 + 0.5 * local;
        this.comp.uniforms.blurBottom.value = (progress - 0.77) / 0.2;
        this.blur.uniforms.uRadius.value = THREE.MathUtils.lerp(2.5, 0.625, THREE.MathUtils.clamp((progress - 0.65) / 0.15, 0, 1)) * 2.2;
        // the reference's fake sun is set up off the right edge but its props zero it (the field reads
        // dark); here it follows the pointer, low and soft, so the crop catches light where you look
        const k = 1 - Math.exp(-3 * dt);
        this.light.x += ((0.5 + ptr.x * 0.5) * this.res.x - this.light.x) * k;
        this.light.y += ((0.5 - ptr.y * 0.5) * this.res.y - this.light.y) * k;
        this.light.z = ctx.ptrActive ? 0.05 : 0.0;
    }

    render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget) {
        // 0.75 of the target: the leaf layers are soft and mip-mapped, the overdraw (5–7 layers) is not.
        // One buffer set per target size (full and transition targets), so switching never reallocates.
        const W = Math.max(1, Math.round(target.width * 0.75));
        const H = Math.max(1, Math.round(target.height * 0.75));
        const key = `${W}x${H}`;
        let set = this.sets.get(key);
        if (!set) {
            const opts = { type: THREE.HalfFloatType, depthBuffer: false };
            set = {
                scene: new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }),
                a: new THREE.WebGLRenderTarget(Math.max(1, W >> 2), Math.max(1, H >> 2), opts),
                b: new THREE.WebGLRenderTarget(Math.max(1, W >> 2), Math.max(1, H >> 2), opts),
            };
            this.sets.set(key, set);
        }
        [this.rtScene, this.rtA, this.rtB] = [set.scene, set.a, set.b];
        this.res.set(W, H);
        renderer.setRenderTarget(this.rtScene);
        renderer.setClearColor(0x000000, 1);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        // two blur passes at quarter size
        let src: THREE.WebGLRenderTarget = this.rtScene;
        for (const dst of [this.rtA, this.rtB]) {
            this.blur.uniforms.tSrc.value = src.texture;
            this.blur.uniforms.uTexel.value.set(1 / dst.width, 1 / dst.height);
            renderer.setRenderTarget(dst);
            renderer.render(this.blur.scene, this.postCam);
            src = dst;
        }
        this.comp.uniforms.tMap.value = this.rtScene.texture;
        this.comp.uniforms.tBlur.value = this.rtB.texture;
        renderer.setRenderTarget(target);
        renderer.render(this.comp.scene, this.postCam);
        return true;
    }

    resize(w: number, h: number) {
        super.resize(w, h);
        this.sets.forEach((set) => [set.scene, set.a, set.b].forEach((rt) => rt.dispose()));
        this.sets.clear();
    }

    dispose() {
        super.dispose();
        this.sets.forEach((set) => [set.scene, set.a, set.b].forEach((rt) => rt.dispose()));
        this.sets.clear();
        [this.blur, this.comp].forEach((p) => {
            p.mesh.geometry.dispose();
            (p.mesh.material as THREE.Material).dispose();
        });
    }
}
