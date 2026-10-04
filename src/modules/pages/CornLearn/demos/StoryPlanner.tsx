'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import { Btn, Demo } from '../kit/controls';
import { Code } from '../kit/ui';

/**
 * Plan your own chapter story the way /corn is built: a list of chapters (title, world, how it enters,
 * dwell steps). It computes the step timeline with the same rule as engine/Timeline.ts (each chapter
 * owns dwell + 1 steps), checks the usual mistakes, and writes the CHAPTERS config for you.
 */
type Row = { id: string; title: string; world: string; enter: 'wipe' | 'blend'; dwell: number };
const WORLDS = ['hero', 'science', 'stalk', 'plots', 'kernel', 'studio', 'city'];
const START: Row[] = [
    { id: 'hero', title: 'GRAIN. REENGINEERED.', world: 'hero', enter: 'wipe', dwell: 1 },
    { id: 'library', title: 'IT STARTS WITH | A DEEP LIBRARY.', world: 'science', enter: 'wipe', dwell: 1 },
    { id: 'models', title: 'SIMULATIONS | THIN OUT THE | CANDIDATES.', world: 'science', enter: 'blend', dwell: 1 },
    { id: 'outside', title: 'THEN IT GOES | OUTSIDE.', world: 'stalk', enter: 'wipe', dwell: 2 },
    { id: 'cut', title: 'FEWER THAN | 1 IN 10,000 | MAKE THE CUT.', world: 'kernel', enter: 'wipe', dwell: 1 },
];
const GLYPHS = /^[A-Z0-9.,!?%$\-[\] |]*$/;
const COLORS: Record<string, string> = { hero: '#2a8f5a', science: '#ed863b', stalk: '#8fbf5a', plots: '#c9b45a', kernel: '#e9c46a', studio: '#7ddbbf', city: '#b58cff' };
const slug = (s: string) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 16) || 'chapter';

