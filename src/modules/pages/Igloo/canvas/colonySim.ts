import * as THREE from 'three';
import { GPUComputationRenderer, type Variable } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

import { SNOISE } from '../utils/glsl';

import type { Shape } from './shapes';

/**
 * GPGPU particle physics for the colony figure.
 *
 * tPos.xyz  position        tPos.w  energy (copied from tVel.w for rendering)
 * tVel.xyz  velocity        tVel.w  energy (0 calm → 1+ excited)
 *
 * Every particle is spring-bound to a "home" on the current shape. Home
 * itself idles (breathing wave + slow drift). Cursor motion couples nearby
 * particles to the cursor's velocity, which raises their energy; energy
 * loosens the spring and feeds curl-ish turbulence, so faster gestures create
 * bigger, more chaotic sheets that glow and then slowly settle back.
 */

const COMMON = /* glsl */ `
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform sampler2D tCloud;
uniform float uMorph;
uniform float uForm;
uniform float uTime;
uniform float uDt;
uniform float uIdleAmp;
uniform float uIdleFreq;
uniform float uIdleSpeed;
uniform float uJitter;
uniform float uBreathe;
uniform float uPlume;
${SNOISE}
vec3 noise3(vec3 p) { return vec3(snoise(p), snoise(p + vec3(17.1, 3.3, 9.7)), snoise(p + vec3(-5.2, 31.4, 13.9))); }

// staggered morph progress per particle
float morphOf(float rnd) { return smoothstep(rnd * 0.45, rnd * 0.45 + 0.55, uMorph); }

vec3 homeOf(vec2 uv, out float rnd, out float m) {
    vec4 A = texture2D(tFrom, uv);
    vec4 B = texture2D(tTo, uv);
    rnd = A.w;
    m = morphOf(rnd);
    vec3 h = mix(A.xyz, B.xyz, m);
    vec3 c = h - vec3(0.0, 1.2, 0.0);
    // idle: every particle wanders inside a small range around its home.
    // The field is sampled at the home's own xyz, so neighbours move together
    // (a slow liquid ripple over the surface) …
    float it = uTime * uIdleSpeed;
    h += noise3(h * uIdleFreq + vec3(0.0, it, it * 0.7)) * uIdleAmp;
    // … plus a faster, uncorrelated jitter per particle so the surface shimmers
    h += noise3(vec3(rnd * 97.0, it * 2.3, rnd * 13.0)) * uJitter;
    // and a breathing wave that climbs the figure
    h += normalize(c + 1e-4) * sin(uTime * 1.6 - h.y * 3.2 + rnd * 0.6) * uBreathe;
    // mid-morph, homes travel along swirling plumes instead of cutting straight through
    float mid = sin(m * 3.14159);
    h += (noise3(h * 0.55 + vec3(rnd * 3.0, uTime * 0.25, 0.0)) + vec3(0.0, 0.5, 0.0) * rnd + normalize(c + 1e-4) * 0.43) * mid * uPlume;
    // scroll: gather out of the cloud
    float f = smoothstep(rnd * 0.5, rnd * 0.5 + 0.5, uForm);
    return mix(texture2D(tCloud, uv).xyz, h, f);
}
`;

