// ─── Scene parameters ────────────────────────────────────────────────────────
// Every number that shapes the picture, rolled from the seed in one place. This is the file to
// read first if you want to know "what can change between two seeds", and the list the debug
// panel exposes.
//
// Overrides: any value can be forced (debug panel, or your own code). The seeded value is still
// rolled first and then replaced, so forcing one value never reshuffles the others.

import type { Palette } from './palettes';
import type { Random } from './random';
import type { Traits } from './traits';

export type Skew = 'none' | 'left' | 'right';

export type SceneParams = {
    // ── composition ──
    /** Mirror the picture left ↔ right (20 %). */
    flipX: boolean;
    /** Shear the stripe field so every dune leans (3 %). */
    skew: Skew;
    /** Stack the dunes diagonally, front-right to back-left (busy scenes without the Misty trait, 10 %). */
    mistyLayout: boolean;
    /** Blank border, as a fraction of the canvas (from the Margin trait). */
    margin: number;

    // ── warp (see warp.ts) ──
    verticalCompression: number;
    warpFreqY: number;
    warpAmplY: number;
    warpPhaseY: number;
    warpFreqX: number;
    warpAmplX: number;
    warpPhaseX: number;

    // ── dunes (see dunes.ts) ──
    /** Canvas height of the front dune's peak (0 = top, 1 = bottom). */
    nearY: number;
    /** Canvas height of the back dune's peak. */
    farY: number;
    /** How the dunes spread between nearY and farY: < 1 bunches them at the back, 1 = even. */
    depthCurve: number;
    /** Upper bound for the stripe slope: bigger = wider dunes. */
    peakScale: number;
    /** Busy scenes get flaring, wavy ridges. */
    specialPeaks: boolean;
    /** Every dune uses 600 stripes per unit (ultra-smooth edges, 2 %). */
    smoothEdges: boolean;
    /** Ridge sway multiplier (not seeded: 1 = as rolled). */
    ridgeWobble: number;
    /** Ridge sideways drift per step (not seeded). */
    ridgeLean: number;
    /** Ridge walk step (not seeded). */
    ridgeStep: number;

    // ── sand brush ──
    /** Chance a dot in the sky is drawn (from the Sky trait). */
    skyDensity: number;
    /** Chance a dot on a dune's lit slope is drawn. */
    slopeDensity: number;
    /** Chance a dot in a dune's core is drawn. */
    coreDensity: number;
    /** Soften edges by nudging x with a tiny bell-curve jitter (busy scenes, 15 %). */
    blur: boolean;
    /** Dots tried per frame. */
    dotsPerFrame: number;
    /** Frames to finish the picture (the scan goes top → bottom once). */
    frames: number;
    /** Dot size as a fraction of the canvas (0.0012 ≈ 1.2 px on a 1000 px canvas). */
    dotSize: number;
    paper: string;
    ink: string;
    /** Ink opacity, 0–255. */
    inkAlpha: number;
};

export type SceneOverrides = Partial<SceneParams>;

