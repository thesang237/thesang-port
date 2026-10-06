// ─── Seeded randomness ───────────────────────────────────────────────────────
// The same seed string always produces the same stream of numbers, so the same seed always
// produces the same artwork. Two small, well-known algorithms do the work:
//   cyrb128  turns any string into four 32-bit numbers (a hash)
//   sfc32    turns those four numbers into an endless stream of values in [0, 1)
//
// ⚠ ORDER MATTERS. Every call to next() moves the stream forward by one. If you add, remove or
// reorder a call anywhere in the art, every random choice after it changes, and old seeds stop
// reproducing their old pictures. See README.md › "The one rule".

/** Hash a string into four 32-bit seeds (cyrb128 by bryc). */
export function hashSeed(text: string): [number, number, number, number] {
    let h1 = 1779033703,
        h2 = 3144134277,
        h3 = 1013904242,
        h4 = 2773480762;
    for (let i = 0; i < text.length; i++) {
        const k = text.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

/** sfc32 ("small fast counting") generator: returns a function giving values in [0, 1). */
export function sfc32(a0: number, b0: number, c0: number, d0: number): () => number {
    let a = a0,
        b = b0,
        c = c0,
        d = d0;
    return () => {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

/**
 * Bell-curve randomness (Marsaglia polar method): most values land near 0, about 68 % between -1
 * and 1, rarely beyond ±3. Each round makes two values; the second is kept for the next call.
 */
export function makeGaussian(next: () => number): () => number {
    let spare: number | null = null;
    return () => {
        if (spare !== null) {
            const s = spare;
            spare = null;
            return s;
        }
        let u: number, v: number, s: number;
        do {
            u = next() * 2 - 1;
            v = next() * 2 - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);
        const m = Math.sqrt((-2 * Math.log(s)) / s);
        spare = v * m;
        return u * m;
    };
}

/** A seeded random source with the helpers the artwork uses (p5's random() split into named calls). */
export type Random = {
    /** A value in [0, 1). */
    next: () => number;
    /** A value in [lo, hi). */
    range: (lo: number, hi: number) => number;
    /** One item of the list, each equally likely. Repeat an item to make it more likely. */
    pick: <T>(items: readonly T[]) => T;
    /** True with probability p (0 = never, 1 = always). */
    chance: (p: number) => boolean;
    /** Bell-curve value centred on 0 (see makeGaussian). Shares the same stream as next(). */
    gaussian: () => number;
};

export function createRandom(seed: string): Random {
    const next = sfc32(...hashSeed(seed));
    return {
        next,
        range: (lo, hi) => lo + next() * (hi - lo),
        pick: (items) => items[Math.floor(next() * items.length)],
        chance: (p) => next() < p,
        gaussian: makeGaussian(next),
    };
}

/** A fresh random 64-character hex seed (like an fxhash token hash). */
export function randomSeed(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
