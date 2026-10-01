'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

type Item = { id: string; text: string; where: string };
export type ChecklistGroup = { title: string; items: Item[] };

/** A checklist that remembers your ticks (in this browser only). */
export default function Checklist({ id, groups }: { id: string; groups: ChecklistGroup[] }) {
    const key = `il-check-${id}`;
    // client-only guide: read saved ticks straight into the initial state
    const [done, setDone] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
        } catch {
            return [];
        }
    });

    const toggle = (itemId: string) =>
        setDone((d) => {
            const next = d.includes(itemId) ? d.filter((x) => x !== itemId) : [...d, itemId];
            try {
                localStorage.setItem(key, JSON.stringify(next));
            } catch {
                /* storage unavailable — ticks just won't persist */
            }
            return next;
        });

    const total = groups.reduce((n, g) => n + g.items.length, 0);

    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--il-line-2)] bg-[var(--il-panel)]">
            <div className="il-mono flex items-center justify-between border-b border-[var(--il-line)] px-4 py-2.5 text-[11px]">
                <span className="uppercase tracking-[0.14em] text-[var(--il-ink)]">Checklist</span>
                <span className="tabular-nums text-[var(--il-mint)]">{`${done.length} / ${total}`}</span>
            </div>
            <div className="grid gap-px bg-[var(--il-line)] sm:grid-cols-2">
                {groups.map((g) => (
                    <div key={g.title} className="bg-[var(--il-panel)] p-4">
                        <div className="il-mono mb-3 text-[10px] uppercase tracking-[0.16em] text-[var(--il-faint)]">{g.title}</div>
                        <ul className="space-y-2">
                            {g.items.map((it) => {
                                const on = done.includes(it.id);
                                return (
                                    <li key={it.id}>
                                        <button type="button" onClick={() => toggle(it.id)} className="group flex w-full gap-3 text-left" aria-pressed={on}>
                                            <span
                                                className={cn(
                                                    'mt-[3px] flex size-4 shrink-0 items-center justify-center rounded border text-[10px] transition-colors',
                                                    on
                                                        ? 'border-[var(--il-mint)] bg-[rgba(174,240,216,0.2)] text-[var(--il-mint)]'
                                                        : 'border-[var(--il-line-2)] text-transparent group-hover:border-[var(--il-dim)]',
                                                )}
                                            >
                                                ✓
                                            </span>
                                            <span>
                                                <span
                                                    className={cn(
                                                        'block text-[13.5px] leading-snug transition-colors',
                                                        on ? 'text-[var(--il-dim)] line-through decoration-[var(--il-faint)]' : 'text-[#d3dbe6]',
                                                    )}
                                                >
                                                    {it.text}
                                                </span>
                                                <span className="il-mono block text-[10.5px] text-[var(--il-faint)]">{it.where}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
