'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

type Item = { id: string; text: string; where: string };
export type ChecklistGroup = { title: string; items: Item[] };

/** A checklist that remembers your ticks (in this browser only). */
export default function Checklist({ id, groups }: { id: string; groups: ChecklistGroup[] }) {
    const key = `kl-check-${id}`;
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
        <div className="overflow-hidden border border-[var(--kl-black)] bg-[var(--kl-panel)]">
            <div className="kl-mono flex items-center justify-between bg-[var(--kl-black)] px-4 py-2.5 text-[11px] text-white">
                <span className="uppercase">Checklist</span>
                <span className="tabular-nums text-[var(--kl-lime)]">{`${done.length} / ${total}`}</span>
            </div>
            <div className="grid gap-px bg-[var(--kl-line)] sm:grid-cols-2">
                {groups.map((g) => (
                    <div key={g.title} className="bg-[var(--kl-panel)] p-4">
                        <div className="kl-mono mb-3 text-[10.5px] uppercase text-[var(--kl-faint)]">{g.title}</div>
                        <ul className="space-y-2">
                            {g.items.map((it) => {
                                const on = done.includes(it.id);
                                return (
                                    <li key={it.id}>
                                        <button type="button" onClick={() => toggle(it.id)} className="group flex w-full gap-3 text-left" aria-pressed={on}>
                                            <span
                                                className={cn(
                                                    'mt-[3px] flex size-4 shrink-0 items-center justify-center border text-[10px] transition-colors',
                                                    on
                                                        ? 'border-[var(--kl-black)] bg-[var(--kl-lime)] text-[var(--kl-black)]'
                                                        : 'border-[var(--kl-line-2)] text-transparent group-hover:border-[var(--kl-black)]',
                                                )}
                                            >
                                                ✓
                                            </span>
                                            <span>
                                                <span
                                                    className={cn(
                                                        'block text-[13.5px] leading-snug transition-colors',
                                                        on ? 'text-[var(--kl-faint)] line-through decoration-[var(--kl-faint)]' : 'text-[var(--kl-body)]',
                                                    )}
                                                >
                                                    {it.text}
                                                </span>
                                                <span className="kl-mono block text-[10.5px] text-[var(--kl-faint)]">{it.where}</span>
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
