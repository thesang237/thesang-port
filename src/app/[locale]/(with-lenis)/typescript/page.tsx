'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

import { cn } from '@/utils/cn';

// ─── Shared easing ────────────────────────────────────────────────────────────
const E_OUT = [0.23, 1, 0.32, 1] as const;

// ─── Noise texture ────────────────────────────────────────────────────────────
const NOISE_BG = {
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'repeat' as const,
    backgroundSize: '128px',
};

// ─── Atoms ───────────────────────────────────────────────────────────────────
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

function Tag({ children, variant = 'indigo' }: { children: React.ReactNode; variant?: 'indigo' | 'green' | 'rose' | 'zinc' | 'sky' | 'amber' }) {
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
            )}
            style={{ fontSize: '10px' }}
        >
            {children}
        </span>
    );
}

function CodeBlock({ children, highlight }: { children: string; highlight?: string[] }) {
    const lines = children.split('\n');
    return (
        <pre className="bg-[#0d0d12] border border-zinc-800 rounded-xl p-5 font-mono overflow-x-auto leading-relaxed" style={{ fontSize: '12px' }}>
            {lines.map((line, i) => {
                const isHighlighted = highlight?.some((h) => line.includes(h));
                return (
                    <div key={i} className={cn('px-1 rounded', isHighlighted && 'bg-indigo-500/10 text-indigo-200')} style={{ color: isHighlighted ? undefined : '#a1a1aa' }}>
                        {line || '\u00A0'}
                    </div>
                );
            })}
        </pre>
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
export default function TypeScriptPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />
            <div className="max-w-[1080px] mx-auto">
                <HeroSection />
                <WhySection />
                <BasicTypesSection />
                <UnionVariantsSection />
                <InterfacePropsSection />
                <AsConstSection />
                <ReactTypesSection />
                <NarrowingSection />
                <UtilityTypesSection />
                <ChecklistSection />
            </div>
            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '14px' }}>
                TypeScript for Design Engineers · Types are documentation that compiles
            </footer>
        </main>
    );
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
    const words = ['TypeScript', 'for', 'Design', 'Engineers'];
    return (
        <section className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-12 xl:px-24 pt-32 pb-20">
            <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: E_OUT, delay: 0.1 }}
                className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-6"
                style={{ fontSize: '11px' }}
            >
                Practical TypeScript · Design Engineering
            </motion.p>

            <h1 className="flex flex-wrap gap-x-5 gap-y-2 font-black leading-[0.9] tracking-tight mb-8" style={{ fontSize: 'clamp(48px, 9vw, 120px)' }}>
                {words.map((word, i) => (
                    <motion.span
                        key={word}
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
                Not a TypeScript course. A focused guide to the patterns you will actually write every day as a designer building production UI — variant systems, typed props, design tokens, and
                component APIs.
            </motion.p>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 0.9 }}
                style={{ transformOrigin: 'left' }}
                className="mt-16 h-px bg-gradient-to-r from-indigo-500/40 via-indigo-500/10 to-transparent"
            />

            <motion.blockquote
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="mt-8 text-zinc-500 italic max-w-xl leading-relaxed"
                style={{ fontSize: '14px' }}
            >
                &ldquo;TypeScript doesn&apos;t slow you down. It speeds you up the second time — and every time after that.&rdquo;
            </motion.blockquote>
        </section>
    );
}

