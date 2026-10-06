// Read-only re-exports of the /art-solace source: its random, noise, palettes, traits, warp, dunes
// and scene builder. Demos use these so every number and every shape matches the real artwork.
// The guide never changes anything in src/modules/pages/ArtSolace.
export { createPeak, type KeySpace, type Peak, Shade, shadeAt, shadeOfPeak, stripeKeys } from '@/modules/pages/ArtSolace/art/dunes';
export { lerp, mapRange, TWO_PI } from '@/modules/pages/ArtSolace/art/math';
export { createNoise, type Noise } from '@/modules/pages/ArtSolace/art/noise';
export { COMMON_PALETTES, hexToRgba, type Palette, PALETTE_BAG, PALETTE_NAMES, paletteByName, RARE_PALETTES } from '@/modules/pages/ArtSolace/art/palettes';
export { rollSceneParams, type SceneOverrides, type SceneParams } from '@/modules/pages/ArtSolace/art/params';
export { createRandom, hashSeed, makeGaussian, type Random, randomSeed, sfc32 } from '@/modules/pages/ArtSolace/art/random';
export { type ArtOverrides, buildScene, type Scene } from '@/modules/pages/ArtSolace/art/scene';
export { BRUSHES, DUNE_COUNTS, MARGINS, RENDERS, rollTraits, SKIES, type Traits } from '@/modules/pages/ArtSolace/art/traits';
export { createWarp, type WarpSettings } from '@/modules/pages/ArtSolace/art/warp';

/** A few seeds with recognisable looks, used across the demos. */
export const SEEDS = {
    hero: 'solace',
    one: 'r23',
    many: 'r5',
    dancers: 'r29',
    sandstorm: 'r6',
} as const;
