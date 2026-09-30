import * as THREE from 'three';

import { rng } from '../utils/math';

export const PARTICLE_COUNT = 16000;

type Ellipsoid = { c: [number, number, number]; r: [number, number, number]; rotZ?: number; carve?: boolean };

const PENGUIN: Ellipsoid[] = [
    { c: [0, 1.05, 0], r: [0.72, 0.86, 0.62] }, // body
    { c: [0, 1.0, 0.16], r: [0.58, 0.64, 0.5] }, // belly
    { c: [0, 1.96, 0.02], r: [0.52, 0.47, 0.49] }, // head
    { c: [-0.7, 1.12, 0], r: [0.13, 0.5, 0.27], rotZ: -0.38 }, // flippers
    { c: [0.7, 1.12, 0], r: [0.13, 0.5, 0.27], rotZ: 0.38 },
    { c: [-0.27, 0.24, 0.3], r: [0.21, 0.08, 0.27] }, // feet
    { c: [0.27, 0.24, 0.3], r: [0.21, 0.08, 0.27] },
    { c: [0, 1.9, 0.49], r: [0.16, 0.07, 0.14] }, // beak
    { c: [-0.52, 1.98, 0], r: [0.11, 0.2, 0.2] }, // ear cups
    { c: [0.52, 1.98, 0], r: [0.11, 0.2, 0.2] },
];

const inside = (p: THREE.Vector3, e: Ellipsoid) => {
    let x = p.x - e.c[0];
    let y = p.y - e.c[1];
    const z = p.z - e.c[2];
    if (e.rotZ) {
        const c = Math.cos(-e.rotZ);
        const s = Math.sin(-e.rotZ);
        [x, y] = [x * c - y * s, x * s + y * c];
    }
    return (x / e.r[0]) ** 2 + (y / e.r[1]) ** 2 + (z / e.r[2]) ** 2 < 0.98;
};

function penguin(n: number, seed: number) {
    const r = rng(seed);
    const out = new Float32Array(n * 3);
    const areas = PENGUIN.map((e) => (e.r[0] * e.r[1] + e.r[1] * e.r[2] + e.r[0] * e.r[2]) / 3);
    const total = areas.reduce((a, b) => a + b, 0);
    const p = new THREE.Vector3();
    let i = 0;
    // headphone band gets a fixed share
    const band = Math.floor(n * 0.05);
    while (i < band) {
        const a = r() * Math.PI;
        const j = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.09);
        out.set([Math.cos(a) * 0.58 + j.x, 1.98 + Math.sin(a) * 0.56 + j.y, j.z], i * 3);
        i++;
    }
    let guard = 0;
    while (i < n && guard++ < n * 40) {
        let pick = r() * total;
        let k = 0;
        while (pick > areas[k]) pick -= areas[k++];
        const e = PENGUIN[k];
        // surface point, slightly thickened inward for volume
        p.set(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1);
        if (p.lengthSq() < 1e-4) continue;
        p.normalize().multiplyScalar(1 - Math.pow(r(), 3) * 0.18);
        p.set(p.x * e.r[0], p.y * e.r[1], p.z * e.r[2]);
        if (e.rotZ) p.applyAxisAngle(new THREE.Vector3(0, 0, 1), e.rotZ);
        p.add(new THREE.Vector3(...e.c));
        if (PENGUIN.some((o, oi) => oi !== k && inside(p, o))) continue;
        out.set([p.x, p.y, p.z], i * 3);
        i++;
    }
    return out;
}

function glyph(char: string, n: number, seed: number, font = '900 220px Arial, Helvetica, sans-serif') {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2 + 8);
    const data = ctx.getImageData(0, 0, size, size).data;
    const pixels: number[] = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[(y * size + x) * 4 + 3] > 128) pixels.push(x, y);
    const r = rng(seed);
    const out = new Float32Array(n * 3);
    const count = pixels.length / 2;
    for (let i = 0; i < n; i++) {
        const k = Math.floor(r() * count) * 2;
        const x = ((pixels[k] + r()) / size - 0.5) * 2.7;
        const y = (0.5 - (pixels[k + 1] + r()) / size) * 2.7 + 1.3;
        out.set([x, y, (r() - 0.5) * 0.5], i * 3);
    }
    return out;
}

function cloud(n: number, seed: number) {
    const r = rng(seed);
    const out = new Float32Array(n * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
        v.set(r() - 0.5, r() - 0.5, r() - 0.5)
            .normalize()
            .multiplyScalar(0.3 + Math.pow(r(), 0.5) * 2.6);
        out.set([v.x, v.y * 0.8 + 1.4, v.z], i * 3);
    }
    return out;
}

export function buildShapes(n = PARTICLE_COUNT) {
    return {
        penguin: penguin(n, 9),
        x: glyph('X', n, 10),
        m: glyph('M', n, 11),
        cloud: cloud(n, 12),
    };
}
