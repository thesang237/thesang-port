import { floor, lerp } from './math';
import { cyrb128, makeSfc32 } from './random';

export type Noise = (x: number, y?: number, z?: number) => number;
/** Seeded gradient Perlin noise; nominal range 0..1. This is not simplex noise. */
export const _G3 = [
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
];
export const _fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function createNoise(seed: number) {
    const rng = makeSfc32(...cyrb128(String(seed)));
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = floor(rng() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    return (px: number, py = 0, pz = 0): number => {
        const X = floor(px) & 255,
            Y = floor(py) & 255,
            Z = floor(pz) & 255;
        const x = px - floor(px),
            y = py - floor(py),
            z = pz - floor(pz);
        const u = _fade(x),
            v = _fade(y),
            w = _fade(z);
        const A = perm[X] + Y,
            AA = perm[A] + Z,
            AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y,
            BA = perm[B] + Z,
            BB = perm[B + 1] + Z;
        const g = (h: number, dx: number, dy: number, dz: number) => {
            const gg = _G3[h % 12];
            return gg[0] * dx + gg[1] * dy + gg[2] * dz;
        };
        const n = lerp(
            lerp(lerp(g(perm[AA], x, y, z), g(perm[BA], x - 1, y, z), u), lerp(g(perm[AB], x, y - 1, z), g(perm[BB], x - 1, y - 1, z), u), v),
            lerp(lerp(g(perm[AA + 1], x, y, z - 1), g(perm[BA + 1], x - 1, y, z - 1), u), lerp(g(perm[AB + 1], x, y - 1, z - 1), g(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
            w,
        );
        return (n + 1) * 0.5;
    };
}
