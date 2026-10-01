'use client';

import type { ReactNode } from 'react';

import { CodeBlock } from '@/components/code-block';
import { cn } from '@/utils/cn';

import { GLOSSARY } from '../content/glossary';

// ─── Chapter + section scaffolding ──────────────────────────────────────────

export function ChapterHead({ n, kicker, title, lead, children }: { n: string; kicker: string; title: ReactNode; lead: ReactNode; children?: ReactNode }) {
    return (
        <header className="mb-14 sm:mb-20">
            <div className="il-mono mb-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--il-faint)]">
                <span className="text-[var(--il-ice)]">{`////// ${n}`}</span>
                <span className="h-px w-10 bg-[var(--il-line-2)]" />
                <span>{kicker}</span>
            </div>
            <h1 className="mb-6 max-w-[18ch] text-[clamp(36px,6vw,68px)] font-semibold leading-[1.02] tracking-[-0.035em]">{title}</h1>
            <p className="max-w-[60ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[var(--il-dim)]">{lead}</p>
            {children}
        </header>
    );
}

export function Section({ id, n, title, children, className }: { id: string; n: string; title: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section id={id} className={cn('scroll-mt-32 border-t border-[var(--il-line)] pb-6 pt-12 sm:pt-16', className)}>
            <div className="il-mono mb-3 text-[11px] tracking-[0.14em] text-[var(--il-faint)]">{n}</div>
            <h2 data-toc={id} className="mb-6 max-w-[26ch] text-[clamp(24px,3vw,34px)] font-semibold leading-[1.12] tracking-[-0.02em]">
                {title}
            </h2>
            <div className="space-y-6">{children}</div>
        </section>
    );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('il-p', className)}>{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
    return <code className="il-code-inline">{children}</code>;
}

/** Glossary word — dotted underline, plain-language tooltip on hover/focus. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children?: ReactNode }) {
    const entry = GLOSSARY[k];
    if (!entry) return <>{children}</>;
    return (
        <span className="il-term" tabIndex={0}>
            {children ?? entry.term}
            <span role="tooltip" className="il-term-tip rounded-xl border border-[var(--il-line-2)] bg-[#161e2b]/95 p-3.5 text-left shadow-2xl backdrop-blur-md">
                <span className="il-mono mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[var(--il-lilac)]">{entry.term}</span>
                <span className="block text-[13px] font-normal leading-relaxed text-[#d6dde8]">{entry.plain}</span>
                {entry.lens && <span className="mt-2 block border-t border-[var(--il-line)] pt-2 text-[12px] leading-snug text-[var(--il-dim)]">{`◇ ${entry.lens}`}</span>}
            </span>
        </span>
    );
}

// ─── Teaching blocks ────────────────────────────────────────────────────────

/** "Designer lens": map the new idea onto something you already know. */
export function Lens({ title = 'Designer lens', children }: { title?: string; children: ReactNode }) {
    return (
        <aside className="relative max-w-[72ch] overflow-hidden rounded-2xl border border-[rgba(212,194,255,0.18)] bg-[linear-gradient(135deg,rgba(212,194,255,0.07),rgba(212,194,255,0.015))] p-5 sm:p-6">
            <div className="il-mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--il-lilac)]">
                <span aria-hidden>◇</span>
                {title}
            </div>
            <div className="text-[15px] leading-relaxed text-[#ddd6f0]">{children}</div>
        </aside>
    );
}

/** The one line worth memorising. */
export function KeyIdea({ children }: { children: ReactNode }) {
    return (
        <div className="relative max-w-[62ch] border-l-2 border-[var(--il-ice)] py-1 pl-5 sm:pl-6">
            <div className="il-mono mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--il-ice)]">Remember</div>
            <p className="text-[clamp(18px,2vw,22px)] font-medium leading-snug tracking-[-0.01em] text-[var(--il-ink)]">{children}</p>
        </div>
    );
}

export function Callout({ tone = 'tip', title, children }: { tone?: 'tip' | 'warn' | 'meta'; title?: string; children: ReactNode }) {
    const tones = {
        tip: { c: 'var(--il-mint)', b: 'rgba(174,240,216,0.18)', bg: 'rgba(174,240,216,0.04)', icon: '✦', label: 'Tip' },
        warn: { c: 'var(--il-warn)', b: 'rgba(255,208,138,0.2)', bg: 'rgba(255,208,138,0.04)', icon: '!', label: 'Watch out' },
        meta: { c: 'var(--il-ice)', b: 'rgba(148,219,255,0.2)', bg: 'rgba(148,219,255,0.04)', icon: '↻', label: 'This page does it too' },
    }[tone];
    return (
        <div className="max-w-[72ch] rounded-xl border px-4 py-3.5 sm:px-5" style={{ borderColor: tones.b, background: tones.bg }}>
            <div className="il-mono mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: tones.c }}>
                <span aria-hidden>{tones.icon}</span>
                {title ?? tones.label}
            </div>
            <div className="text-[14px] leading-relaxed text-[#cfd7e2]">{children}</div>
        </div>
    );
}

