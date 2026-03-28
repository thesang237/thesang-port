'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { CodeBlock } from '@/components/code-block';
import { FadeIn, NOISE_BG } from '@/components/fade-in';

gsap.registerPlugin(useGSAP);

// ─── Primitives ───────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-violet-500/10 text-violet-400 border-violet-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 font-black font-mono shrink-0"
            style={{ fontSize: '12px' }}
        >
            {n}
        </span>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <code className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-mono rounded px-1.5 py-0.5" style={{ fontSize: '12px' }}>
            {children}
        </code>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent" />;
}

function Callout({ children, variant = 'tip' }: { children: React.ReactNode; variant?: 'tip' | 'info' | 'warn' }) {
    const styles = {
        tip: 'bg-violet-500/5 border-violet-500/20 text-violet-200/90',
        info: 'bg-sky-500/5 border-sky-500/20 text-sky-200/90',
        warn: 'bg-orange-500/5 border-orange-500/20 text-orange-200/90',
    };
    const icons = { tip: '💡', info: 'ℹ️', warn: '⚠️' };
    return (
        <div className={`border rounded-xl px-4 py-3 leading-relaxed flex gap-2.5 ${styles[variant]}`} style={{ fontSize: '13px' }}>
            <span className="shrink-0 mt-0.5">{icons[variant]}</span>
            <span>{children}</span>
        </div>
    );
}

function DemoShell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center gap-2">
                <div className="flex gap-1.5">
                    {['bg-red-500/60', 'bg-yellow-500/60', 'bg-green-500/60'].map((c) => (
                        <div key={c} className={`size-2.5 rounded-full ${c}`} />
                    ))}
                </div>
                <span className="text-zinc-500 font-mono ml-1" style={{ fontSize: '11px' }}>
                    {title}
                </span>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Step 1 demo: clip-path box shapes ────────────────────────────────────────

