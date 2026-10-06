'use client';

import { useMemo, useRef, useState } from 'react';

import { drawAll } from '../kit/art';
import { Demo, Readout } from '../kit/controls';
import { useCanvas2D, useDebounced } from '../kit/loop';
import { buildScene, hashSeed, randomSeed, sfc32 } from '../kit/source';

/** Type a seed: see its hash, the first numbers of its stream, its traits and its picture. */
export default function SeedLab() {
    const host = useRef<HTMLDivElement>(null);
    const [seed, setSeed] = useState('solace');
    const safe = useDebounced(seed, 180) || ' ';

    const { hash, stream, traits } = useMemo(() => {
        const h = hashSeed(safe);
        const next = sfc32(...h);
        return { hash: h, stream: Array.from({ length: 12 }, () => next()), traits: buildScene(safe, 10).traits };
    }, [safe]);

    // a quick picture: the real scene with fewer dots (the dunes are identical; only the grain is lighter)
    useCanvas2D(host, (ctx, w) => drawAll(ctx, buildScene(safe, w, { params: { dotsPerFrame: 3000 } }), w), [safe]);

    return (
        <Demo
            title="Seed lab"
            hint="Type anything. Change one letter and everything changes; type it back and the exact same piece returns."
            controls={
                <>
                    <div>
                        <label htmlFor="seedlab" className="sl-mono mb-1.5 block text-[11px] text-[var(--sl-ink)]">
                            Seed
                        </label>
                        <input
                            id="seedlab"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                            spellCheck={false}
                            className="sl-mono w-full rounded-md border border-[var(--sl-line-3)] bg-[var(--sl-stage)] px-3 py-2 text-[13px] outline-none focus:border-[var(--sl-ink)]"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {['solace', 'Solace', 'solace!', 'sand'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSeed(s)}
                                    className="sl-btn sl-mono rounded-full border border-[var(--sl-line-2)] px-2 py-0.5 text-[10.5px] text-[var(--sl-dim)] hover:border-[var(--sl-ink)] hover:text-[var(--sl-ink)]"
                                >
                                    {s}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setSeed(randomSeed().slice(0, 16))}
                                className="sl-btn sl-mono rounded-full border border-[var(--sl-line-2)] px-2 py-0.5 text-[10.5px] text-[var(--sl-dim)] hover:border-[var(--sl-ink)] hover:text-[var(--sl-ink)]"
                            >
                                random
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="sl-mono mb-1.5 text-[10px] uppercase text-[var(--sl-faint)]">1 · cyrb128 hash: four 32-bit numbers</div>
                        <div className="sl-mono grid grid-cols-2 gap-1 text-[11px] text-[var(--sl-rust-ink)]">
                            {hash.map((h, i) => (
                                <span key={i} className="rounded bg-[var(--sl-bg-2)] px-2 py-1">{`0x${h.toString(16).padStart(8, '0')}`}</span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="sl-mono mb-1.5 text-[10px] uppercase text-[var(--sl-faint)]">2 · sfc32 stream: the first 12 numbers</div>
                        <div className="flex h-16 items-end gap-[3px]" aria-label="First twelve random numbers">
                            {stream.map((v, i) => (
                                <span key={i} className="flex-1 bg-[var(--sl-ink)]" style={{ height: `${Math.max(3, v * 100)}%`, opacity: i === 0 ? 1 : 0.55 }} title={v.toFixed(4)} />
                            ))}
                        </div>
                        <p className="mt-1 text-[12px] leading-snug text-[var(--sl-dim)]">{`The first bar (${stream[0].toFixed(3)}) picks the palette from the bag.`}</p>
                    </div>
                    <Readout
                        items={[
                            { label: 'palette', value: traits.Palette },
                            { label: 'dunes', value: traits.Dunes },
                            { label: 'sky', value: traits.Sky },
                            { label: 'brush', value: traits.Brush },
                        ]}
                    />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="mx-auto aspect-square w-full max-w-[460px]" role="img" aria-label={`Artwork for seed ${seed}`} />
            </div>
        </Demo>
    );
}