export default function StoryPlanner() {
    const [rows, setRows] = useState<Row[]>(START);
    const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
    const move = (i: number, d: number) =>
        setRows((r) => {
            const j = i + d;
            if (j < 0 || j >= r.length) return r;
            const next = [...r];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });

    // Timeline.ts: every chapter owns its dwell steps + one move step
    const starts: number[] = [];
    let total = 0;
    rows.forEach((r) => {
        starts.push(total);
        total += r.dwell + 1;
    });

    const warnings: string[] = [];
    rows.forEach((r, i) => {
        const prev = rows[i - 1];
        if (!GLYPHS.test(r.title.toUpperCase())) warnings.push(`“${r.id}”: the caps face has no glyph for some characters (only A–Z 0–9 . , ! ? % $ - [ ]).`);
        if (prev && r.enter === 'blend' && prev.world !== r.world)
            warnings.push(`“${r.id}” blends from a different world (${prev.world} → ${r.world}): blends only work inside one world. Use a wipe.`);
        if (prev && r.enter === 'wipe' && prev.world === r.world) warnings.push(`“${r.id}” wipes inside the same world (${r.world}): a blend would feel like the same place.`);
        if (r.world !== 'hero' && r.dwell === 0 && i < rows.length - 1) warnings.push(`“${r.id}” has no dwell: the next scroll leaves at once and the scene can’t travel.`);
    });
    const worldsUsed = [...new Set(rows.map((r) => r.world))];

    const code = `export const CHAPTERS: Chapter[] = [\n${rows
        .map((r) => {
            const lines = r.title
                .split('|')
                .map((l) => `'${l.trim().toUpperCase().replace(/'/g, '')}'`)
                .join(', ');
            return `    { id: '${r.id}', world: '${r.world}', title: [${lines}], enter: '${r.enter}'${r.dwell !== 1 ? `, dwell: ${r.dwell}` : ''} },`;
        })
        .join('\n')}\n];\n// ${rows.length} chapters · ${worldsUsed.length} worlds (${worldsUsed.join(', ')}) · ${total} steps · step ${total} loops to the start`;

    const input = 'cl-mono w-full rounded-md border border-[var(--cl-line-2)] bg-[#030806] px-2 py-1.5 text-[12px] text-[var(--cl-ink)] outline-none focus:border-[var(--cl-mint)]';

    return (
        <Demo
            title="Story planner: your chapters → timeline → config"
            hint="Edit the list: titles (use | for a line break), worlds, wipe or blend, dwell steps. The timeline and the code update as you type."
            onReset={() => setRows(START)}
        >
            <div className="space-y-5 p-4 sm:p-5">
                <div className="cl-scrollbox overflow-x-auto" data-lenis-prevent>
                    <table className="w-full min-w-[720px] border-collapse text-left">
                        <thead>
                            <tr className="cl-mono text-[10px] uppercase text-[var(--cl-faint)]">
                                <th className="pb-2 pr-2 font-normal">#</th>
                                <th className="pb-2 pr-2 font-normal">Title (| = new line)</th>
                                <th className="pb-2 pr-2 font-normal">World</th>
                                <th className="pb-2 pr-2 font-normal">Enters with</th>
                                <th className="pb-2 pr-2 font-normal">Dwell</th>
                                <th className="pb-2 font-normal" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} className="border-t border-[var(--cl-line)] align-middle">
                                    <td className="cl-mono py-2 pr-2 text-[11px] text-[var(--cl-dim)]">{i}</td>
                                    <td className="py-2 pr-2">
                                        <input
                                            aria-label={`Title of chapter ${i}`}
                                            className={input}
                                            value={r.title}
                                            onChange={(e) => update(i, { title: e.target.value, id: i === 0 ? 'hero' : slug(e.target.value.split('|')[0]) })}
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <select aria-label={`World of chapter ${i}`} className={input} value={r.world} onChange={(e) => update(i, { world: e.target.value })}>
                                            {WORLDS.map((w) => (
                                                <option key={w} value={w}>
                                                    {w}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-2 pr-2">
                                        <div className="flex gap-1">
                                            {(['wipe', 'blend'] as const).map((e) => (
                                                <button
                                                    key={e}
                                                    type="button"
                                                    aria-pressed={r.enter === e}
                                                    onClick={() => update(i, { enter: e })}
                                                    className={cn(
                                                        'cl-btn cl-mono rounded-full border px-2.5 py-1 text-[10.5px]',
                                                        r.enter === e ? 'border-[var(--cl-mint)] bg-[rgba(85,255,194,0.14)] text-[var(--cl-mint)]' : 'border-[var(--cl-line-2)] text-[var(--cl-dim)]',
                                                    )}
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-2 pr-2">
                                        <div className="flex gap-1">
                                            {[0, 1, 2, 3].map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    aria-pressed={r.dwell === d}
                                                    aria-label={`Dwell ${d}`}
                                                    onClick={() => update(i, { dwell: d })}
                                                    className={cn(
                                                        'cl-btn cl-mono size-7 rounded-full border text-[10.5px]',
                                                        r.dwell === d ? 'border-[var(--cl-mint)] bg-[rgba(85,255,194,0.14)] text-[var(--cl-mint)]' : 'border-[var(--cl-line-2)] text-[var(--cl-dim)]',
                                                    )}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-2">
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                aria-label="Move up"
                                                onClick={() => move(i, -1)}
                                                className="cl-btn cl-mono size-7 rounded-full border border-[var(--cl-line-2)] text-[11px] text-[var(--cl-dim)]"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Move down"
                                                onClick={() => move(i, 1)}
                                                className="cl-btn cl-mono size-7 rounded-full border border-[var(--cl-line-2)] text-[11px] text-[var(--cl-dim)]"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Remove"
                                                disabled={rows.length < 2}
                                                onClick={() => setRows((rr) => rr.filter((_, j) => j !== i))}
                                                className="cl-btn cl-mono size-7 rounded-full border border-[var(--cl-line-2)] text-[11px] text-[var(--cl-warn)] disabled:opacity-30"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Btn onClick={() => setRows((r) => [...r, { id: `chapter-${r.length}`, title: 'A NEW CHAPTER.', world: r[r.length - 1]?.world ?? 'hero', enter: 'blend', dwell: 1 }])}>
                    + Add a chapter
                </Btn>

                <div>
                    <div className="cl-mono mb-2 text-[10px] uppercase text-[var(--cl-faint)]">Timeline: dwell steps (scene travels, copy holds) and move steps (wipe or blend)</div>
                    <div className="cl-scrollbox overflow-x-auto" data-lenis-prevent>
                        <div className="flex min-w-[560px] gap-px">
                            {rows.map((r, i) => {
                                const next = rows[i + 1] ?? rows[0];
                                return (
                                    <div key={i} className="flex" style={{ flex: r.dwell + 1 }}>
                                        {Array.from({ length: r.dwell }, (_, k) => (
                                            <div key={k} className="h-9 flex-1 rounded-sm" style={{ background: `${COLORS[r.world]}55` }} title={`${r.id}: dwell ${k + 1}`} />
                                        ))}
                                        <div
                                            className="h-9 flex-1 rounded-sm"
                                            style={{
                                                background:
                                                    next.enter === 'wipe'
                                                        ? `linear-gradient(105deg, ${COLORS[r.world]} 48%, ${COLORS[next.world]} 52%)`
                                                        : `linear-gradient(90deg, ${COLORS[r.world]}, ${COLORS[next.world]})`,
                                            }}
                                            title={`${r.id} → ${next.id} (${next.enter})`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex min-w-[560px] gap-px pt-1">
                            {rows.map((r, i) => (
                                <div key={i} className="cl-mono truncate text-[10px] text-[var(--cl-dim)]" style={{ flex: r.dwell + 1 }}>{`${starts[i]} · ${r.id}`}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {warnings.length ? (
                    <ul className="space-y-1 rounded-md border border-[rgba(255,122,89,0.35)] bg-[rgba(255,122,89,0.05)] p-3">
                        {warnings.map((w) => (
                            <li key={w} className="text-[13px] leading-snug text-[var(--cl-body)]">
                                <span className="text-[var(--cl-warn)]">! </span>
                                {w}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="cl-mono text-[11px] text-[var(--cl-mint)]">No warnings: wipes change world, blends stay in one.</p>
                )}

                <Code file="data/story.ts (generated)">{code}</Code>
            </div>
        </Demo>
    );
}
