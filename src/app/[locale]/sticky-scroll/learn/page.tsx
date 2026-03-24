'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn } from '@/components/fade-in';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// ─── Primitives ───────────────────────────────────────────────────────────────

function Step({ n }: { n: number }) {
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

function Rule() {
    return <div className="my-20 h-px bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent" />;
}

function Note({ children, variant = 'violet' }: { children: React.ReactNode; variant?: 'violet' | 'amber' | 'sky' | 'rose' | 'emerald' }) {
    const c = {
        violet: 'bg-violet-500/5  border-violet-500/20  text-violet-200/90',
        amber: 'bg-amber-500/5   border-amber-500/20   text-amber-200/90',
        sky: 'bg-sky-500/5     border-sky-500/20     text-sky-200/90',
        rose: 'bg-rose-500/5    border-rose-500/20    text-rose-200/90',
        emerald: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90',
    };
    return (
        <div className={`rounded-xl border px-5 py-4 leading-relaxed ${c[variant]}`} style={{ fontSize: '14px' }}>
            {children}
        </div>
    );
}

function Replay({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-zinc-500 hover:text-violet-300 border border-zinc-700/60 hover:border-violet-500/40 font-mono rounded-lg px-3 py-1.5 transition-colors"
            style={{ fontSize: '11px' }}
        >
            ↺ replay
        </button>
    );
}

function DemoShell({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <span className="font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                    {label}
                </span>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────

function Hero() {
    const ref = useRef<HTMLElement>(null);
    useGSAP(
        () => {
            gsap.from('.sgl-ch', { y: 80, opacity: 0, duration: 0.75, ease: 'power3.out', stagger: 0.022 });
            gsap.from('.sgl-sub', { y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 });
            gsap.from('.sgl-tag', { y: 8, opacity: 0, duration: 0.4, ease: 'power2.out', stagger: 0.07, delay: 0.85 });
        },
        { scope: ref },
    );

    const words = ['Sticky', 'Grid', 'Scroll'];
    const tags = ['position: sticky', 'GSAP ScrollTrigger', 'scrub', 'Lenis sync', 'CSS Grid', 'yPercent'];

    return (
        <section ref={ref} className="relative px-6 md:px-12 xl:px-24 pt-32 pb-20 overflow-hidden">
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[320px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
            />

            <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((t) => (
                    <span key={t} className="sgl-tag px-3 py-1 rounded-full border border-violet-500/25 text-violet-400 font-mono" style={{ fontSize: '11px' }}>
                        {t}
                    </span>
                ))}
            </div>

            <h1 className="font-black leading-[0.9] tracking-tight mb-8" style={{ fontSize: 'clamp(44px, 7.5vw, 96px)' }}>
                {words.map((w, wi) => (
                    <div key={wi} className="overflow-hidden">
                        {w.split('').map((ch, ci) => (
                            <span key={ci} className="sgl-ch inline-block" style={{ color: wi === 1 ? '#a78bfa' : '#fff' }}>
                                {ch}
                            </span>
                        ))}
                    </div>
                ))}
            </h1>

            <p className="sgl-sub text-zinc-400 max-w-2xl leading-relaxed mb-10" style={{ fontSize: '18px' }}>
                A complete, step-by-step breakdown of a scroll-driven sticky image grid — how the layout works, how GSAP timelines are composed, how columns stagger and zoom, and how to sync Lenis so
                every frame is pixel-perfect.
            </p>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 1 }}
                style={{ transformOrigin: 'left' }}
                className="h-px bg-gradient-to-r from-violet-500/40 via-violet-500/10 to-transparent"
            />

            <div className="mt-8 flex flex-wrap gap-6" style={{ fontSize: '14px' }}>
                <Link href="/sticky-scroll" className="text-zinc-400 hover:text-violet-400 transition-colors font-mono">
                    ← live demo
                </Link>
                <a href="https://tympanus.net/codrops/?p=106424" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-violet-400 transition-colors font-mono">
                    original tutorial →
                </a>
            </div>
        </section>
    );
}

// ─── 2. The Sticky Architecture ───────────────────────────────────────────────

function StickyArchDiagram() {
    return (
        <div className="relative w-full rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden select-none" style={{ height: 260 }}>
            {/* scroll track */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-zinc-700/50" />
            <div className="absolute left-[14px] top-8 font-mono text-zinc-600" style={{ fontSize: '9px', writingMode: 'vertical-rl' }}>
                scroll
            </div>

            {/* 425vh column */}
            <div className="absolute rounded border border-zinc-700/50 overflow-hidden" style={{ left: 60, top: 20, bottom: 20, width: 72 }}>
                {[
                    ['intro', '100vh', true],
                    ['anim', '100vh', false],
                    ['anim', '100vh', false],
                    ['outro', '100vh', false],
                    ['end', '25vh', false],
                ].map(([_label, h, hi], i) => (
                    <div
                        key={i}
                        className={`flex flex-col items-center justify-center border-b border-zinc-800 ${hi ? 'bg-zinc-800/40' : ''}`}
                        style={{ height: `${Number(String(h).replace('vh', '')) / 4.25}%` }}
                    >
                        <span className="font-mono text-zinc-600" style={{ fontSize: '8px' }}>
                            {h as string}
                        </span>
                    </div>
                ))}
            </div>
            <div className="absolute font-mono text-zinc-500" style={{ left: 62, top: 8, fontSize: '9px' }}>
                .block--main
            </div>
            <div className="absolute font-mono text-violet-500/70" style={{ left: 64, bottom: 6, fontSize: '9px' }}>
                425vh total
            </div>

            {/* sticky box */}
            <div
                className="absolute rounded border border-violet-500/40 bg-violet-500/8 flex flex-col items-center justify-center"
                style={{ left: 160, top: '50%', transform: 'translateY(-50%)', width: 110, height: 88 }}
            >
                <div className="text-violet-300 font-mono font-bold" style={{ fontSize: '10px' }}>
                    .block__wrapper
                </div>
                <div className="text-violet-400/60 font-mono mt-1" style={{ fontSize: '9px' }}>
                    position: sticky
                </div>
                <div className="text-violet-400/60 font-mono" style={{ fontSize: '9px' }}>
                    top: 0 / 100vh
                </div>
            </div>

            {/* content + gallery labels */}
            <div
                className="absolute rounded border border-zinc-700/40 bg-zinc-900/50 flex flex-col items-center justify-center"
                style={{ left: 288, top: '50%', transform: 'translateY(-64px)', width: 88, height: 52 }}
            >
                <div className="text-zinc-400 font-mono font-bold" style={{ fontSize: '9px' }}>
                    .content
                </div>
                <div className="text-zinc-600 font-mono" style={{ fontSize: '8px' }}>
                    z-index: 1
                </div>
            </div>
            <div
                className="absolute rounded border border-dashed border-zinc-700/40 flex flex-col items-center justify-center"
                style={{ left: 288, top: '50%', transform: 'translateY(16px)', width: 88, height: 52 }}
            >
                <div className="text-zinc-400 font-mono font-bold" style={{ fontSize: '9px' }}>
                    .gallery
                </div>
                <div className="text-zinc-600 font-mono" style={{ fontSize: '8px' }}>
                    position: absolute
                </div>
            </div>

            {/* animated scroll dot */}
            <motion.div
                className="absolute left-[26px] size-3 rounded-full bg-violet-400"
                animate={{ top: ['32px', 'calc(100% - 44px)', '32px'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
            />
        </div>
    );
}

function SectionSticky() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={1} />
                    <h2 className="text-2xl font-black tracking-tight">The Sticky Layout Architecture</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The entire effect is driven by a single CSS pattern: a tall outer container (<Pill>height: 425vh</Pill>) that stores the scroll budget, paired with a sticky inner wrapper (
                    <Pill>position: sticky; top: 0; height: 100vh</Pill>) that stays pinned to the viewport. As the parent scrolls, GSAP converts that progress into animation.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <StickyArchDiagram />
            </FadeIn>

            <FadeIn delay={0.15}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CodeBlock lang="css">{`/* ① Outer container: all 425vh is scroll distance */
.block--main {
  height: 425vh;
}

/* ② Sticky wrapper pins to viewport top */
.block__wrapper {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;   /* clips gallery items */
  will-change: transform;
}

/* ③ Content + gallery overlap in the same space */
.content {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1;         /* sits above gallery */
}

.gallery {
  position: absolute; /* doesn't push wrapper taller */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}`}</CodeBlock>
                    <div className="space-y-3">
                        <Note>
                            <strong className="text-violet-300">Why 425vh?</strong> — The reveal animation needs ~150vh, the zoom ~150vh, plus entry and exit breathing room. Shrink this to speed up
                            the effect, expand it to make it more gradual.
                        </Note>
                        <Note variant="amber">
                            <strong className="text-amber-300">Critical:</strong> never set <Pill>overflow: hidden</Pill> on any <em>ancestor</em> of the sticky wrapper.{' '}
                            <Pill>overflow ≠ visible</Pill> turns an element into a scroll container — sticky then tries to pin inside that element (which doesn&apos;t scroll), and the effect
                            completely breaks.
                        </Note>
                        <Note variant="sky">
                            <strong className="text-sky-300">overflow: hidden on the wrapper itself</strong> is intentional. It clips gallery items that start outside the viewport, so they slide in
                            cleanly from above/below the visible area.
                        </Note>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 3. Fluid Units ───────────────────────────────────────────────────────────

function FluidUnitsDemo() {
    const [vw, setVw] = useState(1440);
    const s = vw / 1440;

    return (
        <DemoShell label="FLUID UNIT CALCULATOR">
            <div className="space-y-5">
                <div>
                    <div className="flex justify-between mb-1.5">
                        <span className="font-mono text-zinc-400" style={{ fontSize: '11px' }}>
                            viewport width
                        </span>
                        <span className="font-mono text-violet-300 font-bold tabular-nums" style={{ fontSize: '11px' }}>
                            {vw}px
                        </span>
                    </div>
                    <input
                        type="range"
                        min={320}
                        max={2560}
                        value={vw}
                        onChange={(e) => setVw(Number(e.target.value))}
                        className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer"
                    />
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {[
                        ['--s      =', s.toFixed(4)],
                        ['--s × 16 =', Math.round(s * 16) + 'px  (body text)'],
                        ['--s × 104 =', Math.round(s * 104) + 'px  (title)'],
                        ['--s × 736 =', Math.round(s * 736) + 'px  (gallery)'],
                        ['--s × 32 =', Math.round(s * 32) + 'px  (col gap)'],
                        ['--s × 24 =', Math.round(s * 24) + 'px  (padding)'],
                    ].map(([label, val]) => (
                        <div key={label} className="flex justify-between gap-4 border-b border-zinc-800 pb-1.5">
                            <span className="font-mono text-zinc-500" style={{ fontSize: '11px' }}>
                                {label}
                            </span>
                            <span className="font-mono text-violet-300 font-bold tabular-nums" style={{ fontSize: '11px' }}>
                                {val}
                            </span>
                        </div>
                    ))}
                </div>

                {/* mini gallery preview */}
                <div className="mt-2">
                    <div className="h-3 rounded-sm bg-violet-500/30 border border-violet-500/20 transition-all duration-75" style={{ width: `${Math.min(100, (s * 736) / 12)}%` }} />
                    <p className="mt-1 font-mono text-zinc-600" style={{ fontSize: '9px' }}>
                        gallery width at this viewport ({Math.round(s * 736)}px / 1200px container)
                    </p>
                </div>
            </div>
        </DemoShell>
    );
}

function SectionFluidUnits() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={2} />
                    <h2 className="text-2xl font-black tracking-tight">Fluid Units — Scaling Without Breakpoints</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Setting <Pill>font-size: calc(100vw / 1440)</Pill> on the root makes <Pill>1rem = 1px</Pill> at 1440px viewport. Every measurement written in <Pill>rem</Pill> then scales linearly
                    with the viewport — no media queries needed. In a CSS Module, use a custom property so the scope stays local.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <CodeBlock lang="css">{`/* ─── Vanilla HTML/CSS ─── */
html {
  font-size: calc(100vw / 1440);
  /* now 1rem = 1px at 1440px */
}

.content__title { font-size: 104rem; } /* 104px */
.gallery        { width: 736rem; }     /* 736px */
.gallery__grid  { column-gap: 32rem; } /* 32px  */


/* ─── CSS Module (scoped) ─── */
.root {
  --s: calc(100vw / 1440);
}

.contentTitle {
  font-size: calc(var(--s) * 104);
}
.gallery {
  width: calc(var(--s) * 736);
}
.galleryGrid {
  column-gap: calc(var(--s) * 32);
}`}</CodeBlock>
                    <FluidUnitsDemo />
                </div>
            </FadeIn>

            <FadeIn delay={0.15}>
                <Note variant="amber">
                    <strong className="text-amber-300">Never set overflow on the root.</strong> If you add <Pill>overflow-x: hidden</Pill> to scope the fluid layout, Chrome and Firefox treat that
                    element as a scroll container — the sticky wrapper inside will stop working. Use <Pill>overflow: clip</Pill> if you must contain horizontal overflow; it clips without creating a
                    scroll container.
                </Note>
            </FadeIn>
        </section>
    );
}

// ─── 4. Parallax Entry ────────────────────────────────────────────────────────

function ParallaxDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const [scrollPct, setScrollPct] = useState(0);

    // simulate scroll progress with a slider
    const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const pct = Number(e.target.value);
        setScrollPct(pct);
        // simulate: natural scroll offsets the box down; transform offsets it up
        // at pct=0:   box at -100% (transform cancels natural position)
        // at pct=100: box at 0%
        if (boxRef.current) {
            const yPercent = -100 + pct;
            gsap.set(boxRef.current, { yPercent });
        }
    }, []);

    return (
        <DemoShell
            label="PARALLAX ENTRY — drag slider to simulate scroll"
            action={
                <Replay
                    onClick={() => {
                        setScrollPct(0);
                        if (boxRef.current) gsap.set(boxRef.current, { yPercent: -100 });
                    }}
                />
            }
        >
            <div ref={ref} className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900" style={{ height: 160 }}>
                    {/* viewport frame */}
                    <div className="absolute inset-2 rounded border border-dashed border-zinc-700/50 pointer-events-none z-10">
                        <span className="absolute top-1 left-2 font-mono text-zinc-600" style={{ fontSize: '9px' }}>
                            viewport
                        </span>
                    </div>

                    {/* hero image (section 1) — scrolls normally */}
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/60">
                        <span className="font-mono text-zinc-600 font-bold" style={{ fontSize: '11px' }}>
                            section 1 (hero)
                        </span>
                    </div>

                    {/* wrapper — slides in from above */}
                    <div
                        ref={boxRef}
                        className="absolute inset-0 bg-violet-500/10 border-t-2 border-violet-500/40 flex flex-col items-center justify-center"
                        style={{ transform: 'translateY(-100%)' }}
                    >
                        <span className="font-mono text-violet-300 font-bold" style={{ fontSize: '11px' }}>
                            .block__wrapper
                        </span>
                        <span className="font-mono text-violet-400/60 mt-1" style={{ fontSize: '9px' }}>
                            yPercent: {(-100 + scrollPct).toFixed(0)}
                        </span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between mb-1">
                        <span className="font-mono text-zinc-500" style={{ fontSize: '11px' }}>
                            scroll progress (top bottom → top top)
                        </span>
                        <span className="font-mono text-violet-300 font-bold" style={{ fontSize: '11px' }}>
                            {scrollPct.toFixed(0)}%
                        </span>
                    </div>
                    <input type="range" min={0} max={100} value={scrollPct} onChange={handleSlider} className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer" />
                </div>

                <p className="font-mono text-zinc-600" style={{ fontSize: '10px' }}>
                    At 0%: wrapper is 100vh above viewport (covered by hero). At 100%: sticky kicks in naturally at top:0.
                </p>
            </div>
        </DemoShell>
    );
}

