'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Readout, Segmented } from '../kit/controls';
import { CHAPTERS } from '../kit/source';

/**
 * Measured on the real /corn page (2026-10-03, Apple M4, Chrome / ANGLE Metal, 1920 × 994): one frame
 * at each stop after it settled, read from renderer.info and the engine's own tick timer.
 * Flicking through every stop with the pointer moving: p50 16.7 ms, p99 16.8 ms, 0 frames over 33 ms.
 */
const DATA = [
    { calls: 32, tris: 2297, points: 1189, lines: 506, cpu: 0.3, note: 'Cob cards drawn one by one in the artist’s order: many small draws, few triangles.' },
    { calls: 21, tris: 56, points: 9308, lines: 8629, cpu: 0.4, note: 'The DNA: 6,000 beads and 8,000 hairline segments, but only a handful of draw calls.' },
    { calls: 14, tris: 70, points: 2301, lines: 857, cpu: 0.6, note: 'The network: node positions are recomputed on the CPU every frame (noise breathing).' },
    { calls: 24, tris: 49258, points: 2276, lines: 810, cpu: 0.4, note: 'The pot and the skinned seedling.' },
    { calls: 34, tris: 132989, points: 325, lines: 493, cpu: 1.1, note: 'The field simulator: 16 rigged plants on springs, 153 billboards, depth-of-field passes. The heaviest stop.' },
    { calls: 11, tris: 305554, points: 579, lines: 969, cpu: 0.4, note: '9,600 plot slices in one instanced draw: the most triangles, the fewest calls.' },
    { calls: 19, tris: 2950, points: 2865, lines: 871, cpu: 0.7, note: 'The kernel, its molecules (springs) and the bokeh.' },
    { calls: 25, tris: 3062, points: 1943, lines: 2334, cpu: 0.7, note: 'Footer links: each GL title is 3 draws (links, letters, nodes).' },
    { calls: 24, tris: 182, points: 1943, lines: 2334, cpu: 0.4, note: 'The list scrolled up; the kernel has left.' },
];
type Metric = 'calls' | 'tris' | 'cpu';
const LABEL: Record<Metric, string> = { calls: 'draw calls', tris: 'triangles', cpu: 'CPU ms / frame' };

export default function BudgetChart() {
    const [metric, setMetric] = useState<Metric>('calls');
    const [sel, setSel] = useState(4);
    const max = Math.max(...DATA.map((d) => d[metric]));
    const d = DATA[sel];
    const fmt = (v: number) => (metric === 'tris' ? v.toLocaleString('en') : metric === 'cpu' ? `${v.toFixed(1)} ms` : String(v));

    return (
        <Demo title="The frame budget, measured on /corn" hint="Each bar is one stop of the real page, measured after it settled. Switch the metric and click a bar.">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="p-4 sm:p-5">
                    <Segmented
                        options={[
                            { value: 'calls', label: 'draw calls' },
                            { value: 'tris', label: 'triangles' },
                            { value: 'cpu', label: 'CPU ms' },
                        ]}
                        value={metric}
                        onChange={(v) => setMetric(v)}
                    />
                    <div className="mt-4 flex h-[220px] items-end gap-1.5 sm:gap-2" role="group" aria-label={`${LABEL[metric]} per stop`}>
                        {DATA.map((row, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setSel(i)}
                                aria-pressed={sel === i}
                                aria-label={`Stop ${i}: ${fmt(row[metric])}`}
                                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                            >
                                <span className="cl-mono text-[9.5px] tabular-nums text-[var(--cl-dim)]">{fmt(row[metric])}</span>
                                <span
                                    className={cn('w-full rounded-t-sm transition-colors', sel === i ? 'bg-[var(--cl-mint)]' : 'bg-[rgba(85,255,194,0.3)] group-hover:bg-[rgba(85,255,194,0.55)]')}
                                    style={{ height: `${Math.max(2, (row[metric] / max) * 170)}px` }}
                                />
                                <span className="cl-mono text-[9.5px] text-[var(--cl-faint)]">{i}</span>
                            </button>
                        ))}
                    </div>
                    {metric === 'cpu' && (
                        <p className="cl-mono mt-3 text-[10.5px] text-[var(--cl-dim)]">The whole budget is 16.7 ms: the heaviest stop uses 1.1 ms of JavaScript (6.6 %). The GPU does the rest.</p>
                    )}
                </div>
                <div className="space-y-3 border-t border-[var(--cl-line)] p-4 lg:border-l lg:border-t-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/corn-learn/stops/stop${sel}.webp`} alt={`Stop ${sel}`} className="aspect-[1920/994] w-full rounded-md border border-[var(--cl-line-2)] object-cover" />
                    <div className="cl-mono text-[11px] uppercase text-[var(--cl-mint)]">{`stop ${sel} · ${CHAPTERS[sel].id} · ${CHAPTERS[sel].world}`}</div>
                    <Readout
                        items={[
                            { label: 'draw calls', value: d.calls },
                            { label: 'triangles', value: d.tris.toLocaleString('en') },
                            { label: 'points', value: d.points.toLocaleString('en') },
                            { label: 'lines', value: d.lines.toLocaleString('en') },
                            { label: 'CPU / frame', value: `${d.cpu.toFixed(1)} ms`, color: '#e9c46a' },
                            { label: 'frame', value: '16.7 ms', color: '#55ffc2' },
                        ]}
                    />
                    <p className="text-[13px] leading-relaxed text-[var(--cl-dim)]">{d.note}</p>
                </div>
            </div>
        </Demo>
    );
}
