import { CustomEase } from './gsap';
import { EASE_PATH } from './source';

/** The page's three curves (from its interaction data), registered once under guide-only names. */
export const EASES = {
    'out-cubic': 'alOutCubic',
    'in-out-cubic': 'alInOutCubic',
    'in-out-quart': 'alInOutQuart',
    linear: 'none',
} as const;

export type EaseName = keyof typeof EASES;

export const EASE_LIST: EaseName[] = ['out-cubic', 'in-out-cubic', 'in-out-quart', 'linear'];

let done = false;
export function registerEases() {
    if (done || typeof window === 'undefined') return;
    done = true;
    CustomEase.create('alOutCubic', EASE_PATH.outCubic);
    CustomEase.create('alInOutCubic', EASE_PATH.inOutCubic);
    CustomEase.create('alInOutQuart', EASE_PATH.inOutQuart);
}

registerEases();
