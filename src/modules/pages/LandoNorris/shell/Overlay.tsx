'use client';

import { useEffect, useRef } from 'react';

import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import { usePageTransition } from '@/components/motion-kit/PageTransition';

import { FOUR_BOX, FOUR_PATH, Monogram } from '../graphics';
import { emitEnter, useLN } from '../store';

/*
 * Lime overlay used for the first load (preloader) and for route transitions.
 * Measured at 30 fps (see .clone-analysis/four_growth.json):
 *  – the "4" scale grows exponentially (k ≈ 13.6 /s) in all three moments → expo.in over 0.51s, 1024×
 *  – load: monogram shows at 0.133s and loops (top bar −5px → 0, period ≈0.97s); reveal starts 1.375s,
 *    monogram retracts 1.40–1.53s, page fully visible at 1.89s
 *  – exit: lime "4" grows from the click (≈118.17) to full cover (+0.51s); monogram shows, dissolves at
 *    +0.63s, redraws +0.76s → +1.10s, holds; reveal starts at click +1.605s, monogram gone at +1.78s
 */

const LOAD_REVEAL_AT = 1.364;
const GROW = 0.51;
const S1 = 60; // scale at which the glyph covers the viewport (counter above the origin is 8.6 units)
const S0 = S1 / 1024;
const ENTER_REVEAL_AT = 1.53; // s after the click (measured on exact page time)
const ENTER_GROW = 0.6; // route reveal grows slower than the load reveal (k ≈ 11.6/s vs 13.6/s)
const ENTER_MONO_OFF = 1.77;

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function glyphTransform(s: number) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const [ox, oy] = FOUR_BOX.origin;
    return `translate(${cx} ${cy}) scale(${s}) skewX(${FOUR_BOX.skew}) translate(${-ox} ${-oy})`;
}

