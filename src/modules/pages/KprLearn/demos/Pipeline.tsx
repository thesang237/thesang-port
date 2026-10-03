'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo } from '../kit/controls';

type Node = { id: string; label: string; sub: string; file: string; body: string };

/** One frame of /kpr, in the order the code runs it (KprPage.tsx `Clock` → `tick`). */
const ROW: Node[] = [
    { id: 'input', label: 'Wheel / touch', sub: 'your hand', file: 'browser', body: 'The visitor scrolls. The browser only knows a pixel offset on an invisible, very tall track.' },
    {
        id: 'lenis',
        label: 'Lenis',
        sub: 'lerp 0.09',
        file: 'KprPage.tsx · LENIS',
        body: 'Smooths the scroll: each frame the page moves 9 % of the remaining distance to where the wheel wants it. That glide is the “weight” of the page.',
    },
    {
        id: 'warp',
        label: 'Scroll warp',
        sub: 'tFromScroll()',
        file: 'scroll/timeline.ts · WARP',
        body: 'Converts scroll (in screens) to film time. Some stretches (the hero, the intro, the logo beat, the launch) play faster per screen of scroll.',
    },
    {
        id: 'film',
        label: 'film.t',
        sub: 'the one number',
        file: 'scroll/useScrollStore.ts · film',
        body: 'A plain object, not React state: t, scroll speed, pointer (raw + smoothed), viewport size, reduced-motion flag. Everything below reads it.',
    },
];

const BRANCHES: Node[] = [
    {
        id: 'choreo',
        label: 'choreograph()',
        sub: 'every card’s state',
        file: 'gl/choreo.ts',
        body: 'Writes x, y, w, h, turns, notch, opacity… for each of ~45 cards, as formulas of t. No memory: same t, same picture.',
    },
    {
        id: 'apply',
        label: 'card.apply()',
        sub: 'numbers → shader',
        file: 'gl/NotchedCard.ts',
        body: 'Each card copies its state into its mesh and shader uniforms, follows the pointer with its two speeds, and picks which faces to show.',
    },
    {
        id: 'paint',
        label: 'Painted scenes',
        sub: 'only the visible ones',
        file: 'gl/PaintedScene.ts',
        body: 'The 3D paintings on screen render into their textures (one or two of six per frame).',
    },
    {
        id: 'dom',
        label: 'DOM updaters',
        sub: 'onFrame()',
        file: 'scroll/frame.ts · dom/ui/useAct.ts',
        body: 'Each text section checks whether t is inside its window (play / reverse its reveal) and writes scrubbed styles: column offsets, counters, progress bar.',
    },
    {
        id: 'ui',
        label: 'React (rarely)',
        sub: 'theme + nav only',
        file: 'scroll/useScrollStore.ts · useUi',
        body: 'Only coarse changes go through React: HUD theme light/dark and the active nav item. A handful of re-renders per visit, zero while just scrolling.',
    },
    {
        id: 'render',
        label: 'advance()',
        sub: 'one render',
        file: 'KprPage.tsx · gl/Stage.tsx',
        body: 'React Three Fiber runs with frameloop “never”; the clock calls advance() once per tick, so the WebGL frame happens on the same beat as everything else.',
    },
];

function Box({ n, active, onPick }: { n: Node; active: boolean; onPick: (id: string) => void }) {
    return (
        <button
            type="button"
            onMouseEnter={() => onPick(n.id)}
            onFocus={() => onPick(n.id)}
            onClick={() => onPick(n.id)}
            className={cn('kl-btn kl-cut w-full px-3 py-2.5 text-left', active ? 'bg-[var(--kl-black)] text-white' : 'bg-[var(--kl-panel-2)] text-[var(--kl-ink)] hover:bg-[#e2def6]')}
            style={{ ['--c' as string]: '10px' }}
        >
            <div className="text-[14px] font-semibold tracking-[-0.02em]">{n.label}</div>
            <div className={cn('kl-mono text-[10px] uppercase', active ? 'text-[var(--kl-lime)]' : 'text-[var(--kl-dim)]')}>{n.sub}</div>
        </button>
    );
}

const Arrow = ({ down }: { down?: boolean }) => (
    <span aria-hidden className={cn('kl-mono flex items-center justify-center text-[var(--kl-lav)]', down ? 'h-5' : 'h-5 sm:h-auto sm:w-5')}>
        <span className={down ? '' : 'rotate-90 sm:rotate-0'}>{down ? '↓' : '→'}</span>
    </span>
);

/** Chapter 00: what happens in one frame, node by node. */
export default function Pipeline() {
    const [pick, setPick] = useState('film');
    const all = [...ROW, ...BRANCHES];
    const cur = all.find((n) => n.id === pick)!;
    return (
        <Demo title="One frame of /kpr, in order" hint="Hover or tap a box. The top row turns your scroll into one number; the bottom row is everything that reads it.">
            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                    {ROW.map((n, i) => (
                        <div key={n.id} className="flex flex-col sm:flex-1 sm:flex-row">
                            <div className="sm:flex-1">
                                <Box n={n} active={pick === n.id} onPick={setPick} />
                            </div>
                            {i < ROW.length - 1 && <Arrow />}
                        </div>
                    ))}
                </div>
                <Arrow down />
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {BRANCHES.map((n) => (
                        <Box key={n.id} n={n} active={pick === n.id} onPick={setPick} />
                    ))}
                </div>
                <div className="mt-5 min-h-[92px] border-l-2 border-[var(--kl-lav)] pl-4" aria-live="polite">
                    <div className="kl-mono mb-1 text-[10.5px] uppercase text-[var(--kl-lav-deep)]">{cur.file}</div>
                    <p className="max-w-[70ch] text-[15px] leading-relaxed text-[var(--kl-body)]">{cur.body}</p>
                </div>
            </div>
        </Demo>
    );
}
