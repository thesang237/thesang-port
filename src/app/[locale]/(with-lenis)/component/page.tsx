'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

import { CodeBlock } from '@/components/code-block';
import { cn } from '@/utils/cn';

// ─── Shared easing ────────────────────────────────────────────────────────────
const E_OUT = [0.23, 1, 0.32, 1] as const;

const NOISE_BG = {
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'repeat' as const,
    backgroundSize: '128px',
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
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

function Callout({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warn' | 'tip' }) {
    return (
        <div
            className={cn(
                'rounded-lg border px-4 py-3 leading-relaxed',
                variant === 'info' && 'bg-sky-500/5 border-sky-500/20 text-sky-300',
                variant === 'warn' && 'bg-amber-500/5 border-amber-500/20 text-amber-300',
                variant === 'tip' && 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300',
            )}
            style={{ fontSize: '13px' }}
        >
            {children}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComponentPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1080px] mx-auto">
                <HeroSection />
                <MentalModelSection />
                <AnatomySection />
                <CssVarsSection />
                <DataAttributesSection />
                <BleedTrickSection />
                <SwipeGestureSection />
                <SnapPointsSection />
                <LiveDemoSection />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '14px' }}>
                Build a Drawer · Design Engineering · Pattern over library
            </footer>
        </main>
    );
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
    const words = ['Build', 'a', 'Drawer'];
    return (
        <section className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-12 xl:px-24 pt-32 pb-20">
            <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: E_OUT, delay: 0.1 }}
                className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-6"
                style={{ fontSize: '11px' }}
            >
                Component Deep-Dive · Design Engineering
            </motion.p>

            <h1 className="flex flex-wrap gap-x-5 gap-y-2 font-black leading-[0.9] tracking-tight mb-8" style={{ fontSize: 'clamp(48px, 9vw, 120px)' }}>
                {words.map((word, i) => (
                    <motion.span
                        key={word + i}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: E_OUT, delay: 0.2 + i * 0.1 }}
                        className={i === 0 ? 'text-indigo-400' : 'text-white'}
                    >
                        {word}
                    </motion.span>
                ))}
            </h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: E_OUT, delay: 0.7 }}
                className="text-zinc-400 max-w-2xl leading-relaxed"
                style={{ fontSize: '18px' }}
            >
                A practical architecture guide — not a tutorial, not a library walkthrough. You will understand every CSS variable, data attribute, and gesture mechanic behind a production-quality
                drawer so you can build your own from scratch.
            </motion.p>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 0.9 }}
                style={{ transformOrigin: 'left' }}
                className="mt-16 h-px bg-gradient-to-r from-indigo-500/40 via-indigo-500/10 to-transparent"
            />

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="mt-8 flex flex-wrap gap-2">
                {['Context + Composition', 'CSS Custom Properties', 'Data Attributes', 'Swipe Gestures', 'Snap Points', 'Bleed Trick'].map((t) => (
                    <Tag key={t} variant="zinc">
                        {t}
                    </Tag>
                ))}
            </motion.div>
        </section>
    );
}

