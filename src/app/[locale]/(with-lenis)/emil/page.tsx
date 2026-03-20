'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

import { cn } from '@/utils/cn';

// ─── Emil's recommended easing curves ───────────────────────────────────────
const E_OUT = [0.23, 1, 0.32, 1] as const;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const E_IN_OUT = [0.77, 0, 0.175, 1] as const;

// ─── Noise texture (matches HeroBackground pattern) ─────────────────────────
const NOISE_BG = {
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'repeat' as const,
    backgroundSize: '128px',
};

// ─── Shared atoms ────────────────────────────────────────────────────────────
// NOTE: All font sizes use explicit px (not rem) because this project sets
//       html { font-size: dynamicOnWidth(10px, 1920px) } — 1rem ≈ 7.5px at 1440px.

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, ease: E_OUT, delay }} className={className}>
            {children}
        </motion.div>
    );
}

function SectionNum({ n }: { n: string }) {
    return (
        <span
            className="absolute -top-8 -left-2 font-black leading-none select-none pointer-events-none"
            style={{ color: 'rgba(245,158,11,0.04)', fontVariantNumeric: 'tabular-nums', fontSize: '144px' }}
        >
            {n}
        </span>
    );
}

function Tag({ children, variant = 'amber' }: { children: React.ReactNode; variant?: 'amber' | 'green' | 'rose' | 'zinc' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border',
                variant === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                variant === 'green' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                variant === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                variant === 'zinc' && 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40',
            )}
            style={{ fontSize: '10px' }}
        >
            {children}
        </span>
    );
}

// Button with Emil's active:scale(0.97) principle applied
function DemoButton({ children, variant = 'primary', className, onClick }: { children: React.ReactNode; variant?: 'primary' | 'ghost'; className?: string; onClick?: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16, ease: E_OUT }}
            className={cn(
                'px-5 py-2.5 rounded-lg font-medium transition-colors duration-150',
                variant === 'primary' && 'bg-amber-500 text-black hover:bg-amber-400',
                variant === 'ghost' && 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800',
                className,
            )}
            style={{ fontSize: '14px' }}
        >
            {children}
        </motion.button>
    );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
    return (
        <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 font-mono text-zinc-300 overflow-x-auto leading-relaxed" style={{ fontSize: '12px' }}>
            {children}
        </pre>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function EmilPage() {
    return (
        <main className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1080px] mx-auto">
                <HeroSection />
                <PhilosophySection />
                <AnimationFrameworkSection />
                <EasingSection />
                <DurationSection />
                <ComponentPolishSection />
                <StaggerSection />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '14px' }}>
                Emil Kowalski · Design Engineering · All unseen details compound
            </footer>
        </main>
    );
}

// ─── 1. Hero ─────────────────────────────────────────────────────────────────
function HeroSection() {
    const words = ['The', 'Invisible', 'Details'];
    return (
        <section className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-12 xl:px-24 pt-32 pb-20">
            <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: E_OUT, delay: 0.1 }}
                className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-6"
                style={{ fontSize: '11px' }}
            >
                Design Engineering · Emil Kowalski
            </motion.p>

            {/* Title with word stagger — clamp uses px so it's viewport-relative, not rem */}
            <h1 className="flex flex-wrap gap-x-5 gap-y-2 font-black leading-[0.9] tracking-tight mb-8" style={{ fontSize: 'clamp(56px, 10vw, 144px)' }}>
                {words.map((word, i) => (
                    <motion.span
                        key={word}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: E_OUT, delay: 0.2 + i * 0.1 }}
                        className={i === 1 ? 'text-amber-400' : 'text-white'}
                    >
                        {word}
                    </motion.span>
                ))}
            </h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: E_OUT, delay: 0.6 }}
                className="text-zinc-400 max-w-2xl leading-relaxed"
                style={{ fontSize: '18px' }}
            >
                A living reference for UI craft — how to make interfaces that feel right without users knowing why.
            </motion.p>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 0.8 }}
                style={{ transformOrigin: 'left' }}
                className="mt-16 h-px bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent"
            />

            <motion.blockquote
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mt-8 text-zinc-500 italic max-w-xl leading-relaxed"
                style={{ fontSize: '14px' }}
            >
                &ldquo;All those unseen details combine to produce something that&apos;s just stunning, like a thousand barely audible voices all singing in tune.&rdquo;
                <br />
                <cite className="not-italic text-zinc-600" style={{ fontSize: '12px' }}>
                    — Paul Graham
                </cite>
            </motion.blockquote>
        </section>
    );
}

