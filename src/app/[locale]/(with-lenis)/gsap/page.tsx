'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';
import { cn } from '@/utils/cn';

gsap.registerPlugin(useGSAP, ScrollTrigger);

function SectionNum({ n }: { n: string }) {
    return (
        <span
            className="absolute -top-8 -left-2 font-black leading-none select-none pointer-events-none"
            style={{ color: 'rgba(99,102,241,0.05)', fontVariantNumeric: 'tabular-nums', fontSize: '144px' }}
        >
            {n}
        </span>
    );
}

function Tag({ children, variant = 'indigo' }: { children: React.ReactNode; variant?: 'indigo' | 'green' | 'rose' | 'zinc' | 'sky' | 'amber' | 'violet' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border',
                variant === 'indigo' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                variant === 'green' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                variant === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                variant === 'zinc' && 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40',
                variant === 'sky' && 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                variant === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                variant === 'violet' && 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            )}
            style={{ fontSize: '10px' }}
        >
            {children}
        </span>
    );
}

function GhostButton({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16, ease: E_OUT }}
            className={cn(
                'px-4 py-2 rounded-lg font-medium border transition-colors duration-150',
                active ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
            )}
            style={{ fontSize: '13px' }}
        >
            {children}
        </motion.button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GSAPPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1080px] mx-auto">
                <HeroSection />
                <WhyGSAPSection />
                <CoreMethodsSection />
                <EasingSection />
                <TimelineSection />
                <StaggerSection />
                <ScrollTriggerSection />
                <UseGSAPSection />
                <QuickToSection />
                <PerformanceSection />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '14px' }}>
                GSAP for Creative Engineers · The web&apos;s most capable animation library
            </footer>
        </main>
    );
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            gsap.from('.hero-char', {
                y: 80,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.025,
            });
            gsap.from('.hero-sub', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out',
                delay: 0.6,
            });
            gsap.from('.hero-tag', {
                y: 10,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                stagger: 0.08,
                delay: 0.9,
            });
        },
        { scope: containerRef },
    );

    const line1 = 'GSAP for';
    const line2 = 'Creative';
    const line3 = 'Engineers';

    return (
        <section ref={containerRef} className="relative px-6 md:px-12 xl:px-24 pt-32 pb-24 overflow-hidden">
            {/* Glow */}
            <div
                className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
                }}
            />

            <div className="mb-8 flex flex-wrap gap-2">
                {['Animation Library', 'ScrollTrigger', 'Timeline', 'React / Next.js'].map((t) => (
                    <span key={t} className="hero-tag px-3 py-1 rounded-full border border-indigo-500/25 text-indigo-400 font-mono" style={{ fontSize: '11px' }}>
                        {t}
                    </span>
                ))}
            </div>

            <h1 className="font-black leading-[1.02] tracking-tight mb-8" style={{ fontSize: 'clamp(44px, 7vw, 88px)' }}>
                {[line1, line2, line3].map((line, li) => (
                    <div key={li} className="overflow-hidden">
                        {line.split('').map((char, ci) => (
                            <span key={ci} className="hero-char inline-block" style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}>
                                {char}
                            </span>
                        ))}
                    </div>
                ))}
            </h1>

            <p className="hero-sub text-zinc-400 max-w-xl leading-relaxed" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>
                A hands-on guide to smooth, performant, production-ready animations using the GreenSock Animation Platform in Next.js. Every concept comes with a live demo.
            </p>
        </section>
    );
}

// ─── 2. Why GSAP ─────────────────────────────────────────────────────────────
const WHY_CARDS = [
    {
        icon: '⏱',
        title: 'Timeline control',
        desc: 'Sequence, pause, reverse, and seek through complex animation chains with surgical precision. No more delay-chain nightmares.',
        tag: 'core' as const,
        variant: 'indigo' as const,
    },
    {
        icon: '📜',
        title: 'Scroll-driven',
        desc: 'ScrollTrigger ties animations to scroll position — scrubbing, pinning, batch coordination. No IntersectionObserver boilerplate.',
        tag: 'scrolltrigger' as const,
        variant: 'sky' as const,
    },
    {
        icon: '🚀',
        title: 'Compositor-friendly',
        desc: 'Animates transform and opacity on the GPU compositor. No layout thrashing, no paint storms — stays at 60fps.',
        tag: 'performance' as const,
        variant: 'green' as const,
    },
    {
        icon: '⚛️',
        title: 'React / Next.js native',
        desc: 'useGSAP() handles all cleanup on unmount, scoped selectors, and SSR safety — all in one hook.',
        tag: 'react' as const,
        variant: 'violet' as const,
    },
];

function WhyGSAPSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <FadeIn>
                <Tag variant="indigo">Why GSAP</Tag>
                <h2 className="font-bold mt-3 mb-3" style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
                    The web&apos;s most capable animation platform
                </h2>
                <p className="text-zinc-400 mb-12 max-w-2xl leading-relaxed">
                    CSS transitions are fine for simple hover states. Framer Motion excels at declarative React animation. But when you need{' '}
                    <em className="text-zinc-300 not-italic">scroll storytelling, complex choreography, or runtime playback control</em>, GSAP is the professional standard.
                </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WHY_CARDS.map((card, i) => (
                    <FadeIn key={card.title} delay={i * 0.07}>
                        <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/30 h-full hover:border-zinc-700 transition-colors">
                            <div className="text-2xl mb-3">{card.icon}</div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-white">{card.title}</span>
                                <Tag variant={card.variant}>{card.tag}</Tag>
                            </div>
                            <p className="text-zinc-400" style={{ fontSize: '14px' }}>
                                {card.desc}
                            </p>
                        </div>
                    </FadeIn>
                ))}
            </div>

            {/* Install */}
            <FadeIn delay={0.2}>
                <div className="mt-8 border border-zinc-800 rounded-xl p-5">
                    <p className="text-zinc-400 mb-3 font-mono" style={{ fontSize: '12px' }}>
                        # Installation
                    </p>
                    <CodeBlock highlight={['npm install gsap', 'npm install @gsap/react']}>{`npm install gsap
npm install @gsap/react

# Then in your page / component:
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins once at module level (client-only file)
gsap.registerPlugin(useGSAP, ScrollTrigger);`}</CodeBlock>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 3. Core Methods ──────────────────────────────────────────────────────────
type CoreMethod = 'to' | 'from' | 'fromTo' | 'set';

