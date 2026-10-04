// Read-only re-exports of the /corn source: its scroll steps, story data, maths helpers, title code,
// particles, strands, springs and materials. Demos use these so every number matches the real page.
// Nothing in src/modules/pages/Corn is changed by this guide.
export type { Chapter, SectionId, WorldId } from '@/modules/pages/Corn/data/story';
export { CHAPTERS, FOOTER, FOOTER_LINKS, HERO, KERNEL_FACTS, LAST, sectionOf, SECTIONS, TESTS } from '@/modules/pages/Corn/data/story';
export { MOVE_SCALE } from '@/modules/pages/Corn/engine/Composite';
export { Molecules } from '@/modules/pages/Corn/engine/fx/cluster';
export { beadsOnCurve, dna, helixSpline, wanderPoints } from '@/modules/pages/Corn/engine/fx/helix';
export { Network } from '@/modules/pages/Corn/engine/fx/network';
export type { AreaPreset } from '@/modules/pages/Corn/engine/fx/particles';
export { accentBackdropMaterial, ADDITIVE, DofController, particleArea, polyMaterial, raw, rng, setFade, SNOISE3, tickPoly } from '@/modules/pages/Corn/engine/fx/particles';
export { Scroller } from '@/modules/pages/Corn/engine/Scroller';
export type { Layout, MsdfFont } from '@/modules/pages/Corn/engine/text/msdf';
export { layoutLines, loadFont, samplePoints } from '@/modules/pages/Corn/engine/text/msdf';
export { TitleText } from '@/modules/pages/Corn/engine/text/TitleText';
export { Trail, TRAIL_SIZE } from '@/modules/pages/Corn/engine/text/Trail';
export { Timeline } from '@/modules/pages/Corn/engine/Timeline';
export { kernelMaterial } from '@/modules/pages/Corn/engine/worlds/KernelWorld';
export { bakedGeometry, relitMaterial, remat } from '@/modules/pages/Corn/engine/worlds/shared';
export { CONDITIONS } from '@/modules/pages/Corn/engine/worlds/StalkWorld';
export { clamp01, damp, smooth, TILT } from '@/modules/pages/Corn/engine/worlds/World';

/** Source colours (story backgrounds, bokeh, DNA, kernel). */
export const CORN = {
    heroBase: '#00160a',
    heroBlue: '#004484',
    heroGreen: '#025b15',
    helixBase: '#17120f',
    helixOrange: '#ed863b',
    mint: '#55ffc2',
    teal: '#06fcb2',
    networkTeal: '#7ddbbf',
    networkYellow: '#eeff30',
    kernelGold: '#e9c46a',
    horizon: '#e07a3a',
} as const;

/** Engine constants that are module-private in the source (copied here, values unchanged). */
export const ENGINE = {
    /** Engine.ts DRAW: title reveal timing (s). */
    draw: { delay: 0.45, draw: 2.4, fillAt: 1.9, fill: 1.6 },
    /** Engine.ts TITLE_OUT: titles fade out between these distances (chapters) from their stop. */
    titleOut: [0.3, 0.6] as [number, number],
    /** Engine.ts COPY_NEAR: body copy shows within this distance (chapters) of its stop. */
    copyNear: 0.22,
    /** Engine.ts CAP: cap heights in reference px (1920 wide). */
    cap: { hero: 105, chapter: 68, link: 36 },
    /** Engine.ts MAX_DPR. */
    maxDpr: 1.5,
    /** Composite.ts wipe. */
    wipe: { slope: 0.248, pushOld: 0.22, liftNew: 0.3, window: [0.12, 0.88] as [number, number], grain: 0.07 },
    /** Scroller.ts feel. */
    scroll: { perStep: 420, maxEvent: 0.32, lead: 2.1, idleMs: 170, commit: 0.1, wFollow: 3.4, wSettle: 2.5 },
} as const;

/** The traced display face: cap height 700 / 1000 em, so font-size = cap / 0.7; cap top sits 0.169 cap below the line top. */
export const FACE = { capPerEm: 0.7, lineGap: 1.41, capTop: 0.169 } as const;
