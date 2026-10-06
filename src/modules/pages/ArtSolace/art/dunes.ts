// ─── Dunes ───────────────────────────────────────────────────────────────────
// How a dune is made and how a point asks "am I inside it?".
//
// 1. RIDGE WALK. From the peak, a walker steps down one row at a time, swaying left and right
//    with two sine waves. Its path is the dune's crest line.
// 2. BOUNDARY MAPS. Picture two sets of diagonal stripes through the dune. On the canvas (y points
//    down) the "left" stripes run \ and the "right" stripes run /. For every stripe the walker
//    crosses, we note the FIRST height where it crossed: the dune's edge along that stripe.
//    Two maps, one per direction.
// 3. SHADE. To test a point, find its \ stripe and its / stripe and look up both edges. An edge
//    only counts if the point is below it. Then:
//      the / (right) edge is further down  → dark core (always drawn)
//      the \ (left) edge is further down   → lit slope (drawn 10 % of the time)
//      no edge counts                      → not this dune (sky, unless a dune behind claims it)
//    The first dune (front-most) that claims the point wins.

import { mapRange, TWO_PI } from './math';
import type { Noise } from './noise';
import type { Random } from './random';

export const Shade = { Core: 0, Slope: 1, Sky: 2 } as const;
export type Shade = (typeof Shade)[keyof typeof Shade];

export type Peak = {
    peakX: number;
    peakY: number;
    /** How steep the diagonal stripes are. Steeper = a wider "V", a broader dune. */
    diagonalSlope: number;
    /** Stripes per unit of height. More = a finer, smoother silhouette edge. */
    keyResolution: number;
    /** stripe index → the y where the ridge first crossed it. Left = \ stripes, right = / stripes (on the canvas, y down). */
    leftEdges: Map<number, number>;
    rightEdges: Map<number, number>;
};

/**
 * The stripe lookup, plus the scene-wide effects that bend it. The same function is used while
 * walking the ridge and while shading points, so the effects bend both in the same way.
 */
export type KeySpace = {
    /** Ridges sway sideways (the Dancers trait). */
    dancers: boolean;
    /** Random vertical kicks near noise contours (the Sandstorm trait). */
    sandstorm: boolean;
    /** Shear the whole stripe field: -1 = lean left, 0 = none, 1 = lean right. */
    skew: -1 | 0 | 1;
    skewAmount: number;
    noise: Noise;
    gaussian: () => number;
};

/** Which \ stripe (left key) and which / stripe (right key) the point (x, y) falls in. */
export function stripeKeys(keys: KeySpace, x: number, y: number, diagonalSlope: number, keyResolution: number): [number, number] {
    let cx = x,
        cy = y;

    // Sandstorm: where the noise field crosses a thin contour, kick the point up or down at random
    // (⚠ this takes a random number, so it is part of every seed's sequence)
    if (keys.sandstorm && keys.noise(30 * cx, 30 * cy) % 0.1 < 0.005) {
        cy += 0.18 * keys.gaussian();
    }
    // Dancers: sway sideways with height
    if (keys.dancers) {
        cx += 0.15 * Math.sin(12 * cy);
    }
    // Skew: shear left or right
    if (keys.skew === -1) cx -= keys.skewAmount * cy;
    else if (keys.skew === 1) cx += keys.skewAmount * cy;

    const leftKey = Math.floor((cy - diagonalSlope * cx) * keyResolution);
    const rightKey = Math.floor((cy + diagonalSlope * cx) * keyResolution);
    return [leftKey, rightKey];
}

export type RidgeOptions = {
    peakX: number;
    peakY: number;
    diagonalSlope: number;
    keyResolution: number;
    /** Wavy peaks: the sway grows with the square of the distance from the top (wide flaring wings). */
    isSpecial: boolean;
    /** Scene dune count (wavy peaks flare more in busy scenes). */
    numPeaks: number;
    /** The walk stops below this y. */
    stopY: number;
    /** Multiplies both sway amplitudes (1 = as seeded). */
    wobble: number;
    /** Sideways drift per step (the dune's lean). */
    lean: number;
    /** Down-step per row. Smaller = more steps, a smoother crest. */
    step: number;
};

/** Walk the ridge down from the peak and record the boundary maps. */
export function createPeak(rand: Random, keys: KeySpace, o: RidgeOptions): Peak {
    // two sine oscillators: a slow wide sway and a faster small wiggle
    const wave1Freq = rand.range(5, 10);
    const wave1Amp = rand.range(2e-4, 3e-4) * rand.pick([-1, 1]) * o.wobble;
    const wave1Phase = rand.range(0, TWO_PI);

    const wave2Freq = rand.range(10, 30) + (rand.chance(0.15) ? 15 : 0); // sometimes an extra-fast wiggle
    let wave2Amp = rand.range(0.001, 0.0015) * rand.pick([-1, 1]) * o.wobble;
    const wave2Phase = rand.range(0, TWO_PI);
    if (rand.chance(0.15)) wave2Amp = 0; // 15 %: a smooth, single-wave ridge

    const leftEdges = new Map<number, number>();
    const rightEdges = new Map<number, number>();
    let x = o.peakX;
    let y = o.peakY;

    while (y < o.stopY) {
        x -= o.lean;
        y += o.step;

        // the sway gets stronger the further down we are
        const depth = y - o.peakY;
        const swayScale = o.isSpecial ? mapRange(depth * depth * o.numPeaks, 0, 1, 0.5, 10) : mapRange(depth, 0, 1, 0.5, 1);

        // sqrt(y) stretches the waves out toward the bottom
        x += wave1Amp * swayScale * Math.sin(wave1Phase + wave1Freq * Math.pow(y, 0.5));
        x += wave2Amp * swayScale * Math.sin(wave2Phase + wave2Freq * Math.pow(y, 0.5));

        // first crossing of each stripe = the dune's edge on that stripe
        const [leftKey, rightKey] = stripeKeys(keys, x, y, o.diagonalSlope, o.keyResolution);
        if (!leftEdges.get(leftKey)) leftEdges.set(leftKey, y);
        if (!rightEdges.get(rightKey)) rightEdges.set(rightKey, y);
    }

    return { peakX: o.peakX, peakY: o.peakY, diagonalSlope: o.diagonalSlope, keyResolution: o.keyResolution, leftEdges, rightEdges };
}

/** Is (x, y) in this dune's core, on its lit slope, or not in this dune at all (null)? */
export function shadeOfPeak(peak: Peak, keys: KeySpace, x: number, y: number): Shade | null {
    const [leftKey, rightKey] = stripeKeys(keys, x, y, peak.diagonalSlope, peak.keyResolution);

    // an edge only counts if the point is below it; 0 = "not inside on this stripe"
    let left = peak.leftEdges.get(leftKey) ?? 0;
    if (y <= left) left = 0;
    let right = peak.rightEdges.get(rightKey) ?? 0;
    if (y <= right) right = 0;

    if (right > left) return Shade.Core;
    if (left > right) return Shade.Slope;
    return null;
}

/** Ask every dune in order (front first); the first one that claims the point decides its shade. */
export function shadeAt(peaks: Peak[], keys: KeySpace, x: number, y: number): Shade {
    for (const peak of peaks) {
        const shade = shadeOfPeak(peak, keys, x, y);
        if (shade !== null) return shade;
    }
    return Shade.Sky;
}
