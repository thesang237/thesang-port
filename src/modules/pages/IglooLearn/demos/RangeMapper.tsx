'use client';

import { useState } from 'react';

import { Demo, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';
import { ease, IGLOO_EASES, lerp, progressIn } from '../kit/math';

type Prop = 'opacity' | 'y' | 'scale' | 'rotate' | 'blur';
const PROPS: Record<Prop, { from: number; to: number; unit: string; css: (v: number) => React.CSSProperties }> = {
    opacity: { from: 0, to: 1, unit: '', css: (v) => ({ opacity: v }) },
    y: { from: 120, to: 0, unit: 'px', css: (v) => ({ transform: `translateY(${v}px)` }) },
    scale: { from: 0.6, to: 1, unit: '', css: (v) => ({ transform: `scale(${v})` }) },
    rotate: { from: -45, to: 0, unit: '°', css: (v) => ({ transform: `rotate(${v}deg)` }) },
    blur: { from: 16, to: 0, unit: 'px', css: (v) => ({ filter: `blur(${v}px)` }) },
};

const DEFAULTS = { start: 0.3, end: 0.65, ease: 'expo.out' as string, prop: 'opacity' as Prop };

/** Scroll → progress → window → ease → value. The whole chapter in one widget. */
export default function RangeMapper() {
    const { p, set, reset } = useParams(DEFAULTS);
    const [scroll, setScroll] = useState(0.42);

    const local = progressIn(scroll, p.start, p.end);
    const eased = ease(p.ease)(local);
    const def = PROPS[p.prop];
    const value = lerp(def.from, def.to, eased);

    const W = 300;
    const H = 180;
    const curve = Array.from({ length: 81 }, (_, i) => {
        const x = i / 80;
        const y = ease(p.ease)(progressIn(x, p.start, p.end));
        return `${(x * W).toFixed(1)},${(H - y * H).toFixed(1)}`;
    }).join(' ');

    return (
        <Demo
            title="Range mapper — scroll to property"
            hint="Scroll inside the left box. The graph shows which part of the scroll (the shaded window) drives the property, and with what curve."
            onReset={() => {
                reset();
                setScroll(0.42);
            }}
            controls={
                <>
                    <Slider label="window start" value={p.start} min={0} max={0.95} onChange={(v) => set('start', Math.min(v, p.end - 0.02))} help="Scroll progress where the animation begins." />
                    <Slider
                        label="window end"
                        value={p.end}
                        min={0.05}
                        max={1}
                        onChange={(v) => set('end', Math.max(v, p.start + 0.02))}
                        help="Where it finishes. A short window = a fast, punchy move."
                    />
                    <Segmented label="ease" options={IGLOO_EASES.slice(0, 8)} value={p.ease} onChange={(v) => set('ease', v)} />
                    <Segmented label="property" options={['opacity', 'y', 'scale', 'rotate', 'blur'] as const} value={p.prop} onChange={(v) => set('prop', v)} />
                </>
            }
        >
            <div className="grid gap-4 p-4 sm:grid-cols-[150px_minmax(0,1fr)]">
                {/* scroll input */}
                <div
                    data-lenis-prevent
                    className="il-scrollbox relative h-[300px] overflow-y-auto rounded-xl border border-[var(--il-line-2)] bg-black/25"
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        setScroll(el.scrollTop / (el.scrollHeight - el.clientHeight));
                    }}
                    ref={(el) => {
                        if (el && !el.dataset.init) {
                            el.dataset.init = '1';
                            el.scrollTop = 0.42 * (el.scrollHeight - el.clientHeight);
                        }
                    }}
                >
                    <div className="h-[1200px] bg-[repeating-linear-gradient(180deg,transparent_0_59px,rgba(196,212,235,0.08)_59px_60px)]">
                        <div className="il-mono sticky top-0 flex h-[298px] flex-col items-center justify-center gap-1 text-center">
                            <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--il-faint)]">scroll me</span>
                            <span className="text-[34px] font-medium tabular-nums text-[var(--il-ink)]">{scroll.toFixed(2)}</span>
                            <span className="text-[10px] text-[var(--il-faint)]">progress</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
                    {/* graph */}
                    <div>
                        <svg viewBox={`-8 -8 ${W + 16} ${H + 24}`} className="max-h-[260px] w-full">
                            <rect x={p.start * W} y={0} width={(p.end - p.start) * W} height={H} fill="rgba(148,219,255,0.07)" />
                            <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(196,212,235,0.25)" />
                            <line x1={0} y1={0} x2={0} y2={H} stroke="rgba(196,212,235,0.25)" />
                            <polyline points={curve} fill="none" stroke="#94dbff" strokeWidth="2" />
                            <line x1={scroll * W} y1={0} x2={scroll * W} y2={H} stroke="rgba(232,237,244,0.5)" strokeDasharray="3 3" />
                            <circle cx={scroll * W} cy={H - eased * H} r="5" fill="#e8edf4" />
                            <text x={0} y={H + 16} fill="#627083" fontSize="10" fontFamily="var(--font-il-mono)">
                                0
                            </text>
                            <text x={W - 6} y={H + 16} fill="#627083" fontSize="10" fontFamily="var(--font-il-mono)">
                                1
                            </text>
                            <text x={p.start * W + 4} y={12} fill="#94dbff" fontSize="10" fontFamily="var(--font-il-mono)">
                                window
                            </text>
                        </svg>
                        <div className="il-mono mt-3 space-y-1 rounded-lg border border-[var(--il-line)] bg-black/25 p-3 text-[11px] leading-relaxed">
                            <div>
                                <span className="text-[var(--il-faint)]">1 normalise </span>({scroll.toFixed(2)} − {p.start.toFixed(2)}) / ({p.end.toFixed(2)} − {p.start.toFixed(2)})
                            </div>
                            <div>
                                <span className="text-[var(--il-faint)]">2 clamp 0..1 </span>→ <span className="text-[var(--il-ink)]">{local.toFixed(3)}</span>
                            </div>
                            <div>
                                <span className="text-[var(--il-faint)]">3 ease </span>
                                {p.ease}({local.toFixed(2)}) → <span className="text-[var(--il-ink)]">{eased.toFixed(3)}</span>
                            </div>
                            <div>
                                <span className="text-[var(--il-faint)]">4 lerp </span>
                                {p.prop}({def.from}, {def.to}) → <span className="text-[var(--il-ice)]">{`${value.toFixed(2)}${def.unit}`}</span>
                            </div>
                        </div>
                    </div>
                    {/* preview */}
                    <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-[var(--il-line)] bg-[radial-gradient(circle_at_50%_30%,rgba(148,219,255,0.08),transparent_70%)]">
                        <div
                            className="flex size-28 items-center justify-center rounded-2xl border border-white/30 bg-[linear-gradient(135deg,#dfe9f5,#8fa1b8)] text-[#0a0d13] shadow-[0_20px_50px_-20px_rgba(148,219,255,0.5)]"
                            style={def.css(value)}
                        >
                            <span className="text-[13px] font-semibold tracking-[-0.01em]">Crystal</span>
                        </div>
                    </div>
                </div>
            </div>
        </Demo>
    );
}
