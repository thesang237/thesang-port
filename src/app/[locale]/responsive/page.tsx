'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';
import { cn } from '@/utils/cn';

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionNum({ n }: { n: string }) {
    return (
        <span
            className="absolute -top-8 -left-2 font-black leading-none select-none pointer-events-none"
            style={{ color: 'rgba(14,165,233,0.06)', fontVariantNumeric: 'tabular-nums', fontSize: '144px' }}
        >
            {n}
        </span>
    );
}

function Tag({ children, variant = 'sky' }: { children: React.ReactNode; variant?: 'sky' | 'indigo' | 'green' | 'rose' | 'violet' | 'zinc' | 'amber' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border',
                variant === 'sky' && 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                variant === 'indigo' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                variant === 'green' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                variant === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                variant === 'violet' && 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                variant === 'zinc' && 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40',
                variant === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            )}
            style={{ fontSize: '11px' }}
        >
            {children}
        </span>
    );
}

function Callout({ children, variant = 'info', title }: { children: React.ReactNode; variant?: 'info' | 'warn' | 'tip' | 'perf'; title?: string }) {
    const map = {
        info: { border: 'border-sky-500/30', bg: 'bg-sky-500/5', icon: '💡', label: title ?? 'Why this matters', text: 'text-sky-300' },
        warn: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: '⚠️', label: title ?? 'Watch out', text: 'text-amber-300' },
        tip: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: '✦', label: title ?? 'Best practice', text: 'text-emerald-300' },
        perf: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', icon: '⚡', label: title ?? 'Performance', text: 'text-violet-300' },
    };
    const c = map[variant];
    return (
        <div className={cn('rounded-xl border px-5 py-4 leading-relaxed', c.border, c.bg)}>
            <p className={cn('font-semibold mb-1 text-sm', c.text)}>
                {c.icon} {c.label}
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">{children}</p>
        </div>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-sky-500/20 via-sky-500/5 to-transparent" />;
}

function Pill({ children }: { children: React.ReactNode }) {
    return <code className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-sky-300 font-mono rounded px-1.5 py-0.5 text-[12px]">{children}</code>;
}

// ─── Interactive demos ────────────────────────────────────────────────────────

// Demo 1: Breakpoint visualizer — drag a slider to simulate screen width
function BreakpointDemo() {
    const [width, setWidth] = useState(375);

    const breakpoints = [
        { name: 'xs', min: 0, max: 639, color: 'bg-rose-500', label: '< 640px', desc: 'Mobile portrait' },
        { name: 'sm', min: 640, max: 767, color: 'bg-amber-500', label: '≥ 640px', desc: 'Mobile landscape' },
        { name: 'md', min: 768, max: 1023, color: 'bg-sky-500', label: '≥ 768px', desc: 'Tablet' },
        { name: 'lg', min: 1024, max: 1279, color: 'bg-violet-500', label: '≥ 1024px', desc: 'Desktop' },
        { name: 'xl', min: 1280, max: 1535, color: 'bg-emerald-500', label: '≥ 1280px', desc: 'Wide desktop' },
        { name: '2xl', min: 1536, max: 1920, color: 'bg-pink-500', label: '≥ 1536px', desc: 'Ultra-wide' },
    ];

    const active = breakpoints.findLast((bp) => width >= bp.min) ?? breakpoints[0];

    const navItems = width >= 768;
    const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            {/* Simulated viewport */}
            <div className="p-4 border-b border-zinc-800/60">
                <div className="mx-auto rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden transition-all duration-200" style={{ width: `${Math.min(width / 5, 100)}%`, minWidth: '120px' }}>
                    {/* Simulated nav */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50 bg-zinc-800/50">
                        <div className="w-12 h-2 rounded bg-zinc-600" />
                        {navItems ? (
                            <div className="flex gap-2">
                                <div className="w-8 h-1.5 rounded bg-zinc-600" />
                                <div className="w-8 h-1.5 rounded bg-zinc-600" />
                                <div className="w-8 h-1.5 rounded bg-zinc-600" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-0.5">
                                <div className="w-4 h-0.5 rounded bg-zinc-500" />
                                <div className="w-4 h-0.5 rounded bg-zinc-500" />
                                <div className="w-4 h-0.5 rounded bg-zinc-500" />
                            </div>
                        )}
                    </div>
                    {/* Simulated grid */}
                    <div className="p-2" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '4px' }}>
                        {Array.from({ length: cols * 2 }, (_, i) => (
                            <div key={i} className="h-6 rounded bg-zinc-700/60" style={{ opacity: 0.4 + (i % 3) * 0.2 }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-4">
                <label className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-mono text-[11px]">simulated screen width</span>
                        <span className="font-mono font-bold text-[11px]" style={{ color: active.color.replace('bg-', 'rgb(') }}>
                            {width}px — <span className="font-mono">{active.name}:</span> {active.desc}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={320}
                        max={1920}
                        step={10}
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full h-1 rounded-full bg-zinc-700 accent-sky-500 cursor-pointer"
                    />
                </label>

                {/* Breakpoint badges */}
                <div className="flex flex-wrap gap-2">
                    {breakpoints.map((bp) => (
                        <div
                            key={bp.name}
                            className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[10px] transition-all duration-200',
                                width >= bp.min ? `${bp.color} border-transparent text-white opacity-100` : 'border-zinc-700 text-zinc-600 bg-transparent opacity-40',
                            )}
                        >
                            <span className={cn('w-1.5 h-1.5 rounded-full', width >= bp.min ? 'bg-white' : 'bg-zinc-600')} />
                            {bp.name} {bp.label}
                        </div>
                    ))}
                </div>

                <p className="text-zinc-600 text-[11px] font-mono">
                    Active breakpoints light up. Each prefix applies from its min-width <span className="text-zinc-400">and wider</span>.
                </p>
            </div>
        </div>
    );
}

