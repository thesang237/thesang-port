'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';
import { cn } from '@/utils/cn';

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
            style={{ fontSize: '12px' }}
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
        <div className={cn('rounded-xl border px-5 py-4 leading-relaxed text-base', c.border, c.bg)}>
            <p className={cn('font-semibold mb-1', c.text)}>
                {c.icon} {c.label}
            </p>
            <p className="text-zinc-400 text-sm">{children}</p>
        </div>
    );
}

// ─── Live Demo: Mini Toast System ─────────────────────────────────────────────

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

type LiveToast = {
    id: number;
    message: string;
    description?: string;
    variant: ToastVariant;
    action?: { label: string };
    duration: number;
};

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string; text: string }> = {
    default: { bg: 'bg-zinc-900', border: 'border-zinc-700', icon: '', text: 'text-zinc-100' },
    success: { bg: 'bg-zinc-900', border: 'border-zinc-700', icon: '✓', text: 'text-emerald-400' },
    error: { bg: 'bg-zinc-900', border: 'border-zinc-700', icon: '✕', text: 'text-rose-400' },
    warning: { bg: 'bg-zinc-900', border: 'border-zinc-700', icon: '!', text: 'text-amber-400' },
    info: { bg: 'bg-zinc-900', border: 'border-zinc-700', icon: 'i', text: 'text-sky-400' },
    loading: { bg: 'bg-zinc-900', border: 'border-zinc-700', icon: '◌', text: 'text-zinc-400' },
};

let _id = 0;

function LiveToastItem({ toast, onRemove, index, total, expanded }: { toast: LiveToast; onRemove: (id: number) => void; index: number; total: number; expanded: boolean }) {
    const [removing, setRemoving] = useState(false);
    const v = variantStyles[toast.variant];
    const isFront = index === 0;
    const isVisible = index < 3;

    const handleRemove = useCallback(() => {
        setRemoving(true);
        setTimeout(() => onRemove(toast.id), 300);
    }, [toast.id, onRemove]);

    useEffect(() => {
        if (toast.variant === 'loading') return;
        const t = setTimeout(handleRemove, toast.duration);
        return () => clearTimeout(t);
    }, [handleRemove, toast.duration, toast.variant]);

    const stackOffset = expanded ? index * 64 : index * 6;
    const stackScale = expanded ? 1 : 1 - index * 0.05;
    const stackOpacity = !isVisible ? 0 : expanded ? 1 : isFront ? 1 : 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={
                removing
                    ? { opacity: 0, y: -24, scale: 0.96 }
                    : {
                          opacity: stackOpacity,
                          y: expanded ? stackOffset : stackOffset,
                          scale: stackScale,
                          zIndex: total - index,
                      }
            }
            transition={{ duration: 0.3, ease: E_OUT }}
            className={cn('absolute inset-x-0 rounded-xl border px-4 py-3 flex items-start gap-3 shadow-xl', v.bg, v.border)}
            style={{ transformOrigin: 'bottom center', bottom: 0 }}
        >
            {v.icon && (
                <span
                    className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
                        toast.variant === 'success' && 'bg-emerald-500/20 text-emerald-400',
                        toast.variant === 'error' && 'bg-rose-500/20 text-rose-400',
                        toast.variant === 'warning' && 'bg-amber-500/20 text-amber-400',
                        toast.variant === 'info' && 'bg-sky-500/20 text-sky-400',
                        toast.variant === 'loading' && 'bg-zinc-700 text-zinc-400 animate-spin',
                    )}
                >
                    {v.icon}
                </span>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 leading-tight">{toast.message}</p>
                {toast.description && <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toast.description}</p>}
                {toast.action && (
                    <button className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors" onClick={handleRemove}>
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button onClick={handleRemove} className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors text-sm leading-none mt-0.5" aria-label="Dismiss">
                ✕
            </button>
        </motion.div>
    );
}

