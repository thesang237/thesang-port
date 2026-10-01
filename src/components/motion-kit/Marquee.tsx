'use client';

import { type ReactNode, useRef } from 'react';

import { gsap, useGSAP } from './gsap';

type Props = {
    children: ReactNode;
    className?: string;
    /** px per second (positive = leftwards) */
    speed?: number;
    /** extra speed from scroll velocity (0 = off) */
    velocityBoost?: number;
    gap?: number;
};

/**
 * Seamless marquee: content rendered twice, the pair is translated by −50 % in a loop.
 * Driven by gsap.ticker so it can react to Lenis velocity and pauses with the page.
 */
export default function Marquee({ children, className, speed = 40, velocityBoost = 0, gap = 0 }: Props) {
    const root = useRef<HTMLDivElement>(null);
    const track = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const tr = track.current!;
            let x = 0;
            let half = tr.scrollWidth / 2;
            const ro = new ResizeObserver(() => (half = tr.scrollWidth / 2));
            ro.observe(tr);
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => ro.disconnect();
            const tick = (_t: number, dt: number) => {
                const v = velocityBoost ? Math.abs(window.__lenis?.velocity ?? 0) * velocityBoost : 0;
                x -= ((speed + v) * dt) / 1000;
                if (half > 0) x = ((x % half) - half) % half;
                tr.style.transform = `translate3d(${x}px,0,0)`;
            };
            gsap.ticker.add(tick);
            return () => {
                gsap.ticker.remove(tick);
                ro.disconnect();
            };
        },
        { scope: root, dependencies: [speed, velocityBoost] },
    );

    return (
        <div ref={root} className={className} style={{ overflow: 'hidden' }}>
            <div ref={track} style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap, paddingRight: gap }}>{children}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap, paddingRight: gap }} aria-hidden="true">
                    {children}
                </div>
            </div>
        </div>
    );
}