/** Where the technique lives in the real Igloo source. */
export function Where({ files }: { files: { path: string; note?: string }[] }) {
    return (
        <div className="flex max-w-[72ch] flex-wrap items-center gap-2">
            <span className="il-mono text-[10px] uppercase tracking-[0.16em] text-[var(--il-faint)]">In the source →</span>
            {files.map((f) => (
                <span key={f.path} className="il-mono inline-flex items-center gap-1.5 rounded-md border border-[var(--il-line)] bg-[var(--il-bg-2)] px-2 py-1 text-[11px] text-[var(--il-dim)]">
                    <span className="text-[var(--il-ink)]">{f.path}</span>
                    {f.note && <span className="text-[var(--il-faint)]">{`· ${f.note}`}</span>}
                </span>
            ))}
        </div>
    );
}

/** Code with a file caption. Keep snippets short and annotated. */
export function Code({ children, file, lang = 'tsx', highlight }: { children: string; file?: string; lang?: string; highlight?: string[] }) {
    return (
        <figure className="max-w-[860px]">
            {file && <figcaption className="il-mono mb-2 text-[11px] text-[var(--il-faint)]">{file}</figcaption>}
            <CodeBlock lang={lang} highlight={highlight} className="!rounded-xl !border-[var(--il-line)] !bg-[#080b10] !p-5 text-[13px] [&_.hl]:!bg-[rgba(148,219,255,0.08)]">
                {children}
            </CodeBlock>
        </figure>
    );
}

export function Steps({ items }: { items: ReactNode[] }) {
    return (
        <ol className="max-w-[72ch] space-y-3">
            {items.map((it, i) => (
                <li key={i} className="flex gap-4">
                    <span className="il-mono mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--il-line-2)] text-[10px] text-[var(--il-ice)]">{i + 1}</span>
                    <div className="text-[15px] leading-relaxed text-[#c9d2de]">{it}</div>
                </li>
            ))}
        </ol>
    );
}

/** Two-column comparison, e.g. designer word ↔ developer word. */
export function Table({ head, rows, mono = [] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
    return (
        <div className="il-scrollbox max-w-[900px] overflow-x-auto rounded-xl border border-[var(--il-line)]">
            <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
                <thead>
                    <tr className="bg-[var(--il-bg-2)]">
                        {head.map((h) => (
                            <th key={h} className="il-mono px-4 py-3 text-[10px] font-normal uppercase tracking-[0.16em] text-[var(--il-faint)]">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--il-line)] align-top">
                            {r.map((cell, j) => (
                                <td key={j} className={cn('px-4 py-3 leading-relaxed text-[#c9d2de]', j === 0 && 'text-[var(--il-ink)]', mono.includes(j) && 'il-mono text-[12.5px] text-[#cfeeff]')}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** "Try this" prompts under a demo. */
export function TryThis({ items }: { items: ReactNode[] }) {
    return (
        <div className="max-w-[72ch] rounded-xl border border-dashed border-[var(--il-line-2)] px-5 py-4">
            <div className="il-mono mb-2.5 text-[10px] uppercase tracking-[0.18em] text-[var(--il-mint)]">Try this</div>
            <ul className="space-y-1.5">
                {items.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-[#c9d2de]">
                        <span className="text-[var(--il-mint)]" aria-hidden>
                            →
                        </span>
                        <span>{it}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
    return <div className={cn('grid gap-4', cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>{children}</div>;
}

export function Card({ title, kicker, children, accent = 'var(--il-ice)' }: { title: ReactNode; kicker?: string; children: ReactNode; accent?: string }) {
    return (
        <div className="rounded-2xl border border-[var(--il-line)] bg-[var(--il-panel)] p-5">
            {kicker && (
                <div className="il-mono mb-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: accent }}>
                    {kicker}
                </div>
            )}
            <div className="mb-2 text-[16px] font-semibold tracking-[-0.01em]">{title}</div>
            <div className="text-[14px] leading-relaxed text-[var(--il-dim)]">{children}</div>
        </div>
    );
}