const velocityShader = /* glsl */ `
${COMMON}
uniform vec3 uRayO;
uniform vec3 uRayD;
uniform vec3 uMouseVel;
uniform float uMouseSpeed;
uniform float uRadius;
uniform float uAccel;
uniform float uIdle;
uniform float uBurst;
uniform float uShock;
uniform float uSpring;
uniform float uLoose;
uniform float uDamping;
uniform float uChaos;
uniform float uDrag;
uniform float uAccelChaos;
uniform float uDecay;
uniform vec3 uShockO;
uniform vec3 uShockD;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 P = texture2D(tPos, uv);
    vec4 V = texture2D(tVel, uv);
    float rnd; float m;
    vec3 home = homeOf(uv, rnd, m);
    float e = clamp(V.w, 0.0, 1.5);
    vec3 c = P.xyz - vec3(0.0, 1.2, 0.0);

    // spring home — loosens as energy rises and while bursting
    float k = mix(uSpring, uLoose, clamp(e, 0.0, 1.0)) * (1.0 - 0.85 * clamp(uBurst, 0.0, 1.0));
    vec3 acc = (home - P.xyz) * k;
    acc -= V.xyz * mix(uDamping, uDamping * 0.27, clamp(e, 0.0, 1.0));

    // turbulence grows with energy → chaos follows the gesture
    acc += noise3(P.xyz * 1.3 + vec3(0.0, uTime * 0.4, 0.0)) * (e * e * 7.0 + e * 3.0) * uChaos;

    // cursor: particles near the cursor ray are dragged with the cursor
    vec3 v = P.xyz - uRayO;
    vec3 perp = v - uRayD * dot(v, uRayD);
    float d2 = dot(perp, perp);
    float fall = exp(-d2 / (uRadius * uRadius)) * (0.6 + rnd * 0.8);
    acc += (uMouseVel * 1.15 - V.xyz) * fall * uDrag;
    acc += normalize(perp + 1e-4) * fall * uMouseSpeed * 1.5;
    // sudden jerks of the cursor (acceleration) whip up extra turbulence in the wake
    acc += noise3(P.xyz * 2.2 + uTime) * fall * min(uAccel, 120.0) * uAccelChaos;

    // idle wisps: an invisible breeze orbits the figure while the cursor rests
    float gt = uTime * 0.55;
    vec3 gp = vec3(cos(gt) * 0.95, 1.25 + sin(gt * 0.63) * 0.95, sin(gt) * 0.75);
    vec3 gv = vec3(-sin(gt) * 0.95, cos(gt * 0.63) * 0.6, cos(gt) * 0.75) * 0.55;
    vec3 gd = P.xyz - gp;
    float gfall = exp(-dot(gd, gd) / 0.07) * uIdle;
    acc += (gv * 3.0 + noise3(P.xyz * 3.0 + uTime) * 1.5 - V.xyz) * gfall * 4.0;

    // click shockwave
    vec3 sv = P.xyz - uShockO;
    vec3 sp = sv - uShockD * dot(sv, uShockD);
    float sf = exp(-dot(sp, sp) / 0.9);
    acc += (normalize(sp + 1e-4) * 34.0 + noise3(P.xyz * 2.0) * 18.0) * sf * uShock;

    // shape change: vortex explosion, strongest mid-transition
    float mid = sin(m * 3.14159);
    vec3 swirl = cross(vec3(0.0, 1.0, 0.0), c) * 3.4 + c * 1.1 + vec3(0.0, 0.9, 0.0);
    acc += (noise3(P.xyz * 0.8 + uTime * 0.6) * 7.5 + swirl) * uBurst * (0.45 + rnd);

    // soft containment: nothing escapes the glass enclosure
    float out_ = max(length(c * vec3(1.0, 0.75, 1.0)) - 2.6, 0.0);
    acc -= normalize(c + 1e-4) * out_ * out_ * 30.0;
    // the pedestal top is a floor
    acc.y += max(0.24 - P.xyz.y, 0.0) * 90.0;

    vec3 vel = V.xyz + acc * uDt;
    float sp2 = length(vel);
    if (sp2 > 14.0) vel *= 14.0 / sp2;

    // energy is injected only by outside causes (cursor wake, shockwave, shape
    // change) — never by the turbulence it drives — then fades into a glow trail
    float inject = fall * clamp(uMouseSpeed * 0.28, 0.0, 1.3)
        + sf * uShock * 1.3
        + fall * clamp(uAccel * 0.012, 0.0, 0.6)
        + gfall * 0.45
        + uBurst * (0.35 + rnd * 0.7)
        + clamp((sp2 - 2.2) * 0.25, 0.0, 0.6);
    e = max(e - uDt * uDecay, min(inject, 1.4));
    gl_FragColor = vec4(vel, e);
}
`;

