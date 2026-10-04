import * as THREE from 'three';

/**
 * Bokeh particles as the reference builds them (bundle: `ParticlesParticlesMaterial` + `ParticlesArea`):
 * each point is a soft polygon (pentagon by default) whose size and softness come from its distance
 * to a focus point measured in clip space, so the field racks focus. The focus follows the pointer
 * (`DofController`), and widens while the pointer is over the page. Additive, no depth test.
 */

/** Ashima simplex noise, 3D → float in −1..1 (same function the reference inlines). */
export const SNOISE3 = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}`;

/** Additive, unsorted, no depth: every particle layer in the reference is drawn this way. */
export const ADDITIVE = { transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending } as const;

/**
 * Focus point that follows the pointer (reference `DofController`): x/y span `width`/`height` clip
 * units, z sits at −2; the far edge of the focus band opens from `farMin` to `farMax` while the
 * pointer is on the page. Eased 5 % a frame at 60 fps in the reference (λ ≈ 3).
 */
export class DofController {
    readonly focus = new THREE.Vector3();
    readonly amount = new THREE.Vector2(4, 15);
    private target = new THREE.Vector3();
    private far = 15;

    constructor(public o = { width: 20, height: 12, farMin: 20, farMax: 40 }) {
        this.far = o.farMin;
        this.amount.y = this.far;
    }

    update(ptr: THREE.Vector2, active: boolean, dt: number) {
        const k = 1 - Math.exp(-3.08 * dt);
        this.target.set((ptr.x * this.o.width) / 2, (ptr.y * this.o.height) / 2, -2);
        this.focus.lerp(this.target, k);
        this.far += ((active ? this.o.farMax : this.o.farMin) - this.far) * k;
        this.amount.y = this.far;
    }
}

export type PolyOpts = {
    color?: THREE.ColorRepresentation;
    opacity?: number;
    /** Point size in px at a 800 px tall view: [in focus, out of focus]. */
    size?: [number, number];
    /** 0 = circle, 5 = pentagon. */
    sides?: number;
    dof: DofController;
    /** Clip-space drift from simplex noise. */
    noise?: boolean;
    /** Draw window along the per-point `t` attribute (threads that draw on). */
    progress?: boolean;
};

/** Shared per-frame uniforms: time (reference adds 0.01 a frame), viewport height and pixel ratio. */
export type PolyUniforms = {
    time: THREE.IUniform<number>;
    resolution: THREE.IUniform<THREE.Vector2>;
    uDpr: THREE.IUniform<number>;
};

export function polyMaterial(o: PolyOpts) {
    const uniforms = {
        progress: { value: new THREE.Vector2(0, 1) },
        shapeSides: { value: o.sides ?? 5 },
        size: { value: new THREE.Vector2(...(o.size ?? [10, 35])) },
        color: { value: new THREE.Color(o.color ?? '#333333') },
        opacity: { value: o.opacity ?? 1 },
        time: { value: 0 },
        dofAmount: { value: o.dof.amount },
        dofFocus: { value: o.dof.focus },
        resolution: { value: new THREE.Vector2(1920, 994) },
        uDpr: { value: 1 },
        uFade: { value: 1 },
    };
    const defines: Record<string, string> = {};
    if (o.noise) defines.NOISE = '';
    if (o.progress) defines.PROGRESS = '';
    return new THREE.ShaderMaterial({
        defines,
        uniforms,
        vertexShader: /* glsl */ `
            attribute float id;
            attribute float t;
            attribute float aOffset;
            uniform float time;
            uniform vec2 size;
            uniform vec2 dofAmount;
            uniform vec3 dofFocus;
            uniform vec2 resolution;
            uniform float uDpr, opacity, uFade;
            varying float vId;
            varying float vSize;
            varying float vT;
            #ifdef NOISE
            ${SNOISE3}
            #endif
            void main() {
                vId = id;
                vec4 transformed = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                #ifdef NOISE
                transformed += (snoise((transformed.xyz + time / 40.0) / 15.0) - 0.5) * 1.0;
                #endif
                vSize = smoothstep(dofAmount.x, dofAmount.y, distance(transformed.xyz, dofFocus));
                vT = t - aOffset;
                gl_Position = transformed;
                float scale = resolution.y / 800.0 + (sin(id * 17.726283) + sin(id * 7153.13)) * 0.05;
                gl_PointSize = mix(size.x * scale, size.y * scale, vSize) * uDpr;
                // big soft sprites cost the most and show the least: skip any that cannot reach 0.4 %
                float random = id * 5.193628 + id;
                float timeOpacity = mix(0.1, 1.0, sin((time * clamp(random, 1.0, 5.0) + random * 6.2831853) / 200.0) * 0.5 + 0.5);
                float peak = mix(1.0, 0.4, smoothstep(0.0, 0.2, vSize)) * opacity * timeOpacity * uFade;
                if (pow(max(peak, 0.0), 2.2) < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            #define PI 3.14159265359
            #define TWO_PI 6.28318530718
            uniform vec2 progress;
            uniform float shapeSides;
            uniform vec3 color;
            uniform float opacity, uFade;
            uniform float time;
            varying float vId;
            varying float vSize;
            varying float vT;
            float polygonDf(vec2 st, float N) {
                if (N == 0.0) return distance(st, vec2(0.5)) * 2.0;
                st = st * 2.0 - 1.0;
                float a = atan(st.x, st.y) + PI * 0.5;
                float r = TWO_PI / N;
                return cos(floor(0.5 + a / r) * r - a) * length(st);
            }
            void main() {
                float random = vId * 5.193628 + vId;
                vec2 uv = gl_PointCoord;
                float shapeAlpha = smoothstep(0.5, 0.5 - mix(0.05, 0.3, vSize), polygonDf(uv, shapeSides));
                float distanceAlpha = mix(1.0, 0.4, smoothstep(0.0, 0.2, vSize));
                float timeOpacity = mix(0.1, 1.0, sin((time * clamp(random, 1.0, 5.0) + random * TWO_PI) / 200.0) * 0.5 + 0.5);
                #ifdef PROGRESS
                float progressAlpha = step(progress.x, vT) * step(vT, progress.y);
                vec3 progressColor = vec3(0.2) * smoothstep(progress.x + 0.3, progress.x, vT);
                float endFade = smoothstep(0.05, 0.15, vT);
                #else
                float progressAlpha = 1.0;
                vec3 progressColor = vec3(0.0);
                float endFade = 1.0;
                #endif
                // the reference adds in display space; this pipeline adds in linear light, so the
                // weight is raised to 2.2 to keep faint bokeh as faint as it reads there
                float a = shapeAlpha * distanceAlpha * opacity * timeOpacity * progressAlpha * endFade * uFade;
                gl_FragColor = vec4(color * distanceAlpha + progressColor, pow(max(a, 0.0), 2.2));
            }`,
        ...ADDITIVE,
    });
}

/** One bokeh "area" from the reference's scene presets (editor values: rotations in radians). */
export type AreaPreset = {
    pX?: number;
    pY?: number;
    pZ?: number;
    s?: number;
    rX?: number;
    rY?: number;
    rZ?: number;
    color: string;
    o: number;
    particleSizeMin: number;
    particleSizeMax: number;
    radius?: number;
};

/** Seeded random so every visitor sees the designed composition. */
export function rng(seed: number) {
    let s = seed >>> 0 || 1;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * A spiral cloud of `count` points (reference `ParticlesArea.setRadius`): point i sits at fraction
 * f ≈ i / count along a flat spiral (x = r·f·sin 100f, y = 2r·f·cos 100f) with a pseudo-random depth.
 */
export function particleArea(p: AreaPreset, dof: DofController, count = 200, seed = 1, opts: { noise?: boolean; sides?: number } = {}) {
    const rand = rng(seed);
    const r = p.radius ?? 3;
    const pos = new Float32Array(count * 3);
    const ids = new Float32Array(count);
    for (let e = 0; e < count; e++) {
        const n = 1 / count;
        const i = e * n + (rand() * 1.5 - 0.75) * n;
        const a = 100 * i;
        pos.set([r * i * Math.sin(a), 2 * r * i * Math.cos(a), r * Math.sin(9873986723 * i)], e * 3);
        ids[e] = e;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('id', new THREE.BufferAttribute(ids, 1));
    g.setAttribute('t', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aOffset', new THREE.BufferAttribute(new Float32Array(count), 1));
    const mat = polyMaterial({ color: p.color, opacity: p.o, size: [p.particleSizeMin, p.particleSizeMax], dof, noise: opts.noise ?? true, sides: opts.sides });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    pts.position.set(p.pX ?? 0, p.pY ?? 0, p.pZ ?? 0);
    pts.scale.setScalar(p.s ?? 1);
    pts.rotation.set(p.rX ?? 0, p.rY ?? 0, p.rZ ?? 0);
    return pts;
}

/** Fade every particle material under `root` (materials that have a `uFade` uniform). */
export function setFade(root: THREE.Object3D, v: number) {
    root.traverse((o) => {
        const m = (o as THREE.Points).material as THREE.ShaderMaterial | undefined;
        if (m?.uniforms?.uFade) m.uniforms.uFade.value = v;
    });
    root.visible = v > 0.001;
}

/** Push time / viewport into every polygon-particle material under `root`. */
export function tickPoly(root: THREE.Object3D, time: number, h: number, dpr: number) {
    root.traverse((o) => {
        const m = (o as THREE.Points).material as THREE.ShaderMaterial | undefined;
        if (!m || !m.uniforms?.shapeSides) return;
        m.uniforms.time.value = time;
        m.uniforms.resolution.value.set(m.uniforms.resolution.value.x, h);
        m.uniforms.uDpr.value = dpr;
    });
}

/** A hex colour's display values as they are (no sRGB → linear conversion), for shaders that do the
 * reference's maths in display space and convert at the end. */
export const raw = (hex: string) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);

/**
 * The reference's background card (`BackgroundMaterial`): a base colour plus two soft accent glows
 * (radius 0.6 of the screen) placed in uv space, dithered so the gradients never band.
 */
export function accentBackdropMaterial(base: string, a1: string, a2: string, p1: [number, number] = [0.2, 0.2], p2: [number, number] = [0.8, 0.8]) {
    return new THREE.ShaderMaterial({
        uniforms: {
            baseColor: { value: raw(base) },
            accentColor1: { value: raw(a1) },
            accentColor2: { value: raw(a2) },
            accent1Position: { value: new THREE.Vector2(...p1) },
            accent2Position: { value: new THREE.Vector2(...p2) },
            opacity: { value: 1 },
            uShift: { value: new THREE.Vector2() },
            uScale: { value: 1 },
            /** The card ends above the bottom of the screen: fade to black from y0 to y1 (uv). */
            uFloor: { value: new THREE.Vector2(-1, 0) },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
        fragmentShader: /* glsl */ `
            uniform vec3 baseColor, accentColor1, accentColor2;
            uniform vec2 accent1Position, accent2Position, uShift, uFloor;
            uniform float opacity, uScale;
            varying vec2 vUv;
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            void main() {
                vec2 uv = (vUv - 0.5) / uScale + 0.5 + uShift;
                vec3 color = baseColor;
                color += 0.4 * accentColor1 * (1.0 - smoothstep(0.0, 0.6, distance(uv + random(vUv) * 0.05, accent1Position)));
                color += 0.4 * accentColor2 * (1.0 - smoothstep(0.0, 0.6, distance(uv + random(vUv) * 0.05, accent2Position)));
                color *= smoothstep(uFloor.x, uFloor.y, vUv.y);
                // the reference colours are display (sRGB) values; the world targets are linear
                gl_FragColor = vec4(pow(color, vec3(2.2)) * opacity, 1.0);
            }`,
        depthTest: false,
        depthWrite: false,
    });
}
