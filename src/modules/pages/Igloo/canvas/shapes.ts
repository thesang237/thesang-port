import * as THREE from 'three';

import { rng, smoothstep } from '../utils/math';

/**
 * Point-sampled shapes for the colony simulation. Every shape is two RGBA
 * float arrays with one texel per particle:
 *   pos — xyz + per-particle random (identical across shapes)
 *   nrm — surface normal + ambient occlusion
 */
export type Shape = { pos: Float32Array; nrm: Float32Array };

type Ellipsoid = { c: [number, number, number]; r: [number, number, number]; rotZ?: number };

// A pudgy penguin wearing headphones — simple ellipsoids + two tubes.
const BODY: Ellipsoid[] = [
    { c: [0, 1.02, 0], r: [0.72, 0.8, 0.62] }, // torso
    { c: [0, 0.7, 0.04], r: [0.8, 0.52, 0.68] }, // pear-shaped belly
    { c: [0, 1.86, 0.02], r: [0.6, 0.52, 0.56] }, // head
    { c: [-0.76, 1.02, 0.02], r: [0.14, 0.46, 0.28], rotZ: -0.5 }, // flippers
    { c: [0.76, 1.02, 0.02], r: [0.14, 0.46, 0.28], rotZ: 0.5 },
    { c: [-0.28, 0.24, 0.34], r: [0.22, 0.09, 0.3] }, // feet
    { c: [0.28, 0.24, 0.34], r: [0.22, 0.09, 0.3] },
    { c: [0, 1.8, 0.56], r: [0.14, 0.075, 0.13] }, // beak
    { c: [-0.19, 1.95, 0.49], r: [0.07, 0.08, 0.05] }, // eyes (bumps)
    { c: [0.19, 1.95, 0.49], r: [0.07, 0.08, 0.05] },
    { c: [-0.62, 1.9, 0], r: [0.13, 0.25, 0.25] }, // ear cups
    { c: [0.62, 1.9, 0], r: [0.13, 0.25, 0.25] },
];

const Z = new THREE.Vector3(0, 0, 1);

/** Normalised "distance" to an ellipsoid surface (0 = on it, <0 inside). */
const field = (p: THREE.Vector3, e: Ellipsoid) => {
    let x = p.x - e.c[0];
    let y = p.y - e.c[1];
    const z = p.z - e.c[2];
    if (e.rotZ) {
        const c = Math.cos(-e.rotZ);
        const s = Math.sin(-e.rotZ);
        [x, y] = [x * c - y * s, x * s + y * c];
    }
    return Math.sqrt((x / e.r[0]) ** 2 + (y / e.r[1]) ** 2 + (z / e.r[2]) ** 2) - 1;
};

function penguin(n: number, rand: Float32Array): Shape {
    const r = rng(9);
    const pos = new Float32Array(n * 4);
    const nrm = new Float32Array(n * 4);
    const p = new THREE.Vector3();
    const nv = new THREE.Vector3();
    const put = (i: number, ao: number) => {
        pos.set([p.x, p.y, p.z, rand[i]], i * 4);
        // darken the underside and the crevices between parts
        nrm.set([nv.x, nv.y, nv.z, ao * (0.55 + 0.45 * smoothstep(0.15, 0.9, p.y))], i * 4);
    };

    let i = 0;
    // tubes: headphone band + collar, ~9% of the points
    const tubes = Math.floor(n * 0.09);
    while (i < tubes) {
        const band = i < tubes * 0.45;
        const a = r() * Math.PI * 2;
        const t = r() * Math.PI * 2;
        if (band) {
            const arc = r() * Math.PI; // over the head, ear to ear
            const center = new THREE.Vector3(Math.cos(arc) * 0.64, 1.92 + Math.sin(arc) * 0.6, 0);
            nv.set(Math.cos(arc) * Math.cos(t), Math.sin(arc) * Math.cos(t), Math.sin(t));
            p.copy(center).addScaledVector(nv, 0.055);
        } else {
            // collar / scarf ring around the neck
            const center = new THREE.Vector3(Math.cos(a) * 0.62, 1.42, Math.sin(a) * 0.56);
            const radial = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
            nv.copy(radial)
                .multiplyScalar(Math.cos(t))
                .add(new THREE.Vector3(0, Math.sin(t), 0));
            p.copy(center).addScaledVector(nv, 0.09);
        }
        if (BODY.some((e) => field(p, e) < -0.02)) continue;
        put(i++, 0.9);
    }

    const areas = BODY.map((e) => (e.r[0] * e.r[1] + e.r[1] * e.r[2] + e.r[0] * e.r[2]) / 3);
    const total = areas.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (i < n && guard++ < n * 60) {
        let pick = r() * total;
        let k = 0;
        while (pick > areas[k]) pick -= areas[k++];
        const e = BODY[k];
        nv.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
        if (nv.lengthSq() < 1e-4 || nv.lengthSq() > 1) continue;
        nv.normalize();
        p.set(nv.x * e.r[0], nv.y * e.r[1], nv.z * e.r[2]);
        // ellipsoid normal = gradient of the implicit surface
        nv.set(nv.x / e.r[0], nv.y / e.r[1], nv.z / e.r[2]).normalize();
        if (e.rotZ) {
            p.applyAxisAngle(Z, e.rotZ);
            nv.applyAxisAngle(Z, e.rotZ);
        }
        p.add(new THREE.Vector3(...e.c));
        let minOther = Infinity;
        let buried = false;
        for (let o = 0; o < BODY.length; o++) {
            if (o === k) continue;
            const f = field(p, BODY[o]);
            if (f < 0) {
                buried = true;
                break;
            }
            minOther = Math.min(minOther, f);
        }
        if (buried) continue;
        put(i++, 0.35 + 0.65 * smoothstep(0, 0.45, minOther));
    }
    return { pos, nrm };
}