const CORE_CODES: Record<CoreMethod, { code: string; highlight: string[] }> = {
    to: {
        code: `// gsap.to() — animate FROM current state TO target values
// Most common. GSAP reads the current state as the start.
gsap.to(".box", {
  x: 180,
  rotation: 360,
  duration: 1,
  ease: "power3.out",
});`,
        highlight: ['gsap.to'],
    },
    from: {
        code: `// gsap.from() — animate FROM values TO current state
// Great for entrance animations. Current state = destination.
gsap.from(".box", {
  x: 180,
  opacity: 0,
  scale: 0.3,
  duration: 1,
  ease: "back.out(1.7)",
});`,
        highlight: ['gsap.from'],
    },
    fromTo: {
        code: `// gsap.fromTo() — explicit start AND end values
// No ambiguity — full control. Useful in timelines.
gsap.fromTo(
  ".box",
  { x: -80, opacity: 0, scale: 0.5 },   // FROM
  { x: 120, opacity: 1, scale: 1,        // TO
    duration: 1.2, ease: "elastic.out(1, 0.4)" }
);`,
        highlight: ['gsap.fromTo'],
    },
    set: {
        code: `// gsap.set() — apply instantly (duration: 0)
// Use for initial states before an animation begins.
gsap.set(".box", {
  x: 150,
  rotation: 180,
  scale: 1.2,
  backgroundColor: "#818cf8",
});`,
        highlight: ['gsap.set'],
    },
};

