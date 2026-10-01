'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { ACTS, IGLOO_TOTAL, IGLOO_TRACKS, trackValue, WORLD_COLORS, WORLD_NAMES, worldWeights } from '../content/iglooTimeline';
import { Btn, Demo, Slider } from '../kit/controls';
import { useTicker } from '../kit/loop';
import { ease } from '../kit/math';

const pct = (v: number) => `${(v / IGLOO_TOTAL) * 100}%`;

function EaseBar({ name, up }: { name: string; up: boolean }) {
    const f = ease(name);
    const pts = Array.from({ length: 25 }, (_, i) => {
        const x = i / 24;
        const y = f(x);
        return `${(x * 100).toFixed(2)},${(up ? 20 - y * 18 - 1 : y * 18 + 1).toFixed(2)}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

/**
 * The real Igloo master timeline as tracks. Drag the playhead (or press play)
 * to see every dial the 3D worlds read, exactly as scroll would set them.
 */
export default function TimelineXRay() {
    const [t, setT] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [live, setLive] = useState(false);
    const host = useRef<HTMLDivElement>(null);
    const lanes = useRef<HTMLDivElement>(null);
    const frame = useRef<HTMLIFrameElement>(null);

    useTicker(host, (_, dt) => {
        if (!playing) return;
        setT((v) => (v + dt * 1.2 > IGLOO_TOTAL ? 0 : v + dt * 1.2));
    });

    // drive the real page: scroll its window to t screens
    useEffect(() => {
        const w = frame.current?.contentWindow;
        if (live && w) w.scrollTo(0, t * w.innerHeight);
    }, [t, live]);

    const scrubFrom = (clientX: number) => {
        const r = lanes.current?.getBoundingClientRect();
        if (!r) return;
        setT(Math.min(IGLOO_TOTAL, Math.max(0, ((clientX - r.left) / r.width) * IGLOO_TOTAL)));
    };

    const scene = trackValue(IGLOO_TRACKS[0], t);
    const weights = worldWeights(scene);
    const act = ACTS.find((a) => t >= a.from && t < a.to) ?? ACTS[ACTS.length - 1];

    return (
        <Demo
            title="Timeline X-ray — the real /igloo choreography"
            hint="Drag across the tracks (or press play). Each bar is one tween; the line inside is its easing curve. This is what scrolling does."
            stacked
            controls={
                <>
                    <Slider label="playhead (screens scrolled)" value={t} min={0} max={IGLOO_TOTAL} step={0.01} onChange={setT} help="1 unit = 100vh of scroll. The page is 16 units long." />
                    <div className="flex flex-wrap items-center gap-2 self-end">
                        <Btn primary onClick={() => setPlaying((p) => !p)}>
                            {playing ? '❚❚ Pause' : '▶ Play'}
                        </Btn>
                        <Btn onClick={() => setLive((l) => !l)}>{live ? 'Hide live page' : 'Load live page (heavy)'}</Btn>
                    </div>
                </>
            }
        >
            <div ref={host} className="p-4 sm:p-5">
                {/* act ribbon */}
                <div className="grid grid-cols-[112px_minmax(0,1fr)_56px] gap-3 sm:grid-cols-[150px_minmax(0,1fr)_64px]">
                    <div className="il-mono self-end pb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--il-faint)]">Acts</div>
                    <div className="relative h-7">
                        {ACTS.map((a) => (
                            <div
                                key={a.n}
                                className={cn(
                                    'il-mono absolute top-0 flex h-full items-center overflow-hidden whitespace-nowrap rounded-md border px-2 text-[10px] transition-opacity',
                                    act.n === a.n ? 'opacity-100' : 'opacity-45',
                                )}
                                style={{ left: pct(a.from), width: pct(a.to - a.from), borderColor: `${a.color}55`, background: `${a.color}14`, color: a.color }}
                            >
                                {a.name}
                            </div>
                        ))}
                    </div>
                    <div />
                </div>

                {/* tracks */}
                <div className="relative mt-2">
                    {IGLOO_TRACKS.map((tr) => {
                        const v = trackValue(tr, t);
                        const color = tr.world === undefined ? '#e8edf4' : WORLD_COLORS[tr.world];
                        return (
                            <div key={tr.key} className="group grid grid-cols-[112px_minmax(0,1fr)_56px] items-center gap-3 py-[3px] sm:grid-cols-[150px_minmax(0,1fr)_64px]" title={tr.what}>
                                <div className={cn('il-mono truncate text-[11px]', tr.kind === 'dom' ? 'text-[var(--il-dim)] italic' : 'text-[var(--il-ink)]')}>{tr.label}</div>
                                <div className="relative h-6 rounded bg-white/[0.025]">
                                    {tr.segs.map((s, i) => {
                                        const on = t >= s.at && t <= s.at + s.dur;
                                        return (
                                            <div
                                                key={i}
                                                className="absolute top-0 h-full rounded-[4px] border transition-[background] duration-200"
                                                style={{ left: pct(s.at), width: pct(s.dur), color, borderColor: `${color}66`, background: on ? `${color}30` : `${color}12` }}
                                            >
                                                <EaseBar name={s.ease} up={s.to >= s.from} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="il-mono text-right text-[11px] tabular-nums" style={{ color }}>
                                    {tr.kind === 'dom' ? `${Math.round(v * 100)}%` : v.toFixed(2)}
                                </div>
                            </div>
                        );
                    })}

                    {/* scrub surface + playhead */}
                    <div className="pointer-events-none absolute inset-y-0 left-[124px] right-[68px] sm:left-[162px] sm:right-[76px]">
                        <div
                            ref={lanes}
                            className="pointer-events-auto absolute inset-0 cursor-ew-resize touch-none"
                            onPointerDown={(e) => {
                                e.currentTarget.setPointerCapture(e.pointerId);
                                setPlaying(false);
                                scrubFrom(e.clientX);
                            }}
                            onPointerMove={(e) => e.buttons === 1 && scrubFrom(e.clientX)}
                        />
                        <div className="absolute inset-y-[-6px] w-px bg-[var(--il-ink)] shadow-[0_0_12px_rgba(255,255,255,0.6)]" style={{ left: pct(t) }}>
                            <span className="il-mono absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-[var(--il-ink)] px-1.5 text-[9.5px] tabular-nums text-[var(--il-bg)]">{t.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* ruler */}
                <div className="mt-1 grid grid-cols-[112px_minmax(0,1fr)_56px] gap-3 sm:grid-cols-[150px_minmax(0,1fr)_64px]">
                    <div />
                    <div className="il-mono relative h-4 text-[9px] text-[var(--il-faint)]">
                        {Array.from({ length: IGLOO_TOTAL + 1 }, (_, i) => (
                            <span key={i} className="absolute -translate-x-1/2" style={{ left: pct(i) }}>
                                {i}
                            </span>
                        ))}
                    </div>
                </div>

                {/* what's on screen */}
                <div className="mt-5 grid gap-4 border-t border-[var(--il-line)] pt-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div>
                        <div className="il-mono mb-2.5 text-[10px] uppercase tracking-[0.14em] text-[var(--il-faint)]">Worlds rendered this frame</div>
                        <div className="space-y-2">
                            {WORLD_NAMES.map((n, i) => (
                                <div key={n} className="il-mono grid grid-cols-[70px_minmax(0,1fr)_42px] items-center gap-2 text-[11px]">
                                    <span style={{ color: weights[i] > 0 ? WORLD_COLORS[i] : 'var(--il-faint)' }}>{n}</span>
                                    <span className="h-1.5 overflow-hidden rounded-full bg-white/5">
                                        <span className="block h-full origin-left rounded-full" style={{ transform: `scaleX(${weights[i]})`, background: WORLD_COLORS[i] }} />
                                    </span>
                                    <span className="text-right tabular-nums text-[var(--il-dim)]">{`${Math.round(weights[i] * 100)}%`}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-[12px] leading-snug text-[var(--il-faint)]">Worlds at 0% are skipped entirely — no update, no render. At most two cost anything.</p>
                    </div>
                    <div className="rounded-xl border border-[var(--il-line)] bg-black/20 p-4">
                        <div className="il-mono mb-1 text-[10px] uppercase tracking-[0.14em]" style={{ color: act.color }}>{`Act ${act.n} — ${act.name}`}</div>
                        <p className="mb-2 text-[14px] leading-relaxed text-[#d3dbe6]">{act.see}</p>
                        <p className="il-mono text-[10.5px] text-[var(--il-faint)]">{act.file}</p>
                    </div>
                </div>

                {live && (
                    <div className="mt-5 overflow-hidden rounded-xl border border-[var(--il-line-2)]">
                        <div className="il-mono flex items-center justify-between border-b border-[var(--il-line)] px-3 py-2 text-[10.5px] text-[var(--il-faint)]">
                            <span>/igloo — scrolled by the playhead above (wait for the intro to finish)</span>
                        </div>
                        <iframe ref={frame} src="/igloo" title="Live /igloo page" className="aspect-video w-full bg-[var(--il-fog)]" />
                    </div>
                )}
            </div>
        </Demo>
    );
}
