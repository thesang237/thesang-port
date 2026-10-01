'use client';

import { useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { gsap, ScrollTrigger, SplitText, useGSAP } from '../kit/gsap';

const ACTS = [
    { tag: '////// 01 — Assemble', body: 'Segments fly in from the debris and lock into rings.', color: '#94dbff' },
    { tag: '////// 02 — Align', body: 'The rings stop tumbling and turn to face you.', color: '#d4c2ff' },
    { tag: '////// 03 — Dive', body: 'The core ignites and the camera falls through.', color: '#aef0d8' },
];
const TOTAL = 3;
const sectionAt = (t: number) => (t < 1 ? 0 : t < 2 ? 1 : 2);

/** Caption that decodes its tag and rises its words — remounted per act (key). */
function Caption({ tag, body, color }: { tag: string; body: string; color: string }) {
    const root = useRef<HTMLDivElement>(null);
    useGSAP(
        () => {
            const split = SplitText.create(root.current!.querySelector('.ps-body'), { type: 'lines,words', mask: 'lines' });
            const tl = gsap.timeline();
            tl.fromTo('.ps-tag', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'none', scrambleText: { text: tag, chars: '!<>-_\\/[]{}=+*^?#01', revealDelay: 0.15, speed: 0.7 } }, 0)
                .from(split.words, { yPercent: 120, rotate: 4, duration: 1, ease: 'expo.out', stagger: 0.025 }, 0.1)
                .fromTo('.ps-rule', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.inOut' }, 0);
            return () => split.revert();
        },
        { scope: root },
    );
    return (
        <div ref={root} className="max-w-[30ch] text-right">
            <p className="ps-tag il-mono mb-2 text-[11px]" style={{ color }} />
            <span className="ps-rule mb-3 ml-auto block h-px w-12 origin-right bg-current" />
            <p className="ps-body text-[clamp(18px,2vw,24px)] font-medium leading-snug tracking-[-0.01em]">{body}</p>
        </div>
    );
}

const SEGMENTS = [
    { r: 120, n: 9, w: 22 },
    { r: 84, n: 7, w: 18 },
    { r: 52, n: 5, w: 14 },
];

/**
 * A real pinned section on this page: 3 screens of scroll, one scrubbed
 * timeline, a progress rail, and captions that only re-render when the
 * section index changes — the Igloo recipe at small scale.
 */
export default function PinnedStory() {
    const root = useRef<HTMLDivElement>(null);
    const fill = useRef<HTMLSpanElement>(null);
    const readout = useRef<HTMLSpanElement>(null);
    const [section, setSection] = useState(0);
    const current = useRef(0);

    useGSAP(
        () => {
            const tl = gsap.timeline({ defaults: { ease: 'none' } });
            // act 1: segments assemble from scattered positions
            gsap.utils.toArray<SVGGElement>('.ps-seg').forEach((seg, i) => {
                const a = (i * 137.5 * Math.PI) / 180;
                tl.fromTo(
                    seg,
                    { x: Math.cos(a) * 260, y: Math.sin(a) * 180, rotation: gsap.utils.random(-180, 180), opacity: 0 },
                    { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
                    (i % 7) * 0.04,
                );
            });
            // act 2: rings tumble then settle (3D tilt), spinning opposite ways
            tl.fromTo('.ps-ring', { rotationX: 62, rotationY: (i) => [-30, 25, -15][i] }, { rotationX: 0, rotationY: 0, duration: 1, ease: 'power2.inOut', stagger: 0.08 }, 1)
                .to('.ps-ring', { rotation: (i) => [90, -120, 160][i], duration: 2, ease: 'none' }, 1)
                // act 3: core ignites, rings fly past the camera
                .fromTo('.ps-core', { scale: 0.2, opacity: 0.2 }, { scale: 1.4, opacity: 1, duration: 0.8, ease: 'power2.in' }, 2)
                .to('.ps-ring', { scale: (i) => [3.4, 2.6, 2][i], opacity: 0, duration: 0.9, ease: 'power2.in', stagger: 0.06 }, 2.1)
                .set({}, {}, TOTAL);

            ScrollTrigger.create({
                trigger: root.current,
                start: 'top 104px',
                end: `+=${TOTAL * 100}%`,
                pin: true,
                animation: tl,
                scrub: true,
                onUpdate: (self) => {
                    if (fill.current) fill.current.style.transform = `scaleY(${self.progress})`;
                    if (readout.current) readout.current.textContent = (self.progress * TOTAL).toFixed(2);
                    const s = sectionAt(self.progress * TOTAL);
                    // only touch React when the section actually changes
                    if (s !== current.current) {
                        current.current = s;
                        setSection(s);
                    }
                },
            });
        },
        { scope: root },
    );

    return (
        <div
            ref={root}
            className="relative h-[calc(100vh-120px)] min-h-[480px] overflow-hidden rounded-2xl border border-[var(--il-line-2)] bg-[radial-gradient(ellipse_at_50%_45%,#1a2332,#0b0f16_70%)]"
        >
            <div className="il-dots absolute inset-0 opacity-40" />
            <div className="il-mono absolute left-5 top-4 z-10 flex items-center gap-2 text-[10.5px] text-[var(--il-dim)]">
                <span className="size-1.5 rotate-45 bg-[var(--il-ice)]" />
                <span className="uppercase tracking-[0.14em] text-[var(--il-ink)]">Live</span> pinned for 3 screens — keep scrolling the page
            </div>

            {/* stage: rings are HTML layers so they can tilt in 3D (SVG groups can't) */}
            <div className="absolute inset-0 flex items-center justify-center [perspective:900px]">
                <div className="relative size-[min(62vh,440px)] [transform-style:preserve-3d]">
                    <div className="ps-core absolute inset-[27%] rounded-full bg-[radial-gradient(circle,#ffffff_0%,rgba(191,230,255,0.8)_30%,rgba(148,219,255,0)_70%)]" />
                    {SEGMENTS.map((ring, ri) => (
                        <div key={ri} className="ps-ring absolute inset-0">
                            <svg viewBox="-160 -160 320 320" className="size-full overflow-visible">
                                {Array.from({ length: ring.n }, (_, k) => {
                                    const gap = 0.08;
                                    const a0 = (k / ring.n) * Math.PI * 2 + gap / 2;
                                    const a1 = ((k + 1) / ring.n) * Math.PI * 2 - gap / 2;
                                    const d = `M ${Math.cos(a0) * ring.r} ${Math.sin(a0) * ring.r} A ${ring.r} ${ring.r} 0 0 1 ${Math.cos(a1) * ring.r} ${Math.sin(a1) * ring.r}`;
                                    return (
                                        <g key={k} className="ps-seg">
                                            <path d={d} fill="none" stroke="#8d9ab0" strokeWidth={ring.w} />
                                            <path d={d} fill="none" stroke="#dbe6f3" strokeWidth={2} opacity={0.6} />
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    ))}
                </div>
            </div>

            {/* caption (re-mounted per act) */}
            <div className="absolute bottom-6 right-6 z-10 sm:bottom-10 sm:right-24">
                <Caption key={section} {...ACTS[section]} />
            </div>

            {/* rail */}
            <nav className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-end gap-5 sm:flex" aria-label="Acts">
                {ACTS.map((a, i) => (
                    <span key={a.tag} className={cn('il-mono flex items-center gap-3 text-[10px] transition-opacity', section === i ? 'opacity-100' : 'opacity-40')}>
                        {section === i && <span>{`0${i + 1}`}</span>}
                        <span className={cn('block size-[6px] border border-current transition-transform duration-500', section === i && 'rotate-45 scale-125 bg-current')} />
                    </span>
                ))}
                <span className="absolute -right-[12px] top-0 h-full w-px bg-white/15">
                    <span ref={fill} className="block h-full w-full origin-top scale-y-0 bg-[var(--il-ice)]" />
                </span>
            </nav>

            <div className="il-mono absolute bottom-6 left-5 z-10 text-[10.5px] text-[var(--il-faint)]">
                timeline time{' '}
                <span ref={readout} className="tabular-nums text-[var(--il-ink)]">
                    0.00
                </span>{' '}
                / {TOTAL}
            </div>
        </div>
    );
}
