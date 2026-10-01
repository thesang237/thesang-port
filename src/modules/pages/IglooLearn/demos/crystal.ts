import * as THREE from 'three';

import { HASH, SNOISE } from '../kit/glsl';
import { rng } from '../kit/math';

/**
 * Teaching copy of the Igloo ice crystal (canvas/CrystalWorld.tsx):
 * a jittered low-poly rock + a hand-written "ice" shader. Every effect has
 * its own uniform so the demo can switch it on and off.
 */
export function buildCrystalGeometry(seed = 11, shape: 'rock' | 'shard' | 'prism' = 'rock') {
    let g: THREE.BufferGeometry;
    if (shape === 'prism') {
        g = new THREE.CylinderGeometry(0.95, 1.1, 2.6, 6, 3);
        g.rotateZ(0.12);
    } else if (shape === 'shard') {
        g = new THREE.OctahedronGeometry(1.35, 1);
        g.scale(0.8, 1.45, 0.7);
    } else {
        g = new THREE.IcosahedronGeometry(1.25, 1);
        g.scale(0.95, 1.4, 0.85);
    }
    // flat faces: every triangle gets its own 3 vertices
    g = g.index ? g.toNonIndexed() : g;
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');

    // jitter shared corners by the same amount so faces stay closed
    const r = rng(seed);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const offsets = new Map<string, THREE.Vector3>();
    for (let i = 0; i < pos.count; i++) {
        const key = `${pos.getX(i).toFixed(3)}|${pos.getY(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`;
        let off = offsets.get(key);
        if (!off) {
            off = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.42);
            if (pos.getY(i) < -0.6) off.multiplyScalar(2.2); // chipped base
            offsets.set(key, off);
        }
        pos.setXYZ(i, pos.getX(i) + off.x, pos.getY(i) + off.y, pos.getZ(i) + off.z);
    }
    g.computeVertexNormals();
    // barycentric coords → lets the fragment shader find triangle edges
    const bary = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) bary[i * 3 + (i % 3)] = 1;
    g.setAttribute('aBary', new THREE.BufferAttribute(bary, 3));
    g.computeBoundingSphere();
    return g;
}

