'use client';

import { useMemo, useState } from 'react';

import { Btn, Demo, Segmented } from '../kit/controls';
import { createRandom, DUNE_COUNTS, rollTraits, SKIES, type Traits } from '../kit/source';

type Count = Record<string, number>;

/** Expected odds straight from the trait code (traits.ts), to compare with what the dice did. */
const EXPECTED: Record<'Dunes' | 'Sky', Record<string, number>> = {
    Dunes: { 1: 0.1633, 3: 0.1633, 6: 0.1633, 12: 0.1633, 24: 0.1633, 48: 0.1633, 120: 0.02 },
    Sky: { Tabula: 0.03, Starry: 0.11, Wool: 0.06, Beam: 0.15, Timelapse: 0.25, Whisper: 0.2, Null: 0.2 },
};

function roll(n: number, batch: number) {
    const tally: Record<string, Count> = { Dunes: {}, Sky: {}, Brush: {}, Margin: {} };
    const flags: Count = { Dancers: 0, Sandstorm: 0, Misty: 0, Dusty: 0, rare: 0 };
    for (let i = 0; i < n; i++) {
        const t: Traits = rollTraits(createRandom(`stats-${batch}-${i}`));
        for (const k of ['Dunes', 'Sky', 'Brush', 'Margin'] as const) tally[k][String(t[k])] = (tally[k][String(t[k])] ?? 0) + 1;
        for (const k of ['Dancers', 'Sandstorm', 'Misty', 'Dusty'] as const) if (t[k]) flags[k]++;
        if (['Polar', 'Forest', 'Cold', 'Underworld', 'Leaf', 'Lychee'].includes(t.Palette)) flags.rare++;
    }
    return { tally, flags };
}

const ORDER: Record<string, readonly string[]> = {
    Dunes: DUNE_COUNTS.map(String),
    Sky: SKIES,
    Brush: ['Sand', 'Soft', 'Grainy'],
    Margin: ['None', 'Narrow', 'Wide'],
};

function Bars({ name, counts, n }: { name: string; counts: Count; n: number }) {
    const expected = EXPECTED[name as 'Dunes' | 'Sky'];
    return (
        <div>
            <div className="sl-mono mb-2 text-[10px] uppercase text-[var(--sl-faint)]">{name}</div>
            <div className="space-y-1">
                {ORDER[name].map((k) => {
                    const share = (counts[k] ?? 0) / n;
                    return (
                        <div key={k} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-2 text-[12px]">
                            <span className="sl-mono truncate text-[var(--sl-dim)]">{k}</span>
                            <span className="relative h-3 bg-[var(--sl-bg-2)]">
                                <span className="absolute inset-y-0 left-0 bg-[var(--sl-ink)]" style={{ width: `${share * 100}%` }} />
                                {expected && <span className="absolute inset-y-[-3px] w-[2px] bg-[var(--sl-rust)]" style={{ left: `${expected[k] * 100}%` }} title="expected" />}
                            </span>
                            <span className="sl-mono text-right tabular-nums text-[var(--sl-body)]">{`${(share * 100).toFixed(1)}%`}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** Roll thousands of seeds through the real rollTraits() and count what comes out. */
export default function TraitStats() {
    const [n, setN] = useState('2000');
    const [batch, setBatch] = useState(0);
    const count = Number(n);
    const { tally, flags } = useMemo(() => roll(count, batch), [count, batch]);

    return (
        <Demo
            title="Roll a few thousand seeds"
            hint="Each bar is what the real trait code produced; the rust tick is the odds written in the code. More seeds = closer to the ticks."
            controls={
                <>
                    <Segmented label="Seeds rolled" options={['200', '2000', '20000']} value={n} onChange={setN} />
                    <Btn onClick={() => setBatch((b) => b + 1)}>Roll a new batch ↻</Btn>
                    <div className="sl-mono grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-md border border-[var(--sl-line)] bg-[var(--sl-bg-2)] p-2.5 text-[10.5px]">
                        {Object.entries(flags).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2">
                                <span className="text-[var(--sl-faint)]">{k === 'rare' ? 'rare palette' : k}</span>
                                <span className="tabular-nums">{`${((v / count) * 100).toFixed(1)}%`}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[12.5px] leading-snug text-[var(--sl-dim)]">Rare palettes: 6 tickets in 51 = 11.8 %. Dancers needs 6+ dunes (67 % of seeds), then 3 %: about 2 % overall.</p>
                </>
            }
        >
            <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6">
                {(['Dunes', 'Sky', 'Brush', 'Margin'] as const).map((k) => (
                    <Bars key={k} name={k} counts={tally[k]} n={count} />
                ))}
            </div>
        </Demo>
    );
}