/** Roll the scene from the render stream. `traits` are final (trait overrides already applied). */
export function rollSceneParams(rand: Random, traits: Traits, palette: Palette, overrides: SceneOverrides = {}): SceneParams {
    // keep the seeded value unless an override is given
    const choose = <K extends keyof SceneParams>(key: K, seeded: SceneParams[K]): SceneParams[K] => overrides[key] ?? seeded;
    const numPeaks = traits.Dunes;
    const sky = traits.Sky;

    // ── how dense the sky grain is ──
    let skyDensity = rand.pick([0.5, 0.8, 0.8, 1, 1]);
    if (sky === 'Tabula') skyDensity = 1;
    else if (sky === 'Timelapse') skyDensity = rand.pick([0.8, 1]);
    else if (sky === 'Starry') skyDensity = rand.pick([0.5, 0.8, 0.8]);
    else if (sky === 'Null') skyDensity = rand.pick([0.8, 1]);

    const flipX = rand.chance(0.2);

    // ⟲ legacy draws: the original art used these for features this port doesn't draw.
    //   They still take their random numbers so every seed keeps its original dunes.
    if (!(sky === 'Starry' || sky === 'Wool')) rand.next(); // ⟲ isNoisyDark
    if (!(sky === 'Beam' || sky === 'Timelapse' || sky === 'Whisper' || skyDensity < 0.6)) rand.next(); // ⟲ isSandLines

    const blur = numPeaks >= 6 && rand.chance(0.15);

    let skew: Skew = 'none';
    if (rand.chance(0.03)) skew = rand.chance(0.5) ? 'left' : 'right';

    const mistyLayout = !traits.Misty && numPeaks >= 6 && numPeaks <= 12 && rand.chance(0.1);

    // ── warp ──
    const verticalCompression = numPeaks <= 3 ? rand.range(0.4, 0.5) : rand.range(0.4, 1.3);
    const warpPhaseX = rand.range(0, Math.PI * 2);
    const warpPhaseY = rand.range(0, Math.PI * 2);
    const warpFreqX = 0; // the horizontal wave is switched off in this artwork
    const warpAmplX = 0;
    // fewer dunes → a slower, smoother horizon wave; 6 % of seeds get a very slow one
    const warpFreqY = rand.chance(0.06) ? rand.range(2, 3) : numPeaks <= 3 ? rand.range(6, 8) : rand.range(6, 12);
    // amplitude is spread evenly on a log scale (as many subtle waves as strong ones), and divided by
    // the frequency so fast waves stay short
    const warpAmplY = Math.exp(rand.range(Math.log(0.1), Math.log(0.3))) / warpFreqY;

    const margin = traits.Margin === 'Narrow' ? 0.01 : traits.Margin === 'Wide' ? 0.06 : 0;

    if (traits.Margin === 'None') rand.next(); // ⟲ vignette
    if (numPeaks === 1 || numPeaks === 3) rand.next(); // ⟲ hasGust
    rand.next(); // ⟲ gustHeight
    rand.next(); // ⟲ gustWidth
    if (!rand.chance(0.1)) rand.next(); // ⟲ gust size variant

    const smoothEdges = rand.chance(0.02);

    rand.next(); // ⟲ sandLineWidth
    if (numPeaks < 5) rand.next(); // ⟲ moduloOffset
    if (!(rand.next() < 0.05 && !palette.canSoft)) rand.next(); // ⟲ sunlightRadius
    rand.next(); // ⟲ stratusGradient
    rand.next(); // ⟲ stratusScale
    rand.next(); // ⟲ stratusOffset
    rand.next(); // ⟲ isStratusParabola
    rand.next(); // ⟲ cloudGradient
    rand.next(); // ⟲ scratchGradient1
    rand.next(); // ⟲ scratchGradient2
    rand.next(); // ⟲ scratchGradient3
    rand.next(); // ⟲ pixelQ
    rand.next(); // ⟲ pixelOffsetX
    rand.next(); // ⟲ pixelOffsetY

    // ── where the dunes sit ──
    let farY = rand.chance(0.4) ? 0.4 : 0.2;
    let nearY = rand.chance(0.12) ? 0.7 : 0.8;
    const depthCurve = rand.pick([0.5, 0.6, 0.7, 0.8, 1]);

    let peakScale = numPeaks === 1 ? rand.pick([0.6, 0.7, 0.8]) : rand.chance(0.05) ? rand.pick([1, 1.5]) : rand.pick([0.5, 0.6, 0.7, 0.8]);
    if (traits.Dancers) peakScale = rand.pick([0.8, 0.8, 1, 1, 1.2]);

    const specialPeaks = numPeaks > 6 || (numPeaks === 6 && rand.chance(0.8));

    // rare: squeeze every peak into a thin band near the bottom
    if (rand.chance(0.04)) {
        farY = 0.55;
        nearY = 0.8;
    } else if (rand.chance(0.03)) {
        farY = 0.65;
        nearY = 0.8;
    }

    // ── brush ──
    // Grainy stacks solid ink over 100 frames; Soft is faint; Sand uses the palette as is
    const inkStrength = traits.Brush === 'Grainy' ? 100 : traits.Brush === 'Sand' ? 1 : 0.3;

    return {
        flipX: choose('flipX', flipX),
        skew: choose('skew', skew),
        mistyLayout: choose('mistyLayout', mistyLayout),
        margin: choose('margin', margin),
        verticalCompression: choose('verticalCompression', verticalCompression),
        warpFreqY: choose('warpFreqY', warpFreqY),
        warpAmplY: choose('warpAmplY', warpAmplY),
        warpPhaseY: choose('warpPhaseY', warpPhaseY),
        warpFreqX: choose('warpFreqX', warpFreqX),
        warpAmplX: choose('warpAmplX', warpAmplX),
        warpPhaseX: choose('warpPhaseX', warpPhaseX),
        nearY: choose('nearY', nearY),
        farY: choose('farY', farY),
        depthCurve: choose('depthCurve', depthCurve),
        peakScale: choose('peakScale', peakScale),
        specialPeaks: choose('specialPeaks', specialPeaks),
        smoothEdges: choose('smoothEdges', smoothEdges),
        ridgeWobble: choose('ridgeWobble', 1),
        ridgeLean: choose('ridgeLean', 2e-4),
        ridgeStep: choose('ridgeStep', 0.001),
        skyDensity: choose('skyDensity', skyDensity),
        slopeDensity: choose('slopeDensity', 0.1),
        coreDensity: choose('coreDensity', 1),
        blur: choose('blur', blur),
        dotsPerFrame: choose('dotsPerFrame', 8000),
        frames: choose('frames', traits.Brush === 'Grainy' ? 100 : 50),
        dotSize: choose('dotSize', 0.0012),
        paper: choose('paper', palette.paper),
        ink: choose('ink', palette.ink),
        inkAlpha: choose('inkAlpha', Math.min(255, palette.inkAlpha * inkStrength)),
    };
}
