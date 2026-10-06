// ─── Perlin noise ────────────────────────────────────────────────────────────
// Smooth randomness: nearby inputs give nearby outputs, so it looks like terrain or cloud rather
// than TV static. Classic 3D "improved" Perlin noise (Ken Perlin, 2002) with a seeded shuffle,
// matching p5's noise() range: returns 0..1, centred on 0.5.

import { lerp } from './math';
import { hashSeed, sfc32 } from './random';

// the 12 edge directions of a cube: each lattice corner points its slope one of these ways
const GRADIENTS = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
] as const;

/** Perlin's smootherstep: 6t⁵ − 15t⁴ + 10t³ (eases in and out, so cells join without creases). */
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export type Noise = (x: number, y?: number, z?: number) => number;

export function createNoise(seed: number): Noise {
    // shuffle 0..255 with the seed: this table decides which gradient each lattice corner gets
    const next = sfc32(...hashSeed(String(seed)));
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    const grad = (hash: number, dx: number, dy: number, dz: number) => {
        const g = GRADIENTS[hash % 12];
        return g[0] * dx + g[1] * dy + g[2] * dz;
    };

    return (px, py = 0, pz = 0) => {
        // which lattice cell, and where inside it (0..1)
        const X = Math.floor(px) & 255,
            Y = Math.floor(py) & 255,
            Z = Math.floor(pz) & 255;
        const x = px - Math.floor(px),
            y = py - Math.floor(py),
            z = pz - Math.floor(pz);
        const u = fade(x),
            v = fade(y),
            w = fade(z);

        // hash the cell's 8 corners
        const A = perm[X] + Y,
            AA = perm[A] + Z,
            AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y,
            BA = perm[B] + Z,
            BB = perm[B + 1] + Z;

        // blend the 8 corner slopes: along x, then y, then z
        const n = lerp(
            lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
            lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
            w,
        );
        return (n + 1) * 0.5;
    };
}
