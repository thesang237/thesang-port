'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

import { Btn, Demo } from '../kit/controls';
import { Ring } from '../kit/ui';

/** The page's performance rules as a checklist for your own build. Ticks are remembered in this browser. */
const ITEMS: { group: string; text: string; why: string }[] = [
    { group: 'Frame', text: 'One requestAnimationFrame loop drives everything', why: 'Engine.frame: scroll, worlds, titles, composite. No competing loops.' },
    { group: 'Frame', text: 'No allocations inside the frame loop', why: 'Vectors and arrays are made once in setup and reused; garbage collection pauses show up as hitches.' },
    { group: 'Frame', text: 'Simulations step at a fixed 60 Hz (max 4 steps a frame)', why: 'Same motion on any screen, and a long pause can’t trigger a burst of steps.' },
    { group: 'Drawing', text: 'Only worlds on screen render', why: 'At most two worlds a frame, and only during a transition.' },
    { group: 'Drawing', text: 'Transitions render smaller (72 %)', why: 'Two worlds at once would double the cost; the moving edge hides the softness.' },
    { group: 'Drawing', text: 'Pixel ratio capped at 1.5', why: 'Soft, graded scenes don’t need Retina resolution: 44 % fewer pixels than DPR 2.' },
    { group: 'Drawing', text: 'Blurred passes at half resolution (or less)', why: 'The stalk field blurs at 0.5 ×, the plots at 0.75 ×, the menu blur halves four times.' },
    { group: 'Drawing', text: 'Thousands of items = one draw call', why: 'Beads in one Points, plot slices in one instanced mesh, a title’s letters in one instanced mesh.' },
    { group: 'Drawing', text: 'Invisible sprites skipped in the vertex shader', why: 'Big soft bokeh that would land under 0.4 % opacity never reach the pixel stage.' },
    { group: 'Loading', text: 'Every shader compiled behind the loader', why: 'renderer.compile + one off-screen render of each world, so no hitch on the first wipe.' },
    { group: 'Loading', text: 'Textures uploaded before the first frame', why: 'renderer.initTexture on every texture during loading.' },
    { group: 'React', text: 'React state only for decisions, never per frame', why: 'The store changes a few times per chapter; the nav arc is written straight to the DOM.' },
    { group: 'React', text: 'Everything is disposed when the page leaves', why: 'Geometries, materials, textures, render targets, listeners: Engine.dispose().' },
];
const KEY = 'cl-perf-checklist';

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
            title="Performance checklist for your own build"
            hint="Tick what your project already does. Ticks stay in this browser."
            footer={<Btn onClick={() => setDone(ITEMS.map(() => false))}>Clear all</Btn>}
        >
            <div className="p-4 sm:p-5">
                <div className="cl-mono mb-4 flex items-center gap-2 text-[11px] uppercase text-[var(--cl-mint)]">
                    <Ring arc={(count / ITEMS.length) * 100} />
                    {`${count} / ${ITEMS.length} done`}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {groups.map((g) => (
                        <div key={g}>
                            <div className="cl-mono mb-2 text-[10px] uppercase text-[var(--cl-faint)]">{g}</div>
                            <ul className="space-y-2">
                                {ITEMS.map((it, i) =>
                                    it.group === g ? (
                                        <li key={it.text}>
                                            <label className="flex cursor-pointer gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={done[i]}
                                                    onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
                                                    className="mt-1 size-4 shrink-0 accent-[var(--cl-mint)]"
                                                />
                                                <span>
                                                    <span className={cn('block text-[15px] leading-snug', done[i] ? 'text-[var(--cl-dim)] line-through' : 'text-[var(--cl-ink)]')}>{it.text}</span>
                                                    <span className="block text-[12.5px] leading-snug text-[var(--cl-faint)]">{it.why}</span>
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