// ─── 2. Mental Model ──────────────────────────────────────────────────────────
function MentalModelSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="01" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    Mental Model
                </p>
                <h2 className="font-black tracking-tight text-white mb-6" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    A Drawer is a Dialog with swipe
                </h2>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-10" style={{ fontSize: '16px' }}>
                    Start with a <strong className="text-white">Dialog</strong>: open/close state, focus trap, backdrop, portal. Then layer on gesture tracking and CSS-variable-driven animation. That
                    separation keeps complexity manageable — the dialog handles accessibility, the swipe layer handles physics.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-4 mb-10">
                {[
                    {
                        title: 'Dialog layer',
                        body: 'Open/close state, focus trap, ARIA roles, Escape key, scroll lock, backdrop',
                        tag: 'Accessibility',
                        tagVariant: 'green' as const,
                        icon: '♿',
                    },
                    {
                        title: 'Gesture layer',
                        body: 'Touch/pointer events → swipe progress → CSS custom properties updated on every frame',
                        tag: 'Interaction',
                        tagVariant: 'sky' as const,
                        icon: '👆',
                    },
                    {
                        title: 'Animation layer',
                        body: 'CSS transitions reading those custom properties. No JS on the paint thread.',
                        tag: 'Performance',
                        tagVariant: 'amber' as const,
                        icon: '✨',
                    },
                ].map(({ title, body, tag, tagVariant, icon }) => (
                    <FadeIn key={title}>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 h-full">
                            <div className="text-2xl mb-3">{icon}</div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-white" style={{ fontSize: '14px' }}>
                                    {title}
                                </span>
                                <Tag variant={tagVariant}>{tag}</Tag>
                            </div>
                            <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '13px' }}>
                                {body}
                            </p>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn>
                <Callout variant="tip">
                    <strong>Rule of thumb:</strong> If you do not need swipe-to-dismiss or snap points, use a positioned Dialog with a slide-in CSS animation. Drawers are dialogs{' '}
                    <em>plus gestures</em>. Do not add the gesture layer until you need it.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 3. Anatomy ───────────────────────────────────────────────────────────────
function AnatomySection() {
    const parts = [
        { name: 'Root', role: 'State owner. Holds open/close, swipe direction, snap points.', color: 'text-indigo-400' },
        { name: 'Trigger', role: 'Opens the drawer. Any button. Connected via context.', color: 'text-sky-400' },
        { name: 'Portal', role: 'Renders children into document.body. Keeps z-index sane.', color: 'text-violet-400' },
        { name: 'Backdrop', role: 'Fixed overlay. Opacity tied to --drawer-swipe-progress.', color: 'text-zinc-400' },
        { name: 'Viewport', role: 'Fixed inset-0 flex container. Positions the popup edge.', color: 'text-emerald-400' },
        { name: 'Popup', role: 'The panel. Reads CSS vars for transform. Handles touch events.', color: 'text-amber-400' },
        { name: 'Content', role: 'Opt-out zone: lets text be selected without triggering swipe.', color: 'text-rose-400' },
        { name: 'SwipeArea', role: 'Optional edge strip to open a closed drawer by swiping.', color: 'text-zinc-500' },
        { name: 'Close', role: 'Sets open to false. Keyboard accessible.', color: 'text-sky-400' },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="02" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    Anatomy
                </p>
                <h2 className="font-black tracking-tight text-white mb-6" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    Every part, one sentence
                </h2>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-3 mb-10">
                {parts.map(({ name, role, color }, i) => (
                    <FadeIn key={name} delay={i * 0.04}>
                        <div className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-4 py-3">
                            <span className={cn('font-mono font-bold shrink-0 w-28', color)} style={{ fontSize: '13px' }}>
                                {'<'}
                                {name}
                                {'>'}
                            </span>
                            <span className="text-zinc-500 leading-relaxed" style={{ fontSize: '13px' }}>
                                {role}
                            </span>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn>
                <CodeBlock>{`<Root>                      {/* open state, swipeDirection, snapPoints */}
  <Trigger />               {/* button → opens drawer */}
  <SwipeArea />             {/* optional: open by swiping from edge */}
  <Portal>                  {/* teleport to <body> */}
    <Backdrop />            {/* opacity: calc(0.2 * (1 - swipe-progress)) */}
    <Viewport>              {/* fixed inset-0 flex — positions the panel */}
      <Popup>               {/* THE panel: translate by swipe movement */}
        <Content>           {/* text-selectable, no swipe interference */}
          <Title />
          <Description />
          <Close />
        </Content>
      </Popup>
    </Viewport>
  </Portal>
</Root>`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 4. CSS Custom Properties ─────────────────────────────────────────────────
function CssVarsSection() {
    const vars = [
        {
            name: '--drawer-swipe-movement-x',
            type: '<length>',
            usage: 'translateX() on Popup for horizontal drawers',
            note: 'Updated every pointermove. Registered with inherits: false for perf.',
            variant: 'indigo' as const,
        },
        {
            name: '--drawer-swipe-movement-y',
            type: '<length>',
            usage: 'translateY() on Popup for bottom/top sheets',
            note: 'Same registration as movement-x.',
            variant: 'indigo' as const,
        },
        {
            name: '--drawer-swipe-progress',
            type: '<number> 0–1',
            usage: 'Backdrop opacity. 0 = fully open, 1 = fully dismissed.',
            note: 'Reads from swipe distance ÷ popup dimension.',
            variant: 'sky' as const,
        },
        {
            name: '--drawer-swipe-strength',
            type: '<number> 0.1–1',
            usage: 'Scales transition-duration on release. Fast fling = short duration.',
            note: 'Derived from velocity at pointer-up.',
            variant: 'amber' as const,
        },
        {
            name: '--drawer-height',
            type: '<length>',
            usage: 'Snap point calculations, indent effects.',
            note: 'Set by Popup via ResizeObserver.',
            variant: 'violet' as const,
        },
        {
            name: '--bleed',
            type: '<length>',
            usage: 'Hides the panel edge off-screen while keeping a shadow visible.',
            note: 'Your CSS variable, not a library var. Typically 3rem.',
            variant: 'rose' as const,
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="03" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    CSS Custom Properties
                </p>
                <h2 className="font-black tracking-tight text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    6 variables power everything
                </h2>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-10" style={{ fontSize: '16px' }}>
                    The library writes these on the popup element&apos;s inline style during gesture. Your CSS reads them. No requestAnimationFrame in your code — just{' '}
                    <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">transform: translateY(var(--drawer-swipe-movement-y))</code>.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-4 mb-10">
                {vars.map(({ name, type, usage, note, variant }, i) => (
                    <FadeIn key={name} delay={i * 0.05}>
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <code className="text-white font-mono" style={{ fontSize: '12px' }}>
                                    {name}
                                </code>
                                <Tag variant={variant}>{type}</Tag>
                            </div>
                            <p className="text-zinc-300 mb-1" style={{ fontSize: '13px' }}>
                                {usage}
                            </p>
                            <p className="text-zinc-600" style={{ fontSize: '12px' }}>
                                {note}
                            </p>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn>
                <p className="text-zinc-500 mb-3" style={{ fontSize: '13px' }}>
                    Register movement vars with <code className="text-indigo-300">inherits: false</code> — this prevents style recalculation cascading into every child on each pointer move:
                </p>
                <CodeBlock highlight={['inherits: false']}>{`// Run once at module level
CSS.registerProperty({
  name: '--drawer-swipe-movement-y',
  syntax: '<length>',
  inherits: false,   // ← key: no cascade into subtree
  initialValue: '0px',
});

CSS.registerProperty({
  name: '--drawer-swipe-progress',
  syntax: '<number>',
  inherits: false,
  initialValue: '0',
});`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 5. Data Attributes ───────────────────────────────────────────────────────
function DataAttributesSection() {
    const attrs = [
        {
            attr: 'data-starting-style',
            when: 'On mount, removed after first frame',
            use: 'Set initial off-screen transform. CSS @starting-style alternative.',
            example: '&[data-starting-style] { transform: translateY(100%) }',
        },
        {
            attr: 'data-ending-style',
            when: 'Set before unmount, removed on unmount',
            use: 'Return to off-screen position. CSS exit animation.',
            example: '&[data-ending-style] { transform: translateY(100%) }',
        },
        {
            attr: 'data-swiping',
            when: 'Present while pointer is down and dragging',
            use: 'Disable user-select, disable transition (so CSS follows finger instantly).',
            example: '&[data-swiping] { transition-duration: 0ms; user-select: none }',
        },
        {
            attr: 'data-open / data-closed',
            when: 'Reflects current open state',
            use: 'Target styles that differ between open and closed outside of animation.',
            example: '&[data-closed] { pointer-events: none }',
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="04" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    Data Attributes
                </p>
                <h2 className="font-black tracking-tight text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    State as HTML attributes
                </h2>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-10" style={{ fontSize: '16px' }}>
                    Instead of toggling class names from JS, the library sets data attributes on the element. Your CSS targets them. This pattern keeps animation logic entirely in CSS where the
                    browser can optimize it.
                </p>
            </FadeIn>

            <div className="space-y-4 mb-10">
                {attrs.map(({ attr, when, use, example }, i) => (
                    <FadeIn key={attr} delay={i * 0.06}>
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <code className="text-rose-400 font-mono font-bold" style={{ fontSize: '13px' }}>
                                    {attr}
                                </code>
                                <span className="text-zinc-600" style={{ fontSize: '12px' }}>
                                    {when}
                                </span>
                            </div>
                            <p className="text-zinc-400 mb-3" style={{ fontSize: '13px' }}>
                                {use}
                            </p>
                            <code className="text-zinc-600 font-mono" style={{ fontSize: '11px' }}>
                                {example}
                            </code>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn>
                <p className="text-zinc-500 mb-3" style={{ fontSize: '13px' }}>
                    Full popup CSS using only data attributes and CSS vars — no JS class toggling:
                </p>
                <CodeBlock highlight={['data-starting-style', 'data-ending-style', 'data-swiping']}>{`.popup {
  transform: translateY(var(--drawer-swipe-movement-y));
  transition: transform 450ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* enter / exit keyframes via data attrs */
.popup[data-starting-style],
.popup[data-ending-style] {
  transform: translateY(calc(100% - var(--bleed) + 2px));
}

/* velocity-aware exit duration */
.popup[data-ending-style] {
  transition-duration: calc(var(--drawer-swipe-strength) * 400ms);
}

/* while dragging: instant follow, no transition */
.popup[data-swiping] {
  transition-duration: 0ms;
  user-select: none;
}`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 6. The Bleed Trick ───────────────────────────────────────────────────────
function BleedTrickSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="05" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    The Bleed Trick
                </p>
                <h2 className="font-black tracking-tight text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    Hide the edge, keep the shadow
                </h2>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-8" style={{ fontSize: '16px' }}>
                    The panel is oversized by <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">--bleed</code> (typically{' '}
                    <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">3rem</code>) in the dismissal direction. The bleed amount is clipped by the viewport, so the panel appears the right
                    size — but the extra hidden height means the border-radius at the closed edge stays below the fold, and the box shadow extends naturally.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
                <FadeIn>
                    <div>
                        <p className="text-zinc-500 font-mono mb-3" style={{ fontSize: '11px' }}>
                            BOTTOM SHEET (swipeDirection=&quot;down&quot;)
                        </p>
                        <CodeBlock highlight={['--bleed', 'mb-[var(--bleed)', 'calc(100%']}>{`/* Popup: grow down by bleed, clip with viewport */
.popup {
  --bleed: 3rem;
  margin-bottom: calc(-1 * var(--bleed));
  padding-bottom: calc(1.5rem + var(--bleed));
  /* closed position: just the bleed peeks out */
}

/* Closed position keeps bleed visible */
.popup[data-ending-style] {
  transform: translateY(calc(100% - var(--bleed) + 2px));
  /* the 2px prevents a 1-pixel gap at the fold */
}`}</CodeBlock>
                    </div>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <div>
                        <p className="text-zinc-500 font-mono mb-3" style={{ fontSize: '11px' }}>
                            SIDE DRAWER (swipeDirection=&quot;right&quot;)
                        </p>
                        <CodeBlock highlight={['--bleed', 'mr-[var(--bleed)', 'calc(100%']}>{`/* Popup: grow right by bleed */
.popup {
  --bleed: 3rem;
  width: calc(20rem + var(--bleed));
  margin-right: calc(-1 * var(--bleed));
  padding-right: calc(1.5rem + var(--bleed));
}

/* Closed position */
.popup[data-ending-style] {
  transform: translateX(calc(100% - var(--bleed) + 2px));
}`}</CodeBlock>
                    </div>
                </FadeIn>
            </div>

            <FadeIn>
                <Callout variant="warn">
                    On iOS (Safari), the <code>position: fixed</code> behaviour changes inside scrollable containers. Use <code>@supports (-webkit-touch-callout: none)</code> to set{' '}
                    <code>--bleed: 0px</code> and switch to <code>border-radius</code> instead. The Viewport gets a small padding to float the sheet.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 7. Swipe Gesture ─────────────────────────────────────────────────────────
function SwipeGestureSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="06" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    Swipe Gesture
                </p>
                <h2 className="font-black tracking-tight text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    Pointer events → CSS vars
                </h2>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-10" style={{ fontSize: '16px' }}>
                    The whole gesture system is a <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">useSwipeDismiss</code> hook that attaches pointer events and writes CSS custom
                    properties directly to the element style. No React re-renders during drag.
                </p>
            </FadeIn>

            <FadeIn>
                <CodeBlock highlight={['setProperty', 'pointermove', 'pointerup', 'velocity']}>{`// Simplified core of useSwipeDismiss
function useSwipeDismiss(popupRef, { swipeDirection, onDismiss }) {
  const startY = useRef(0);
  const lastY  = useRef(0);
  const lastT  = useRef(0);

  function onPointerDown(e) {
    startY.current = e.clientY;
    lastY.current  = e.clientY;
    lastT.current  = Date.now();
    popupRef.current.setPointerCapture(e.pointerId);
    popupRef.current.setAttribute('data-swiping', '');
  }

  function onPointerMove(e) {
    const delta    = e.clientY - startY.current;
    const progress = Math.max(0, delta) / popupRef.current.offsetHeight;

    // Write directly to inline style — no React setState, no re-render
    popupRef.current.style.setProperty('--drawer-swipe-movement-y', delta + 'px');
    popupRef.current.style.setProperty('--drawer-swipe-progress',   progress);

    lastY.current = e.clientY;
    lastT.current = Date.now();
  }

  function onPointerUp(e) {
    const velocity = (e.clientY - lastY.current) / (Date.now() - lastT.current);
    const strength = Math.min(1, Math.max(0.1, 1 - velocity * 10));

    popupRef.current.removeAttribute('data-swiping');
    popupRef.current.style.setProperty('--drawer-swipe-strength', strength);

    const progress = parseFloat(
      popupRef.current.style.getPropertyValue('--drawer-swipe-progress')
    );

    if (progress > 0.5 || velocity > 0.1) {
      onDismiss();             // trigger data-ending-style → CSS exit
    } else {
      // Snap back: clear the vars, CSS transition returns to 0
      popupRef.current.style.removeProperty('--drawer-swipe-movement-y');
      popupRef.current.style.removeProperty('--drawer-swipe-progress');
    }
  }
}`}</CodeBlock>
            </FadeIn>

            <FadeIn delay={0.1} className="mt-6">
                <Callout variant="info">
                    <strong>Why setProperty instead of setState?</strong> React state triggers reconciliation. At 120fps a drag event fires every 8ms — that&apos;s far too fast. Writing directly to{' '}
                    <code>element.style.setProperty</code> bypasses React entirely and lets the browser&apos;s compositor thread handle the transform.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 8. Snap Points ───────────────────────────────────────────────────────────
function SnapPointsSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="07" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    Snap Points
                </p>
                <h2 className="font-black tracking-tight text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    Magnetic resting positions
                </h2>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-8" style={{ fontSize: '16px' }}>
                    Snap points are target positions the drawer settles into after a swipe instead of going fully open or dismissed. The active snap point sets{' '}
                    <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded">--drawer-snap-point-offset</code> on the popup, which your transform adds to the swipe movement.
                </p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Fraction', value: '0.4', desc: '40% of viewport height. Responsive by default.' },
                    { label: 'Pixels', value: '320', desc: 'Fixed pixel height. Use for content-sized drawers.' },
                    { label: 'String', value: '"148px" / "30rem"', desc: 'Explicit units. Parsed by the hook into pixels.' },
                ].map(({ label, value, desc }) => (
                    <FadeIn key={label}>
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
                            <Tag variant="violet">{label}</Tag>
                            <code className="block text-white font-mono mt-2 mb-2" style={{ fontSize: '14px' }}>
                                {value}
                            </code>
                            <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                                {desc}
                            </p>
                        </div>
                    </FadeIn>
                ))}
            </div>

            <FadeIn>
                <CodeBlock highlight={['snapPoints', 'onSnapPointChange', 'snap-point-offset']}>{`<Drawer.Root
  snapPoints={[0.4, 0.8]}         // two resting heights
  defaultSnapPoint={0.4}          // start at 40%
  onSnapPointChange={(point) => {
    console.log('snapped to', point);
  }}
>

/* In your CSS, the snap offset is already baked into
   the transform via --drawer-snap-point-offset: */
.popup {
  transform: translateY(
    calc(
      var(--drawer-swipe-movement-y) +
      var(--drawer-snap-point-offset)  /* ← set by the library */
    )
  );
}`}</CodeBlock>
            </FadeIn>

            <FadeIn delay={0.1} className="mt-6">
                <Callout variant="tip">
                    When building your own: after pointer-up, find the nearest snap point by comparing the current swipe progress to each snap value. Set the popup&apos;s{' '}
                    <code>--snap-point-offset</code> CSS var and clear the swipe movement var — CSS transition does the rest.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 9. Live Demo ─────────────────────────────────────────────────────────────
function LiveDemoSection() {
    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="08" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    Live Demo
                </p>
                <h2 className="font-black tracking-tight text-white mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    Built from scratch
                </h2>
                <p className="text-zinc-400 max-w-2xl leading-relaxed mb-10" style={{ fontSize: '16px' }}>
                    This drawer uses only React state, pointer events, and CSS custom properties — no library. Swipe down (or drag with mouse) to dismiss.
                </p>
            </FadeIn>
            <FadeIn>
                <ScratchDrawerDemo />
            </FadeIn>
        </section>
    );
}

// ─── Scratch Drawer ───────────────────────────────────────────────────────────
type DrawerPhase = 'closed' | 'entering' | 'open' | 'exiting';

function ScratchDrawerDemo() {
    const [phase, setPhase] = useState<DrawerPhase>('closed');
    const [exitDuration, setExitDuration] = useState(450);
    const popupRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const startY = useRef(0);
    const lastY = useRef(0);
    const lastT = useRef(0);

    // Enter: mount at 100% (no transition), then next frame switch to 'open' → transition slides in
    useEffect(() => {
        if (phase !== 'entering') return;
        const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')));
        return () => cancelAnimationFrame(id);
    }, [phase]);

    function openDrawer() {
        setExitDuration(450);
        setPhase('entering');
    }

    function dismissDrawer(strength = 1) {
        const ms = Math.round(strength * 400);
        setExitDuration(ms);
        const el = popupRef.current;
        if (el) el.style.removeProperty('--swipe-y');
        setPhase('exiting');
    }

    function handleTransitionEnd(e: React.TransitionEvent) {
        if (e.propertyName === 'transform' && phase === 'exiting') setPhase('closed');
    }

    function onPointerDown(e: React.PointerEvent) {
        const el = popupRef.current;
        if (!el || phase !== 'open') return;
        dragging.current = true;
        startY.current = e.clientY;
        lastY.current = e.clientY;
        lastT.current = Date.now();
        el.setPointerCapture(e.pointerId);
        el.style.transitionDuration = '0ms'; // instant follow during drag
    }

    function onPointerMove(e: React.PointerEvent) {
        if (!dragging.current) return;
        const el = popupRef.current;
        const bg = backdropRef.current;
        if (!el) return;
        const delta = Math.max(0, e.clientY - startY.current);
        const progress = delta / el.offsetHeight;
        // Write directly — no setState, no re-render during drag
        el.style.setProperty('--swipe-y', `${delta}px`);
        if (bg) bg.style.opacity = String(0.4 * (1 - progress));
        lastY.current = e.clientY;
        lastT.current = Date.now();
    }

    function onPointerUp(e: React.PointerEvent) {
        if (!dragging.current) return;
        dragging.current = false;
        const el = popupRef.current;
        const bg = backdropRef.current;
        if (!el) return;
        el.style.transitionDuration = '450ms'; // restore before React re-render
        const velocity = (e.clientY - lastY.current) / Math.max(1, Date.now() - lastT.current);
        const swipeYVal = parseFloat(el.style.getPropertyValue('--swipe-y') || '0');
        const progress = el.offsetHeight > 0 ? swipeYVal / el.offsetHeight : 0;
        const strength = Math.min(1, Math.max(0.1, 1 - velocity * 8));
        if (progress > 0.45 || velocity > 0.1) {
            dismissDrawer(strength);
        } else {
            el.style.removeProperty('--swipe-y');
            if (bg) bg.style.opacity = '0.4';
        }
    }

    const isEntering = phase === 'entering';
    const isExiting = phase === 'exiting';
    const isVisible = phase !== 'closed';

    // Compute all animation state from phase — no <style> tag needed
    const popupTransform = isEntering || isExiting ? 'translateY(100%)' : 'translateY(var(--swipe-y, 0px))';
    const popupTransition = `transform ${isEntering ? 0 : exitDuration}ms cubic-bezier(0.32,0.72,0,1)`;

    return (
        <div>
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={openDrawer}
                    className="flex h-10 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-5 text-indigo-300 font-medium hover:bg-indigo-500/20 transition-colors"
                    style={{ fontSize: '14px' }}
                >
                    Open bottom sheet
                </button>
            </div>

            {isVisible && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    {/* Backdrop — opacity driven by phase, overridden imperatively during drag */}
                    <div
                        ref={backdropRef}
                        className="absolute inset-0 bg-black"
                        style={{
                            opacity: isEntering || isExiting ? 0 : 0.4,
                            transition: isEntering ? 'none' : `opacity ${exitDuration}ms cubic-bezier(0.32,0.72,0,1)`,
                        }}
                        onClick={() => dismissDrawer()}
                    />

                    {/* Popup — transform driven by phase + CSS var during drag */}
                    <div
                        ref={popupRef}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onTransitionEnd={handleTransitionEnd}
                        className="relative z-10 w-full max-w-lg rounded-t-2xl bg-zinc-900 border border-zinc-700/60 px-6 pt-4 pb-8 touch-none select-none"
                        style={{ transform: popupTransform, transition: popupTransition } as React.CSSProperties}
                    >
                        <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-5" />

                        <h3 className="text-white font-semibold mb-2" style={{ fontSize: '18px' }}>
                            Built from scratch
                        </h3>
                        <p className="text-zinc-400 leading-relaxed mb-6" style={{ fontSize: '14px' }}>
                            Drag this sheet down to dismiss it. No library — pointer events write <code className="text-indigo-300">--swipe-y</code> directly to the element style. Phase:{' '}
                            <code className="text-amber-400">{phase}</code>
                        </p>

                        <div className="bg-zinc-800/60 rounded-lg p-4 mb-6 font-mono" style={{ fontSize: '12px' }}>
                            <div className="text-zinc-500 mb-1">transform reads:</div>
                            <div className="text-indigo-300">translateY(var(--swipe-y, 0px))</div>
                        </div>

                        <button
                            onClick={() => dismissDrawer()}
                            className="flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-4 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── 10. Checklist ────────────────────────────────────────────────────────────
function ChecklistSection() {
    const items = [
        { done: true, text: 'Start with a Dialog — get accessibility for free', tag: 'Foundation' },
        { done: true, text: 'Register swipe CSS vars with inherits: false before mounting', tag: 'Performance' },
        { done: true, text: 'Write pointer-move vars via setProperty, never setState', tag: 'Performance' },
        { done: true, text: 'Use data-starting-style / data-ending-style for CSS-only animations', tag: 'Animation' },
        { done: true, text: 'Add --bleed to hide rounded corner below the fold', tag: 'Visual' },
        { done: true, text: '@supports (-webkit-touch-callout: none) for iOS safe-area', tag: 'iOS' },
        { done: true, text: 'data-swiping → transition-duration: 0ms for instant finger tracking', tag: 'Feel' },
        { done: true, text: 'Velocity at pointer-up scales exit transition duration', tag: 'Physics' },
        { done: true, text: 'SwipeArea lets users open from edge without touching content', tag: 'UX' },
        { done: true, text: 'Content component prevents text-selection triggering swipe', tag: 'UX' },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="09" />
            <FadeIn>
                <p className="font-mono tracking-[0.2em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '11px' }}>
                    Checklist
                </p>
                <h2 className="font-black tracking-tight text-white mb-10" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                    Production-ready drawer
                </h2>
            </FadeIn>

            <div className="space-y-3">
                {items.map(({ text, tag }, i) => (
                    <FadeIn key={i} delay={i * 0.04}>
                        <div className="flex items-center gap-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-4 py-3">
                            <span className="text-emerald-400 shrink-0" style={{ fontSize: '16px' }}>
                                ✓
                            </span>
                            <span className="text-zinc-300 flex-1" style={{ fontSize: '14px' }}>
                                {text}
                            </span>
                            <Tag variant="zinc">{tag}</Tag>
                        </div>
                    </FadeIn>
                ))}
            </div>
        </section>
    );
}
