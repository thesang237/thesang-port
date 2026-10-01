'use client';

import { useState } from 'react';

import { Demo } from '../kit/controls';

type Node = { id: string; x: number; y: number; w: number; title: string; sub: string; color: string; body: string; file: string };

const INK = '#b5b7ae';
const LIME = '#cdff0b';
const GOLD = '#d6ad5a';
const MINT = '#a8d8b0';
const WARN = '#ffb36b';

const NODES: Node[] = [
    {
        id: 'wheel',
        x: 20,
        y: 40,
        w: 130,
        title: 'Wheel / touch',
        sub: 'your input',
        color: INK,
        body: 'The raw input. A mouse wheel jumps ~100 px per notch — steppy and harsh on its own.',
        file: 'browser',
    },
    {
        id: 'lenis',
        x: 190,
        y: 40,
        w: 130,
        title: 'Lenis',
        sub: 'lerp 0.1',
        color: LIME,
        body: 'Lets the browser scroll natively but eases the visible position toward the target: 10% of the remaining distance per frame. The value was measured from the video (×0.55 per 0.1 s).',
        file: 'motion-kit/SmoothScroll.tsx',
    },
    {
        id: 'st',
        x: 360,
        y: 40,
        w: 150,
        title: 'ScrollTrigger',
        sub: 'scroll ranges',
        color: LIME,
        body: 'Watches ~40 scroll ranges: pins (hero 780 px, gallery 2500 px, helmets photo 420 px), scrubbed tweens, and “play once when this enters” reveals.',
        file: 'sections/*.tsx',
    },
    {
        id: 'tl',
        x: 550,
        y: 40,
        w: 150,
        title: 'Timelines',
        sub: 'one per scene',
        color: GOLD,
        body: 'Unlike a single master timeline, every section owns its own small timeline: the hero pin, the gallery travel, the menu, the overlay. Each is an After Effects comp of its own.',
        file: 'HeroSequence · Gallery · Menu · Overlay',
    },
    {
        id: 'write',
        x: 740,
        y: 40,
        w: 140,
        title: 'Outputs',
        sub: 'CSS · vars · state',
        color: GOLD,
        body: 'Timelines write three kinds of thing: transforms/opacity on elements, CSS variables (--clip, --hp, --br-text), and heroState — a plain object the WebGL layer reads.',
        file: 'heroState.ts · lando.scss',
    },
    {
        id: 'gl',
        x: 560,
        y: 190,
        w: 160,
        title: '2 WebGL canvases',
        sub: 'hero + menu photos',
        color: MINT,
        body: 'The hero canvas (portrait, trail reveal, glass helmet) and the menu canvas (duotone photos). Each frame they read DOM rects and heroState, then draw.',
        file: 'gl/HeroGL.tsx · gl/MenuGL.tsx',
    },
    {
        id: 'dom',
        x: 760,
        y: 190,
        w: 120,
        title: 'DOM',
        sub: 'text & layout',
        color: MINT,
        body: 'Everything else is plain HTML and SVG: block reveals, rolling text, drawn signatures, the gallery track, the header.',
        file: 'sections/*.tsx · shell/*.tsx',
    },
    {
        id: 'screen',
        x: 360,
        y: 190,
        w: 160,
        title: 'Screen',
        sub: '16.7 ms per frame',
        color: '#f1f3e8',
        body: 'The final pixels. Measured on the clone: p50 16.7 ms per frame while scrolling the whole page, zero long tasks.',
        file: 'DIFF_LOG · quality gates',
    },
    {
        id: 'events',
        x: 190,
        y: 190,
        w: 130,
        title: 'Events',
        sub: 'ln:enter · route',
        color: WARN,
        body: 'Things that happen once: the preloader finishes (“ln:enter” fires, the hero plays its reveals), a nav link is clicked (the overlay covers, the route swaps).',
        file: 'store.ts · Overlay.tsx',
    },
    {
        id: 'pointer',
        x: 20,
        y: 300,
        w: 150,
        title: 'Pointer',
        sub: 'hover + trail',
        color: INK,
        body: 'Mouse position feeds the hero trail texture, rolling-text hovers, the menu photo colour switch and the On/Off tooltip.',
        file: 'HeroGL · RollingText · Menu',
    },
    {
        id: 'ticker',
        x: 360,
        y: 300,
        w: 200,
        title: 'gsap.ticker — one clock',
        sub: 'drives everything',
        color: '#ff9fb2',
        body: 'One requestAnimationFrame loop calls Lenis, which updates ScrollTrigger, which updates the timelines — all in the same frame. The marquee ticks on it too.',
        file: 'SmoothScroll.tsx · Marquee.tsx',
    },
];

