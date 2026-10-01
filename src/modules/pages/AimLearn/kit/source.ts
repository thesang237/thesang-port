// Read-only re-exports of the page's own pure data, keyframes and maths, so demo numbers match the real page exactly.
export { ABOUT_PART_1, ABOUT_PART_2, FEATURED, GALLERY, HERO_LINES, IMG, MODERNISTS } from '@/modules/pages/AimObys/data';
export { AimLogoLockup, ArrowDown, ArrowRight } from '@/modules/pages/AimObys/icons';
export { applyTracks, bezier, EASE, type Ease, EASE_PATH, elementProgress, type ElementTracks, type Key, sample, smooth } from '@/modules/pages/AimObys/lib/ix';
export { setLottieProgress, useLottie } from '@/modules/pages/AimObys/lib/useLottie';
export { default as footerLottie } from '@/modules/pages/AimObys/lottie/footer.json';
export { default as loadingLottie } from '@/modules/pages/AimObys/lottie/loading.json';
export { default as scrollLottie } from '@/modules/pages/AimObys/lottie/scroll.json';
export * as SCENES from '@/modules/pages/AimObys/scenes';

/** Source colours (aim.scss tokens, sampled from the reference page). */
export const AIM = { white: '#e7e4df', black: '#141414', ink: '#202020', sheet: '#111111' } as const;

/** Dominant-colour placeholders the page puts behind each featured photo. */
export const PLACEHOLDER = { sup: '#a72805', bun: '#c8bfb8', vie: '#b09fad', for: '#5a5653', ses: '#c12a1e', sal: '#b5ada2' } as const;
