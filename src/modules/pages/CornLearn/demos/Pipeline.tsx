'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import { CHAPTERS } from '../content/chapters';
import { Demo } from '../kit/controls';

type Node = { id: string; x: number; y: number; title: string; sub: string; file: string; text: string; chapter: string; band?: boolean };

/** The system in one picture: hover (or tab to) a box to read what it does and where it lives. */
const NODES: Node[] = [
    {
        id: 'input',
        x: 20,
        y: 30,
        title: 'Wheel · touch · keys',
        sub: 'the browser never scrolls',
        file: 'engine/Engine.ts · bind()',
        text: 'Wheel, touch and arrow keys are caught on the window with preventDefault. Nothing on the page actually scrolls: the input only nudges a number.',
        chapter: 'steps',
    },
    {
        id: 'scroller',
        x: 265,
        y: 30,
        title: 'Scroller',
        sub: 'target + spring → step',
        file: 'engine/Scroller.ts',
        text: 'Input moves a target in steps (420 px of wheel per step). The view follows on a critically damped spring and settles on a whole step when you let go.',
        chapter: 'steps',
    },
    {
        id: 'timeline',
        x: 510,
        y: 30,
        title: 'Timeline',
        sub: 'step → story + dwell',
        file: 'engine/Timeline.ts',
        text: 'Each chapter owns some dwell steps (the scene travels, the copy holds) and one move step to the next chapter. toStory(step) turns the step into the story position and the dwell.',
        chapter: 'story',
    },
    {
        id: 'engine',
        x: 755,
        y: 30,
        title: 'Engine.tick',
        sub: 'worlds, wipe or blend',
        file: 'engine/Engine.ts · tick()',
        text: 'Once a frame: floor(pos) is the current world, the fraction is how far the move to the next one is. Picks one or two worlds, the transition (wipe or blend) and its progress, and runs titles and copy timing.',
        chapter: 'story',
    },
    {
        id: 'worlds',
        x: 755,
        y: 200,
        title: 'Worlds × 5',
        sub: 'scene · bokeh · titles',
        file: 'engine/worlds/*.ts',
        text: 'Hero, science, stalk, plots, kernel. Each gets the same frame context (time, pointer, local, dwell) and moves its camera and objects from it. Then it draws: 3D scene, bokeh layer, title overlay.',
        chapter: 'camera',
    },
    {
        id: 'targets',
        x: 510,
        y: 200,
        title: 'Render targets A · B',
        sub: 'off-screen pictures',
        file: 'engine/Composite.ts · a, b, aMove, bMove',
        text: 'Each world paints into its own invisible image (half-float, 2× MSAA). Only worlds on screen render; during a transition both render at 72 %.',
        chapter: 'worlds',
    },
    {
        id: 'composite',
        x: 265,
        y: 200,
        title: 'Composite',
        sub: 'wipe · grade · grain',
        file: 'engine/Composite.ts · render()',
        text: 'One shader reads A and B and cuts between them with the slanted wipe (or a blend), converts to display colour, grades through a LUT, blurs for the menu and adds grain and vignette.',
        chapter: 'worlds',
    },
    {
        id: 'screen',
        x: 20,
        y: 200,
        title: 'Canvas',
        sub: 'one canvas, one loop',
        file: 'CornPage.tsx · .corn-canvas',
        text: 'A single fixed WebGL canvas fills the window under the HTML. One requestAnimationFrame loop (Engine.frame) does all of the above every frame.',
        chapter: 'perf',
    },
    {
        id: 'dom',
        x: 20,
        y: 380,
        title: 'HTML layer',
        sub: 'copy, links, menu, a11y',
        file: 'dom/*.tsx',
        text: 'React renders everything you can read, click or tab to, on top of the canvas: body copy, CTA rings, header, menu, footer links, the deep-dive panels.',
        chapter: 'map',
        band: true,
    },
    {
        id: 'store',
        x: 265,
        y: 380,
        title: 'Store',
        sub: 'engine writes, React reads',
        file: 'store.ts · setUi / useUi',
        text: 'A tiny shared state: current chapter, menu open, deep-dive mode, load progress. The engine writes it only when something changes, never per frame, so React stays quiet.',
        chapter: 'map',
        band: true,
    },
    {
        id: 'anchors',
        x: 510,
        y: 380,
        title: 'Title anchors',
        sub: 'transparent headings',
        file: 'dom/Story.tsx · data-gl-title',
        text: 'Every headline is a real HTML heading in the same face, kept transparent. The engine measures it on resize and draws the WebGL title exactly on top.',
        chapter: 'titles',
        band: true,
    },
    {
        id: 'nav',
        x: 755,
        y: 380,
        title: 'Side nav ring',
        sub: 'arc written per frame',
        file: 'dom/SideNav.tsx · data-nav-arc',
        text: 'The ring’s arc is the one DOM value that changes every frame: the engine writes its stroke-dasharray directly, without React.',
        chapter: 'story',
        band: true,
    },
];

const W = 225;
const H = 92;

