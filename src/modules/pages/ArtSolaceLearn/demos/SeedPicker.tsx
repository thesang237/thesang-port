'use client';

import { Btn, Segmented } from '../kit/controls';
import { randomSeed } from '../kit/source';

/** Seeds with distinct looks (found by rolling traits): a palette of starting points for demos. */
export const SEED_PRESETS = [
    { value: 'solace', label: 'solace · 3, grainy' },
    { value: 'r23', label: 'r23 · 1 dune' },
    { value: 'r10', label: 'r10 · 6, Mars' },
    { value: 'r5', label: 'r5 · 12 dunes' },
    { value: 'r29', label: 'r29 · dancers' },
    { value: 'r6', label: 'r6 · sandstorm' },
    { value: 'r12', label: 'r12 · rare Forest' },
    { value: 'r1', label: 'r1 · 48 dunes' },
] as const;

/** Preset seed chips plus a random button. (Random seeds can roll 120 dunes: about 1.5 s on the CPU.) */
export function SeedPicker({ seed, onChange, presets = SEED_PRESETS }: { seed: string; onChange: (s: string) => void; presets?: readonly { value: string; label: string }[] }) {
    const known = presets.some((p) => p.value === seed);
    return (
        <div className="space-y-2">
            <Segmented label="Seed" options={presets} value={known ? seed : ''} onChange={onChange} />
            <div className="flex flex-wrap items-center gap-2">
                <Btn onClick={() => onChange(randomSeed())}>Random seed ↻</Btn>
                {!known && <span className="sl-mono truncate text-[10.5px] text-[var(--sl-faint)]">{seed.slice(0, 18)}…</span>}
            </div>
        </div>
    );
}
