import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

// These timings reproduce the supplied reference, rather than the portfolio's global presets.
gsap.registerPlugin(useGSAP, CustomEase);
CustomEase.create('floema', '0.77,0,0.175,1');
export const motion = {
    ease: 'floema',
    wipe: 1.5,
    flip: 2,
    reveal: 1.5,
    hover: 0.5,
    outline: 1,
    hoverStagger: 0.02,
    buttonStagger: 0.01,
    lineStagger: 0.1,
    fade: 0.5,
};
export { gsap, useGSAP };
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const mix = (a: number, b: number, progress: number) => a + (b - a) * progress;
export const wrap = (value: number, min: number, max: number) => ((((value - min) % (max - min)) + max - min) % (max - min)) + min;
export const damp = (value: number, target: number, ease: number, dt: number) => mix(value, target, 1 - Math.pow(1 - ease, dt * 60));