export default function Pipeline() {
    const [sel, setSel] = useState('engine');
    const node = NODES.find((n) => n.id === sel) ?? NODES[0];
    const mid = (n: Node) => ({ x: n.x + W / 2, y: n.y + H / 2 });
    const by = (id: string) => NODES.find((n) => n.id === id)!;
    const arrow = (a: string, b: string, side: 'h' | 'v') => {
        const p = by(a);
        const q = by(b);
        if (side === 'h') {
            const dir = q.x > p.x ? 1 : -1;
            const x1 = dir > 0 ? p.x + W : p.x;
            const x2 = dir > 0 ? q.x : q.x + W;
            return `M${x1 + dir * 4},${mid(p).y} L${x2 - dir * 8},${mid(q).y}`;
        }
        return `M${mid(p).x},${p.y + H + 4} L${mid(q).x},${q.y - 8}`;
    };

    return (
        <Demo title="The system in one picture" hint="Hover or tab through the boxes. Follow the arrows: input → step → story → worlds → pictures → screen.">
            <div className="cl-scrollbox overflow-x-auto" data-lenis-prevent>
                <div className="min-w-[860px] p-5">
                    <svg viewBox="0 0 1000 490" className="block w-full" role="group" aria-label="Pipeline diagram">
                        <defs>
                            <marker id="cl-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                                <path d="M0,0 L10,5 L0,10 z" fill="var(--cl-mint)" />
                            </marker>
                        </defs>
                        {/* the HTML band */}
                        <rect x="8" y="356" width="984" height="128" rx="14" fill="rgba(233,196,106,0.04)" stroke="rgba(233,196,106,0.3)" strokeDasharray="4 5" />
                        <text x="22" y="372" className="cl-mono" fontSize="11" fill="var(--cl-gold)">
                            HTML ON TOP (REACT) · reads the store · owns text, links, focus
                        </text>
                        <text x="22" y="20" className="cl-mono" fontSize="11" fill="var(--cl-mint)">
                            ONE LOOP, EVERY FRAME (VANILLA THREE.JS)
                        </text>
                        {[
                            ['input', 'scroller', 'h'],
                            ['scroller', 'timeline', 'h'],
                            ['timeline', 'engine', 'h'],
                            ['engine', 'worlds', 'v'],
                            ['worlds', 'targets', 'h'],
                            ['targets', 'composite', 'h'],
                            ['composite', 'screen', 'h'],
                        ].map(([a, b, s]) => (
                            <path key={a + b} d={arrow(a, b, s as 'h' | 'v')} stroke="var(--cl-mint)" strokeWidth="1.4" fill="none" markerEnd="url(#cl-arrow)" />
                        ))}
                        {/* engine ⇄ HTML: dashed, along the right edge */}
                        <path d="M980,76 L992,76 L992,426 L985,426" stroke="var(--cl-gold)" strokeWidth="1.2" strokeDasharray="4 4" fill="none" markerEnd="url(#cl-arrow)" />
                        <text x="986" y="250" fontSize="10.5" fill="var(--cl-gold)" className="cl-mono" transform="rotate(90 986 250)" textAnchor="middle">
                            store + nav arc
                        </text>
                        {NODES.map((n) => {
                            const on = n.id === sel;
                            return (
                                <g
                                    key={n.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={on}
                                    aria-label={`${n.title}: ${n.sub}`}
                                    onMouseEnter={() => setSel(n.id)}
                                    onFocus={() => setSel(n.id)}
                                    onClick={() => setSel(n.id)}
                                    className="cursor-pointer outline-none"
                                >
                                    <rect
                                        x={n.x}
                                        y={n.y}
                                        width={W}
                                        height={H}
                                        rx="12"
                                        fill={on ? (n.band ? 'rgba(233,196,106,0.14)' : 'rgba(85,255,194,0.12)') : 'var(--cl-panel)'}
                                        stroke={on ? (n.band ? 'var(--cl-gold)' : 'var(--cl-mint)') : 'var(--cl-line-3)'}
                                        strokeWidth={on ? 1.6 : 1}
                                    />
                                    <text x={n.x + 16} y={n.y + 36} fontSize="17" fontWeight="600" fill="var(--cl-ink)">
                                        {n.title}
                                    </text>
                                    <text x={n.x + 16} y={n.y + 62} fontSize="12.5" className="cl-mono" fill={on ? (n.band ? 'var(--cl-gold)' : 'var(--cl-mint)') : 'var(--cl-dim)'}>
                                        {n.sub}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
            <div className="border-t border-[var(--cl-line)] p-5" aria-live="polite">
                <div className="cl-mono mb-1.5 flex flex-wrap items-center gap-2 text-[10.5px] uppercase">
                    <span className={cn(node.band ? 'text-[var(--cl-gold)]' : 'text-[var(--cl-mint)]')}>{node.title}</span>
                    <span className="text-[var(--cl-faint)]">{`· ${node.file}`}</span>
                </div>
                <p className="max-w-[72ch] text-[15.5px] leading-relaxed text-[var(--cl-body)]">{node.text}</p>
                <a href={`#${node.chapter}`} className="cl-mono mt-2 inline-block text-[11px] uppercase text-[var(--cl-mint)] hover:underline">
                    {node.chapter === 'map' ? 'Covered in this chapter ↓' : `Taught in ${CHAPTERS.find((c) => c.id === node.chapter)?.n} ${CHAPTERS.find((c) => c.id === node.chapter)?.label} →`}
                </a>
            </div>
        </Demo>
    );
}