function LivePlayground() {
    const [toasts, setToasts] = useState<LiveToast[]>([]);
    const [expanded, setExpanded] = useState(false);

    const add = useCallback((variant: ToastVariant, msg: string, opts?: Partial<LiveToast>) => {
        setToasts((prev) => [
            {
                id: ++_id,
                message: msg,
                variant,
                duration: 4000,
                ...opts,
            },
            ...prev,
        ]);
    }, []);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12] overflow-hidden">
            {/* Controls */}
            <div className="p-5 border-b border-zinc-800 flex flex-wrap gap-2">
                <button onClick={() => add('default', 'Event has been created')} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-700 transition-colors">
                    Default
                </button>
                <button
                    onClick={() => add('success', 'Changes saved', { description: 'Your profile has been updated successfully.' })}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                >
                    Success
                </button>
                <button
                    onClick={() => add('error', 'Something went wrong', { description: 'Please try again later.' })}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium hover:bg-rose-500/20 transition-colors"
                >
                    Error
                </button>
                <button
                    onClick={() => add('warning', 'Subscription expires soon', { description: '3 days remaining.' })}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                >
                    Warning
                </button>
                <button
                    onClick={() => add('info', 'New version available', { action: { label: 'Update now' } })}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium hover:bg-sky-500/20 transition-colors"
                >
                    Info + Action
                </button>
                <button
                    onClick={() => add('loading', 'Uploading…', { duration: Infinity })}
                    className="px-3 py-1.5 rounded-lg bg-zinc-700/40 text-zinc-400 border border-zinc-700 text-xs font-medium hover:bg-zinc-700 transition-colors"
                >
                    Loading
                </button>
            </div>
            {/* Toast viewport */}
            <div className="relative h-48 overflow-hidden" onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
                <div className="absolute inset-x-4 bottom-4" style={{ height: '120px' }}>
                    {toasts.map((t, i) => (
                        <LiveToastItem key={t.id} toast={t} onRemove={remove} index={i} total={toasts.length} expanded={expanded} />
                    ))}
                </div>
                {toasts.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">Click a button above to spawn a toast</div>}
                {toasts.length > 1 && !expanded && (
                    <div className="absolute bottom-2 inset-x-0 flex justify-center">
                        <span className="text-sm text-zinc-600">hover to expand</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Timer Demo ───────────────────────────────────────────────────────────────
function TimerDemo() {
    const DURATION = 4000;
    const [running, setRunning] = useState(false);
    const [remaining, setRemaining] = useState(DURATION);
    const [paused, setPaused] = useState(false);
    const startRef = useRef<number>(0);
    const rafRef = useRef<number>(0);

    const start = useCallback(() => {
        setRunning(true);
        setPaused(false);
        setRemaining(DURATION);
        startRef.current = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startRef.current;
            const left = Math.max(0, DURATION - elapsed);
            setRemaining(left);
            if (left > 0) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setRunning(false);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const pause = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        setPaused(true);
    }, []);

    const resume = useCallback(() => {
        setPaused(false);
        startRef.current = performance.now() - (DURATION - remaining);
        const tick = (now: number) => {
            const elapsed = now - startRef.current;
            const left = Math.max(0, DURATION - elapsed);
            setRemaining(left);
            if (left > 0) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                setRunning(false);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [remaining]);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    const pct = (remaining / DURATION) * 100;

    return (
        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] p-5 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-zinc-500">remaining: {(remaining / 1000).toFixed(2)}s</span>
                <div className="flex gap-2">
                    <button onClick={start} className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-colors">
                        Start
                    </button>
                    {running && !paused && (
                        <button onClick={pause} className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors">
                            Pause (hover)
                        </button>
                    )}
                    {running && paused && (
                        <button onClick={resume} className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                            Resume
                        </button>
                    )}
                </div>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-indigo-500" animate={{ width: `${pct}%` }} transition={{ duration: 0.1, ease: 'linear' }} />
            </div>
            <p className="text-sm text-zinc-500">
                {!running && remaining === DURATION && 'Timer not started'}
                {running && !paused && 'Timer running — click "Pause" to simulate hover'}
                {running && paused && 'Timer paused — remaining time is preserved'}
                {!running && remaining === 0 && 'Toast dismissed!'}
            </p>
        </div>
    );
}

// ─── Swipe Demo ───────────────────────────────────────────────────────────────
function SwipeDemo() {
    const [x, setX] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const startRef = useRef<number | null>(null);
    const dragStart = useRef<number>(0);

    const THRESHOLD = 80;

    const reset = () => {
        setX(0);
        setDismissed(false);
        startRef.current = null;
    };

    const getDampening = (delta: number) => 1 / (1.5 + Math.abs(delta) / 20);

    return (
        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] p-5 select-none overflow-hidden">
            <p className="text-sm text-zinc-500 mb-4">Drag the card left or right to dismiss</p>
            <AnimatePresence>
                {!dismissed ? (
                    <motion.div
                        key="card"
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 flex items-center gap-3 cursor-grab active:cursor-grabbing"
                        style={{ x }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0}
                        onDragStart={() => {
                            dragStart.current = Date.now();
                        }}
                        onDrag={(_, info) => {
                            const delta = info.offset.x;
                            // Allow free drag in any direction but dampen opposite
                            if (delta > 0) {
                                setX(delta);
                            } else {
                                setX(delta * getDampening(delta));
                            }
                        }}
                        onDragEnd={(_, info) => {
                            const timeTaken = Date.now() - dragStart.current;
                            const velocity = Math.abs(info.offset.x) / timeTaken;
                            if (Math.abs(info.offset.x) >= THRESHOLD || velocity > 0.11) {
                                setX(info.offset.x > 0 ? 300 : -300);
                                setTimeout(() => setDismissed(true), 300);
                            } else {
                                setX(0);
                            }
                        }}
                        animate={{ x, opacity: dismissed ? 0 : 1 }}
                    >
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 flex-shrink-0">✓</span>
                        <div>
                            <p className="text-sm font-medium text-zinc-100">Swipe me to dismiss</p>
                            <p className="text-sm text-zinc-500">threshold: {THRESHOLD}px · velocity: 0.11</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dashed border-zinc-700 py-6 flex flex-col items-center gap-2">
                        <p className="text-sm text-zinc-500">Dismissed!</p>
                        <button onClick={reset} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                            Reset
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{
                        width: `${Math.min(100, (Math.abs(x) / THRESHOLD) * 100)}%`,
                        background: Math.abs(x) >= THRESHOLD ? '#f43f5e' : '#6366f1',
                        marginLeft: x < 0 ? 'auto' : undefined,
                        marginRight: x > 0 ? 'auto' : undefined,
                    }}
                />
            </div>
            <p className="text-xs text-zinc-600 mt-1 font-mono">
                x: {Math.round(x)}px / {THRESHOLD}px threshold
            </p>
        </div>
    );
}

// ─── CSS Variables Demo ───────────────────────────────────────────────────────
function CSSVarsDemo() {
    const [mounted, setMounted] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [index, setIndex] = useState(0);

    const count = 3;

    return (
        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] p-5 space-y-4">
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => setMounted((v) => !v)} className="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-colors">
                    {'Toggle: data-mounted="'}
                    {String(mounted)}
                    {'"'}
                </button>
                <button onClick={() => setExpanded((v) => !v)} className="px-3 py-1 rounded bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors">
                    {'Toggle: data-expanded="'}
                    {String(expanded)}
                    {'"'}
                </button>
                <button onClick={() => setIndex((v) => (v + 1) % count)} className="px-3 py-1 rounded bg-zinc-700 text-zinc-300 text-xs font-medium hover:bg-zinc-600 transition-colors">
                    index: {index}
                </button>
            </div>
            <div className="relative h-24">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={cn('absolute inset-x-0 rounded-lg border px-3 py-2 transition-all duration-400', 'bg-zinc-900 border-zinc-700')}
                        style={{
                            opacity: !mounted ? 0 : expanded ? 1 : i > 0 ? 0 : 1,
                            transform: !mounted ? 'translateY(100%)' : expanded ? `translateY(${i * -52}px)` : `translateY(${i * -6}px) scale(${1 - i * 0.05})`,
                            zIndex: count - i,
                            bottom: 0,
                            transition: 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1), opacity 400ms',
                        }}
                    >
                        <p className="text-sm font-medium text-zinc-300">Toast #{count - i}</p>
                        <p className="text-sm text-zinc-500 font-mono">
                            --index: {i} | --offset: {i * 6}px
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Observer Pattern Demo ────────────────────────────────────────────────────
function ObserverDemo() {
    const [log, setLog] = useState<string[]>([]);
    const [count, setCount] = useState(0);

    const publish = () => {
        const id = count + 1;
        setCount(id);
        setLog((prev) => [`[PUBLISH] toast.success("Event #${id}")`, ...prev].slice(0, 6));
        // simulate subscriber receiving
        setTimeout(() => {
            setLog((prev) => [`[SUBSCRIBE] Toaster received → id:${id}, type:success`, ...prev].slice(0, 6));
        }, 80);
    };

    return (
        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 items-center">
                {/* Publisher */}
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 text-center">
                    <p className="text-sm font-mono text-indigo-400 mb-1">toast.success(…)</p>
                    <p className="text-sm text-zinc-500">Publisher</p>
                    <button onClick={publish} className="mt-2 px-3 py-1 rounded bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 transition-colors w-full">
                        Emit
                    </button>
                </div>
                {/* Arrow */}
                <div className="flex flex-col items-center gap-1">
                    <div className="text-sm text-zinc-600 font-mono">Observer</div>
                    <div className="text-zinc-500 text-lg">→</div>
                    <div className="text-sm text-zinc-600 font-mono">subscribers[]</div>
                </div>
                {/* Subscriber */}
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-center">
                    <p className="text-sm font-mono text-violet-400 mb-1">&lt;Toaster /&gt;</p>
                    <p className="text-sm text-zinc-500">Subscriber</p>
                    <div className="mt-2 h-6 rounded bg-violet-500/10 flex items-center justify-center">
                        <span className="text-sm text-violet-400 font-mono">{count} toasts</span>
                    </div>
                </div>
            </div>
            {/* Log */}
            <div className="bg-zinc-900/80 rounded-lg p-3 font-mono space-y-1" style={{ fontSize: '13px' }}>
                {log.length === 0 && <p className="text-zinc-600">Click {'"Emit"'} to see the pub/sub in action</p>}
                {log.map((entry, i) => (
                    <p key={i} className={entry.startsWith('[PUBLISH]') ? 'text-indigo-400' : 'text-violet-400'}>
                        {entry}
                    </p>
                ))}
            </div>
        </div>
    );
}

// ─── Accessibility Checklist ──────────────────────────────────────────────────
function A11yChecklist() {
    const items = [
        { check: 'aria-live="polite"', desc: 'Announces new toasts to screen readers without interrupting', done: true },
        { check: 'aria-label on container', desc: 'Labels the region: "Notifications Alt+T"', done: true },
        { check: 'tabIndex={0} on each toast', desc: 'Toasts are keyboard focusable', done: true },
        { check: 'aria-label on close button', desc: '"Close toast" — never unlabeled icon buttons', done: true },
        { check: 'focus-visible ring', desc: 'Visible focus indicator for keyboard users', done: true },
        { check: 'hotkey to expand', desc: 'Alt+T expands the toast list without mouse', done: true },
        { check: 'prefers-reduced-motion', desc: 'All transitions/animations disabled via CSS media query', done: true },
        { check: 'data-dismissible="false"', desc: 'Focus skip for non-interactive toasts', done: true },
    ];

    return (
        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] divide-y divide-zinc-800/80">
            {items.map((item) => (
                <div key={item.check} className="flex items-start gap-3 px-5 py-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs mt-0.5">✓</span>
                    <div>
                        <p className="text-base font-mono text-zinc-200">{item.check}</p>
                        <p className="text-sm text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SoonerPage() {
    return (
        <main className="min-h-screen bg-[#080810] text-zinc-100 antialiased">
            <div style={NOISE_BG} className="fixed inset-0 pointer-events-none z-0" />

            <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 space-y-28">
                {/* ── Hero ──────────────────────────────────────────────── */}
                <section className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: E_OUT }} className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag variant="indigo">Component Guide</Tag>
                            <Tag variant="violet">TypeScript</Tag>
                            <Tag variant="sky">Accessible</Tag>
                            <Tag variant="green">Animated</Tag>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                            Build a Toast System
                            <br />
                            <span className="text-indigo-400">from first principles.</span>
                        </h1>
                        <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                            A deep-dive into Sonner — the gold standard toast library. Every decision explained: observer pattern, CSS variable animation, swipe physics, accessibility, performance.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: E_OUT, delay: 0.15 }}>
                        <LivePlayground />
                    </motion.div>
                </section>

                {/* ── Architecture ───────────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="01" />
                        <div className="space-y-2">
                            <Tag variant="indigo">Architecture</Tag>
                            <h2 className="text-2xl font-bold">Three-layer design</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">Sonner splits responsibility cleanly into three independent layers. This is the first decision to understand.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                {
                                    layer: 'state.ts',
                                    title: 'The Observer',
                                    desc: 'A pub/sub singleton. Holds all toasts. Can be called from anywhere — no React needed.',
                                    color: 'indigo',
                                },
                                {
                                    layer: 'types.ts',
                                    title: 'The Contract',
                                    desc: 'Shared TypeScript interfaces that both the caller and the renderer depend on.',
                                    color: 'violet',
                                },
                                {
                                    layer: 'index.tsx',
                                    title: 'The Renderer',
                                    desc: '<Toaster /> subscribes to state and renders. <Toast /> handles animation + interaction.',
                                    color: 'sky',
                                },
                            ].map((l) => (
                                <div
                                    key={l.layer}
                                    className={cn(
                                        'rounded-xl border p-4 space-y-2',
                                        l.color === 'indigo' && 'border-indigo-500/20 bg-indigo-500/5',
                                        l.color === 'violet' && 'border-violet-500/20 bg-violet-500/5',
                                        l.color === 'sky' && 'border-sky-500/20 bg-sky-500/5',
                                    )}
                                >
                                    <p className={cn('text-xs font-mono', l.color === 'indigo' && 'text-indigo-400', l.color === 'violet' && 'text-violet-400', l.color === 'sky' && 'text-sky-400')}>
                                        {l.layer}
                                    </p>
                                    <p className="text-sm font-semibold text-zinc-100">{l.title}</p>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{l.desc}</p>
                                </div>
                            ))}
                        </div>

                        <Callout variant="tip">
                            This separation means <code className="text-emerald-300 font-mono text-xs">{'toast.success("…")'}</code> works in a Server Action, a utility function, or a setTimeout — no
                            hooks, no context. The Toaster just subscribes to whatever the observer emits.
                        </Callout>
                    </section>
                </FadeIn>

                {/* ── Observer Pattern ───────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="02" />
                        <div className="space-y-2">
                            <Tag variant="violet">State Management</Tag>
                            <h2 className="text-2xl font-bold">The Observer pattern</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">No Redux, no Zustand, no Context. A tiny hand-rolled pub/sub achieves perfect decoupling.</p>
                        </div>

                        <ObserverDemo />

                        <CodeBlock highlight={['subscribe', 'publish', 'subscribers.forEach']}>
                            {`class Observer {
  subscribers: Array<(toast: ToastT) => void> = [];

  // Any component can listen
  subscribe = (fn: (toast: ToastT) => void) => {
    this.subscribers.push(fn);
    return () => this.subscribers.splice(
      this.subscribers.indexOf(fn), 1
    ); // ← returns unsubscribe fn for useEffect cleanup
  };

  // toast() calls this
  publish = (data: ToastT) => {
    this.subscribers.forEach((fn) => fn(data));
  };
}

export const ToastState = new Observer();

// Globally callable — no hooks needed
export const toast = Object.assign(
  (message, data?) => ToastState.addToast({ title: message, ...data }),
  {
    success: (msg, data?) => ToastState.create({ ...data, message: msg, type: 'success' }),
    error:   (msg, data?) => ToastState.create({ ...data, message: msg, type: 'error' }),
    // …etc
  }
);`}
                        </CodeBlock>

                        <CodeBlock highlight={['ToastState.subscribe', 'flushSync', 'return () =>']}>
                            {`// Inside <Toaster />
useEffect(() => {
  return ToastState.subscribe((toast) => {
    // flushSync prevents React from batching this update.
    // Without it, multiple rapid toasts could coalesce
    // into a single render, dropping some visually.
    setTimeout(() => {
      ReactDOM.flushSync(() => {
        setToasts((prev) => {
          const exists = prev.findIndex(t => t.id === toast.id);
          if (exists !== -1) {
            // Update existing toast in-place (used by promise toasts)
            return [
              ...prev.slice(0, exists),
              { ...prev[exists], ...toast },
              ...prev.slice(exists + 1),
            ];
          }
          return [toast, ...prev]; // prepend: newest first
        });
      });
    });
  }); // ← return value is the unsubscribe fn
}, []);`}
                        </CodeBlock>

                        <Callout variant="perf">
                            <code className="font-mono text-violet-300 text-xs">ReactDOM.flushSync</code> forces a synchronous render, bypassing automatic batching introduced in React 18. This ensures
                            each toast appears individually, even if emitted in a tight loop (e.g. <code className="font-mono text-xs">toast.promise</code> resolving immediately).
                        </Callout>
                    </section>
                </FadeIn>

                {/* ── Types ──────────────────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="03" />
                        <div className="space-y-2">
                            <Tag variant="sky">Type Safety</Tag>
                            <h2 className="text-2xl font-bold">Design your types first</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">Good types are documentation. They define the API surface and catch mistakes at compile-time instead of runtime.</p>
                        </div>

                        <CodeBlock highlight={['ToastTypes', 'Action', 'ExternalToast', 'Omit']}>
                            {`// ① Enumerate all variants — no magic strings
type ToastTypes =
  | 'normal' | 'success' | 'info'
  | 'warning' | 'error' | 'loading';

// ② A reusable button action shape
interface Action {
  label: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  actionButtonStyle?: React.CSSProperties;
}

// ③ Runtime type guard — narrows Action | ReactNode
function isAction(action: Action | React.ReactNode): action is Action {
  return (action as Action).label !== undefined;
}

// ④ The full internal toast shape
interface ToastT {
  id: number | string;
  title?: (() => React.ReactNode) | React.ReactNode; // fn or node
  type?: ToastTypes;
  duration?: number;
  action?: Action | React.ReactNode; // accepts both
  dismissible?: boolean;
  promise?: Promise<unknown> | (() => Promise<unknown>);
  // …
}

// ⑤ Public API omits internal-only fields
type ExternalToast = Omit<ToastT, 'id' | 'type' | 'title' | 'delete'> & {
  id?: number | string; // optional for callers
};`}
                        </CodeBlock>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Callout variant="tip" title="Use Omit for public APIs">
                                Callers only need a subset of fields. <code className="text-emerald-300 font-mono text-xs">ExternalToast</code> strips internal fields like{' '}
                                <code className="font-mono text-xs text-emerald-300">delete</code> that the renderer uses internally but you never want to expose.
                            </Callout>
                            <Callout variant="info" title="Accept fn | ReactNode">
                                Title and description accept both a value and a factory function <code className="font-mono text-xs text-sky-300">{'() => ReactNode'}</code>. This lets callers render
                                dynamic content that&apos;s evaluated at display time, not call time.
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                {/* ── CSS Variables Animation ────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="04" />
                        <div className="space-y-2">
                            <Tag variant="green">Animation</Tag>
                            <h2 className="text-2xl font-bold">CSS custom properties as animation state</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                Instead of toggling class names, Sonner uses <em>data attributes</em> to represent state and <em>CSS custom properties</em> to compute the final transform. This keeps
                                animation logic entirely in CSS.
                            </p>
                        </div>

                        <CSSVarsDemo />

                        <CodeBlock lang="css" highlight={['--y', '--offset', '--index', 'data-mounted', 'data-expanded']}>
                            {`/* Default: offscreen, invisible */
[data-sonner-toast] {
  --y: translateY(100%);    /* enter from bottom */
  opacity: 0;
  transform: var(--y);
  transition: transform 400ms, opacity 400ms, height 400ms;
}

/* Mounted: slide in */
[data-sonner-toast][data-mounted='true'] {
  --y: translateY(0);       /* ← just change the variable */
  opacity: 1;
}

/* Stacked (collapsed) — back toasts peek out slightly */
[data-sonner-toast][data-expanded='false'][data-front='false'] {
  --scale: var(--toasts-before) * 0.05 + 1;
  --y: translateY(calc(var(--lift-amount) * var(--toasts-before)))
       scale(calc(-1 * var(--scale)));
  height: var(--front-toast-height); /* same height as front */
}

/* Expanded — each toast at its real offset */
[data-sonner-toast][data-mounted='true'][data-expanded='true'] {
  --y: translateY(calc(var(--lift) * var(--offset)));
  height: var(--initial-height);
}

/* Swipe — applied inline via JS */
[data-sonner-toast][data-swiping='true'] {
  transform: var(--y)
    translateY(var(--swipe-amount-y, 0px))
    translateX(var(--swipe-amount-x, 0px));
  transition: none; /* disable easing during drag */
}`}
                        </CodeBlock>

                        <CodeBlock highlight={['--index', '--offset', 'style=']}>
                            {`// In JSX — pass computed values as inline CSS vars
<li
  data-sonner-toast=""
  data-mounted={mounted}
  data-expanded={expanded}
  data-front={index === 0}
  style={{
    '--index': index,
    '--toasts-before': index,
    '--z-index': toasts.length - index,
    '--offset': \`\${offset.current}px\`,       // stacked offset
    '--initial-height': \`\${initialHeight}px\`, // real height
  } as React.CSSProperties}
>
  {/* CSS takes it from here — no JS animation loop */}
</li>`}
                        </CodeBlock>

                        <Callout variant="perf">
                            Setting CSS custom properties via <code className="font-mono text-violet-300 text-xs">{"element.style.setProperty('--swipe-amount-x', …)"}</code> during pointer move
                            bypasses React&apos;s reconciler entirely. No re-render, no virtual DOM diff — just a direct style mutation. This is why swipe feels instant.
                        </Callout>
                    </section>
                </FadeIn>

                {/* ── Timer Management ───────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="05" />
                        <div className="space-y-2">
                            <Tag variant="amber">Behavior</Tag>
                            <h2 className="text-2xl font-bold">Timer: pause, resume, document visibility</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                Auto-dismiss needs to be interruptible. Hover pauses it. Switching tabs pauses it. The remaining time must be preserved across these interruptions.
                            </p>
                        </div>

                        <TimerDemo />

                        <CodeBlock highlight={['remainingTime', 'pauseTimer', 'startTimer', 'isDocumentHidden']}>
                            {`// Mutable refs — don't trigger re-renders
const remainingTime = useRef(duration);
const closeTimerStartTimeRef = useRef(0);
const lastCloseTimerStartTimeRef = useRef(0);

const pauseTimer = () => {
  if (lastCloseTimerStartTimeRef.current < closeTimerStartTimeRef.current) {
    const elapsed = Date.now() - closeTimerStartTimeRef.current;
    // Subtract elapsed time from remaining budget
    remainingTime.current -= elapsed;
  }
  lastCloseTimerStartTimeRef.current = Date.now();
};

const startTimer = () => {
  if (remainingTime.current === Infinity) return; // never auto-dismiss
  closeTimerStartTimeRef.current = Date.now();

  timeoutId = setTimeout(() => {
    toast.onAutoClose?.(toast);
    deleteToast();
  }, remainingTime.current); // ← use remaining, not full duration
};

useEffect(() => {
  // Pause when: hovered, interacting, or tab hidden
  if (expanded || interacting || isDocumentHidden) {
    pauseTimer();
  } else {
    startTimer();
  }
  return () => clearTimeout(timeoutId);
}, [expanded, interacting, isDocumentHidden]);`}
                        </CodeBlock>

                        <CodeBlock highlight={['visibilitychange', 'document.hidden']}>
                            {`// hooks.tsx — useIsDocumentHidden
export const useIsDocumentHidden = () => {
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    const fn = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, []);

  return hidden;
};

// Why this matters:
// If a user switches tabs mid-timer, the timeout keeps running.
// But when they switch back, the toast might vanish immediately
// because it expired while they were away — confusing UX.
// Pausing on hidden tab gives the user their full read time.`}
                        </CodeBlock>

                        <Callout variant="warn" title="Infinity pitfall">
                            <code className="font-mono text-amber-300 text-xs">setTimeout(fn, Infinity)</code> does <strong>not</strong> run after infinite time — browsers treat it as{' '}
                            <code className="font-mono text-xs text-amber-300">setTimeout(fn, 0)</code>. Sonner guards against this explicitly:{' '}
                            <code className="font-mono text-xs text-amber-300">if (remaining === Infinity) return</code>.
                        </Callout>
                    </section>
                </FadeIn>

                {/* ── Swipe Gestures ─────────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="06" />
                        <div className="space-y-2">
                            <Tag variant="rose">Gestures</Tag>
                            <h2 className="text-2xl font-bold">Swipe physics</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                Three signals decide a dismiss: distance, velocity, and direction. A spring-like dampening resists wrong-direction drags. Pointer capture keeps tracking even outside
                                the element bounds.
                            </p>
                        </div>

                        <SwipeDemo />

                        <CodeBlock highlight={['SWIPE_THRESHOLD', 'velocity', 'getDampening', 'setPointerCapture']}>
                            {`const SWIPE_THRESHOLD = 45; // px

onPointerDown={(event) => {
  // Capture pointer so move events keep firing even outside bounds
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
  dragStartTime.current = new Date();
  setSwiping(true);
  pointerStartRef.current = { x: event.clientX, y: event.clientY };
}}

onPointerUp={() => {
  const swipeAmount = /* x or y delta */;
  const timeTaken = Date.now() - dragStartTime.current.getTime();
  const velocity = Math.abs(swipeAmount) / timeTaken; // px/ms

  // Dismiss on: enough distance OR fast flick
  if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
    deleteToast();
    setSwipeOut(true);
  } else {
    // Snap back
    toastRef.current?.style.setProperty('--swipe-amount-x', '0px');
  }
}}

onPointerMove={(event) => {
  const delta = event.clientX - pointerStartRef.current.x;

  // Elastic resistance when swiping in wrong direction
  const getDampening = (delta: number) => {
    const factor = Math.abs(delta) / 20;
    return 1 / (1.5 + factor); // approaches 0 as delta grows
  };

  const swipeAmount = allowedDirection(delta)
    ? delta                        // free movement
    : delta * getDampening(delta); // dampened resistance

  // Direct DOM mutation — no React re-render
  toastRef.current?.style.setProperty(
    '--swipe-amount-x', \`\${swipeAmount}px\`
  );
}}`}
                        </CodeBlock>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Callout variant="tip" title="Pointer capture">
                                Without <code className="font-mono text-emerald-300 text-xs">setPointerCapture</code>, pointer events stop firing the moment the cursor leaves the element. Capture
                                routes all events back to the originating element for the life of the gesture — critical for drag UX.
                            </Callout>
                            <Callout variant="info" title="Velocity dismiss">
                                A fast flick should feel dismissive even if the distance is short. Dividing distance by time gives velocity (px/ms). This mirrors the physics of real-world swipe
                                interfaces — intent matters more than distance.
                            </Callout>
                        </div>
                    </section>
                </FadeIn>

                {/* ── Height Tracking ────────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="07" />
                        <div className="space-y-2">
                            <Tag variant="zinc">Layout</Tag>
                            <h2 className="text-2xl font-bold">Dynamic height tracking</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                Toasts have variable content. Stacking them requires knowing each one&apos;s height. Sonner measures heights with{' '}
                                <code className="font-mono text-sm">getBoundingClientRect</code> and keeps them in shared state.
                            </p>
                        </div>

                        <CodeBlock highlight={['getBoundingClientRect', 'setHeights', 'useLayoutEffect', 'initialHeight']}>
                            {`// After mount: measure and register height
useEffect(() => {
  const node = toastRef.current;
  if (!node) return;
  const height = node.getBoundingClientRect().height;
  setInitialHeight(height);
  setHeights((h) => [
    { toastId: toast.id, height, position: toast.position },
    ...h,
  ]);
  // Cleanup: remove this toast's height on unmount
  return () => setHeights((h) => h.filter((x) => x.toastId !== toast.id));
}, []);

// After content changes: keep height accurate
useLayoutEffect(() => {
  if (!mounted) return;
  const node = toastRef.current;
  // Temporarily set to 'auto' to measure real content height
  const prev = node.style.height;
  node.style.height = 'auto';
  const newHeight = node.getBoundingClientRect().height;
  node.style.height = prev; // restore — prevents visible jump

  setHeights((heights) =>
    heights.map((h) =>
      h.toastId === toast.id ? { ...h, height: newHeight } : h
    )
  );
}, [toast.title, toast.description, toast.action]); // re-run on content change`}
                        </CodeBlock>

                        <Callout variant="info" title="useLayoutEffect vs useEffect">
                            <code className="font-mono text-sky-300 text-xs">useLayoutEffect</code> fires synchronously after DOM mutations but before the browser paints. It&apos;s the right hook for
                            measuring DOM geometry — you get the real height before the user sees anything, preventing a flicker of wrong layout.
                        </Callout>
                    </section>
                </FadeIn>

                {/* ── Accessibility ──────────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="08" />
                        <div className="space-y-2">
                            <Tag variant="green">Accessibility</Tag>
                            <h2 className="text-2xl font-bold">Built for everyone</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                Accessibility is not a feature you add later. Every interaction has a keyboard equivalent. Every element has a label. Motion is always optional.
                            </p>
                        </div>

                        <A11yChecklist />

                        <CodeBlock highlight={['aria-live', 'aria-label', 'tabIndex', 'prefers-reduced-motion']}>
                            {`// The container — screen readers watch this region
<section
  aria-live="polite"         // announce new items without interrupting
  aria-relevant="additions text"
  aria-atomic="false"        // announce each toast individually
  aria-label="Notifications Alt+T"
  tabIndex={-1}              // focusable via hotkey, not tab order
>

// Each toast
<li
  tabIndex={0}               // keyboard focusable
  data-dismissible={dismissible}
>
  <button
    aria-label={closeButtonAriaLabel} // never leave icon buttons unlabeled
    data-close-button
  >
    {CloseIcon}
  </button>
</li>

/* CSS: honor the user's motion preference */
@media (prefers-reduced-motion) {
  [data-sonner-toast],
  [data-sonner-toast] > *,
  .sonner-loading-bar {
    transition: none !important;
    animation: none !important;
  }
}`}
                        </CodeBlock>

                        <CodeBlock highlight={['lastFocusedElementRef', 'isFocusWithinRef', 'focus(']}>
                            {`// Focus management: return focus on collapse
const lastFocusedElementRef = useRef<HTMLElement>(null);
const isFocusWithinRef = useRef(false);

<ol
  onFocus={(event) => {
    if (!isFocusWithinRef.current) {
      isFocusWithinRef.current = true;
      // Remember what had focus before the toast got it
      lastFocusedElementRef.current = event.relatedTarget as HTMLElement;
    }
  }}
  onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      isFocusWithinRef.current = false;
      // Return focus to where the user was
      lastFocusedElementRef.current?.focus({ preventScroll: true });
      lastFocusedElementRef.current = null;
    }
  }}
/>`}
                        </CodeBlock>
                    </section>
                </FadeIn>

                {/* ── Composability ─────────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="09" />
                        <div className="space-y-2">
                            <Tag variant="violet">Composability</Tag>
                            <h2 className="text-2xl font-bold">Design for extension</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">
                                A great component is open for extension without modification. Sonner offers four progressive levels of customization.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    level: 'L1',
                                    title: 'Props API',
                                    desc: 'richColors, closeButton, position, duration — cover 95% of use cases',
                                    color: 'indigo',
                                    code: `toast.success("Saved", { duration: 8000, closeButton: true })`,
                                },
                                {
                                    level: 'L2',
                                    title: 'classNames object',
                                    desc: 'Target any internal part without fighting specificity',
                                    color: 'violet',
                                    code: `<Toaster toastOptions={{ classNames: { toast: 'my-toast', title: 'my-title' } }} />`,
                                },
                                {
                                    level: 'L3',
                                    title: 'Custom icons',
                                    desc: 'Replace any type icon or the close button with your own',
                                    color: 'sky',
                                    code: `<Toaster icons={{ success: <MyIcon />, close: <X size={12} /> }} />`,
                                },
                                {
                                    level: 'L4',
                                    title: 'Custom JSX toast',
                                    desc: 'Full control — render any component as a toast. Unstyled escape hatch.',
                                    color: 'rose',
                                    code: `toast.custom((id) => <MyCard onDismiss={() => toast.dismiss(id)} />)`,
                                },
                            ].map((l) => (
                                <div
                                    key={l.level}
                                    className={cn(
                                        'rounded-xl border p-4 space-y-2',
                                        l.color === 'indigo' && 'border-indigo-500/20 bg-indigo-500/5',
                                        l.color === 'violet' && 'border-violet-500/20 bg-violet-500/5',
                                        l.color === 'sky' && 'border-sky-500/20 bg-sky-500/5',
                                        l.color === 'rose' && 'border-rose-500/20 bg-rose-500/5',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'text-xs font-bold font-mono px-1.5 py-0.5 rounded',
                                                l.color === 'indigo' && 'bg-indigo-500/20 text-indigo-400',
                                                l.color === 'violet' && 'bg-violet-500/20 text-violet-400',
                                                l.color === 'sky' && 'bg-sky-500/20 text-sky-400',
                                                l.color === 'rose' && 'bg-rose-500/20 text-rose-400',
                                            )}
                                        >
                                            {l.level}
                                        </span>
                                        <p className="text-sm font-semibold text-zinc-100">{l.title}</p>
                                    </div>
                                    <p className="text-sm text-zinc-500">{l.desc}</p>
                                    <pre className="bg-black/30 rounded-lg px-3 py-2 font-mono text-zinc-300 overflow-x-auto" style={{ fontSize: '13px' }}>
                                        {l.code}
                                    </pre>
                                </div>
                            ))}
                        </div>

                        <Callout variant="tip" title="Promise toasts">
                            The most powerful pattern. Pass a promise and Sonner transitions through loading → success / error automatically — including updating the same toast in-place.
                        </Callout>

                        <CodeBlock highlight={['toast.promise', 'loading', 'success', 'error']}>
                            {`toast.promise(
  fetch('/api/save').then(r => r.json()),
  {
    loading: 'Saving changes…',
    success: (data) => \`Saved as "\${data.name}"\`,
    error:   (err)  => \`Failed: \${err.message}\`,
    // description can also be a function of the result
    description: (data) => \`ID: \${data.id}\`,
  }
);
// ↑ One call — handles all three states
// ↑ The same toast ID is mutated in-place`}
                        </CodeBlock>
                    </section>
                </FadeIn>

                {/* ── Performance Summary ────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="10" />
                        <div className="space-y-2">
                            <Tag variant="violet">Performance</Tag>
                            <h2 className="text-2xl font-bold">Every optimization, explained</h2>
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] divide-y divide-zinc-800/80">
                            {[
                                {
                                    technique: 'CSS custom properties for animation',
                                    why: 'CSS transitions run on the compositor thread — no JS involvement, no jank',
                                    tag: 'GPU',
                                },
                                {
                                    technique: 'Direct style mutation during swipe',
                                    why: 'element.style.setProperty bypasses React reconciler — zero re-renders per frame',
                                    tag: 'Zero re-render',
                                },
                                {
                                    technique: 'useCallback / useMemo for stable references',
                                    why: 'Prevents child components from re-rendering when parent state changes',
                                    tag: 'Memoization',
                                },
                                {
                                    technique: 'useRef for timer tracking',
                                    why: 'Mutable refs hold timer values without triggering re-renders',
                                    tag: 'No re-render',
                                },
                                {
                                    technique: 'requestAnimationFrame for dismiss',
                                    why: 'Batches DOM reads/writes with the browser paint cycle',
                                    tag: 'rAF',
                                },
                                {
                                    technique: 'ReactDOM.flushSync for new toasts',
                                    why: 'Bypasses React 18 batching so rapid toasts each get their own render',
                                    tag: 'Synchronous',
                                },
                                {
                                    technique: 'heightIndex before heights array update',
                                    why: 'Height index is calculated eagerly so new layout is ready before next paint',
                                    tag: 'Eager compute',
                                },
                            ].map((item) => (
                                <div key={item.technique} className="flex items-start gap-4 px-5 py-4">
                                    <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 font-mono border border-violet-500/20" style={{ fontSize: '12px' }}>
                                        {item.tag}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">{item.technique}</p>
                                        <p className="text-sm text-zinc-500 mt-0.5">{item.why}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </FadeIn>

                {/* ── Build Checklist ────────────────────────────────────── */}
                <FadeIn>
                    <section className="space-y-8 relative">
                        <SectionNum n="11" />
                        <div className="space-y-2">
                            <Tag variant="green">Reference</Tag>
                            <h2 className="text-2xl font-bold">Build-your-own checklist</h2>
                            <p className="text-zinc-400 text-base leading-relaxed">When building a toast system from scratch, tick these off in order.</p>
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-[#0d0d12] divide-y divide-zinc-800/80">
                            {[
                                { step: '1', text: 'Define your TypeScript types first — ToastT, ExternalToast, ToastTypes', group: 'Foundation' },
                                { step: '2', text: 'Implement the Observer class with subscribe / publish / create / dismiss', group: 'Foundation' },
                                { step: '3', text: 'Export the toast() function with method variants (.success, .error…)', group: 'Foundation' },
                                { step: '4', text: 'Build <Toaster /> — subscribes to state, renders positioned <ol>', group: 'Renderer' },
                                { step: '5', text: 'Build <Toast /> — measures its height, registers with setHeights', group: 'Renderer' },
                                { step: '6', text: 'Apply data attributes (mounted, expanded, front) for CSS state machine', group: 'Animation' },
                                { step: '7', text: 'Write CSS using --y, --offset, --index custom properties', group: 'Animation' },
                                { step: '8', text: 'Add auto-dismiss timer with pause/resume and remaining-time tracking', group: 'Behavior' },
                                { step: '9', text: 'Add useIsDocumentHidden to pause timers on tab switch', group: 'Behavior' },
                                { step: '10', text: 'Add pointer events for swipe — capture, delta, velocity, dampening', group: 'Gesture' },
                                { step: '11', text: 'Mute swipe-back via CSS animation (swipe-out-left/right/up/down)', group: 'Gesture' },
                                { step: '12', text: 'Add aria-live, aria-label, tabIndex, close button labels', group: 'A11y' },
                                { step: '13', text: 'Add keyboard hotkey to expand + Escape to collapse', group: 'A11y' },
                                { step: '14', text: 'Add @media (prefers-reduced-motion) to disable all animation', group: 'A11y' },
                                { step: '15', text: 'Add classNames prop for external part-targeting', group: 'API' },
                                { step: '16', text: 'Add toast.promise() — transitions loading → success | error in-place', group: 'API' },
                                { step: '17', text: 'Add toast.custom(jsx) for full render control', group: 'API' },
                            ].map((item, i) => {
                                const groupColor: Record<string, string> = {
                                    Foundation: 'text-indigo-400',
                                    Renderer: 'text-violet-400',
                                    Animation: 'text-sky-400',
                                    Behavior: 'text-amber-400',
                                    Gesture: 'text-rose-400',
                                    A11y: 'text-emerald-400',
                                    API: 'text-zinc-400',
                                };
                                return (
                                    <div key={i} className="flex items-start gap-4 px-5 py-3">
                                        <span
                                            className="flex-shrink-0 w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center font-mono mt-0.5"
                                            style={{ fontSize: '12px', color: '#52525b' }}
                                        >
                                            {item.step}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm text-zinc-200 leading-relaxed">{item.text}</p>
                                        </div>
                                        <span className={cn('flex-shrink-0 text-xs font-mono mt-0.5', groupColor[item.group])}>{item.group}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </FadeIn>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <FadeIn>
                    <div className="border-t border-zinc-800 pt-12 text-center space-y-3">
                        <p className="text-zinc-600 text-base">
                            Based on <span className="font-mono text-zinc-500">sonner</span> by Emil Kowalski
                        </p>
                        <p className="text-zinc-700 text-sm">Study the source · Understand the decisions · Build your own</p>
                    </div>
                </FadeIn>
            </div>
        </main>
    );
}