// ─── 2. Philosophy ───────────────────────────────────────────────────────────
function PhilosophySection() {
    const principles = [
        {
            n: '01',
            title: 'Taste is trained',
            body: "Good taste is not personal preference. It's a trained instinct — the ability to see beyond the obvious and recognize what elevates. Developed by surrounding yourself with great work and practicing relentlessly.",
            tag: 'Mindset',
        },
        {
            n: '02',
            title: 'Unseen details compound',
            body: 'Most details users never consciously notice. That is the point. When a feature functions exactly as someone assumes it should, they proceed without thought. A thousand invisible correctnesses create interfaces people love without knowing why.',
            tag: 'Craft',
        },
        {
            n: '03',
            title: 'Beauty is leverage',
            body: 'People select tools based on the overall experience, not just functionality. Good defaults and good animations are real differentiators. Beauty is underutilized in software — use it as leverage to stand out.',
            tag: 'Strategy',
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24">
            <FadeIn>
                <p className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-3" style={{ fontSize: '11px' }}>
                    Core Philosophy
                </p>
                <h2 className="font-bold tracking-tight mb-14" style={{ fontSize: '36px' }}>
                    Three principles that guide everything.
                </h2>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-5">
                {principles.map(({ n, title, body, tag }, i) => (
                    <FadeIn key={n} delay={i * 0.1}>
                        <motion.div
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2, ease: E_OUT }}
                            className="relative group bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 overflow-hidden h-full"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent" />
                            <span className="font-black leading-none text-zinc-800 select-none" style={{ fontSize: '64px' }}>
                                {n}
                            </span>
                            <div className="mt-3 mb-2">
                                <Tag variant="amber">{tag}</Tag>
                            </div>
                            <h3 className="font-semibold text-white mt-3 mb-3" style={{ fontSize: '18px' }}>
                                {title}
                            </h3>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                {body}
                            </p>
                        </motion.div>
                    </FadeIn>
                ))}
            </div>
        </section>
    );
}

