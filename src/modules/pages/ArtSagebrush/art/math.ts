/** Small geometry helpers. Coordinates are in the 400-unit artwork space. */
export const { min, max, abs, floor, round, sqrt, cos, sin, atan2, pow } = Math;
export const TAU = Math.PI * 2;
export const PI = Math.PI;
export const sq = (x: number) => x * x;
export const distance = (x1: number, y1: number, x2: number, y2: number) => sqrt(sq(x2 - x1) + sq(y2 - y1));
export const constrain = (v: number, lo: number, hi: number) => max(lo, min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mapRange = (v: number, s1: number, e1: number, s2: number, e2: number) => s2 + ((v - s1) * (e2 - s2)) / (e1 - s1);
export const norm = (v: number, lo: number, hi: number) => (v - lo) / (hi - lo);
export type Vec = { x: number; y: number; z: number };
export const cv = (x: number, y: number, z = 0): Vec => ({ x, y, z });
export const vdot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;
export const vmag = (v: Vec) => sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
export const vmagsq = (v: Vec) => v.x * v.x + v.y * v.y + v.z * v.z;
export const vscale = (v: Vec, s: number): Vec => ({ x: v.x * s, y: v.y * s, z: v.z * s });
export const vnorm = (v: Vec): Vec => {
    const m = vmag(v);
    return m === 0 ? v : vscale(v, 1 / m);
};
export function vrot(v: Vec, a: number, b = 0, c = 0): Vec {
    const ca = cos(a),
        sa = sin(a),
        cb = cos(b),
        sb = sin(b),
        cc = cos(c),
        sc = sin(c);
    const rx = v.x * ca - v.y * sa,
        ry = v.x * sa + v.y * ca,
        rz = v.z;
    const rx2 = rx * cb - rz * sb,
        ry2 = ry,
        rz2 = rx * sb + rz * cb;
    return { x: rx2, y: ry2 * cc - rz2 * sc, z: ry2 * sc + rz2 * cc };
}
