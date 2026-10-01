'use client';

import { useState } from 'react';

import { Demo } from '../kit/controls';

type Node = { id: string; x: number; y: number; w: number; label: string; sub: string; text: string; tone: 'in' | 'mid' | 'out' };

const NODES: Node[] = [
    { id: 'wheel', x: 10, y: 120, w: 110, label: 'Wheel', sub: 'input', tone: 'in', text: 'Mouse wheel or trackpad. The browser reports raw steps.' },
    {
        id: 'lenis',
        x: 150,
        y: 120,
        w: 110,
        label: 'Lenis',
        sub: 'lerp 0.1',
        tone: 'mid',
        text: 'Smooths the steps into a glide by moving the page 10% of the remaining distance every frame. It still scrolls the real page.',
    },
    { id: 'scroll', x: 290, y: 120, w: 110, label: 'scrollY', sub: 'one number', tone: 'mid', text: 'The page’s scroll position in pixels. Everything below is derived from this single number.' },
    {
        id: 'prog',
        x: 430,
        y: 40,
        w: 130,
        label: 'Progress',
        sub: 'page · stage',
        tone: 'mid',
        text: 'Turns pixels into 0..100%: the logo uses scrollY / page height, the stage uses how far its tall track has scrolled past the top.',
    },
    {
        id: 'smooth',
        x: 590,
        y: 40,
        w: 110,
        label: 'Smoothing',
        sub: '70 → ×0.3/frame',
        tone: 'mid',
        text: 'Each 60Hz frame the value closes 30% of the gap to the target, so wheel steps never look choppy.',
    },
    { id: 'tracks', x: 730, y: 40, w: 150, label: 'Tracks', sub: 'keyframes, linear', tone: 'mid', text: 'Per-property keyframe lists. sample(track, progress) returns the value for this frame.' },
    {
        id: 'trig',
        x: 430,
        y: 200,
        w: 130,
        label: 'Triggers',
        sub: 'enter / leave',
        tone: 'mid',
        text: 'Intersection checks: when a line, the header or the footer crosses a threshold, a normal timed animation starts.',
    },
    {
        id: 'gsap',
        x: 590,
        y: 200,
        w: 110,
        label: 'GSAP timelines',
        sub: 'time-based',
        tone: 'mid',
        text: 'Timed tweens with the page’s three curves. They run on GSAP’s ticker, the same clock as Lenis.',
    },
    {
        id: 'out',
        x: 730,
        y: 200,
        w: 150,
        label: 'Writes',
        sub: 'transform · opacity · frame',
        tone: 'out',
        text: 'Only transform and opacity change (plus a Lottie frame). No layout, so it stays 60fps.',
    },
];

const EDGES: [string, string][] = [
    ['wheel', 'lenis'],
    ['lenis', 'scroll'],
    ['scroll', 'prog'],
    ['prog', 'smooth'],
    ['smooth', 'tracks'],
    ['tracks', 'out'],
    ['scroll', 'trig'],
    ['trig', 'gsap'],
    ['gsap', 'out'],
];

const tone = { in: 'var(--al-bg-2)', mid: 'var(--al-panel)', out: 'var(--al-ink)' } as const;

export default function PipelineDiagram() {
    const [on, setOn] = useState('scroll');
    const node = NODES.find((n) => n.id === on) ?? NODES[2];
    const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

    return (
        <Demo title="Data flow: from wheel to pixels" hint="Hover or tab through the boxes. The top row is scroll-driven (scrubbed); the bottom row is trigger-driven (timed).">
            <div className="al-scrollbox overflow-x-auto p-4 sm:p-6">
                <svg viewBox="0 0 900 270" className="min-w-[720px]" role="img" aria-label="Pipeline from wheel input to transforms and opacity">
                    {EDGES.map(([a, b]) => {
                        const A = byId[a];
                        const B = byId[b];
                        const x1 = A.x + A.w;
                        const y1 = A.y + 30;
                        const x2 = B.x;
                        const y2 = B.y + 30;
                        const mx = (x1 + x2) / 2;
                        return (
                            <path
                                key={a + b}
                                d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                                fill="none"
                                stroke="var(--al-ink)"
                                strokeWidth={on === a || on === b ? 2 : 1}
                                opacity={on === a || on === b ? 1 : 0.35}
                            />
                        );
                    })}
                    {NODES.map((n) => (
                        <g
                            key={n.id}
                            tabIndex={0}
                            role="button"
                            aria-label={`${n.label}: ${n.text}`}
                            onMouseEnter={() => setOn(n.id)}
                            onFocus={() => setOn(n.id)}
                            style={{ cursor: 'pointer', outline: 'none' }}
                        >
                            <rect x={n.x} y={n.y} width={n.w} height={60} fill={tone[n.tone]} stroke="var(--al-ink)" strokeWidth={on === n.id ? 3 : 1} />
                            <text x={n.x + 10} y={n.y + 26} fontSize="14" fontWeight="500" fill={n.tone === 'out' ? 'var(--al-bg)' : 'var(--al-ink)'} style={{ fontFamily: 'var(--al-display)' }}>
                                {n.label}
                            </text>
                            <text x={n.x + 10} y={n.y + 46} fontSize="10" fill={n.tone === 'out' ? 'var(--al-bg-2)' : 'var(--al-faint)'} style={{ fontFamily: 'var(--font-al-mono), monospace' }}>
                                {n.sub}
                            </text>
                        </g>
                    ))}
                    <text x="440" y="24" fontSize="10" fill="var(--al-accent-ink)" style={{ fontFamily: 'var(--font-al-mono), monospace' }}>
                        SCRUBBED (scroll is the playhead)
                    </text>
                    <text x="440" y="192" fontSize="10" fill="var(--al-blue)" style={{ fontFamily: 'var(--font-al-mono), monospace' }}>
                        TRIGGERED (scroll only starts it)
                    </text>
                </svg>
                <div className="mt-3 border-t border-[var(--al-line-2)] pt-3">
                    <div className="al-mono mb-1 text-[10px] uppercase tracking-[0.16em] text-[var(--al-accent-ink)]">{node.label}</div>
                    <p className="max-w-[70ch] text-[14px] leading-relaxed text-[var(--al-dim)]">{node.text}</p>
                </div>
            </div>
        </Demo>
    );
}
