'use client';

import { useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { drawAll } from '../kit/art';
import { Demo } from '../kit/controls';
import { useCanvas2D } from '../kit/loop';
import { buildScene, PALETTE_BAG, PALETTE_NAMES, paletteByName, RARE_PALETTES } from '../kit/source';

import { SeedPicker } from './SeedPicker';

const TICKETS = Object.fromEntries(PALETTE_NAMES.map((n) => [n, PALETTE_BAG.filter((p) => p.name === n).length]));
const RARE = new Set(RARE_PALETTES.map((p) => p.name));

/** The 18 palettes with their tickets in the bag. Click one to force it on a seed (a trait override). */
export default function PaletteBag() {
    const host = useRef<HTMLDivElement>(null);
    const [seed, setSeed] = useState('r23');
    const [forced, setForced] = useState<string | null>(null);

    useCanvas2D(host, (ctx, w) => drawAll(ctx, buildScene(seed, w, { traits: forced ? { Palette: forced } : {}, params: { dotsPerFrame: 4000 } }), w), [seed, forced]);

    return (
        <Demo
            title="The palette bag"
            hint="Tickets = how many times a palette sits in the bag. Click a swatch to force it on the seed; click it again to go back to the seed’s own pick."
            controls={
                <>
                    <SeedPicker seed={seed} onChange={setSeed} />
                    <div ref={host} className="mx-auto aspect-square w-full max-w-[260px]" role="img" aria-label={`Seed ${seed} in ${forced ?? 'its own'} palette`} />
                </>
            }
        >
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:p-6 xl:grid-cols-4">
                {PALETTE_NAMES.map((name) => {
                    const p = paletteByName(name);
                    const tickets = TICKETS[name];
                    return (
                        <button
                            key={name}
                            type="button"
                            aria-pressed={forced === name}
                            onClick={() => setForced((f) => (f === name ? null : name))}
                            className={cn(
                                'sl-btn flex items-center gap-2.5 rounded-lg border p-2 text-left',
                                forced === name ? 'border-[var(--sl-ink)] bg-[var(--sl-panel-2)]' : 'border-[var(--sl-line-2)] hover:border-[var(--sl-line-3)]',
                            )}
                        >
                            <span className="relative size-9 shrink-0 rounded-md border border-[var(--sl-line-2)]" style={{ background: p.paper }}>
                                <span className="absolute bottom-1 right-1 size-3.5 rounded-sm" style={{ background: p.ink }} />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[13.5px] font-semibold">{name}</span>
                                <span className={cn('sl-mono block text-[10px]', RARE.has(name) ? 'text-[var(--sl-rust-ink)]' : 'text-[var(--sl-faint)]')}>
                                    {`${tickets} / 51 · ${((tickets / 51) * 100).toFixed(1)}%${RARE.has(name) ? ' · rare' : ''}`}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </Demo>
    );
}
