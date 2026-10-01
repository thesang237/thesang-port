'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

type Item = { id: string; text: string; where: string };
export type ChecklistGroup = { title: string; items: Item[] };

/** A checklist that remembers your ticks (in this browser only). */
export default function Checklist({ id, groups }: { id: string; groups: ChecklistGroup[] }) {
    const key = `ll-check-${id}`;
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
        <div className="overflow-hidden rounded-2xl border border-[var(--ll-line-2)] bg-[var(--ll-panel)]">
            <div className="ll-mono flex items-center justify-between border-b border-[var(--ll-line)] px-4 py-2.5 text-[11px]">
                <span className="uppercase tracking-[0.14em] text-[var(--ll-ink)]">Checklist</span>
                <span className="tabular-nums text-[var(--ll-mint)]">{`${done.length} / ${total}`}</span>
            </div>
            <div className="grid gap-px bg-[var(--ll-line)] sm:grid-cols-2">
                {groups.map((g) => (
                    <div key={g.title} className="bg-[var(--ll-panel)] p-4">
                        <div className="ll-mono mb-3 text-[10px] uppercase tracking-[0.16em] text-[var(--ll-faint)]">{g.title}</div>
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
                                                        ? 'border-[var(--ll-mint)] bg-[rgba(168,216,176,0.2)] text-[var(--ll-mint)]'
                                                        : 'border-[var(--ll-line-2)] text-transparent group-hover:border-[var(--ll-dim)]',
                                                )}
                                            >
                                                ✓
                                            </span>
                                            <span>
                                                <span
                                                    className={cn(
                                                        'block text-[13.5px] leading-snug transition-colors',
                                                        on ? 'text-[var(--ll-dim)] line-through decoration-[var(--ll-faint)]' : 'text-[#dfe2d5]',
                                                    )}
                                                >
                                                    {it.text}
                                                </span>
                                                <span className="ll-mono block text-[10.5px] text-[var(--ll-faint)]">{it.where}</span>
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
