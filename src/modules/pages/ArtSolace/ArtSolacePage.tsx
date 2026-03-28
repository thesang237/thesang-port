'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Math ─────────────────────────────────────────────────────────────────────
const { min, floor, abs, sqrt, sin, pow, exp, log } = Math;
const TWO_PI = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mapRange = (v: number, s1: number, e1: number, s2: number, e2: number) => s2 + ((v - s1) * (e2 - s2)) / (e1 - s1);

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function cyrb128(s: string): [number, number, number, number] {
    let h1 = 1779033703,
        h2 = 3144134277,
        h3 = 1013904242,
        h4 = 2773480762;
    for (let i = 0; i < s.length; i++) {
        const k = s.charCodeAt(i);
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
function makeSfc32(a0: number, b0: number, c0: number, d0: number): () => number {
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
function makeGaussian(rng: () => number): () => number {
    let spare: number | null = null;
    return () => {
        if (spare !== null) {
            const s = spare;
            spare = null;
            return s;
        }
        let u: number, v: number, s: number;
        do {
            u = rng() * 2 - 1;
            v = rng() * 2 - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);
        const m = sqrt((-2 * log(s)) / s);
        spare = v * m;
        return u * m;
    };
}

// ─── Perlin noise (returns 0‥1) ───────────────────────────────────────────────
const G3 = [
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
const fadeCurve = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function makeNoise(seedN: number): (px: number, py?: number, pz?: number) => number {
    const rng = makeSfc32(...cyrb128(String(seedN)));
    const p = Array.from({ length: 256 }, (_: unknown, i: number) => i);
    for (let i = 255; i > 0; i--) {
        const j = floor(rng() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return (px: number, py = 0, pz = 0) => {
        const X = floor(px) & 255,
            Y = floor(py) & 255,
            Z = floor(pz) & 255;
        const x = px - floor(px),
            y = py - floor(py),
            z = pz - floor(pz);
        const u = fadeCurve(x),
            v = fadeCurve(y),
            w = fadeCurve(z);
        const A = perm[X] + Y,
            AA = perm[A] + Z,
            AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y,
            BA = perm[B] + Z,
            BB = perm[B + 1] + Z;
        const g = (h: number, dx: number, dy: number, dz: number) => {
            const gg = G3[h % 12];
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

// ─── Color ────────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
    const s = hex.replace('#', '');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function toRgba(hex: string, alpha255: number): string {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${(alpha255 / 255).toFixed(4)})`;
}

// ─── STYLES (from traits.js) ──────────────────────────────────────────────────
type Style = {
    name: string;
    bgColor: string;
    fillColor: string;
    fillAlpha: number;
    canSoft: boolean;
};

const COMMON_STYLES: Style[] = [
    { name: 'Shadow', bgColor: '#FFFFFF', fillColor: '#000000', fillAlpha: 80, canSoft: true },
    { name: 'Weather', bgColor: '#FEEFEC', fillColor: '#1E1C21', fillAlpha: 80, canSoft: true },
    { name: 'Weather', bgColor: '#FEEFEC', fillColor: '#1E1C21', fillAlpha: 80, canSoft: true },
    { name: 'Warm', bgColor: '#FFD7C2', fillColor: '#191919', fillAlpha: 80, canSoft: true },
    { name: 'Warm', bgColor: '#FFD7C2', fillColor: '#191919', fillAlpha: 80, canSoft: true },
    { name: 'Lamp', bgColor: '#FBE8DA', fillColor: '#00100B', fillAlpha: 80, canSoft: true },
    { name: 'Lamp', bgColor: '#FBE8DA', fillColor: '#00100B', fillAlpha: 80, canSoft: true },
    { name: 'Sweet', bgColor: '#FFC09F', fillColor: '#040404', fillAlpha: 80, canSoft: false },
    { name: 'Daze', bgColor: '#F0DED1', fillColor: '#543B3B', fillAlpha: 80, canSoft: true },
    { name: 'Secret', bgColor: '#FDEDF0', fillColor: '#25040B', fillAlpha: 80, canSoft: false },
    { name: 'Coffee', bgColor: '#FFF1D6', fillColor: '#5B3F34', fillAlpha: 80, canSoft: false },
    { name: 'Smart', bgColor: '#F5EFED', fillColor: '#0B2332', fillAlpha: 80, canSoft: false },
    { name: 'Mars', bgColor: '#DE8471', fillColor: '#221A23', fillAlpha: 80, canSoft: false },
    { name: 'Earth', bgColor: '#FFF3E4', fillColor: '#483434', fillAlpha: 80, canSoft: true },
    { name: 'Blood', bgColor: '#E45D50', fillColor: '#000000', fillAlpha: 80, canSoft: false },
];
const RARE_STYLES: Style[] = [
    { name: 'Polar', bgColor: '#5858C6', fillColor: '#09060F', fillAlpha: 80, canSoft: false },
    { name: 'Forest', bgColor: '#F3F6F6', fillColor: '#3D514D', fillAlpha: 80, canSoft: false },
    { name: 'Cold', bgColor: '#3255A4', fillColor: '#000000', fillAlpha: 80, canSoft: false },
    { name: 'Underworld', bgColor: '#27637C', fillColor: '#000000', fillAlpha: 60, canSoft: true },
    { name: 'Leaf', bgColor: '#FFFFFF', fillColor: '#407060', fillAlpha: 60, canSoft: true },
    { name: 'Lychee', bgColor: '#FFFFFF', fillColor: '#F15060', fillAlpha: 60, canSoft: false },
];
// Common styles appear 3× so rare styles are ~1/9 as likely to be picked
const STYLES: Style[] = [...COMMON_STYLES, ...COMMON_STYLES, ...COMMON_STYLES, ...RARE_STYLES];

// ─── Traits ───────────────────────────────────────────────────────────────────
type Traits = {
    Palette: string;
    Dunes: number;
    Sky: string;
    Margin: string;
    Brush: string;
    Render: string;
    Dusty: boolean;
    Misty: boolean;
    Dancers: boolean;
    Sandstorm: boolean;
};

function makeFeatures(fxrand: () => number): Traits {
    let a: number;
    const trait = STYLES[Math.floor(fxrand() * STYLES.length)];
    a = Math.floor(6 * fxrand());
    const dunes = fxrand() < 0.02 ? 120 : [1, 3, 6, 12, 24, 48][a];
    a = fxrand();
    const sky = a < 0.03 ? 'Tabula' : a < 0.14 ? 'Starry' : a < 0.2 ? 'Wool' : a < 0.35 ? 'Beam' : a < 0.6 ? 'Timelapse' : a < 0.8 ? 'Whisper' : 'Null';
    const sandstormThreshold = dunes >= 12 ? 0.12 : dunes >= 3 ? 0.04 : 0;
    return {
        Palette: trait.name,
        Dunes: dunes,
        Sky: sky,
        Margin: (a = fxrand()) < 0.6 ? 'None' : a < 0.9 ? 'Narrow' : 'Wide',
        Brush: (a = fxrand()) < 0.03 && sky !== 'Tabula' ? 'Grainy' : a < 0.9 || !trait.canSoft ? 'Sand' : 'Soft',
        Render: (a = fxrand()) < 0.65 || dunes >= 24 ? 'Simple' : a < 0.8 ? 'Refine' : a < 0.93 ? 'Banners' : 'Modulo',
        Dusty: sky !== 'Whisper' && sky !== 'Tabula' && fxrand() < 0.2,
        Misty: dunes > 1 && (dunes === 3 || dunes === 6 || fxrand() < 0.6),
        Dancers: dunes >= 6 && fxrand() < 0.03,
        Sandstorm: fxrand() < sandstormThreshold,
    };
}

// ─── Peak ─────────────────────────────────────────────────────────────────────
type Peak = {
    peakX: number;
    peakY: number;
    // Controls the diagonal angle of the two boundary scan lines (the "V" shape of the dune)
    diagonalSlope: number;
    // Resolution of the boundary hash map: higher = finer grid = more detailed silhouette
    keyResolution: number;
    // boundary1 and boundary2 are hash maps: key → first Y where the walk crossed that diagonal slice.
    // Together they form the mountain silhouette: dark inside both, light inside one, sky outside both.
    boundary1: Record<number, number>;
    boundary2: Record<number, number>;
};

const SHADE_DARK = 0,
    SHADE_LIGHT = 1,
    SHADE_SKY = 2;
const TOTAL_DOTS = 8000;

// ─── Scene builder (mirrors p5 setup()) ──────────────────────────────────────
function buildScene(seed: string, size: number) {
    // Two-stage seeding: fxrand determines traits, then its next value seeds rendering RNG.
    // This matches the original: makeFeatures() consumes fxrand N times, then
    // setup() calls `const a = 1e9 * fxrand()` to get the rendering seed.
    const fxrand = makeSfc32(...cyrb128(seed));
    const traits = makeFeatures(fxrand);
    const style = STYLES.find((s) => s.name === traits.Palette)!;

    const renderSeed = 1e9 * fxrand();
    const rng = makeSfc32(...cyrb128(String(renderSeed)));
    const randGaussian = makeGaussian(rng);
    const noise = makeNoise(renderSeed);

    // p5-style random: random(), random(hi), random(lo, hi), random(arr[])
    // All array args in this art hold numbers, so number return is always correct
    function random(...args: unknown[]): number {
        if (!args.length) return rng();
        if (Array.isArray(args[0])) return (args[0] as number[])[floor(rng() * (args[0] as number[]).length)];
        if (args.length === 1) return rng() * (args[0] as number);
        return (args[0] as number) + rng() * ((args[1] as number) - (args[0] as number));
    }

    // ── Sky dot density ──
    // skyProb controls how densely sky dots are drawn (1 = fully pixelated, 0.5 = sparse)
    let skyProb = random([0.5, 0.8, 0.8, 1, 1]);
    if (traits.Sky === 'Tabula')
        skyProb = 1; // fully pixelated sky
    else if (traits.Sky === 'Timelapse') skyProb = random([0.8, 1]);
    else if (traits.Sky === 'Starry')
        skyProb = random([0.5, 0.8, 0.8]); // sparser sky
    else if (traits.Sky === 'Null') skyProb = random([0.8, 1]);

    const numPeaks = traits.Dunes;

    // Horizontal mirror: 20% chance to flip the entire composition
    const isFlipX = random() < 0.2;

    // These variables exist in the full art but are unused in this simplified render.
    // Their random() calls must still happen to keep the RNG sequence in sync with
    // the original, so peak shapes and warp parameters come out the same.
    void (!(traits.Sky === 'Starry' || traits.Sky === 'Wool') && random() < (traits.Dusty ? 0.8 : 0.1)); // isNoisyDark
    void (traits.Sky === 'Beam' || traits.Sky === 'Timelapse' || traits.Sky === 'Whisper' || skyProb < 0.6 || random() < 0.92); // isSandLines

    // Gaussian blur applied to each dot's X position before drawing (only for dense peak scenes)
    const isBlur = numPeaks >= 6 && random() < 0.15;

    // Diagonal shear: rare transform that leans the whole composition left or right
    let isSkewLeft = false,
        isSkewRight = false;
    if (random() < 0.03) {
        isSkewLeft = random() < 0.5;
        isSkewRight = !isSkewLeft;
    }

    // Misty layout: shifts all peaks to one side for a zoomed-in atmospheric look
    const isMistyLayout = !traits.Misty && numPeaks >= 6 && numPeaks <= 12 && random() < 0.1;

    // ── Vertical warp parameters ──
    // The Y axis is compressed by a power curve, pushing peaks into the lower portion of the canvas.
    // Fewer peaks → stronger compression (0.4–0.5); many peaks → wider range (0.4–1.3)
    const verticalCompression = numPeaks <= 3 ? random(0.4, 0.5) : random(0.4, 1.3);

    // Sine-wave distortion applied across X and Y axes
    const warpPhaseX = random(TWO_PI); // random phase offset for horizontal wave
    const warpPhaseY = random(TWO_PI); // random phase offset for vertical wave
    const warpFreqX = 0; // X-axis wave disabled (amplitude is also 0)
    const warpAmplX = 0;
    // Fewer peaks → slower, smoother wave; many peaks → faster wave for denser scenes
    const warpFreqY = random() < 0.06 ? random(2, 3) : numPeaks <= 3 ? random(6, 8) : random(6, 12);
    // Amplitude is log-uniformly distributed so it can range from subtle to dramatic
    const warpAmplY = exp(random(log(0.1), log(0.3))) / warpFreqY;

    // Canvas margin (normalized 0–1): determines the drawable area
    const marginMin = traits.Margin === 'Narrow' ? 0.01 : traits.Margin === 'Wide' ? 0.06 : 0;
    const marginMax = 1 - marginMin;

    // Vignette probability – only sampled when Margin is 'None' (advance RNG to stay in sync)
    if (traits.Margin === 'None') random();

    // Gust: wind-swept curve at the peak tip – unused in simplified draw (advance RNG only)
    void ((numPeaks === 1 && random() < 0.94) || (numPeaks === 3 && random() < 0.5));
    let _gH = random(0.06, 0.09) * (numPeaks === 3 ? 0.6 : 1);
    let _gW = random(0.1, 0.15);
    if (random() < 0.1) {
        _gH *= 1.6;
        _gW *= 1.6;
    } else if (random() < 0.15) {
        _gH *= 0.7;
    }

    // isSmoothKey: when true, all peaks get keyResolution=600, creating extremely fine,
    // smooth silhouette edges (like a keyframe/smooth interpolation between peaks)
    const isSmoothKey = random() < 0.02;

    // The following 11 random() calls produce sky-related parameters (sand lines, stratus
    // clouds, pixel grid, scratch gradients) that are only used in the full sky renderer.
    // They must run here to keep the RNG sequence aligned with the original art's setup().
    random([0.01, 0.01, 0.015]); // sandLineWidth
    if (numPeaks < 5) random(-1, 1); // moduloOffset (only sampled for low peak counts)
    void (random() < 0.05 && !style.canSoft ? 1e3 : random([0.4, 0.7, 1, 1, 1, 1, 1, 2, 3])); // sunlightRadiusMod
    random([0, 0.1, 0.2, 0.6, 0.8, -0.1, -0.2, -0.6, -0.8]); // stratusGradient
    random([30, 60]); // stratusScale
    random(-1.2, 0.2); // stratusOffset
    random(); // isStratusParabola
    random([0, 0.1, -0.1]); // cloudGradient
    random(0.2, 0.6); // scratchGradient1
    random(0.2, 0.6); // scratchGradient2
    random(0.2, 0.6); // scratchGradient3
    random(0.06, 0.12); // pixelQ
    random(0.2, 0.8); // pixelOffsetX
    random(0.2, 0.8); // pixelOffsetY

    // ── Peak placement parameters ──────────────────────────────────────────────
    // Peaks are placed in normalized Y space between peakYTop and peakYBottom.
    // Occasional variants push peaks higher (lower Y) for a more dramatic composition.
    let peakYBottom = random() < 0.4 ? 0.4 : 0.2; // top boundary for peak placement
    let peakYTop = random() < 0.12 ? 0.7 : 0.8; // bottom boundary for peak placement

    // depthCurve is a power-curve exponent controlling how peaks spread from front to back.
    // Values < 1 cluster peaks near the front; values > 1 spread them toward the back.
    const depthCurve = random([0.5, 0.6, 0.7, 0.8, 1]);

    // peakScale controls how tall peaks can be (as fraction of canvas).
    // Dancer mode tends toward taller peaks; rare 5% chance for very tall peaks.
    let peakScale = numPeaks === 1 ? random([0.6, 0.7, 0.8]) : random() < 0.05 ? random([1, 1.5]) : random([0.5, 0.6, 0.7, 0.8]);
    if (traits.Dancers) {
        peakScale = random([0.8, 0.8, 1, 1, 1.2]); // Dancers always use taller peaks
    }

    // peakHeightFactor is unused in the simplified render (advance RNG to stay in sync)
    void (numPeaks === 1 ? peakScale : isMistyLayout ? 0.7 * peakScale : 0.5 * peakScale);

    // Special peaks (wavy, more dramatic) apply when there are many dunes
    const hasSpecialPeaks = numPeaks > 6 || (numPeaks === 6 && random() < 0.8);

    // Rare variant: push all peaks into a tight high band
    if (random() < 0.04) {
        peakYBottom = 0.55;
        peakYTop = 0.8;
    } else if (random() < 0.03) {
        peakYBottom = 0.65;
        peakYTop = 0.8;
    }

    // ── Coordinate-space helpers ───────────────────────────────────────────────

    // Converts a Y position from warped space back to unwarped space.
    // Used during peak placement so peakY values are meaningful in the boundary maps.
    function unwarpY(warpedY: number): number {
        const powerSpaceY = mapRange(warpedY, 0, 1, pow(0.05, verticalCompression), pow(1.05, verticalCompression));
        return pow(powerSpaceY, 1 / verticalCompression) - 0.05;
    }

    // Maps a canvas point (x, y) to two integer "keys" used as hash-map indices into a
    // peak's boundary maps. Each key selects a diagonal scan line through the peak:
    //   key1 indexes a line going /  (slope: -diagonalSlope)  → left flank of the dune
    //   key2 indexes a line going \  (slope: +diagonalSlope)  → right flank of the dune
    // Combining both keys determines whether a point falls in the dark core, lit slope, or sky.
    function makeBoundaryKeys(x: number, y: number, diagonalSlope: number, keyResolution: number): [number, number] {
        let cx = x,
            cy = y;

        // Sandstorm: adds vertical noise scatter to break up crisp boundary edges
        if (traits.Sandstorm && noise(30 * cx, 30 * cy) % 0.1 < 0.005) {
            cy += 0.18 * randGaussian();
        }

        // Dancers: adds lateral sine-wave undulation so ridges appear to sway
        if (traits.Dancers) {
            cx += 0.15 * sin(12 * cy);
        }

        // Skew: shears the entire key space left or right for a slanted composition
        const skewAmount = numPeaks <= 3 ? 0.5 : 1;
        if (isSkewLeft) cx -= skewAmount * cy;
        else if (isSkewRight) cx += skewAmount * cy;

        const leftKey = floor((cy - diagonalSlope * cx) * keyResolution);
        const rightKey = floor((cy + diagonalSlope * cx) * keyResolution);
        return [leftKey, rightKey];
    }

    // Traces a path downward from the peak apex, oscillating left/right like a
    // wind-blown sand dune ridge. At each step, records the first Y where the path
    // crosses each diagonal scan line, building the left and right boundary maps.
    function createPeak(px: number, py: number, diagonalSlope: number, keyResolution: number, isSpecial: boolean): Peak {
        // Two independent sine-wave oscillators give the ridge its organic shape.
        // Each has its own frequency, amplitude, and phase, all randomly chosen.
        const wave1Freq = random(5, 10);
        const wave1Amp = random(2e-4, 3e-4) * random([-1, 1]);
        const wave1Phase = random(TWO_PI);

        const wave2Freq = random(10, 30) + (random() < 0.15 ? 15 : 0); // occasional high-freq component
        let wave2Amp = random(0.001, 0.0015) * random([-1, 1]);
        const wave2Phase = random(TWO_PI);

        // 15% chance to silence the second oscillator, producing a smoother single-wave ridge
        if (random() < 0.15) wave2Amp = 0;

        let walkX = px; // current horizontal position as we descend from the peak
        let walkY = py; // current vertical position (increments down toward canvas bottom)
        const boundary1: Record<number, number> = {};
        const boundary2: Record<number, number> = {};

        while (walkY < marginMax + 0.1) {
            // Drift slightly left on every step (baseline downward lean)
            walkX -= 2e-4;
            walkY += 0.001;

            // For special (wavy) peaks, amplitude grows quadratically with distance from apex,
            // creating dramatic flaring wings. Normal peaks use a gentler linear growth.
            const waveScale = isSpecial ? mapRange((walkY - py) * (walkY - py) * numPeaks, 0, 1, 0.5, 10) : mapRange(walkY - py, 0, 1, 0.5, 1);

            walkX += wave1Amp * waveScale * sin(wave1Phase + wave1Freq * pow(walkY, 0.5));
            walkX += wave2Amp * waveScale * sin(wave2Phase + wave2Freq * pow(walkY, 0.5));

            // Store the first time this walk visits each diagonal scan line.
            // That first-visit Y becomes the boundary surface of the dune at that slice.
            const [leftKey, rightKey] = makeBoundaryKeys(walkX, walkY, diagonalSlope, keyResolution);
            if (!boundary1[leftKey]) boundary1[leftKey] = walkY;
            if (!boundary2[rightKey]) boundary2[rightKey] = walkY;
        }

        return { peakX: px, peakY: py, diagonalSlope, keyResolution, boundary1, boundary2 };
    }

    // ── Place all peaks ────────────────────────────────────────────────────────
    const peaks: Peak[] = [];
    for (let i = 0; i < numPeaks; i++) {
        // Map peak index to a [0, 1] depth value, then curve it so later peaks feel more distant
        const normalizedDepth = mapRange(i, 0, numPeaks, 0, 1);
        const curvedDepth = pow(normalizedDepth, depthCurve);

        // X position: mostly free, but the middle peak and small sets are nudged toward center
        let peakX = random(-0.1, 1.1);
        if (i === 2) peakX = random(0.3, 0.7);
        else if (numPeaks === 3 || numPeaks === 6) peakX = random(0.2, 0.8);

        // Y position: lerp from bottom to top boundary using the curved depth
        let peakY = unwarpY(lerp(peakYTop, peakYBottom, curvedDepth));

        // keyResolution scales with depth so distant (higher-indexed) peaks have finer boundaries
        let keyResolution = lerp(random(110, 160), 300, pow(normalizedDepth, 0.7));

        // The last peak in a dense scene is sometimes centered for a focal-point effect
        if (numPeaks >= 6 && i === numPeaks - 1 && random() < 0.6) {
            peakX = random(0.4, 0.6);
            if (numPeaks >= 12 && random() < 0.2) peakY -= 0.05; // push it slightly higher
        }

        // Single-peak compositions get their own special placement rules
        if (numPeaks === 1) {
            peakY = unwarpY(random() < 0.6 ? random(0.35, 0.6) : random(0.35, 0.7));
            peakX = random() < 0.6 ? random(0.5, 0.6) : random(0.35, 0.75);
            keyResolution = random(100, 130);
        }

        // isSmoothKey overrides keyResolution to maximum for ultra-smooth silhouettes
        if (isSmoothKey) keyResolution = 600;

        // Misty layout stacks peaks diagonally from right (front) to left (back)
        if (isMistyLayout) {
            peakX = lerp(0.7, 0.1, normalizedDepth) + (1 - normalizedDepth) * random(-0.2, 0.2);
        }

        // Retry placement if this peak overlaps an already-placed one
        for (let retry = 0; retry < 20; retry++) {
            const hasConflict = peaks.some((p) => abs(peakX - p.peakX) < 0.05 && abs(peakY - p.peakY) < 0.1);
            if (!hasConflict) break;
            peakX += random([-0.1, 0.1]); // nudge horizontally to resolve overlap
        }

        // diagonalSlope controls the angle of the "V" scan lines.
        // It is sampled between the peak index and peakScale, so more prominent peaks
        // (higher index) get steeper diagonals, widening the dune silhouette.
        const isSpecial = hasSpecialPeaks && i > (random() < 0.6 ? 0 : 1);
        const diagonalSlope = random(i, peakScale);
        peaks.push(createPeak(peakX, peakY, diagonalSlope, keyResolution, isSpecial));
    }

    // ── Pre-compute drawing params ─────────────────────────────────────────────
    // Grainy brush stacks 100 transparent frames for full opacity; Sand uses one pass at face value
    const alphaFactor = traits.Brush === 'Grainy' ? 100 : traits.Brush === 'Sand' ? 1 : 0.3;
    const fillAlpha = min(255, style.fillAlpha * alphaFactor);
    const fillStyle = toRgba(style.fillColor, fillAlpha);
    const totalFrames = traits.Brush === 'Grainy' ? 100 : 50;

    // ── Coordinate distortion (warp / unwarp) ─────────────────────────────────
    // Before drawing, every canvas point is run through warp() to distort the composition.
    // Before shade-testing, the warped point is run through unwarp() to look it up in
    // the boundary maps, which were built in unwarped space.

    // Applies distortion to a canvas point:
    //   1. Optional Gaussian jitter (when isBlur: smooths edges on dense scenes)
    //   2. Optional horizontal flip
    //   3. Sine-wave undulation along Y (creates the wavy horizon effect)
    //   4. Power-curve compression of Y (pushes all content into the lower portion)
    function warp(xin: number, yin: number): [number, number] {
        let x = xin;
        if (isBlur) x += 0.001 * randGaussian(); // sub-pixel jitter for soft edges
        if (isFlipX) x = 1 - x;
        x += warpAmplX * sin(warpPhaseX + warpFreqX * yin); // horizontal sine wave (disabled: amplX = 0)
        const sinOffset = warpAmplY * sin(warpPhaseY + warpFreqY * x);
        const rawY = yin + sinOffset; // vertical sine wave shifts Y
        const powY = pow(rawY + 0.05, verticalCompression); // power-curve compresses Y toward bottom
        const y = mapRange(powY, pow(0.05, verticalCompression), pow(1.05, verticalCompression), 0, 1);
        return [x, y];
    }

    // Reverses the warp transform to map a canvas point back into the boundary-map space.
    // Only Y needs to be fully reversed; X flip is symmetric.
    function unwarp(xin: number, yin: number): [number, number] {
        // Invert power-curve compression
        const powY = mapRange(yin, 0, 1, pow(0.05, verticalCompression), pow(1.05, verticalCompression));
        const rawY = pow(powY, 1 / verticalCompression) - 0.05;
        // Invert vertical sine wave
        const y = rawY - warpAmplY * sin(warpPhaseY + warpFreqY * xin);
        // Invert horizontal sine wave (disabled: amplX = 0) and flip
        let x = xin - warpAmplX * sin(warpPhaseX + warpFreqX * y);
        if (isFlipX) x = 1 - x;
        return [x, y];
    }

    // Determines whether a point (in unwarped boundary-map space) falls in the
    // dark core, lit slope, or open sky of the nearest dune.
    //
    // Each peak stores two boundary maps (left flank and right flank).
    // For a given point, we compute its two diagonal keys and look them up:
    //   - Both boundaries present and rightBound > leftBound  → inside the dark core
    //   - Only leftBound present (leftBound > rightBound)      → on the lit slope
    //   - Neither boundary present                             → open sky
    function calcShade(x: number, y: number): [number, Peak | null] {
        for (const peak of peaks) {
            const [leftKey, rightKey] = makeBoundaryKeys(x, y, peak.diagonalSlope, peak.keyResolution);

            // A boundary value only counts if the point is below (greater Y than) where
            // the walk first crossed that slice; above the crossing = outside the mountain
            let leftBound = peak.boundary1[leftKey] ?? 0;
            if (y <= leftBound) leftBound = 0;

            let rightBound = peak.boundary2[rightKey] ?? 0;
            if (y <= rightBound) rightBound = 0;

            if (rightBound > leftBound) return [SHADE_DARK, peak]; // inside both flanks = dark core
            if (leftBound > rightBound) return [SHADE_LIGHT, peak]; // inside left flank only = lit slope
        }
        return [SHADE_SKY, null];
    }

    // ── Per-frame dot renderer ─────────────────────────────────────────────────
    // Each frame scatters TOTAL_DOTS randomly across the canvas (Simple render mode).
    // Y progresses linearly from top to bottom across all frames, so the image builds
    // up gradually like sand settling — always from marginMin to marginMax.
    function drawFrame(ctx: CanvasRenderingContext2D, frameCount: number): boolean {
        if (frameCount >= totalFrames) return false;

        // Advance the Gaussian RNG once per frame to stay in sync with the original art,
        // which also called warp() on the last peak at the start of each draw() call.
        warp(peaks[peaks.length - 1].peakX, peaks[peaks.length - 1].peakY);

        ctx.fillStyle = fillStyle;

        for (let i = 0; i < TOTAL_DOTS; i++) {
            // Global progress 0→1 across all frames drives Y from top to bottom
            const progress = (TOTAL_DOTS * frameCount + i) / (TOTAL_DOTS * totalFrames);

            // Simple render: X is random, Y sweeps linearly (original hard-codes this mode)
            const x = random(marginMin, marginMax);
            const y = lerp(marginMin, marginMax, progress);

            // Look up this point in unwarped boundary space to determine its shade
            const [uwX, uwY] = unwarp(x, y);
            const [shade] = calcShade(uwX, uwY);

            // Draw probability by shade zone:
            //   dark core  → always draw (builds solid dune body)
            //   lit slope  → 10% draw (creates sparse, grainy highlight texture)
            //   sky        → skyProb draw (density controlled by Sky trait)
            const drawProbability = shade === SHADE_DARK ? 1 : shade === SHADE_LIGHT ? 0.1 : skyProb;
            if (random() <= drawProbability) {
                const dotSize = 0.0012 * size; // ~1.2 px on a 1000 px canvas
                ctx.fillRect(x * size, y * size, dotSize, dotSize);
            }
        }

        return true;
    }

    return { bgColor: style.bgColor, totalFrames, drawFrame };
}

// ─── Component ────────────────────────────────────────────────────────────────
function randomSeed(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function ArtSolacePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const [status, setStatus] = useState<'loading' | 'drawing' | 'done'>('loading');
    const [bgColor, setBgColor] = useState('#F0DED1');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const DPR = 2; // fixed pixel density, matching original pixelDensity(2)
        const size = min(window.innerWidth, window.innerHeight);
        canvas.width = size * DPR;
        canvas.height = size * DPR;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(DPR, DPR);

        const seed = randomSeed();
        const scene = buildScene(seed, size);
        setBgColor(scene.bgColor);

        ctx.fillStyle = scene.bgColor;
        ctx.fillRect(0, 0, size, size);

        setStatus('drawing');
        let frame = 0;

        function tick() {
            const alive = scene.drawFrame(ctx!, frame);
            frame++;
            if (alive && frame < scene.totalFrames) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setStatus('done');
            }
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: bgColor }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs tracking-widest uppercase opacity-40" style={{ color: '#555' }}>
                        Generating…
                    </span>
                </div>
            )}
        </div>
    );
}
