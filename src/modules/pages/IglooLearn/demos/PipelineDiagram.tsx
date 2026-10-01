'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo } from '../kit/controls';

type Node = { id: string; x: number; y: number; w: number; title: string; sub: string; color: string; body: string; file: string };

const NODES: Node[] = [
    { id: 'wheel', x: 20, y: 40, w: 130, title: 'Wheel / touch', sub: 'your input', color: '#9aa6b7', body: 'The raw input. A mouse wheel sends jumps of ~100px — steppy and harsh.', file: 'browser' },
    {
        id: 'lenis',
        x: 190,
        y: 40,
        w: 130,
        title: 'Lenis',
        sub: 'glides the scroll',
        color: '#94dbff',
        body: 'Catches the wheel and glides the real scroll position toward the target a little each frame (lerp 0.085). Also makes the page loop forever (infinite: true).',
        file: 'IglooPage.tsx · ReactLenis',
    },
    {
        id: 'st',
        x: 360,
        y: 40,
        w: 150,
        title: 'ScrollTrigger',
        sub: 'scroll → 0..1',
        color: '#94dbff',
        body: 'Watches an invisible 1700vh tall div and converts how far through it you are into progress 0 → 1.',
        file: 'IglooPage.tsx · Scroller',
    },
    {
        id: 'tl',
        x: 550,
        y: 40,
        w: 150,
        title: 'Master timeline',
        sub: '0..1 → 0..16',
        color: '#d4c2ff',
        body: 'One GSAP timeline, 16 units long, scrubbed by progress. It holds every tween of the page at an exact time — like one After Effects comp.',
        file: 'IglooPage.tsx · useGSAP',
    },
    {
        id: 'motion',
        x: 740,
        y: 40,
        w: 140,
        title: 'motion { }',
        sub: '~12 dials',
        color: '#d4c2ff',
        body: 'A plain JavaScript object: scene, explode, heroCam, crystals, rings, dive, form… The timeline writes it; everything else only reads it. No React re-renders.',
        file: 'store.ts',
    },
    {
        id: 'worlds',
        x: 560,
        y: 190,
        w: 160,
        title: '4 WebGL worlds',
        sub: 'read dials every frame',
        color: '#aef0d8',
        body: 'Igloo, Crystals, Rings, Colony. Each is its own scene + camera. In useFrame they read motion.* and move bricks, cameras, particles.',
        file: 'canvas/*World.tsx',
    },
    {
        id: 'dom',
        x: 760,
        y: 190,
        w: 120,
        title: 'DOM layers',
        sub: 'text & HUD',
        color: '#aef0d8',
        body: 'Hero copy, ghost glyphs and the colony UI are tweened on the same timeline. Captions react to section changes.',
        file: 'ui/*.tsx',
    },
    {
        id: 'comp',
        x: 360,
        y: 190,
        w: 160,
        title: 'Compositor',
        sub: 'blend + post FX',
        color: '#ffd08a',
        body: 'Renders the one or two visible worlds into offscreen images, then one full-screen shader blends them with noise, fog, glitch, bloom, grain.',
        file: 'canvas/Compositor.tsx',
    },
    {
        id: 'screen',
        x: 190,
        y: 190,
        w: 130,
        title: 'Screen',
        sub: '60× per second',
        color: '#e8edf4',
        body: 'The final pixels. The whole chain above runs every frame, in the same tick.',
        file: 'canvas',
    },
    {
        id: 'pointer',
        x: 20,
        y: 300,
        w: 150,
        title: 'Pointer',
        sub: 'smoothed −1..1',
        color: '#9aa6b7',
        body: 'Mouse position normalised to −1..1 and smoothed (damp). Adds parallax, hover picks and particle drag — on top of the scroll choreography.',
        file: 'IglooPage.tsx · Inputs',
    },
    {
        id: 'ticker',
        x: 360,
        y: 300,
        w: 200,
        title: 'gsap.ticker — one clock',
        sub: 'drives everything',
        color: '#ff9fb2',
        body: 'A single requestAnimationFrame loop calls Lenis, updates ScrollTrigger and smooths the pointer. The 3D renders in the same frame, so nothing drifts.',
        file: 'IglooPage.tsx · useLayoutEffect',
    },
];

