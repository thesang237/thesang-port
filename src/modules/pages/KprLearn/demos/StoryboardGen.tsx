'use client';

import { useState } from 'react';

import { Btn, Demo } from '../kit/controls';

type Act = { name: string; length: number; speed: number };

const START: Act[] = [
    { name: 'hero', length: 2, speed: 1.6 },
    { name: 'intro', length: 2, speed: 1 },
    { name: 'story', length: 4.5, speed: 1 },
    { name: 'gallery', length: 3, speed: 1 },
    { name: 'launch', length: 1.5, speed: 1.8 },
];

const ident = (s: string) => s.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : '')).replace(/^[A-Z]/, (c) => c.toLowerCase()) || 'act';
const n2 = (v: number) => Number(v.toFixed(2));

/**
 * Chapter 12: write your storyboard as acts (length in film screens + how fast each plays per screen of
 * scroll) and get the starting code: windows, rests, the scroll warp and a choreography skeleton.
 */
export default function StoryboardGen() {
    const [acts, setActs] = useState<Act[]>(START);
    const [overlap, setOverlap] = useState(0.15);

    const edit = (i: number, patch: Partial<Act>) => setActs((a) => a.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    // each act starts where the previous ended (film screens)
    const ends = acts.reduce<number[]>((acc, a) => [...acc, (acc[acc.length - 1] ?? 0) + Math.max(0.2, a.length)], []);
    const rows = acts.map((a, i) => ({ ...a, id: ident(a.name), from: n2(ends[i - 1] ?? 0), to: n2(ends[i]) }));
    const total = n2(ends[ends.length - 1] ?? 0);
    // warp knots: [film t, scroll s]; an act with pace 2 takes half its length in scroll
    const scrolls = rows.reduce<number[]>((acc, r) => [...acc, (acc[acc.length - 1] ?? 0) + (r.to - r.from) / Math.max(0.2, r.speed)], []);
    const knots: [number, number][] = [[0, 0], ...rows.map((r, i): [number, number] => [r.to, n2(scrolls[i])])];

    const code = `// scroll/timeline.ts — generated from your storyboard
export const W = {
${rows.map((r) => `    ${r.id}: [${n2(Math.max(0, r.from - overlap))}, ${n2(r.to + (r.to < total ? overlap : 0))}],`).join('\n')}
} as const;
export const TOTAL = ${total};

/** one still per act (reduced motion, nav jumps) */
export const RESTS = [${rows.map((r) => n2((r.from + r.to) / 2)).join(', ')}];

/** film time → screens of scroll: [film t, scroll s] */
const WARP = [${knots.map(([a, b]) => `[${a}, ${b}]`).join(', ')}];
export const SCROLL_TOTAL = ${knots[knots.length - 1][1]};

// gl/choreo.ts — one block per card, rebuilt every frame
export function choreograph(c: Cast) {
    const t = film.view;
${rows
    .map(
        (r) => `    {
        const s = c.${r.id}.state;
        reset(s);
        const inK = io(sub(t, W.${r.id}, 0, 0.35));   // arrive
        const outK = io(sub(t, W.${r.id}, 0.75, 1));  // leave
        rect(s, mixRect(below, full, inK));
        s.y += outK * vh;
        s.opacity = inK > 0.001 && outK < 0.999 ? 1 : 0;
    }`,
    )
    .join('\n')}
}`;

    const [copied, setCopied] = useState(false);
    const copy = () => {
        void navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    return (
        <Demo
            title="Storyboard → film clock code"
            hint="Name your acts, give each a length in film screens and a pace (2 = plays twice as fast per screen of scroll). The code updates as you type."
            onReset={() => {
                setActs(START);
                setOverlap(0.15);
            }}
        >
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="space-y-3 p-4 sm:p-5">
                    {/* the storyboard strip */}
                    <div className="flex h-9 overflow-hidden border border-[var(--kl-black)]" aria-hidden>
                        {rows.map((r, i) => (
                            <div
                                key={i}
                                className="kl-mono flex items-center justify-center overflow-hidden whitespace-nowrap border-r border-[var(--kl-black)] px-1 text-[10px] uppercase last:border-r-0"
                                style={{ flex: r.to - r.from, background: ['#cfc8f3', '#e9b49a', '#8fb3d9', '#c0fb50', '#f3f2ee', '#b7a3b0'][i % 6] }}
                            >
                                {r.name}
                            </div>
                        ))}
                    </div>
                    <div className="kl-mono grid grid-cols-[minmax(0,1fr)_70px_70px_28px] gap-2 text-[10px] uppercase text-[var(--kl-faint)]">
                        <span>act</span>
                        <span>screens</span>
                        <span>pace ×</span>
                        <span />
                    </div>
                    {acts.map((a, i) => (
                        <div key={i} className="grid grid-cols-[minmax(0,1fr)_70px_70px_28px] gap-2">
                            <input
                                aria-label={`Act ${i + 1} name`}
                                value={a.name}
                                onChange={(e) => edit(i, { name: e.target.value })}
                                className="kl-mono min-w-0 border border-[var(--kl-line-2)] bg-white px-2 py-1 text-[12px]"
                            />
                            <input
                                aria-label={`Act ${i + 1} length in screens`}
                                type="number"
                                min={0.2}
                                step={0.1}
                                value={a.length}
                                onChange={(e) => edit(i, { length: Number(e.target.value) || 0.2 })}
                                className="kl-mono border border-[var(--kl-line-2)] bg-white px-2 py-1 text-[12px]"
                            />
                            <input
                                aria-label={`Act ${i + 1} pace`}
                                type="number"
                                min={0.2}
                                step={0.1}
                                value={a.speed}
                                onChange={(e) => edit(i, { speed: Number(e.target.value) || 1 })}
                                className="kl-mono border border-[var(--kl-line-2)] bg-white px-2 py-1 text-[12px]"
                            />
                            <button
                                type="button"
                                aria-label={`Remove act ${i + 1}`}
                                onClick={() => setActs((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : x))}
                                className="kl-btn text-[var(--kl-dim)] hover:text-[var(--kl-warn)]"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Btn onClick={() => setActs((x) => [...x, { name: `act ${x.length + 1}`, length: 2, speed: 1 }])}>+ Add act</Btn>
                        <label className="kl-mono ml-auto flex items-center gap-2 text-[11px]">
                            overlap
                            <input
                                type="number"
                                min={0}
                                max={1}
                                step={0.05}
                                value={overlap}
                                onChange={(e) => setOverlap(Number(e.target.value) || 0)}
                                className="w-16 border border-[var(--kl-line-2)] bg-white px-2 py-1 text-[12px]"
                            />
                        </label>
                    </div>
                    <p className="text-[12.5px] leading-snug text-[var(--kl-dim)]">
                        {`Film: ${total} screens · scroll: ${knots[knots.length - 1][1]} screens. Windows overlap by ${overlap} so one act can leave while the next arrives, like /kpr’s handoffs.`}
                    </p>
                </div>
                <div className="relative border-t border-[var(--kl-line)] bg-[var(--kl-black)] lg:border-l lg:border-t-0">
                    <Btn onClick={copy} className="absolute right-3 top-3 z-10 border-white/30 text-white hover:border-white hover:text-white">
                        {copied ? '✓ Copied' : 'Copy'}
                    </Btn>
                    <pre className="kl-scrollbox kl-mono max-h-[520px] overflow-auto whitespace-pre p-5 text-[12px] leading-relaxed text-[#e9e6f6]" data-lenis-prevent>
                        {code}
                    </pre>
                </div>
            </div>
        </Demo>
    );
}