export default function Overlay() {
    const root = useRef<HTMLDivElement>(null);
    const lime = useRef<SVGRectElement>(null);
    const hole = useRef<SVGPathElement>(null);
    const cover = useRef<SVGPathElement>(null);
    const mono = useRef<HTMLDivElement>(null);
    const monoTop = useRef<SVGGElement>(null);
    const label = useRef<HTMLDivElement>(null);
    const loop = useRef<gsap.core.Timeline | null>(null);
    const clickAt = useRef(0);
    const transition = usePageTransition();

    const startLoop = () => {
        loop.current?.kill();
        loop.current = gsap.timeline({ repeat: -1, repeatDelay: 0.8 }).fromTo(monoTop.current, { y: -5 }, { y: 0, duration: 0.17, ease: 'power2.out' });
    };

    // visibility is part of the returned timeline (not applied at build time), so a later hideMono()
    // in the same sequence can't leave it hidden
    const showMono = (draw = false) => {
        const el = mono.current;
        const tl = gsap.timeline();
        if (!el) return tl;
        tl.set(el, { autoAlpha: 1, immediateRender: false }).call(startLoop);
        if (draw) tl.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.34, ease: 'power2.inOut', immediateRender: false });
        else tl.set(el, { clipPath: 'inset(0% 0% 0% 0%)', immediateRender: false });
        return tl;
    };

    const hideMono = (duration = 0.13) =>
        gsap.timeline().to(mono.current, {
            clipPath: 'inset(0% 0% 100% 100%)',
            duration,
            ease: 'power2.in',
            onComplete: () => {
                loop.current?.kill();
                gsap.set(mono.current, { autoAlpha: 0 });
            },
        });

    const grow = (el: SVGPathElement | null, onUpdate?: (s: number) => void, duration = GROW) => {
        const st = { s: S0 };
        return gsap.to(st, {
            s: S1,
            duration,
            ease: 'expo.in',
            onStart: () => el?.setAttribute('transform', glyphTransform(S0)),
            onUpdate: () => {
                el?.setAttribute('transform', glyphTransform(st.s));
                onUpdate?.(st.s);
            },
        });
    };

    const reveal = (duration = GROW) => {
        if (prefersReduced()) {
            // reduced motion: no zoom — the lime layer simply fades away
            return gsap
                .timeline()
                .set(lime.current, { attr: { mask: '' } })
                .set(cover.current, { autoAlpha: 0 })
                .call(emitEnter)
                .to(root.current, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' })
                .set(root.current, { pointerEvents: 'none' })
                .set(label.current, { autoAlpha: 0 });
        }
        let entered = false;
        return gsap
            .timeline()
            .set(root.current, { autoAlpha: 1, pointerEvents: 'auto' })
            .set(lime.current, { autoAlpha: 1, attr: { mask: 'url(#ln-four-hole)' } })
            .set(cover.current, { autoAlpha: 0 })
            .add(
                grow(
                    hole.current,
                    (s) => {
                        // the page becomes visible through the glyph from s ≈ 1 → start its enter animation
                        if (!entered && s > 1.3) {
                            entered = true;
                            emitEnter();
                        }
                    },
                    duration,
                ),
            )
            .set(root.current, { autoAlpha: 0, pointerEvents: 'none' })
            .set(lime.current, { attr: { mask: '' } })
            .set(label.current, { autoAlpha: 0 });
    };

    // first load
    useGSAP(
        () => {
            let cancelled = false;
            const imgs = ['/landonorris/portrait.webp', '/landonorris/portrait-helmet.webp'].map(
                (src) =>
                    new Promise<void>((res) => {
                        const i = new Image();
                        i.onload = i.onerror = () => res();
                        i.src = src;
                    }),
            );
            Promise.all([document.fonts.ready, ...imgs]).then(() => {
                if (cancelled) return;
                // performance.now() is measured from navigation start (= video t0)
                const wait = Math.max(0, LOAD_REVEAL_AT - performance.now() / 1000);
                gsap.delayedCall(wait, () => {
                    root.current?.classList.add('is-js');
                    gsap.set(mono.current, { autoAlpha: 1 });
                    gsap.timeline()
                        .add(reveal(), 0)
                        .add(hideMono(0.13), 0.025)
                        .call(() => useLN.getState().set({ loaded: true }), [], GROW);
                });
            });
            return () => {
                cancelled = true;
                loop.current?.kill();
            };
        },
        { scope: root },
    );

    // route transitions
    useEffect(() => {
        if (!transition) return;
        return transition.register({
            exit: () =>
                new Promise<void>((resolve) => {
                    clickAt.current = performance.now();
                    root.current?.classList.add('is-js');
                    if (prefersReduced()) {
                        gsap.timeline({ onComplete: resolve })
                            .set(cover.current, { autoAlpha: 0 })
                            .set(lime.current, { autoAlpha: 1, attr: { mask: '' } })
                            .fromTo(root.current, { autoAlpha: 0, pointerEvents: 'auto' }, { autoAlpha: 1, duration: 0.3, ease: 'power1.in' })
                            .add(showMono(false), 0.3);
                        return;
                    }
                    gsap.timeline({ onComplete: resolve })
                        .set(root.current, { autoAlpha: 1, pointerEvents: 'auto' })
                        .set(lime.current, { autoAlpha: 0, attr: { mask: '' } })
                        .set(cover.current, { autoAlpha: 1 })
                        .add(grow(cover.current), 0)
                        .set(lime.current, { autoAlpha: 1 }, GROW)
                        .set(cover.current, { autoAlpha: 0 }, GROW)
                        .add(showMono(false), GROW - 0.05)
                        .add(hideMono(0.1), 0.55) // ref: gone ≈ click + 0.66s
                        .add(showMono(true), 0.76);
                }),
            enter: () =>
                new Promise<void>((resolve) => {
                    useLN.getState().set({ menuOpen: false });
                    const since = (performance.now() - clickAt.current) / 1000;
                    const at = Math.max(0.05, ENTER_REVEAL_AT - since);
                    gsap.timeline({ onComplete: resolve })
                        .add(reveal(ENTER_GROW), at)
                        .add(hideMono(0.05), Math.max(at, ENTER_MONO_OFF - since));
                }),
        });
        // helpers only read refs; re-registering them every render is unnecessary
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transition]);

    return (
        <div ref={root} className="ln-overlay" aria-hidden="true">
            <svg className="ln-overlay-svg" width="100%" height="100%">
                <defs>
                    <mask id="ln-four-hole" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                        <rect width="100%" height="100%" fill="white" />
                        <path ref={hole} d={FOUR_PATH} fill="black" transform="scale(0)" />
                    </mask>
                </defs>
                <rect ref={lime} width="100%" height="100%" fill="var(--ln-lime)" />
                <path ref={cover} d={FOUR_PATH} fill="var(--ln-lime)" style={{ visibility: 'hidden' }} />
            </svg>
            <div ref={mono} className="ln-overlay-mono">
                <Monogram loopRef={monoTop} />
            </div>
            <div ref={label} className="ln-overlay-label">
                LOAD MORROW
            </div>
        </div>
    );
}
