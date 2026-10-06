'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

import { Btn, Demo } from '../kit/controls';
import { Grain } from '../kit/ui';

/** A checklist for your own long-form generative piece. Ticks are remembered in this browser. */
const ITEMS: { group: string; text: string; why: string }[] = [
    { group: 'Seeds', text: 'No Math.random() anywhere in the art', why: 'Every random number comes from the seeded stream, or the piece can’t be rebuilt.' },
    { group: 'Seeds', text: 'Traits rolled first, from their own stream', why: 'The label can be read without drawing, and drawing can’t change it.' },
    { group: 'Seeds', text: 'New features get their own stream', why: 'createRandom(seed + ":feature"): old seeds keep their pictures.' },
    { group: 'Seeds', text: 'A fingerprint test before and after any refactor', why: 'Draw a list of seeds, hash every dot, compare. This artwork’s refactor was checked on 57 seeds.' },
    { group: 'Look', text: 'Odds tuned by rolling thousands of seeds', why: 'Look at 50 thumbnails, not one: the collection is the artwork.' },
    { group: 'Look', text: 'Rules stop ugly combinations', why: 'Like Dancers only with 6+ dunes, Soft only on palettes that allow it.' },
    { group: 'Look', text: 'Same look at every screen size', why: 'Sizes as fractions of the canvas, a fixed pixel density, a square frame.' },
    { group: 'Tools', text: 'A debug panel with overrides', why: 'Every seeded value visible and forceable without touching the seed.' },
    { group: 'Tools', text: 'Seed lock in the URL', why: 'Refresh keeps the piece; a link shares it.' },
    { group: 'Tools', text: 'Save PNG at full resolution', why: 'The output is the work: export it exactly as drawn.' },
    { group: 'GPU', text: 'Shapes baked once, looked up per pixel', why: 'Heavy decisions on the CPU, light questions on the GPU.' },
    { group: 'GPU', text: 'Hash positions instead of a stream', why: 'Pixels run in parallel: randomness is a place, not a sequence.' },
    { group: 'GPU', text: 'Motion slow and pausable', why: 'Reduced motion starts paused; calm pieces move like weather.' },
];
const KEY = 'sl-build-checklist';

export default function Checklist() {
    const [done, setDone] = useState<boolean[]>(() => {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as boolean[];
            return ITEMS.map((_, i) => !!raw[i]);
        } catch {
            return ITEMS.map(() => false);
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(done));
        } catch {
            /* private mode: ticks just aren't remembered */
        }
    }, [done]);
    const count = done.filter(Boolean).length;
    const groups = [...new Set(ITEMS.map((i) => i.group))];

    return (
        <Demo
            title="Checklist for your own piece"
            hint="Tick what your project already does. Ticks stay in this browser."
            footer={<Btn onClick={() => setDone(ITEMS.map(() => false))}>Clear all</Btn>}
        >
            <div className="p-4 sm:p-5">
                <div className="sl-mono mb-4 flex items-center gap-2 text-[11px] uppercase text-[var(--sl-rust-ink)]">
                    <Grain filled={count === ITEMS.length} />
                    {`${count} / ${ITEMS.length} done`}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {groups.map((g) => (
                        <div key={g}>
                            <div className="sl-mono mb-2 text-[10px] uppercase text-[var(--sl-faint)]">{g}</div>
                            <ul className="space-y-2">
                                {ITEMS.map((it, i) =>
                                    it.group === g ? (
                                        <li key={it.text}>
                                            <label className="flex cursor-pointer gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={done[i]}
                                                    onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
                                                    className="mt-1 size-4 shrink-0 accent-[var(--sl-ink)]"
                                                />
                                                <span>
                                                    <span className={cn('block text-[15px] leading-snug', done[i] ? 'text-[var(--sl-dim)] line-through' : 'text-[var(--sl-ink)]')}>{it.text}</span>
                                                    <span className="block text-[12.5px] leading-snug text-[var(--sl-faint)]">{it.why}</span>
                                                </span>
                                            </label>
                                        </li>
                                    ) : null,
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </Demo>
    );
}