const positionShader = /* glsl */ `
uniform float uDt;
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 P = texture2D(tPos, uv);
    vec4 V = texture2D(tVel, uv);
    P.xyz += V.xyz * uDt;
    P.w = V.w;
    gl_FragColor = P;
}
`;

const toTexture = (data: Float32Array, size: number) => {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    t.needsUpdate = true;
    return t;
};

export type ShapeTextures = { pos: THREE.DataTexture; nrm: THREE.DataTexture };

export class ColonySim {
    readonly size: number;
    readonly gpu: GPUComputationRenderer;
    readonly posVar: Variable;
    readonly velVar: Variable;
    readonly textures: Record<string, ShapeTextures>;

    constructor(gl: THREE.WebGLRenderer, size: number, shapes: Record<string, Shape>) {
        this.size = size;
        this.textures = Object.fromEntries(Object.entries(shapes).map(([key, s]) => [key, { pos: toTexture(s.pos, size), nrm: toTexture(s.nrm, size) }]));
        const gpu = new GPUComputationRenderer(size, size, gl);
        const pos0 = gpu.createTexture();
        (pos0.image.data as Float32Array).set(shapes.cloud.pos);
        for (let i = 3; i < size * size * 4; i += 4) (pos0.image.data as Float32Array)[i] = 0;
        const vel0 = gpu.createTexture();

        this.posVar = gpu.addVariable('tPos', positionShader, pos0);
        this.velVar = gpu.addVariable('tVel', velocityShader, vel0);
        gpu.setVariableDependencies(this.posVar, [this.posVar, this.velVar]);
        gpu.setVariableDependencies(this.velVar, [this.posVar, this.velVar]);

        this.posVar.material.uniforms.uDt = { value: 1 / 60 };
        Object.assign(this.velVar.material.uniforms, {
            tFrom: { value: this.textures.penguin.pos },
            tTo: { value: this.textures.penguin.pos },
            tCloud: { value: this.textures.cloud.pos },
            uMorph: { value: 1 },
            uForm: { value: 0 },
            uTime: { value: 0 },
            uDt: { value: 1 / 60 },
            uRayO: { value: new THREE.Vector3(0, -99, 0) },
            uRayD: { value: new THREE.Vector3(0, 0, -1) },
            uMouseVel: { value: new THREE.Vector3() },
            uMouseSpeed: { value: 0 },
            uRadius: { value: 0.4 },
            uAccel: { value: 0 },
            uIdleAmp: { value: 0.045 },
            uIdleFreq: { value: 1.4 },
            uIdleSpeed: { value: 0.35 },
            uJitter: { value: 0.012 },
            uBreathe: { value: 0.012 },
            uPlume: { value: 0.7 },
            uSpring: { value: 26 },
            uLoose: { value: 2.8 },
            uDamping: { value: 7 },
            uChaos: { value: 1 },
            uDrag: { value: 6.5 },
            uAccelChaos: { value: 0.12 },
            uDecay: { value: 0.45 },
            uIdle: { value: 0 },
            uBurst: { value: 0 },
            uShock: { value: 0 },
            uShockO: { value: new THREE.Vector3(0, -99, 0) },
            uShockD: { value: new THREE.Vector3(0, 0, -1) },
        });

        const err = gpu.init();
        if (err) console.error('[igloo] colony sim:', err);
        this.gpu = gpu;
    }

    get uniforms() {
        return this.velVar.material.uniforms;
    }

    step(dt: number) {
        this.velVar.material.uniforms.uDt.value = dt;
        this.posVar.material.uniforms.uDt.value = dt;
        this.gpu.compute();
    }

    get position() {
        return this.gpu.getCurrentRenderTarget(this.posVar).texture;
    }

    dispose() {
        this.gpu.dispose();
        Object.values(this.textures).forEach((t) => {
            t.pos.dispose();
            t.nrm.dispose();
        });
    }
}
