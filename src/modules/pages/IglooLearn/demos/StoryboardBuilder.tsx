'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/utils/cn';

import { Btn, Demo } from '../kit/controls';

type Row = { id: number; what: string; target: string; prop: string; from: number; to: number; at: number; dur: number; ease: string };

const EASES = ['none', 'power1.inOut', 'power2.out', 'power3.inOut', 'expo.out', 'power2.in'];
const COLORS = ['#94dbff', '#d4c2ff', '#aef0d8', '#ffd08a', '#ff9fb2'];

const START: Row[] = [
    { id: 1, what: 'Hero copy fades out', target: "'.hero'", prop: 'autoAlpha', from: 1, to: 0, at: 0.15, dur: 0.7, ease: 'power1.in' },
    { id: 2, what: 'Camera rises', target: 'motion', prop: 'heroCam', from: 0, to: 1, at: 0.2, dur: 1.7, ease: 'power1.inOut' },
    { id: 3, what: 'Product explodes', target: 'motion', prop: 'explode', from: 0, to: 1, at: 0.3, dur: 1.5, ease: 'none' },
    { id: 4, what: 'Cross-fade to scene 2', target: 'motion', prop: 'scene', from: 0, to: 1, at: 1.3, dur: 1, ease: 'power1.inOut' },
    { id: 5, what: 'Features carousel', target: 'motion', prop: 'carousel', from: 0, to: 3, at: 2.2, dur: 4, ease: 'power3.inOut' },
];

const num = (v: string, fallback: number) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
};

/** Plan your own page in screens of scroll — get the timeline code for free. */
export default function StoryboardBuilder() {
    const [rows, setRows] = useState<Row[]>(START);
    const [next, setNext] = useState(6);
    const total = useMemo(() => Math.ceil(Math.max(1, ...rows.map((r) => r.at + r.dur)) * 2) / 2, [rows]);

    const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const add = () => {
        const end = Math.max(0, ...rows.map((r) => r.at + r.dur));
        setRows((rs) => [...rs, { id: next, what: 'New move', target: 'motion', prop: `dial${next}`, from: 0, to: 1, at: Math.round(end * 10) / 10, dur: 1, ease: 'none' }]);
        setNext((n) => n + 1);
    };

    const dials = [...new Set(rows.filter((r) => r.target === 'motion').map((r) => r.prop))];
    const code = `// 1 · the dials every scene reads
export const motion = { ${dials.map((d) => `${d}: ${rows.find((r) => r.prop === d)?.from ?? 0}`).join(', ')} };

// 2 · one master timeline — units are screens of scroll
const tl = gsap.timeline({ defaults: { ease: 'none' } });
${[...rows]
    .sort((a, b) => a.at - b.at)
    .map((r) => `tl.fromTo(${r.target}, { ${r.prop}: ${r.from} }, { ${r.prop}: ${r.to}, duration: ${r.dur}${r.ease !== 'none' ? `, ease: '${r.ease}'` : ''} }, ${r.at}); // ${r.what}`)
    .join('\n')}
tl.set({}, {}, ${total}); // pad to ${total} screens

// 3 · scroll drives the playhead
ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', animation: tl, scrub: true });

// 4 · the invisible scroll track
<div ref={track} style={{ height: '${(total + 1) * 100}vh' }} />   // (${total} + 1) × 100vh`;

    const input = 'il-mono w-full rounded border border-[var(--il-line)] bg-black/25 px-1.5 py-1 text-[11px] text-[var(--il-ink)] outline-none focus:border-[var(--il-ice)]';

    return (
        <Demo title="Storyboard → timeline" hint="Edit the moves (times are in screens of scroll). The tracks and the code below update live — copy the code into your project as a starting point.">
            <div className="space-y-5 p-4">
                {/* tracks */}
                <div>
                    <div className="il-mono mb-2 flex justify-between text-[10px] text-[var(--il-faint)]">
                        <span>{`${rows.length} moves · page = ${total} screens · track = ${(total + 1) * 100}vh`}</span>
                    </div>
                    <div className="space-y-1">
                        {rows.map((r, i) => (
                            <div key={r.id} className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-2">
                                <span className="il-mono truncate text-[10.5px] text-[var(--il-dim)]">{r.what}</span>
                                <span className="relative h-5 rounded bg-white/[0.03]">
                                    <span
                                        className="absolute top-0 h-full rounded border"
                                        style={{ left: `${(r.at / total) * 100}%`, width: `${(r.dur / total) * 100}%`, borderColor: `${COLORS[i % 5]}99`, background: `${COLORS[i % 5]}26` }}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="il-mono relative ml-[138px] mt-1 h-4 text-[9px] text-[var(--il-faint)]">
                        {Array.from({ length: Math.floor(total) + 1 }, (_, i) => (
                            <span key={i} className="absolute -translate-x-1/2" style={{ left: `${(i / total) * 100}%` }}>
                                {i}
                            </span>
                        ))}
                    </div>
                </div>

                {/* editor */}
                <div className="il-scrollbox overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                        <thead>
                            <tr className="il-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--il-faint)]">
                                {['what happens', 'target', 'property', 'from', 'to', 'start', 'length', 'ease', ''].map((h) => (
                                    <th key={h} className="px-1 pb-2 font-normal">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="p-1">
                                        <input className={input} value={r.what} onChange={(e) => update(r.id, { what: e.target.value })} />
                                    </td>
                                    <td className="w-[90px] p-1">
                                        <input className={input} value={r.target} onChange={(e) => update(r.id, { target: e.target.value })} />
                                    </td>
                                    <td className="w-[96px] p-1">
                                        <input className={input} value={r.prop} onChange={(e) => update(r.id, { prop: e.target.value.replace(/[^\w]/g, '') })} />
                                    </td>
                                    {(['from', 'to', 'at', 'dur'] as const).map((k) => (
                                        <td key={k} className="w-[62px] p-1">
                                            <input
                                                className={input}
                                                type="number"
                                                step={0.1}
                                                value={r[k]}
                                                onChange={(e) => update(r.id, { [k]: Math.max(k === 'dur' ? 0.1 : -99, num(e.target.value, r[k])) })}
                                            />
                                        </td>
                                    ))}
                                    <td className="w-[118px] p-1">
                                        <select className={input} value={r.ease} onChange={(e) => update(r.id, { ease: e.target.value })}>
                                            {EASES.map((e) => (
                                                <option key={e} value={e}>
                                                    {e}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="w-[28px] p-1">
                                        <button
                                            type="button"
                                            aria-label={`Remove ${r.what}`}
                                            onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                                            className={cn('il-mono text-[12px] text-[var(--il-faint)] hover:text-[var(--il-warn)]', rows.length <= 1 && 'invisible')}
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Btn primary onClick={add}>
                        + Add a move
                    </Btn>
                    <Btn onClick={() => setRows(START)}>Reset to example</Btn>
                    <Btn onClick={() => void navigator.clipboard?.writeText(code)}>Copy code</Btn>
                </div>
                <pre className="il-mono il-scrollbox overflow-x-auto rounded-xl border border-[var(--il-line)] bg-[#080b10] p-4 text-[11.5px] leading-relaxed text-[#cfeeff]">{code}</pre>
            </div>
        </Demo>
    );
}
