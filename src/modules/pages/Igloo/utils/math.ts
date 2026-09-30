export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Frame-rate independent damping. */
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/** Mulberry32 — small seeded PRNG so every reload builds the same scene. */
export const rng = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// ─── 2D gradient noise (Perlin) ─────────────────────────────────────────────
const perm = (() => {
    const r = rng(1337);
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    return Uint8Array.from([...p, ...p]);
})();

const grad2 = (h: number, x: number, y: number) => {
    switch (h & 7) {
        case 0:
            return x + y;
        case 1:
            return -x + y;
        case 2:
            return x - y;
        case 3:
            return -x - y;
        case 4:
            return x;
        case 5:
            return -x;
        case 6:
            return y;
        default:
            return -y;
    }
};

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export const noise2 = (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return lerp(lerp(grad2(aa, xf, yf), grad2(ba, xf - 1, yf), u), lerp(grad2(ab, xf, yf - 1), grad2(bb, xf - 1, yf - 1), u), v);
};

export const fbm2 = (x: number, y: number, octaves = 5) => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let i = 0; i < octaves; i++) {
        sum += noise2(x * f, y * f) * amp;
        f *= 2.03;
        amp *= 0.5;
    }
    return sum;
};

/** Ridged fbm — sharp mountain crests. */
export const ridged2 = (x: number, y: number, octaves = 5) => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let i = 0; i < octaves; i++) {
        const n = 1 - Math.abs(noise2(x * f, y * f));
        sum += n * n * amp;
        f *= 2.1;
        amp *= 0.5;
    }
    return sum;
};

/** Widen the vertical FOV on narrow (portrait) viewports so framing keeps its width. */
export const fitFov = (fov: number, aspect: number, minAspect = 1.3) => {
    if (aspect >= minAspect) return fov;
    const half = Math.atan(Math.tan((fov * Math.PI) / 360) * (minAspect / aspect));
    return Math.min(150, (half * 360) / Math.PI);
};
