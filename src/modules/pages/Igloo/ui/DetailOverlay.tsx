'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useLenis } from 'lenis/react';

import { PORTFOLIO } from '../data';
import { motion, useIglooUI } from '../store';
import { ambience } from '../utils/sound';

import { GLYPHS, scrambleIn } from './scramble';

export default function DetailOverlay() {
    const index = useIglooUI((s) => s.detail);
    const lenis = useLenis();
    const root = useRef<HTMLDivElement>(null);
    const item = index >= 0 ? PORTFOLIO[index] : null;
    const wasOpen = useRef(false);

    // scene + scroll lock
    useEffect(() => {
        const open = index >= 0;
        if (open) lenis?.stop();
        else if (wasOpen.current) lenis?.start();
        wasOpen.current = open;
        const tween = gsap.to(motion, { detail: open ? 1 : 0, duration: open ? 1.1 : 0.8, ease: open ? 'expo.inOut' : 'power3.inOut' });
        return () => {
            tween.kill();
        };
    }, [index, lenis]);

    // text decode + word hover scramble
    useEffect(() => {
        const el = root.current;
        if (!el || !item) return;
        const splits: SplitText[] = [];
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ delay: 0.35 });
            tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
            tl.fromTo('.ig-close', { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, 0.1);
            el.querySelectorAll('[data-scramble]').forEach((n, i) => {
                tl.add(scrambleIn(n)!, 0.1 + i * 0.06);
            });
            el.querySelectorAll<HTMLElement>('.ig-para').forEach((p, i) => {
                const text = p.dataset.text ?? '';
                tl.add(
                    gsap.fromTo(
                        p,
                        { opacity: 0 },
                        {
                            opacity: 1,
                            duration: 1.8,
                            ease: 'none',
                            scrambleText: { text, chars: 'lowerCase', revealDelay: 0.2, speed: 0.9 },
                            onComplete: () => {
                                // after decode, every word re-scrambles under the cursor
                                const split = SplitText.create(p, { type: 'words', wordsClass: 'ig-word' });
                                splits.push(split);
                                split.words.forEach((w) => {
                                    const word = w.textContent ?? '';
                                    w.addEventListener('mouseenter', () => {
                                        if (gsap.isTweening(w)) return;
                                        gsap.to(w, { duration: 0.45, scrambleText: { text: word, chars: GLYPHS, speed: 1 } });
                                    });
                                });
                            },
                        },
                    ),
                    0.25 + i * 0.35,
                );
            });
        }, el);
        return () => {
            splits.forEach((s) => s.revert());
            ctx.revert();
        };
    }, [item]);

    useEffect(() => {
        if (!item) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useIglooUI.getState().set({ detail: -1 });
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [item]);

    if (!item) return null;

    const close = () => {
        ambience.tick(900);
        gsap.to(root.current, { autoAlpha: 0, duration: 0.35, onComplete: () => useIglooUI.getState().set({ detail: -1 }) });
    };

    return (
        <div ref={root} className="fixed inset-0 z-30 overflow-y-auto opacity-0" data-lenis-prevent>
            <button
                type="button"
                onClick={close}
                onMouseEnter={() => ambience.tick(2000)}
                className="ig-close ig-bracket fixed right-[var(--ig-gutter)] top-[var(--ig-gutter)] z-10 px-5 py-2.5 text-xs"
            >
                Close
            </button>

            <article className="mx-auto w-[min(88vw,44ch)] pb-[20vh] pt-[16vh] text-[11px] leading-[1.45] sm:text-xs">
                <p data-scramble data-text="////// Summary" className="mb-5 opacity-50" />
                <p data-scramble data-text={`${item.code} — ${item.name}`} className="mb-5 font-bold" />
                {item.summary.map((para, i) => (
                    <p key={i} className="ig-para mb-4" data-text={para} />
                ))}
                <p data-scramble data-text="/// Discover" className="mb-2 mt-8 opacity-50" />
                <a href="#" onClick={(e) => e.preventDefault()} className="ig-link" data-scramble data-text={item.discover} />
                <p data-scramble data-text="/// Visit" className="mb-2 mt-6 opacity-50" />
                <a href="#" onClick={(e) => e.preventDefault()} className="ig-link" data-scramble data-text={item.visit} />
            </article>
        </div>
    );
}