// ─── 2. Why TypeScript ────────────────────────────────────────────────────────
function WhySection() {
    const cards = [
        {
            icon: '🎨',
            title: 'Your props are documented',
            body: "When you type a component's props, every consumer gets autocomplete. No more checking the source to remember if it's `variant` or `type`, `size` or `sizing`.",
            tag: 'DX',
        },
        {
            icon: '🚨',
            title: 'Errors at edit time, not in the browser',
            body: 'Pass `color="purble"` to a typed component and the editor screams immediately. Without TS, you open DevTools to debug a typo that took you 20 minutes to find.',
            tag: 'Safety',
        },
        {
            icon: '🔁',
            title: 'Refactoring with confidence',
            body: 'Rename a prop from `variant` to `intent` — TS shows every file that breaks. Without it, you grep and pray you did not miss one.',
            tag: 'Refactor',
        },
        {
            icon: '📐',
            title: 'Design systems need contracts',
            body: "A Button that accepts `size: 'sm' | 'md' | 'lg'` is a contract. Any token, variant, or state that matters enough to design deserves a type.",
            tag: 'Systems',
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <FadeIn>
                <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                    Why It Matters
                </p>
                <h2 className="font-bold tracking-tight mb-14" style={{ fontSize: '36px' }}>
                    Four reasons a designer needs TypeScript.
                </h2>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-5">
                {cards.map(({ icon, title, body, tag }, i) => (
                    <FadeIn key={title} delay={i * 0.08}>
                        <motion.div
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2, ease: E_OUT }}
                            className="relative group bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 h-full overflow-hidden"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent" />
                            <div className="text-3xl mb-4">{icon}</div>
                            <div className="mb-3">
                                <Tag variant="indigo">{tag}</Tag>
                            </div>
                            <h3 className="font-semibold text-white mb-3" style={{ fontSize: '17px' }}>
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

// ─── 3. Basic Types ───────────────────────────────────────────────────────────
function BasicTypesSection() {
    const types = [
        { name: 'string', example: '"primary"', use: 'Text, labels, IDs, color names', color: '#818cf8' },
        { name: 'number', example: '16', use: 'Size tokens, z-index, delay values', color: '#34d399' },
        { name: 'boolean', example: 'true', use: 'disabled, loading, visible states', color: '#f59e0b' },
        { name: 'null | undefined', example: 'null', use: 'Optional values, unset states', color: '#94a3b8' },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="03" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Primitive Types
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Four types cover 80% of component props.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        Every prop in a component is one of these at its core. Knowing them by heart is the foundation.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="grid md:grid-cols-2 gap-4 mb-10">
                        {types.map(({ name, example, use, color }, i) => (
                            <motion.div
                                key={name}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.4, ease: E_OUT, delay: i * 0.07 }}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex items-start gap-4"
                            >
                                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                                <div>
                                    <code className="font-mono font-bold" style={{ color, fontSize: '15px' }}>
                                        {name}
                                    </code>
                                    <p className="text-zinc-500 font-mono mt-0.5 mb-2" style={{ fontSize: '12px' }}>
                                        e.g. {example}
                                    </p>
                                    <p className="text-zinc-400" style={{ fontSize: '13px' }}>
                                        {use}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <p className="text-zinc-500 mb-3 font-mono uppercase tracking-widest" style={{ fontSize: '10px' }}>
                        Real-world example — typed icon component
                    </p>
                    <CodeBlock highlight={['size: number', 'color: string', 'strokeWidth?: number', 'label?: string']}>{`// Without TypeScript — consumer must read source code
function Icon({ name, size, color, strokeWidth, label }) { ... }

// With TypeScript — everything is self-documenting
type IconProps = {
  name: string;         // 'arrow-right', 'close', 'check'
  size: number;         // px value — e.g. 16, 20, 24
  color: string;        // CSS color — e.g. 'currentColor', '#6366f1'
  strokeWidth?: number; // optional — defaults to 1.5 inside component
  label?: string;       // optional — aria-label for screen readers
};

function Icon({ name, size, color, strokeWidth = 1.5, label }: IconProps) {
  return <svg aria-label={label} width={size} height={size} ... />;
}`}</CodeBlock>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 4. Union Types & Variants ────────────────────────────────────────────────
function UnionVariantsSection() {
    type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
    type Size = 'sm' | 'md' | 'lg';

    const [variant, setVariant] = useState<Variant>('primary');
    const [size, setSize] = useState<Size>('md');

    const variantStyles: Record<Variant, string> = {
        primary: 'bg-indigo-500 text-white hover:bg-indigo-400',
        secondary: 'bg-zinc-700 text-white hover:bg-zinc-600',
        ghost: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800',
        destructive: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30',
    };

    const sizeStyles: Record<Size, string> = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-7 py-3.5 text-base',
    };

    const variants: Variant[] = ['primary', 'secondary', 'ghost', 'destructive'];
    const sizes: Size[] = ['sm', 'md', 'lg'];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="04" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Union Types
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        The most important pattern in design systems.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        A union type is a value that can be one of several specific options — and nothing else. This is exactly how variants work. Click the buttons below to see the live type.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 mb-6">
                        {/* Controls */}
                        <div className="mb-6">
                            <p className="text-zinc-500 font-mono mb-3" style={{ fontSize: '11px' }}>
                                VARIANT
                            </p>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {variants.map((v) => (
                                    <GhostButton key={v} active={variant === v} onClick={() => setVariant(v)}>
                                        {v}
                                    </GhostButton>
                                ))}
                            </div>
                            <p className="text-zinc-500 font-mono mb-3" style={{ fontSize: '11px' }}>
                                SIZE
                            </p>
                            <div className="flex gap-2">
                                {sizes.map((s) => (
                                    <GhostButton key={s} active={size === s} onClick={() => setSize(s)}>
                                        {s}
                                    </GhostButton>
                                ))}
                            </div>
                        </div>

                        {/* Live preview */}
                        <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-8 flex items-center justify-center mb-6" style={{ minHeight: '100px' }}>
                            <motion.button
                                layout
                                transition={{ duration: 0.2, ease: E_OUT }}
                                whileTap={{ scale: 0.97 }}
                                className={cn('rounded-lg font-medium transition-colors', variantStyles[variant], sizeStyles[size])}
                            >
                                Click me
                            </motion.button>
                        </div>

                        {/* Live type display */}
                        <div className="bg-[#0d0d12] border border-zinc-800 rounded-xl p-4 font-mono" style={{ fontSize: '13px' }}>
                            <span className="text-zinc-500">{'<Button '}</span>
                            <span className="text-indigo-400">variant</span>
                            <span className="text-zinc-500">{'="'}</span>
                            <span className="text-emerald-400">{variant}</span>
                            <span className="text-zinc-500">{'" '}</span>
                            <span className="text-indigo-400">size</span>
                            <span className="text-zinc-500">{'="'}</span>
                            <span className="text-emerald-400">{size}</span>
                            <span className="text-zinc-500">{'" />'}</span>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <CodeBlock highlight={['type Variant = ', 'type Size = ']}>{`// Union types — the value must be exactly one of these strings
type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size    = 'sm' | 'md' | 'lg';

// Now use them as prop types
type ButtonProps = {
  variant: Variant;
  size: Size;
  children: React.ReactNode;
  onClick?: () => void;
};

// TypeScript will error if you pass anything outside the union:
// <Button variant="danger" />  ← Error: Type '"danger"' is not assignable to type 'Variant'
// <Button variant="primary" /> ← ✓ Valid`}</CodeBlock>
                </FadeIn>

                <FadeIn delay={0.25}>
                    <div className="mt-6 bg-indigo-500/5 border border-indigo-500/15 rounded-xl px-6 py-5">
                        <p className="text-indigo-300/80 leading-relaxed" style={{ fontSize: '14px' }}>
                            <strong className="text-indigo-400">Rule:</strong> Every visual variation a designer creates should be a union type. If a component has more than one visual state — it
                            needs a type. Anything else is a guess at runtime.
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 5. Interfaces & Props ────────────────────────────────────────────────────
function InterfacePropsSection() {
    const [showOptional, setShowOptional] = useState(false);

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="05" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Interfaces & Props
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Type your component props like a contract.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        An interface is a named shape. For components, it describes exactly what props are accepted, which are required, and which are optional.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag variant="rose">No types</Tag>
                                <span className="text-zinc-600" style={{ fontSize: '13px' }}>
                                    — the trap
                                </span>
                            </div>
                            <CodeBlock>{`function Card({ title, body, image, cta, href }) {
  // You have no idea if 'image' is a URL string,
  // an object { src, alt }, or a React element.
  // You have no idea if 'href' is required.
  // The consumer has to read the source to know.
  return <div>...</div>;
}`}</CodeBlock>
                        </div>

                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag variant="green">Typed props</Tag>
                                <span className="text-zinc-600" style={{ fontSize: '13px' }}>
                                    — self-documenting
                                </span>
                            </div>
                            <CodeBlock highlight={['?:', 'interface CardProps']}>{`interface CardProps {
  title: string;          // required
  body?: string;          // optional — ? means may be absent
  image: {
    src: string;
    alt: string;
  };
  cta: string;
  href?: string;          // optional link
}

function Card({ title, body, image, cta, href }: CardProps) {
  return <div>...</div>;
}`}</CodeBlock>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.15}>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-white font-semibold mb-1" style={{ fontSize: '15px' }}>
                                    Required vs Optional
                                </p>
                                <p className="text-zinc-500" style={{ fontSize: '13px' }}>
                                    Toggle to see the difference. A <code className="text-indigo-400 font-mono">?</code> after the prop name makes it optional.
                                </p>
                            </div>
                            <GhostButton active={showOptional} onClick={() => setShowOptional((v) => !v)}>
                                {showOptional ? 'optional: on' : 'optional: off'}
                            </GhostButton>
                        </div>

                        <div className="bg-[#0d0d12] border border-zinc-800 rounded-xl p-5 font-mono" style={{ fontSize: '13px' }}>
                            <div className="text-zinc-500">{'interface TooltipProps {'}</div>
                            <div className="pl-4">
                                <div>
                                    <span className="text-sky-400">content</span>
                                    <span className="text-zinc-300">: string;</span>
                                    <span className="text-zinc-600 ml-3">{'// always required'}</span>
                                </div>
                                <div>
                                    <span className="text-sky-400">side</span>
                                    {showOptional && <span className="text-amber-400">?</span>}
                                    <span className="text-zinc-300">{": 'top' | 'bottom' | 'left' | 'right';"}</span>
                                    {!showOptional && <span className="text-rose-400 ml-3">{'// required — caller must pass this'}</span>}
                                    {showOptional && <span className="text-emerald-400 ml-3">{'// optional — defaults to "top"'}</span>}
                                </div>
                                <div>
                                    <span className="text-sky-400">delay</span>
                                    {showOptional && <span className="text-amber-400">?</span>}
                                    <span className="text-zinc-300">: number;</span>
                                    {!showOptional && <span className="text-rose-400 ml-3">{'// required'}</span>}
                                    {showOptional && <span className="text-emerald-400 ml-3">{'// optional — defaults to 300'}</span>}
                                </div>
                            </div>
                            <div className="text-zinc-500">{'}'}</div>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl px-6 py-5">
                        <p className="text-indigo-300/80 leading-relaxed" style={{ fontSize: '14px' }}>
                            <strong className="text-indigo-400">Mental model:</strong> Think of an interface like a Figma component&apos;s property panel. Required props = no default value in Figma.
                            Optional props = has a default in Figma. If the designer set a default, the prop should be optional in code.
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 6. as const & Design Tokens ──────────────────────────────────────────────
function AsConstSection() {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const tokens = [
        { key: 'SPACING.4', value: '16px', group: 'Spacing' },
        { key: 'SPACING.8', value: '32px', group: 'Spacing' },
        { key: 'RADIUS.sm', value: '4px', group: 'Radius' },
        { key: 'RADIUS.lg', value: '12px', group: 'Radius' },
        { key: 'DURATION.fast', value: '150ms', group: 'Animation' },
        { key: 'DURATION.normal', value: '250ms', group: 'Animation' },
    ];

    function handleCopy(key: string) {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    }

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="06" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        as const · Design Tokens
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Lock your tokens. Make them a type.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        <code className="text-indigo-400 font-mono">as const</code> freezes an object so TypeScript knows every exact value — not just their general type. This turns your token object
                        into a type-safe design system contract.
                    </p>
                </FadeIn>

                <div className="grid md:grid-cols-2 gap-8">
                    <FadeIn delay={0.1}>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 h-full">
                            <Tag variant="rose">Without as const</Tag>
                            <p className="text-zinc-500 mt-3 mb-4" style={{ fontSize: '13px' }}>
                                TypeScript only knows the type is <code className="text-zinc-300 font-mono">string</code>, not the exact value.
                            </p>
                            <CodeBlock>{`const RADIUS = {
  sm: '4px',
  lg: '12px',
};

// TypeScript infers:
// RADIUS.sm → string   (could be anything)

// This is also valid — TypeScript won't complain:
RADIUS.sm = 'banana'; // 😬 mutatable
RADIUS.xl = '20px';   // 😬 new keys allowed`}</CodeBlock>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.15}>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 h-full">
                            <Tag variant="green">With as const</Tag>
                            <p className="text-zinc-500 mt-3 mb-4" style={{ fontSize: '13px' }}>
                                TypeScript knows the literal values. Object is deeply readonly.
                            </p>
                            <CodeBlock highlight={['as const', 'keyof typeof']}>{`const RADIUS = {
  sm: '4px',
  lg: '12px',
} as const;

// TypeScript now knows:
// RADIUS.sm → '4px'  (exact literal — not just string)

// Derive a type from the keys:
type RadiusKey = keyof typeof RADIUS;
// → 'sm' | 'lg'

// Now props are guaranteed to be valid keys:
type Props = { radius: RadiusKey };
// <Card radius="xl" />  ← Error ✓`}</CodeBlock>
                        </div>
                    </FadeIn>
                </div>

                <FadeIn delay={0.2}>
                    <div className="mt-8">
                        <p className="text-zinc-500 mb-4 font-mono uppercase tracking-widest" style={{ fontSize: '10px' }}>
                            Interactive token reference — click any token
                        </p>
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="grid grid-cols-3 bg-zinc-900/80 border-b border-zinc-800 font-mono tracking-widest uppercase text-zinc-500 px-5 py-3" style={{ fontSize: '10px' }}>
                                <span>Token</span>
                                <span>Value</span>
                                <span>Group</span>
                            </div>
                            {tokens.map(({ key, value, group }) => (
                                <motion.button
                                    key={key}
                                    onClick={() => handleCopy(key)}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full grid grid-cols-3 items-center px-5 py-3 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40 transition-colors text-left"
                                >
                                    <code className="text-indigo-400 font-mono" style={{ fontSize: '13px' }}>
                                        {copiedKey === key ? '✓ copied' : key}
                                    </code>
                                    <code className="text-emerald-400 font-mono" style={{ fontSize: '13px' }}>
                                        {value}
                                    </code>
                                    <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                                        {group}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.25}>
                    <div className="mt-6 bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                        <Tag variant="indigo">Real-world pattern</Tag>
                        <p className="text-zinc-400 mt-3 mb-4" style={{ fontSize: '14px' }}>
                            The standard pattern in a design system — one token file exports the object and the derived types:
                        </p>
                        <CodeBlock highlight={['as const', 'keyof typeof SPACING', 'keyof typeof DURATION']}>{`// tokens.ts
export const SPACING = { 0: '0px', 1: '4px', 2: '8px', 4: '16px', 8: '32px' } as const;
export const DURATION = { fast: 150, normal: 250, slow: 400 } as const;
export const EASING = { out: [0.23, 1, 0.32, 1], inOut: [0.77, 0, 0.175, 1] } as const;

// Derived types — automatically stay in sync with the object
export type SpacingKey  = keyof typeof SPACING;   // '0' | '1' | '2' | '4' | '8'
export type DurationKey = keyof typeof DURATION;  // 'fast' | 'normal' | 'slow'

// Usage in a component
type AnimatedBoxProps = {
  padding: SpacingKey;
  animationDuration: DurationKey;
};`}</CodeBlock>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 7. React-specific Types ──────────────────────────────────────────────────
function ReactTypesSection() {
    const types = [
        {
            name: 'React.ReactNode',
            use: 'Anything React can render — string, element, array, null. Use for children.',
            example: 'children: React.ReactNode',
            tag: 'children',
        },
        {
            name: 'React.CSSProperties',
            use: 'An object of CSS properties. Needed when you pass an inline style prop — TypeScript knows every valid CSS property.',
            example: 'style?: React.CSSProperties',
            tag: 'style',
        },
        {
            name: 'React.ComponentProps<T>',
            use: 'Extracts all props from an existing component — including native HTML attributes. Use to extend without rewriting.',
            example: "React.ComponentProps<'button'>",
            tag: 'extend',
        },
        {
            name: 'React.MouseEvent',
            use: 'The event object for mouse interactions. Typed so you get autocomplete on `.target`, `.currentTarget`, `.preventDefault()`.',
            example: 'onClick: (e: React.MouseEvent<HTMLButtonElement>) => void',
            tag: 'events',
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="07" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        React-specific Types
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        The React types you will use every day.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        React ships its own TypeScript definitions. These four cover almost everything you&apos;ll encounter when building UI components.
                    </p>
                </FadeIn>

                <div className="space-y-4 mb-8">
                    {types.map(({ name, use, example, tag }, i) => (
                        <FadeIn key={name} delay={i * 0.07}>
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                    <code className="text-indigo-300 font-mono font-semibold" style={{ fontSize: '15px' }}>
                                        {name}
                                    </code>
                                    <Tag variant="sky">{tag}</Tag>
                                </div>
                                <p className="text-zinc-400 mb-4 leading-relaxed" style={{ fontSize: '14px' }}>
                                    {use}
                                </p>
                                <div className="bg-[#0d0d12] border border-zinc-800 rounded-lg px-4 py-2 font-mono text-emerald-400" style={{ fontSize: '12px' }}>
                                    {example}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <FadeIn delay={0.3}>
                    <p className="text-zinc-500 mb-3 font-mono uppercase tracking-widest" style={{ fontSize: '10px' }}>
                        Real-world — extending a native element (used in every design system)
                    </p>
                    <CodeBlock highlight={['React.ComponentProps', '...rest']}>{`// The pattern used in Radix, shadcn/ui, and most production design systems:
// Extend the native HTML element so consumers can pass any valid HTML attribute.

type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({ variant = 'primary', size = 'md', loading, children, ...rest }: ButtonProps) {
  // ...rest passes through className, onClick, disabled, type, aria-*, data-*, etc.
  return (
    <button {...rest} disabled={loading || rest.disabled} className={cn(variantStyles[variant], sizeStyles[size], rest.className)}>
      {loading ? <Spinner /> : children}
    </button>
  );
}`}</CodeBlock>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 8. Type Narrowing ────────────────────────────────────────────────────────
function NarrowingSection() {
    type AlertVariant = 'info' | 'success' | 'warning' | 'error';
    const [alertVariant, setAlertVariant] = useState<AlertVariant>('info');

    const alertConfig: Record<AlertVariant, { icon: string; label: string; style: string }> = {
        info: { icon: 'ℹ️', label: 'Info', style: 'bg-sky-500/10 border-sky-500/20 text-sky-300' },
        success: { icon: '✓', label: 'Success', style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
        warning: { icon: '⚠', label: 'Warning', style: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
        error: { icon: '✕', label: 'Error', style: 'bg-rose-500/10 border-rose-500/20 text-rose-300' },
    };

    const variants: AlertVariant[] = ['info', 'success', 'warning', 'error'];
    const config = alertConfig[alertVariant];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="08" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Type Narrowing & Lookup Tables
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Replace if-else chains with lookup tables.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        When a prop determines which styles, icons, or config to use — a <code className="text-indigo-400 font-mono">Record</code> lookup table beats a long if-else or switch.
                        TypeScript guarantees you handle every variant.
                    </p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7 mb-6">
                        <p className="text-zinc-500 font-mono mb-4" style={{ fontSize: '11px' }}>
                            INTERACTIVE DEMO — Select an alert variant:
                        </p>
                        <div className="flex flex-wrap gap-2 mb-7">
                            {variants.map((v) => (
                                <GhostButton key={v} active={alertVariant === v} onClick={() => setAlertVariant(v)}>
                                    {v}
                                </GhostButton>
                            ))}
                        </div>

                        <motion.div
                            layout
                            transition={{ duration: 0.25, ease: E_OUT }}
                            className={cn('flex items-center gap-3 px-5 py-4 rounded-xl border font-medium', config.style)}
                            style={{ fontSize: '14px' }}
                        >
                            <span>{config.icon}</span>
                            <span>
                                This is an {config.label.toLowerCase()} alert — variant is <code className="font-mono opacity-80">&quot;{alertVariant}&quot;</code>
                            </span>
                        </motion.div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.15}>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <Tag variant="rose">Avoid — if-else chain</Tag>
                            <p className="text-zinc-500 mt-3 mb-4" style={{ fontSize: '13px' }}>
                                Hard to add a new variant. Easy to forget one.
                            </p>
                            <CodeBlock>{`function Alert({ variant }) {
  let icon, style;

  if (variant === 'info') {
    icon = 'ℹ️'; style = 'bg-sky-500/10 ...';
  } else if (variant === 'success') {
    icon = '✓'; style = 'bg-emerald-500/10 ...';
  } else if (variant === 'warning') {
    icon = '⚠'; style = 'bg-amber-500/10 ...';
  } else if (variant === 'error') {
    icon = '✕'; style = 'bg-rose-500/10 ...';
  }
  return <div className={style}>...</div>;
}`}</CodeBlock>
                        </div>

                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                            <Tag variant="green">Prefer — Record lookup table</Tag>
                            <p className="text-zinc-500 mt-3 mb-4" style={{ fontSize: '13px' }}>
                                TypeScript errors if you miss a variant. One place to update.
                            </p>
                            <CodeBlock highlight={['Record<AlertVariant', 'Record<AlertVariant,']}>{`type AlertVariant = 'info' | 'success' | 'warning' | 'error';

// Record<Key, Value> — must handle every key in the union
const CONFIG: Record<AlertVariant, { icon: string; style: string }> = {
  info:    { icon: 'ℹ️', style: 'bg-sky-500/10 ...' },
  success: { icon: '✓',  style: 'bg-emerald-500/10 ...' },
  warning: { icon: '⚠',  style: 'bg-amber-500/10 ...' },
  error:   { icon: '✕',  style: 'bg-rose-500/10 ...' },
};
// Missing a key? → TypeScript Error at compile time ✓

function Alert({ variant }: { variant: AlertVariant }) {
  const { icon, style } = CONFIG[variant];
  return <div className={style}>{icon}</div>;
}`}</CodeBlock>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

// ─── 9. Utility Types ─────────────────────────────────────────────────────────
function UtilityTypesSection() {
    const utilities = [
        {
            name: 'Partial<T>',
            description: 'Makes all properties optional. Used when you want to accept a subset of a type — like a patch/update payload.',
            example: `type Theme = { color: string; size: string; radius: string };
// Partial<Theme> = { color?: string; size?: string; radius?: string }

// Real use: override only what you need
function applyThemeOverrides(overrides: Partial<Theme>) { ... }
applyThemeOverrides({ color: '#6366f1' }); // size & radius are optional`,
        },
        {
            name: 'Pick<T, K>',
            description: 'Extract only specific keys from a type. Used when a component only needs part of a larger data object.',
            example: `type User = {
  id: string; name: string; email: string;
  avatar: string; role: 'admin' | 'member';
};

// Avatar only needs name and avatar — not the full User
type AvatarProps = Pick<User, 'name' | 'avatar'>;
// → { name: string; avatar: string }`,
        },
        {
            name: 'Omit<T, K>',
            description: 'Remove specific keys from a type. The inverse of Pick — used when inheriting all props except a few.',
            example: `// Extend a base button but prevent overriding the type
type ButtonProps = React.ComponentProps<'button'>;
type IconButtonProps = Omit<ButtonProps, 'children'> & {
  icon: React.ReactNode;
  label: string; // aria-label required when no text children
};`,
        },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="09" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Utility Types
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Three tools for reshaping types.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed" style={{ fontSize: '16px' }}>
                        TypeScript ships built-in helpers that transform existing types into new shapes. As a design engineer you will reach for these when adapting components and managing data
                        structures.
                    </p>
                </FadeIn>

                <div className="space-y-5">
                    {utilities.map(({ name, description, example }, i) => (
                        <FadeIn key={name} delay={i * 0.08}>
                            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-7">
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                    <code className="text-indigo-300 font-mono font-bold" style={{ fontSize: '18px' }}>
                                        {name}
                                    </code>
                                    <Tag variant="sky">utility</Tag>
                                </div>
                                <p className="text-zinc-400 mb-5 leading-relaxed" style={{ fontSize: '14px' }}>
                                    {description}
                                </p>
                                <CodeBlock>{example}</CodeBlock>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── 10. Checklist ────────────────────────────────────────────────────────────
function ChecklistSection() {
    const rows = [
        { issue: 'Using `any`', fix: 'Replace with the actual type. `any` turns off TypeScript for that value — defeats the purpose.' },
        { issue: '`type` vs `interface`', fix: 'Use `interface` for component props (more error messages, extensible). Use `type` for unions and aliases.' },
        { issue: 'Not typing children', fix: "Always type children as `React.ReactNode`. It's the catch-all for anything React can render." },
        { issue: 'Forgetting `?` on optional props', fix: "If a prop has a default value inside the component, mark it as optional (`?`) in the interface — the caller shouldn't have to pass it." },
        {
            issue: 'Hardcoding strings as prop values',
            fix: 'If you pass `variant="primary"` but the type says `Variant`, TypeScript may still catch errors — but define union types so autocomplete works.',
        },
        { issue: 'Not using `as const` on token objects', fix: 'Without `as const`, TypeScript sees `string` instead of the literal value. You lose autocomplete on the token keys.' },
        { issue: 'Spreading `...props` without `ComponentProps`', fix: "If you spread native HTML attributes, extend `React.ComponentProps<'button'>` so the spread is typed — not just `any`." },
        { issue: 'Using `Record<string, string>` for tokens', fix: 'Use `Record<TokenKey, string>` where `TokenKey = keyof typeof TOKENS`. Narrows the key type to only valid tokens.' },
    ];

    const [checked, setChecked] = useState<Record<number, boolean>>({});

    function toggle(i: number) {
        setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
    }

    const doneCount = Object.values(checked).filter(Boolean).length;

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-24 border-t border-zinc-800/60">
            <div className="relative">
                <SectionNum n="10" />
                <FadeIn>
                    <p className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-3" style={{ fontSize: '11px' }}>
                        Common Mistakes
                    </p>
                    <h2 className="font-bold tracking-tight mb-4" style={{ fontSize: '36px' }}>
                        Eight things to get right from day one.
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mb-4 leading-relaxed" style={{ fontSize: '16px' }}>
                        These are the patterns that trip up designers moving into TypeScript. Check off each one you have internalized.
                    </p>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="h-1.5 w-40 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div layout className="h-full bg-indigo-500 rounded-full" style={{ width: `${(doneCount / rows.length) * 100}%` }} transition={{ duration: 0.3, ease: E_OUT }} />
                        </div>
                        <span className="text-zinc-500 font-mono" style={{ fontSize: '12px' }}>
                            {doneCount}/{rows.length}
                        </span>
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_2fr] bg-zinc-900/80 border-b border-zinc-800 font-mono tracking-[0.15em] uppercase text-zinc-500 px-6 py-3" style={{ fontSize: '11px' }}>
                            <span>Mistake</span>
                            <span>What to do instead</span>
                        </div>
                        {rows.map(({ issue, fix }, i) => (
                            <motion.button
                                key={issue}
                                onClick={() => toggle(i)}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, margin: '-20px' }}
                                transition={{ duration: 0.4, ease: E_OUT, delay: i * 0.04 }}
                                className={cn(
                                    'w-full grid grid-cols-[1fr_2fr] items-start gap-4 px-6 py-4 border-b border-zinc-800/60 last:border-0 transition-colors text-left',
                                    checked[i] ? 'bg-indigo-500/5' : 'hover:bg-zinc-900/40',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                                            checked[i] ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600',
                                        )}
                                        style={{ fontSize: '10px' }}
                                    >
                                        {checked[i] && <span className="text-white">✓</span>}
                                    </div>
                                    <code
                                        className={cn('text-rose-400/80 font-mono bg-rose-950/20 px-2 py-1 rounded self-start leading-tight', checked[i] && 'line-through opacity-40')}
                                        style={{ fontSize: '12px' }}
                                    >
                                        {issue}
                                    </code>
                                </div>
                                <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '14px' }}>
                                    {fix}
                                </p>
                            </motion.button>
                        ))}
                    </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                    <div className="mt-10 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-8">
                        <p className="font-mono tracking-[0.18em] uppercase text-indigo-400/60 mb-4" style={{ fontSize: '10px' }}>
                            The Mental Model
                        </p>
                        <p className="text-white font-semibold mb-3" style={{ fontSize: '20px' }}>
                            Types are documentation that the compiler enforces.
                        </p>
                        <p className="text-zinc-400 leading-relaxed max-w-2xl" style={{ fontSize: '15px' }}>
                            Every union type you write is a spec for a design decision. Every interface is a contract between the designer and the code. You are not learning TypeScript to satisfy
                            engineers — you are using it to express your design intent in a form that can never be misread.
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}
