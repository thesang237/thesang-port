'use client';

import { useRef } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Segmented, Slider } from '../kit/controls';
import { gsap, ScrollTrigger, useGSAP } from '../kit/gsap';
import { useParams, useTicker } from '../kit/loop';

const TOTAL = 4; // timeline length in "screens"
const DEFAULTS = { scrub: 'true' as 'true' | '0.5' | '1' | '2', overlap: 0.4, defaultEase: 'none' as 'none' | 'power2.inOut' };

type Row = { label: string; at: number; dur: number; color: string };

/**
 * A 4-screen mini page: one timeline, one ScrollTrigger, scrubbed by the box
 * scroll. The tracks on the right are drawn from the same numbers.
 */
export default function TimelineBuilder() {
    const { p, set, reset } = useParams(DEFAULTS);
    const box = useRef<HTMLDivElement>(null);
    const track = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const head = useRef<HTMLDivElement>(null);
    const num = useRef<HTMLSpanElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const orbAt = Math.max(0.2, 1 - p.overlap);
    const ROWS: Row[] = [
        { label: 'title words rise', at: 0, dur: 1, color: '#94dbff' },
        { label: 'orb travels + grows', at: orbAt, dur: 1.6, color: '#d4c2ff' },
        { label: 'background shifts', at: 1.8, dur: 1.2, color: '#aef0d8' },
        { label: 'counter 0 → 100', at: 2.6, dur: 1.4, color: '#ffd08a' },
        { label: 'title leaves', at: 3.3, dur: 0.7, color: '#ff9fb2' },
    ];

    useGSAP(
        () => {
            const counter = { v: 0 };
            const tl = gsap.timeline({ defaults: { ease: p.defaultEase } });
            tl.fromTo('.tb-word', { yPercent: 110 }, { yPercent: 0, duration: ROWS[0].dur, stagger: 0.12 }, ROWS[0].at)
                .fromTo('.tb-orb', { x: -140, scale: 0.55 }, { x: 140, scale: 1.35, duration: ROWS[1].dur }, ROWS[1].at)
                .fromTo(stage.current, { backgroundColor: '#0e141d' }, { backgroundColor: '#1b2638', duration: ROWS[2].dur }, ROWS[2].at)
                .to(
                    counter,
                    {
                        v: 100,
                        duration: ROWS[3].dur,
                        onUpdate: () => {
                            if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
                        },
                    },
                    ROWS[3].at,
                )
                .to('.tb-title', { autoAlpha: 0, y: -24, filter: 'blur(8px)', duration: ROWS[4].dur }, ROWS[4].at)
                .set({}, {}, TOTAL); // pad the timeline to exactly TOTAL units

            ScrollTrigger.create({
                trigger: track.current,
                scroller: box.current,
                start: 'top top',
                end: 'bottom bottom',
                animation: tl,
                scrub: p.scrub === 'true' ? true : Number(p.scrub),
            });
            tlRef.current = tl;
        },
        { scope: box, dependencies: [p.scrub, p.overlap, p.defaultEase], revertOnUpdate: true },
    );

    // playhead on the track view follows the timeline (not the scroll!) — see the scrub lag
    useTicker(box, () => {
        const tl = tlRef.current;
        if (tl && head.current) head.current.style.left = `${tl.progress() * 100}%`;
    });

    return (
        <Demo
            title="Timeline builder — one timeline, scrubbed by scroll"
            hint="Scroll inside the box. Try scrub 2: the playhead (and animation) now lags behind your scroll and catches up smoothly."
            onReset={reset}
            controls={
                <>
                    <Segmented label="scrub" options={['true', '0.5', '1', '2'] as const} value={p.scrub} onChange={(v) => set('scrub', v)} />
                    <p className="-mt-2 text-[11.5px] leading-snug text-[var(--il-faint)]">true = locked to scroll. A number = seconds of catch-up smoothing.</p>
                    <Slider
                        label="overlap (orb starts earlier)"
                        value={p.overlap}
                        min={0}
                        max={0.8}
                        onChange={(v) => set('overlap', v)}
                        help="Moves one tween’s position parameter. Overlaps make it feel like one continuous shot."
                    />
                    <Segmented label="timeline default ease" options={['none', 'power2.inOut'] as const} value={p.defaultEase} onChange={(v) => set('defaultEase', v)} />
                </>
            }
        >
            <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div ref={box} data-lenis-prevent className="il-scrollbox relative h-[360px] overflow-y-auto rounded-xl border border-[var(--il-line-2)]">
                    <div ref={track} className="relative" style={{ height: `${(TOTAL + 1) * 100}%` }}>
                        <div ref={stage} className="sticky top-0 flex h-[358px] flex-col justify-between overflow-hidden p-5">
                            <div className="tb-title text-[26px] font-semibold leading-[1.05] tracking-[-0.03em]">
                                {['Scroll', 'is', 'the', 'playhead.'].map((w) => (
                                    <span key={w} className="mr-2 inline-block overflow-hidden align-bottom">
                                        <span className="tb-word inline-block">{w}</span>
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-center">
                                <span className="tb-orb block size-20 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#c9b8ff_40%,#5b4f8a)] shadow-[0_0_40px_rgba(212,194,255,0.45)]" />
                            </div>
                            <div className="il-mono flex items-end justify-between text-[10px] text-[var(--il-faint)]">
                                <span>scroll ↓</span>
                                <span ref={num} className="text-[28px] tabular-nums text-[var(--il-ink)]">
                                    000
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="il-mono mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--il-faint)]">tl — {TOTAL} screens long</div>
                    <div className="relative space-y-1.5">
                        {ROWS.map((r) => (
                            <div key={r.label} className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-2">
                                <span className="il-mono truncate text-[10.5px] text-[var(--il-dim)]">{r.label}</span>
                                <span className="relative h-5 rounded bg-white/[0.03]">
                                    <span
                                        className={cn('absolute top-0 h-full rounded border')}
                                        style={{ left: `${(r.at / TOTAL) * 100}%`, width: `${(r.dur / TOTAL) * 100}%`, borderColor: `${r.color}88`, background: `${r.color}26` }}
                                    />
                                </span>
                            </div>
                        ))}
                        <div className="pointer-events-none absolute inset-y-[-4px] left-[120px] right-0">
                            <div ref={head} className="absolute inset-y-0 w-px bg-[var(--il-ink)] shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
                        </div>
                    </div>
                    <div className="il-mono relative ml-[120px] mt-1 h-4 text-[9px] text-[var(--il-faint)]">
                        {Array.from({ length: TOTAL + 1 }, (_, i) => (
                            <span key={i} className="absolute -translate-x-1/2" style={{ left: `${(i / TOTAL) * 100}%` }}>
                                {i}
                            </span>
                        ))}
                    </div>
                    <pre className="il-mono il-scrollbox mt-4 overflow-x-auto rounded-lg border border-[var(--il-line)] bg-black/30 p-3 text-[10.5px] leading-relaxed text-[#cfeeff]">{`const tl = gsap.timeline({ defaults: { ease: '${p.defaultEase}' } });
tl.from('.word', { yPercent: 110, stagger: 0.12, duration: 1 }, 0)
  .to('.orb',  { x: 140, scale: 1.35, duration: 1.6 }, ${orbAt.toFixed(2)})
  .to(stage,   { backgroundColor: '#1b2638', duration: 1.2 }, 1.8)
  .to(counter, { v: 100, duration: 1.4 }, 2.6)
  .to('.title',{ autoAlpha: 0, duration: 0.7 }, 3.3)
  .set({}, {}, ${TOTAL});            // pad to ${TOTAL} units

ScrollTrigger.create({ trigger: track, scroller: box,
  start: 'top top', end: 'bottom bottom',
  animation: tl, scrub: ${p.scrub} });`}</pre>
                </div>
            </div>
        </Demo>
    );
}