function SectionParallax() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={3} />
                    <h2 className="text-2xl font-black tracking-tight">Parallax Entry — Sliding in From Above</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Before the main grid animations start, the sticky wrapper slides in from above as the hero image reveals it. A <Pill>gsap.from</Pill> with <Pill>yPercent: -100</Pill> and{' '}
                    <Pill>scrub: true</Pill> drives the wrapper from 100vh above its natural position to its resting place — perfectly timed to the hero scrolling out.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <ParallaxDemo />
                    <CodeBlock lang="javascript">{`// Parallax entry: as the block scrolls into view
// from the bottom, the wrapper slides in from above.
gsap.from(wrapper, {
  yPercent: -100,
  ease: "none",

  // IMPORTANT: don't snap to yPercent:-100 on init.
  // Let the scrub position it correctly from the start.
  immediateRender: false,

  scrollTrigger: {
    trigger: block,
    start: "top bottom", // block top hits viewport bottom
    end:   "top top",    // block top hits viewport top
    scrub: true,
  },
})

// Meanwhile, section 1 (the hero image) has z-index:1
// so it sits on top of the wrapper, masking it.
// As you scroll, the hero image naturally moves up and
// reveals the wrapper content behind it.`}</CodeBlock>
                </div>
            </FadeIn>

            <FadeIn delay={0.15}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Note>
                        <strong className="text-violet-300">Why it appears stationary:</strong> The wrapper&apos;s natural scroll motion (moving up as you scroll) is exactly cancelled by the transform
                        (also moving up). The net position stays at viewport top — giving the impression of a fixed background being uncovered.
                    </Note>
                    <Note variant="amber">
                        <strong className="text-amber-300">
                            <Pill>immediateRender: false</Pill>
                        </strong>{' '}
                        prevents GSAP from snapping to <Pill>yPercent: -100</Pill> when the tween is created. Without it, if the user loads mid-scroll, the wrapper flashes above the viewport for one
                        frame before the scrub corrects it.
                    </Note>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 5. ScrollTrigger Scrub ───────────────────────────────────────────────────

function ScrubDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const [scrub, setScrub] = useState(true);
    const [key, setKey] = useState(0);

    useGSAP(
        () => {
            const box = ref.current?.querySelector<HTMLElement>('.scrub-box');
            const track = ref.current?.querySelector<HTMLElement>('.scrub-track');
            if (!box || !track) return;
            gsap.fromTo(
                box,
                { x: 0, scale: 1, opacity: 0.4 },
                {
                    x: () => track.offsetWidth - box.offsetWidth,
                    scale: 1.3,
                    opacity: 1,
                    ease: 'power2.inOut',
                    scrollTrigger: {
                        trigger: ref.current,
                        start: 'top 75%',
                        end: 'bottom 25%',
                        scrub: scrub ? true : false,
                        toggleActions: scrub ? undefined : 'play none none reverse',
                    },
                },
            );
        },
        { scope: ref, dependencies: [scrub, key] },
    );

    return (
        <DemoShell
            label="SCRUB DEMO — scroll through this section"
            action={
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScrub((v) => !v)}
                        className={`font-mono rounded px-2.5 py-1 border transition-colors text-[10px] ${scrub ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                    >
                        scrub: {scrub ? 'true' : 'false'}
                    </button>
                    <Replay onClick={() => setKey((k) => k + 1)} />
                </div>
            }
        >
            <div ref={ref} className="space-y-4">
                <div className="scrub-track relative h-14">
                    {/* track line */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-zinc-800" />
                    {/* animated box — starts at left:0 */}
                    <div className="scrub-box absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                        <div className="w-5 h-5 rounded bg-violet-400" />
                    </div>
                    {/* ghost target at right edge */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center">
                        <div className="w-5 h-5 rounded bg-zinc-700/60" />
                    </div>
                </div>
                <p className="font-mono text-zinc-600" style={{ fontSize: '10px' }}>
                    {scrub ? '↕ animation progress is tied to scroll position — move back and it reverses' : '▶ animation plays on enter, reverses on leave-back — scroll position only triggers it'}
                </p>
            </div>
        </DemoShell>
    );
}

function SectionScrub() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={4} />
                    <h2 className="text-2xl font-black tracking-tight">ScrollTrigger Scrub — Scroll as a Timeline Scrubber</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    <Pill>scrub: true</Pill> is what transforms a time-based GSAP animation into a scroll-driven one. Instead of playing at clock speed, the animation&apos;s progress is mapped
                    directly to scroll position. Scroll forward — it advances. Scroll back — it reverses. The whole grid reveal, zoom, and content toggle runs from a single scrubbed master timeline.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <ScrubDemo />
            </FadeIn>

            <FadeIn delay={0.15}>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CodeBlock lang="javascript">{`// The master timeline — everything inside is scrubbed
const mainTl = gsap.timeline({
  scrollTrigger: {
    trigger: block,     // .block--main (425vh tall)
    start: "top 25%",   // start when block.top = 25vh
    end: "bottom bottom", // end at full scroll
    scrub: true,        // tie progress to scroll
  },
})

// Compose sub-timelines on top of it
mainTl
  .add(gridRevealTl())
  .add(gridZoomTl(),  "-=0.6") // overlap by 0.6 units
  .add(toggleFn,      "-=0.32")

// start: "top 25%" means the trigger fires when
// block.top is 25% DOWN from viewport top = 0.25vh.
// scroll offset = blockOffsetTop - 0.25*vh`}</CodeBlock>

                    <div className="space-y-3">
                        <Note>
                            <strong className="text-violet-300">
                                Sub-timeline overlap with <Pill>{`"-=0.6"`}</Pill>
                            </strong>{' '}
                            — GSAP uses a relative position token. <Pill>&quot;-=0.6&quot;</Pill> means &quot;start 0.6 timeline units before the previous animation ends.&quot; This blends the reveal
                            into the zoom, so there&apos;s no hard cut between phases.
                        </Note>
                        <Note variant="sky">
                            <strong className="text-sky-300">
                                <Pill>scrub: true</Pill> vs. <Pill>scrub: 0.5</Pill>
                            </strong>{' '}
                            — a number adds a lag (in seconds) between scroll and animation. Great for smoothing scrubbed motion. <Pill>true</Pill> = instant tracking, which combined with Lenis&apos;s
                            lerp already gives smooth output.
                        </Note>
                        <Note variant="amber">
                            <strong className="text-amber-300">Callback inside scrubbed timeline</strong> — <Pill>.add(fn)</Pill> fires the function each time the playhead crosses that position. Check{' '}
                            <Pill>scrollTrigger.direction</Pill> inside to know which way the scroll is going.
                        </Note>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 6. Grid Reveal ───────────────────────────────────────────────────────────

function GridRevealDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const [key, setKey] = useState(0);
    const [stagger, setStagger] = useState(0.06);
    const [ease, setEase] = useState('power1.inOut');

    useGSAP(
        () => {
            const grid = ref.current;
            if (!grid) return;
            const cols = [0, 1, 2].map((ci) => Array.from(grid.querySelectorAll<HTMLElement>(`.rc-${ci}`)));
            const tl = gsap.timeline({ defaults: { ease } });
            const wh = 220; // demo height
            const gridH = grid.querySelector('.rc-grid')?.getBoundingClientRect().height ?? 160;
            const dy = wh - (wh - gridH) / 2;

            cols.forEach((col, ci) => {
                const fromTop = ci % 2 === 0;
                tl.from(
                    col,
                    {
                        y: dy * (fromTop ? -1 : 1),
                        opacity: 0,
                        stagger: { each: stagger, from: fromTop ? 'end' : 'start' },
                        duration: 0.7,
                    },
                    'reveal',
                );
            });
        },
        { scope: ref, dependencies: [key, stagger, ease] },
    );

    return (
        <DemoShell label="GRID REVEAL DEMO" action={<Replay onClick={() => setKey((k) => k + 1)} />}>
            <div ref={ref} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                                stagger
                            </span>
                            <span className="font-mono text-violet-300 font-bold" style={{ fontSize: '10px' }}>
                                {stagger.toFixed(2)}s
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={0.2}
                            step={0.01}
                            value={stagger}
                            onChange={(e) => setStagger(Number(e.target.value))}
                            className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                                ease
                            </span>
                        </div>
                        <select
                            value={ease}
                            onChange={(e) => setEase(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded px-2 py-1 font-mono"
                            style={{ fontSize: '10px' }}
                        >
                            {['power1.inOut', 'power2.inOut', 'power3.inOut', 'back.out(1.5)', 'elastic.out(1,0.4)'].map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rc-grid grid grid-cols-3 gap-2 overflow-hidden rounded-lg" style={{ height: 160 }}>
                    {[0, 1, 2].map((ci) => (
                        <div key={ci} className="flex flex-col gap-2">
                            {[0, 1, 2, 3].map((ri) => (
                                <div
                                    key={ri}
                                    className={`rc-${ci} flex-1 rounded`}
                                    style={{
                                        background: `hsl(${260 + ci * 15 + ri * 5}, 50%, ${18 + ri * 4}%)`,
                                        border: `1px solid hsl(${260 + ci * 15}, 50%, 35%)`,
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 text-center gap-1">
                    {['↓ from top (stagger: end)', '↑ from bottom (stagger: start)', '↓ from top (stagger: end)'].map((l, i) => (
                        <span key={i} className="font-mono text-zinc-600" style={{ fontSize: '9px' }}>
                            {l}
                        </span>
                    ))}
                </div>
            </div>
        </DemoShell>
    );
}

function SectionGridReveal() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={5} />
                    <h2 className="text-2xl font-black tracking-tight">Grid Reveal — Alternating Column Entry</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The 12 images are distributed into 3 columns. Even columns (0, 2) enter from above; odd columns (1) enter from below. Within each column, a stagger of 60ms between items creates a
                    cascading wave. All three columns start simultaneously using a shared GSAP label.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <GridRevealDemo />
                    <CodeBlock lang="javascript">{`function gridRevealTimeline(columns) {
  const tl = gsap.timeline()

  // How far off-screen to start:
  // Enough to clear the viewport from above or below.
  const wh = window.innerHeight
  const dy = wh - (wh - grid.offsetHeight) / 2
  // If gridHeight > wh, dy > wh.
  // Items start exactly 1 grid-height away.

  columns.forEach((column, colIndex) => {
    const fromTop = colIndex % 2 === 0

    tl.from(column, {
      y: dy * (fromTop ? -1 : 1),
      stagger: {
        each: 0.06,
        // "end" → last item moves first (fills top→down)
        // "start" → first item moves first (fills top→down)
        from: fromTop ? "end" : "start",
      },
      ease: "power1.inOut",
    }, "grid-reveal") // ← same label = all start together
  })

  return tl
}

// Group items by their visual column (modulo 3):
// columns[0] = items 0,3,6,9  (left col)
// columns[1] = items 1,4,7,10 (center col)
// columns[2] = items 2,5,8,11 (right col)
const columns = [[], [], []]
items.forEach((item, i) => columns[i % 3].push(item))`}</CodeBlock>
                </div>
            </FadeIn>

            <FadeIn delay={0.15}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Note>
                        <strong className="text-violet-300">
                            The <Pill>&quot;grid-reveal&quot;</Pill> label
                        </strong>{' '}
                        — adding all three column animations at the same label makes them start simultaneously. Without a label they would play sequentially (one after another), making the animation
                        much slower.
                    </Note>
                    <Note variant="sky">
                        <strong className="text-sky-300">Stagger direction reversal</strong> — for a top-entering column, <Pill>from: &quot;end&quot;</Pill> means the
                        <em> bottom-most item moves first</em>, so the column fills downward into view. For bottom-entering, <Pill>from: &quot;start&quot;</Pill>
                        means the top-most item moves first, filling downward.
                    </Note>
                    <Note variant="amber">
                        <strong className="text-amber-300">dy formula</strong> — <Pill>wh - (wh - gridH) / 2</Pill> places items exactly one full grid height outside the viewport. Even when the grid
                        is taller than the viewport (which it is: ~1016px vs ~900px), items start fully invisible.
                    </Note>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 7. Grid Zoom ─────────────────────────────────────────────────────────────

function GridZoomDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [key, setKey] = useState(0);
    const [scale, setScale] = useState(2.05);
    const [xPct, setXPct] = useState(40);

    useGSAP(
        () => {
            if (!gridRef.current) return;
            const left = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.gz-col-0 .gz-item'));
            const center = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.gz-col-1 .gz-item'));
            const right = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.gz-col-2 .gz-item'));

            const tl = gsap.timeline({ defaults: { duration: 1.2, ease: 'power3.inOut' }, paused: true });

            tl.to(gridRef.current, { scale })
                .to(left, { xPercent: -xPct }, '<')
                .to(right, { xPercent: xPct }, '<')
                .to(
                    center,
                    {
                        yPercent: (i) => (i < Math.floor(center.length / 2) ? -1 : 1) * xPct,
                        duration: 0.6,
                        ease: 'power1.inOut',
                    },
                    '-=0.6',
                );

            const t = setTimeout(() => {
                void tl.play();
            }, 300);
            return () => clearTimeout(t);
        },
        { scope: ref, dependencies: [key, scale, xPct] },
    );

    const cols = [
        { cls: 'gz-col-0', hue: 250 },
        { cls: 'gz-col-1', hue: 270 },
        { cls: 'gz-col-2', hue: 290 },
    ];

    return (
        <DemoShell label="GRID ZOOM DEMO" action={<Replay onClick={() => setKey((k) => k + 1)} />}>
            <div ref={ref} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                                scale
                            </span>
                            <span className="font-mono text-violet-300 font-bold" style={{ fontSize: '10px' }}>
                                {scale.toFixed(2)}×
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))}
                            className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                                separation %
                            </span>
                            <span className="font-mono text-violet-300 font-bold" style={{ fontSize: '10px' }}>
                                {xPct}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={80}
                            step={5}
                            value={xPct}
                            onChange={(e) => setXPct(Number(e.target.value))}
                            className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-violet-500 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg" style={{ height: 160 }}>
                    <div ref={gridRef} className="grid grid-cols-3 gap-1.5 h-full">
                        {cols.map(({ cls, hue }) => (
                            <div key={cls} className={`${cls} flex flex-col gap-1.5`}>
                                {[0, 1].map((ri) => (
                                    <div key={ri} className="gz-item flex-1 rounded" style={{ background: `hsl(${hue + ri * 10}, 45%, 22%)`, border: `1px solid hsl(${hue + ri * 10}, 45%, 38%)` }} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <p className="font-mono text-zinc-600" style={{ fontSize: '9px' }}>
                    Grid scales · left col slides left · right col slides right · center col splits top/bottom
                </p>
            </div>
        </DemoShell>
    );
}

function SectionGridZoom() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={6} />
                    <h2 className="text-2xl font-black tracking-tight">Grid Zoom — Scale + Column Separation</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    After the grid finishes entering, a second timeline zooms it to 2.05× and splits the columns apart — left slides left, right slides right, and the center column splits vertically —
                    opening a gap in the middle to reveal the title and text.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <GridZoomDemo />
                    <CodeBlock lang="javascript">{`function gridZoomTimeline(columns) {
  const tl = gsap.timeline({
    defaults: { duration: 1, ease: "power3.inOut" },
  })

  // ① Scale the entire grid up
  tl.to(grid, { scale: 2.05 })

  // ② Lateral columns slide outward — simultaneously
  tl.to(columns[0], { xPercent: -40 }, "<")  // left
  tl.to(columns[2], { xPercent:  40 }, "<")  // right

  // ③ Center column: items above midpoint go up,
  //    items below midpoint go down
  tl.to(columns[1], {
    yPercent: (index) =>
      (index < Math.floor(columns[1].length / 2)
        ? -1 : 1) * 40,
    duration: 0.5,
    ease: "power1.inOut",
  }, "-=0.5") // starts 0.5 units before zoom ends

  return tl
}

// "< " = start at same time as previous tween
// So scale + left-slide + right-slide all fire together.`}</CodeBlock>
                </div>
            </FadeIn>

            <FadeIn delay={0.15}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Note>
                        <strong className="text-violet-300">
                            <Pill>&quot;&lt;&quot;</Pill> position token
                        </strong>{' '}
                        — means &quot;start at the same time as the previous tween.&quot; Scale, left-slide, and right-slide all begin together, giving the impression of a single explosive expansion.
                    </Note>
                    <Note variant="sky">
                        <strong className="text-sky-300">
                            Function-based <Pill>yPercent</Pill>
                        </strong>{' '}
                        — GSAP passes each element&apos;s index in the target array to a function value. Elements above the midpoint of the center column get <Pill>-40</Pill>; below get{' '}
                        <Pill>+40</Pill>.
                    </Note>
                    <Note variant="emerald">
                        <strong className="text-emerald-300">
                            <Pill>power3.inOut</Pill> vs. <Pill>power1.inOut</Pill>
                        </strong>{' '}
                        — the zoom uses a punchy ease; the center split uses a gentler one so it feels like it&apos;s parting, not being thrown. Differentiated eases on co-timed animations add depth.
                    </Note>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 8. Content Toggle ────────────────────────────────────────────────────────

function ContentToggleDemo() {
    const ref = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const subRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [titleOffsetY, setTitleOffsetY] = useState(0);

    // compute offset before first paint to avoid flash
    useLayoutEffect(() => {
        if (!ref.current || !titleRef.current || !subRef.current) return;
        const dy = (ref.current.offsetHeight - titleRef.current.offsetHeight) / 2;
        const pct = (dy / ref.current.offsetHeight) * 100;
        setTitleOffsetY(pct);
        gsap.set(titleRef.current, { yPercent: pct });
        gsap.set(subRef.current, { opacity: 0 }); // register with GSAP so first toggle is deterministic
    }, []);

    const toggle = useCallback(
        (show: boolean) => {
            setVisible(show);
            if (!titleRef.current || !subRef.current) return;
            gsap.timeline({ defaults: { overwrite: true } })
                .to(titleRef.current, { yPercent: show ? 0 : titleOffsetY, duration: 0.7, ease: 'power2.inOut' })
                .to(subRef.current, { opacity: show ? 1 : 0, duration: 0.4, ease: `power1.${show ? 'inOut' : 'out'}` }, show ? '-=90%' : '<');
        },
        [titleOffsetY],
    );

    return (
        <DemoShell label="CONTENT TOGGLE DEMO">
            <div className="space-y-4">
                <div ref={ref} className="relative rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col items-center justify-center" style={{ height: 160 }}>
                    {/* title */}
                    <div ref={titleRef} className="text-white font-black tracking-tight text-center" style={{ fontSize: 'clamp(20px,4vw,32px)' }}>
                        Sticky Grid Scroll
                    </div>
                    {/* sub */}
                    <div ref={subRef} className="mt-3 text-center">
                        <p className="text-zinc-400" style={{ fontSize: '12px' }}>
                            A structured scroll-driven image grid.
                        </p>
                        <button className="mt-2 font-mono text-violet-400 border border-violet-500/30 rounded px-3 py-1" style={{ fontSize: '10px' }}>
                            Read more
                        </button>
                    </div>

                    {/* yPercent indicator */}
                    <div className="absolute right-2 top-2 font-mono text-zinc-600" style={{ fontSize: '9px' }}>
                        yPercent: {visible ? 0 : titleOffsetY.toFixed(1)}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => toggle(true)}
                        className={`flex-1 font-mono rounded-lg border py-2 text-[11px] transition-colors ${visible ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                    >
                        reveal (scrolling forward)
                    </button>
                    <button
                        onClick={() => toggle(false)}
                        className={`flex-1 font-mono rounded-lg border py-2 text-[11px] transition-colors ${!visible ? 'bg-zinc-700/40 border-zinc-600 text-zinc-300' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                    >
                        hide (scrolling backward)
                    </button>
                </div>

                <p className="font-mono text-zinc-600" style={{ fontSize: '10px' }}>
                    Title starts offset-down to appear visually centered alone. On reveal it slides up to make room for description.
                </p>
            </div>
        </DemoShell>
    );
}

function SectionContentToggle() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={7} />
                    <h2 className="text-2xl font-black tracking-tight">Content Toggle — Direction-Aware Reveal</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    When the grid splits open, the title slides up and the description fades in. On reverse scroll, they hide again. The key insight: the title starts displaced downward so it appears
                    centered alone — then on reveal it slides to its natural flex position, making space for the text below.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <ContentToggleDemo />
                    <CodeBlock lang="javascript">{`// ── Step 1: compute the offset ──────────────────────
// The content is a flex column (centered). With title +
// description + button, the title sits above center.
// We want it to LOOK centered when alone.

const dy = (content.offsetHeight - title.offsetHeight) / 2
// dy = pixels from content top to title top when centered

// Convert to percentage of content height:
const titleOffsetY = (dy / content.offsetHeight) * 100
// ≈ 43% at typical viewport sizes

// Apply: title moves DOWN by 43%, appearing centered
gsap.set(title, { yPercent: titleOffsetY })
gsap.set([description, button], { opacity: 0 })


// ── Step 2: the toggle function ──────────────────────
function toggleContent(isVisible) {
  gsap.timeline({ defaults: { overwrite: true } })
    // Title slides UP (back to natural flex position)
    .to(title, {
      yPercent: isVisible ? 0 : titleOffsetY,
      duration: 0.7,
      ease: "power2.inOut",
    })
    // Description + button fade in almost immediately
    .to([description, button], {
      opacity: isVisible ? 1 : 0,
      duration: 0.4,
      ease: \`power1.\${isVisible ? "inOut" : "out"}\`,
    }, isVisible ? "-=90%" : "<")
}


// ── Step 3: call from the master timeline ────────────
// The callback fires when the playhead crosses this pos.
mainTl.add(
  () => toggleContent(mainTl.scrollTrigger.direction === 1),
  "-=0.32"
)`}</CodeBlock>
                </div>
            </FadeIn>

            <FadeIn delay={0.15}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Note>
                        <strong className="text-violet-300">
                            <Pill>direction === 1</Pill>
                        </strong>{' '}
                        — GSAP&apos;s ScrollTrigger exposes the current scroll direction on the trigger object. <Pill>1</Pill> = forward (scrolling down), <Pill>-1</Pill> = backward. Passing this into{' '}
                        <Pill>toggleContent</Pill>
                        makes the animation fully bidirectional.
                    </Note>
                    <Note variant="amber">
                        <strong className="text-amber-300">
                            <Pill>overwrite: true</Pill>
                        </strong>{' '}
                        — when the user scrubs rapidly back and forth near the callback point, multiple <Pill>toggleContent</Pill> timelines stack up. <Pill>overwrite: true</Pill> kills any in-flight
                        tweens on the same targets before starting new ones, preventing stutter.
                    </Note>
                    <Note variant="sky">
                        <strong className="text-sky-300">
                            <Pill>&quot;-=90%&quot;</Pill> overlap
                        </strong>{' '}
                        — the description starts fading in when the title is 90% through its move. This tiny overlap makes them feel choreographed rather than sequential.
                    </Note>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 9. Lenis + GSAP Sync ─────────────────────────────────────────────────────

function SyncDiagram() {
    const [mode, setMode] = useState<'bad' | 'good'>('bad');

    const steps = {
        bad: [
            { label: 'GSAP ticker fires', color: 'violet' },
            { label: 'lenis.raf() → window.scrollTo(newY)', color: 'violet' },
            { label: 'window.scrollY still = oldY ← async!', color: 'rose' },
            { label: 'ScrollTrigger reads scrollY = oldY', color: 'rose' },
            { label: 'Transform calculated from oldY', color: 'rose' },
            { label: 'Browser renders: viewport at newY + transform from oldY', color: 'rose' },
            { label: '→ 1-frame mismatch = title jitter', color: 'rose' },
        ],
        good: [
            { label: 'GSAP ticker fires', color: 'violet' },
            { label: 'lenis.raf() → processes scroll → emits "scroll" event', color: 'violet' },
            { label: 'useLenis callback: ScrollTrigger.update()', color: 'emerald' },
            { label: 'ScrollTrigger reads confirmed scroll position', color: 'emerald' },
            { label: 'Transform calculated correctly', color: 'emerald' },
            { label: 'Browser renders: perfectly in sync', color: 'emerald' },
        ],
    };

    const clr = { violet: 'border-violet-500/40 text-violet-300', rose: 'border-rose-500/40 text-rose-300', emerald: 'border-emerald-500/40 text-emerald-300' };

    return (
        <DemoShell
            label="SYNC DIAGRAM — per RAF tick"
            action={
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('bad')}
                        className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-colors ${mode === 'bad' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'border-zinc-700 text-zinc-500'}`}
                    >
                        without sync
                    </button>
                    <button
                        onClick={() => setMode('good')}
                        className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-colors ${mode === 'good' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'border-zinc-700 text-zinc-500'}`}
                    >
                        with sync
                    </button>
                </div>
            }
        >
            <div className="space-y-1.5">
                {steps[mode].map((s, i) => (
                    <motion.div
                        key={`${mode}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.25 }}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${clr[s.color as keyof typeof clr]}`}
                    >
                        <span className="font-mono text-zinc-600 shrink-0 tabular-nums" style={{ fontSize: '10px' }}>
                            {i + 1}
                        </span>
                        <span className="font-mono" style={{ fontSize: '11px' }}>
                            {s.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </DemoShell>
    );
}

function SectionLenisSync() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={8} />
                    <h2 className="text-2xl font-black tracking-tight">Lenis + GSAP — The Correct Sync Pattern</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Lenis calls <Pill>window.scrollTo()</Pill> to apply smooth scroll — but browsers don&apos;t always update <Pill>window.scrollY</Pill> synchronously. If GSAP reads{' '}
                    <Pill>window.scrollY</Pill> in the same tick before it&apos;s updated, the parallax transform and the actual scroll position disagree by one frame. The result: the title jitters on
                    every scroll event.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <SyncDiagram />
                    <CodeBlock lang="tsx">{`// ─── The fix: sync ScrollTrigger to Lenis events ───

// useLenis(callback) fires AFTER Lenis has processed
// the scroll and confirmed the new position.
// Calling ScrollTrigger.update() here ensures GSAP
// always reads the correct, up-to-date scroll value.

import { useLenis } from "lenis/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export default function StickyScroll() {
  // Fires on every Lenis scroll event — after position
  // is committed — so ScrollTrigger reads correct value.
  useLenis(() => {
    ScrollTrigger.update()
  })

  useGSAP(() => {
    // Match original: disable GSAP lag smoothing.
    // Without it, GSAP can add micro-drift between ticks
    // under browser load, compounding the jitter.
    gsap.ticker.lagSmoothing(0)

    // ... rest of animation setup
  }, { scope: containerRef, dependencies: [isLoaded] })
}


// ─── Vanilla JS equivalent (the original pattern) ───
const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1.4 })

// Direct sync: ScrollTrigger.update fires immediately
// when Lenis emits "scroll" (after position is set)
lenis.on("scroll", ScrollTrigger.update)

gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)`}</CodeBlock>
                </div>
            </FadeIn>

            <FadeIn delay={0.15}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Note>
                        <strong className="text-violet-300">Why not just GSAP ticker?</strong> The shared <Pill>LenisScroller</Pill> component drives Lenis from the GSAP ticker but doesn&apos;t
                        explicitly call <Pill>ScrollTrigger.update()</Pill> after Lenis commits the position. GSAP normally listens to native scroll events — but those can be one tick behind{' '}
                        <Pill>window.scrollTo()</Pill>.
                    </Note>
                    <Note variant="amber">
                        <strong className="text-amber-300">
                            <Pill>lagSmoothing(0)</Pill>
                        </strong>{' '}
                        — GSAP&apos;s default lag smoothing caps the time delta when the browser was inactive, to prevent animation jumps. With Lenis already handling smooth velocity, a second
                        smoothing layer adds micro-drift. Setting it to 0 disables it.
                    </Note>
                    <Note variant="sky">
                        <strong className="text-sky-300">Only affects this page</strong> — <Pill>useLenis</Pill> subscribes to the nearest Lenis context (provided by the layout).{' '}
                        <Pill>lagSmoothing(0)</Pill> is global but harmless for other GSAP animations — it just removes a safety net you don&apos;t need when Lenis is driving scroll.
                    </Note>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 10. Performance ─────────────────────────────────────────────────────────

function SectionPerformance() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={9} />
                    <h2 className="text-2xl font-black tracking-tight">Performance — Staying on the Compositor</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    All 12 images, the wrapper, the grid, and each gallery item are animated exclusively with <Pill>transform</Pill> and <Pill>opacity</Pill> — the two CSS properties that run on the
                    GPU compositor without triggering layout or paint. A few extra hints keep the browser from being surprised.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <CodeBlock lang="css">{`/* Promote elements that will animate to their own
   GPU layer before animation starts. Avoids the
   compositor having to promote them mid-animation
   (which causes a paint flash). */

.block__wrapper {
  will-change: transform; /* parallax + sticky */
}
.gallery__grid {
  will-change: transform; /* scale (zoom) */
}
.gallery__item {
  will-change: transform; /* x/y reveal + zoom */
}


/* overflow: hidden on the wrapper clips items
   that start outside the viewport.
   This keeps the paint area minimal — the browser
   only paints what's inside the wrapper boundary. */
.block__wrapper {
  overflow: hidden;
}`}</CodeBlock>

                    <div className="space-y-3">
                        <Note>
                            <strong className="text-violet-300">Transform only, no layout</strong> — <Pill>y</Pill>, <Pill>xPercent</Pill>, <Pill>yPercent</Pill>, <Pill>scale</Pill> all map to CSS{' '}
                            <Pill>transform</Pill>. Changing them never triggers a layout recalculation. Never animate <Pill>top/left/width/height</Pill> on animated elements.
                        </Note>
                        <Note variant="amber">
                            <strong className="text-amber-300">will-change on every item</strong> — because each <Pill>.gallery__item</Pill> animates independently (via stagger), each needs its own
                            compositing layer. Setting
                            <Pill>will-change: transform</Pill> on the item rather than just the grid prevents mid-animation layer promotions.
                        </Note>
                        <Note variant="sky">
                            <strong className="text-sky-300">Don&apos;t over-use will-change</strong> — every composited layer uses GPU memory. Only apply it to elements that actually animate. Remove
                            it after the animation completes if elements stop moving.
                        </Note>
                        <Note variant="rose">
                            <strong className="text-rose-300">Sticky + overflow parent</strong> — as mentioned in Step 1: <Pill>overflow: hidden</Pill> on any
                            <em> ancestor</em> of the sticky element creates a scroll container and breaks sticky. Only set it on the sticky element <em>itself</em>.
                        </Note>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 11. Full Assembly ────────────────────────────────────────────────────────

function SectionAssembly() {
    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <div className="flex items-center gap-3 mb-4">
                    <Step n={10} />
                    <h2 className="text-2xl font-black tracking-tight">Full React Assembly</h2>
                </div>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Putting all nine steps together into a single <Pill>useGSAP</Pill> call. The key React-specific decisions: gate animations behind image preload, use{' '}
                    <Pill>immediateRender: false</Pill> on scrubbed from-tweens, and sync Lenis via <Pill>useLenis</Pill>.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <CodeBlock lang="tsx">{`'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const IMAGES = Array.from({ length: 12 }, (_, i) => \`/sticky-scroll/\${i+1}.webp\`)

export default function StickyGridScroll() {
  // ─── Refs ──────────────────────────────────────────────────────
  const containerRef  = useRef<HTMLDivElement>(null)
  const blockRef      = useRef<HTMLElement>(null)
  const wrapperRef    = useRef<HTMLDivElement>(null)
  const contentRef    = useRef<HTMLDivElement>(null)
  const titleRef      = useRef<HTMLHeadingElement>(null)
  const descRef       = useRef<HTMLParagraphElement>(null)
  const btnRef        = useRef<HTMLAnchorElement>(null)
  const gridRef       = useRef<HTMLUListElement>(null)
  const itemRefs      = useRef<HTMLLIElement[]>([])

  // ─── Step 8: Lenis/GSAP sync ───────────────────────────────────
  useLenis(() => { ScrollTrigger.update() })

  // ─── Image preload gate ────────────────────────────────────────
  // onLoad won't fire for cached images — check img.complete instead
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    const imgs = Array.from(
      containerRef.current!.querySelectorAll<HTMLImageElement>('img')
    )
    let remaining = imgs.length
    if (!remaining) { setIsLoaded(true); return }
    const done = () => { if (--remaining <= 0) setIsLoaded(true) }
    imgs.forEach(img =>
      img.complete
        ? done()
        : (img.addEventListener('load', done, { once: true }),
           img.addEventListener('error', done, { once: true }))
    )
  }, [])

  // ─── Animation setup ───────────────────────────────────────────
  useGSAP(() => {
    if (!isLoaded) return
    gsap.ticker.lagSmoothing(0)  // Step 8: no drift

    const block  = blockRef.current!
    const wrapper = wrapperRef.current!
    const content = contentRef.current!
    const title  = titleRef.current!
    const desc   = descRef.current!
    const btn    = btnRef.current!
    const grid   = gridRef.current!
    const items  = itemRefs.current.filter(Boolean)

    // Step 6: group items into 3 columns by visual position
    const cols: HTMLLIElement[][] = [[], [], []]
    items.forEach((item, i) => cols[i % 3].push(item))

    // Step 7: init content — title offset so it looks centered alone
    const dy = (content.offsetHeight - title.offsetHeight) / 2
    const titleOffsetY = (dy / content.offsetHeight) * 100
    gsap.set(title, { yPercent: titleOffsetY })
    gsap.set([desc, btn], { opacity: 0, pointerEvents: 'none' })

    // Step 3: parallax entry
    gsap.from(wrapper, {
      yPercent: -100,
      ease: 'none',
      immediateRender: false,  // don't flash to -100 on init
      scrollTrigger: {
        trigger: block,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
      },
    })

    // Title fade-in (separate, non-scrubbed trigger)
    gsap.from(title, {
      opacity: 0, duration: 0.7, ease: 'power1.out',
      scrollTrigger: {
        trigger: block,
        start: 'top 57%',
        toggleActions: 'play none none reset',
      },
    })

    // Step 5: grid reveal timeline
    function revealTl() {
      const tl = gsap.timeline()
      const wh = window.innerHeight
      const dy = wh - (wh - grid.offsetHeight) / 2
      cols.forEach((col, ci) => {
        const fromTop = ci % 2 === 0
        tl.from(col, {
          y: dy * (fromTop ? -1 : 1),
          stagger: { each: 0.06, from: fromTop ? 'end' : 'start' },
          ease: 'power1.inOut',
        }, 'grid-reveal')
      })
      return tl
    }

    // Step 6: grid zoom timeline
    function zoomTl() {
      const tl = gsap.timeline({ defaults: { duration: 1, ease: 'power3.inOut' } })
      tl.to(grid, { scale: 2.05 })
      tl.to(cols[0], { xPercent: -40 }, '<')
      tl.to(cols[2], { xPercent:  40 }, '<')
      tl.to(cols[1], {
        yPercent: (i) => (i < Math.floor(cols[1].length / 2) ? -1 : 1) * 40,
        duration: 0.5, ease: 'power1.inOut',
      }, '-=0.5')
      return tl
    }

    // Step 7: content toggle
    function toggle(show: boolean) {
      gsap.timeline({ defaults: { overwrite: true } })
        .to(title, { yPercent: show ? 0 : titleOffsetY, duration: 0.7, ease: 'power2.inOut' })
        .to([desc, btn], {
          opacity: show ? 1 : 0, duration: 0.4,
          ease: \`power1.\${show ? 'inOut' : 'out'}\`,
          pointerEvents: show ? 'all' : 'none',
        }, show ? '-=90%' : '<')
    }

    // Step 4: master scrubbed timeline
    const mainTl = gsap.timeline({
      scrollTrigger: {
        trigger: block,
        start: 'top 25%',
        end: 'bottom bottom',
        scrub: true,
      },
    })
    mainTl
      .add(revealTl())
      .add(zoomTl(), '-=0.6')
      .add(() => toggle(mainTl.scrollTrigger!.direction === 1), '-=0.32')

    ScrollTrigger.refresh()
  }, { scope: containerRef, dependencies: [isLoaded] })

  return (
    <div ref={containerRef}>
      {/* Section 1: Hero image */}
      <section style={{ height: '100vh', position: 'relative', zIndex: 1 }}>
        <img src="/sticky-scroll/8.webp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
      </section>

      {/* Section 2: Sticky grid */}
      <section ref={blockRef} style={{ height: '425vh' }}>
        <div ref={wrapperRef} style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {/* Content overlay */}
          <div ref={contentRef} style={{ position: 'relative', height: '100vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', zIndex: 1 }}>
            <h2 ref={titleRef}>Sticky Grid Scroll</h2>
            <p ref={descRef}>A structured scroll-driven image grid.</p>
            <a ref={btnRef} href="#">Read tutorial</a>
          </div>

          {/* Gallery grid */}
          <div style={{ position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)' }}>
            <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              {IMAGES.map((src, i) => (
                <li key={i} ref={el => { if (el) itemRefs.current[i] = el }}
                    style={{ aspectRatio: 1, willChange: 'transform' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 12. Takeaways ────────────────────────────────────────────────────────────

const TAKEAWAYS = [
    {
        n: '01',
        title: 'height: 425vh = animation budget',
        body: 'The outer container height is your entire scroll canvas. More vh = slower, more cinematic. Less vh = snappier. Tune it to control pacing without touching any animation values.',
        color: 'violet',
    },
    {
        n: '02',
        title: "Sticky doesn't scroll — it borrows scroll",
        body: 'The sticky element never actually scrolls. The parent does. overflow: hidden on any ancestor of the sticky element steals its scroll container and silently breaks the effect.',
        color: 'rose',
    },
    {
        n: '03',
        title: 'GSAP labels sync parallel animations',
        body: 'Adding multiple .from() calls to the same label (like "grid-reveal") starts them all at the same playhead position. Without labels, sub-timelines play sequentially.',
        color: 'violet',
    },
    {
        n: '04',
        title: 'Function values unlock per-element logic',
        body: 'Passing (index) => value to any GSAP property lets each element compute its own target. Used here for the center column split — no need for separate tweens per item.',
        color: 'sky',
    },
    {
        n: '05',
        title: 'useLenis() = frame-accurate scroll sync',
        body: 'Wiring ScrollTrigger.update() to useLenis() fires it after Lenis has committed the scroll position — not on the native scroll event which can lag by a frame.',
        color: 'emerald',
    },
    {
        n: '06',
        title: 'immediateRender: false on scrubbed from-tweens',
        body: 'A from-tween with immediateRender: true snaps to its start state immediately. For scrubbed animations, the scrub should set the initial position from the current scroll value, not the tween start.',
        color: 'amber',
    },
] as const;

function SectionTakeaways() {
    const colors = {
        violet: { border: 'border-violet-500/25', text: 'text-violet-300', n: 'text-violet-500/30' },
        rose: { border: 'border-rose-500/25', text: 'text-rose-300', n: 'text-rose-500/30' },
        sky: { border: 'border-sky-500/25', text: 'text-sky-300', n: 'text-sky-500/30' },
        emerald: { border: 'border-emerald-500/25', text: 'text-emerald-300', n: 'text-emerald-500/30' },
        amber: { border: 'border-amber-500/25', text: 'text-amber-300', n: 'text-amber-500/30' },
    };

    return (
        <section className="px-6 md:px-12 xl:px-24 py-16">
            <FadeIn>
                <h2 className="text-2xl font-black tracking-tight mb-2">Six Things to Remember</h2>
                <p className="text-zinc-400 mb-10" style={{ fontSize: '16px' }}>
                    The non-obvious decisions that make the difference between working and jittery.
                </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {TAKEAWAYS.map((t, i) => {
                    const c = colors[t.color];
                    return (
                        <FadeIn key={i} delay={i * 0.05}>
                            <div className={`rounded-xl border ${c.border} bg-zinc-950 p-5 h-full relative overflow-hidden`}>
                                <div className={`absolute -top-2 -right-1 font-black leading-none select-none ${c.n}`} style={{ fontSize: '72px' }}>
                                    {t.n}
                                </div>
                                <div className={`font-black mb-2 ${c.text}`} style={{ fontSize: '14px' }}>
                                    {t.title}
                                </div>
                                <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '13px' }}>
                                    {t.body}
                                </p>
                            </div>
                        </FadeIn>
                    );
                })}
            </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StickyScrollLearnPage() {
    return (
        <div className="min-h-screen" style={{ background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
            <div className="max-w-5xl mx-auto">
                <Hero />
                <Rule />
                <SectionSticky />
                <Rule />
                <SectionFluidUnits />
                <Rule />
                <SectionParallax />
                <Rule />
                <SectionScrub />
                <Rule />
                <SectionGridReveal />
                <Rule />
                <SectionGridZoom />
                <Rule />
                <SectionContentToggle />
                <Rule />
                <SectionLenisSync />
                <Rule />
                <SectionPerformance />
                <Rule />
                <SectionAssembly />
                <Rule />
                <SectionTakeaways />

                <footer className="px-6 md:px-12 xl:px-24 py-16 border-t border-zinc-800/50">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="font-black text-zinc-200 mb-1">Sticky Grid Scroll</div>
                            <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                                Original by{' '}
                                <a href="https://theoplawinski.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                                    Theo Plawinski
                                </a>{' '}
                                for{' '}
                                <a href="https://tympanus.net/codrops" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                                    Codrops
                                </a>
                                . Ported &amp; annotated.
                            </p>
                        </div>
                        <Link
                            href="/sticky-scroll"
                            className="font-mono text-sm border border-violet-500/30 text-violet-400 hover:border-violet-500/60 hover:text-violet-300 px-5 py-2.5 rounded-lg transition-colors"
                        >
                            ← live demo
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
