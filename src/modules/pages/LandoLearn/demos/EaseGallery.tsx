'use client';

import { useRef } from 'react';

import { Btn, Demo, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';

/** Every ease + duration pair the source uses, with where it lives. */
const ROWS = [
    { ease: 'power1.out', d: 0.41, what: 'Menu panel opens', file: 'shell/Menu.tsx' },
    { ease: 'power1.in', d: 0.25, what: 'Menu panel closes', file: 'shell/Menu.tsx' },
    { ease: 'power3.out', d: 0.26, what: 'Nav item rises (×4, stagger 0.075)', file: 'shell/Menu.tsx' },
    { ease: 'power2.inOut', d: 0.24, what: 'Block grows across a line', file: 'motion-kit/BlockReveal.tsx' },
    { ease: 'power3.inOut', d: 0.42, what: 'Rolling text (per character)', file: 'motion-kit/RollingText.tsx' },
    { ease: 'power3.out', d: 0.5, what: 'Header compacts on scroll', file: 'shell/Header.tsx' },
    { ease: 'power3.out', d: 0.7, what: 'Social cards fan out', file: 'sections/Socials.tsx' },
    { ease: 'expo.in', d: 0.51, what: '“4” window grows (preloader)', file: 'shell/Overlay.tsx' },
    { ease: 'none', d: 1, what: 'Anything scrubbed by scroll', file: 'HeroSequence · Gallery' },
] as const;

const DEFAULTS = { slow: false };

function Curve({ ease }: { ease: string }) {
    const e = gsap.parseEase(ease);
    const pts = Array.from({ length: 41 }, (_, i) => {
        const t = i / 40;
        return `${(4 + t * 56).toFixed(1)},${(40 - e(t) * 32).toFixed(1)}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 64 44" className="h-11 w-16 shrink-0" aria-hidden>
            <rect x="4" y="8" width="56" height="32" fill="none" stroke="rgba(241,243,232,0.08)" />
            <polyline points={pts} fill="none" stroke="#cdff0b" strokeWidth="1.6" />
        </svg>
    );
}

export default function EaseGallery() {
    const root = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);

    const play = (i?: number) => {
        const dots = gsap.utils.toArray<HTMLElement>('.eg-dot', root.current);
        const targets = i === undefined ? dots : [dots[i]];
        targets.forEach((dot) => {
            const k = dots.indexOf(dot);
            const row = ROWS[k];
            gsap.fromTo(dot, { left: '0%' }, { left: '100%', xPercent: -100, duration: row.d * (p.slow ? 4 : 1), ease: row.ease, overwrite: true });
        });
    };

    return (
        <Demo
            title="The site’s ease vocabulary"
            hint="Press “Play all” — every dot uses the real duration and ease from the source. Click a row to replay just that one."
            onReset={reset}
            controls={
                <>
                    <Btn primary onClick={() => play()}>
                        ▶ Play all
                    </Btn>
                    <Toggle label="slow motion ×4" checked={p.slow} onChange={(v) => set('slow', v)} help="Everything here is under half a second — slow it down to see the shape." />
                    <p className="text-[12px] leading-relaxed text-[var(--ll-faint)]">
                        Read the curve: steep at the start = fast start; flat at the end = gentle landing. “.out” lands softly, “.in” leaves quickly.
                    </p>
                </>
            }
        >
            <div ref={root} className="divide-y divide-[var(--ll-line)]">
                {ROWS.map((r, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => play(i)}
                        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left hover:bg-white/[0.02] sm:flex-nowrap sm:gap-4"
                    >
                        <Curve ease={r.ease} />
                        <div className="w-[118px] shrink-0 sm:w-[150px]">
                            <div className="ll-mono text-[11.5px] text-[var(--ll-ink)]">{r.ease}</div>
                            <div className="ll-mono text-[10.5px] text-[var(--ll-lime)]">{r.ease === 'none' ? 'scroll = time' : `${r.d.toFixed(2)} s`}</div>
                        </div>
                        <div className="relative order-last h-5 min-w-0 basis-full sm:order-none sm:h-6 sm:flex-1 sm:basis-auto">
                            <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--ll-line-2)]" />
                            <span className="eg-dot absolute top-1/2 block size-3 -translate-y-1/2 rounded-sm bg-[var(--ll-lime)]" style={{ left: 0 }} />
                        </div>
                        <div className="min-w-0 flex-1 sm:w-[220px] sm:flex-none">
                            <div className="truncate text-[13px] text-[#dfe2d5]">{r.what}</div>
                            <div className="ll-mono truncate text-[10px] text-[var(--ll-faint)]">{r.file}</div>
                        </div>
                    </button>
                ))}
            </div>
        </Demo>
    );
}
