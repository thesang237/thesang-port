'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/utils/cn';

type TocItem = {
    id: string;
    label: string;
};

type TableOfContentsProps = {
    items: TocItem[];
    /** Accent color for active item — defaults to indigo */
    accent?: 'indigo' | 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';
};

const ACCENT_MAP = {
    indigo: {
        active: 'text-indigo-400',
        bar: 'bg-indigo-400',
        btn: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30',
        btnActive: 'bg-indigo-500/30 border-indigo-400/60 text-indigo-200',
        panelBorder: 'border-indigo-500/20',
    },
    amber: {
        active: 'text-amber-400',
        bar: 'bg-amber-400',
        btn: 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30',
        btnActive: 'bg-amber-500/30 border-amber-400/60 text-amber-200',
        panelBorder: 'border-amber-500/20',
    },
    emerald: {
        active: 'text-emerald-400',
        bar: 'bg-emerald-400',
        btn: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30',
        btnActive: 'bg-emerald-500/30 border-emerald-400/60 text-emerald-200',
        panelBorder: 'border-emerald-500/20',
    },
    sky: {
        active: 'text-sky-400',
        bar: 'bg-sky-400',
        btn: 'bg-sky-500/20 border-sky-500/40 text-sky-300 hover:bg-sky-500/30',
        btnActive: 'bg-sky-500/30 border-sky-400/60 text-sky-200',
        panelBorder: 'border-sky-500/20',
    },
    violet: {
        active: 'text-violet-400',
        bar: 'bg-violet-400',
        btn: 'bg-violet-500/20 border-violet-500/40 text-violet-300 hover:bg-violet-500/30',
        btnActive: 'bg-violet-500/30 border-violet-400/60 text-violet-200',
        panelBorder: 'border-violet-500/20',
    },
    rose: {
        active: 'text-rose-400',
        bar: 'bg-rose-400',
        btn: 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30',
        btnActive: 'bg-rose-500/30 border-rose-400/60 text-rose-200',
        panelBorder: 'border-rose-500/20',
    },
} as const;

export function TableOfContents({ items, accent = 'indigo' }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('');
    const [open, setOpen] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const colors = ACCENT_MAP[accent];

    useEffect(() => {
        observerRef.current?.disconnect();

        const entries = new Map<string, IntersectionObserverEntry>();

        observerRef.current = new IntersectionObserver(
            (observedEntries) => {
                for (const entry of observedEntries) {
                    entries.set(entry.target.id, entry);
                }

                // Find the topmost visible section
                let topId = '';
                let topY = Infinity;
                for (const [id, entry] of entries) {
                    if (entry.isIntersecting && entry.boundingClientRect.top < topY) {
                        topY = entry.boundingClientRect.top;
                        topId = id;
                    }
                }
                if (topId) setActiveId(topId);
            },
            { rootMargin: '-10% 0px -60% 0px', threshold: 0 },
        );

        for (const item of items) {
            const el = document.getElementById(item.id);
            if (el) observerRef.current.observe(el);
        }

        return () => observerRef.current?.disconnect();
    }, [items]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const scrollTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveId(id);
            setOpen(false);
        }
    }, []);

    const activeIndex = items.findIndex((item) => item.id === activeId);

    return (
        <>
            {/* ── Desktop: fixed left sidebar ── */}
            <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden xl:block max-w-[200px]">
                <ul className="space-y-1">
                    {items.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={() => scrollTo(item.id)}
                                className={cn(
                                    'group flex items-center gap-2.5 w-full text-left transition-all duration-200',
                                    activeId === item.id ? colors.active : 'text-zinc-600 hover:text-zinc-400',
                                )}
                            >
                                <span className={cn('h-px transition-all duration-300', activeId === item.id ? `w-5 ${colors.bar}` : 'w-2.5 bg-zinc-700 group-hover:w-4 group-hover:bg-zinc-500')} />
                                <span className="truncate leading-tight" style={{ fontSize: '11px' }}>
                                    {item.label}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>

                {activeIndex >= 0 && (
                    <div className="mt-4 flex items-center gap-2">
                        <div className="h-px flex-1 bg-zinc-800">
                            <div className={cn('h-full transition-all duration-500', colors.bar)} style={{ width: `${((activeIndex + 1) / items.length) * 100}%` }} />
                        </div>
                        <span className="text-zinc-600 font-mono tabular-nums" style={{ fontSize: '10px' }}>
                            {activeIndex + 1}/{items.length}
                        </span>
                    </div>
                )}
            </nav>

            {/* ── Mobile/Tablet: floating button + panel ── */}
            <div className="fixed bottom-6 right-6 z-50 xl:hidden" ref={panelRef}>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn('absolute bottom-14 right-0 w-64 max-h-[60vh] overflow-y-auto rounded-xl border bg-zinc-900/95 backdrop-blur-xl p-3 shadow-2xl', colors.panelBorder)}
                        >
                            <ul className="space-y-0.5">
                                {items.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => scrollTo(item.id)}
                                            className={cn(
                                                'w-full text-left px-3 py-2 rounded-lg transition-colors duration-150',
                                                activeId === item.id ? `${colors.active} bg-white/5` : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
                                            )}
                                            style={{ fontSize: '13px' }}
                                        >
                                            <span className="font-mono text-zinc-600 mr-2" style={{ fontSize: '10px' }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={cn('size-11 rounded-full border backdrop-blur-xl shadow-lg flex items-center justify-center transition-all duration-200', open ? colors.btnActive : colors.btn)}
                    aria-label="Table of contents"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="15" y2="12" />
                        <line x1="3" y1="18" x2="9" y2="18" />
                    </svg>
                </button>
            </div>
        </>
    );
}