const EDGES: [string, string, string][] = [
    ['wheel', 'lenis', 'M150 62 H190'],
    ['lenis', 'st', 'M320 62 H360'],
    ['st', 'tl', 'M510 62 H550'],
    ['tl', 'motion', 'M700 62 H740'],
    ['motion', 'worlds', 'M790 84 V130 H640 V190'],
    ['motion', 'dom', 'M840 84 V190'],
    ['worlds', 'comp', 'M560 212 H520'],
    ['comp', 'screen', 'M360 212 H320'],
    ['pointer', 'worlds', 'M170 322 H300 V270 H640 V234'],
    ['ticker', 'lenis', 'M360 312 H178 V112 H232 V84'],
];

/** How scroll becomes pixels, as a hoverable flow diagram. */
export default function PipelineDiagram() {
    const [sel, setSel] = useState('tl');
    const node = NODES.find((n) => n.id === sel)!;

    return (
        <Demo title="The pipeline — from wheel to pixels" hint="Hover or tap each box. The travelling dots are data moving through the chain every frame.">
            <div className="il-scrollbox overflow-x-auto p-4">
                <svg viewBox="0 0 900 360" className="min-w-[760px]" role="img" aria-label="Pipeline diagram">
                    <defs>
                        <marker id="il-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                            <path d="M0 0 L8 4 L0 8 z" fill="rgba(196,212,235,0.45)" />
                        </marker>
                    </defs>
                    {EDGES.map(([a, b, d], i) => {
                        const hot = sel === a || sel === b;
                        return (
                            <g key={i}>
                                <path
                                    d={d}
                                    fill="none"
                                    stroke={hot ? 'rgba(148,219,255,0.8)' : 'rgba(196,212,235,0.22)'}
                                    strokeWidth={hot ? 1.6 : 1}
                                    markerEnd="url(#il-arrow)"
                                    strokeDasharray={a === 'ticker' ? '4 4' : undefined}
                                />
                                <circle r="2.6" fill={hot ? '#94dbff' : 'rgba(232,237,244,0.7)'}>
                                    <animateMotion dur={`${1.6 + (i % 3) * 0.3}s`} repeatCount="indefinite" path={d} />
                                </circle>
                            </g>
                        );
                    })}
                    {NODES.map((n) => {
                        const on = sel === n.id;
                        return (
                            <g key={n.id} onMouseEnter={() => setSel(n.id)} onClick={() => setSel(n.id)} className="cursor-pointer">
                                <rect x={n.x} y={n.y} width={n.w} height={44} rx={8} fill={on ? `${n.color}22` : 'rgba(17,24,35,0.95)'} stroke={on ? n.color : 'rgba(196,212,235,0.18)'} />
                                <text x={n.x + 12} y={n.y + 19} fill={on ? '#fff' : '#e8edf4'} fontSize="12.5" fontWeight="600" fontFamily="var(--font-inter)">
                                    {n.title}
                                </text>
                                <text x={n.x + 12} y={n.y + 34} fill={n.color} fontSize="10" fontFamily="var(--font-il-mono)">
                                    {n.sub}
                                </text>
                            </g>
                        );
                    })}
                    <text x="20" y="150" fill="rgba(154,166,183,0.7)" fontSize="10" fontFamily="var(--font-il-mono)">
                        SCROLL CHOREOGRAPHY →
                    </text>
                    <text x="20" y="280" fill="rgba(154,166,183,0.7)" fontSize="10" fontFamily="var(--font-il-mono)">
                        INTERACTION + CLOCK →
                    </text>
                </svg>
            </div>
            <div className="grid gap-2 border-t border-[var(--il-line)] p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-5">
                <div>
                    <div className="text-[15px] font-semibold" style={{ color: node.color }}>
                        {node.title}
                    </div>
                    <div className="il-mono text-[10.5px] text-[var(--il-faint)]">{node.file}</div>
                </div>
                <p className={cn('text-[14.5px] leading-relaxed text-[#d3dbe6]')}>{node.body}</p>
            </div>
        </Demo>
    );
}