// ─── 3. Animation Framework ──────────────────────────────────────────────────
function AnimationFrameworkSection() {
    const [active, setActive] = useState<number | null>(null);

    const rows = [
        { freq: '100+ times/day', example: 'keyboard shortcuts, command palette', decision: 'No animation. Ever.', variant: 'rose' as const },
        { freq: 'Tens of times/day', example: 'hover effects, list navigation', decision: 'Remove or drastically reduce', variant: 'rose' as const },
        { freq: 'Occasional', example: 'modals, drawers, toasts', decision: 'Standard animation', variant: 'green' as const },
        { freq: 'Rare / first-time', example: 'onboarding, celebrations', decision: 'Can add delight', variant: 'amber' as const },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="03" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-3" style={{ fontSize: '11px' }}>
                        Animation Decision Framework
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Should this animate at all?
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        The first question before writing any animation code. Frequency of use is the determining factor — not preference.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                        <div
                            className="grid grid-cols-[1.2fr_1.8fr_1.5fr] bg-zinc-900/80 border-b border-zinc-800 font-mono tracking-[0.15em] uppercase text-zinc-500 px-6 py-3"
                            style={{ fontSize: '11px' }}
                        >
                            <span>Frequency</span>
                            <span>Examples</span>
                            <span>Decision</span>
                        </div>
                        {rows.map((row, i) => (
                            <motion.div
                                key={row.freq}
                                onClick={() => setActive(active === i ? null : i)}
                                whileTap={{ scale: 0.995 }}
                                transition={{ duration: 0.12, ease: E_OUT }}
                                className={cn(
                                    'grid grid-cols-[1.2fr_1.8fr_1.5fr] items-center px-6 py-4 cursor-pointer border-b border-zinc-800/60 last:border-0 transition-colors duration-150',
                                    active === i ? 'bg-amber-500/5' : 'hover:bg-zinc-900/50',
                                )}
                            >
                                <span className="font-medium text-white" style={{ fontSize: '14px' }}>
                                    {row.freq}
                                </span>
                                <span className="text-zinc-500 pr-4" style={{ fontSize: '14px' }}>
                                    {row.example}
                                </span>
                                <Tag variant={row.variant}>{row.decision}</Tag>
                            </motion.div>
                        ))}
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="mt-6 bg-amber-500/5 border border-amber-500/15 rounded-xl px-6 py-5">
                        <p className="text-amber-300/80 leading-relaxed" style={{ fontSize: '14px' }}>
                            <strong className="text-amber-400">Critical:</strong> Never animate keyboard-initiated actions. These repeat hundreds of times daily. Raycast has no open/close animation —
                            that is the optimal experience for something used hundreds of times a day.
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── Easing race track — extracted so each track can measure its own width ────
type EasingTrackProps = {
    label: string;
    sublabel: string;
    color: string;
    note: string;
    ease: 'easeIn' | 'easeOut' | [number, number, number, number];
    replayKey: number;
};

function EasingTrack({ label, sublabel, color, note, ease, replayKey }: EasingTrackProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    // inView triggers once when the track scrolls into view
    const inView = useInView(trackRef, { once: true, margin: '-60px' });
    const [targetX, setTargetX] = useState(0);

    // Measure the track width after mount (useLayoutEffect = synchronous before paint)
    // Target: dot (24px) should end 6px from the right edge → targetX = trackWidth - 24 - 6
    useLayoutEffect(() => {
        if (trackRef.current) {
            setTargetX(trackRef.current.offsetWidth - 30);
        }
    }, []);

    // The animation key changes when the section first enters view OR user hits Replay.
    // Before inView is true, the ball stays at its initial position.
    const animKey = `${inView}-${replayKey}`;

    return (
        <div>
            <div className="flex items-center gap-3 mb-3">
                <code className="font-mono text-zinc-400" style={{ fontSize: '12px' }}>
                    {label}
                </code>
                <span className="text-zinc-600" style={{ fontSize: '12px' }}>
                    {sublabel}
                </span>
            </div>

            {/* Track — no overflow-hidden so the dot isn't clipped at start */}
            <div ref={trackRef} className="relative bg-zinc-800/50 rounded-full" style={{ height: '36px' }}>
                {/* Centre line */}
                <div className="absolute inset-0 flex items-center px-3">
                    <div className="w-full h-px bg-zinc-700/50" />
                </div>

                {/* Dot — vertical centering via top + margin, not Tailwind translate
                    (Framer Motion's x transform would override Tailwind's -translate-y-1/2) */}
                {targetX > 0 && (
                    <motion.div
                        key={animKey}
                        className="absolute rounded-full"
                        style={{
                            width: '24px',
                            height: '24px',
                            top: '6px', // (36 - 24) / 2 = 6px
                            left: 0,
                            background: color,
                            boxShadow: `0 0 12px ${color}60`,
                        }}
                        initial={{ x: 6 }}
                        animate={inView ? { x: targetX } : { x: 6 }}
                        transition={{ duration: 1.2, ease, delay: 0.15 }}
                    />
                )}
            </div>

            <p className="text-zinc-600 mt-2" style={{ fontSize: '12px' }}>
                {note}
            </p>
        </div>
    );
}

// ─── 4. Easing ───────────────────────────────────────────────────────────────
function EasingSection() {
    const [replayKey, setReplayKey] = useState(0);

    const demos: EasingTrackProps[] = [
        { label: 'ease-in', sublabel: '← Avoid for UI', ease: 'easeIn', color: '#f87171', note: 'Starts slow — user sees no immediate response', replayKey: 0 },
        { label: 'ease-out', sublabel: '← Good', ease: 'easeOut', color: '#4ade80', note: 'Starts fast — instant feedback, then settles', replayKey: 0 },
        {
            label: 'cubic-bezier(0.23, 1, 0.32, 1)',
            sublabel: '← Best',
            ease: [0.23, 1, 0.32, 1],
            color: '#fbbf24',
            note: 'Custom strong ease-out — punchy and intentional',
            replayKey: 0,
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="04" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-3" style={{ fontSize: '11px' }}>
                        Easing Curves
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Easing is the soul of animation.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        The built-in CSS easings are too weak — they lack the punch that makes animations feel intentional. At 200ms, ease-out <em>feels</em> faster than ease-in because the user sees
                        immediate movement.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 space-y-8">
                        {demos.map((d) => (
                            <EasingTrack key={d.label} {...d} replayKey={replayKey} />
                        ))}

                        <DemoButton variant="ghost" onClick={() => setReplayKey((k) => k + 1)}>
                            ↺ Replay
                        </DemoButton>
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="mt-8 grid md:grid-cols-3 gap-4">
                        {[
                            { name: '--ease-out', value: 'cubic-bezier(0.23, 1, 0.32, 1)', use: 'Entering / UI interactions' },
                            { name: '--ease-in-out', value: 'cubic-bezier(0.77, 0, 0.175, 1)', use: 'On-screen movement' },
                            { name: '--ease-drawer', value: 'cubic-bezier(0.32, 0.72, 0, 1)', use: 'iOS-like drawers' },
                        ].map((c) => (
                            <div key={c.name} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                                <p className="text-amber-400 font-mono mb-1" style={{ fontSize: '12px' }}>
                                    {c.name}
                                </p>
                                <p className="text-zinc-300 font-mono mb-2" style={{ fontSize: '12px' }}>
                                    {c.value}
                                </p>
                                <p className="text-zinc-500" style={{ fontSize: '12px' }}>
                                    {c.use}
                                </p>
                            </div>
                        ))}
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 5. Duration ─────────────────────────────────────────────────────────────
function DurationSection() {
    const timings = [
        { label: 'Button press feedback', min: 100, max: 160, note: 'Instant physical feel' },
        { label: 'Tooltips & small popovers', min: 125, max: 200, note: 'Quick reveal' },
        { label: 'Dropdowns & selects', min: 150, max: 250, note: 'Standard UI' },
        { label: 'Modals & drawers', min: 200, max: 500, note: 'Spatial context' },
    ];
    const MAX = 500;

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="05" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-3" style={{ fontSize: '11px' }}>
                        Duration Reference
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        UI animations must stay under 300ms.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        A 180ms dropdown feels more responsive than a 400ms one. Speed in animation directly affects how users <em>perceive</em> performance.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="space-y-5">
                        {timings.map(({ label, min, max, note }, i) => (
                            <div key={label}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-white font-medium" style={{ fontSize: '14px' }}>
                                        {label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-zinc-400" style={{ fontSize: '12px' }}>
                                            {min}–{max}ms
                                        </span>
                                        <span className="text-zinc-600" style={{ fontSize: '12px' }}>
                                            {note}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative bg-zinc-800 rounded-full overflow-hidden" style={{ height: '8px' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${(((max - min) / 2 + min) / MAX) * 100}%` }}
                                        viewport={{ once: true, margin: '-40px' }}
                                        transition={{ duration: 0.8, ease: E_OUT, delay: i * 0.08 }}
                                        className="absolute top-0 h-full rounded-full bg-gradient-to-r from-amber-500/80 to-amber-400"
                                        style={{ marginLeft: `${(min / MAX) * 100}%`, width: `${((max - min) / MAX) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {/* 300ms rule marker */}
                        <div className="relative" style={{ height: '20px' }}>
                            <div className="absolute top-0 h-full border-l border-dashed border-amber-500/30" style={{ left: `${(300 / MAX) * 100}%` }}>
                                <span className="absolute left-2 top-0 font-mono text-amber-500/60" style={{ fontSize: '10px' }}>
                                    300ms limit
                                </span>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 6. Component Polish ─────────────────────────────────────────────────────
function ComponentPolishSection() {
    const [entryKey, setEntryKey] = useState(0);

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="06" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-3" style={{ fontSize: '11px' }}>
                        Component Polish
                    </p>
                    <h2 className="font-bold tracking-tight mb-14" style={{ fontSize: '36px' }}>
                        Two rules that change everything.
                    </h2>
                </FadeIn>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Demo 1: Button press */}
                    <FadeIn>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 h-full">
                            <Tag variant="amber">Button Press</Tag>
                            <h3 className="font-semibold mt-4 mb-2" style={{ fontSize: '18px' }}>
                                Press both buttons.
                            </h3>
                            <p className="text-zinc-400 mb-7 leading-relaxed" style={{ fontSize: '14px' }}>
                                <code className="text-amber-400 font-mono">scale(0.97)</code> on <code className="font-mono text-zinc-300">:active</code> makes the UI feel like it&apos;s truly
                                listening.
                            </p>

                            <div className="flex items-center gap-5 mb-7">
                                <div className="flex flex-col items-center gap-3">
                                    <button className="px-5 py-2.5 bg-zinc-700 text-white rounded-lg font-medium transition-colors hover:bg-zinc-600 active:bg-zinc-600" style={{ fontSize: '14px' }}>
                                        Without
                                    </button>
                                    <Tag variant="rose">no feedback</Tag>
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ duration: 0.16, ease: E_OUT }}
                                        className="px-5 py-2.5 bg-amber-500 text-black rounded-lg font-medium"
                                        style={{ fontSize: '14px' }}
                                    >
                                        With scale
                                    </motion.button>
                                    <Tag variant="green">responsive ✓</Tag>
                                </div>
                            </div>

                            <CodeBlock>{`/* CSS */
.button { transition: transform 160ms ease-out; }
.button:active { transform: scale(0.97); }

/* Framer Motion */
<motion.button
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.16, ease: [0.23,1,0.32,1] }}
/>`}</CodeBlock>
                        </div>
                    </FadeIn>

                    {/* Demo 2: Entry animation — no AnimatePresence needed, both always visible */}
                    <FadeIn delay={0.1}>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 h-full">
                            <Tag variant="amber">Entry Animation</Tag>
                            <h3 className="font-semibold mt-4 mb-2" style={{ fontSize: '18px' }}>
                                Nothing appears from nothing.
                            </h3>
                            <p className="text-zinc-400 mb-7 leading-relaxed" style={{ fontSize: '14px' }}>
                                Never start from <code className="text-rose-400 font-mono">scale(0)</code>. Start from <code className="text-emerald-400 font-mono">scale(0.95)</code> +{' '}
                                <code className="text-emerald-400 font-mono">opacity: 0</code>.
                            </p>

                            <div className="flex items-start gap-5 mb-6">
                                <div className="flex flex-col items-center gap-3 flex-1">
                                    <motion.div
                                        key={`bad-${entryKey}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.35, ease: E_OUT }}
                                        className="w-full bg-rose-900/30 border border-rose-800/40 rounded-xl flex items-center justify-center"
                                        style={{ aspectRatio: '16/9' }}
                                    >
                                        <span className="text-rose-400 font-mono" style={{ fontSize: '12px' }}>
                                            scale(0)
                                        </span>
                                    </motion.div>
                                    <Tag variant="rose">jarring ✗</Tag>
                                </div>

                                <div className="flex flex-col items-center gap-3 flex-1">
                                    <motion.div
                                        key={`good-${entryKey}`}
                                        initial={{ scale: 0.92, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.35, ease: E_OUT }}
                                        className="w-full bg-emerald-900/20 border border-emerald-800/30 rounded-xl flex items-center justify-center"
                                        style={{ aspectRatio: '16/9' }}
                                    >
                                        <span className="text-emerald-400 font-mono" style={{ fontSize: '12px' }}>
                                            scale(0.95)
                                        </span>
                                    </motion.div>
                                    <Tag variant="green">natural ✓</Tag>
                                </div>
                            </div>

                            <DemoButton variant="ghost" onClick={() => setEntryKey((k) => k + 1)}>
                                ↺ Replay
                            </DemoButton>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

// ─── 7. Stagger ──────────────────────────────────────────────────────────────
function StaggerSection() {
    const [key, setKey] = useState(0);
    const items = ['Research', 'Wireframe', 'Prototype', 'Test', 'Iterate', 'Ship'];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="07" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-3" style={{ fontSize: '11px' }}>
                        Stagger Animations
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Cascade feels natural. Simultaneous feels broken.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        When multiple elements enter together, stagger their appearance by 40–60ms each. Keep it short — long delays make the UI feel slow.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-semibold text-zinc-300" style={{ fontSize: '14px' }}>
                                    Without stagger
                                </h3>
                                <Tag variant="rose">all at once</Tag>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {items.map((item) => (
                                    <motion.div
                                        key={`no-stagger-${key}-${item}`}
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.35, ease: E_OUT, delay: 0 }}
                                        className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-3 py-3 text-center text-zinc-400 font-medium"
                                        style={{ fontSize: '12px' }}
                                    >
                                        {item}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-semibold text-zinc-300" style={{ fontSize: '14px' }}>
                                    With stagger (50ms)
                                </h3>
                                <Tag variant="green">cascades ✓</Tag>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {items.map((item, i) => (
                                    <motion.div
                                        key={`stagger-${key}-${item}`}
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.35, ease: E_OUT, delay: i * 0.05 }}
                                        className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-3 text-center text-amber-300 font-medium"
                                        style={{ fontSize: '12px' }}
                                    >
                                        {item}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <DemoButton variant="ghost" onClick={() => setKey((k) => k + 1)}>
                            ↺ Replay both
                        </DemoButton>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 8. Checklist ────────────────────────────────────────────────────────────
function ChecklistSection() {
    const rows = [
        { issue: '`transition: all`', fix: 'Specify exact properties — `transition: transform 200ms ease-out`' },
        { issue: '`scale(0)` entry', fix: 'Start from `scale(0.95)` with `opacity: 0`' },
        { issue: '`ease-in` on UI element', fix: 'Switch to `ease-out` or custom cubic-bezier' },
        { issue: '`transform-origin: center` on popover', fix: 'Use Radix/Base UI CSS variable (modals exempt)' },
        { issue: 'Animation on keyboard action', fix: 'Remove entirely — never animate keyboard shortcuts' },
        { issue: 'Duration > 300ms on UI', fix: 'Reduce to 150–250ms range' },
        { issue: 'Hover without media query', fix: 'Gate: `@media (hover: hover) and (pointer: fine)`' },
        { issue: 'Keyframes on rapid-trigger', fix: 'Use CSS transitions — they retarget smoothly' },
        { issue: 'Framer Motion `x`/`y` under load', fix: 'Use `transform: "translateX()"` for GPU acceleration' },
        { issue: 'Same enter/exit speed', fix: 'Exit faster: enter 2s → exit 200ms' },
        { issue: 'All elements appear at once', fix: 'Add 30–80ms stagger delay between items' },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="08" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-amber-500/70 mb-3" style={{ fontSize: '11px' }}>
                        Review Checklist
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Eleven issues to catch before shipping.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        Run every UI animation through this list. Each row represents a mistake with a measurable impact on perceived quality.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_2fr] bg-zinc-900/80 border-b border-zinc-800 font-mono tracking-[0.15em] uppercase text-zinc-500 px-6 py-3" style={{ fontSize: '11px' }}>
                            <span>Issue</span>
                            <span>Fix</span>
                        </div>
                        {rows.map(({ issue, fix }, i) => (
                            <motion.div
                                key={issue}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, margin: '-20px' }}
                                transition={{ duration: 0.4, ease: E_OUT, delay: i * 0.04 }}
                                className="grid grid-cols-[1fr_2fr] items-start gap-4 px-6 py-4 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40 transition-colors"
                            >
                                <code className="text-rose-400/80 font-mono bg-rose-950/20 px-2 py-1 rounded self-start" style={{ fontSize: '12px' }}>
                                    {issue}
                                </code>
                                <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '14px' }}>
                                    {fix}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="mt-10 grid md:grid-cols-2 gap-5">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                            <Tag variant="green">Performance</Tag>
                            <h3 className="font-semibold text-white mt-3 mb-3" style={{ fontSize: '16px' }}>
                                Only animate transform and opacity.
                            </h3>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                These properties skip layout and paint, running on the GPU. Animating <code className="text-zinc-300 font-mono">padding</code>,{' '}
                                <code className="text-zinc-300 font-mono">height</code>, or <code className="text-zinc-300 font-mono">width</code> triggers all three rendering steps.
                            </p>
                        </div>

                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                            <Tag variant="amber">Accessibility</Tag>
                            <h3 className="font-semibold text-white mt-3 mb-3" style={{ fontSize: '16px' }}>
                                Respect prefers-reduced-motion.
                            </h3>
                            <p className="text-zinc-400 leading-relaxed mb-4" style={{ fontSize: '14px' }}>
                                Reduced motion means fewer and gentler animations — not zero. Keep opacity and color transitions. Remove position and movement animations.
                            </p>
                            <CodeBlock>{`@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 0.2s ease; }
}`}</CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.25}>
                    <div className="mt-5 bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                        <Tag variant="zinc">Springs</Tag>
                        <h3 className="font-semibold text-white mt-3 mb-3" style={{ fontSize: '16px' }}>
                            Use springs for drag, gestures, and anything that should feel alive.
                        </h3>
                        <p className="text-zinc-400 leading-relaxed mb-4" style={{ fontSize: '14px' }}>
                            Springs simulate real physics — they settle based on parameters, not fixed durations. They maintain velocity when interrupted, making them ideal for gestures.
                        </p>
                        <CodeBlock>{`// Apple's approach (recommended)
{ type: "spring", duration: 0.5, bounce: 0.2 }

// Keep bounce subtle (0.1–0.3)
// Avoid bounce in most UI contexts
// Use for: drag-to-dismiss, playful interactions`}</CodeBlock>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}
