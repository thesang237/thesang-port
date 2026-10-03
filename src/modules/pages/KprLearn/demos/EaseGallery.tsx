'use client';

import { useRef, useState } from 'react';

import { Btn, Demo, Slider } from '../kit/controls';
import { useTicker } from '../kit/loop';
import { curvePath } from '../kit/plot';
import { ease } from '../kit/source';

type EaseKey = keyof typeof ease;

const NOTES: Record<EaseKey, string> = {
    linear: 'Scrubbed raw: the default for the clock itself.',
    out: 'Cubic out. Gentle arrivals (card slide-ins in the intro).',
    outStrong: 'Expo out. Fast start, long settle: the 10K counter, the footer logo.',
    inOut: 'Cubic in-out. The story camera pan, handoffs, the second turn.',
    inOutStrong: 'Quartic in-out (“io”). Most card moves: heavy, cinematic.',
    in: 'Cubic in. Things leaving: the small intro card drops away.',
    smooth: 'Smoothstep. The story text column between its keyframes.',
};

/** Chapter 01: the source's ease functions (timeline.ts `ease`), all on one clock. */
export default function EaseGallery() {
    const host = useRef<HTMLDivElement>(null);
    const dots = useRef<(HTMLSpanElement | null)[]>([]);
    const clock = useRef(0);
    const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [dur, setDur] = useState(1.6);
    const keys = Object.keys(ease) as EaseKey[];

    useTicker(host, (_t, dt) => {
        if (!playing) return;
        clock.current = (clock.current + dt / dur) % 1.35;
        const k = Math.min(1, clock.current);
        keys.forEach((key, i) => {
            const el = dots.current[i];
            if (el) el.style.transform = `translateX(calc(${ease[key](k) * 100}cqw - ${ease[key](k) * 12}px))`;
        });
    });

    return (
        <Demo
            title="The page’s eases, side by side"
            hint="All squares start together and arrive together; only the curve differs. That curve is the whole “feel”."
            controls={
                <>
                    <Btn primary onClick={() => setPlaying((v) => !v)}>
                        {playing ? '❚❚ Pause' : '▶ Play'}
                    </Btn>
                    <Slider label="duration (s)" value={dur} min={0.4} max={4} step={0.1} onChange={setDur} help="Slow it down to compare the starts and the endings." />
                    <p className="text-[11.5px] leading-snug text-[var(--kl-dim)]">
                        Timed text uses two CSS-style curves registered with GSAP: <b>kpr.out</b> = cubic-bezier(0.16, 1, 0.3, 1) and <b>kpr.inOut</b> = cubic-bezier(0.76, 0, 0.24, 1).
                    </p>
                </>
            }
        >
            <div ref={host} className="grid gap-px bg-[var(--kl-line)] sm:grid-cols-2">
                {keys.map((key, i) => (
                    <div key={key} className="flex gap-4 bg-[var(--kl-panel)] p-4">
                        <svg viewBox="-4 -4 68 68" className="size-16 shrink-0" aria-hidden>
                            <rect x={0} y={0} width={60} height={60} fill="var(--kl-panel-2)" />
                            <path d={curvePath(ease[key], 60, 60)} fill="none" stroke="#0c0c0e" strokeWidth={2} />
                        </svg>
                        <div className="min-w-0 flex-1">
                            <div className="kl-mono text-[11.5px] text-[var(--kl-ink)]">{`ease.${key}`}</div>
                            <p className="mb-2 text-[12.5px] leading-snug text-[var(--kl-dim)]">{NOTES[key]}</p>
                            <div className="relative h-3 bg-[var(--kl-bg-2)] [container-type:inline-size]">
                                <span
                                    ref={(el) => {
                                        dots.current[i] = el;
                                    }}
                                    className="absolute left-0 top-0 block size-3 bg-[var(--kl-lav-deep)]"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Demo>
    );
}