// Demo 2: Flex direction switcher
function FlexDirectionDemo() {
    const [direction, setDirection] = useState<'col' | 'row'>('col');
    const [gap, setGap] = useState(16);

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="p-6 min-h-[200px] flex items-center justify-center">
                <div
                    className="transition-all duration-500"
                    style={{
                        display: 'flex',
                        flexDirection: direction === 'col' ? 'column' : 'row',
                        gap: `${gap}px`,
                        alignItems: 'center',
                    }}
                >
                    {['Image', 'Headline\n& body text', 'CTA\nButton'].map((label, i) => (
                        <div
                            key={i}
                            className={cn(
                                'rounded-xl border flex items-center justify-center font-mono text-[11px] text-zinc-400 whitespace-pre-wrap text-center leading-tight',
                                i === 0 && 'bg-sky-500/10 border-sky-500/20 text-sky-300',
                                i === 1 && 'bg-zinc-800/60 border-zinc-700 text-zinc-400',
                                i === 2 && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                            )}
                            style={{
                                width: direction === 'row' ? (i === 0 ? '120px' : i === 1 ? '160px' : '80px') : '220px',
                                height: i === 0 ? '80px' : i === 2 ? '36px' : '60px',
                                transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 border-t border-zinc-800/60 flex gap-6 flex-wrap">
                <div className="flex gap-2">
                    <button
                        onClick={() => setDirection('col')}
                        className={cn(
                            'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors',
                            direction === 'col' ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                        )}
                    >
                        flex-col (mobile)
                    </button>
                    <button
                        onClick={() => setDirection('row')}
                        className={cn(
                            'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors',
                            direction === 'row' ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                        )}
                    >
                        flex-row (desktop)
                    </button>
                </div>
                <label className="flex items-center gap-2 flex-1 min-w-[120px]">
                    <span className="text-zinc-500 font-mono text-[11px] shrink-0">gap {gap}px</span>
                    <input
                        type="range"
                        min={4}
                        max={48}
                        step={4}
                        value={gap}
                        onChange={(e) => setGap(Number(e.target.value))}
                        className="w-full h-1 rounded-full bg-zinc-700 accent-sky-500 cursor-pointer"
                    />
                </label>
            </div>
        </div>
    );
}

// Demo 3: Responsive grid
function GridDemo() {
    const [cols, setCols] = useState(1);
    const items = ['Email API', 'Templates', 'Analytics', 'Webhooks', 'Logs', 'Team'];

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="p-6">
                <div className="transition-all duration-500" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px' }}>
                    {items.map((item, i) => (
                        <div key={i} className="rounded-lg border border-zinc-700/60 bg-zinc-800/40 p-3 transition-all duration-500">
                            <div className="w-6 h-6 rounded bg-sky-500/20 mb-2" />
                            <div className="text-zinc-300 font-mono text-[12px]">{item}</div>
                            <div className="mt-1 h-1.5 w-3/4 rounded bg-zinc-700/60" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 border-t border-zinc-800/60 flex items-center gap-4">
                <span className="text-zinc-500 font-mono text-[11px] shrink-0">grid-cols</span>
                <div className="flex gap-2">
                    {[1, 2, 3, 6].map((n) => (
                        <button
                            key={n}
                            onClick={() => setCols(n)}
                            className={cn(
                                'w-8 h-8 rounded-lg font-mono border text-[11px] transition-colors',
                                cols === n ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                            )}
                        >
                            {n}
                        </button>
                    ))}
                </div>
                <span className="text-zinc-600 font-mono text-[11px]">{cols === 1 ? 'mobile default' : cols === 2 ? 'sm: breakpoint' : cols === 3 ? 'lg: breakpoint' : 'lg: grid-cols-6'}</span>
            </div>
        </div>
    );
}

// Demo 4: Typography scale
function TypographyDemo() {
    const [screen, setScreen] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

    const sizes = {
        mobile: { hero: 'text-3xl', sub: 'text-base', label: '375px mobile — text-3xl' },
        tablet: { hero: 'text-5xl', sub: 'text-lg', label: '768px tablet — md:text-5xl' },
        desktop: { hero: 'text-7xl', sub: 'text-xl', label: '1280px desktop — xl:text-7xl' },
    };

    const s = sizes[screen];

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="p-8 min-h-[180px] flex flex-col gap-2 justify-center">
                <motion.h2
                    className={cn('font-black text-white leading-none transition-all duration-500 tracking-tight', s.hero)}
                    key={screen + '-hero'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: E_OUT }}
                >
                    Send emails
                    <br />
                    that convert.
                </motion.h2>
                <motion.p
                    className={cn('text-zinc-400 leading-relaxed mt-2', s.sub)}
                    key={screen + '-sub'}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: E_OUT, delay: 0.05 }}
                >
                    The email API built for developers.
                </motion.p>
            </div>
            <div className="p-4 border-t border-zinc-800/60 space-y-3">
                <div className="flex gap-2">
                    {(['mobile', 'tablet', 'desktop'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setScreen(s)}
                            className={cn(
                                'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors capitalize',
                                screen === s ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <p className="text-zinc-600 font-mono text-[11px]">{sizes[screen].label}</p>
            </div>
        </div>
    );
}

// Demo 5: Show/hide elements
function VisibilityDemo() {
    const [viewport, setViewport] = useState<'mobile' | 'desktop'>('mobile');

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="p-6 space-y-3">
                {/* Nav bar simulation */}
                <div className="rounded-lg border border-zinc-700/40 bg-zinc-900 p-3 flex items-center justify-between">
                    <div className="w-16 h-2 rounded bg-zinc-600" />
                    {viewport === 'desktop' ? (
                        <div className="flex gap-3 items-center">
                            {['Docs', 'Blog', 'Pricing'].map((n) => (
                                <div key={n} className="text-zinc-400 font-mono text-[11px]">
                                    {n}
                                </div>
                            ))}
                            <div className="w-16 h-6 rounded-full bg-sky-500/30 border border-sky-500/40" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5 cursor-pointer">
                            <div className="w-5 h-0.5 rounded bg-zinc-400" />
                            <div className="w-5 h-0.5 rounded bg-zinc-400" />
                            <div className="w-5 h-0.5 rounded bg-zinc-400" />
                        </div>
                    )}
                </div>

                {/* Content with hidden elements */}
                <div className="rounded-lg border border-zinc-700/40 bg-zinc-900 p-4 space-y-2">
                    <div className="flex gap-3">
                        <div className="w-32 h-2 rounded bg-zinc-600" />
                        {viewport === 'desktop' && <div className="w-20 h-2 rounded bg-sky-500/40 transition-all" />}
                    </div>
                    <div className="w-full h-1.5 rounded bg-zinc-700/50" />
                    <div className="w-4/5 h-1.5 rounded bg-zinc-700/50" />
                    {viewport === 'desktop' && (
                        <div className="flex gap-2 pt-1">
                            <div className="w-8 h-8 rounded bg-zinc-700/60" />
                            <div className="w-8 h-8 rounded bg-zinc-700/60" />
                            <div className="w-8 h-8 rounded bg-zinc-700/60" />
                        </div>
                    )}
                </div>
                <p className="text-zinc-500 text-[11px] font-mono px-1">
                    {viewport === 'mobile' ? 'Mobile: hamburger icon shows, nav links & extra elements hidden' : 'Desktop: full nav links show, extra UI elements revealed'}
                </p>
            </div>
            <div className="p-4 border-t border-zinc-800/60 flex gap-2">
                {(['mobile', 'desktop'] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setViewport(v)}
                        className={cn(
                            'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors capitalize',
                            viewport === v ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                        )}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Demo 6: Container max-width
function ContainerDemo() {
    const [maxW, setMaxW] = useState<'sm' | 'xl' | '7xl' | 'full'>('xl');

    const widths = {
        sm: { px: '640px', tailwind: 'max-w-sm', desc: 'Tight prose column' },
        xl: { px: '1280px', tailwind: 'max-w-5xl', desc: 'Content default' },
        '7xl': { px: '1280px+', tailwind: 'md:max-w-7xl', desc: 'Resend.com nav' },
        full: { px: '100%', tailwind: 'w-full', desc: 'Edge-to-edge' },
    };

    const pct = { sm: 35, xl: 72, '7xl': 92, full: 100 };

    return (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="p-6 min-h-[140px] flex flex-col justify-center gap-3">
                <div className="w-full h-8 rounded bg-zinc-800/60 border border-zinc-700/40 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center px-1 gap-1">
                        {Array.from({ length: 24 }, (_, i) => (
                            <div key={i} className="flex-1 h-full bg-zinc-700/20 rounded-sm" />
                        ))}
                    </div>
                    <motion.div
                        className="absolute top-0 h-full bg-sky-500/20 border-x border-sky-500/40 mx-auto flex items-center justify-center"
                        animate={{ left: `${(100 - pct[maxW]) / 2}%`, width: `${pct[maxW]}%` }}
                        transition={{ duration: 0.4, ease: E_OUT }}
                    >
                        <span className="font-mono text-sky-300 text-[10px]">mx-auto {widths[maxW].tailwind}</span>
                    </motion.div>
                </div>
                <p className="text-zinc-500 text-[11px] font-mono text-center">
                    {widths[maxW].desc} — max-width: {widths[maxW].px}
                </p>
            </div>
            <div className="p-4 border-t border-zinc-800/60 flex gap-2 flex-wrap">
                {(Object.keys(widths) as Array<keyof typeof widths>).map((k) => (
                    <button
                        key={k}
                        onClick={() => setMaxW(k)}
                        className={cn(
                            'px-3 py-1 rounded-full font-mono border text-[11px] transition-colors',
                            maxW === k ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500',
                        )}
                    >
                        {widths[k].tailwind}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function HeroSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 pt-20 pb-16">
            <FadeIn>
                <Link href="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors mb-10">
                    ← Back
                </Link>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Tag variant="sky">Design for Designers</Tag>
                    <Tag variant="zinc">Tailwind CSS</Tag>
                    <Tag variant="zinc">Resend.com</Tag>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6">
                    Responsive
                    <br />
                    <span className="text-sky-400">Layout</span>
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                    A step-by-step guide to how resend.com stays perfectly laid out on every screen — from 320px phones to 4K monitors. Every concept has a live demo you can interact with.
                </p>
            </FadeIn>

            {/* Source callout */}
            <FadeIn delay={0.1}>
                <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 max-w-2xl">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        <strong className="text-zinc-200">Source studied:</strong> resend.com — a Next.js + Tailwind CSS site. All responsive classes below were extracted directly from its HTML. The
                        patterns here are the same ones used by world-class product teams.
                    </p>
                </div>
            </FadeIn>
        </section>
    );
}

function ViewportSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="01" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="sky">Foundation</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">The Viewport Meta Tag</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            Before any CSS trick works, you need this single line in your HTML <Pill>{'<head>'}</Pill>. Without it, mobile browsers zoom out and render your page as if it were a 980px
                            desktop — making everything tiny and unreadable.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">
                            <Pill>width=device-width</Pill>
                            {' tells the browser to use the actual screen width. '}
                            <Pill>initial-scale=1</Pill>
                            {' prevents the default zoom-out. This is the '}
                            <strong className="text-zinc-200">single most impactful</strong>
                            {' line for responsive design.'}
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="warn" title="Designers: always check this first">
                            If a site looks zoomed out on phone, the viewport tag is missing. In Next.js and most modern frameworks it is added automatically — but in plain HTML projects you must add
                            it yourself.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <CodeBlock lang="html">{`<!-- Put this inside <head> — required for ANY responsive design -->
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- Without it: mobile renders at 980px then zooms out -->
<!-- With it: mobile renders at actual device width (e.g. 390px) -->

<!-- Resend.com uses exactly this: -->
<meta name="viewport" content="width=device-width, initial-scale=1" />`}</CodeBlock>
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <Callout variant="info" title="Next.js adds this automatically">
                    In Next.js (used by resend.com), the viewport meta tag is injected by the framework. You only need to think about it when building raw HTML/CSS sites or older setups.
                </Callout>
            </FadeIn>
        </section>
    );
}

function BreakpointSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="02" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="indigo">Core Concept</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Mobile-First Breakpoints</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            <strong className="text-zinc-200">Mobile-first</strong> means: write your default styles for the smallest screen, then add breakpoint prefixes to <em>override</em> them as
                            the screen gets larger. In Tailwind, <Pill>md:flex-row</Pill> means &quot;apply <Pill>flex-row</Pill> only at 768px and wider&quot;.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">
                            Resend.com uses <Pill>sm</Pill> (640px), <Pill>md</Pill> (768px), <Pill>lg</Pill> (1024px), and <Pill>xl</Pill> (1280px) as its main breakpoints. Drag the slider below to
                            see which ones activate.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="tip" title="Always write mobile first, then scale up">
                            Start by styling the mobile layout with no prefix. Then add <code className="text-xs">md:</code> overrides for tablet and <code className="text-xs">lg:</code> for desktop.
                            This results in far less code than overriding downward with <code className="text-xs">max-width</code>.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <BreakpointDemo />
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <CodeBlock lang="css" highlight={['sm:', 'md:', 'lg:', 'xl:']}>
                    {`/* Tailwind breakpoints — all are min-width (mobile-first) */
/* sm  → @media (min-width: 640px)  */
/* md  → @media (min-width: 768px)  */
/* lg  → @media (min-width: 1024px) */
/* xl  → @media (min-width: 1280px) */
/* 2xl → @media (min-width: 1536px) */

/* In your HTML — no prefix = mobile default */
<div class="text-sm   md:text-base   lg:text-lg">
  Grows as the screen gets wider
</div>

/* Equivalent raw CSS: */
.text-sm { font-size: 0.875rem }
@media (min-width: 768px)  { .text-sm { font-size: 1rem } }
@media (min-width: 1024px) { .text-sm { font-size: 1.125rem } }
`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

function ContainerSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="03" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="sky">Layout</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Fluid Containers</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            Content should not stretch to fill a 4K monitor — it becomes unreadable. Resend.com uses <Pill>mx-auto w-full max-w-5xl px-6 md:max-w-7xl</Pill> on every section wrapper.
                            The content is always centered and capped at a comfortable width.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">
                            <Pill>mx-auto</Pill>
                            {' centers the container. '}
                            <Pill>w-full</Pill>
                            {' lets it shrink on small screens. '}
                            <Pill>max-w-*</Pill>
                            {' caps the maximum width. '}
                            <Pill>px-6</Pill>
                            {' adds horizontal padding so content never touches the edge on mobile.'}
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="tip" title="This is the #1 layout pattern on the web">
                            Almost every professional site uses this exact combination. The container is the invisible skeleton that keeps everything readable and centered regardless of screen width.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <ContainerDemo />
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <CodeBlock lang="html" highlight={['mx-auto', 'max-w-', 'px-6']}>
                    {`<!-- Resend.com's exact container pattern -->
<div class="mx-auto w-full max-w-5xl px-6 md:max-w-7xl">
  <!-- content -->
</div>

<!-- Breakdown:
  mx-auto        → center horizontally (margin: 0 auto)
  w-full         → take full width up to the max
  max-w-5xl      → cap at 1024px on mobile/tablet
  px-6           → 24px side padding (never touch screen edge)
  md:max-w-7xl   → expand cap to 1280px on tablet+
-->

<!-- Common max-width values:
  max-w-sm   → 640px   (prose, narrow forms)
  max-w-3xl  → 768px   (article content)
  max-w-5xl  → 1024px  (standard layout)
  max-w-7xl  → 1280px  (wide layouts like resend.com nav)
-->`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

function NavSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="04" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="rose">Navigation</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Responsive Navigation</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            Resend.com has two entirely different nav components: a hamburger menu for mobile and a full horizontal nav for desktop. They toggle with
                            <Pill>md:hidden</Pill> and <Pill>md:flex</Pill>.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">From the actual resend.com HTML:</p>
                        <ul className="mt-2 space-y-1 text-zinc-400 text-sm leading-relaxed">
                            <li>
                                • Mobile nav:{' '}
                                <Pill>
                                    flex w-full flex-col items-center <strong>md:hidden</strong>
                                </Pill>
                            </li>
                            <li>
                                • Desktop nav:{' '}
                                <Pill>
                                    hidden h-[58px] w-full items-center <strong>md:flex</strong>
                                </Pill>
                            </li>
                        </ul>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="info" title="Two components, not one shapeshifting component">
                            It is simpler and more maintainable to write two separate nav components and toggle which is visible. Do not try to morph a single component between mobile and desktop —
                            the code becomes unmaintainable.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <VisibilityDemo />
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <CodeBlock lang="html" highlight={['md:hidden', 'md:flex']}>
                    {`<!-- Resend.com's actual nav structure (extracted from HTML) -->

<!-- MOBILE nav — visible by default, hidden at md+ -->
<div class="flex w-full flex-col items-center md:hidden">
  <div class="flex w-full items-center px-6 py-4">
    <div class="flex-auto"><!-- Logo --></div>
    <div class="flex flex-auto justify-end">
      <!-- Hamburger button -->
      <button>☰</button>
    </div>
  </div>
  <!-- Mobile menu items (dropdown) -->
</div>

<!-- DESKTOP nav — hidden by default, shown at md+ -->
<div class="hidden h-[58px] w-full items-center md:flex">
  <div class="flex flex-1"><!-- Logo --></div>
  <!-- Horizontal nav links -->
  <a class="flex items-center mx-1 lg:mx-3">Docs</a>
  <a class="flex items-center mx-1 lg:mx-3">Blog</a>
  <!-- CTA button -->
  <a class="h-[58px] flex items-center lg:px-4">Sign In</a>
</div>`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

function FlexSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="05" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="violet">Flexbox</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Stack → Side by Side</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            The most common responsive pattern on the entire web: items <strong className="text-zinc-200">stack vertically</strong> on mobile and sit{' '}
                            <strong className="text-zinc-200">side-by-side</strong> on desktop. In Tailwind: default is <Pill>flex-col</Pill> (or block), override with <Pill>md:flex-row</Pill>.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">
                            Resend.com uses this everywhere for their feature sections: image on one side, text on the other. On mobile, image goes first (or last via <Pill>md:order-2</Pill>), text
                            below.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="tip" title="Use gap not margin for flex children">
                            Set gap on the parent flex container — <code className="text-xs">gap-6</code> or <code className="text-xs">md:gap-12</code>. This is cleaner than adding margin to each
                            child, and works correctly in both flex-col and flex-row directions.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <FlexDirectionDemo />
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <CodeBlock lang="html" highlight={['flex-col', 'md:flex-row', 'md:gap-12']}>
                    {`<!-- Stack on mobile, side-by-side on desktop -->
<div class="flex flex-col gap-8 md:flex-row md:gap-12 md:items-center">

  <!-- Image: full-width on mobile, half on desktop -->
  <div class="w-full md:w-1/2">
    <img src="..." alt="..." />
  </div>

  <!-- Text block -->
  <div class="w-full md:w-1/2 space-y-4">
    <h2 class="text-3xl md:text-4xl font-black">Feature headline</h2>
    <p class="text-zinc-400">Description text...</p>
    <button>Get started →</button>
  </div>

</div>

<!-- Reverse order on desktop: image on right, text on left -->
<div class="flex flex-col md:flex-row-reverse gap-8">
  <!-- Same children — reversed only at md+ -->
</div>`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

function GridSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="06" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="green">Grid</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Responsive Grid Columns</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            CSS Grid lets you define responsive column counts with a single chain of classes. Resend.com uses <Pill>sm:grid-cols-2</Pill>, <Pill>sm:grid-cols-3</Pill>,{' '}
                            <Pill>lg:grid-cols-3</Pill>, and even <Pill>lg:grid-cols-6</Pill> for its integration logo grid.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">
                            Default is always 1 column (no prefix). Add <Pill>sm:grid-cols-2</Pill> for 2 columns on mobile landscape, and <Pill>lg:grid-cols-3</Pill> for 3 on desktop. Click the
                            column counts in the demo to see how it looks.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="perf" title="Grid vs Flex — when to use which">
                            {'Use '}
                            <strong className="text-violet-300">Grid</strong>
                            {' when you have a defined number of columns and want items to align across rows (feature cards, image galleries). Use '}
                            <strong className="text-violet-300">Flexbox</strong>
                            {' when content should flow naturally and you don\u2019t need strict row alignment.'}
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <GridDemo />
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <CodeBlock lang="html" highlight={['grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-6']}>
                    {`<!-- Feature cards — 1 → 2 → 3 columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Email API</div>
  <div>Templates</div>
  <div>Analytics</div>
  <div>Webhooks</div>
  <div>Logs</div>
  <div>Team</div>
</div>

<!-- Resend.com integration logo grid — 2 → 3 → 6 columns -->
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
  <!-- 18 integration logos -->
</div>

<!-- Auto-fill: fill as many columns as fit at min 200px each -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
  <!-- No breakpoints needed — fills naturally -->
</div>`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

function TypographySection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="07" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="amber">Typography</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Fluid Type Scale</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            Headlines that look great on desktop can be overwhelming on a 375px phone. Resend.com scales every headline: small on mobile, large on desktop. The pattern is always{' '}
                            <Pill>text-[mobile-size] md:text-[desktop-size]</Pill>.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">
                            From resend.com&apos;s HTML: <Pill>md:text-[64px]</Pill>, <Pill>md:text-[48px]</Pill>, <Pill>md:leading-none</Pill>, <Pill>md:leading-tight</Pill>. The key insight:{' '}
                            <strong className="text-zinc-200">leading (line-height)</strong> also needs to scale — tight on large headlines, looser on small ones.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="tip" title="Use rem-based sizes for accessibility">
                            Tailwind&apos;s text scale uses <code className="text-xs">rem</code> units, which respect the user&apos;s browser font-size preference. Avoid{' '}
                            <code className="text-xs">px</code> for font sizes — it overrides accessibility settings.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <TypographyDemo />
                </FadeIn>
            </div>

            <FadeIn delay={0.2}>
                <CodeBlock lang="html" highlight={['md:text-', 'xl:text-', 'md:leading-']}>
                    {`<!-- Resend.com hero typography pattern -->

<!-- Main headline: grows significantly with screen size -->
<h1 class="text-4xl  md:text-6xl  xl:text-8xl
           font-black leading-tight md:leading-none
           tracking-tight">
  Send emails that<br/>convert.
</h1>

<!-- Subheadline: smaller step-up -->
<p class="text-base  md:text-lg  xl:text-xl
          text-zinc-400 leading-relaxed max-w-xl">
  The email API built for developers.
</p>

<!-- Section label: stays small, just subtle size bump -->
<span class="text-xs  md:text-sm
             font-mono uppercase tracking-widest text-zinc-500">
  Features
</span>

<!-- Common type scale (mobile → desktop):
  Hero:        text-3xl → md:text-5xl → xl:text-7xl
  H2:          text-2xl → md:text-4xl
  H3:          text-xl  → md:text-2xl
  Body:        text-sm  → md:text-base
  Caption:     text-xs  → text-xs (stays small)
-->`}
                </CodeBlock>
            </FadeIn>
        </section>
    );
}

function ShowHideSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="08" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="zinc">Visibility</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Show / Hide at Breakpoints</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            Some UI elements only make sense at certain sizes. Resend.com uses a precise combination of display utilities to toggle elements: <Pill>md:hidden</Pill>,{' '}
                            <Pill>md:block</Pill>, <Pill>md:flex</Pill>, and <Pill>md:inline</Pill>.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="space-y-2">
                            <p className="text-zinc-300 text-sm font-semibold">Patterns extracted from resend.com:</p>
                            <ul className="space-y-1.5 text-zinc-400 text-sm">
                                <li>
                                    {'• '}
                                    <Pill>md:hidden</Pill>
                                    {' — hides the mobile hamburger menu on desktop'}
                                </li>
                                <li>
                                    {'• '}
                                    <Pill>md:flex</Pill>
                                    {' — shows the full horizontal nav on desktop'}
                                </li>
                                <li>
                                    {'• '}
                                    <Pill>md:inline</Pill>
                                    {' — shows extra labels inline on larger screens'}
                                </li>
                                <li>
                                    {'• '}
                                    <Pill>sm:block</Pill>
                                    {" — reveals content that's hidden below sm breakpoint"}
                                </li>
                                <li>
                                    {'• '}
                                    <Pill>md:opacity-0</Pill>
                                    {' — fades an overlay only on desktop'}
                                </li>
                            </ul>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="warn" title="Don't hide content that users need">
                            Only hide decorative or duplicate elements. If content is hidden on mobile but visible on desktop, it means mobile users can&apos;t access it. Consider whether you really
                            need to hide it — or just stack it differently.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <div className="space-y-4">
                        <CodeBlock lang="html" highlight={['md:hidden', 'md:flex', 'md:block', 'md:inline']}>
                            {`<!-- Toggle between mobile + desktop elements -->

<!-- Hamburger: shows on mobile, hidden on desktop -->
<button class="block md:hidden">☰</button>

<!-- Desktop nav: hidden on mobile, flex on desktop -->
<nav class="hidden md:flex gap-6">
  <a>Docs</a>
  <a>Blog</a>
  <a>Pricing</a>
</nav>

<!-- Text that only appears on larger screens -->
<span class="hidden md:inline">
  Learn more about our API →
</span>

<!-- Element visible on mobile only -->
<div class="block md:hidden">
  Mobile-only banner
</div>`}
                        </CodeBlock>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

function SpacingSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="09" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Tag variant="sky">Spacing</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Responsive Padding & Gap</h2>
                </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                    <FadeIn delay={0.05}>
                        <p className="text-zinc-400 leading-relaxed">
                            Screen real estate grows as the viewport widens. Resend.com increases its breathing room at each breakpoint — smaller gaps on mobile, larger on desktop. This makes the
                            layout feel native to each device.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-zinc-400 leading-relaxed">
                            {'Real patterns from resend.com: '}
                            <Pill>sm:py-24</Pill>
                            {' for section padding, '}
                            <Pill>md:gap-4</Pill>
                            {', '}
                            <Pill>md:gap-8</Pill>
                            {', '}
                            <Pill>md:gap-12</Pill>
                            {' for flex/grid gaps, and '}
                            <Pill>px-6</Pill>
                            {' mobile padding that stays constant to protect content from edges.'}
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <Callout variant="tip" title="Section padding should always be responsive">
                            A section with <code className="text-xs">py-32</code> wastes space on mobile. Use <code className="text-xs">py-16 sm:py-24 lg:py-32</code> — mobile gets comfortable but not
                            wasteful spacing.
                        </Callout>
                    </FadeIn>
                </div>
                <FadeIn delay={0.1}>
                    <CodeBlock lang="html" highlight={['sm:py-', 'md:gap-', 'md:px-', 'lg:gap-']}>
                        {`<!-- Resend.com spacing patterns (extracted directly) -->

<!-- Section vertical padding: tight mobile, breathable desktop -->
<section class="py-12 sm:py-24 lg:py-32">

<!-- Grid gap: tight on mobile, airy on desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 lg:gap-12">

<!-- Container horizontal padding: always 24px on mobile -->
<div class="px-6 md:px-0">
  <!-- px-6 prevents content from touching screen edge on mobile  -->
  <!-- md:px-0 removes padding once the container handles width  -->
</div>

<!-- This page's own section padding: -->
<section class="px-6 md:px-12 xl:px-24">

<!-- Card internal padding: compact on mobile, generous on desktop -->
<div class="p-4 md:p-6 lg:p-8">
  Card content
</div>`}
                    </CodeBlock>
                </FadeIn>
            </div>
        </section>
    );
}

function SummarySection() {
    const steps = [
        { n: '01', title: 'Viewport meta tag', desc: 'Add it to every HTML page. Frameworks do it automatically.', tag: 'Foundation' },
        { n: '02', title: 'Mobile-first breakpoints', desc: 'Write default = mobile. Add md: lg: xl: to expand.', tag: 'Concept' },
        { n: '03', title: 'Fluid containers', desc: 'mx-auto + max-w-* + px-6 on every section wrapper.', tag: 'Layout' },
        { n: '04', title: 'Two navs, toggled', desc: 'md:hidden for mobile nav. md:flex for desktop nav.', tag: 'Navigation' },
        { n: '05', title: 'flex-col → md:flex-row', desc: 'Stack vertically on mobile, side-by-side on desktop.', tag: 'Flexbox' },
        { n: '06', title: 'grid-cols-1 → sm/lg cols', desc: 'Cards start as 1 column, expand at breakpoints.', tag: 'Grid' },
        { n: '07', title: 'Text scale up with screen', desc: 'text-3xl md:text-5xl xl:text-7xl for hero headlines.', tag: 'Typography' },
        { n: '08', title: 'md:hidden / md:flex', desc: 'Toggle element visibility without JavaScript.', tag: 'Visibility' },
        { n: '09', title: 'Responsive spacing', desc: 'py-12 sm:py-24 lg:py-32 — breathing room grows.', tag: 'Spacing' },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-16">
            <SectionNum n="10" />
            <FadeIn>
                <div className="flex flex-wrap items-center gap-3 mb-10">
                    <Tag variant="sky">Cheat Sheet</Tag>
                    <h2 className="text-3xl md:text-4xl font-black text-white">All 9 Patterns at a Glance</h2>
                </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {steps.map((step, i) => (
                    <FadeIn key={step.n} delay={i * 0.04}>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 h-full hover:border-sky-500/30 transition-colors">
                            <div className="flex items-start gap-3 mb-2">
                                <span className="font-mono text-[11px] text-sky-500/60 mt-0.5">{step.n}</span>
                                <div>
                                    <p className="text-zinc-200 font-semibold text-sm">{step.title}</p>
                                    <p className="text-zinc-500 text-[12px] mt-1 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn>
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6 md:p-8">
                    <h3 className="text-xl font-bold text-white mb-3">The Mental Model</h3>
                    <p className="text-zinc-400 leading-relaxed max-w-2xl">
                        Think of responsive design as <strong className="text-zinc-200">layers of overrides</strong>. Your base styles define the mobile experience. Each breakpoint adds a layer that
                        overrides just what needs to change — layout direction, column count, font size, visibility. Nothing else changes. This is how resend.com and every major site on the web is
                        built.
                    </p>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResponsivePage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white" style={NOISE_BG}>
            {/* Top fade */}
            <div className="pointer-events-none fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-zinc-950 to-transparent z-10" />

            <div className="max-w-6xl mx-auto">
                <HeroSection />
                <SectionRule />
                <ViewportSection />
                <SectionRule />
                <BreakpointSection />
                <SectionRule />
                <ContainerSection />
                <SectionRule />
                <NavSection />
                <SectionRule />
                <FlexSection />
                <SectionRule />
                <GridSection />
                <SectionRule />
                <TypographySection />
                <SectionRule />
                <ShowHideSection />
                <SectionRule />
                <SpacingSection />
                <SectionRule />
                <SummarySection />
            </div>

            {/* Bottom padding */}
            <div className="h-24" />
        </main>
    );
}