function CoreMethodsSection() {
    const [method, setMethod] = useState<CoreMethod>('to');
    const containerRef = useRef<HTMLDivElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (!boxRef.current) return;
            gsap.killTweensOf(boxRef.current);

            switch (method) {
                case 'to':
                    gsap.set(boxRef.current, { x: 0, opacity: 1, scale: 1, rotation: 0, backgroundColor: '#6366f1' });
                    gsap.to(boxRef.current, { x: 180, rotation: 360, duration: 1, ease: 'power3.out' });
                    break;
                case 'from':
                    gsap.set(boxRef.current, { x: 0, opacity: 1, scale: 1, rotation: 0, backgroundColor: '#8b5cf6' });
                    gsap.from(boxRef.current, { x: 180, opacity: 0, scale: 0.3, duration: 1, ease: 'back.out(1.7)' });
                    break;
                case 'fromTo':
                    gsap.set(boxRef.current, { backgroundColor: '#06b6d4' });
                    gsap.fromTo(boxRef.current, { x: -80, opacity: 0, scale: 0.5 }, { x: 120, opacity: 1, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.4)' });
                    break;
                case 'set':
                    gsap.set(boxRef.current, { x: 0, opacity: 1, scale: 1, rotation: 0, backgroundColor: '#6366f1' });
                    setTimeout(() => {
                        gsap.set(boxRef.current!, {
                            x: 150,
                            rotation: 180,
                            scale: 1.2,
                            backgroundColor: '#818cf8',
                        });
                    }, 100);
                    break;
            }
        },
        { scope: containerRef, dependencies: [method] },
    );

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="01" />
                <FadeIn>
                    <Tag variant="green">Core API</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        The four tween methods
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                        Every animation in GSAP starts with a tween. Choose the method based on how much you know about the start and end states. Click each to see it live.
                    </p>
                </FadeIn>

                {/* Interactive Demo */}
                <div ref={containerRef} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20">
                    {/* Viewport */}
                    <div className="h-40 flex items-center px-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d0d18 0%, #0f0f1a 100%)' }}>
                        {/* Guide line */}
                        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-px border-t border-dashed border-zinc-800" />
                        <div
                            ref={boxRef}
                            className="w-12 h-12 rounded-xl relative z-10 flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                            }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="p-4 border-t border-zinc-800 flex flex-wrap gap-2">
                        {(['to', 'from', 'fromTo', 'set'] as CoreMethod[]).map((m) => (
                            <GhostButton key={m} onClick={() => setMethod(m)} active={method === m}>
                                gsap.{m}()
                            </GhostButton>
                        ))}
                    </div>

                    {/* Code */}
                    <div className="p-4 border-t border-zinc-800">
                        <CodeBlock highlight={CORE_CODES[method].highlight}>{CORE_CODES[method].code}</CodeBlock>
                    </div>
                </div>

                {/* Transform aliases + tween control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <FadeIn>
                        <div className="border border-zinc-800 rounded-xl p-5 h-full">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag variant="indigo">transforms</Tag>
                                <span className="text-white font-medium">Transform aliases</span>
                            </div>
                            <p className="text-zinc-400 mb-3" style={{ fontSize: '13px' }}>
                                Always use GSAP&apos;s transform aliases. They&apos;re applied in a consistent order, stay on the compositor, and are faster than raw CSS strings.
                            </p>
                            <CodeBlock highlight={['x,', 'y,', 'scale', 'rotation', 'autoAlpha']}>{`gsap.to(".el", {
  x: 100,          // translateX (px)
  y: -50,          // translateY (px)
  xPercent: 50,    // translateX (%)
  scale: 1.2,      // scaleX + scaleY
  rotation: 45,    // rotate (deg)
  autoAlpha: 0,    // opacity + visibility
});
// autoAlpha: 0 also sets visibility:hidden
// so the element can't accidentally block clicks`}</CodeBlock>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.07}>
                        <div className="border border-zinc-800 rounded-xl p-5 h-full">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag variant="amber">control</Tag>
                                <span className="text-white font-medium">Runtime tween control</span>
                            </div>
                            <p className="text-zinc-400 mb-3" style={{ fontSize: '13px' }}>
                                Every GSAP method returns a Tween instance. Store it when you need pause, seek, or reverse functionality.
                            </p>
                            <CodeBlock highlight={['const tween = gsap.to']}>{`const tween = gsap.to(".box", {
  x: 200,
  duration: 2,
  repeat: -1,
  yoyo: true,
});

tween.pause();
tween.play();
tween.reverse();
tween.progress(0.5);  // seek to 50%
tween.time(1.2);      // seek to 1.2s
tween.kill();         // destroy`}</CodeBlock>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

// ─── 4. Easing ────────────────────────────────────────────────────────────────
const EASES = [
    { name: 'power1.out', label: 'power1.out', color: '#818cf8' },
    { name: 'power3.out', label: 'power3.out', color: '#6366f1' },
    { name: 'back.out(1.7)', label: 'back.out', color: '#8b5cf6' },
    { name: 'elastic.out(1, 0.4)', label: 'elastic.out', color: '#a78bfa' },
    { name: 'bounce.out', label: 'bounce.out', color: '#7c3aed' },
    { name: 'expo.out', label: 'expo.out', color: '#4f46e5' },
    { name: 'sine.inOut', label: 'sine.inOut', color: '#6d28d9' },
    { name: 'none', label: 'linear', color: '#4338ca' },
];

function EasingSection() {
    const [activeEase, setActiveEase] = useState('power3.out');
    const containerRef = useRef<HTMLDivElement>(null);
    const ballRef = useRef<HTMLDivElement>(null);

    const currentEase = EASES.find((e) => e.name === activeEase) ?? EASES[1];

    useGSAP(
        () => {
            if (!ballRef.current) return;
            gsap.killTweensOf(ballRef.current);
            gsap.fromTo(ballRef.current, { x: 0 }, { x: 260, duration: 1.4, ease: activeEase });
        },
        { scope: containerRef, dependencies: [activeEase] },
    );

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="02" />
                <FadeIn>
                    <Tag variant="sky">Easing</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        Easing makes animation feel alive
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                        The ease controls the <em className="text-zinc-300 not-italic">rate of change over time</em>. It&apos;s the single biggest factor in whether an animation feels mechanical or
                        natural. Click to compare.
                    </p>
                </FadeIn>

                <div ref={containerRef} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20">
                    {/* Ball track */}
                    <div className="h-28 flex items-center px-10 relative" style={{ background: 'linear-gradient(135deg, #0d0d18 0%, #0f0f1a 100%)' }}>
                        {/* Track */}
                        <div className="absolute left-10 right-10 h-px border-t border-dashed border-zinc-800" />
                        {/* Trail dots */}
                        <div
                            className="absolute left-10 right-10 h-px"
                            style={{
                                background: `linear-gradient(90deg, ${currentEase.color}30 0%, transparent 100%)`,
                            }}
                        />
                        <div
                            ref={ballRef}
                            className="w-8 h-8 rounded-full flex-shrink-0 relative z-10"
                            style={{
                                background: `radial-gradient(circle at 35% 35%, ${currentEase.color}, ${currentEase.color}99)`,
                                boxShadow: `0 0 20px ${currentEase.color}60`,
                            }}
                        />
                    </div>

                    {/* Ease buttons */}
                    <div className="p-4 border-t border-zinc-800 flex flex-wrap gap-2">
                        {EASES.map((ease) => (
                            <GhostButton key={ease.name} onClick={() => setActiveEase(ease.name)} active={activeEase === ease.name}>
                                {ease.label}
                            </GhostButton>
                        ))}
                    </div>

                    {/* Code */}
                    <div className="p-4 border-t border-zinc-800">
                        <CodeBlock highlight={[`ease: "${activeEase}"`]}>{`gsap.to(".ball", {
  x: 260,
  duration: 1.4,
  ease: "${activeEase}",
});`}</CodeBlock>
                    </div>
                </div>

                {/* Reference */}
                <FadeIn>
                    <div className="mt-8 border border-zinc-800 rounded-xl p-5">
                        <p className="text-zinc-300 font-medium mb-4">Ease quick reference</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { ease: 'power1–4 .in / .out / .inOut', desc: 'Polynomial curves — everyday workhorse' },
                                { ease: 'back.out(1.7)', desc: 'Overshoot — great for entrances' },
                                { ease: 'elastic.out(1, 0.3)', desc: 'Spring-like — use sparingly for personality' },
                                { ease: 'bounce.out', desc: 'Physical bounce — UI feedback feel' },
                                { ease: 'expo.in / expo.out', desc: 'Very steep — dramatic reveals & exits' },
                                { ease: 'none', desc: 'Linear — scrub animations, mechanical motion' },
                            ].map(({ ease, desc }) => (
                                <div key={ease} className="flex gap-3" style={{ fontSize: '13px' }}>
                                    <code className="text-indigo-400 font-mono shrink-0" style={{ fontSize: '11px' }}>
                                        {ease}
                                    </code>
                                    <span className="text-zinc-500">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 5. Timeline ──────────────────────────────────────────────────────────────
function TimelineSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const [status, setStatus] = useState<'idle' | 'playing' | 'reversed'>('idle');

    useGSAP(
        () => {
            const tl = gsap.timeline({
                paused: true,
                defaults: { duration: 0.6, ease: 'power3.out' },
                onComplete: () => setStatus('idle'),
                onReverseComplete: () => setStatus('idle'),
            });

            tl.from('.tl-a', { x: -60, opacity: 0 })
                .from('.tl-b', { y: 40, opacity: 0, scale: 0.8 }, '-=0.35')
                .from('.tl-c', { x: 60, opacity: 0 }, '-=0.35')
                .to('.tl-a', { rotation: 360, duration: 0.5, ease: 'back.out(2)' }, '+=0.15')
                .to('.tl-b', { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 }, '<')
                .to('.tl-c', { y: -18, duration: 0.4, yoyo: true, repeat: 1 }, '<');

            tlRef.current = tl;
        },
        { scope: containerRef },
    );

    const play = () => {
        tlRef.current?.play();
        setStatus('playing');
    };
    const pause = () => {
        tlRef.current?.pause();
        setStatus('idle');
    };
    const reverse = () => {
        tlRef.current?.reverse();
        setStatus('reversed');
    };
    const restart = () => {
        tlRef.current?.restart();
        setStatus('playing');
    };

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="03" />
                <FadeIn>
                    <Tag variant="violet">Timeline</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        Choreograph with timelines
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                        Timelines let you sequence multiple animations with <em className="text-zinc-300 not-italic">precise timing control</em>. The position parameter is the key — it determines
                        where each tween lands relative to the previous one.
                    </p>
                </FadeIn>

                <div ref={containerRef} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20">
                    {/* Stage */}
                    <div className="h-48 flex items-center justify-center gap-8" style={{ background: 'linear-gradient(135deg, #0d0d18, #0f0f1a)' }}>
                        {[
                            { cls: 'tl-a', label: '.a', bg: 'linear-gradient(135deg, #6366f1, #818cf8)' },
                            { cls: 'tl-b', label: '.b', bg: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
                            { cls: 'tl-c', label: '.c', bg: 'linear-gradient(135deg, #06b6d4, #67e8f9)' },
                        ].map(({ cls, label, bg }) => (
                            <div
                                key={cls}
                                className={`${cls} w-16 h-16 rounded-xl flex items-center justify-center font-mono font-bold text-white`}
                                style={{ background: bg, fontSize: '13px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="p-4 border-t border-zinc-800 flex flex-wrap gap-2 items-center">
                        <GhostButton onClick={play} active={status === 'playing'}>
                            ▶ Play
                        </GhostButton>
                        <GhostButton onClick={pause}>⏸ Pause</GhostButton>
                        <GhostButton onClick={reverse} active={status === 'reversed'}>
                            ◀ Reverse
                        </GhostButton>
                        <GhostButton onClick={restart}>↺ Restart</GhostButton>
                        <span className="ml-auto text-zinc-700 font-mono" style={{ fontSize: '11px' }}>
                            status: <span className="text-zinc-500">{status}</span>
                        </span>
                    </div>

                    {/* Code */}
                    <div className="p-4 border-t border-zinc-800">
                        <CodeBlock highlight={['gsap.timeline', 'defaults:', '"-=0.35"', '"<"', '"+=0.15"']}>{`const tl = gsap.timeline({
  paused: true,
  defaults: { duration: 0.6, ease: "power3.out" }, // inherited by all children
});

// Each tween overlaps the previous by 0.35s ("-=0.35")
tl.from(".a", { x: -60, opacity: 0 })
  .from(".b", { y: 40,  opacity: 0, scale: 0.8 }, "-=0.35")
  .from(".c", { x:  60, opacity: 0 },              "-=0.35")

// "< " = starts at the same time as the previous tween
  .to(".a", { rotation: 360, ease: "back.out(2)" }, "+=0.15")
  .to(".b", { scale: 1.2, yoyo: true, repeat: 1 }, "<")
  .to(".c", { y: -18,   yoyo: true, repeat: 1 },   "<");

tl.play();`}</CodeBlock>
                    </div>
                </div>

                {/* Position parameter cheat sheet */}
                <FadeIn>
                    <div className="mt-8 border border-zinc-800 rounded-xl p-5">
                        <p className="text-zinc-300 font-medium mb-4">Position parameter cheat sheet</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { pos: '0', desc: 'Absolute time — at 0s (start of timeline)' },
                                { pos: '"+=0.3"', desc: '0.3s after the previous animation ends' },
                                { pos: '"-=0.3"', desc: '0.3s before the previous animation ends (overlap)' },
                                { pos: '"<"', desc: 'Starts at the same time as previous animation' },
                                { pos: '"<0.2"', desc: '0.2s after the previous animation starts' },
                                { pos: '"myLabel"', desc: 'At a named label added with addLabel()' },
                            ].map(({ pos, desc }) => (
                                <div key={pos} className="flex gap-3" style={{ fontSize: '13px' }}>
                                    <code className="text-indigo-400 font-mono shrink-0 w-24 text-right" style={{ fontSize: '11px' }}>
                                        {pos}
                                    </code>
                                    <span className="text-zinc-500">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 6. Stagger ───────────────────────────────────────────────────────────────
const STAGGER_MODES = [
    { label: 'start → end', from: 'start' },
    { label: 'center out', from: 'center' },
    { label: 'edges in', from: 'edges' },
    { label: 'random', from: 'random' },
] as const;

const GRID_COUNT = 32;

function StaggerSection() {
    const [mode, setMode] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            gsap.fromTo(
                '.stagger-item',
                { opacity: 0.1, y: 14, scale: 0.8 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.45,
                    ease: 'back.out(1.5)',
                    stagger: { each: 0.06, from: STAGGER_MODES[mode].from },
                },
            );
        },
        { scope: containerRef, dependencies: [mode] },
    );

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="04" />
                <FadeIn>
                    <Tag variant="amber">Stagger</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        Animate many as one
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                        Instead of creating separate tweens with manual delays, stagger offsets a single animation across multiple elements. The <code className="text-amber-400">from</code> option
                        controls where the stagger wave originates.
                    </p>
                </FadeIn>

                <div ref={containerRef} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20">
                    {/* Grid */}
                    <div className="p-8" style={{ background: 'linear-gradient(135deg, #0d0d18, #0f0f1a)' }}>
                        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                            {Array.from({ length: GRID_COUNT }).map((_, i) => (
                                <div
                                    key={i}
                                    className="stagger-item aspect-square rounded-lg"
                                    style={{
                                        background: `hsl(${240 + i * 4}, 55%, ${42 + (i % 5) * 4}%)`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-4 border-t border-zinc-800 flex flex-wrap gap-2">
                        {STAGGER_MODES.map((m, i) => (
                            <GhostButton key={m.label} onClick={() => setMode(i)} active={mode === i}>
                                {m.label}
                            </GhostButton>
                        ))}
                    </div>

                    {/* Code */}
                    <div className="p-4 border-t border-zinc-800">
                        <CodeBlock highlight={['stagger:']}>{`gsap.fromTo(".item",
  { opacity: 0, y: 14, scale: 0.8 },
  {
    opacity: 1, y: 0, scale: 1,
    duration: 0.45,
    ease: "back.out(1.5)",
    stagger: {
      each: 0.06,
      from: "${STAGGER_MODES[mode].from}",  // "${STAGGER_MODES[mode].label}"
    },
  }
);`}</CodeBlock>
                    </div>
                </div>

                <FadeIn>
                    <div className="mt-6 border border-zinc-800 rounded-xl p-5">
                        <p className="text-zinc-300 font-medium mb-3">Stagger config options</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { key: 'each: 0.1', desc: 'Fixed delay between each element' },
                                { key: 'amount: 1', desc: 'Total time distributed across all elements' },
                                { key: 'from: "center"', desc: 'Wave origin: start | center | edges | random | end' },
                                { key: 'grid: "auto"', desc: 'For 2D grids — stagger radiates from origin' },
                            ].map(({ key, desc }) => (
                                <div key={key} className="flex gap-3" style={{ fontSize: '13px' }}>
                                    <code className="text-amber-400 font-mono shrink-0" style={{ fontSize: '11px' }}>
                                        {key}
                                    </code>
                                    <span className="text-zinc-500">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 7. ScrollTrigger ─────────────────────────────────────────────────────────
function ScrollTriggerSection() {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [triggered, setTriggered] = useState(false);

    useGSAP(
        () => {
            if (!scrollerRef.current || !contentRef.current) return;

            // Use inner scroller to avoid Lenis conflicts
            ScrollTrigger.create({
                trigger: contentRef.current,
                scroller: scrollerRef.current,
                start: 'top 75%',
                onEnter: () => {
                    setTriggered(true);
                    gsap.from('.st-card', {
                        y: 30,
                        opacity: 0,
                        stagger: 0.1,
                        duration: 0.65,
                        ease: 'power3.out',
                    });
                },
                onLeaveBack: () => {
                    setTriggered(false);
                    gsap.set('.st-card', { y: 30, opacity: 0 });
                },
            });
        },
        { scope: scrollerRef },
    );

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="05" />
                <FadeIn>
                    <Tag variant="sky">ScrollTrigger</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        Scroll-driven animation
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                        ScrollTrigger ties any GSAP animation to the scroll position. Trigger on enter, scrub progress directly to scroll, or pin elements for immersive scroll storytelling.
                    </p>
                </FadeIn>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Inner scroll demo */}
                    <FadeIn>
                        <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                                    Scroll inside this container ↓
                                </span>
                                {triggered && (
                                    <span className="ml-auto text-emerald-400 font-mono" style={{ fontSize: '11px' }}>
                                        triggered ✓
                                    </span>
                                )}
                            </div>
                            <div
                                ref={scrollerRef}
                                className="overflow-y-scroll"
                                style={{
                                    height: '320px',
                                    background: 'linear-gradient(180deg, #0d0d18 0%, #0f0f1a 100%)',
                                }}
                            >
                                <div className="flex items-center justify-center text-zinc-700 font-mono" style={{ height: '180px', fontSize: '12px' }}>
                                    ↓ scroll down to trigger
                                </div>
                                <div ref={contentRef} className="px-6 pb-6 space-y-3">
                                    {['Trigger on enter', 'Scrub to scroll progress', 'Pin sections', 'Batch many elements'].map((text) => (
                                        <div key={text} className="st-card border border-zinc-700/60 rounded-xl px-4 py-3 text-zinc-300" style={{ fontSize: '14px', opacity: 0 }}>
                                            {text}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ height: '80px' }} />
                            </div>
                        </div>
                    </FadeIn>

                    {/* Code */}
                    <FadeIn delay={0.07}>
                        <CodeBlock highlight={['scrollTrigger', 'scrub:', 'pin:', 'toggleActions']}>{`// Register once at module level
gsap.registerPlugin(ScrollTrigger);

// 1. Trigger on enter
gsap.from(".card", {
  y: 30, opacity: 0, stagger: 0.1,
  scrollTrigger: {
    trigger: ".section",
    start: "top 75%",
    toggleActions: "play none none reverse",
  },
});

// 2. Scrub — tied to scroll progress
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "+=1200",
    scrub: 1,    // smooth lag (seconds)
    pin: true,   // freeze element during range
  },
});
tl.to(".title", { y: -80, opacity: 0 })
  .to(".bg",    { scale: 1.3 }, "<");`}</CodeBlock>
                    </FadeIn>
                </div>

                {/* toggleActions */}
                <FadeIn>
                    <div className="mt-6 border border-zinc-800 rounded-xl p-5">
                        <p className="text-zinc-300 font-medium mb-1">
                            <code className="text-sky-400">toggleActions</code>: &quot;onEnter onLeave onEnterBack onLeaveBack&quot;
                        </p>
                        <p className="text-zinc-500 mb-4" style={{ fontSize: '13px' }}>
                            Each accepts: play, pause, resume, reset, restart, complete, reverse, none
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { val: '"play none none none"', desc: 'Play once on enter (default)' },
                                { val: '"play none none reverse"', desc: 'Play forward, reverse on scroll back' },
                                { val: '"play pause resume none"', desc: 'Pause on leave, resume on re-enter' },
                                { val: '"restart none none reset"', desc: 'Restart on enter, reset on scroll back' },
                            ].map(({ val, desc }) => (
                                <div key={val} className="flex flex-col gap-1" style={{ fontSize: '13px' }}>
                                    <code className="text-sky-400 font-mono" style={{ fontSize: '11px' }}>
                                        {val}
                                    </code>
                                    <span className="text-zinc-500">{desc}</span>
                                </div>
                            ))}
                        </div>

                        {/* Scrub vs toggleActions */}
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-2 items-start">
                            <span className="text-rose-400 text-sm shrink-0">!</span>
                            <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                                Never use <code className="text-rose-400">scrub</code> and <code className="text-rose-400">toggleActions</code> on the same ScrollTrigger — scrub wins and toggleActions
                                is ignored.
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 8. useGSAP in React ──────────────────────────────────────────────────────
function UseGSAPSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="06" />
                <FadeIn>
                    <Tag variant="rose">React</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        useGSAP — the right way in Next.js
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                        The <code className="text-rose-400">useGSAP()</code> hook from <code className="text-zinc-300">@gsap/react</code> is the only hook you need. It handles automatic cleanup on
                        unmount, scoped selectors, and SSR safety for Next.js.
                    </p>
                </FadeIn>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FadeIn>
                        <div className="space-y-4">
                            <div className="border border-zinc-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag variant="green">recommended</Tag>
                                    <span className="text-white font-medium">useGSAP hook</span>
                                </div>
                                <CodeBlock highlight={['useGSAP', 'scope: container']}>{`'use client';  // required in Next.js App Router

import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP);

function Card() {
  const container = useRef(null);

  useGSAP(() => {
    // ✅ Scoped to this component only
    gsap.from(".box", { y: 30, opacity: 0 });
  }, { scope: container }); // 👈 always pass scope!

  return (
    <div ref={container}>
      <div className="box">Hello</div>
    </div>
  );
}`}</CodeBlock>
                            </div>

                            <div className="border border-zinc-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag variant="amber">reactive</Tag>
                                    <span className="text-white font-medium">Re-run on state change</span>
                                </div>
                                <CodeBlock highlight={['dependencies:', 'revertOnUpdate:']}>{`const [speed, setSpeed] = useState(1);

useGSAP(() => {
  gsap.to(".box", {
    x: 100,
    duration: 1 / speed,
  });
}, {
  scope: container,
  dependencies: [speed],    // re-runs when speed changes
  revertOnUpdate: true,     // reverts before re-running
});`}</CodeBlock>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.07}>
                        <div className="space-y-4">
                            <div className="border border-zinc-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag variant="sky">event handlers</Tag>
                                    <span className="text-white font-medium">contextSafe callbacks</span>
                                </div>
                                <CodeBlock highlight={['contextSafe']}>{`useGSAP((_, contextSafe) => {
  // ✅ Runs at setup — auto-cleaned on unmount
  gsap.from(".card", { opacity: 0 });

  // Event handlers run AFTER setup.
  // Wrap in contextSafe so GSAP cleans up
  // when the component unmounts.
  const onClick = contextSafe(() => {
    gsap.to(".card", { rotation: 360 });
  });

  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}, { scope: container });`}</CodeBlock>
                            </div>

                            <div className="border border-zinc-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag variant="zinc">alternative</Tag>
                                    <span className="text-white font-medium">useEffect + gsap.context</span>
                                </div>
                                <CodeBlock highlight={['gsap.context', 'ctx.revert()']}>{`// When @gsap/react isn't available
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from(".box", { y: 30, opacity: 0 });
  }, containerRef); // 👈 scope

  // Always return the cleanup!
  return () => ctx.revert();
}, []);`}</CodeBlock>
                            </div>

                            <div className="border border-rose-500/20 rounded-xl p-5 bg-rose-500/5">
                                <p className="text-rose-400 font-medium mb-3" style={{ fontSize: '13px' }}>
                                    Common mistakes
                                </p>
                                <ul className="space-y-2 text-zinc-400" style={{ fontSize: '13px' }}>
                                    {[
                                        'Selector without scope — can match elements outside the component',
                                        'Missing ctx.revert() in useEffect cleanup — causes memory leaks',
                                        'Event handlers outside contextSafe — animations not cleaned up',
                                        'gsap.* at module level without use client — breaks SSR in Next.js',
                                    ].map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <span className="text-rose-500 shrink-0">✕</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                {/* matchMedia */}
                <FadeIn>
                    <div className="mt-6 border border-zinc-800 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Tag variant="violet">accessibility</Tag>
                            <span className="text-white font-medium">Respect prefers-reduced-motion</span>
                        </div>
                        <p className="text-zinc-400 mb-4" style={{ fontSize: '13px' }}>
                            <code className="text-violet-400">gsap.matchMedia()</code> automatically reverts animations when the media query stops matching — perfect for responsive breakpoints and
                            motion preferences.
                        </p>
                        <CodeBlock highlight={['gsap.matchMedia', 'reduceMotion', 'duration: 0']}>{`const mm = gsap.matchMedia();

mm.add(
  {
    isDesktop:    "(min-width: 1024px)",
    reduceMotion: "(prefers-reduced-motion: reduce)",
  },
  (ctx) => {
    const { isDesktop, reduceMotion } = ctx.conditions!;

    gsap.to(".panel", {
      x: isDesktop ? 200 : 0,
      duration: reduceMotion ? 0 : 1, // skip animation if user prefers
    });
  }
);

// In React component cleanup:
return () => mm.revert();`}</CodeBlock>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 9. quickTo / Mouse follower ─────────────────────────────────────────────
function QuickToSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (!cursorRef.current || !ringRef.current || !containerRef.current) return;

            const xDot = gsap.quickTo(cursorRef.current, 'x', { duration: 0.15, ease: 'power3.out' });
            const yDot = gsap.quickTo(cursorRef.current, 'y', { duration: 0.15, ease: 'power3.out' });
            const xRing = gsap.quickTo(ringRef.current, 'x', { duration: 0.5, ease: 'power2.out' });
            const yRing = gsap.quickTo(ringRef.current, 'y', { duration: 0.5, ease: 'power2.out' });

            const el = containerRef.current;

            const onMove = (e: MouseEvent) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                xDot(x);
                yDot(y);
                xRing(x);
                yRing(y);
            };

            el.addEventListener('mousemove', onMove);
            return () => el.removeEventListener('mousemove', onMove);
        },
        { scope: containerRef },
    );

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="07" />
                <FadeIn>
                    <Tag variant="green">quickTo</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        Mouse follower with quickTo
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                        For properties updated on every pointer event, use <code className="text-emerald-400">gsap.quickTo()</code> instead of creating a new tween on each{' '}
                        <code className="text-zinc-300">mousemove</code>. It reuses a single tween internally — thousands of tweens avoided.
                    </p>
                </FadeIn>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Demo */}
                    <FadeIn>
                        <div
                            ref={containerRef}
                            className="border border-zinc-800 rounded-2xl overflow-hidden relative cursor-none select-none"
                            style={{
                                height: '300px',
                                background: 'radial-gradient(ellipse at 50% 50%, #0f1020 0%, #080810 100%)',
                            }}
                        >
                            {/* Dot grid */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)',
                                    backgroundSize: '28px 28px',
                                }}
                            />

                            <p className="absolute top-4 left-0 right-0 text-center text-zinc-600 font-mono pointer-events-none" style={{ fontSize: '12px' }}>
                                move your mouse here
                            </p>

                            {/* Outer ring — slow */}
                            <div
                                ref={ringRef}
                                className="absolute pointer-events-none"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    border: '1px solid rgba(99,102,241,0.4)',
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    top: 0,
                                    left: 0,
                                }}
                            />

                            {/* Inner dot — fast */}
                            <div
                                ref={cursorRef}
                                className="absolute pointer-events-none"
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    background: '#6366f1',
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    top: 0,
                                    left: 0,
                                    boxShadow: '0 0 12px rgba(99,102,241,0.8)',
                                }}
                            />
                        </div>
                    </FadeIn>

                    {/* Code */}
                    <FadeIn delay={0.07}>
                        <CodeBlock highlight={['gsap.quickTo', 'xDot(', 'yDot(', 'xRing(', 'yRing(']}>{`// Two cursors: fast dot + slow ring
// Each has a different duration for depth

const xDot  = gsap.quickTo(dotRef.current, "x", { duration: 0.15 });
const yDot  = gsap.quickTo(dotRef.current, "y", { duration: 0.15 });
const xRing = gsap.quickTo(ringRef.current, "x", { duration: 0.5 });
const yRing = gsap.quickTo(ringRef.current, "y", { duration: 0.5 });

container.addEventListener("mousemove", (e) => {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  xDot(x);  yDot(y);   // fast snap
  xRing(x); yRing(y);  // slow follow
});

// ❌ What NOT to do — creates a new tween every frame
container.addEventListener("mousemove", (e) => {
  gsap.to(cursor, { x: e.clientX }); // 60 new tweens/second!
});`}</CodeBlock>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

// ─── 10. Performance ─────────────────────────────────────────────────────────
const PERF_TIPS = [
    {
        icon: '⚡',
        title: 'Transforms, not layout',
        desc: 'x/y/scale/rotation stay on the compositor. width/height/top/left cause layout recalculation and paint.',
        code: `// ✅ Compositor-only — stays at 60fps
gsap.to(".el", { x: 100, scale: 1.2, opacity: 0.5 });

// ❌ Triggers layout + paint on every frame
gsap.to(".el", { left: 100, width: 200, marginTop: 20 });

// Rule: if you can achieve it with a transform, use the transform.
// x/y instead of left/top
// scale instead of width/height`,
        variant: 'green' as const,
    },
    {
        icon: '🎯',
        title: 'quickTo for frequent updates',
        desc: 'Mouse followers, sliders, real-time values — quickTo reuses one tween instead of creating thousands.',
        code: `// ✅ Create setters once, call on every event
const xTo = gsap.quickTo(el, "x", { duration: 0.3, ease: "power3" });
const yTo = gsap.quickTo(el, "y", { duration: 0.3, ease: "power3" });

window.addEventListener("mousemove", (e) => {
  xTo(e.clientX);  // reuses the same tween
  yTo(e.clientY);
});

// ❌ Creates a brand-new tween 60x per second
window.addEventListener("mousemove", (e) => {
  gsap.to(el, { x: e.clientX, y: e.clientY }); // expensive!
});`,
        variant: 'sky' as const,
    },
    {
        icon: '🧹',
        title: 'Always clean up',
        desc: 'Stray tweens and ScrollTriggers keep running after navigation. useGSAP reverts everything automatically.',
        code: `// ✅ useGSAP auto-reverts on unmount — preferred
useGSAP(() => {
  gsap.to(".box", { x: 100 });
  ScrollTrigger.create({ ... });
  // All cleaned up when component unmounts
}, { scope: container });

// ✅ Manual cleanup via gsap.context
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", { x: 100 });
  }, containerRef);
  return () => ctx.revert(); // 👈 critical
}, []);`,
        variant: 'violet' as const,
    },
    {
        icon: '📦',
        title: 'Stagger over many tweens',
        desc: 'One stagger call is more efficient than 50 individual tweens with manual delays.',
        code: `// ✅ One tween for all 50 items
gsap.to(".item", {
  opacity: 1,
  y: 0,
  stagger: 0.05,  // offset each by 50ms
  duration: 0.5,
});

// ❌ 50 separate tweens
items.forEach((el, i) => {
  gsap.to(el, { opacity: 1, y: 0, delay: i * 0.05 });
});

// Also: consider ScrollTrigger.batch() for
// scroll-triggered lists — one pass per viewport.`,
        variant: 'amber' as const,
    },
];

function PerformanceSection() {
    const [active, setActive] = useState(0);

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="08" />
                <FadeIn>
                    <Tag variant="rose">Performance</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        Stay at 60fps
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">GSAP is fast, but wrong property choices still cause jank. These four rules keep animations smooth on any device.</p>
                </FadeIn>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {PERF_TIPS.map((tip, i) => (
                        <FadeIn key={tip.title} delay={i * 0.05}>
                            <button
                                onClick={() => setActive(i)}
                                className={cn(
                                    'w-full h-full text-left border rounded-xl p-5 transition-colors',
                                    active === i ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700',
                                )}
                            >
                                <div className="text-xl mb-3">{tip.icon}</div>
                                <div className="text-white font-medium mb-2" style={{ fontSize: '13px' }}>
                                    {tip.title}
                                </div>
                                <div className="text-zinc-500" style={{ fontSize: '12px' }}>
                                    {tip.desc}
                                </div>
                            </button>
                        </FadeIn>
                    ))}
                </div>

                <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <CodeBlock>{PERF_TIPS[active].code}</CodeBlock>
                </motion.div>
            </div>
        </section>
    );
}

// ─── 11. Checklist ───────────────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
    { text: 'gsap.registerPlugin() called before any plugin is used', category: 'setup' },
    { text: "File has 'use client' directive (Next.js App Router)", category: 'setup' },
    { text: 'useGSAP() used instead of bare useEffect for animations', category: 'react' },
    { text: 'scope passed to useGSAP — isolates component selectors', category: 'react' },
    { text: 'Event handlers wrapped in contextSafe()', category: 'react' },
    { text: 'Animating x/y/scale/rotation instead of left/top/width/height', category: 'perf' },
    { text: 'quickTo used for mouse follower or frequently updated props', category: 'perf' },
    { text: 'ScrollTrigger placed on top-level tween/timeline, not child tweens', category: 'scrolltrigger' },
    { text: 'scrub and toggleActions not used together on same trigger', category: 'scrolltrigger' },
    { text: 'markers: false (or removed) in production build', category: 'scrolltrigger' },
    { text: 'gsap.matchMedia() used to respect prefers-reduced-motion', category: 'a11y' },
];

const CATEGORY_COLORS = {
    setup: 'indigo',
    react: 'rose',
    perf: 'green',
    scrolltrigger: 'sky',
    a11y: 'violet',
} as const;

function ChecklistSection() {
    const [checked, setChecked] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));
    const score = checked.filter(Boolean).length;
    const pct = Math.round((score / CHECKLIST_ITEMS.length) * 100);

    const toggle = (i: number) => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)));

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="09" />
                <FadeIn>
                    <Tag variant="green">Checklist</Tag>
                    <h2 className="font-bold mt-3 mb-2" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
                        Production readiness
                    </h2>
                    <p className="text-zinc-400 mb-10 max-w-2xl leading-relaxed">Check these before shipping any GSAP animation to production.</p>
                </FadeIn>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Checks */}
                    <div className="space-y-2">
                        {CHECKLIST_ITEMS.map((item, i) => (
                            <FadeIn key={item.text} delay={i * 0.025}>
                                <button
                                    onClick={() => toggle(i)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors',
                                        checked[i] ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300',
                                    )}
                                    style={{ fontSize: '13px' }}
                                >
                                    <span
                                        className={cn(
                                            'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                                            checked[i] ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600',
                                        )}
                                    >
                                        {checked[i] && (
                                            <span className="text-white font-bold" style={{ fontSize: '9px' }}>
                                                ✓
                                            </span>
                                        )}
                                    </span>
                                    <span className="flex-1">{item.text}</span>
                                    <Tag variant={CATEGORY_COLORS[item.category]}>{item.category}</Tag>
                                </button>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Score */}
                    <FadeIn delay={0.3}>
                        <div className="border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center sticky top-8">
                            <motion.div
                                className="font-black leading-none mb-3"
                                style={{
                                    fontSize: '80px',
                                    color: pct === 100 ? '#10b981' : pct >= 60 ? '#6366f1' : '#52525b',
                                }}
                                animate={{ scale: [1, 1.06, 1] }}
                                key={score}
                                transition={{ duration: 0.3 }}
                            >
                                {pct}%
                            </motion.div>
                            <p className="text-zinc-400 mb-1" style={{ fontSize: '14px' }}>
                                {score} of {CHECKLIST_ITEMS.length} checks
                            </p>
                            <p className="text-zinc-600 mb-8" style={{ fontSize: '12px' }}>
                                {pct === 100 ? '🎉 Ready to ship!' : pct >= 70 ? 'Almost there' : 'Keep going'}
                            </p>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                    }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.4, ease: E_OUT }}
                                />
                            </div>

                            {pct < 100 && (
                                <button
                                    onClick={() => setChecked(CHECKLIST_ITEMS.map(() => false))}
                                    className="mt-6 text-zinc-600 hover:text-zinc-400 transition-colors font-mono"
                                    style={{ fontSize: '11px' }}
                                >
                                    reset
                                </button>
                            )}
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}
