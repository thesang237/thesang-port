// Read-only re-exports of the /kpr source: its clock maths, choreography, card shader, painted scenes,
// flipbook players and media manifest. Demos use these so every number matches the real page exactly.
// Nothing in src/modules/pages/Kpr is changed by this guide.
export type { Painting } from '@/modules/pages/Kpr/data/media';
export { CARD_IMAGES, FLIPBOOKS, GALLERY_RING, IMAGES, PAINTINGS } from '@/modules/pages/Kpr/data/media';
export { default as BtnFrame } from '@/modules/pages/Kpr/dom/ui/BtnFrame';
export { buildReveal, registerEases } from '@/modules/pages/Kpr/dom/ui/reveal';
export { scrambleInto, scrambleTween } from '@/modules/pages/Kpr/dom/ui/Text';
export type { Cast } from '@/modules/pages/Kpr/gl/choreo';
export { choreograph, introRect, storyProgress } from '@/modules/pages/Kpr/gl/choreo';
export { stageDistance } from '@/modules/pages/Kpr/gl/layout';
export { loadAtlas } from '@/modules/pages/Kpr/gl/loaders';
export { createLogoWipe, LOGO_LAST } from '@/modules/pages/Kpr/gl/LogoWipe';
export type { CardShared, NotchedUniforms } from '@/modules/pages/Kpr/gl/materials/notched';
export { createNotchedMaterial } from '@/modules/pages/Kpr/gl/materials/notched';
export type { CardState, Face } from '@/modules/pages/Kpr/gl/NotchedCard';
export { baseState, NotchedCard } from '@/modules/pages/Kpr/gl/NotchedCard';
export type { PaintedView } from '@/modules/pages/Kpr/gl/PaintedScene';
export { baseView, PaintedScene } from '@/modules/pages/Kpr/gl/PaintedScene';
export { clamp01, damp, ease, launchLeave, lerp, NAV_TARGETS, navAt, RESTS, SCROLL_TOTAL, scrollFromT, seg, sub, tFromScroll, themeAt, TOTAL, W } from '@/modules/pages/Kpr/scroll/timeline';
export { film } from '@/modules/pages/Kpr/scroll/useScrollStore';

/** Source colours (kpr.scss tokens, Stage.tsx LAV_SHADES, choreo.ts GLOW_COLOR). */
export const KPR = {
    lime: '#c0fb50',
    lavender: '#8b7ed9',
    lavDark: '#7466c6',
    lavDarker: '#5b4daa',
    glow: '#c06cff',
    ink: '#000000',
    paper: '#ffffff',
} as const;
