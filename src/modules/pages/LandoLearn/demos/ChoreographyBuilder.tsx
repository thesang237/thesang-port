'use client';

import { type CSSProperties, useMemo, useRef, useState } from 'react';

import { Btn, Demo, Segmented, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { Code } from '../kit/ui';

const MOTIONS = {
    rise: { from: { yPercent: 110 }, to: { yPercent: 0 }, code: ['{ yPercent: 110 }', '{ yPercent: 0'] },
    fade: { from: { autoAlpha: 0 }, to: { autoAlpha: 1 }, code: ['{ autoAlpha: 0 }', '{ autoAlpha: 1'] },
    drop: { from: { scaleY: 0 }, to: { scaleY: 1 }, code: ['{ scaleY: 0 }', '{ scaleY: 1'] },
    wipe: { from: { '--clip': 0 }, to: { '--clip': 1 }, code: ["{ '--clip': 0 }", "{ '--clip': 1"] },
    grow: { from: { scaleX: 0 }, to: { scaleX: 1 }, code: ['{ scaleX: 0 }', '{ scaleX: 1'] },
} as const;
type Motion = keyof typeof MOTIONS;
const EASES = ['power1.out', 'power2.out', 'power3.out', 'power2.inOut', 'power1.in', 'power2.in', 'expo.in', 'expo.out', 'none'];

type Row = { name: string; motion: Motion; start: number; dur: number; ease: string; count: number; stagger: number };

const PRESETS: Record<string, Row[]> = {
    'Menu open (source)': [
        { name: '.panel', motion: 'drop', start: 0, dur: 0.41, ease: 'power1.out', count: 1, stagger: 0 },
        { name: '.photo', motion: 'wipe', start: 0.16, dur: 0.34, ease: 'power2.out', count: 4, stagger: 0.06 },
        { name: '.contours', motion: 'fade', start: 0.2, dur: 0.4, ease: 'none', count: 1, stagger: 0 },
        { name: '.nav-item', motion: 'rise', start: 0.38, dur: 0.26, ease: 'power3.out', count: 4, stagger: 0.075 },
        { name: '.strike', motion: 'grow', start: 0.55, dur: 0.4, ease: 'power2.out', count: 1, stagger: 0 },
    ],
    'Hero intro': [
        { name: '.title-line', motion: 'rise', start: 0, dur: 0.75, ease: 'power3.out', count: 3, stagger: 0.08 },
        { name: '.rule', motion: 'grow', start: 0.2, dur: 0.9, ease: 'expo.out', count: 1, stagger: 0 },
        { name: '.lead', motion: 'fade', start: 0.45, dur: 0.8, ease: 'power3.out', count: 2, stagger: 0.07 },
    ],
    Blank: [{ name: '.thing', motion: 'fade', start: 0, dur: 0.5, ease: 'power2.out', count: 1, stagger: 0 }],
};
const COLORS = ['#cdff0b', '#a8d8b0', '#d6ad5a', '#f1f3e8', '#ffb36b', '#b5b7ae', '#9fc3ff'];

function toCode(rows: Row[]) {
    const lines = rows.map((r) => {
        const [f, t] = MOTIONS[r.motion].code;
        const stagger = r.count > 1 && r.stagger > 0 ? `, stagger: ${r.stagger}` : '';
        return `  .fromTo('${r.name}', ${f}, ${t}, duration: ${r.dur}, ease: '${r.ease}'${stagger} }, ${r.start})`;
    });
    return `const tl = gsap.timeline();\ntl\n${lines.join('\n')};`;
}

/** Plan a sequence as rows (element, motion, start, duration, ease, stagger) → preview → copyable GSAP code. */
export default function ChoreographyBuilder() {
    const [preset, setPreset] = useState('Menu open (source)');
    const [rows, setRows] = useState<Row[]>(PRESETS['Menu open (source)']);
    const [slow, setSlow] = useState(false);
    const stage = useRef<HTMLDivElement>(null);
    const head = useRef<HTMLSpanElement>(null);
    const total = Math.max(0.5, ...rows.map((r) => r.start + r.dur + (r.count - 1) * r.stagger));
    const code = useMemo(() => toCode(rows), [rows]);

    const play = () => {
        const tl = gsap.timeline();
        rows.forEach((r, i) => {
            const els = gsap.utils.toArray<HTMLElement>(`.cb-lane-${i} .cb-el`, stage.current);
            const m = MOTIONS[r.motion];
            tl.fromTo(els, { ...m.from }, { ...m.to, duration: r.dur, ease: r.ease, stagger: r.stagger }, r.start);
        });
        tl.fromTo(head.current, { left: '0%' }, { left: '100%', duration: total, ease: 'none' }, 0);
        tl.timeScale(slow ? 0.25 : 1);
    };

    const edit = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
    const num = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Number(v) || 0));
    const input = 'll-mono w-full rounded border border-[var(--ll-line-2)] bg-black/20 px-1.5 py-1 text-[11px] text-[var(--ll-ink)]';

    return (
        <Demo
            title="Choreography builder"
            hint="Pick a preset (the menu is the real one), edit any number, press Play. The GSAP code below updates as you type — copy it into your project."
            controls={
                <>
                    <Segmented
                        label="preset"
                        options={Object.keys(PRESETS)}
                        value={preset}
                        onChange={(v) => {
                            setPreset(v);
                            setRows(PRESETS[v]);
                        }}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Btn primary onClick={play}>
                            ▶ Play
                        </Btn>
                        <Btn onClick={() => setRows((rs) => [...rs, { name: `.new-${rs.length + 1}`, motion: 'fade', start: total, dur: 0.4, ease: 'power2.out', count: 1, stagger: 0 }])}>+ Row</Btn>
                    </div>
                    <Toggle label="slow motion ×4" checked={slow} onChange={setSlow} />
                </>
            }
            footer={<Code file="generated">{code}</Code>}
        >
            <div className="space-y-3 p-4">
                <div className="ll-scrollbox overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                        <thead>
                            <tr className="ll-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--ll-faint)]">
                                {['element', 'motion', 'start', 'duration', 'ease', 'count', 'stagger', ''].map((h) => (
                                    <th key={h} className="px-1 pb-1.5 font-normal">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i}>
                                    <td className="p-1">
                                        <input aria-label="element" className={input} value={r.name} onChange={(e) => edit(i, { name: e.target.value })} style={{ color: COLORS[i % COLORS.length] }} />
                                    </td>
                                    <td className="p-1">
                                        <select aria-label="motion" className={input} value={r.motion} onChange={(e) => edit(i, { motion: e.target.value as Motion })}>
                                            {Object.keys(MOTIONS).map((m) => (
                                                <option key={m}>{m}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="w-[70px] p-1">
                                        <input aria-label="start" type="number" step={0.01} className={input} value={r.start} onChange={(e) => edit(i, { start: num(e.target.value, 0, 10) })} />
                                    </td>
                                    <td className="w-[70px] p-1">
                                        <input aria-label="duration" type="number" step={0.01} className={input} value={r.dur} onChange={(e) => edit(i, { dur: num(e.target.value, 0.01, 10) })} />
                                    </td>
                                    <td className="p-1">
                                        <select aria-label="ease" className={input} value={r.ease} onChange={(e) => edit(i, { ease: e.target.value })}>
                                            {EASES.map((m) => (
                                                <option key={m}>{m}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="w-[56px] p-1">
                                        <input aria-label="count" type="number" min={1} max={8} className={input} value={r.count} onChange={(e) => edit(i, { count: num(e.target.value, 1, 8) })} />
                                    </td>
                                    <td className="w-[70px] p-1">
                                        <input aria-label="stagger" type="number" step={0.005} className={input} value={r.stagger} onChange={(e) => edit(i, { stagger: num(e.target.value, 0, 2) })} />
                                    </td>
                                    <td className="p-1">
                                        <button
                                            type="button"
                                            aria-label="Remove row"
                                            onClick={() => setRows((rs) => rs.filter((_, k) => k !== i))}
                                            className="px-1 text-[var(--ll-faint)] hover:text-[var(--ll-warn)]"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div ref={stage} className="relative space-y-2 rounded-xl border border-[var(--ll-line)] bg-[var(--ll-bg-2)] p-3">
                    {rows.map((r, i) => {
                        const c = COLORS[i % COLORS.length];
                        return (
                            <div key={i} className={`cb-lane-${i} grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3`}>
                                <div className="flex h-7 items-center gap-1 overflow-hidden">
                                    {Array.from({ length: r.count }, (_, k) => (
                                        <span
                                            key={k}
                                            className="cb-el block h-6 w-4 shrink-0 rounded-sm"
                                            style={
                                                {
                                                    background: c,
                                                    transformOrigin: r.motion === 'drop' ? '50% 0%' : '0% 50%',
                                                    '--clip': 1,
                                                    clipPath: r.motion === 'wipe' ? 'inset(0 0 calc((1 - var(--clip)) * 100%) 0)' : undefined,
                                                } as CSSProperties
                                            }
                                        />
                                    ))}
                                </div>
                                <div className="relative h-4">
                                    {Array.from({ length: r.count }, (_, k) => (
                                        <span
                                            key={k}
                                            className="absolute rounded-sm opacity-80"
                                            style={{
                                                left: `${((r.start + k * r.stagger) / total) * 100}%`,
                                                width: `${(r.dur / total) * 100}%`,
                                                top: `${(k / r.count) * 100}%`,
                                                height: `${100 / r.count}%`,
                                                background: c,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    <div className="pointer-events-none absolute inset-y-2 left-[124px] right-3">
                        <span ref={head} className="absolute inset-y-0 w-px bg-[#f1f3e8]" style={{ left: 0 }} />
                    </div>
                    <div className="ll-mono pl-[112px] text-right text-[10px] text-[var(--ll-faint)]">{`${total.toFixed(2)} s`}</div>
                </div>
            </div>
        </Demo>
    );
}
