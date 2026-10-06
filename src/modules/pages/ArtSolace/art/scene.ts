// ─── Scene ───────────────────────────────────────────────────────────────────
// Puts the pieces together, in the order the original artwork did:
//
//   seed ─► traits stream ─► traits ─► (next number) ─► render stream ─► scene params
//        ─► dunes (ridge walks + boundary maps) ─► drawFrame(): scatter sand, frame by frame
//
// buildScene() does all the deciding up front; drawFrame() only draws.

import { createPeak, type KeySpace, type Peak, Shade, shadeAt } from './dunes';
import { lerp } from './math';
import { createNoise } from './noise';
import { hexToRgba, type Palette, paletteByName } from './palettes';
import { rollSceneParams, type SceneOverrides, type SceneParams } from './params';
import { createRandom, type Random } from './random';
import { rollTraits, type Traits } from './traits';
import { createWarp } from './warp';

export type ArtOverrides = {
    /** Applied before the scene is rolled: changing a trait can reshuffle the composition. */
    traits?: Partial<Traits>;
    /** Applied after: forcing a number never changes anything else. */
    params?: SceneOverrides;
};

export type Scene = ReturnType<typeof buildScene>;

/** Place every dune: x, peak height, stripe slope and resolution, then walk its ridge. */
function placePeaks(rand: Random, keys: KeySpace, params: SceneParams, numPeaks: number, unsqueezeY: (y: number) => number): Peak[] {
    const peaks: Peak[] = [];
    const stopY = 1 - params.margin + 0.1; // walk a little past the bottom edge

    for (let i = 0; i < numPeaks; i++) {
        // 0 = front dune, → 1 = back dune
        const depth = i / numPeaks;
        const curvedDepth = Math.pow(depth, params.depthCurve);

        // x: anywhere (even just off canvas), but the 3rd dune and small scenes are kept nearer the middle
        let peakX = rand.range(-0.1, 1.1);
        if (i === 2) peakX = rand.range(0.3, 0.7);
        else if (numPeaks === 3 || numPeaks === 6) peakX = rand.range(0.2, 0.8);

        // y: from nearY (front) to farY (back), chosen on the canvas then un-squeezed into model space
        let peakY = unsqueezeY(lerp(params.nearY, params.farY, curvedDepth));

        // dunes further back get finer edges (they're smaller on the canvas)
        let keyResolution = lerp(rand.range(110, 160), 300, Math.pow(depth, 0.7));

        // busy scenes: the back dune is often centred, a focal point
        if (numPeaks >= 6 && i === numPeaks - 1 && rand.chance(0.6)) {
            peakX = rand.range(0.4, 0.6);
            if (numPeaks >= 12 && rand.chance(0.2)) peakY -= 0.05;
        }

        // a single dune has its own placement rules
        if (numPeaks === 1) {
            peakY = unsqueezeY(rand.chance(0.6) ? rand.range(0.35, 0.6) : rand.range(0.35, 0.7));
            peakX = rand.chance(0.6) ? rand.range(0.5, 0.6) : rand.range(0.35, 0.75);
            keyResolution = rand.range(100, 130);
        }

        if (params.smoothEdges) keyResolution = 600;

        if (params.mistyLayout) {
            peakX = lerp(0.7, 0.1, depth) + (1 - depth) * rand.range(-0.2, 0.2);
        }

        // don't stack two peaks on top of each other: nudge sideways (up to 20 tries)
        for (let retry = 0; retry < 20; retry++) {
            const clash = peaks.some((p) => Math.abs(peakX - p.peakX) < 0.05 && Math.abs(peakY - p.peakY) < 0.1);
            if (!clash) break;
            peakX += rand.pick([-0.1, 0.1]);
        }

        // wavy ridges for every dune except the first one (or two)
        const isSpecial = params.specialPeaks && i > (rand.chance(0.6) ? 0 : 1);
        // dunes further back may get steeper stripes (wider shapes)
        const diagonalSlope = rand.range(i, params.peakScale);

        peaks.push(
            createPeak(rand, keys, {
                peakX,
                peakY,
                diagonalSlope,
                keyResolution,
                isSpecial,
                numPeaks,
                stopY,
                wobble: params.ridgeWobble,
                lean: params.ridgeLean,
                step: params.ridgeStep,
            }),
        );
    }
    return peaks;
}

export function buildScene(seed: string, size: number, overrides: ArtOverrides = {}) {
    // 1. traits come from their own stream (fxhash-style "fxrand")…
    const traitRand = createRandom(seed);
    const traits: Traits = { ...rollTraits(traitRand), ...overrides.traits };
    const palette: Palette = paletteByName(traits.Palette);

    // 2. …whose next number seeds the render stream and the noise
    const renderSeed = 1e9 * traitRand.next();
    const rand = createRandom(String(renderSeed));
    const noise = createNoise(renderSeed);

    // 3. every scene-level choice
    const params = rollSceneParams(rand, traits, palette, overrides.params);
    const { warp, unwarp, unsqueezeY } = createWarp(params);

    // 4. the dunes
    const keys: KeySpace = {
        dancers: traits.Dancers,
        sandstorm: traits.Sandstorm,
        skew: params.skew === 'left' ? -1 : params.skew === 'right' ? 1 : 0,
        skewAmount: traits.Dunes <= 3 ? 0.5 : 1,
        noise,
        gaussian: rand.gaussian,
    };
    const peaks = placePeaks(rand, keys, params, traits.Dunes, unsqueezeY);

    // 5. drawing
    const inkStyle = hexToRgba(params.ink, params.inkAlpha);
    const marginMin = params.margin;
    const marginMax = 1 - params.margin;
    const backPeak = peaks[peaks.length - 1];
    const densityOf = { [Shade.Core]: params.coreDensity, [Shade.Slope]: params.slopeDensity, [Shade.Sky]: params.skyDensity };

    /**
     * Scatter one frame of sand. Dots get a random x, while y sweeps the canvas once from top to
     * bottom over all the frames, so the picture "pours in" like sand settling.
     * Returns false once the picture is finished.
     */
    function drawFrame(ctx: CanvasRenderingContext2D, frame: number): boolean {
        if (frame >= params.frames || !backPeak) return false;

        // the original warped the back peak at the start of every frame; with blur on, that takes a
        // random number, so it stays to keep seeds identical
        warp(backPeak.peakX, backPeak.peakY, params.blur ? 0.001 * rand.gaussian() : 0);

        ctx.fillStyle = inkStyle;
        const dotSize = params.dotSize * size;
        const dots = params.dotsPerFrame;

        for (let i = 0; i < dots; i++) {
            const progress = (dots * frame + i) / (dots * params.frames);
            const x = rand.range(marginMin, marginMax);
            const y = lerp(marginMin, marginMax, progress);

            // pull, don't push: find where this canvas point came from, then ask the dunes
            const [modelX, modelY] = unwarp(x, y);
            const shade = shadeAt(peaks, keys, modelX, modelY);

            if (rand.next() <= densityOf[shade]) {
                ctx.fillRect(x * size, y * size, dotSize, dotSize);
            }
        }
        return true;
    }

    return { seed, traits, palette, params, peaks, keys, warp, unwarp, totalFrames: params.frames, paper: params.paper, drawFrame };
}
