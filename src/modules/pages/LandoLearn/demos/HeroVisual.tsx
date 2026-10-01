'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '../kit/gsap';
import { FOUR_BOX, FOUR_PATH, IMG, Monogram } from '../kit/source';

/**
 * Hero teaser: the source's lime preloader in miniature — the monogram ticks, then the “4” window
 * grows (expo.in) and reveals the portrait underneath. Click to replay.
 */
const W = 560;
const H = 560;
const S1 = 18; // enough to cover this small frame

export default function HeroVisual() {
    const root = useRef<HTMLButtonElement>(null);
    const hole = useRef<SVGPathElement>(null);
    const tl = useRef<gsap.core.Timeline | null>(null);

    const transform = (s: number) => `translate(${W / 2} ${H / 2}) scale(${s}) skewX(${FOUR_BOX.skew}) translate(${-FOUR_BOX.origin[0]} ${-FOUR_BOX.origin[1]})`;

    useGSAP(
        () => {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const st = { s: S1 / 1024 };
            const q = gsap.utils.selector(root);
            const t = gsap.timeline({ delay: 0.4 });
            t.set(q('.hv-lime'), { autoAlpha: 1 })
                .set(q('.hv-mono'), { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)' })
                .fromTo(q('.mono-top'), { y: -5 }, { y: 0, duration: 0.17, ease: 'power2.out', repeat: 1, repeatDelay: 0.8 }, 0)
                .to(q('.hv-mono'), { clipPath: 'inset(0% 0% 100% 100%)', duration: 0.13, ease: 'power2.in' }, 1.2);
            if (reduce) t.to(q('.hv-lime'), { autoAlpha: 0, duration: 0.4 }, 1.2);
            else
                t.fromTo(st, { s: S1 / 1024 }, { s: S1, duration: 0.51, ease: 'expo.in', onUpdate: () => hole.current?.setAttribute('transform', transform(st.s)) }, 1.18).set(q('.hv-lime'), {
                    autoAlpha: 0,
                });
            t.fromTo(q('.hv-portrait'), { scale: 1.08 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, 1.3);
            tl.current = t;
        },
        { scope: root },
    );

    return (
        <button
            ref={root}
            type="button"
            onClick={() => {
                hole.current?.setAttribute('transform', transform(S1 / 1024));
                tl.current?.restart(true);
            }}
            aria-label="Replay the preloader"
            className="group relative block size-full overflow-hidden rounded-[28px] border border-[var(--ll-line-2)] bg-[#fafbf6]"
        >
            <div className="ll-contours" style={{ '--ll-contour': 'rgba(0,0,0,0.09)' } as React.CSSProperties} />
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative teaser, sized by CSS */}
            <img src={IMG.portrait} alt="" className="hv-portrait absolute bottom-0 left-1/2 w-[190%] max-w-none -translate-x-1/2" />
            <svg className="hv-lime absolute inset-0 size-full" viewBox={`0 0 ${W} ${H}`} aria-hidden>
                <defs>
                    <mask id="ll-hero-hole" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                        <rect width={W} height={H} fill="white" />
                        <path ref={hole} d={FOUR_PATH} fill="black" transform={transform(S1 / 1024)} />
                    </mask>
                </defs>
                <rect width={W} height={H} fill="#cdff0b" mask="url(#ll-hero-hole)" />
            </svg>
            <div className="hv-mono pointer-events-none absolute left-1/2 top-1/2 w-[12%] -translate-x-1/2 -translate-y-1/2 text-[#171a12]">
                <Monogram />
            </div>
            <span className="ll-mono absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.16em] text-[#171a12]/60 opacity-0 transition-opacity group-hover:opacity-100">↻ click to replay</span>
        </button>
    );
}
