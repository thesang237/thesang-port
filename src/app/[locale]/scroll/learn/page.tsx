'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const NS = 'http://www.w3.org/2000/svg';

// ─── primitives ───────────────────────────────────────────────────────────────

function _Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function Step({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black font-mono shrink-0"
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

function Rule() {
    return <div className="my-20 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent" />;
}

function Callout({ children, variant = 'emerald' }: { children: React.ReactNode; variant?: 'emerald' | 'amber' | 'sky' }) {
    const colors = {
        emerald: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90',
        amber: 'bg-amber-500/5 border-amber-500/20 text-amber-200/90',
        sky: 'bg-sky-500/5 border-sky-500/20 text-sky-200/90',
    };
    return (
        <div className={`rounded-xl border px-5 py-4 leading-relaxed ${colors[variant]}`} style={{ fontSize: '14px' }}>
            {children}
        </div>
    );
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
    return (
        <label className="flex flex-col gap-1.5">
            <div className="flex justify-between">
                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                    {label}
                </span>
                <span className="text-emerald-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                    {Number.isInteger(step) ? value : value.toFixed(2)}
                    {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-emerald-500 cursor-pointer"
            />
        </label>
    );
}

function ReplayBtn({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-zinc-400 hover:text-emerald-300 border border-zinc-700/60 hover:border-emerald-500/40 font-mono rounded-lg px-3 py-1.5 transition-colors"
            style={{ fontSize: '11px' }}
        >
            ↺ replay
        </button>
    );
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────

function HeroSection() {
    const ref = useRef<HTMLElement>(null);
    useGSAP(
        () => {
            gsap.from('.sc-char', { y: 70, opacity: 0, duration: 0.75, ease: 'power3.out', stagger: 0.022 });
            gsap.from('.sc-sub', { y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.55 });
            gsap.from('.sc-tag', { y: 8, opacity: 0, duration: 0.4, ease: 'power2.out', stagger: 0.07, delay: 0.85 });
        },
        { scope: ref },
    );

    const lines = ['SVG Mask', 'Scroll', 'Transitions'];
    const tags = ['SVG masks', 'ScrollTrigger', 'Lenis', 'useGSAP', 'clip-path'];

    return (
        <section ref={ref} className="relative px-6 md:px-12 xl:px-24 pt-32 pb-20 overflow-hidden">
            <div
                className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[280px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)' }}
            />

            <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((t) => (
                    <span key={t} className="sc-tag px-3 py-1 rounded-full border border-emerald-500/25 text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                        {t}
                    </span>
                ))}
            </div>

            <h1 className="font-black leading-[0.9] tracking-tight mb-8" style={{ fontSize: 'clamp(46px, 7.5vw, 96px)' }}>
                {lines.map((line, li) => (
                    <div key={li} className="overflow-hidden">
                        {line.split('').map((ch, ci) => (
                            <span key={ci} className="sc-char inline-block" style={{ color: li === 1 ? '#34d399' : '#fff', whiteSpace: ch === ' ' ? 'pre' : undefined }}>
                                {ch}
                            </span>
                        ))}
                    </div>
                ))}
            </h1>

            <p className="sc-sub text-zinc-400 max-w-xl leading-relaxed mb-10" style={{ fontSize: '18px' }}>
                A step-by-step breakdown of SVG mask reveal transitions driven by scroll. Four patterns, one architecture — from the sticky stage trick to the exact GLSL-free math that makes each
                blind open.
            </p>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 1 }}
                style={{ transformOrigin: 'left' }}
                className="h-px bg-gradient-to-r from-emerald-500/40 via-emerald-500/10 to-transparent"
            />

            <div className="mt-8 flex flex-wrap gap-4" style={{ fontSize: '14px' }}>
                {([1, 2, 3, 4] as const).map((n) => (
                    <Link key={n} href={`/scroll/${n}`} className="text-zinc-400 hover:text-emerald-400 transition-colors font-mono">
                        /scroll/{n} →
                    </Link>
                ))}
            </div>
        </section>
    );
}

// ─── 2. The Architecture ──────────────────────────────────────────────────────

function StickyDiagram() {
    return (
        <div className="relative w-full rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 select-none" style={{ height: 220 }}>
            {/* scroll track */}
            <div className="absolute left-8 top-6 bottom-6 w-px bg-zinc-700/60" />
            {/* labels */}
            <div className="absolute left-12 top-6 font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                scroll top
            </div>
            <div className="absolute left-12 bottom-6 font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                scroll bottom
            </div>

            {/* stage bar */}
            <div className="absolute left-24 top-6 bottom-6 w-20 rounded bg-zinc-800/80 border border-zinc-700/50 flex flex-col justify-between overflow-hidden">
                <div className="w-full h-full flex flex-col">
                    <div className="flex-1 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 font-mono" style={{ fontSize: '9px' }}>
                            100vh
                        </span>
                    </div>
                    <div className="flex-1 border-b border-zinc-700/30 flex items-center justify-center">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '9px' }}>
                            100vh
                        </span>
                    </div>
                    <div className="flex-1 border-b border-zinc-700/30 flex items-center justify-center">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '9px' }}>
                            100vh
                        </span>
                    </div>
                    <div className="flex-1 border-b border-zinc-700/30 flex items-center justify-center">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '9px' }}>
                            100vh
                        </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '9px' }}>
                            100vh
                        </span>
                    </div>
                </div>
            </div>
            <div className="absolute left-24 -top-0.5 font-mono text-zinc-400" style={{ fontSize: '9px', top: '14px', left: '100px' }}>
                stage = 500vh
            </div>

            {/* sticky box */}
            <div
                className="absolute rounded border flex items-center justify-center bg-emerald-500/10 border-emerald-500/40"
                style={{ left: '180px', top: '50%', transform: 'translateY(-50%)', width: '100px', height: '80px' }}
            >
                <div className="text-center">
                    <div className="text-emerald-300 font-mono font-bold" style={{ fontSize: '10px' }}>
                        layers
                    </div>
                    <div className="text-emerald-400/60 font-mono" style={{ fontSize: '9px' }}>
                        sticky
                    </div>
                    <div className="text-emerald-400/60 font-mono" style={{ fontSize: '9px' }}>
                        100vh
                    </div>
                </div>
            </div>

            {/* brace */}
            <div className="absolute font-mono text-zinc-600" style={{ left: '296px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px' }}>
                <div>← this stays fixed</div>
                <div className="mt-1">while parent scrolls</div>
            </div>

            {/* scroll indicator animated */}
            <motion.div
                className="absolute left-6 w-3 h-3 rounded-full bg-emerald-400"
                style={{ top: '24px' }}
                animate={{ top: ['24px', 'calc(100% - 36px)', '24px'] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
            />
        </div>
    );
}

function ArchitectureSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={1} />
                    <h2 className="text-2xl font-black tracking-tight">The Sticky Stage Architecture</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The whole effect rests on one CSS trick: a tall parent (<Pill>height: 500vh</Pill>) with a sticky child (<Pill>position: sticky; top: 0; height: 100vh</Pill>). The parent creates
                    scrollable distance; the child stays in the viewport and receives the scroll progress as an animation driver.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <StickyDiagram />
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CodeBlock lang="css">
                        {`/* The only layout you need */
.stage {
  height: 500vh;   /* scroll distance = animation budget */
  position: relative;
}

.layers {
  position: sticky;
  top: 0;
  width: 100vw;
  height: 100vh;   /* always fills the viewport */
  overflow: hidden;
}`}
                    </CodeBlock>
                    <div className="space-y-3">
                        <Callout>
                            <strong className="text-emerald-300">Rule of thumb:</strong> each image transition needs ~100vh of scroll distance. Three images → 300vh minimum, plus 100vh intro and 100vh
                            outro = 500vh total.
                        </Callout>
                        <Callout variant="amber">
                            <strong className="text-amber-300">Why not fixed positioning?</strong> <Pill>position: fixed</Pill> breaks out of document flow and makes scroll math harder. Sticky stays
                            in flow — <Pill>ScrollTrigger.trigger</Pill> can reference the parent directly.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 3. SVG Mask System ───────────────────────────────────────────────────────

function MaskRevealDemo() {
    const [pct, setPct] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPct(Math.max(0, Math.min(100, y)));
    }, []);

    const _maskH = ((100 - pct) / 100) * 200;
    const _maskY = pct > 0 ? 0 : 0;

    return (
        <div ref={containerRef} onPointerMove={handleMove} className="relative rounded-xl overflow-hidden border border-zinc-800 cursor-ns-resize select-none" style={{ height: 200 }}>
            {/* base layer: dark bg with text */}
            <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
                <span className="text-zinc-600 font-black" style={{ fontSize: 'clamp(24px, 5vw, 48px)', letterSpacing: '-0.04em' }}>
                    HIDDEN
                </span>
            </div>

            {/* revealed layer using SVG mask */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <mask id="learn-mask" maskUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="100" height="100" fill="black" />
                        {/* white rect = visible area */}
                        <rect x="0" y={pct} width="100" height={100 - pct} fill="white" />
                    </mask>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill="#10b981" mask="url(#learn-mask)" />
                <text x="50" y="50" dominantBaseline="middle" textAnchor="middle" fill="white" fontWeight="900" fontSize="12" style={{ fontFamily: 'system-ui', letterSpacing: '-0.5px' }}>
                    REVEALED
                </text>
            </svg>

            {/* drag line */}
            <div className="absolute left-0 right-0 pointer-events-none flex items-center gap-2 px-3" style={{ top: `${pct}%`, transform: 'translateY(-50%)' }}>
                <div className="flex-1 h-px border-t border-dashed border-emerald-400/60" />
                <span className="text-emerald-400 font-mono bg-zinc-900/80 px-2 rounded" style={{ fontSize: '10px' }}>
                    y={pct.toFixed(0)}%
                </span>
                <div className="flex-1 h-px border-t border-dashed border-emerald-400/60" />
            </div>

            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                <span className="text-zinc-500 font-mono" style={{ fontSize: '9px' }}>
                    move mouse up/down
                </span>
            </div>
        </div>
    );
}

function MaskSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={2} />
                    <h2 className="text-2xl font-black tracking-tight">SVG Masks — White is Visible</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    An SVG <Pill>{'<mask>'}</Pill> makes pixels visible or hidden based on the <strong className="text-white">luminance</strong> of the mask shape. White = fully visible. Black = fully
                    hidden. Animating rect dimensions inside the mask is what drives every transition.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="flex flex-col gap-3">
                        <p className="text-zinc-300 font-bold">Drag to reveal</p>
                        <MaskRevealDemo />
                        <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                            The white <Pill>{'<rect>'}</Pill> in the mask grows from the drag position downward — everything it covers becomes visible.
                        </p>
                    </div>
                    <CodeBlock lang="html">
                        {`<svg viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <mask id="my-mask" maskUnits="userSpaceOnUse">

      <!-- black = hidden (base) -->
      <rect x="0" y="0" width="100" height="100"
            fill="black" />

      <!-- white = revealed area -->
      <!-- GSAP animates y and height of this rect -->
      <rect x="0" y="50" width="100" height="50"
            fill="white" />

    </mask>
  </defs>

  <!-- image is only visible through the white area -->
  <image href="/photo.webp"
    x="0" y="0" width="100" height="100"
    preserveAspectRatio="xMidYMid slice"
    mask="url(#my-mask)" />
</svg>`}
                    </CodeBlock>
                </div>
            </FadeIn>

            <FadeIn delay={0.2}>
                <Callout variant="sky">
                    <strong className="text-sky-300">userSpaceOnUse vs objectBoundingBox:</strong> We use <Pill>maskUnits=&quot;userSpaceOnUse&quot;</Pill> so coordinates match the SVG viewBox
                    (0–100). The default <Pill>objectBoundingBox</Pill> uses 0–1 fractions, which makes math harder for dynamic sizing.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 4. Dynamic Rect Generation ───────────────────────────────────────────────

function DynamicRectsSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={3} />
                    <h2 className="text-2xl font-black tracking-tight">Populating Masks at Runtime</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    We never write the mask rects in JSX — they are created imperatively in JavaScript using <Pill>document.createElementNS</Pill>. This keeps the component lean (no large arrays in
                    JSX), and lets us recalculate everything from scratch on resize with the correct viewport proportions.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CodeBlock lang="tsx" highlight={['createElementNS', 'NS', 'innerHTML', 'vbH']}>
                        {`const NS = 'http://www.w3.org/2000/svg';

function createBlinds(g: SVGGElement, count: number) {
  g.innerHTML = ''; // clear on resize

  const vbH = (window.innerHeight / window.innerWidth) * 100;
  const slotH = vbH / count;
  const blinds = [];
  let currentY = 0;

  for (let i = 0; i < count; i++) {
    const centerY = vbH - (currentY + slotH / 2);

    // MUST use createElementNS for SVG elements
    const rTop = document.createElementNS(NS, 'rect');
    const rBot = document.createElementNS(NS, 'rect');

    for (const r of [rTop, rBot]) {
      r.setAttribute('x', '0');
      r.setAttribute('width', '100');
      r.setAttribute('height', '0');   // starts invisible
      r.setAttribute('fill', 'white');
    }
    rTop.setAttribute('y', String(centerY));
    rBot.setAttribute('y', String(centerY));

    g.appendChild(rTop);
    g.appendChild(rBot);
    blinds.push({ top: rTop, bottom: rBot,
                  y: centerY, h: slotH / 2 });
    currentY += slotH;
  }
  return blinds;
}`}
                    </CodeBlock>

                    <div className="space-y-4">
                        <Callout variant="amber">
                            <strong className="text-amber-300">Always use createElementNS for SVG.</strong> <Pill>document.createElement(&apos;rect&apos;)</Pill> creates an HTML element, not an SVG
                            element. The namespace <Pill>&apos;http://www.w3.org/2000/svg&apos;</Pill> is required to get real SVG behavior — otherwise shapes won&apos;t render.
                        </Callout>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3" style={{ fontSize: '14px' }}>
                            <p className="text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                                COORDINATE SYSTEM
                            </p>
                            {[
                                { key: 'viewBox="0 0 100 vbH"', desc: 'Width is always 100 units. Height scales with aspect ratio.' },
                                { key: 'vbH = (h/w) × 100', desc: 'On a 1920×1080 screen: vbH = (1080/1920) × 100 = 56.25' },
                                { key: 'slotH = vbH / count', desc: "Each blind strip's height in the same coordinate space." },
                                { key: 'g.innerHTML = ""', desc: 'Wipe all children before re-generating on window resize.' },
                            ].map(({ key, desc }) => (
                                <div key={key} className="flex gap-3 items-start">
                                    <Pill>{key}</Pill>
                                    <span className="text-zinc-400 pt-0.5">{desc}</span>
                                </div>
                            ))}
                        </div>

                        <Callout>
                            <strong className="text-emerald-300">Why not React state?</strong> Re-generating 30×2 = 60 rects on resize using <Pill>useState</Pill> would trigger full re-renders and
                            potentially race with GSAP. Imperative DOM manipulation via a <Pill>groupRef</Pill> is faster and cleaner here.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 5. The Blind Reveal Mechanic ─────────────────────────────────────────────

function BlindDemo() {
    const svgRef = useRef<SVGSVGElement>(null);
    const groupRef = useRef<SVGGElement>(null);
    const [count, setCount] = useState(12);
    const [stagger, setStagger] = useState(0.03);
    const [from, setFrom] = useState<'start' | 'center' | 'end' | 'random'>('start');
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const play = useCallback(() => {
        const g = groupRef.current;
        if (!g) return;
        tlRef.current?.kill();
        g.innerHTML = '';

        if (orientation === 'horizontal') {
            const slotH = 100 / count;
            type B = { top: SVGRectElement; bottom: SVGRectElement; y: number; h: number };
            const blinds: B[] = [];
            for (let i = 0; i < count; i++) {
                const cy = 100 - (i * slotH + slotH / 2);
                const rT = document.createElementNS(NS, 'rect') as SVGRectElement;
                const rB = document.createElementNS(NS, 'rect') as SVGRectElement;
                for (const r of [rT, rB]) {
                    r.setAttribute('x', '0');
                    r.setAttribute('width', '100');
                    r.setAttribute('height', '0');
                    r.setAttribute('fill', 'white');
                }
                rT.setAttribute('y', String(cy));
                rB.setAttribute('y', String(cy));
                g.appendChild(rT);
                g.appendChild(rB);
                blinds.push({ top: rT, bottom: rB, y: cy, h: slotH / 2 });
            }
            tlRef.current = gsap.timeline().to(
                blinds.flatMap((b) => [b.top, b.bottom]),
                {
                    attr: {
                        y: (i: number) => {
                            const b = blinds[Math.floor(i / 2)];
                            return i % 2 === 0 ? b.y - b.h : b.y;
                        },
                        height: (i: number) => blinds[Math.floor(i / 2)].h + 0.1,
                    },
                    ease: 'power3.out',
                    duration: 0.8,
                    stagger: { each: stagger, from },
                },
            );
        } else {
            const slotW = 100 / count;
            type VB = { left: SVGRectElement; right: SVGRectElement; x: number; w: number };
            const blinds: VB[] = [];
            for (let i = 0; i < count; i++) {
                const cx = i * slotW + slotW / 2;
                const rL = document.createElementNS(NS, 'rect') as SVGRectElement;
                const rR = document.createElementNS(NS, 'rect') as SVGRectElement;
                for (const r of [rL, rR]) {
                    r.setAttribute('y', '0');
                    r.setAttribute('height', '100');
                    r.setAttribute('width', '0');
                    r.setAttribute('fill', 'white');
                }
                rL.setAttribute('x', String(cx));
                rR.setAttribute('x', String(cx));
                g.appendChild(rL);
                g.appendChild(rR);
                blinds.push({ left: rL, right: rR, x: cx, w: slotW / 2 });
            }
            tlRef.current = gsap.timeline().to(
                blinds.flatMap((b) => [b.left, b.right]),
                {
                    attr: {
                        x: (i: number) => {
                            const b = blinds[Math.floor(i / 2)];
                            return i % 2 === 0 ? b.x - b.w : b.x;
                        },
                        width: (i: number) => blinds[Math.floor(i / 2)].w + 0.1,
                    },
                    ease: 'power2.out',
                    duration: 0.7,
                    stagger: { each: stagger, from },
                },
            );
        }
    }, [count, stagger, from, orientation]);

    useEffect(() => {
        play();
        return () => {
            tlRef.current?.kill();
        };
    }, [play]);

    return (
        <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950" style={{ paddingBottom: '56.25%' }}>
                <svg ref={svgRef} className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="100" fill="#18181b" />
                    <text x="50" y="48" dominantBaseline="middle" textAnchor="middle" fill="#3f3f46" fontWeight="900" fontSize="14" style={{ fontFamily: 'system-ui', letterSpacing: '-0.5px' }}>
                        HIDDEN
                    </text>
                    <defs>
                        <mask id="blind-demo-mask" maskUnits="userSpaceOnUse">
                            <rect x="0" y="0" width="100" height="100" fill="black" />
                            <g ref={groupRef} />
                        </mask>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="#10b981" mask="url(#blind-demo-mask)" />
                    <text x="50" y="48" dominantBaseline="middle" textAnchor="middle" fill="white" fontWeight="900" fontSize="14" style={{ fontFamily: 'system-ui', letterSpacing: '-0.5px' }}>
                        REVEALED
                    </text>
                </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        params
                    </p>
                    <Slider label="count" value={count} min={3} max={30} step={1} onChange={setCount} />
                    <Slider label="stagger" value={stagger} min={0.005} max={0.08} step={0.005} onChange={setStagger} />
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        direction & type
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(['start', 'center', 'end', 'random'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFrom(f)}
                                className={`px-2 py-1 rounded font-mono transition-colors ${from === f ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
                                style={{ fontSize: '11px' }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {(['horizontal', 'vertical'] as const).map((o) => (
                            <button
                                key={o}
                                onClick={() => setOrientation(o)}
                                className={`px-2 py-1 rounded font-mono transition-colors ${orientation === o ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
                                style={{ fontSize: '11px' }}
                            >
                                {o}
                            </button>
                        ))}
                    </div>
                    <ReplayBtn onClick={play} />
                </div>
            </div>
        </div>
    );
}

function BlindSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={4} />
                    <h2 className="text-2xl font-black tracking-tight">Blind Mechanics — Opening from Center</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Each blind is <strong className="text-white">two rects sharing a center point</strong>. The top rect grows upward (y decreases); the bottom rect grows downward (height increases).
                    Together they create a strip that opens from its center — far more elegant than a single rect growing from one edge.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <BlindDemo />
                    <div className="space-y-4">
                        <CodeBlock lang="tsx" highlight={['y - b.h', 'b.h + 0.01', 'stagger']}>
                            {`function openBlinds(blinds) {
  // Each blind = two rects: top + bottom
  // Both start at centerY with height 0

  return gsap.timeline().to(
    blinds.flatMap(b => [b.top, b.bottom]),
    {
      attr: {
        // top rect: y moves UP (decreases)
        y: (i) => {
          const b = blinds[Math.floor(i / 2)];
          return i % 2 === 0
            ? b.y - b.h  // ← top goes up
            : b.y;       // ← bottom stays
        },
        // both expand to half-slot height
        height: (i) => blinds[Math.floor(i / 2)].h + 0.01,
      },
      ease: 'power3.out',
      stagger: {
        each: 0.02, // delay between strips
        from: 'start',
      },
    },
  );
}`}
                        </CodeBlock>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3" style={{ fontSize: '14px' }}>
                            <p className="text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                                WHY TWO RECTS PER BLIND?
                            </p>
                            <p className="text-zinc-400 leading-relaxed">
                                A single rect expanding from <Pill>y=0</Pill> (top down) would reveal the image in one direction. Two rects from center feel more like a curtain or venetian blind
                                opening symmetrically.
                            </p>
                            <p className="text-zinc-400 leading-relaxed">
                                The <Pill>+0.01</Pill> on height prevents a 1-pixel hairline gap between adjacent blinds at full open (sub-pixel floating point issue).
                            </p>
                        </div>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 6. Grid Patterns ─────────────────────────────────────────────────────────

