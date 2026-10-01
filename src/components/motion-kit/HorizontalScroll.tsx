'use client';

import { type CSSProperties, type ReactNode, useRef } from 'react';

import { gsap, ScrollTrigger, useGSAP } from './gsap';

type Props = {
    children: ReactNode;
    className?: string;
    trackClassName?: string;
    style?: CSSProperties;
    /** horizontal distance the track travels (px). Defaults to scrollWidth − innerWidth */
    travel?: number;
    /** vertical scroll consumed while pinned (px) */
    pinDistance: number;
    /** the track already starts moving while the section enters: ScrollTrigger start for the movement */
    moveStart?: string;
    scrub?: number | boolean;
    /** progress 0..1 of the horizontal movement + current x offset */
    onUpdate?: (progress: number, x: number) => void;
    /** ScrollTrigger id of the pin */
    id?: string;
};

/**
 * Full-height horizontal scroller: pins the section for `pinDistance` px and translates the track by
 * −travel with a scrubbed tween. The movement can begin before the pin (`moveStart`) so the track drifts
 * sideways while the section is still scrolling up, as in the reference.
 * Children can use `data-depth` for per-item parallax relative to the track.
 */
export default function HorizontalScroll({ children, className, trackClassName, style, travel, pinDistance, moveStart = 'top top', scrub = 0.8, onUpdate, id }: Props) {
    const root = useRef<HTMLElement>(null);
    const track = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const el = root.current!;
            const tr = track.current!;
            const dist = () => travel ?? Math.max(0, tr.scrollWidth - window.innerWidth);
            const items = gsap.utils.toArray<HTMLElement>('[data-depth]', el);

            ScrollTrigger.create({ id, trigger: el, start: 'top top', end: `+=${pinDistance}`, pin: true, pinSpacing: true });

            const state = { x: 0 };
            gsap.to(state, {
                x: 1,
                ease: 'none',
                scrollTrigger: {
                    trigger: el,
                    start: moveStart,
                    // end = pin end (pin start + pinDistance)
                    end: () => `top+=${pinDistance} top`,
                    scrub,
                    invalidateOnRefresh: true,
                },
                onUpdate: () => {
                    const x = -dist() * state.x;
                    gsap.set(tr, { x });
                    items.forEach((it) => {
                        const d = Number(it.dataset.depth ?? 1);
                        if (d !== 1) gsap.set(it, { x: x * (d - 1) });
                    });
                    onUpdate?.(state.x, x);
                },
            });
        },
        { scope: root, dependencies: [travel, pinDistance, moveStart] },
    );

    return (
        <section ref={root} className={className} style={style}>
            <div ref={track} className={trackClassName} style={{ willChange: 'transform' }}>
                {children}
            </div>
        </section>
    );
}