const EDGES: [string, string, string][] = [
    ['wheel', 'lenis', 'M150 62 H190'],
    ['lenis', 'st', 'M320 62 H360'],
    ['st', 'tl', 'M510 62 H550'],
    ['tl', 'write', 'M700 62 H740'],
    ['write', 'gl', 'M790 84 V130 H640 V190'],
    ['write', 'dom', 'M840 84 V190'],
    ['gl', 'screen', 'M560 212 H520'],
    ['events', 'tl', 'M255 190 V140 H600 V84'],
    ['pointer', 'gl', 'M170 322 H300 V270 H640 V234'],
    ['ticker', 'lenis', 'M360 312 H178 V112 H232 V84'],
];

/** How a wheel notch becomes pixels, as a hoverable flow diagram. */
export default function PipelineDiagram() {
    const [sel, setSel] = useState('lenis');
    const node = NODES.find((n) => n.id === sel)!;

    return (
        <Demo title="The pipeline — from wheel to pixels" hint="Hover or tap each box. The travelling dots are data moving through the chain every frame.">
            <div className="ll-scrollbox overflow-x-auto p-4">
                <svg viewBox="0 0 900 360" className="min-w-[760px]" role="img" aria-label="Pipeline diagram">
                    <defs>
                        <marker id="ll-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                            <path d="M0 0 L8 4 L0 8 z" fill="rgba(241,243,232,0.45)" />
                        </marker>
                    </defs>
                    {EDGES.map(([a, b, d], i) => {
                        const hot = sel === a || sel === b;
                        return (
                            <g key={i}>
                                <path
                                    d={d}
                                    fill="none"
                                    stroke={hot ? 'rgba(205,255,11,0.8)' : 'rgba(241,243,232,0.22)'}
                                    strokeWidth={hot ? 1.6 : 1}
                                    markerEnd="url(#ll-arrow)"
                                    strokeDasharray={a === 'ticker' || a === 'events' ? '4 4' : undefined}
                                />
                                <circle r="2.6" fill={hot ? LIME : 'rgba(241,243,232,0.7)'}>
                                    <animateMotion dur={`${1.6 + (i % 3) * 0.3}s`} repeatCount="indefinite" path={d} />
                                </circle>
                            </g>
                        );
                    })}
                    {NODES.map((n) => {
                        const on = sel === n.id;
                        return (
                            <g key={n.id} onMouseEnter={() => setSel(n.id)} onClick={() => setSel(n.id)} className="cursor-pointer">
                                <rect x={n.x} y={n.y} width={n.w} height={44} rx={8} fill={on ? `${n.color}22` : 'rgba(34,40,28,0.96)'} stroke={on ? n.color : 'rgba(241,243,232,0.18)'} />
                                <text x={n.x + 12} y={n.y + 19} fill="#f1f3e8" fontSize="12.5" fontWeight="600" fontFamily="var(--ll-sans)">
                                    {n.title}
                                </text>
                                <text x={n.x + 12} y={n.y + 34} fill={n.color} fontSize="10" fontFamily="var(--font-ll-mono)">
                                    {n.sub}
                                </text>
                            </g>
                        );
                    })}
                    <text x="20" y="150" fill="rgba(181,183,174,0.7)" fontSize="10" fontFamily="var(--font-ll-mono)">
                        SCROLL →
                    </text>
                    <text x="20" y="280" fill="rgba(181,183,174,0.7)" fontSize="10" fontFamily="var(--font-ll-mono)">
                        POINTER + CLOCK →
                    </text>
                </svg>
            </div>
            <div className="grid gap-2 border-t border-[var(--ll-line)] p-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-5">
                <div>
                    <div className="text-[15px] font-semibold" style={{ color: node.color }}>
                        {node.title}
                    </div>
                    <div className="ll-mono text-[10.5px] text-[var(--ll-faint)]">{node.file}</div>
                </div>
                <p className="text-[14.5px] leading-relaxed text-[#dfe2d5]">{node.body}</p>
            </div>
        </Demo>
    );
}