// Official X mark (for the social link), 1200×1227 viewBox.
const X_PATH =
    'M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z';

/** Extrude a 2D mark into a bevelled slab and sample its faces + walls. */
function extruded(draw: (ctx: CanvasRenderingContext2D, size: number) => void, n: number, rand: Float32Array, seed: number, depth = 0.42, height = 2.5): Shape {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    draw(ctx, size);
    const a = ctx.getImageData(0, 0, size, size).data;
    const alpha = (x: number, y: number) => (x < 0 || y < 0 || x >= size || y >= size ? 0 : a[(y * size + x) * 4 + 3] / 255);

    const inside: number[] = [];
    const edges: number[] = [];
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            if (alpha(x, y) < 0.5) continue;
            inside.push(x, y);
            if (alpha(x - 1, y) < 0.5 || alpha(x + 1, y) < 0.5 || alpha(x, y - 1) < 0.5 || alpha(x, y + 1) < 0.5) edges.push(x, y);
        }

    const r = rng(seed);
    const pos = new Float32Array(n * 4);
    const nrm = new Float32Array(n * 4);
    const toX = (px: number) => (px / size - 0.5) * height;
    const toY = (py: number) => (0.5 - py / size) * height + 1.3;
    const half = depth / 2;
    for (let i = 0; i < n; i++) {
        let x: number;
        let y: number;
        let z: number;
        let nx: number;
        let ny: number;
        let nz: number;
        if (r() < 0.72) {
            // front / back face
            const k = Math.floor(r() * (inside.length / 2)) * 2;
            const px = inside[k] + r();
            const py = inside[k + 1] + r();
            const side = r() < 0.5 ? -1 : 1;
            x = toX(px);
            y = toY(py);
            z = side * half;
            nx = 0;
            ny = 0;
            nz = side;
        } else {
            // walls, rounded into the faces
            const k = Math.floor(r() * (edges.length / 2)) * 2;
            const ex = edges[k];
            const ey = edges[k + 1];
            const gx = alpha(ex - 2, ey) - alpha(ex + 2, ey);
            const gy = alpha(ex, ey + 2) - alpha(ex, ey - 2);
            const gl = Math.hypot(gx, gy) || 1;
            const t = r() * 2 - 1;
            x = toX(ex + r());
            y = toY(ey + r());
            z = t * half;
            nx = gx / gl;
            ny = gy / gl;
            nz = t * 0.7;
        }
        const len = Math.hypot(nx, ny, nz) || 1;
        pos.set([x, y, z, rand[i]], i * 4);
        nrm.set([nx / len, ny / len, nz / len, 0.85 + 0.15 * smoothstep(0.2, 1.4, y)], i * 4);
    }
    return { pos, nrm };
}

function cloud(n: number, rand: Float32Array): Shape {
    const r = rng(12);
    const pos = new Float32Array(n * 4);
    const nrm = new Float32Array(n * 4);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
        v.set(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
        const d = 0.3 + Math.pow(r(), 0.5) * 2.8;
        pos.set([v.x * d, v.y * d * 0.8 + 1.4, v.z * d, rand[i]], i * 4);
        nrm.set([v.x, v.y, v.z, 0.8], i * 4);
    }
    return { pos, nrm };
}

export function buildShapes(n: number) {
    const r = rng(77);
    const rand = new Float32Array(n);
    for (let i = 0; i < n; i++) rand[i] = r();
    return {
        penguin: penguin(n, rand),
        x: extruded(
            (ctx, size) => {
                const s = (size * 0.78) / 1227;
                ctx.translate((size - 1200 * s) / 2, (size - 1227 * s) / 2);
                ctx.scale(s, s);
                ctx.fill(new Path2D(X_PATH));
            },
            n,
            rand,
            10,
        ),
        m: extruded(
            (ctx, size) => {
                ctx.font = `900 ${size * 0.86}px Arial, Helvetica, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('M', size / 2, size / 2 + size * 0.04);
            },
            n,
            rand,
            11,
        ),
        cloud: cloud(n, rand),
    };
}

export type Shapes = ReturnType<typeof buildShapes>;
