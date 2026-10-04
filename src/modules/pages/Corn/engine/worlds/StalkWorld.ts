import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

import type { Assets } from '../assets';

import { motes } from './shared';
import { clamp01, type FrameCtx, World } from './World';

/**
 * Outside: the reference's "testing" scene, rebuilt from its bundle. A young stalk stands sharp in
 * front (`stalk_rigged3`, 4 skinned leaf layers) while a small field of rigged plants
 * (`SingleStalk12_db`, 7 + 9 clones) sways behind it on spring-driven bones, with rows of billboard
 * plants (`bg_corn`, a 4 × 2 sheet) towards a sky card (`bg`). Everything behind the front stalk goes
 * through a depth-of-field chain (3 rotated-disk passes, radius from the depth buffer), then the
 * stalk is drawn on top, unblurred.
 *
 * Conditions (the "Experience the tests" mode) blend scene presets: storm (wind, rain, lightning,
 * puddles), drought (dead leaves, lens flare), disease (spots, haze), soil (the ground cycles through
 * four soils, energy runs up the stalk), density (plants close up, wider lens).
 */

export const CONDITIONS = ['normal', 'storm', 'drought', 'disease', 'soil', 'density'] as const;

/** Reference `sceneProps` (only the values that differ per condition are used). */
const PROPS = [
    { minBlur: 10, sunBrightness: 4.6, windPower: 0.1, plantSpacing: 50, zoom: 1, sunHeight: 3.6, sunColor: 0xffc06f },
    { minBlur: 6, sunBrightness: 1, windPower: 3, plantSpacing: 50, zoom: 1, sunHeight: 3.6, sunColor: 0xd1d0e3 },
    { minBlur: 6, sunBrightness: 6.6, windPower: 0.06, plantSpacing: 50, zoom: 1, sunHeight: 3.6, sunColor: 0xffc06f },
    { minBlur: 6, sunBrightness: 3.6, windPower: 0.04, plantSpacing: 50, zoom: 1, sunHeight: 3.6, sunColor: 0xffc06f },
    { minBlur: 6, sunBrightness: 4.6, windPower: 0.1, plantSpacing: 50, zoom: 1, sunHeight: 3.6, sunColor: 0xffc06f },
    { minBlur: 6, sunBrightness: 5.6, windPower: 0.06, plantSpacing: 30, zoom: 0.8, sunHeight: 3.6, sunColor: 0xffc06f },
];
const SUN_COLORS = PROPS.map((p) => new THREE.Color(p.sunColor));
const GRID = [7, 9];
const FAR_ROWS = [15, 15, 13, 13, 9, 9, 5, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
const UP = new THREE.Vector3(0, 1, 0);
const DRAG = 0.05;
const ELASTIC = 0.5;
/** The reference animates in frames; the simulation steps at 60 Hz. */
const STEP = 1 / 60;
const BLEND_S = 2.5;

type Joint = { bone: THREE.Bone; rot: THREE.Vector3; target: THREE.Vector3; speed: THREE.Vector3 };
type Plant = { root: THREE.Object3D; stem: Joint[]; leafs: Joint[][]; ix: number; iz: number };
type FarPlant = { ix: number; iz: number; rot: THREE.Vector3; speed: THREE.Vector3; pos: THREE.Vector3 };

const joint = (b: THREE.Bone): Joint => ({
    bone: b,
    rot: new THREE.Vector3(b.rotation.x, b.rotation.y, b.rotation.z),
    target: new THREE.Vector3(b.rotation.x, b.rotation.y, b.rotation.z),
    speed: new THREE.Vector3(),
});
const isStem = (o: THREE.Object3D | null) => !!o && o.name.slice(0, 4).toLowerCase() === 'stem';

/** Reference `traverseBones`: stem bones in one list, each leaf (a chain hanging off a stem) in its own. */
function collectBones(root: THREE.Bone, stem: Joint[], leafs: Joint[][]) {
    stem.push(joint(root));
    const walk = (b: THREE.Object3D) => {
        for (const c of b.children) {
            if (!(c as THREE.Bone).isBone) continue;
            if (isStem(c)) stem.push(joint(c as THREE.Bone));
            else if (isStem(c.parent)) leafs.push([joint(c as THREE.Bone)]);
            else leafs[leafs.length - 1]?.push(joint(c as THREE.Bone));
            walk(c);
        }
    };
    walk(root);
}

const findBone = (root: THREE.Object3D) => {
    let b: THREE.Bone | null = null;
    root.traverse((o) => {
        if (!b && (o as THREE.Bone).isBone && isStem(o)) b = o as THREE.Bone;
    });
    return b as unknown as THREE.Bone;
};

// ── shaders ─────────────────────────────────────────────────────────────────────

const quadVert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const DEPTH = /* glsl */ `
#include <packing>
uniform sampler2D tDepth;
uniform float cameraNear, cameraFar;
float readDepth(vec2 coord) {
    float z = texture2D(tDepth, coord).x;
    return viewZToOrthographicDepth(perspectiveDepthToViewZ(z, cameraNear, cameraFar), cameraNear, cameraFar);
}`;

/** Weather on the blurred layer (reference `postMaterial`: rainPost / droughtPost / diseasePost). */
const weatherFrag = /* glsl */ `
${DEPTH}
uniform sampler2D tDiffuse, rainTex, sunTex;
uniform float iTime, rainAmount, droughtAmount, diseaseAmount, lightning, sundepth;
varying vec2 vUv;
float map(float v, float a, float b, float c, float d) { return c + (v - a) * (d - c) / (b - a); }
vec3 rainPost(vec3 diffuse, float amount) {
    float depth = map(readDepth(vUv), 0.0, 0.1, 0.0, 1.0);
    vec2 rainUv = vUv * 2.0;
    rainUv.y += iTime * 0.006;
    rainUv.x -= iTime * 0.003 + cos(rainUv.y * 2.0 + iTime * 0.0025) * 0.3;
    vec2 rainUv2 = vUv * 4.5;
    rainUv2.y += iTime * 0.006;
    rainUv2.x -= iTime * 0.003 + sin(rainUv2.y * 2.0 + iTime * 0.005) * 0.2;
    float rain = texture2D(rainTex, rainUv2).r + texture2D(rainTex, rainUv).r;
    diffuse += (vec3(1.0) - diffuse) * rain * max(0.0, depth) * 0.4 * amount * (1.0 + min(2.0, lightning));
    diffuse += (vec3(0.6) - diffuse) * max(0.0, depth) * 0.1 * amount;
    float dist = distance(vec2(0.5), vUv) * 1.414213;
    diffuse *= mix(1.0, clamp((1.0 - dist) / 0.5, 0.8, 1.0), amount);
    return diffuse;
}
vec3 droughtPost(vec3 diffuse, float amount) {
    diffuse += texture2D(sunTex, vUv - vec2(-0.5, 0.5)).rgb * 2.0 * (sin(iTime * 0.01) * 0.03 + 1.0) * amount * (1.0 + sundepth * 0.25);
    return diffuse * (1.0 + amount * 0.5);
}
vec3 diseasePost(vec3 diffuse, float amount) {
    float depth = max(0.0, readDepth(vUv) - 0.02) * 10.0;
    return diffuse + (vec3(0.16, 0.17, 0.14) - diffuse) * depth * 0.5 * amount;
}
void main() {
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    c = rainPost(c, rainAmount);
    c = droughtPost(c, droughtAmount);
    c = diseasePost(c, diseaseAmount);
    gl_FragColor = vec4(c, 1.0);
}`;

/** Rotated 8-tap disk whose radius grows with distance from the focus depth (reference blur passes). */
const blurFrag = (salt: string, k: string) => /* glsl */ `
${DEPTH}
uniform sampler2D tDiffuse;
uniform float radius, minBlur, focusPoint, iTime;
uniform vec2 iResolution;
varying vec2 vUv;
float hash12n(vec2 p) {
    p = fract(p * vec2(5.3987, 5.4421));
    p += dot(p.yx, p.xy + vec2(21.5351, 14.3137));
    return fract(p.x * p.y * 95.4307);
}
void main() {
    float depth = abs(focusPoint - readDepth(vUv));
    float r = (minBlur + radius * depth) * ${k};
    float da = 6.283 / 8.0;
    float a = da * hash12n(vUv + fract(iTime) + ${salt});
    vec3 sum = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        vec2 p = clamp(vUv + vec2(cos(a), sin(a)) / iResolution * r, 0.0, 1.0);
        vec3 s = texture2D(tDiffuse, p).rgb;
        sum += s * s;
        a += da;
    }
    gl_FragColor = vec4(sqrt(max(sum / 8.0, 0.0)), 1.0);
}`;

/** Skinned field plants: leaf atlas, dying into the dead atlas through a reveal noise, disease spots. */
const plantVert = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
varying float vLocalY;
void main() {
    vUv = uv;
    vLocalY = position.y;
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <beginnormal_vertex>
    #include <skinnormal_vertex>
    #include <skinning_vertex>
    vec4 wp = modelMatrix * vec4(transformed, 1.0);
    vWorld = wp.xyz;
    vN = normalize(mat3(modelMatrix) * objectNormal);
    gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const LIGHT = /* glsl */ `
uniform vec3 uSunDir, uSunColor, uBounce;
uniform float uSun, uAmbient, uLightning, uSwitch;
vec3 shade(vec3 albedo, vec3 n, vec3 world) {
    // thin leaves: light from either face, plus the sun shining through from behind (back-lit field)
    float ndl = abs(dot(n, uSunDir));
    float through = pow(max(0.0, -dot(normalize(cameraPosition - world), uSunDir)), 2.0);
    vec3 light = vec3(uAmbient) + uSunColor * uSun * (0.55 * ndl + 0.6 * through) + uBounce * max(0.0, -n.y) * 0.4;
    light += vec3(0.75, 0.8, 1.0) * uLightning * 0.08;
    // a light wave runs out across the field when a condition is picked (reference switchTime)
    float wave = max(0.0, (60.0 - abs(length(world.xz - vec2(0.0, 100.0)) - (uSwitch + 30.0) * 7.0 + 3.0))) / 60.0;
    return albedo * light + vec3(120.0, 160.0, 120.0) / 255.0 * wave;
}`;

const plantFrag = /* glsl */ `
uniform sampler2D map, revealMap, deathMap;
uniform float deathAmount, diseaseAmount;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
varying float vLocalY;
${LIGHT}
void main() {
    vec4 d = texture2D(map, vUv);
    if (d.a < 0.5) discard;
    float reveal = texture2D(revealMap, vUv).x;
    vec4 dead = texture2D(deathMap, vUv);
    float revealMapped = 1.0 - min(1.0, max(0.0, reveal - deathAmount) * 50.0);
    float mappedReveal = 1.0 - min(1.0, max(0.0, (reveal + vLocalY * 0.001) * 50.0 - diseaseAmount * 50.0));
    vec3 c = d.rgb + (dead.rgb - d.rgb) * clamp(revealMapped + mappedReveal, 0.0, 1.0);
    c *= 1.0 - mappedReveal * 0.85;
    gl_FragColor = vec4(shade(c, normalize(vN), vWorld) * vec3(0.72, 0.75, 0.78), 1.0);
}`;

/** Billboard plants: one of 8 silhouettes per instance, tinted by the weather. */
const farVert = /* glsl */ `
attribute float aId;
varying vec2 vUv;
void main() {
    float inImg = mod(aId, 8.0);
    float inRow = floor(inImg / 4.0);
    vUv = vec2(0.25 * (inImg - inRow * 4.0) + uv.x * 0.25, inRow * 0.5 + uv.y * 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const farFrag = /* glsl */ `
uniform sampler2D map;
uniform float rainAmount, deathAmount, diseaseAmount, soilAmount, uBright;
varying vec2 vUv;
void main() {
    vec4 col = texture2D(map, vUv);
    if (col.a < 0.1) discard;
    float g = (col.r + col.g + col.b) * 0.333;
    col.rgb = mix(col.rgb, col.rgb * (vec3(76.0, 94.0, 72.0) / 255.0 + vec3(0.0, 0.0, 0.17)), rainAmount);
    col.rgb = mix(col.rgb, vec3(g) * 4.0 * vec3(117.0, 113.0, 88.0) / 255.0, deathAmount);
    col.rgb = mix(col.rgb, col.rgb * vec3(102.0, 94.0, 64.0) / 255.0, diseaseAmount);
    col.rgb = mix(col.rgb, col.rgb * vec3(157.0, 142.0, 83.0) / 255.0, soilAmount);
    gl_FragColor = vec4(col.rgb * uBright, 1.0);
}`;

/** The ground (reference `floorMaterial`): four soils dissolving into each other, puddles, row shadows. */
const groundVert = /* glsl */ `
uniform sampler2D revealMap;
varying vec2 vUv;
void main() {
    vUv = uv;
    float h = texture2D(revealMap, vUv * 5.0).x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, position.z + h * 10.0 - 5.0, 1.0);
}`;
const groundFrag = /* glsl */ `
uniform sampler2D revealMap, map, map1, map2, map3, plantShadow;
uniform float inmap, soilAnim, sunAmount, intensity, puddleAmount, lightning, iTime, windSpeed, deathAmount;
varying vec2 vUv;
void main() {
    vec2 uv = vUv * 10.0;
    vec4 tex0 = texture2D(map, uv), tex1 = texture2D(map1, uv), tex2 = texture2D(map2, uv), tex3 = texture2D(map3, uv);
    float revealPix = texture2D(revealMap, uv * 0.5).x;
    float in1 = smoothstep(0.0, 1.0, (revealPix - min(1.0, inmap) * soilAnim) * 10.0);
    float in2 = smoothstep(0.0, 1.0, (revealPix - clamp(inmap - 1.0, 0.0, 1.0) * soilAnim) * 10.0);
    float in3 = smoothstep(0.0, 1.0, (revealPix - clamp(inmap - 2.0, 0.0, 1.0) * soilAnim) * 10.0);
    float in4 = smoothstep(0.0, 1.0, (revealPix - clamp(inmap - 3.0, 0.0, 1.0) * soilAnim) * 10.0);
    float inWater = smoothstep(0.0, 1.0, (texture2D(revealMap, uv).x - (1.0 - puddleAmount)) * 10.0);
    vec4 c = mix(tex0, tex1, 1.0 - in1);
    c = mix(c, tex2, 1.0 - in2);
    c = mix(c, tex3, 1.0 - in3);
    c = mix(c, tex0, 1.0 - in4);
    c *= 1.0 + soilAnim * 0.7;
    float plantShadowMul = pow(texture2D(plantShadow, uv * 6.0 + vec2(-0.5, 0.5)).r, 2.0);
    vec3 col = c.rgb * intensity * 0.8 * (1.0 + revealPix) * plantShadowMul;
    float wave = (sin(-iTime * 0.018 + uv.x * 100.0) * 0.5 + cos(-iTime * 0.02 + uv.y * 100.0 + uv.x * 100.0)) * 0.1;
    col = mix(col, vec3(67.0, 65.0, 50.0) / 255.0, 1.0 - smoothstep(0.6, 0.3, vUv.y));
    col += ((vec3(200.0, 215.0, 230.0) / 255.0) * (1.0 + wave) - col) * inWater * 0.2 * (1.0 + lightning * 0.2);
    col *= 1.0 + texture2D(plantShadow, uv * 6.0 + vec2(-0.5, 0.5)).b * lightning;
    col *= sunAmount + smoothstep(0.6, 0.3, vUv.y) * 0.8;
    gl_FragColor = vec4(col, 1.0);
}`;

/** The sharp front stalk: flat albedo, baked shading under sun, rain sheen, nutrient pulses. */
const fgVert = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vertPos;
void main() {
    vUv = uv;
    vertPos = position;
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <beginnormal_vertex>
    #include <skinnormal_vertex>
    #include <skinning_vertex>
    vec4 wp = modelMatrix * vec4(transformed, 1.0);
    vWorld = wp.xyz;
    vN = normalize(mat3(modelMatrix) * objectNormal);
    gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const fgFrag = /* glsl */ `
uniform sampler2D foregroundTexture, foregroundShadowTexture, foregroundScreenTexture, energyMask;
uniform float iTime, sunAmount, energyAmount;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vertPos;
${LIGHT}
void main() {
    vec4 frag = texture2D(foregroundTexture, vUv);
    if (frag.a < 0.35) discard;
    frag.rgb *= 1.0 + uLightning * 0.1;
    vec4 fragShadow = texture2D(foregroundShadowTexture, vUv);
    vec4 fragScreen = texture2D(foregroundScreenTexture, vUv);
    vec3 fragEnergy = texture2D(energyMask, vUv).rgb;
    float glowPow = max(0.0, sin(iTime * 0.01 + vertPos.z * 2.0) - 0.98) * 240.0 * fragEnergy.r;
    glowPow += max(0.0, sin(iTime * 0.007 + vertPos.z * 1.3) - 0.95) * 240.0 * fragEnergy.r;
    glowPow += max(0.0, sin(iTime * 0.006 + vertPos.z * 1.6) - 0.95) * 240.0 * fragEnergy.r;
    glowPow += max(0.0, sin(iTime * 0.009 + vertPos.z * 1.7) - 0.97) * 240.0 * fragEnergy.g;
    glowPow += max(0.0, sin(iTime * 0.010 + vertPos.z * 1.2) - 0.97) * 240.0 * fragEnergy.g;
    glowPow += max(0.0, sin(iTime * 0.010 + vertPos.z * 1.8) - 0.98) * 240.0 * fragEnergy.b;
    glowPow += max(0.0, sin(iTime * 0.007 + vertPos.z * 1.8) - 0.98) * 240.0 * fragEnergy.b;
    vec3 c = frag.rgb * (1.0 + vec3(144.0, 255.0, 180.0) / 255.0 * glowPow * energyAmount);
    float screenAdded = (fragScreen.r + fragScreen.g + fragScreen.b) * 0.2;
    screenAdded += smoothstep(0.2, 0.9, screenAdded);
    c += mix(vec3(screenAdded) * min(1.0 - sunAmount, 1.0), fragScreen.rgb, sunAmount * 0.4) * 0.6;
    c = mix(c, c * fragShadow.rgb, sunAmount * 0.5);
    float flat_ = (c.r + c.g + c.b) * 0.33333;
    c = mix(vec3(flat_) * vec3(0.5, 0.5, 0.7), c, 0.5 + sunAmount * 0.5);
    c *= 0.4 + sunAmount * 0.8;
    float flash = fragShadow.r + fragShadow.g + fragShadow.b;
    c = mix(c, c * flash, min(uLightning, 1.0));
    // the front stalk is lit nearly white (cool green, as in the reference), the sun only rims it
    vec3 n = normalize(vN);
    float ndl = abs(dot(n, uSunDir));
    float through = pow(max(0.0, -dot(normalize(cameraPosition - vWorld), uSunDir)), 2.0);
    vec3 light = vec3(0.78 + 0.5 * ndl) + uSunColor * uSun * 0.25 * through + vec3(0.75, 0.8, 1.0) * uLightning * 0.08;
    float wave = max(0.0, (30.0 - abs(length(vertPos.xy) - uSwitch * 7.0 + 30.0)) / 30.0);
    gl_FragColor = vec4(c * light * vec3(0.95, 1.05, 1.0) + vec3(120.0, 160.0, 120.0) / 255.0 * wave, 1.0);
}`;

function postPass(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader, uniforms, depthTest: false, depthWrite: false }));
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    return { scene, mesh, uniforms };
}

// ── world ───────────────────────────────────────────────────────────────────────

export class StalkWorld extends World {
    readonly camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
    /** Condition blend weights (normal, storm, drought, disease, soil, density). */
    readonly amounts = [1, 0, 0, 0, 0, 0];
    private from = [1, 0, 0, 0, 0, 0];
    private to = [1, 0, 0, 0, 0, 0];
    private blendT = 1;
    /** 0 = the chapter as told; 1 = the tests mode is open (sharper field, closer framing). */
    hotspot = 0;
    private fgScene = new THREE.Scene();
    private plants: Plant[] = [];
    private far: FarPlant[] = [];
    private farMesh: THREE.InstancedMesh;
    private fg: { root: THREE.Object3D; stem: Joint[]; leafs: Joint[][] };
    private plantMat: THREE.ShaderMaterial;
    private fgMat: THREE.ShaderMaterial;
    private farMat: THREE.ShaderMaterial;
    private groundMat: THREE.ShaderMaterial;
    private sky: THREE.Mesh;
    private pollen: THREE.Points;
    private light = {
        uSunDir: { value: new THREE.Vector3() },
        uSunColor: { value: new THREE.Color(0xffc06f) },
        uBounce: { value: new THREE.Color(58 / 255, 42 / 255, 20 / 255) },
        uSun: { value: 0.5 },
        uAmbient: { value: 0.3 },
        uLightning: { value: 0 },
        uSwitch: { value: 200 },
    };
    // simulation state
    private wind = Array.from({ length: 5 }, () => new THREE.Vector3());
    private windNow = new THREE.Vector3();
    private acc = 0;
    private ticker = 0;
    private simMs = 0;
    private wet = 0;
    private sick = 0.3;
    private death = 0;
    private sunAmt = 1;
    private inSoil = 0;
    private spacing = 50;
    private camX = 0;
    private camOffY = 0;
    private zoom = 1;
    private p = { minBlur: 10, sunBrightness: 4.6, windPower: 0.1, plantSpacing: 50, zoom: 1, sunHeight: 3.6, sunColor: new THREE.Color(0xffc06f) };
    // post
    private rtScene: THREE.WebGLRenderTarget;
    private rtA: THREE.WebGLRenderTarget;
    private rtB: THREE.WebGLRenderTarget;
    private weather;
    private blurs;
    private copy;
    private postCam = new THREE.Camera();
    private tmpV = new THREE.Vector3();
    private tmpB = new THREE.Vector3();
    private dummy = new THREE.Object3D();

    constructor(a: Assets) {
        super();
        const t = a.tex;
        for (const tex of [t.soil, t.soilClay, t.soilLoam, t.soilSand, t.revealMap, t.plantShadow, t.rain]) {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.needsUpdate = true;
        }

        // sky card far behind (reference: 1080 × 1920 plane × (3.5, 1.5) at z −1550, y 600)
        // (the decoded KTX images are stored bottom-up, as the reference sampled them: plain uvs fit)
        this.sky = new THREE.Mesh(new THREE.PlaneGeometry(1080, 1920), new THREE.MeshBasicMaterial({ map: t.stalkBg, color: 0xffffff, depthWrite: false }));
        this.sky.position.set(0, 600, -1550);
        this.sky.scale.set(3.5, 1.5, 1);
        this.scene.add(this.sky);

        // ground
        this.groundMat = new THREE.ShaderMaterial({
            uniforms: {
                inmap: { value: 0 },
                soilAnim: { value: 0 },
                iTime: { value: 0 },
                intensity: { value: 1 },
                lightning: { value: 0 },
                windSpeed: { value: 0 },
                sunAmount: { value: 0.77 },
                deathAmount: { value: 0 },
                puddleAmount: { value: 0 },
                revealMap: { value: t.revealMap },
                map: { value: t.soil },
                map1: { value: t.soilClay },
                map2: { value: t.soilLoam },
                map3: { value: t.soilSand },
                plantShadow: { value: t.plantShadow },
            },
            vertexShader: groundVert,
            fragmentShader: groundFrag,
            side: THREE.DoubleSide,
        });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 20, 20), this.groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -20, -200);
        this.scene.add(ground);

        // the field: 7 + 9 rigged plants, each a clone with its own skeleton
        this.plantMat = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: t.fieldPlant },
                revealMap: { value: t.fieldPlantReveal },
                deathMap: { value: t.fieldPlantDead },
                deathAmount: { value: 0 },
                diseaseAmount: { value: 0.3 },
                ...this.light,
            },
            vertexShader: plantVert,
            fragmentShader: plantFrag,
            side: THREE.DoubleSide,
        });
        const src = a.models.fieldPlant.scene;
        GRID.forEach((n, row) => {
            for (let i = 0; i < n; i++) {
                const root = cloneSkinned(src);
                root.traverse((o) => {
                    const m = o as THREE.SkinnedMesh;
                    if (!m.isMesh) return;
                    m.material = this.plantMat;
                    m.frustumCulled = false;
                });
                const container = new THREE.Object3D();
                container.position.set((i - 0.5 * (n - 1)) * 50, -20, -row * 50);
                container.add(root);
                this.scene.add(container);
                const bone = findBone(root);
                bone.rotation.y = this.plants.length; // every plant faces its own way
                const plant: Plant = { root: container, stem: [], leafs: [], ix: i, iz: row };
                collectBones(bone, plant.stem, plant.leafs);
                this.plants.push(plant);
            }
        });

        // billboard rows behind (reference `farPlants`): 180 × 360 cards standing on their base
        this.farMat = new THREE.ShaderMaterial({
            uniforms: { map: { value: t.bgCorn }, rainAmount: { value: 0 }, deathAmount: { value: 0 }, diseaseAmount: { value: 0 }, soilAmount: { value: 0 }, uBright: { value: 1 } },
            vertexShader: farVert,
            fragmentShader: farFrag,
            side: THREE.DoubleSide,
        });
        const total = FAR_ROWS.reduce((s, v) => s + v, 0);
        const farGeo = new THREE.PlaneGeometry(180, 360);
        farGeo.translate(0, 180, 0);
        const ids = new Float32Array(total).map((_, i) => i);
        farGeo.setAttribute('aId', new THREE.InstancedBufferAttribute(ids, 1));
        this.farMesh = new THREE.InstancedMesh(farGeo, this.farMat, total);
        this.farMesh.position.y = -30;
        this.farMesh.frustumCulled = false;
        FAR_ROWS.forEach((cnt, r) => {
            for (let s = 0; s < cnt; s++) this.far.push({ ix: s, iz: Math.random() * 10, rot: new THREE.Vector3(), speed: new THREE.Vector3(), pos: new THREE.Vector3(0, 0, r) });
        });
        this.scene.add(this.farMesh);

        // the sharp front stalk (reference: × 0.9, y −40, z 100, turned 90°)
        this.fgMat = new THREE.ShaderMaterial({
            uniforms: {
                foregroundTexture: { value: t.stalk },
                foregroundShadowTexture: { value: t.stalkShadow },
                foregroundScreenTexture: { value: t.stalkScreen },
                energyMask: { value: t.stalkEnergy },
                iTime: { value: 0 },
                sunAmount: { value: 0.77 },
                energyAmount: { value: 0 },
                ...this.light,
            },
            vertexShader: fgVert,
            fragmentShader: fgFrag,
            side: THREE.DoubleSide,
            alphaToCoverage: true,
        });
        const fgRoot = a.models.stalk.scene;
        fgRoot.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            m.material = this.fgMat;
            m.frustumCulled = false;
        });
        fgRoot.scale.setScalar(0.9);
        fgRoot.position.set(0, -40, 100);
        fgRoot.rotation.y = Math.PI / 2;
        this.fgScene.add(fgRoot);
        this.fg = { root: fgRoot, stem: [], leafs: [] };
        collectBones(findBone(fgRoot), this.fg.stem, this.fg.leafs);

        // pollen drifting through the light, in front of everything (soft, out of focus)
        this.pollen = motes(46, new THREE.Box3(new THREE.Vector3(-140, 40, 120), new THREE.Vector3(140, 300, 260)), new THREE.Color(0.55, 0.5, 0.3), [300, 1600]);
        (this.pollen.material as THREE.ShaderMaterial).uniforms.uDrift.value.set(3, 4, 0);
        this.fgScene.add(this.pollen);

        // post chain
        const depthTex = new THREE.DepthTexture(1, 1);
        depthTex.type = THREE.UnsignedIntType;
        this.rtScene = new THREE.WebGLRenderTarget(1, 1, { depthTexture: depthTex, depthBuffer: true, type: THREE.HalfFloatType });
        const opts: THREE.RenderTargetOptions = { depthBuffer: false, type: THREE.HalfFloatType };
        this.rtA = new THREE.WebGLRenderTarget(1, 1, opts);
        this.rtB = new THREE.WebGLRenderTarget(1, 1, opts);
        const depthU = () => ({ tDepth: { value: depthTex }, cameraNear: { value: this.camera.near }, cameraFar: { value: this.camera.far } });
        this.weather = postPass(weatherFrag, {
            ...depthU(),
            tDiffuse: { value: this.rtScene.texture },
            rainTex: { value: t.rain },
            sunTex: { value: t.flare },
            iTime: { value: 0 },
            rainAmount: { value: 0 },
            droughtAmount: { value: 0 },
            diseaseAmount: { value: 0 },
            lightning: { value: 0 },
            sundepth: { value: 0 },
        });
        this.blurs = [
            ['4.2', '2.0'],
            ['1.337', '1.41421'],
            ['0.0', '1.0'],
        ].map(([salt, k]) =>
            postPass(blurFrag(salt, k), {
                ...depthU(),
                tDiffuse: { value: null },
                radius: { value: 60 },
                minBlur: { value: 10 },
                focusPoint: { value: 0.02 },
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector2(1920, 994) },
            }),
        );
        this.copy = postPass(`uniform sampler2D tDiffuse; varying vec2 vUv; void main() { gl_FragColor = texture2D(tDiffuse, vUv); }`, { tDiffuse: { value: this.rtB.texture } });

        this.layoutFar();
        this.setLens(1);
    }

    /** Pick a condition (0 = normal … 5 = density); the scene blends there over 2.5 s. */
    setCondition(i: number) {
        const target = CONDITIONS.map((_, k) => (k === i ? 1 : 0));
        if (target.every((v, k) => v === this.to[k])) return;
        this.from = [...this.amounts];
        this.to = target;
        this.blendT = 0;
        this.light.uSwitch.value = 0;
        // reference onSwitchScene: kick the front stalk so it shivers into the new weather
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.fg.stem.forEach((j, n) => {
            j.speed.z += 0.8 * n * 1e-4 * dir;
            j.speed.x += 0.8 * n * 1e-4 * dir;
            j.speed.y += 4e-4 * n * dir;
        });
        this.fg.leafs.forEach((leaf) => leaf.forEach((j) => (j.speed.y -= 0.01)));
    }

    private setLens(zoom: number) {
        this.camera.setFocalLength(45 / zoom);
        this.camera.updateProjectionMatrix();
    }

    private layoutFar() {
        let k = 0;
        FAR_ROWS.forEach((cnt, r) => {
            for (let l = 0; l < cnt; l++) {
                const f = this.far[k++];
                f.pos.set(this.spacing * l - 0.5 * (cnt - 1) * this.spacing, 0, GRID.length * -this.spacing - r * this.spacing + (l % 2));
            }
        });
    }

    private blendProps(dt: number) {
        if (this.blendT < 1) {
            this.blendT = Math.min(1, this.blendT + dt / BLEND_S);
            const e = 0.5 - 0.5 * Math.cos(Math.PI * this.blendT); // Sine.easeInOut
            for (let k = 0; k < 6; k++) this.amounts[k] = this.from[k] + (this.to[k] - this.from[k]) * e;
        }
        const p = this.p;
        p.minBlur = p.sunBrightness = p.windPower = p.plantSpacing = p.zoom = p.sunHeight = 0;
        p.sunColor.setRGB(1, 1, 1);
        this.amounts.forEach((w, k) => {
            const s = PROPS[k];
            p.minBlur += s.minBlur * w;
            p.sunBrightness += s.sunBrightness * w;
            p.windPower += s.windPower * w;
            p.plantSpacing += s.plantSpacing * w;
            p.zoom += s.zoom * w;
            p.sunHeight += s.sunHeight * w;
            p.sunColor.lerp(SUN_COLORS[k], w);
        });
    }

    /** One 60 Hz step of the reference's per-frame simulation. */
    private step(n: number) {
        const am = this.amounts;
        this.ticker++;
        const tween = (v: number, to: number) => v + Math.max(-0.002, Math.min(0.002, 0.1 * (to - v)));
        this.wet = tween(this.wet, am[1]);
        this.sick = tween(this.sick, 0.3 + 0.3 * am[3]);
        this.death = tween(this.death, am[2] + 0.3 * am[3] + 0.3 * am[5]);
        this.sunAmt = tween(this.sunAmt, 1 - am[1]);
        this.inSoil = (this.inSoil + 0.01) % 4;
        this.spacing += 0.1 * (this.p.plantSpacing - this.spacing);
        this.light.uSwitch.value += 1;

        // wind: noise through a chain of leaky integrators (reference windDirection[0..4])
        const r = (Math.random() - 0.3) * -this.p.windPower * 3e-6;
        this.wind[0].set(0, 0.4 * r, r);
        for (let i = 1; i < this.wind.length; i++) this.wind[i].addScaledVector(this.wind[i - 1], 0.8).multiplyScalar(0.95);
        this.windNow.copy(this.wind[this.wind.length - 1]);
        const W = this.windNow;
        const v = this.tmpV;
        const Y = UP;
        const b = this.tmpB;

        // field plants
        this.plants.forEach((k, j) => {
            const n0 = k.stem.length;
            const yaw = k.stem[0].rot.y;
            let prev: Joint | null = null;
            k.stem.forEach((w, y) => {
                const A = y / n0;
                const M = y === 0 ? -1 : 1;
                v.copy(W).applyAxisAngle(Y, -yaw);
                const L = 0.3 * A + 0.5 * k.ix + Math.PI * n * 5e-4 + 0.3 * (A + 0.5 * k.ix) + Math.PI * n * 0.0005;
                const s = 0.2 * (Math.sin(0.01 * n * (1 + 0.0015 * v.length()) + L) + 1);
                w.speed.x += v.x * s * M * 0.5 * (1 + A);
                w.speed.y += v.y * s * M * 0.5 * (1 + A);
                w.speed.z += v.z * s * M * 0.25 * (1 + A);
                const D = 0.06 * Math.sin(y);
                b.set(2 * this.death * D, 7 * this.death * D, 2 * this.death * D);
                if (prev) w.speed.addScaledVector(prev.speed, 0.6);
                w.speed.set(
                    (w.target.x + b.x - w.rot.x) * DRAG + w.speed.x * ELASTIC,
                    (w.target.y + b.y - w.rot.y) * DRAG + w.speed.y * ELASTIC,
                    (w.target.z + b.z - w.rot.z) * DRAG + w.speed.z * ELASTIC,
                );
                w.rot.add(w.speed);
                w.bone.rotation.set(w.rot.x, w.rot.y, w.rot.z);
                prev = w;
            });
            k.leafs.forEach((S, O) => {
                const F = O / k.leafs.length;
                let up: Joint | null = null;
                S.forEach((T, y) => {
                    const A = y / S.length;
                    const M = y === 0 ? -1 : 1;
                    v.copy(W).applyAxisAngle(Y, -yaw);
                    const L = (A + 0.5 * k.ix) * Math.PI * n * 0.0025 - (Math.sin(0.001 * n) + 1) + (F + A + 0.5 * k.ix) * Math.PI * n * 0.001;
                    const s = 0.2 * (Math.sin(0.01 * n * (1 + 0.0015 * v.length()) + L) + 1);
                    T.speed.addScaledVector(v, -s * M * (1 - F) * (1 + A));
                    // dying leaves droop and curl, staggered per plant and per leaf
                    const z = clamp01(2 * (this.death - ((0.25 * j) % 1)));
                    const N = (Math.floor(10 * z + 0.3 * O + 0.2 * j) / 20 + 0.5 * z) * (0.25 + 0.75 * (1 - A)) * (Math.sin(0.5 * O + 0.4 * j) + 1) * 0.5;
                    b.set(0, 0, 0);
                    if (O === 0) b.y = 2 * N;
                    else if (O === 1) b.set(-N, -N, 0);
                    else if (O === 2) b.x = 2 * N;
                    else if (O === 3) b.set(-N, N, -N);
                    else if (O === 4) b.set(N, -N, 0);
                    else if (O === 5) b.set(-N, -N, N);
                    else if (O === 6) b.z = 2 * N;
                    else if (O === 7) b.x = -2 * N;
                    else if (O === 8) b.y = -2 * N;
                    else if (O === 9) b.set(N, N, 0);
                    if (up) T.speed.addScaledVector(up.speed, 0.9);
                    T.speed.set(
                        (T.target.x + b.x - T.rot.x) * DRAG + T.speed.x * ELASTIC,
                        (T.target.y + b.y - T.rot.y) * DRAG + T.speed.y * ELASTIC,
                        (T.target.z + b.z - T.rot.z) * DRAG + T.speed.z * ELASTIC,
                    );
                    T.rot.add(T.speed);
                    T.bone.rotation.set(T.rot.x, T.rot.y, T.rot.z);
                    up = T;
                });
            });
            // plants glide to the current spacing
            const row = GRID[k.iz];
            k.root.position.x += 0.1 * ((k.ix - 0.5 * (row - 1)) * this.spacing - k.root.position.x);
            k.root.position.z += 0.1 * (k.iz * -this.spacing - k.root.position.z);
        });

        // billboards: a single spring per card
        this.far.forEach((c) => {
            v.copy(W);
            const d = v.length();
            v.z = 0.2 * (Math.sin(0.01 * n * (1 + 0.035 * d + 0.1 * c.ix + 0.1 * c.iz)) + 1) * v.z;
            c.speed.x += 0.1 * v.z;
            c.speed.y += 0.6 * v.y;
            c.speed.z += 0.6 * v.z;
            c.speed.set(-c.rot.x * 0.025 + c.speed.x * 0.475, -c.rot.y * 0.025 + c.speed.y * 0.475, -c.rot.z * 0.025 + c.speed.z * 0.475);
            c.rot.add(c.speed);
        });

        // the front stalk: stems and leaves ripple up from the base
        const fw = W.z;
        this.fg.stem.forEach((w) => {
            const py = w.bone.position.y;
            const s = Math.sin(0.3 * py + 0.2 * this.ticker) * py * 1e-4 * fw;
            w.speed.x += s;
            w.speed.z -= s;
            w.speed.y += s;
            w.speed.set((w.target.x - w.rot.x) * DRAG + w.speed.x * 0.9, (w.target.y - w.rot.y) * DRAG + w.speed.y * 0.9, (w.target.z - w.rot.z) * DRAG + w.speed.z * 0.9);
            w.rot.add(w.speed);
            w.bone.rotation.set(w.rot.x, w.rot.y, w.rot.z);
        });
        this.fg.leafs.forEach((S) => {
            let up: Joint | null = null;
            S.forEach((T) => {
                const p = T.bone.position;
                T.speed.x += Math.sin(0.3 * p.y + 0.3 * p.x + 0.25 * this.ticker) * p.y * 0.001 * fw;
                T.speed.z -= Math.sin(0.3 * p.y + 0.3 * p.x + 0.4 * this.ticker) * p.y * 0.001 * fw;
                T.speed.y += Math.sin(0.3 * p.y + 0.3 * p.x + 0.4 * this.ticker) * p.y * 0.001 * fw;
                if (up) T.speed.addScaledVector(up.speed, 0.9);
                T.speed.set((T.target.x - T.rot.x) * DRAG + T.speed.x * ELASTIC, (T.target.y - T.rot.y) * DRAG + T.speed.y * ELASTIC, (T.target.z - T.rot.z) * DRAG + T.speed.z * ELASTIC);
                T.rot.add(T.speed);
                T.bone.rotation.set(T.rot.x, T.rot.y, T.rot.z);
                up = T;
            });
        });
        this.fg.root.rotation.z = 1.5 * fw;
        this.fg.root.rotation.y = Math.PI / 2 + fw;
    }

    update(ctx: FrameCtx) {
        const { dt, ptr, local, time, dwell } = ctx;
        this.updateFx(ctx);
        this.blendProps(dt);
        this.acc = Math.min(this.acc + dt, STEP * 4);
        while (this.acc >= STEP) {
            this.acc -= STEP;
            this.simMs += STEP * 1000;
            this.step(this.simMs);
        }
        const am = this.amounts;
        const p = this.p;
        const ms = time * 1000;

        // lightning: every 1000 frames a 20-frame flicker while it storms
        const flash = Math.max(0, 20 - (this.ticker % 1000));
        const lightning = flash * Math.random() * am[1];
        this.light.uLightning.value = lightning;

        // light
        const sunAngle = 2.8;
        this.light.uSunDir.value.set(5 * Math.sin(sunAngle), p.sunHeight, 5 * Math.cos(sunAngle)).normalize();
        this.light.uSunColor.value.copy(p.sunColor);
        this.light.uSun.value = p.sunBrightness / 6;
        this.light.uAmbient.value = 0.16 + 0.08 * am[1];
        (this.sky.material as THREE.MeshBasicMaterial).color.setScalar((0.5 + p.sunBrightness / 4) * 0.3);

        // materials
        this.plantMat.uniforms.deathAmount.value = this.death + 0.4 * this.sick;
        this.plantMat.uniforms.diseaseAmount.value = this.sick;
        const fu = this.farMat.uniforms;
        fu.rainAmount.value = am[1];
        fu.diseaseAmount.value = am[3];
        fu.deathAmount.value = this.death;
        fu.soilAmount.value = 0;
        fu.uBright.value = 0.26 + 0.08 * (p.sunBrightness / 4.6);
        const g = this.groundMat.uniforms;
        g.iTime.value = ms;
        g.lightning.value = lightning;
        g.puddleAmount.value = 0.4 * this.wet;
        g.inmap.value = this.inSoil;
        g.soilAnim.value = am[4];
        g.sunAmount.value = p.sunBrightness / 6;
        g.intensity.value = (0.5 + p.sunBrightness / 4) * 0.55;
        g.deathAmount.value = this.death / 6;
        g.windSpeed.value = 1 + p.windPower;
        const f = this.fgMat.uniforms;
        f.iTime.value = ms;
        f.sunAmount.value = p.sunBrightness / 6;
        f.energyAmount.value = am[4];

        // camera (reference: base height falls with the section's progress, the pointer slides it)
        // pass 4: arriving 0.18 → 0.42 (mid-plant), the two in-chapter segments walk down the plant to
        // 0.8, leaving carries on to the soil (1.0 ≈ 10 units above the ground)
        const prog = 0.42 + 0.24 * Math.max(-1.3, Math.min(0, local)) + 0.38 * dwell + 0.2 * Math.max(0, Math.min(1.3, local));
        const baseY = 340 - 350 * prog;
        this.camX += 0.02 * 60 * dt * (ptr.x * 0.5 * 50 - this.camX);
        this.camOffY += 0.02 * 60 * dt * (ptr.y * 0.5 * 25 - this.camOffY);
        const cam = this.camera;
        cam.position.set(this.camX, baseY + this.camOffY, 300 - this.hotspot * 30 - 25 * dwell - 15 * Math.max(0, local));
        cam.rotation.set(-5e-4 * (330 - cam.position.y), 0.005 * cam.position.x, 0);
        if (Math.abs(p.zoom - this.zoom) > 1e-4) {
            this.zoom = p.zoom;
            this.setLens(this.zoom);
        }

        // billboards face the camera, leaning with their springs
        const d = this.dummy;
        this.far.forEach((c, i) => {
            d.position.copy(c.pos);
            d.position.y = -30;
            d.lookAt(cam.position.x, -30, cam.position.z);
            d.rotation.x = c.rot.x;
            d.rotation.z = c.rot.z;
            d.position.y = 0;
            d.updateMatrix();
            this.farMesh.setMatrixAt(i, d.matrix);
        });
        this.farMesh.instanceMatrix.needsUpdate = true;

        // post uniforms
        const w = this.weather.uniforms;
        w.iTime.value = ms;
        w.rainAmount.value = am[1];
        w.droughtAmount.value = am[2];
        w.diseaseAmount.value = am[3];
        w.lightning.value = flash;
        w.sundepth.value = 0.15 * Math.sin(cam.position.y / 5) + 0.15 * Math.sin(cam.position.y / 2) + 0.15 * Math.cos(cam.position.y / 4);
        const minBlur = p.minBlur * (1 - 0.35 * this.hotspot);
        for (const b of this.blurs) {
            b.uniforms.iTime.value = ms;
            b.uniforms.minBlur.value = minBlur;
            b.uniforms.iResolution.value.set(ctx.w, ctx.h);
        }
        (this.pollen.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
    }

    render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget) {
        this.useSet(target);
        renderer.setRenderTarget(this.rtScene);
        renderer.setClearColor(0x000000, 1);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(this.rtA);
        renderer.render(this.weather.scene, this.postCam);
        let src = this.rtA;
        let dst = this.rtB;
        for (const b of this.blurs) {
            b.uniforms.tDiffuse.value = src.texture;
            renderer.setRenderTarget(dst);
            renderer.render(b.scene, this.postCam);
            [src, dst] = [dst, src];
        }
        this.copy.uniforms.tDiffuse.value = src.texture;
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(this.copy.scene, this.postCam);
        renderer.clearDepth();
        renderer.render(this.fgScene, this.camera);
        return true;
    }

    /** Internal buffers per target size (full and transition targets differ): no reallocation when
     * the engine switches between them. Everything here ends up blurred: half resolution is plenty
     * (the reference used 0.75 × DPR 0.75). */
    private sets = new Map<string, { scene: THREE.WebGLRenderTarget; a: THREE.WebGLRenderTarget; b: THREE.WebGLRenderTarget }>();

    private useSet(target: THREE.WebGLRenderTarget) {
        const W = Math.max(1, Math.round(target.width * 0.5));
        const H = Math.max(1, Math.round(target.height * 0.5));
        const key = `${W}x${H}`;
        let set = this.sets.get(key);
        if (!set) {
            if (this.sets.size === 0) {
                this.rtScene.setSize(W, H);
                this.rtA.setSize(W, H);
                this.rtB.setSize(W, H);
                set = { scene: this.rtScene, a: this.rtA, b: this.rtB };
            } else {
                const depth = new THREE.DepthTexture(W, H);
                depth.type = THREE.UnsignedIntType;
                const opts: THREE.RenderTargetOptions = { depthBuffer: false, type: THREE.HalfFloatType };
                set = {
                    scene: new THREE.WebGLRenderTarget(W, H, { depthTexture: depth, depthBuffer: true, type: THREE.HalfFloatType }),
                    a: new THREE.WebGLRenderTarget(W, H, opts),
                    b: new THREE.WebGLRenderTarget(W, H, opts),
                };
            }
            this.sets.set(key, set);
        }
        this.rtScene = set.scene;
        this.rtA = set.a;
        this.rtB = set.b;
        this.weather.uniforms.tDiffuse.value = set.scene.texture;
        for (const p of [this.weather, ...this.blurs]) p.uniforms.tDepth.value = set.scene.depthTexture;
    }

    resize(w: number, h: number) {
        super.resize(w, h);
        // the extra (transition-size) buffers are rebuilt at the new size on demand
        const base = [...this.sets.values()][0];
        this.sets.forEach((set) => {
            if (set === base) return;
            [set.scene, set.a, set.b].forEach((rt) => {
                rt.depthTexture?.dispose();
                rt.dispose();
            });
        });
        this.sets.clear();
        if (base) [this.rtScene, this.rtA, this.rtB] = [base.scene, base.a, base.b];
        this.setLens(this.zoom);
        (this.pollen.material as THREE.ShaderMaterial).uniforms.uScale.value = h / 994;
    }

    dispose() {
        super.dispose();
        this.sets.forEach((set) =>
            [set.scene, set.a, set.b].forEach((rt) => {
                rt.depthTexture?.dispose();
                rt.dispose();
            }),
        );
        [this.weather, ...this.blurs, this.copy].forEach((p) => {
            p.mesh.geometry.dispose();
            (p.mesh.material as THREE.Material).dispose();
        });
        this.fgScene.traverse((o) => {
            const m = o as THREE.Mesh;
            m.geometry?.dispose();
        });
        this.fgMat.dispose();
    }
}
