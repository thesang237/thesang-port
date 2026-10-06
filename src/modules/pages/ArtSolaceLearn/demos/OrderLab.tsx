'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Segmented, Slider } from '../kit/controls';
import { createRandom, type Random, rollTraits, type Traits } from '../kit/source';

type Call = { n: number; value: number; extra: boolean };

/**
 * Wrap a Random so we can watch every number it hands out, and optionally sneak in one extra call
 * before call number `insertAt` (what happens when someone adds a feature in the middle).
 */
function watched(seed: string, insertAt: number | null) {
    const base = createRandom(seed);
    const calls: Call[] = [];
    let n = 0;
    const next = () => {
        if (insertAt !== null && n === insertAt) {
            calls.push({ n: n++, value: base.next(), extra: true });
        }
        const value = base.next();
        calls.push({ n: n++, value, extra: false });
        return value;
    };
    const rand: Random = {
        next,
        range: (lo, hi) => lo + next() * (hi - lo),
        pick: (items) => items[Math.floor(next() * items.length)],
        chance: (p) => next() < p,
        gaussian: base.gaussian,
    };
    return { rand, calls };
}

const KEYS: (keyof Traits)[] = ['Palette', 'Dunes', 'Sky', 'Margin', 'Brush', 'Render', 'Dusty', 'Misty', 'Dancers', 'Sandstorm'];
const SEEDS = ['solace', 'r29', 'dune', 'quiet'] as const;

/** The one rule, made visible: one extra random call shifts every choice after it. */
export default function OrderLab() {
    const [seed, setSeed] = useState<string>('solace');
    const [insert, setInsert] = useState(3);
    const [on, setOn] = useState(true);

    const { before, after, calls } = useMemo(() => {
        const a = watched(seed, null);
        const before = rollTraits(a.rand);
        const b = watched(seed, on ? insert : null);
        const after = rollTraits(b.rand);
        return { before, after, calls: b.calls };
    }, [seed, insert, on]);

    return (
        <Demo
            title="The one rule"
            hint="Slide where a new feature sneaks one extra random call in. Every trait rolled after that point changes."
            onReset={() => {
                setInsert(3);
                setOn(true);
            }}
            controls={
                <>
                    <Segmented label="Seed" options={SEEDS} value={seed} onChange={setSeed} />
                    <Segmented
                        label="Extra call"
                        options={[
                            { value: 'on', label: 'inserted' },
                            { value: 'off', label: 'none' },
                        ]}
                        value={on ? 'on' : 'off'}
                        onChange={(v) => setOn(v === 'on')}
                    />
                    <Slider label="insert before call #" value={insert} min={0} max={8} step={1} onChange={setInsert} help="0 = the very first number (the palette)." />
                </>
            }
        >
            <div className="space-y-5 p-4 sm:p-6">
                <div>
                    <div className="sl-mono mb-2 text-[10px] uppercase text-[var(--sl-faint)]">The traits stream, call by call</div>
                    <div className="flex flex-wrap gap-1">
                        {calls.map((c) => (
                            <span
                                key={c.n}
                                className={cn(
                                    'sl-mono rounded px-1.5 py-1 text-[10.5px] tabular-nums',
                                    c.extra ? 'bg-[var(--sl-rust)] text-[var(--sl-ink)]' : 'bg-[var(--sl-bg-2)] text-[var(--sl-dim)]',
                                )}
                                title={c.extra ? 'the inserted call' : `call ${c.n}`}
                            >
                                {c.value.toFixed(3)}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="sl-scrollbox overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-left text-[13.5px]">
                        <thead>
                            <tr className="sl-mono text-[10px] uppercase text-[var(--sl-faint)]">
                                <th className="py-1.5 pr-3 font-normal">Trait</th>
                                <th className="py-1.5 pr-3 font-normal">Before</th>
                                <th className="py-1.5 font-normal">After the extra call</th>
                            </tr>
                        </thead>
                        <tbody>
                            {KEYS.map((k) => {
                                const changed = String(before[k]) !== String(after[k]);
                                return (
                                    <tr key={k} className="border-t border-[var(--sl-line)]">
                                        <td className="py-1.5 pr-3 font-semibold">{k}</td>
                                        <td className="sl-mono py-1.5 pr-3 text-[12px] text-[var(--sl-dim)]">{String(before[k])}</td>
                                        <td className={cn('sl-mono py-1.5 text-[12px]', changed ? 'font-semibold text-[var(--sl-warn)]' : 'text-[var(--sl-dim)]')}>
                                            {changed ? `${String(after[k])} ←` : String(after[k])}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </Demo>
    );
}
