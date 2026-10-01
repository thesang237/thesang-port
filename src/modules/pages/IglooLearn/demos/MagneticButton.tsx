'use client';

import { useRef } from 'react';

import { Demo, Segmented, Slider } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { hoverScramble } from '../kit/scramble';

const DEFAULTS = { pull: 0.25, follow: 0.5, amp: 1, period: 0.45, release: 'elastic' as 'elastic' | 'expo' | 'none' };

/** The Igloo prev/next arrows: lean toward the cursor, spring back on leave. */
export default function MagneticButton() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const arrows = useRef<(HTMLButtonElement | null)[]>([]);

    const onMove = (i: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
        const el = arrows.current[i];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const P = ref.current;
        gsap.to(el.querySelector('.mb-inner'), {
            x: (e.clientX - (r.left + r.width / 2)) * P.pull,
            y: (e.clientY - (r.top + r.height / 2)) * P.pull,
            duration: P.follow,
            ease: 'power3.out',
        });
    };
    const onLeave = (i: number) => () => {
        const P = ref.current;
        const ease = P.release === 'elastic' ? `elastic.out(${P.amp}, ${P.period})` : P.release === 'expo' ? 'expo.out' : 'none';
        gsap.to(arrows.current[i]?.querySelector('.mb-inner') ?? [], { x: 0, y: 0, duration: P.release === 'none' ? 0.01 : 0.8, ease });
    };

    return (
        <Demo
            title="Magnetic arrows"
            hint="Hover and move around inside each arrow’s padding, then leave quickly. The release ease is where the personality is."
            onReset={reset}
            controls={
                <>
                    <Slider label="pull" value={p.pull} min={0} max={0.8} onChange={(v) => set('pull', v)} help="Share of the cursor offset the arrow follows. Igloo: 0.25." />
                    <Slider label="follow duration" value={p.follow} min={0.05} max={1.5} onChange={(v) => set('follow', v)} help="A tween per mousemove, overwritten each time → a soft follow." />
                    <Segmented label="release" options={['elastic', 'expo', 'none'] as const} value={p.release} onChange={(v) => set('release', v)} />
                    {p.release === 'elastic' && (
                        <>
                            <Slider label="elastic amplitude" value={p.amp} min={0.5} max={2.5} onChange={(v) => set('amp', v)} />
                            <Slider label="elastic period" value={p.period} min={0.1} max={1} onChange={(v) => set('period', v)} help="Igloo: elastic.out(1, 0.45). Lower period = more wobbles." />
                        </>
                    )}
                </>
            }
        >
            <div className="relative flex h-[300px] items-center justify-between bg-[radial-gradient(ellipse_at_50%_60%,rgba(212,194,255,0.12),transparent_70%)] px-[8%] text-[var(--il-ink)]">
                {[-1, 1].map((dir, i) => (
                    <button
                        key={dir}
                        ref={(el) => {
                            arrows.current[i] = el;
                        }}
                        type="button"
                        aria-label={dir < 0 ? 'Previous' : 'Next'}
                        onMouseMove={onMove(i)}
                        onMouseEnter={(e) => hoverScramble(e.currentTarget.querySelector('.mb-label'), dir < 0 ? 'PREV' : 'NEXT')}
                        onMouseLeave={onLeave(i)}
                        className="il-hv-ring p-10"
                    >
                        <span className="mb-inner relative flex flex-col items-center">
                            <svg viewBox="0 0 48 48" className="absolute left-1/2 top-[5px] size-12 -translate-x-1/2 -translate-y-1/2">
                                <circle className="il-hv-ring-circle" cx="24" cy="24" r="22" pathLength={1} fill="rgba(255,255,255,0.05)" stroke="currentColor" strokeWidth="1" />
                            </svg>
                            <svg width="56" height="10" viewBox="0 0 56 10" fill="none" stroke="currentColor" strokeWidth="1.2" className={dir < 0 ? '' : 'rotate-180'}>
                                <path className="il-hv-ring-shaft" d="M55 5H1" />
                                <path d="M1 5L6 1M1 5L6 9" />
                            </svg>
                            <span className="mb-label il-mono mt-2 block text-[9px] tracking-[0.2em]">{dir < 0 ? 'PREV' : 'NEXT'}</span>
                        </span>
                    </button>
                ))}
                <div className="il-bracket il-hv-sweep il-mono pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 text-[12px] font-bold">X / Twitter</div>
            </div>
        </Demo>
    );
}
