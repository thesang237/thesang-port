'use client';

import { type ReactNode, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Slider } from '../kit/controls';

type Layer = { name: string; z: string; file: string; body: string; art: ReactNode };

const line = 'block h-[3px] rounded-full bg-white/70';

const LAYERS: Layer[] = [
    {
        name: 'WebGL canvas',
        z: 'fixed, z-0',
        file: 'canvas/Experience.tsx',
        body: 'One full-screen <canvas>. All four 3D worlds and the compositor draw here. It never scrolls — it just repaints.',
        art: <span className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_60%,#e8f3ff_0%,#9aa9bb_35%,#5c6878_80%)]" />,
    },
    {
        name: 'Scroll track',
        z: 'in flow, invisible',
        file: 'IglooPage.tsx · Scroller',
        body: 'An empty div 1700vh tall. It exists only to give the page a scrollbar. ScrollTrigger measures your position inside it.',
        art: (
            <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] border border-dashed border-white/40">
                <span className="il-mono text-[9px] text-white/60">(17 × 100vh)</span>
            </span>
        ),
    },
    {
        name: 'Crystal HUD',
        z: 'fixed, z-10',
        file: 'ui/CrystalHud.tsx',
        body: 'Labels and leader lines. Each frame the 3D world projects the crystal centre to screen x/y and moves these nodes there.',
        art: (
            <span className="absolute left-[30%] top-[25%] w-[40%] space-y-1">
                <span className={line} />
                <span className={cn(line, 'w-2/3')} />
                <span className="mt-2 block h-px w-full bg-white/60" />
            </span>
        ),
    },
    {
        name: 'Hero copy',
        z: 'fixed, z-10',
        file: 'ui/Hero.tsx',
        body: 'Manifesto and legal lines. Revealed once after the intro, then faded/blurred by the scroll timeline.',
        art: (
            <>
                <span className="absolute left-[8%] top-[14%] w-[26%] space-y-1">
                    <span className={line} />
                    <span className={cn(line, 'w-3/4')} />
                </span>
                <span className="absolute right-[8%] top-[14%] w-[24%] space-y-1">
                    <span className={line} />
                    <span className={line} />
                    <span className={cn(line, 'w-1/2')} />
                </span>
            </>
        ),
    },
    {
        name: 'Chrome',
        z: 'fixed, z-20',
        file: 'ui/Chrome.tsx',
        body: 'Logo, sound toggle, section captions, the scroll rail and the ghost glyphs. Always on top of the scene.',
        art: (
            <>
                <span className="absolute left-[7%] top-[8%] h-[8%] w-[18%] rounded-sm bg-white/80" />
                <span className="absolute right-[6%] top-[30%] flex h-[40%] flex-col justify-between">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="block size-[5px] rotate-45 border border-white/80" />
                    ))}
                </span>
            </>
        ),
    },
    {
        name: 'Detail overlay',
        z: 'fixed, z-30',
        file: 'ui/DetailOverlay.tsx',
        body: 'Opens on crystal click. The page underneath is darkened and blurred by the compositor shader, not by CSS.',
        art: (
            <span className="absolute inset-x-[30%] top-[18%] space-y-1.5">
                {[1, 1, 0.8, 1, 0.6].map((w, i) => (
                    <span key={i} className={line} style={{ width: `${w * 100}%` }} />
                ))}
            </span>
        ),
    },
    {
        name: 'Loader',
        z: 'fixed, z-40',
        file: 'ui/Loader.tsx',
        body: 'Counter 000 → 100. Then it fades and tweens motion.intro 0 → 1, which assembles the igloo. Scroll is locked until then.',
        art: (
            <span className="absolute inset-x-[34%] top-[46%]">
                <span className="il-mono mb-1 flex justify-between text-[8px] text-white/80">
                    <span>INIT</span>
                    <span>072</span>
                </span>
                <span className="block h-px w-[72%] bg-white/80" />
            </span>
        ),
    },
];

/** The page is a stack of fixed layers over one canvas — explode it to see. */
export default function LayerStack() {
    const [explode, setExplode] = useState(0.8);
    const [hover, setHover] = useState(0);
    const L = LAYERS[hover];

    return (
        <Demo
            title="Layer stack — the page, exploded"
            hint="Drag “explode” to pull the layers apart, then hover a layer. Everything is position: fixed; only the invisible track scrolls."
            onReset={() => setExplode(0.8)}
            controls={
                <>
                    <Slider label="explode" value={explode} min={0} max={1} onChange={setExplode} help="0 = what you see on the page, 1 = every layer lifted apart." />
                    <div className="space-y-1.5">
                        {LAYERS.map((l, i) => (
                            <button
                                key={l.name}
                                type="button"
                                onMouseEnter={() => setHover(i)}
                                onClick={() => setHover(i)}
                                className={cn(
                                    'il-mono flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px]',
                                    hover === i ? 'bg-white/[0.06] text-[var(--il-ink)]' : 'text-[var(--il-faint)]',
                                )}
                            >
                                <span>{l.name}</span>
                                <span className="text-[10px]">{l.z}</span>
                            </button>
                        ))}
                    </div>
                    <div className="rounded-lg border border-[var(--il-line)] p-3">
                        <div className="il-mono mb-1 text-[10px] text-[var(--il-ice)]">{L.file}</div>
                        <p className="text-[12.5px] leading-relaxed text-[var(--il-dim)]">{L.body}</p>
                    </div>
                </>
            }
        >
            <div className="il-stack flex h-[460px] items-center justify-center overflow-hidden sm:h-[520px]">
                <div
                    className="relative aspect-[16/10] w-[62%]"
                    style={{ transformStyle: 'preserve-3d', transform: `rotateX(${explode * 58}deg) rotateZ(${-explode * 38}deg)`, transition: 'transform 0.2s' }}
                >
                    {LAYERS.map((l, i) => (
                        <div
                            key={l.name}
                            onMouseEnter={() => setHover(i)}
                            className={cn(
                                'absolute inset-0 rounded-lg border transition-[border-color,background,opacity] duration-300',
                                hover === i ? 'border-[var(--il-ice)] bg-[rgba(148,219,255,0.1)]' : 'border-white/20 bg-white/[0.02]',
                                i === 0 && 'bg-transparent',
                            )}
                            style={{ transform: `translateZ(${i * explode * 46}px)`, opacity: explode < 0.05 && i > 0 && i !== hover ? 0.85 : 1 }}
                        >
                            {l.art}
                            <span
                                className="il-mono absolute -left-2 top-1 -translate-x-full whitespace-nowrap text-[10px] transition-opacity"
                                style={{ opacity: explode > 0.4 ? 1 : 0, color: hover === i ? 'var(--il-ice)' : 'var(--il-faint)' }}
                            >
                                {l.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Demo>
    );
}
