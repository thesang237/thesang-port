// ─── Warp and unwarp ─────────────────────────────────────────────────────────
// The dunes are built in a flat, undistorted "model space". The picture is then bent:
//   1. a sine wave lifts and drops each column a little   → the wavy horizon
//   2. a power curve squeezes y toward the bottom          → depth: far dunes crowd near the top
//
// Drawing works backwards ("pull", not "push"): for each dot on the canvas we UNWARP its position
// to find where it came from in model space, and ask the dunes there which zone it is in.
// That way every canvas pixel gets an answer, with no gaps or overlaps.

import { mapRange } from './math';

export type WarpSettings = {
    /** Power-curve exponent for y. 1 = no squeeze; < 1 pushes content down, > 1 pulls it up. */
    verticalCompression: number;
    /** Vertical sine wave: how many waves across the width, how tall, where it starts. */
    warpFreqY: number;
    warpAmplY: number;
    warpPhaseY: number;
    /** Horizontal sine wave (always 0 in this artwork, kept so the maths stays symmetrical). */
    warpFreqX: number;
    warpAmplX: number;
    warpPhaseX: number;
    /** Mirror the whole picture left ↔ right. */
    flipX: boolean;
};

// the power curve is applied to y + 0.05 over [0.05, 1.05] so y = 0 never hits pow(0, k)
const PAD = 0.05;
const PAD_END = 1.05;

export function createWarp(w: WarpSettings) {
    const powLo = Math.pow(PAD, w.verticalCompression);
    const powHi = Math.pow(PAD_END, w.verticalCompression);

    /** Model space → canvas. (`jitterX` is the optional blur nudge, see scene.ts.) */
    function warp(modelX: number, modelY: number, jitterX = 0): [number, number] {
        let x = modelX + jitterX;
        if (w.flipX) x = 1 - x;
        x += w.warpAmplX * Math.sin(w.warpPhaseX + w.warpFreqX * modelY);
        const wavyY = modelY + w.warpAmplY * Math.sin(w.warpPhaseY + w.warpFreqY * x);
        const y = mapRange(Math.pow(wavyY + PAD, w.verticalCompression), powLo, powHi, 0, 1);
        return [x, y];
    }

    /** Only the power curve, undone: used to place peaks at a chosen height on the canvas. */
    function unsqueezeY(canvasY: number): number {
        return Math.pow(mapRange(canvasY, 0, 1, powLo, powHi), 1 / w.verticalCompression) - PAD;
    }

    /** Canvas → model space: the exact reverse of warp(), step by step in reverse order. */
    function unwarp(canvasX: number, canvasY: number): [number, number] {
        const wavyY = unsqueezeY(canvasY);
        const y = wavyY - w.warpAmplY * Math.sin(w.warpPhaseY + w.warpFreqY * canvasX);
        let x = canvasX - w.warpAmplX * Math.sin(w.warpPhaseX + w.warpFreqX * y);
        if (w.flipX) x = 1 - x;
        return [x, y];
    }

    return { warp, unwarp, unsqueezeY };
}