function GridDemo() {
    const groupRef = useRef<SVGGElement>(null);
    const [cols, setCols] = useState(8);
    const [pattern, setPattern] = useState<'random' | 'columns' | 'rows'>('random');
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const rows = Math.round(cols * (9 / 16));

    const play = useCallback(() => {
        const g = groupRef.current;
        if (!g) return;
        tlRef.current?.kill();
        g.innerHTML = '';

        const cW = 100 / cols;
        const cH = 100 / rows;
        const cells: SVGRectElement[] = [];

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const r = document.createElementNS(NS, 'rect') as SVGRectElement;
                r.setAttribute('x', String(x * cW));
                r.setAttribute('y', String(y * cH));
                r.setAttribute('width', String(cW));
                r.setAttribute('height', String(cH));
                r.setAttribute('fill', 'white');
                r.setAttribute('shape-rendering', 'crispEdges');
                r.setAttribute('opacity', '0');
                g.appendChild(r);
                cells.push(r);
            }
        }

        let ordered: SVGRectElement[];
        if (pattern === 'random') {
            ordered = gsap.utils.shuffle([...cells]);
        } else if (pattern === 'columns') {
            ordered = [];
            for (let x = 0; x < cols; x++) {
                const col: SVGRectElement[] = [];
                for (let y = 0; y < rows; y++) col.push(cells[y * cols + x]);
                ordered.push(...gsap.utils.shuffle(col));
            }
        } else {
            ordered = [];
            for (let y = 0; y < rows; y++) {
                const row: SVGRectElement[] = [];
                for (let x = 0; x < cols; x++) row.push(cells[y * cols + x]);
                ordered.push(...gsap.utils.shuffle(row));
            }
        }

        tlRef.current = gsap.timeline().to(ordered, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            stagger: { each: 0.018 },
        });
    }, [cols, rows, pattern]);

    useEffect(() => {
        play();
        return () => {
            tlRef.current?.kill();
        };
    }, [play]);

    return (
        <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950" style={{ paddingBottom: '56.25%' }}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="100" fill="#18181b" />
                    <text x="50" y="48" dominantBaseline="middle" textAnchor="middle" fill="#3f3f46" fontWeight="900" fontSize="14" style={{ fontFamily: 'system-ui' }}>
                        HIDDEN
                    </text>
                    <defs>
                        <mask id="grid-demo-mask" maskUnits="userSpaceOnUse">
                            <rect x="0" y="0" width="100" height="100" fill="black" />
                            <g ref={groupRef} />
                        </mask>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="#0ea5e9" mask="url(#grid-demo-mask)" />
                    <text x="50" y="48" dominantBaseline="middle" textAnchor="middle" fill="white" fontWeight="900" fontSize="14" style={{ fontFamily: 'system-ui' }}>
                        REVEALED
                    </text>
                </svg>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        grid
                    </p>
                    <Slider label="cols" value={cols} min={3} max={20} step={1} onChange={setCols} />
                    <div className="text-zinc-500 font-mono" style={{ fontSize: '10px' }}>
                        rows: {rows} (auto 16:9)
                    </div>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        pattern
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(['random', 'columns', 'rows'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPattern(p)}
                                className={`px-2 py-1 rounded font-mono transition-colors ${pattern === p ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
                                style={{ fontSize: '11px' }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <ReplayBtn onClick={play} />
                </div>
            </div>
        </div>
    );
}

function GridSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={5} />
                    <h2 className="text-2xl font-black tracking-tight">Grid Patterns — Random & Column-Ordered</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Grid cells use <Pill>opacity: 0 → 1</Pill> instead of geometry expansion. The interesting part is the <strong className="text-white">ordering</strong>: random order feels organic;
                    column-by-column creates a wipe effect. The key function is <Pill>gsap.utils.shuffle()</Pill>.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <GridDemo />
                    <div className="space-y-4">
                        <CodeBlock lang="tsx" highlight={['shuffle', 'columns', 'stagger']}>
                            {`// Random Grid — fully shuffled
function openRandom(cells) {
  const shuffled = gsap.utils.shuffle([...cells]);
  return gsap.to(shuffled, {
    opacity: 1,
    duration: 1.0,
    ease: 'power3.out',
    stagger: { each: 0.02 },
  });
}

// Column Grid — ordered left→right,
//               random within each column
function openColumns({ cells, rows, cols }) {
  const ordered = [];

  for (let x = 0; x < cols; x++) {
    const col = [];
    for (let y = 0; y < rows; y++) {
      col.push(cells[y * cols + x]); // pick by column
    }
    ordered.push(...gsap.utils.shuffle(col)); // ← shuffle per column
  }

  return gsap.to(ordered, {
    opacity: 1,
    duration: 1,
    ease: 'power3.out',
    stagger: { each: 0.02 },
  });
}`}
                        </CodeBlock>
                        <Callout>
                            <strong className="text-emerald-300">Responsive columns:</strong> the grid always maintains the correct cell proportions by computing rows from cols × aspect ratio:{' '}
                            <Pill>rows = Math.round(cols × vbH / vbW)</Pill>. PC uses 14 cols, tablet 10, mobile 6.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 7. GSAP ScrollTrigger Scrub ─────────────────────────────────────────────

function ScrubDemo() {
    const [scrub, setScrub] = useState(2.5);
    const [scroll, setScroll] = useState(0);
    const anim = useRef(0);
    const targetRef = useRef(0);
    const [animPct, setAnimPct] = useState(0);

    useEffect(() => {
        targetRef.current = scroll;
    }, [scroll]);

    useEffect(() => {
        let raf: number;
        const update = () => {
            const diff = targetRef.current - anim.current;
            const lag = 1 / (scrub * 30); // simulate scrub lag
            anim.current += diff * Math.min(lag, 1);
            setAnimPct(Math.max(0, Math.min(100, anim.current)));
            raf = requestAnimationFrame(update);
        };
        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, [scrub]);

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-5">
            <p className="text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                SCRUB VISUALIZER
            </p>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono w-20 shrink-0" style={{ fontSize: '11px' }}>
                        scroll pos
                    </span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-400 rounded-full transition-none" style={{ width: `${scroll}%` }} />
                    </div>
                    <span className="text-zinc-300 font-mono w-10 text-right" style={{ fontSize: '11px' }}>
                        {scroll.toFixed(0)}%
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-mono w-20 shrink-0" style={{ fontSize: '11px' }}>
                        animation
                    </span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-none" style={{ width: `${animPct}%` }} />
                    </div>
                    <span className="text-emerald-300 font-mono w-10 text-right" style={{ fontSize: '11px' }}>
                        {animPct.toFixed(0)}%
                    </span>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {[0, 25, 50, 75, 100].map((v) => (
                    <button
                        key={v}
                        onClick={() => setScroll(v)}
                        className="px-3 py-1 rounded font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                        style={{ fontSize: '11px' }}
                    >
                        {v}%
                    </button>
                ))}
            </div>

            <Slider label={`scrub: ${scrub.toFixed(1)} — higher = more lag`} value={scrub} min={0.1} max={8} step={0.1} onChange={setScrub} />
        </div>
    );
}

function ScrollTriggerSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={6} />
                    <h2 className="text-2xl font-black tracking-tight">GSAP ScrollTrigger — Scrub & Timeline</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    <Pill>scrub</Pill> links a timeline&apos;s playhead to the scroll position. A value of <Pill>true</Pill> is instant; a number adds smoothing lag in seconds. The master timeline
                    sequences all three image reveals end-to-end, with text animations overlapping using position offsets.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                        <ScrubDemo />
                        <Callout variant="amber">
                            <strong className="text-amber-300">scrub vs direct animation:</strong> Without scrub, animations play once at a set speed. With scrub, the scroll position <em>is</em> the
                            playhead — you can reverse by scrolling up. This is what makes it feel tactile.
                        </Callout>
                    </div>
                    <CodeBlock lang="tsx" highlight={['scrub', 'master.add', 'anticipatePin', 'invalidateOnRefresh']}>
                        {`// One master timeline drives the whole page
const master = gsap.timeline({
  scrollTrigger: {
    trigger: stageRef.current,  // the 500vh container
    start: 'top top',
    end: 'bottom bottom',
    scrub: 2.5,         // smoothing lag in seconds
    anticipatePin: 1,   // prevents jump on pin
    invalidateOnRefresh: true, // recalculate on resize
  },
});

// Sequence: image reveals + text in/out
blindsSets.forEach((blinds, i) => {
  master.add(openBlinds(blinds));         // reveal image i

  if (texts[i]) {
    master.add(textIn(texts[i]), '-=0.3');  // overlap -0.3s
    master.add(textOut(texts[i]), '+=0.8'); // hold for 0.8s
  }
});

// Tip: position strings control timing
// '-=0.3'  → start 0.3s before previous ends
// '+=0.8'  → start 0.8s after previous ends
// '>'      → start exactly when previous ends`}
                    </CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 8. Text Reveal ───────────────────────────────────────────────────────────

function ClipPathDemo() {
    const textRef = useRef<HTMLDivElement>(null);
    const [dir, setDir] = useState<'in-bottom' | 'out-top' | 'in-top' | 'out-bottom'>('in-bottom');

    const play = useCallback(() => {
        const el = textRef.current;
        if (!el) return;
        gsap.killTweensOf(el);
        if (dir === 'in-bottom') {
            gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)', y: 40 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.2, ease: 'expo.out' });
        } else if (dir === 'out-top') {
            gsap.fromTo(el, { clipPath: 'inset(0% 0% 0% 0%)', y: 0 }, { clipPath: 'inset(0% 0% 100% 0%)', y: -30, duration: 1.0, ease: 'power2.inOut' });
        } else if (dir === 'in-top') {
            gsap.fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)', y: -40 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.2, ease: 'expo.out' });
        } else {
            gsap.fromTo(el, { clipPath: 'inset(0% 0% 0% 0%)', y: 0 }, { clipPath: 'inset(100% 0% 0% 0%)', y: 30, duration: 1.0, ease: 'power2.inOut' });
        }
    }, [dir]);

    useEffect(() => {
        play();
    }, [play]);

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden" style={{ height: 140 }}>
                <div ref={textRef} className="text-center select-none" style={{ clipPath: 'inset(100% 0% 0% 0%)' }}>
                    <div className="text-white font-black" style={{ fontSize: 'clamp(28px, 5vw, 52px)', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
                        SECTION
                        <br />
                        TITLE
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                    [
                        { key: 'in-bottom', label: '↑ enter' },
                        { key: 'out-top', label: '↑ exit' },
                        { key: 'in-top', label: '↓ enter' },
                        { key: 'out-bottom', label: '↓ exit' },
                    ] as const
                ).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setDir(key)}
                        className={`px-2 py-2 rounded font-mono transition-colors text-center ${dir === key ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'}`}
                        style={{ fontSize: '11px' }}
                    >
                        <div>{label}</div>
                        <div className="opacity-60 mt-0.5">{key}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function TextRevealSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={7} />
                    <h2 className="text-2xl font-black tracking-tight">Text Reveal — The clip-path Trick</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Text uses <Pill>clip-path: inset()</Pill> rather than <Pill>opacity</Pill> or <Pill>transform</Pill> alone. <Pill>inset(100% 0 0 0)</Pill> clips the element entirely from the
                    bottom; animating to <Pill>inset(0% 0% 0% 0%)</Pill> reveals it upward. Paired with a Y translate, it feels like text sliding out of a slot.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="flex flex-col gap-4">
                        <ClipPathDemo />
                        <Callout>
                            <strong className="text-emerald-300">Initial CSS state:</strong> set <Pill>clip-path: inset(100% 0 0 0)</Pill> and <Pill>transform: translateY(40px)</Pill> on{' '}
                            <Pill>.txt</Pill> in CSS — not in GSAP. That way the text is hidden on load before GSAP initialises, preventing a flash.
                        </Callout>
                    </div>
                    <CodeBlock lang="tsx" highlight={['clipPath', 'expo.out', 'inset']}>
                        {`// CSS initial state (in .txt class):
//   clip-path: inset(100% 0 0 0);  → fully hidden
//   transform: translateY(40px);   → shifted down

// Text enter animation
function textIn(el) {
  return gsap.to(el, {
    clipPath: 'inset(0% 0% 0% 0%)',  // fully visible
    y: 0,
    duration: 1.5,
    ease: 'expo.out',   // fast start, slow finish
  });
}

// Text exit animation (scrolling past)
function textOut(el) {
  return gsap.to(el, {
    clipPath: 'inset(0% 0% 100% 0%)', // clips from top
    y: -30,                            // slides up
    duration: 1.2,
    ease: 'power2.inOut',
  });
}

// inset(top right bottom left)
// inset(100% 0 0 0) → clip 100% from bottom = hidden
// inset(0% 0% 100% 0%) → clip 100% from top = hidden`}
                    </CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 9. Progress Bar ──────────────────────────────────────────────────────────

function ProgressBarViz() {
    const [progress, setProgress] = useState(0.45);
    const n = 3;

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {Array.from({ length: n }, (_, i) => {
                    const p = Math.max(0, Math.min(1, (progress - i / n) * n));
                    return (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-zinc-500 font-mono w-16 shrink-0" style={{ fontSize: '10px' }}>
                                segment {i + 1}
                            </span>
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full transition-none" style={{ width: `${p * 100}%` }} />
                            </div>
                            <span className="text-zinc-300 font-mono w-10 text-right" style={{ fontSize: '10px' }}>
                                {(p * 100).toFixed(0)}%
                            </span>
                        </div>
                    );
                })}
            </div>
            <Slider label="total scroll progress" value={progress} min={0} max={1} step={0.005} onChange={setProgress} />
            <div className="bg-zinc-950/60 rounded-lg p-3 font-mono" style={{ fontSize: '11px' }}>
                <div className="text-zinc-500 mb-1">formula for each segment:</div>
                <div className="text-emerald-300">p = clamp( (progress − i/n) × n, 0, 1 )</div>
            </div>
        </div>
    );
}

function ProgressBarSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={8} />
                    <h2 className="text-2xl font-black tracking-tight">Segmented Progress Bar</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The bottom bar has one segment per image. Each segment fills independently as scroll passes its window. The formula remaps the global progress (0–1) into a per-segment 0–1 range —
                    no GSAP animations needed, just direct <Pill>style.width</Pill> writes in <Pill>onUpdate</Pill>.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <ProgressBarViz />
                    </div>
                    <CodeBlock lang="tsx" highlight={['onUpdate', 'self.progress', 'p * 100']}>
                        {`ScrollTrigger.create({
  trigger: stageRef.current,
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0.3,  // tight lag for responsive feel
  onUpdate: (self) => {
    const progress = self.progress; // 0 → 1
    const n = fills.length;         // = 3

    fills.forEach((fill, i) => {
      // shift and scale per-segment window
      // segment 0: [0,   0.33]
      // segment 1: [0.33, 0.67]
      // segment 2: [0.67, 1.0]
      let p = (progress - i / n) * n;
      p = Math.max(0, Math.min(1, p));

      // directly write width — no GSAP needed
      fill.style.width = \`\${p * 100}%\`;
    });
  },
});`}
                    </CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 10. Lenis + ScrollTrigger ────────────────────────────────────────────────

function LenisSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={9} />
                    <h2 className="text-2xl font-black tracking-tight">Lenis + ScrollTrigger Sync</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Lenis provides smooth, lerped scrolling. But GSAP ScrollTrigger reads native <Pill>window.scrollY</Pill>. Without explicit sync, the two can desync — ScrollTrigger fires at a
                    different position than what Lenis is displaying. The fix: drive Lenis via GSAP&apos;s ticker so both run in the same frame.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <CodeBlock lang="tsx" highlight={['gsap.ticker.add', 'lenis.raf', 'autoRaf: false']}>
                            {`// React component — Lenis driven by GSAP ticker
const LenisScroller = ({ children }) => {
  const lenisRef = useRef(null);

  useLayoutEffect(() => {
    // Drive Lenis from GSAP's RAF loop
    // → both animate in the same frame
    function update(time) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,  // ← hand control to GSAP
        lerp: 0.15,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  );
};`}
                        </CodeBlock>
                        <Callout variant="amber">
                            <strong className="text-amber-300">autoRaf: false is mandatory.</strong> If Lenis runs its own RAF loop <em>and</em> GSAP runs another, you get double-updates and jerky
                            scroll. <Pill>autoRaf: false</Pill> lets GSAP own the frame loop entirely.
                        </Callout>
                    </div>
                    <div className="space-y-4">
                        <CodeBlock lang="tsx" highlight={['lerp', 'ScrollTrigger.update']}>
                            {`// Alternative: also call ScrollTrigger.update
// on every Lenis scroll event for guaranteed sync

useLayoutEffect(() => {
  const lenis = lenisRef.current?.lenis;
  if (!lenis) return;

  // Option A: let GSAP ticker handle it
  gsap.ticker.add((time) => lenis.raf(time * 1000));

  // Option B: also hook scroll event (belt + braces)
  lenis.on('scroll', ScrollTrigger.update);

  return () => {
    lenis.off('scroll', ScrollTrigger.update);
  };
}, []);

// lerp: 0.15 = 15% of remaining distance per frame
// Lower = smoother but more lag
// Higher = less lag but snappier`}
                        </CodeBlock>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3" style={{ fontSize: '14px' }}>
                            <p className="text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                                FRAME ORDER MATTERS
                            </p>
                            {[
                                { step: '1. GSAP ticker fires', detail: 'requestAnimationFrame callback runs' },
                                { step: '2. lenis.raf(time)', detail: 'Lenis updates virtual scroll position' },
                                { step: '3. ScrollTrigger reads', detail: 'Picks up the new scrollY from Lenis' },
                                { step: '4. Animations update', detail: 'scrubbed timeline moves to new progress' },
                            ].map(({ step, detail }) => (
                                <div key={step} className="flex gap-3 items-start">
                                    <span className="text-emerald-400 font-mono shrink-0" style={{ fontSize: '11px' }}>
                                        {step}
                                    </span>
                                    <span className="text-zinc-400">{detail}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 11. useGSAP in React ─────────────────────────────────────────────────────

function UseGSAPSection() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={10} />
                    <h2 className="text-2xl font-black tracking-tight">useGSAP — The React Pattern</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    <Pill>useGSAP</Pill> from <Pill>@gsap/react</Pill> is the idiomatic way to run GSAP in React. It behaves like <Pill>useEffect</Pill> but automatically kills all GSAP instances
                    (tweens, timelines, ScrollTriggers) created inside when the component unmounts — no manual cleanup.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CodeBlock lang="tsx" highlight={['useGSAP', 'return () =>', 'window.addEventListener', 'stageRef.current']}>
                        {`import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register once at module level (not inside component)
gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Scene() {
  const stageRef = useRef(null);
  const groupRefs = useRef([null, null, null]);

  useGSAP(() => {
    // All GSAP code goes here
    // ↑ auto-killed on unmount

    updateLayout();
    initProgressBar();

    // Non-GSAP cleanup returned manually
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(updateLayout, 250);
    };
    window.addEventListener('resize', onResize);

    return () => {
      // Only non-GSAP cleanup needed here
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
    };
  }); // no deps = runs once after mount

  return <section ref={stageRef}>...</section>;
}`}
                    </CodeBlock>

                    <div className="space-y-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4" style={{ fontSize: '14px' }}>
                            <p className="text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                                useGSAP vs useEffect
                            </p>
                            {[
                                {
                                    feature: 'GSAP cleanup',
                                    gsap: '✓ automatic (kills tweens, STs)',
                                    effect: '✗ manual gsap.killTweensOf() needed',
                                    good: true,
                                },
                                {
                                    feature: 'ScrollTrigger cleanup',
                                    gsap: '✓ kills all created inside',
                                    effect: '✗ must store refs and call .kill()',
                                    good: true,
                                },
                                {
                                    feature: 'Scope',
                                    gsap: '✓ { scope: ref } targets by class',
                                    effect: '✗ no scope, global selectors only',
                                    good: true,
                                },
                                {
                                    feature: 'Non-GSAP cleanup',
                                    gsap: '✓ return fn as usual',
                                    effect: '✓ return fn as usual',
                                    good: false,
                                },
                            ].map(({ feature, gsap: g, effect, good }) => (
                                <div key={feature} className="grid grid-cols-[100px_1fr_1fr] gap-2 items-start">
                                    <span className="text-zinc-500 font-mono" style={{ fontSize: '10px' }}>
                                        {feature}
                                    </span>
                                    <span className={good ? 'text-emerald-400' : 'text-zinc-300'} style={{ fontSize: '11px' }}>
                                        {g}
                                    </span>
                                    <span className={good ? 'text-red-400/70' : 'text-zinc-300'} style={{ fontSize: '11px' }}>
                                        {effect}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Callout>
                            <strong className="text-emerald-300">No deps array = run once.</strong> Passing no second argument to <Pill>useGSAP</Pill> is like passing <Pill>[]</Pill> to{' '}
                            <Pill>useEffect</Pill> — it runs after first mount. The resize handler inside keeps it responsive without re-running the hook.
                        </Callout>

                        <Callout variant="amber">
                            <strong className="text-amber-300">Refs, not class selectors.</strong> Don&apos;t use <Pill>gsap.utils.toArray(&apos;.txt&apos;)</Pill> in React — it queries the DOM
                            globally and can pick up elements from other components. Use <Pill>textRefs.current</Pill> arrays instead for surgical targeting.
                        </Callout>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 12. Checklist ────────────────────────────────────────────────────────────

function ChecklistSection() {
    const items = [
        { text: 'Set stage height to 500vh (or N × 100vh), layers to sticky + 100vh', cat: 'architecture' },
        { text: 'Use maskUnits="userSpaceOnUse" so coordinates match the viewBox', cat: 'svg' },
        { text: 'Compute vbHeight = (windowH / windowW) × 100 — recalculate on resize', cat: 'svg' },
        { text: 'Use document.createElementNS(NS, "rect") — never createElement for SVG', cat: 'svg' },
        { text: 'Wipe group.innerHTML = "" before re-generating on resize', cat: 'perf' },
        { text: 'Use two rects per blind (top + bottom from center) for a natural open', cat: 'animation' },
        { text: 'Use +0.01 on height to close sub-pixel gaps between adjacent blinds', cat: 'animation' },
        { text: 'Use gsap.utils.shuffle([...cells]) — spread first to avoid mutating original', cat: 'animation' },
        { text: 'Set scrub: 2.5 for smooth tracking; lower for snappier response', cat: 'scrolltrigger' },
        { text: 'Set invalidateOnRefresh: true so scroll positions recalculate on resize', cat: 'scrolltrigger' },
        { text: 'Set initial clip-path in CSS (not GSAP) to prevent flash before hydration', cat: 'animation' },
        { text: 'Drive Lenis via gsap.ticker with autoRaf: false — never two RAF loops', cat: 'lenis' },
        { text: 'Register ScrollTrigger at module level — once per module, not per render', cat: 'react' },
        { text: 'Use useGSAP for GSAP code — auto-cleanup on unmount', cat: 'react' },
        { text: 'Use ref arrays (svgRefs, textRefs) not .querySelector or .toArray(".class")', cat: 'react' },
    ];

    const catColors: Record<string, string> = {
        architecture: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        svg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        perf: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        animation: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        scrolltrigger: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        lenis: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        react: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    };

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <h2 className="text-2xl font-black tracking-tight mb-8">Production Checklist</h2>
                <div className="space-y-2.5 max-w-3xl">
                    {items.map(({ text, cat }, i) => (
                        <motion.div
                            key={i}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.04, duration: 0.35, ease: E_OUT }}
                        >
                            <span
                                className="mt-0.5 shrink-0 size-5 rounded-full flex items-center justify-center bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                                style={{ fontSize: '10px' }}
                            >
                                ✓
                            </span>
                            <div className="flex items-start gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded border font-mono shrink-0 ${catColors[cat]}`} style={{ fontSize: '9px' }}>
                                    {cat}
                                </span>
                                <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '14px' }}>
                                    {text}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </FadeIn>

            <FadeIn delay={0.4}>
                <div className="mt-12 flex flex-wrap gap-4">
                    {([1, 2, 3, 4] as const).map((n) => (
                        <Link
                            key={n}
                            href={`/scroll/${n}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-300 font-mono transition-colors"
                            style={{ fontSize: '13px' }}
                        >
                            /scroll/{n} →
                        </Link>
                    ))}
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScrollLearnPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1100px] mx-auto">
                <HeroSection />
                <ArchitectureSection />
                <Rule />
                <MaskSection />
                <Rule />
                <DynamicRectsSection />
                <Rule />
                <BlindSection />
                <Rule />
                <GridSection />
                <Rule />
                <ScrollTriggerSection />
                <Rule />
                <TextRevealSection />
                <Rule />
                <ProgressBarSection />
                <Rule />
                <LenisSection />
                <Rule />
                <UseGSAPSection />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '13px' }}>
                SVG Mask Scroll Transitions · Breakdown · GSAP + Lenis + React
            </footer>
        </main>
    );
}
