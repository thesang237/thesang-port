import { gsap } from 'gsap';

export const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFXZ';

/** Decode an element's text from noise (GSAP ScrambleTextPlugin). */
export function scrambleIn(el: Element | null, opts: { text?: string; duration?: number; delay?: number; chars?: string } = {}) {
    if (!el) return null;
    const text = opts.text ?? (el as HTMLElement).dataset.text ?? el.textContent ?? '';
    return gsap.fromTo(
        el,
        { opacity: 0 },
        {
            opacity: 1,
            duration: opts.duration ?? Math.min(1.6, 0.35 + text.length * 0.018),
            delay: opts.delay ?? 0,
            ease: 'none',
            scrambleText: { text, chars: opts.chars ?? GLYPHS, revealDelay: 0.15, speed: 0.7, newClass: 'ig-decoded' },
        },
    );
}

export function scrambleOut(el: Element | null, duration = 0.35) {
    if (!el) return null;
    return gsap.to(el, { opacity: 0, duration, ease: 'power2.in', scrambleText: { text: ' ', chars: GLYPHS, speed: 1 } });
}

/** Quick re-decode of an element's current text — for hover states. */
export function hoverScramble(el: Element | null, text?: string) {
    if (!el || gsap.isTweening(el)) return;
    gsap.to(el, { duration: 0.42, ease: 'none', scrambleText: { text: text ?? el.textContent ?? '', chars: GLYPHS, speed: 1.2, revealDelay: 0.05 } });
}
