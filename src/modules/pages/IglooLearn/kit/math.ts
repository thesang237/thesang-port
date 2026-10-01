import { gsap } from 'gsap';

// The exact helpers the Igloo page uses — imported, not copied.
export { clamp, damp, easeInOutCubic, easeOutCubic, fbm2, fitFov, lerp, noise2, ridged2, rng, smoothstep } from '@/modules/pages/Igloo/utils/math';

/** GSAP's own ease functions, so the curves you see match the real page. */
export const ease = (name: string) => gsap.parseEase(name) as (t: number) => number;

/** Normalise → clamp: how far `v` is through the window [start, end], as 0..1. */
export const progressIn = (v: number, start: number, end: number) => Math.min(1, Math.max(0, (v - start) / (end - start || 1e-6)));

/** The eases that appear in the Igloo source, in the order you'd reach for them. */
export const IGLOO_EASES = ['none', 'power1.inOut', 'power2.out', 'power3.inOut', 'expo.out', 'expo.inOut', 'power2.in', 'sine.inOut', 'elastic.out(1, 0.45)', 'back.out(1.7)'] as const;
