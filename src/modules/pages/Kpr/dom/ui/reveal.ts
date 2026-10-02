'use client';

import { gsap } from '@/components/motion-kit/gsap';

import { film } from '../../scroll/useScrollStore';

/**
 * Section reveals, driven by data attributes inside a section root:
 *   data-r="lines"  masked line rise (children `.kpr-line > span`)
 *   data-r="chars"  per-character type-on (children `.kpr-ch`), dot first
 *   data-r="fade"   fade + rise
 *   data-r="hline" / "vline"  hairline draws (scaleX / scaleY)
 *   data-r="hacky"  decode / scramble (see hacky.ts)
 *   data-d="0.2"    delay (s)
 * Timing: immersive presets (strong out 0.16,1,0.3,1; text 0.95 s; draw 1.3 s; 70 ms stagger).
 * Enter plays forward; leaving reverses quickly (exit ≈ 0.45× duration) and then hides the section.
 */

export const EASE_OUT = 'kpr.out';
export const EASE_IN_OUT = 'kpr.inOut';

let registered = false;
export function registerEases(CustomEase: { create: (n: string, p: string) => unknown }) {
    if (registered) return;
    registered = true;
    CustomEase.create(EASE_OUT, 'M0,0 C0.16,1 0.3,1 1,1');
    CustomEase.create(EASE_IN_OUT, 'M0,0 C0.76,0 0.24,1 1,1');
}

export function buildReveal(root: HTMLElement, scramble: (el: HTMLElement, tl: gsap.core.Timeline, at: number) => void, tl = gsap.timeline({ paused: true, defaults: { ease: EASE_OUT } })) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll<HTMLElement>('[data-r]').forEach((el) => {
        const at = Number(el.dataset.d ?? 0);
        const kind = el.dataset.r;
        if (reduced) {
            tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, ease: 'none' }, at * 0.3);
            return;
        }
        switch (kind) {
            case 'lines': {
                const lines = el.querySelectorAll<HTMLElement>('.kpr-line > span');
                tl.fromTo(lines, { yPercent: 108, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: 0.95, stagger: 0.07 }, at);
                tl.set(el, { autoAlpha: 1 }, at);
                break;
            }
            case 'chars': {
                const dot = el.querySelector('.kpr-dot');
                const chars = el.querySelectorAll('.kpr-ch');
                if (dot) tl.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, repeat: 3, yoyo: true, ease: 'none' }, at);
                tl.fromTo(chars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, stagger: Math.min(0.035, 0.6 / Math.max(1, chars.length)), ease: 'none' }, at + 0.08);
                tl.set(el, { autoAlpha: 1 }, at);
                break;
            }
            case 'fade':
                tl.fromTo(el, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.95 }, at);
                break;
            case 'hline':
                tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: EASE_IN_OUT }, at);
                break;
            case 'vline':
                tl.fromTo(el, { scaleY: 0 }, { scaleY: 1, duration: 1.3, ease: EASE_IN_OUT }, at);
                break;
            case 'hacky':
                tl.set(el, { autoAlpha: 1 }, at);
                scramble(el, tl, at);
                break;
        }
    });
    return tl;
}

/**
 * Watches the film clock and plays/reverses a section's reveal as the section's window is
 * entered or left. Returns a per-frame function for the frame registry.
 */
export function actWatcher(root: HTMLElement, win: readonly [number, number], tl: gsap.core.Timeline, opts: { onState?: (inside: boolean) => void } = {}) {
    let inside: boolean | null = null;
    gsap.set(root, { autoAlpha: 0 });
    return () => {
        const t = film.view;
        const now = film.started && t >= win[0] && t <= win[1];
        if (now === inside) return;
        inside = now;
        opts.onState?.(now);
        if (now) {
            gsap.set(root, { autoAlpha: 1 });
            tl.eventCallback('onReverseComplete', null);
            tl.timeScale(1).play();
        } else {
            tl.eventCallback('onReverseComplete', () => {
                gsap.set(root, { autoAlpha: 0 });
            });
            tl.timeScale(2.2).reverse();
            if (tl.progress() === 0) gsap.set(root, { autoAlpha: 0 });
        }
    };
}