const vertex = /* glsl */ `
uniform float uTime;
uniform float uGlitch;
attribute vec3 aBary;
varying vec3 vN;
varying vec3 vWPos;
varying vec3 vObj;
varying vec3 vBary;
${HASH}
void main() {
    vec3 p = position;
    // horizontal slice glitch: rows of the mesh jump sideways
    float slice = floor(p.y * 9.0 + floor(uTime * 18.0));
    p.x += (hash11(slice) - 0.5) * step(0.62, hash11(slice + 3.1)) * uGlitch * 0.5;
    vObj = p;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWPos = wp.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vBary = aBary;
    gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uFresnel;   // edge glow strength
uniform float uPower;     // how tight the edge glow is
uniform float uIrid;      // thin-film rainbow
uniform float uEdges;     // bright facet lines
uniform float uFrost;     // frosted base
uniform float uCloud;     // milky inside
uniform float uSpark;     // specular sparkle
uniform float uRefract;   // how much of the "room" we see through it
varying vec3 vN;
varying vec3 vWPos;
varying vec3 vObj;
varying vec3 vBary;
${SNOISE}

// a fake room to reflect / refract: dark floor, bright sky, soft window bands
vec3 envGrad(vec3 d) {
    float y = d.y * 0.5 + 0.5;
    vec3 c = mix(vec3(0.04, 0.05, 0.075), vec3(0.62, 0.67, 0.75), smoothstep(0.2, 1.0, y));
    c += smoothstep(0.75, 1.0, sin(d.x * 7.0 + d.y * 3.0 + uTime * 0.2)) * 0.25;
    return c;
}

void main() {
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(cameraPosition - vWPos);
    float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
    float fres = pow(1.0 - ndv, uPower);

    vec3 Rr = refract(-V, N, 0.76);
    vec3 Rl = reflect(-V, N);
    vec3 col = envGrad(Rr) * 0.55 * uRefract + envGrad(Rl) * 0.25 * (0.4 + fres);

    float cloud = fbm3(vObj * 1.6 + uTime * 0.05) * 0.5 + 0.5;
    col = mix(col, vec3(0.2, 0.23, 0.29), cloud * 0.35 * uCloud);

    vec3 irid = 0.5 + 0.5 * cos(6.28318 * (fres * 1.6 + vObj.y * 0.25 + uTime * 0.03 + vec3(0.0, 0.33, 0.67)));
    col += irid * smoothstep(0.15, 0.75, fres) * uIrid;

    float spec = pow(max(dot(Rl, normalize(vec3(0.4, 0.85, 0.45))), 0.0), 40.0);
    col += spec * 2.2 * uSpark;
    col += fres * uFresnel;

    float edge = min(min(vBary.x, vBary.y), vBary.z);
    float line = 1.0 - smoothstep(0.0, fwidth(edge) * 1.6, edge);
    col += line * uEdges * (0.4 + fres);

    float frost = smoothstep(-0.2, -1.4, vObj.y) * (0.55 + 0.45 * snoise(vObj * 9.0));
    col = mix(col, vec3(0.74, 0.78, 0.84), clamp(frost, 0.0, 1.0) * 0.8 * uFrost);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export const CRYSTAL_DEFAULTS = { fresnel: 0.35, power: 2.2, irid: 0.4, edges: 0.55, frost: 1, cloud: 1, spark: 1, refract: 1, glitch: 0 };

export function createCrystalMaterial() {
    return new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        uniforms: {
            uTime: { value: 0 },
            uGlitch: { value: 0 },
            uFresnel: { value: CRYSTAL_DEFAULTS.fresnel },
            uPower: { value: CRYSTAL_DEFAULTS.power },
            uIrid: { value: CRYSTAL_DEFAULTS.irid },
            uEdges: { value: CRYSTAL_DEFAULTS.edges },
            uFrost: { value: CRYSTAL_DEFAULTS.frost },
            uCloud: { value: CRYSTAL_DEFAULTS.cloud },
            uSpark: { value: CRYSTAL_DEFAULTS.spark },
            uRefract: { value: CRYSTAL_DEFAULTS.refract },
        },
    });
}

export const CRYSTAL_FRAGMENT_SOURCE = fragment;

// ─── GPU snow (canvas/Snow.tsx) ─────────────────────────────────────────────

export function createSnow(count: number, size: [number, number, number], opts: { speed?: number; pointSize?: number; opacity?: number } = {}) {
    const r = rng(count);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (r() - 0.5) * size[0];
        pos[i * 3 + 1] = (r() - 0.5) * size[1];
        pos[i * 3 + 2] = (r() - 0.5) * size[2];
        seed[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: opts.speed ?? 0.5 },
            uHeight: { value: size[1] },
            uSize: { value: opts.pointSize ?? 2 },
            uOpacity: { value: opts.opacity ?? 0.8 },
            uWind: { value: 0 },
            uSway: { value: 1 },
        },
        vertexShader: /* glsl */ `
            uniform float uTime; uniform float uSpeed; uniform float uHeight; uniform float uSize; uniform float uWind; uniform float uSway;
            attribute float aSeed;
            varying float vAlpha;
            void main() {
                vec3 p = position;
                float t = uTime * uSpeed * (0.6 + aSeed * 0.8);
                // fall, then wrap back to the top with mod() — no JavaScript per flake
                p.y = mod(p.y - t + uHeight * 0.5, uHeight) - uHeight * 0.5;
                p.x += (sin(uTime * 0.6 + aSeed * 40.0) * 0.35) * uSway + uWind * (0.5 + aSeed);
                p.z += cos(uTime * 0.5 + aSeed * 23.0) * 0.25 * uSway;
                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mv;
                gl_PointSize = uSize * (0.5 + aSeed) * (12.0 / -mv.z);
                vAlpha = smoothstep(uHeight * 0.5, uHeight * 0.3, abs(p.y)) * (0.4 + 0.6 * aSeed);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform float uOpacity;
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                float a = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
                if (a < 0.01) discard;
                gl_FragColor = vec4(vec3(1.4), a);
            }
        `,
    });
    const points = new THREE.Points(g, m);
    points.frustumCulled = false;
    return points;
}