function ClipPathDemo() {
    const CUT = 16;
    const boxes = [
        { pos: 'A', label: 'top-left', col: 1, row: 1, clipPath: `polygon(0 0,calc(100% - ${CUT}px) 0,100% ${CUT}px,100% 100%,${CUT}px 100%,0 calc(100% - ${CUT}px))` },
        { pos: 'B', label: 'top-right', col: 2, row: 1, clipPath: `polygon(0 ${CUT}px,${CUT}px 0,100% 0,100% calc(100% - ${CUT}px),calc(100% - ${CUT}px) 100%,0 100%)` },
        { pos: 'C', label: 'bottom-left', col: 1, row: 2, clipPath: `polygon(0 ${CUT}px,${CUT}px 0,100% 0,100% calc(100% - ${CUT}px),calc(100% - ${CUT}px) 100%,0 100%)` },
        { pos: 'D', label: 'bottom-right', col: 2, row: 2, clipPath: `polygon(0 0,calc(100% - ${CUT}px) 0,100% ${CUT}px,100% 100%,${CUT}px 100%,0 calc(100% - ${CUT}px))` },
    ];
    return (
        <div className="grid grid-cols-2 gap-2" style={{ width: 240 }}>
            {boxes.map(({ pos, label, clipPath }) => (
                <div key={pos} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-center bg-violet-500/20 border border-violet-500/40 text-violet-300 font-mono font-bold" style={{ height: 90, clipPath, fontSize: 22 }}>
                        {pos}
                    </div>
                    <span className="text-zinc-500 font-mono text-center" style={{ fontSize: '9px' }}>
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Step 3 demo: timeline addLabel visualizer ────────────────────────────────

function TimelineLabelDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const [playing, setPlaying] = useState(false);

    useGSAP(
        () => {
            const boxes = containerRef.current!.querySelectorAll<HTMLElement>('[data-tl-box]');
            gsap.set(boxes, { opacity: 0, y: 20 });
        },
        { scope: containerRef },
    );

    const play = () => {
        if (!containerRef.current || playing) return;
        setPlaying(true);
        const boxes = containerRef.current.querySelectorAll<HTMLElement>('[data-tl-box]');
        gsap.set(boxes, { opacity: 0, y: 20 });

        tlRef.current = gsap
            .timeline({
                defaults: { duration: 0.5, ease: 'expo.out' },
                onComplete: () => setPlaying(false),
            })
            .addLabel('start', 0)
            // all three at 'start' — fire simultaneously
            .to(boxes[0], { opacity: 1, y: 0 }, 'start')
            .to(boxes[1], { opacity: 1, y: 0 }, 'start')
            .to(boxes[2], { opacity: 1, y: 0 }, 'start')
            // fourth at 'start+=0.3' — 300ms after label
            .to(boxes[3], { opacity: 1, y: 0, backgroundColor: 'rgba(167,139,250,0.25)' }, 'start+=0.3');
    };

    const items = [
        { label: 'IMG scale', color: 'bg-violet-500/20 border-violet-500/30', time: '@start' },
        { label: 'BOX slide', color: 'bg-indigo-500/20 border-indigo-500/30', time: '@start' },
        { label: 'BOX rotate', color: 'bg-blue-500/20 border-blue-500/30', time: '@start' },
        { label: 'CHARS fade', color: 'bg-violet-500/20 border-violet-400/40', time: '@start+0.3' },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div ref={containerRef} className="grid grid-cols-4 gap-2">
                {items.map(({ label, color, time }) => (
                    <div key={label} data-tl-box className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-3 ${color}`} style={{ opacity: 0 }}>
                        <span className="text-zinc-200 font-mono font-semibold" style={{ fontSize: '11px' }}>
                            {label}
                        </span>
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '9px' }}>
                            {time}
                        </span>
                    </div>
                ))}
            </div>
            {/* Timeline ruler */}
            <div className="relative h-6 bg-zinc-800/60 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-3/4 bg-violet-500/20 rounded-full" />
                <div className="absolute inset-y-0 left-0 right-1/4 flex items-center px-3">
                    <span className="text-violet-400 font-mono" style={{ fontSize: '9px' }}>
                        ← A + B + C start here (0s)
                    </span>
                </div>
                <div className="absolute right-0 inset-y-0 w-1/4 flex items-center justify-center">
                    <span className="text-violet-300 font-mono" style={{ fontSize: '9px' }}>
                        D (+0.3s)
                    </span>
                </div>
            </div>
            <button
                onClick={play}
                disabled={playing}
                className="self-start px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 font-mono transition-opacity disabled:opacity-40"
                style={{ fontSize: '12px' }}
            >
                {playing ? 'playing…' : '▶ Play timeline'}
            </button>
        </div>
    );
}

// ─── Step 4 demo: function-based values — corner direction map ────────────────

function FunctionValuesDemo() {
    const boxes = [
        { pos: 'a', col: 1, row: 1, x: '-100%', y: '-100%', label: 'x: -100\ny: -100' },
        { pos: 'b', col: 2, row: 1, x: '+100%', y: '-100%', label: 'x: +100\ny: -100' },
        { pos: 'c', col: 1, row: 2, x: '-100%', y: '+100%', label: 'x: -100\ny: +100' },
        { pos: 'd', col: 2, row: 2, x: '+100%', y: '+100%', label: 'x: +100\ny: +100' },
    ];
    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-1.5" style={{ width: 260 }}>
                {boxes.map(({ pos, x, y, label }) => (
                    <div key={pos} className="relative flex items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/50" style={{ height: 80 }}>
                        {/* Arrow icon */}
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-zinc-400 font-mono font-bold uppercase" style={{ fontSize: '13px' }}>
                                {pos}
                            </span>
                            <span className="text-violet-400 font-mono whitespace-pre-line text-center leading-tight" style={{ fontSize: '9px' }}>
                                {label}
                            </span>
                        </div>
                        {/* Corner hint arrows */}
                        <span
                            className="absolute text-violet-500/50"
                            style={{
                                fontSize: '10px',
                                top: x.includes('-') && y.includes('-') ? 4 : y.includes('+') ? undefined : 4,
                                bottom: y.includes('+') ? 4 : undefined,
                                left: x.includes('-') ? 4 : undefined,
                                right: x.includes('+') ? 4 : undefined,
                            }}
                        >
                            {x.includes('-') && y.includes('-') ? '↖' : x.includes('+') && y.includes('-') ? '↗' : x.includes('-') ? '↙' : '↘'}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-zinc-500" style={{ fontSize: '12px' }}>
                Each box slides in from its own corner — <Pill>xPercent</Pill> and <Pill>yPercent</Pill> are computed per-element via a callback.
            </p>
        </div>
    );
}

// ─── Step 5 demo: live mini card — Effect 1 ───────────────────────────────────

function SplitChars({ text }: { text: string }) {
    return (
        <>
            {text.split('').map((char, i) => (
                <span key={i} data-char style={{ display: 'inline-block' }}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </>
    );
}

const CLIP_AD = 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))';
const CLIP_BC = 'polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)';

function MiniCard1() {
    const cardRef = useRef<HTMLDivElement>(null);
    const enterTl = useRef<gsap.core.Timeline | null>(null);
    const leaveTl = useRef<gsap.core.Timeline | null>(null);

    useGSAP(
        (_ctx, contextSafe) => {
            if (!cardRef.current) return;
            const card = cardRef.current;
            const imgEl = card.querySelector<HTMLElement>('[data-img]')!;
            const boxEls = [...card.querySelectorAll<HTMLElement>('[data-box]')];
            const numberChars = [...card.querySelectorAll<HTMLElement>('[data-num] [data-char]')];
            const categoryChars = [...card.querySelectorAll<HTMLElement>('[data-cat] [data-char]')];

            const onEnter = contextSafe!(() => {
                leaveTl.current?.kill();
                enterTl.current = gsap
                    .timeline({ defaults: { duration: 0.5, ease: 'expo' } })
                    .addLabel('start', 0)
                    .fromTo(imgEl, { filter: 'saturate(100%) brightness(100%)' }, { scale: 0.85, filter: 'saturate(200%) brightness(70%)' }, 'start')
                    .fromTo(
                        boxEls,
                        {
                            opacity: 0,
                            xPercent: (_i: number, t: Element) => (['a', 'c'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                            yPercent: (_i: number, t: Element) => (['a', 'b'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                        },
                        { opacity: 1, xPercent: 0, yPercent: 0 },
                        'start',
                    )
                    .fromTo(numberChars, { opacity: 0 }, { duration: 0.3, opacity: 1, stagger: 0.1 }, 'start+=.2')
                    .fromTo(categoryChars, { opacity: 0 }, { duration: 0.1, opacity: 1, stagger: { from: 'random' as const, each: 0.05 } }, 'start+=.2');
            });

            const onLeave = contextSafe!(() => {
                enterTl.current?.kill();
                leaveTl.current = gsap
                    .timeline({ defaults: { duration: 0.8, ease: 'expo' } })
                    .addLabel('start', 0)
                    .to(imgEl, { scale: 1, filter: 'saturate(100%) brightness(100%)' }, 'start')
                    .to(
                        boxEls,
                        {
                            opacity: 0,
                            xPercent: (_i: number, t: Element) => (['a', 'c'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                            yPercent: (_i: number, t: Element) => (['a', 'b'].includes((t as HTMLElement).dataset.pos!) ? -100 : 100),
                        },
                        'start',
                    );
            });

            card.addEventListener('mouseenter', onEnter);
            card.addEventListener('mouseleave', onLeave);
            return () => {
                card.removeEventListener('mouseenter', onEnter);
                card.removeEventListener('mouseleave', onLeave);
            };
        },
        { scope: cardRef },
    );

    return (
        <div ref={cardRef} className="relative overflow-hidden cursor-pointer grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 rounded" style={{ width: 200, height: 200 }}>
            <div data-img className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/img/grid-hover/3.jpg)', willChange: 'filter, transform' }} />
            {[
                { pos: 'c', num: '02', tags: '#techno', clip: CLIP_BC, gridCol: 'col-start-1', gridRow: 'row-start-2' },
                { pos: 'd', cat: 'Pulse Club', clip: CLIP_AD, gridCol: 'col-start-2', gridRow: 'row-start-2' },
            ].map(({ pos, num, tags, cat, clip, gridCol, gridRow }) => (
                <div
                    key={pos}
                    data-box
                    data-pos={pos}
                    className={`opacity-0 z-10 p-2 flex flex-col relative backdrop-blur-sm ${gridCol} ${gridRow} ${pos === 'b' || pos === 'd' ? 'items-end text-right' : ''}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', clipPath: clip }}
                >
                    {num && (
                        <span data-num className="font-extralight leading-none text-white" style={{ fontSize: 28, fontFamily: 'Georgia, serif' }}>
                            <SplitChars text={num} />
                        </span>
                    )}
                    {tags && (
                        <span className="text-white font-semibold mt-auto" style={{ fontSize: '0.6rem' }}>
                            {tags}
                        </span>
                    )}
                    {cat && (
                        <span data-cat className="text-white font-semibold mt-auto" style={{ fontSize: '0.75rem' }}>
                            <SplitChars text={cat} />
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Step 6 demo: direction detection visualizer ──────────────────────────────

let demoMouseX = 0;
let demoMouseY = 0;

function DirectionDemo() {
    const boxRef = useRef<HTMLDivElement>(null);
    const [dir, setDir] = useState<string>('—');
    const [active, setActive] = useState(false);

    // Track globally — same pattern as the real implementation.
    // onMouseMove scoped to the element fires AFTER onMouseEnter,
    // so the position would still be 0 when the check runs.
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            demoMouseX = e.clientX;
            demoMouseY = e.clientY;
        };
        document.addEventListener('mousemove', onMove);
        return () => document.removeEventListener('mousemove', onMove);
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                ref={boxRef}
                className="relative flex items-center justify-center rounded-xl border-2 transition-colors cursor-crosshair select-none"
                style={{
                    width: 220,
                    height: 140,
                    borderColor: active ? 'rgba(167,139,250,0.7)' : 'rgba(113,113,122,0.4)',
                    backgroundColor: active ? 'rgba(167,139,250,0.08)' : 'rgba(39,39,42,0.6)',
                }}
                onMouseEnter={(e) => {
                    setActive(true);
                    const el = e.currentTarget;
                    const { top, bottom, left, right } = el.getBoundingClientRect();
                    let d = 'left';
                    if (demoMouseY <= Math.floor(top)) d = 'top';
                    else if (demoMouseY >= Math.floor(bottom)) d = 'bottom';
                    else if (demoMouseX <= Math.floor(left)) d = 'left';
                    else if (demoMouseX >= Math.floor(right)) d = 'right';
                    setDir(d.toUpperCase());
                }}
                onMouseLeave={() => {
                    setActive(false);
                    setDir('—');
                }}
            >
                <span className="font-mono text-zinc-400" style={{ fontSize: '12px' }}>
                    hover me from any side
                </span>
                {/* side indicators */}
                {['top', 'bottom', 'left', 'right'].map((side) => (
                    <div
                        key={side}
                        className="absolute font-mono transition-colors"
                        style={{
                            fontSize: '9px',
                            top: side === 'top' ? 6 : side === 'bottom' ? undefined : '50%',
                            bottom: side === 'bottom' ? 6 : undefined,
                            left: side === 'left' ? 6 : side === 'right' ? undefined : '50%',
                            right: side === 'right' ? 6 : undefined,
                            transform: side === 'top' || side === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
                            color: dir === side.toUpperCase() ? 'rgb(167,139,250)' : 'rgba(113,113,122,0.5)',
                        }}
                    >
                        {side === 'top' ? '▲' : side === 'bottom' ? '▼' : side === 'left' ? '◀' : '▶'}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-mono" style={{ fontSize: '12px' }}>
                    Entry direction:
                </span>
                <span className="font-mono font-bold text-violet-400" style={{ fontSize: '14px' }}>
                    {dir}
                </span>
            </div>
        </div>
    );
}

// ─── Step 7 demo: live mini card — Effect 2 ───────────────────────────────────

let miniMX = 0;
let miniMY = 0;

function MiniCard2() {
    const cardRef = useRef<HTMLDivElement>(null);
    const enterTl = useRef<gsap.core.Timeline | null>(null);
    const leaveTl = useRef<gsap.core.Timeline | null>(null);
    const dirRef = useRef<string>('left');

    useGSAP(
        (_ctx, contextSafe) => {
            if (!cardRef.current) return;
            const card = cardRef.current;
            const imgEl = card.querySelector<HTMLElement>('[data-img]')!;
            const boxEls = [...card.querySelectorAll<HTMLElement>('[data-box]')];
            const numberChars = [...card.querySelectorAll<HTMLElement>('[data-num] [data-char]')];
            const categoryChars = [...card.querySelectorAll<HTMLElement>('[data-cat] [data-char]')];
            gsap.set(imgEl, { scale: 1.3 });

            document.addEventListener('mousemove', (e) => {
                miniMX = e.clientX;
                miniMY = e.clientY;
            });

            const onEnter = contextSafe!(() => {
                leaveTl.current?.kill();
                const { top, bottom, left, right } = card.getBoundingClientRect();
                let d = 'left';
                if (miniMY <= Math.floor(top)) d = 'top';
                else if (miniMY >= Math.floor(bottom)) d = 'bottom';
                else if (miniMX <= Math.floor(left)) d = 'left';
                else if (miniMX >= Math.floor(right)) d = 'right';
                dirRef.current = d;

                const xPct = d === 'left' ? -10 : d === 'right' ? 10 : 0;
                const yPct = d === 'top' ? -10 : d === 'bottom' ? 10 : 0;
                const bxPct = d === 'left' ? -20 : d === 'right' ? 20 : 0;
                const byPct = d === 'top' ? -20 : d === 'bottom' ? 20 : 0;

                enterTl.current = gsap
                    .timeline({ defaults: { duration: 0.7, ease: 'expo' } })
                    .addLabel('start', 0)
                    .fromTo(imgEl, { filter: 'grayscale(0%)' }, { xPercent: xPct, yPercent: yPct, filter: 'grayscale(40%)' }, 'start')
                    .fromTo(boxEls, { opacity: 0, xPercent: bxPct, yPercent: byPct, rotation: -10 }, { opacity: 1, xPercent: 0, yPercent: 0, rotation: 0, stagger: 0.08 }, 'start')
                    .fromTo(numberChars, { opacity: 0 }, { duration: 0.3, opacity: 1, stagger: 0.1 }, 'start+=.2')
                    .fromTo(categoryChars, { opacity: 0 }, { duration: 0.1, opacity: 1, stagger: { from: 'random' as const, each: 0.05 } }, 'start+=.2');
            });

            const onLeave = contextSafe!(() => {
                enterTl.current?.kill();
                const d = dirRef.current;
                const bxPct = d === 'left' ? -20 : d === 'right' ? 20 : 0;
                const byPct = d === 'top' ? -20 : d === 'bottom' ? 20 : 0;
                leaveTl.current = gsap
                    .timeline({ defaults: { duration: 0.8, ease: 'expo' } })
                    .addLabel('start', 0)
                    .to(imgEl, { xPercent: 0, yPercent: 0, filter: 'grayscale(0%)' }, 'start')
                    .to(boxEls, { opacity: 0, xPercent: bxPct, yPercent: byPct, rotation: -10 }, 'start');
            });

            card.addEventListener('mouseenter', onEnter);
            card.addEventListener('mouseleave', onLeave);
            return () => {
                card.removeEventListener('mouseenter', onEnter);
                card.removeEventListener('mouseleave', onLeave);
            };
        },
        { scope: cardRef },
    );

    return (
        <div ref={cardRef} className="relative overflow-hidden cursor-pointer grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 rounded" style={{ width: 200, height: 200 }}>
            <div data-img className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/img/grid-hover/4.jpg)', willChange: 'filter, transform' }} />
            {[
                { pos: 'b', num: '21', tags: '#trap', clip: CLIP_BC, gridCol: 'col-start-2', gridRow: 'row-start-1' },
                { pos: 'c', cat: 'SubBass', clip: CLIP_BC, gridCol: 'col-start-1', gridRow: 'row-start-2' },
            ].map(({ pos, num, tags, cat, clip, gridCol, gridRow }) => (
                <div
                    key={pos}
                    data-box
                    data-pos={pos}
                    className={`opacity-0 z-10 p-2 flex flex-col relative backdrop-blur-sm ${gridCol} ${gridRow} ${pos === 'b' || pos === 'd' ? 'items-end text-right' : ''}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', clipPath: clip }}
                >
                    {num && (
                        <span data-num className="font-extralight leading-none text-white" style={{ fontSize: 28, fontFamily: 'Georgia, serif' }}>
                            <SplitChars text={num} />
                        </span>
                    )}
                    {tags && (
                        <span className="text-white font-semibold mt-auto" style={{ fontSize: '0.6rem' }}>
                            {tags}
                        </span>
                    )}
                    {cat && (
                        <span data-cat className="text-white font-semibold mt-auto" style={{ fontSize: '0.75rem' }}>
                            <SplitChars text={cat} />
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Step 8 demo: stagger playground ─────────────────────────────────────────

function StaggerDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<'sequential' | 'random'>('sequential');
    const [each, setEach] = useState(0.07);
    const [playing, setPlaying] = useState(false);

    const run = (m: 'sequential' | 'random', e: number) => {
        if (!containerRef.current || playing) return;
        setPlaying(true);
        const chars = containerRef.current.querySelectorAll<HTMLElement>('[data-demo-char]');
        gsap.killTweensOf(chars);
        gsap.set(chars, { opacity: 0 });
        gsap.to(chars, {
            opacity: 1,
            duration: 0.15,
            stagger: m === 'random' ? { from: 'random', each: e } : { each: e },
            onComplete: () => setPlaying(false),
        });
    };

    const text = 'GROOVE HIVE';

    return (
        <div className="flex flex-col gap-4">
            <div ref={containerRef} className="font-mono font-bold tracking-widest text-zinc-200 flex flex-wrap gap-0" style={{ fontSize: 28, letterSpacing: '0.15em' }}>
                {text.split('').map((ch, i) => (
                    <span key={i} data-demo-char style={{ opacity: 0, display: 'inline-block', minWidth: ch === ' ' ? '0.4em' : undefined }}>
                        {ch === ' ' ? '\u00A0' : ch}
                    </span>
                ))}
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex gap-2">
                    {(['sequential', 'random'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-3 py-1.5 rounded-lg font-mono border transition-colors ${mode === m ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-transparent border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
                            style={{ fontSize: '11px' }}
                        >
                            {m}
                        </button>
                    ))}
                </div>
                <label className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                        <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                            stagger.each
                        </span>
                        <span className="text-violet-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                            {each.toFixed(2)}s
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0.02}
                        max={0.2}
                        step={0.01}
                        value={each}
                        onChange={(e) => setEach(parseFloat(e.target.value))}
                        className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer"
                    />
                </label>
                <button
                    onClick={() => run(mode, each)}
                    disabled={playing}
                    className="self-start px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 font-mono disabled:opacity-40 transition-opacity"
                    style={{ fontSize: '12px' }}
                >
                    {playing ? 'animating…' : '▶ Animate'}
                </button>
            </div>
        </div>
    );
}

// ─── Step 9 demo: live mini card — Effect 3 ───────────────────────────────────

function MiniCard3() {
    const cardRef = useRef<HTMLDivElement>(null);
    const enterTl = useRef<gsap.core.Timeline | null>(null);
    const leaveTl = useRef<gsap.core.Timeline | null>(null);

    useGSAP(
        (_ctx, contextSafe) => {
            if (!cardRef.current) return;
            const card = cardRef.current;
            const imgEl = card.querySelector<HTMLElement>('[data-img]')!;
            const boxEls = [...card.querySelectorAll<HTMLElement>('[data-box]')];
            const numberChars = [...card.querySelectorAll<HTMLElement>('[data-num] [data-char]')];
            const categoryChars = [...card.querySelectorAll<HTMLElement>('[data-cat] [data-char]')];
            gsap.set(imgEl, { scale: 1.2 });

            const onEnter = contextSafe!(() => {
                leaveTl.current?.kill();
                enterTl.current = gsap
                    .timeline({ defaults: { duration: 0.7, ease: 'expo' } })
                    .addLabel('start', 0)
                    .fromTo(imgEl, { filter: 'grayscale(0%)' }, { filter: 'grayscale(90%)' }, 'start')
                    .to(imgEl, { ease: 'power4', duration: 0.6, scaleY: 1 }, 'start')
                    .to(imgEl, { duration: 1.5, scaleX: 1 }, 'start')
                    .fromTo(boxEls, { opacity: 0, scale: 0, rotation: -10 }, { opacity: 1, scale: 1, rotation: 0, stagger: 0.08 }, 'start')
                    .fromTo(numberChars, { opacity: 0 }, { duration: 0.3, opacity: 1, stagger: 0.1 }, 'start+=.2')
                    .fromTo(categoryChars, { opacity: 0 }, { duration: 0.1, opacity: 1, stagger: { from: 'random' as const, each: 0.05 } }, 'start+=.2');
            });

            const onLeave = contextSafe!(() => {
                enterTl.current?.kill();
                leaveTl.current = gsap
                    .timeline({ defaults: { duration: 0.8, ease: 'expo' } })
                    .addLabel('start', 0)
                    .to(imgEl, { scale: 1.3, filter: 'grayscale(0%)' }, 'start')
                    .to(boxEls, { scale: 0, opacity: 0, rotation: -10 }, 'start');
            });

            card.addEventListener('mouseenter', onEnter);
            card.addEventListener('mouseleave', onLeave);
            return () => {
                card.removeEventListener('mouseenter', onEnter);
                card.removeEventListener('mouseleave', onLeave);
            };
        },
        { scope: cardRef },
    );

    return (
        <div ref={cardRef} className="relative overflow-hidden cursor-pointer grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 rounded" style={{ width: 200, height: 200 }}>
            <div data-img className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/img/grid-hover/16.jpg)', willChange: 'filter, transform' }} />
            {[
                { pos: 'c', num: '02', tags: '#techno', clip: CLIP_BC, gridCol: 'col-start-1', gridRow: 'row-start-2' },
                { pos: 'd', cat: 'Pulse Club', clip: CLIP_AD, gridCol: 'col-start-2', gridRow: 'row-start-2' },
            ].map(({ pos, num, tags, cat, clip, gridCol, gridRow }) => (
                <div
                    key={pos}
                    data-box
                    data-pos={pos}
                    className={`opacity-0 z-10 p-2 flex flex-col relative backdrop-blur-sm ${gridCol} ${gridRow} ${pos === 'b' || pos === 'd' ? 'items-end text-right' : ''}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', clipPath: clip }}
                >
                    {num && (
                        <span data-num className="font-extralight leading-none text-white" style={{ fontSize: 28, fontFamily: 'Georgia, serif' }}>
                            <SplitChars text={num} />
                        </span>
                    )}
                    {tags && (
                        <span className="text-white font-semibold mt-auto" style={{ fontSize: '0.6rem' }}>
                            {tags}
                        </span>
                    )}
                    {cat && (
                        <span data-cat className="text-white font-semibold mt-auto" style={{ fontSize: '0.75rem' }}>
                            <SplitChars text={cat} />
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Step 10 demo: kill pattern visualizer ────────────────────────────────────

function KillPatternDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const enterTl = useRef<gsap.core.Timeline | null>(null);
    const leaveTl = useRef<gsap.core.Timeline | null>(null);
    const [log, setLog] = useState<string[]>(['Hover the box rapidly to see kill() in action']);

    const push = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 4));

    useGSAP(
        (_ctx, contextSafe) => {
            if (!containerRef.current) return;
            const box = containerRef.current.querySelector<HTMLElement>('[data-kill-box]')!;

            const onEnter = contextSafe!(() => {
                const wasPlaying = leaveTl.current?.isActive();
                leaveTl.current?.kill();
                push(wasPlaying ? '🔴 kill() leave tl → start enter tl' : '▶ start enter tl');
                enterTl.current = gsap.timeline().to(box, { scale: 0.85, filter: 'saturate(200%) brightness(70%)', duration: 0.5, ease: 'expo' });
            });

            const onLeave = contextSafe!(() => {
                const wasPlaying = enterTl.current?.isActive();
                enterTl.current?.kill();
                push(wasPlaying ? '🔴 kill() enter tl → start leave tl' : '▶ start leave tl');
                leaveTl.current = gsap.timeline().to(box, { scale: 1, filter: 'saturate(100%) brightness(100%)', duration: 0.8, ease: 'expo' });
            });

            box.addEventListener('mouseenter', onEnter);
            box.addEventListener('mouseleave', onLeave);
            return () => {
                box.removeEventListener('mouseenter', onEnter);
                box.removeEventListener('mouseleave', onLeave);
            };
        },
        { scope: containerRef },
    );

    return (
        <div className="flex gap-6 items-start">
            <div ref={containerRef}>
                <div
                    data-kill-box
                    className="rounded-xl cursor-pointer bg-cover bg-center"
                    style={{ width: 120, height: 120, backgroundImage: 'url(/img/grid-hover/17.jpg)', willChange: 'filter, transform' }}
                />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
                <p className="text-zinc-500 font-mono" style={{ fontSize: '10px' }}>
                    timeline log (most recent first)
                </p>
                {log.map((entry, i) => (
                    <div key={i} className="font-mono text-zinc-300 bg-zinc-800/50 rounded px-2 py-1" style={{ fontSize: '11px', opacity: 1 - i * 0.2 }}>
                        {entry}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STEPS = [
    'Card DOM structure & clip-path boxes',
    'useGSAP + contextSafe — the React integration',
    'gsap.timeline(), addLabel & parallel tracks',
    'gsap.set() — initial state before interaction',
    'Function-based tween values (per-element)',
    'Effect 1 — corner slide + image filter',
    'Effect 2 — direction-aware hover',
    'Stagger + SplitChars text reveal',
    'Effect 3 — asymmetric scale animation',
    'Cross-cancelling timelines with kill()',
];

export default function GridHoverLearnPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-300" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <div style={NOISE_BG} className="border-b border-zinc-800/70">
                <div className="max-w-3xl mx-auto px-6 py-16">
                    <FadeIn>
                        <div className="flex flex-wrap gap-2 mb-5">
                            <Tag>GSAP</Tag>
                            <Tag>useGSAP</Tag>
                            <Tag>Timeline</Tag>
                            <Tag>Stagger</Tag>
                            <Tag>Direction-aware</Tag>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-100 mb-3">Grid Item Hover — Guide</h1>
                        <p className="text-zinc-400 leading-relaxed mb-6" style={{ fontSize: '15px' }}>
                            A step-by-step breakdown of every GSAP technique powering the three hover effects: simultaneous timelines, direction-aware enter/leave, per-element function values, random
                            stagger, and asymmetric scale.
                        </p>
                        <Link href="/grid-hover" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors font-mono" style={{ fontSize: '13px' }}>
                            ← view the live demo
                        </Link>
                    </FadeIn>

                    {/* Step index */}
                    <FadeIn delay={0.1} className="mt-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {STEPS.map((s, i) => (
                                <div key={i} className="flex items-center gap-2.5 bg-zinc-900/50 border border-zinc-800/60 rounded-lg px-3 py-2">
                                    <StepBadge n={i + 1} />
                                    <span className="text-zinc-400" style={{ fontSize: '12px' }}>
                                        {s}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-16 space-y-0">
                {/* ── Step 1 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={1} />
                            <h2 className="text-lg font-bold text-zinc-100">Card DOM structure & clip-path boxes</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            Each card is a <Pill>position: relative</Pill> container with two layers. The background image sits <Pill>absolute inset-0</Pill> and fills the full card. On top, a CSS{' '}
                            <Pill>grid grid-cols-2 grid-rows-2</Pill> creates four named quadrants (A–D) for the overlay boxes.
                        </p>
                        <div className="flex flex-wrap gap-6 items-start mb-5">
                            <DemoShell title="Quadrant positions + clip-path">
                                <ClipPathDemo />
                            </DemoShell>
                            <div className="flex-1 min-w-[200px]">
                                <p className="text-zinc-400 leading-relaxed mb-3" style={{ fontSize: '13px' }}>
                                    The diagonal corner cuts are pure CSS <Pill>clip-path: polygon()</Pill>. Boxes A and D share one orientation; B and C share the mirror. The cut value is hardcoded
                                    at 20px.
                                </p>
                                <CodeBlock lang="ts">{`// A & D — cuts top-right and bottom-left
'polygon(0 0,calc(100%-20px) 0,100% 20px,
  100% 100%,20px 100%,0 calc(100%-20px))'

// B & C — cuts top-left and bottom-right
'polygon(0 20px,20px 0,100% 0,
  100% calc(100%-20px),calc(100%-20px) 100%,0 100%)'`}</CodeBlock>
                            </div>
                        </div>
                        <CodeBlock
                            lang="tsx"
                            highlight={['data-card-img', 'data-card-box', 'data-pos']}
                        >{`<div ref={cardRef} className="relative overflow-hidden grid grid-cols-2 grid-rows-2 gap-2 p-2"
     style={{ width: 300, height: 300 }}>

  {/* Layer 1 — background image, fills entire card */}
  <div data-card-img className="absolute inset-0 bg-cover bg-center z-[1]"
       style={{ backgroundImage: \`url(\${img})\`, willChange: 'filter, transform' }} />

  {/* Layer 2 — overlay box in quadrant C (bottom-left) */}
  <div data-card-box data-pos="c"
       className="opacity-0 z-[2] p-4 flex flex-col col-start-1 row-start-2"
       style={{ backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(5px)',
                clipPath: 'polygon(0 20px,20px 0,...)' }}>
    <span data-card-number>02</span>
    <span>#techno</span>
  </div>
</div>`}</CodeBlock>
                        <div className="mt-4">
                            <Callout variant="tip">
                                {'Boxes start with '}
                                <Pill>opacity: 0</Pill>
                                {" in the JSX — they're invisible by default and only become visible when GSAP animates them in on hover."}
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 2 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={2} />
                            <h2 className="text-lg font-bold text-zinc-100">useGSAP + contextSafe</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            <Pill>useGSAP</Pill> is the official GSAP hook for React. It wraps animations in a <em>context</em> that auto-reverts them on unmount — no manual cleanup of tweens needed.
                        </p>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            The catch: event handlers attached inside <Pill>useGSAP</Pill> {'run '}
                            <em>after</em>
                            {" the hook finishes. Any GSAP animations they create are outside the context and won't be cleaned up. Wrapping them in "}
                            <Pill>contextSafe()</Pill>
                            {' opts them back in.'}
                        </p>
                        <CodeBlock lang="tsx" highlight={['contextSafe', 'useGSAP', 'removeEventListener']}>{`useGSAP(
  (_ctx, contextSafe) => {
    // ✅ This runs during the hook — part of the context
    gsap.set(imgEl, { scale: 1.3 });

    // ❌ Without contextSafe: created AFTER hook, not tracked
    // const onEnter = () => { gsap.to(imgEl, { scale: 0.85 }); };

    // ✅ contextSafe: wraps the callback so its animations
    //    are added to the GSAP context and reverted on unmount
    const onEnter = contextSafe!(() => {
      gsap.to(imgEl, { scale: 0.85 });
    });

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);

    // Return cleanup — only for listeners; GSAP reverts tweens
    return () => {
      card.removeEventListener('mouseenter', onEnter);
      card.removeEventListener('mouseleave', onLeave);
    };
  },
  { scope: cardRef },   // scope: scopes selector strings to this ref
);`}</CodeBlock>
                        <div className="mt-4 space-y-3">
                            <Callout variant="info">
                                <Pill>scope: cardRef</Pill>
                                {" scopes GSAP's CSS selector strings (like "}
                                <Pill>.box</Pill>
                                {') to that element — preventing accidental matches outside the component. We use '}
                                <Pill>querySelectorAll</Pill>
                                {' directly here, but passing scope is still good practice for context management.'}
                            </Callout>
                            <Callout variant="warn">
                                The cleanup function returned from inside the <Pill>useGSAP</Pill> callback only needs to remove event listeners. You do <strong>not</strong> need to kill timelines —
                                the GSAP context handles that automatically when the component unmounts.
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 3 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={3} />
                            <h2 className="text-lg font-bold text-zinc-100">gsap.timeline(), addLabel & parallel tracks</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            A <Pill>gsap.timeline()</Pill> is a sequencer — tweens added to it play one after another by default. The <Pill>addLabel()</Pill> method creates a named bookmark in time.
                            Passing that label as the position parameter to multiple tweens makes them all start at the same instant.
                        </p>
                        <DemoShell title="Four animations, all anchored to 'start'">
                            <TimelineLabelDemo />
                        </DemoShell>
                        <div className="mt-5">
                            <CodeBlock lang="tsx" highlight={['addLabel', "'start'", "'start+=.2'"]}>{`gsap.timeline({ defaults: { duration: 0.5, ease: 'expo' } })
  .addLabel('start', 0)                // bookmark at t=0
  .fromTo(imgEl, { ... }, { ... }, 'start')      // fires at t=0
  .fromTo(boxEls, { ... }, { ... }, 'start')     // fires at t=0 (parallel)
  .fromTo(numberChars, { ... }, { ... }, 'start+=.2')  // t=0.2s
  .fromTo(categoryChars, { ... }, { ... }, 'start+=.2') // t=0.2s`}</CodeBlock>
                        </div>
                        <div className="mt-4">
                            <Callout variant="tip">
                                <Pill>defaults</Pill> sets shared values for all tweens in the timeline. Each tween can still override them individually — <Pill>numberChars</Pill> uses{' '}
                                <Pill>duration: 0.3</Pill> despite the default being <Pill>0.5</Pill>.
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 4 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={4} />
                            <h2 className="text-lg font-bold text-zinc-100">gsap.set() — initial state before interaction</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            Effects 2 and 3 need the background image pre-scaled before any hover happens. <Pill>gsap.set()</Pill> applies GSAP properties instantly (no tween), making it the right
                            tool for setting initial state inside <Pill>useGSAP</Pill> where the DOM is guaranteed ready.
                        </p>
                        <CodeBlock lang="tsx" highlight={['gsap.set']}>{`useGSAP((_ctx, contextSafe) => {
  const imgEl = card.querySelector('[data-card-img]');

  // Effect 2: image starts at 130% scale, shift on hover creates parallax
  if (effect === 2) gsap.set(imgEl, { scale: 1.3 });

  // Effect 3: image starts at 120% scale, scaleX/scaleY animate to 1 on hover
  if (effect === 3) gsap.set(imgEl, { scale: 1.2 });

  // ...event listeners follow
}, { scope: cardRef });`}</CodeBlock>
                        <div className="mt-4">
                            <Callout variant="tip">
                                Prefer <Pill>gsap.set()</Pill> over inline CSS transforms for GSAP-managed properties. Mixing them causes GSAP to read an incorrect starting value on the first tween.
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 5 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={5} />
                            <h2 className="text-lg font-bold text-zinc-100">Function-based tween values (per-element)</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            GSAP accepts a <Pill>{'(index, target) => value'}</Pill> callback for any property. This lets a single <Pill>fromTo()</Pill> call compute a different start/end value for
                            each element in the target array — critical for the corner-slide effect where each box must fly from its own corner.
                        </p>
                        <div className="flex flex-wrap gap-6 items-start mb-5">
                            <DemoShell title="xPercent / yPercent per quadrant">
                                <FunctionValuesDemo />
                            </DemoShell>
                            <div className="flex-1 min-w-[200px]">
                                <CodeBlock lang="tsx" highlight={['xPercent', 'yPercent', 'dataset.pos']}>{`// One fromTo animates ALL boxes
// Each gets its own start position
.fromTo(
  boxEls,
  {
    opacity: 0,
    xPercent: (_i, target) =>
      ['a','c'].includes(target.dataset.pos)
        ? -100  // left side: slide from left
        : 100,  // right side: slide from right
    yPercent: (_i, target) =>
      ['a','b'].includes(target.dataset.pos)
        ? -100  // top row: slide from top
        : 100,  // bottom row: slide from bottom
  },
  { opacity: 1, xPercent: 0, yPercent: 0 },
  'start',
)`}</CodeBlock>
                            </div>
                        </div>
                        <Callout variant="info">
                            <Pill>xPercent: -100</Pill>
                            {' means "translate X by -100% of the element\'s own width". This is more reliable than '}
                            <Pill>x: -300</Pill>
                            {' because it adapts to any element size.'}
                        </Callout>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 6 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={6} />
                            <h2 className="text-lg font-bold text-zinc-100">Effect 1 — corner slide + image filter</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            On mouseenter: the image shrinks to 85% scale and gets a saturation+brightness boost. Each overlay box slides in from its corner. Chars in the number and category text fade
                            in with a short stagger. On mouseleave everything reverses.
                        </p>
                        <div className="flex flex-wrap gap-6 items-start mb-5">
                            <DemoShell title="Effect 1 — hover me">
                                <MiniCard1 />
                            </DemoShell>
                            <div className="flex-1 min-w-[200px] space-y-3">
                                <p className="text-zinc-400" style={{ fontSize: '13px' }}>
                                    The image animation uses <Pill>filter</Pill> to drive CSS filter functions. GSAP interpolates the numeric values inside the string.
                                </p>
                                <p className="text-zinc-400" style={{ fontSize: '13px' }}>
                                    Note <Pill>fromTo</Pill> vs <Pill>to</Pill> — the leave timeline uses <Pill>to()</Pill> because the current live state is a valid from-state.
                                </p>
                            </div>
                        </div>
                        <CodeBlock lang="tsx" highlight={['fromTo', 'filter', 'scale: 0.85']}>{`// ENTER
gsap.timeline({ defaults: { duration: 0.5, ease: 'expo' } })
  .addLabel('start', 0)
  // Image: shrink + boost color
  .fromTo(imgEl,
    { filter: 'saturate(100%) brightness(100%)' },
    { scale: 0.85, filter: 'saturate(200%) brightness(70%)' },
    'start')
  // Boxes: corner slide-in (function values, see Step 5)
  .fromTo(boxEls,
    { opacity: 0, xPercent: ..., yPercent: ... },
    { opacity: 1, xPercent: 0, yPercent: 0 },
    'start')
  // Chars: stagger fade (see Step 8)
  .fromTo(numberChars, { opacity: 0 }, { opacity: 1, stagger: 0.1 }, 'start+=.2')
  .fromTo(categoryChars, { opacity: 0 }, { opacity: 1, stagger: { from: 'random', each: 0.05 } }, 'start+=.2')

// LEAVE (to() — current state is the from)
gsap.timeline({ defaults: { duration: 0.8, ease: 'expo' } })
  .addLabel('start', 0)
  .to(imgEl, { scale: 1, filter: 'saturate(100%) brightness(100%)' }, 'start')
  .to(boxEls, { opacity: 0, xPercent: ..., yPercent: ... }, 'start')`}</CodeBlock>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 7 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={7} />
                            <h2 className="text-lg font-bold text-zinc-100">Effect 2 — direction-aware hover</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            {'When the mouse enters, the animation should respond to '}
                            <em>which side</em>
                            {" it came from. The trick: track the mouse position continuously in a module-level variable, then compare it to the card's bounding rect at the moment "}
                            <Pill>mouseenter</Pill>
                            {' fires.'}
                        </p>
                        <div className="flex flex-wrap gap-6 items-start mb-5">
                            <DemoShell title="Direction detector — hover from each side">
                                <DirectionDemo />
                            </DemoShell>
                            <div className="flex-1 min-w-[200px]">
                                <p className="text-zinc-400 mb-3" style={{ fontSize: '13px' }}>
                                    Why not use <Pill>event.clientX/Y</Pill> from the <Pill>mouseenter</Pill> event itself? By the time <Pill>mouseenter</Pill> fires, the cursor is already inside the
                                    element — so coordinates are interior, not the entry edge.
                                </p>
                                <CodeBlock lang="tsx" highlight={['mouseX', 'mouseY', 'getBoundingClientRect']}>{`// Module-level — updated on every mousemove
let mouseX = 0, mouseY = 0;

// In page component (useEffect, not useGSAP
// since no GSAP code here)
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Inside contextSafe onEnter:
function getEnterDirection(el) {
  const { top, right, bottom, left } =
    el.getBoundingClientRect();
  if (mouseY <= top)    return 'top';
  if (mouseY >= bottom) return 'bottom';
  if (mouseX <= left)   return 'left';
  if (mouseX >= right)  return 'right';
  return 'left'; // fallback
}`}</CodeBlock>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-6 items-start mb-5">
                            <DemoShell title="Effect 2 — hover from different sides">
                                <MiniCard2 />
                            </DemoShell>
                            <div className="flex-1 min-w-[200px]">
                                <CodeBlock lang="tsx" highlight={['xPercent', 'yPercent', 'dirRef']}>{`// direction stored in ref to use in onLeave
dirRef.current = getEnterDirection(card);
const dir = dirRef.current;

// Image drifts 10% in entry direction
.fromTo(imgEl, { filter: 'grayscale(0%)' }, {
  xPercent: dir === 'left' ? -10 : dir === 'right' ? 10 : 0,
  yPercent: dir === 'top'  ? -10 : dir === 'bottom'? 10 : 0,
  filter: 'grayscale(40%)',
}, 'start')

// Boxes slide from entry direction + rotate in
.fromTo(boxEls, {
  opacity: 0,
  xPercent: dir === 'left' ? -20 : dir === 'right' ? 20 : 0,
  yPercent: dir === 'top'  ? -20 : dir === 'bottom'? 20 : 0,
  rotation: -10,
}, { opacity: 1, xPercent: 0, yPercent: 0, rotation: 0,
     stagger: 0.08 }, 'start')`}</CodeBlock>
                            </div>
                        </div>
                        <Callout variant="warn">
                            The direction is stored in a <Pill>useRef</Pill> (not state) so the <Pill>onLeave</Pill> callback can read it without needing a re-render or closure capture. State updates
                            are async; refs are synchronous.
                        </Callout>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 8 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={8} />
                            <h2 className="text-lg font-bold text-zinc-100">Stagger + SplitChars text reveal</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            {"GSAP's "}
                            <Pill>stagger</Pill>
                            {" property delays the start of each successive target's tween. "}
                            <Pill>stagger: 0.1</Pill>
                            {' means each element starts 100ms after the previous. '}
                            <Pill>{'stagger: { from: "random", each: 0.05 }'}</Pill>
                            {' randomises the order — giving the scrambled-reveal look on category text.'}
                        </p>
                        <DemoShell title="Sequential vs random stagger — try both">
                            <StaggerDemo />
                        </DemoShell>
                        <div className="mt-5 space-y-4">
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                To animate individual characters, each letter must be its own DOM element. The original used Splitting.js. Here we replace it with a simple React component that renders
                                one <Pill>{'<span data-char>'}</Pill> per character.
                            </p>
                            <CodeBlock lang="tsx" highlight={['data-char', 'SplitChars', 'stagger']}>{`// SplitChars: splits a string into per-char spans
function SplitChars({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span key={i} data-char style={{ display: 'inline-block' }}>
          {char === ' ' ? '\\u00A0' : char}
        </span>
      ))}
    </>
  );
}

// Querying the chars in useGSAP:
const numberChars = [...card.querySelectorAll('[data-card-number] [data-char]')];
const categoryChars = [...card.querySelectorAll('[data-card-category] [data-char]')];

// Sequential stagger (numbers)
.fromTo(numberChars, { opacity: 0 },
  { duration: 0.3, opacity: 1, stagger: 0.1 }, 'start+=.2')

// Random stagger (category name)
.fromTo(categoryChars, { opacity: 0 },
  { duration: 0.1, opacity: 1,
    stagger: { from: 'random', each: 0.05 } }, 'start+=.2')`}</CodeBlock>
                            <Callout variant="tip">
                                <Pill>display: inline-block</Pill> is required on each char span — inline elements ignore transform and some other GSAP properties.
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 9 ─────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={9} />
                            <h2 className="text-lg font-bold text-zinc-100">Effect 3 — asymmetric scale animation</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            Effect 3 animates <Pill>scaleX</Pill> and <Pill>scaleY</Pill> independently — each with a different ease and duration — while starting both at the same{' '}
                            <Pill>{"'start'"}</Pill> label. This creates a stretching wipe feel instead of uniform scaling.
                        </p>
                        <div className="flex flex-wrap gap-6 items-start mb-5">
                            <DemoShell title="Effect 3 — hover me">
                                <MiniCard3 />
                            </DemoShell>
                            <div className="flex-1 min-w-[200px]">
                                <CodeBlock lang="tsx" highlight={['scaleY', 'scaleX', 'power4']}>{`// Image starts at scale: 1.2 (set in useGSAP)

// ENTER — scaleY snaps fast (power4),
//         scaleX eases slow (default expo)
.to(imgEl, {
  ease: 'power4', duration: 0.6, scaleY: 1
}, 'start')
.to(imgEl, {
  duration: 1.5, scaleX: 1
}, 'start')

// LEAVE — back to scale 1.3 (slightly more
//         zoomed than initial 1.2)
.to(imgEl, { scale: 1.3 }, 'start')`}</CodeBlock>
                                <p className="text-zinc-400 mt-3" style={{ fontSize: '13px' }}>
                                    On leave, the boxes collapse back with <Pill>scale: 0</Pill> and <Pill>rotation: -10</Pill> — the reverse of their entrance.
                                </p>
                            </div>
                        </div>
                        <Callout variant="info">
                            Two <Pill>.to()</Pill> calls targeting the same element at the same label position are merged by GSAP into a single tween internally — but you can still give each its own{' '}
                            <Pill>ease</Pill> and <Pill>duration</Pill>. This only works when they target <em>different</em> properties.
                        </Callout>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Step 10 ────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <StepBadge n={10} />
                            <h2 className="text-lg font-bold text-zinc-100">Cross-cancelling timelines with kill()</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                            When a user hovers rapidly in and out, the enter timeline may still be playing when <Pill>mouseleave</Pill> fires — and vice versa. Without cancellation, competing tweens
                            fight over the same properties, causing visual glitches.
                        </p>
                        <DemoShell title="Rapid hover — watch the log">
                            <KillPatternDemo />
                        </DemoShell>
                        <div className="mt-5">
                            <CodeBlock lang="tsx" highlight={['kill()', 'enterTl', 'leaveTl']}>{`// Refs persist between renders without triggering re-render
const enterTl = useRef<gsap.core.Timeline | null>(null);
const leaveTl = useRef<gsap.core.Timeline | null>(null);

const onEnter = contextSafe!(() => {
  leaveTl.current?.kill();          // cancel any in-progress leave
  enterTl.current = gsap.timeline() // store new enter timeline
    .to(imgEl, { scale: 0.85 });
});

const onLeave = contextSafe!(() => {
  enterTl.current?.kill();          // cancel any in-progress enter
  leaveTl.current = gsap.timeline() // store new leave timeline
    .to(imgEl, { scale: 1 });
});`}</CodeBlock>
                        </div>
                        <div className="mt-4 space-y-3">
                            <Callout variant="tip">
                                <Pill>kill()</Pill> stops the timeline <em>at its current progress</em> — it does not jump to start or end. The leave animation begins from whatever mid-animation state
                                the element is in, which looks natural.
                            </Callout>
                            <Callout variant="warn">
                                {'Use '}
                                <Pill>useRef</Pill>
                                {' to store the timelines, not '}
                                <Pill>useState</Pill>
                                {". Updating state triggers a re-render; updating a ref doesn't — and GSAP timelines live outside React's render cycle."}
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                <SectionRule />

                {/* ── Footer ─────────────────────────────────────────────── */}
                <FadeIn>
                    <div className="text-center pb-8">
                        <p className="text-zinc-500 mb-6" style={{ fontSize: '14px' }}>
                            You now have everything needed to build any hover-reveal card effect with GSAP in React.
                        </p>
                        <Link
                            href="/grid-hover"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-colors font-mono"
                            style={{ fontSize: '13px' }}
                        >
                            View the live demo →
                        </Link>
                    </div>
                </FadeIn>
            </div>
        </main>
    );
}
