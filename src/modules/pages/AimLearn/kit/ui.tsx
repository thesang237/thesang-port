'use client';

import type { ReactNode } from 'react';

import { CodeBlock } from '@/components/code-block';
import { cn } from '@/utils/cn';

import { GLOSSARY } from '../content/glossary';

// ─── Chapter + section scaffolding ──────────────────────────────────────────

export function ChapterHead({ n, kicker, title, lead, children }: { n: string; kicker: string; title: ReactNode; lead: ReactNode; children?: ReactNode }) {
    return (
        <header className="mb-14 sm:mb-20">
            <div className="al-mono mb-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--al-faint)]">
                <span className="text-[var(--al-accent-ink)]">{n}</span>
                <span className="h-px w-10 bg-[var(--al-line-2)]" />
                <span>{kicker}</span>
            </div>
            <h1 className="al-display mb-6 max-w-[20ch] text-[clamp(36px,6vw,72px)] leading-[0.98] tracking-[-0.035em]">{title}</h1>
            <p className="max-w-[60ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[var(--al-dim)]">{lead}</p>
            {children}
        </header>
    );
}

export function Section({ id, n, title, children, className }: { id: string; n: string; title: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section id={id} className={cn('scroll-mt-32 border-t border-[var(--al-ink)] pb-6 pt-8 sm:pt-10', className)}>
            <div className="al-mono mb-3 text-[11px] tracking-[0.14em] text-[var(--al-faint)]">{n}</div>
            <h2 data-toc={id} className="al-display mb-6 max-w-[26ch] text-[clamp(24px,3vw,36px)] leading-[1.08] tracking-[-0.025em]">
                {title}
            </h2>
            <div className="space-y-6">{children}</div>
        </section>
    );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('al-p', className)}>{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
    return <code className="al-code-inline">{children}</code>;
}

/** Glossary word — dashed underline, plain-language tooltip on hover/focus. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children?: ReactNode }) {
    const entry = GLOSSARY[k];
    if (!entry) return <>{children}</>;
    return (
        <span className="al-term" tabIndex={0}>
            {children ?? entry.term}
            <span role="tooltip" className="al-term-tip border border-[var(--al-ink)] bg-[var(--al-panel)] p-3.5 text-left shadow-[4px_4px_0_0_rgba(20,20,20,0.9)]">
                <span className="al-mono mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[var(--al-accent-ink)]">{entry.term}</span>
                <span className="block text-[13px] font-normal leading-relaxed text-[var(--al-ink)]">{entry.plain}</span>
                {entry.lens && <span className="mt-2 block border-t border-[var(--al-line)] pt-2 text-[12px] leading-snug text-[var(--al-dim)]">{`◇ ${entry.lens}`}</span>}
            </span>
        </span>
    );
}

// ─── Teaching blocks ────────────────────────────────────────────────────────

/** "Designer lens": map the new idea onto something you already know. */
export function Lens({ title = 'Designer lens', children }: { title?: string; children: ReactNode }) {
    return (
        <aside className="relative max-w-[72ch] border border-[var(--al-ink)] bg-[var(--al-panel)] p-5 sm:p-6">
            <div className="al-mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--al-accent-ink)]">
                <span aria-hidden>◇</span>
                {title}
            </div>
            <div className="text-[15px] leading-relaxed text-[var(--al-ink)]">{children}</div>
        </aside>
    );
}

/** The one line worth memorising. */
export function KeyIdea({ children }: { children: ReactNode }) {
    return (
        <div className="relative max-w-[62ch] border-l-[3px] border-[var(--al-accent)] py-1 pl-5 sm:pl-6">
            <div className="al-mono mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--al-accent-ink)]">Remember</div>
            <p className="al-display text-[clamp(20px,2.2vw,26px)] leading-snug tracking-[-0.015em] text-[var(--al-ink)]">{children}</p>
        </div>
    );
}

export function Callout({ tone = 'tip', title, children }: { tone?: 'tip' | 'warn' | 'meta'; title?: string; children: ReactNode }) {
    const tones = {
        tip: { c: 'var(--al-blue)', icon: '✦', label: 'Tip' },
        warn: { c: 'var(--al-accent-ink)', icon: '!', label: 'Watch out' },
        meta: { c: 'var(--al-green)', icon: '↻', label: 'This guide does it too' },
    }[tone];
    return (
        <div className="max-w-[72ch] border-l-[3px] bg-[var(--al-panel)] px-4 py-3.5 sm:px-5" style={{ borderColor: tones.c }}>
            <div className="al-mono mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: tones.c }}>
                <span aria-hidden>{tones.icon}</span>
                {title ?? tones.label}
            </div>
            <div className="text-[14px] leading-relaxed text-[var(--al-dim)]">{children}</div>
        </div>
    );
}

/** Where the technique lives in the real source. */
export function Where({ files }: { files: { path: string; note?: string }[] }) {
    return (
        <div className="flex max-w-[72ch] flex-wrap items-center gap-2">
            <span className="al-mono text-[10px] uppercase tracking-[0.16em] text-[var(--al-faint)]">In the source →</span>
            {files.map((f) => (
                <span key={f.path} className="al-mono inline-flex items-center gap-1.5 border border-[var(--al-line-2)] bg-[var(--al-panel)] px-2 py-1 text-[11px] text-[var(--al-dim)]">
                    <span className="text-[var(--al-ink)]">{f.path}</span>
                    {f.note && <span className="text-[var(--al-faint)]">{`· ${f.note}`}</span>}
                </span>
            ))}
        </div>
    );
}

/** Code with a file caption. Keep snippets short and annotated. */
export function Code({ children, file, lang = 'tsx', highlight }: { children: string; file?: string; lang?: string; highlight?: string[] }) {
    return (
        <figure className="al-code max-w-[860px]">
            {file && <figcaption className="al-mono mb-2 text-[11px] text-[var(--al-faint)]">{file}</figcaption>}
            <CodeBlock lang={lang} highlight={highlight} className="!rounded-none !border-0 !bg-[#141414] !p-5 text-[13px]">
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
                    <span className="al-mono mt-0.5 flex size-6 shrink-0 items-center justify-center border border-[var(--al-ink)] text-[10px] text-[var(--al-ink)]">{i + 1}</span>
                    <div className="text-[15px] leading-relaxed text-[var(--al-dim)]">{it}</div>
                </li>
            ))}
        </ol>
    );
}

/** Comparison table, e.g. designer word ↔ developer word. */
export function Table({ head, rows, mono = [] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
    return (
        <div className="al-scrollbox max-w-[900px] overflow-x-auto border border-[var(--al-ink)]">
            <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
                <thead>
                    <tr className="bg-[var(--al-ink)] text-[var(--al-bg)]">
                        {head.map((h) => (
                            <th key={h} className="al-mono px-4 py-3 text-[10px] font-normal uppercase tracking-[0.16em]">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--al-line-2)] align-top">
                            {r.map((cell, j) => (
                                <td
                                    key={j}
                                    className={cn(
                                        'px-4 py-3 leading-relaxed text-[var(--al-dim)]',
                                        j === 0 && 'text-[var(--al-ink)]',
                                        mono.includes(j) && 'al-mono text-[12.5px] text-[var(--al-accent-ink)]',
                                    )}
                                >
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
        <div className="max-w-[72ch] border border-dashed border-[var(--al-line-2)] px-5 py-4">
            <div className="al-mono mb-2.5 text-[10px] uppercase tracking-[0.18em] text-[var(--al-blue)]">Try this</div>
            <ul className="space-y-1.5">
                {items.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-[var(--al-dim)]">
                        <span className="text-[var(--al-blue)]" aria-hidden>
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

export function Card({ title, kicker, children, accent = 'var(--al-accent-ink)' }: { title: ReactNode; kicker?: string; children: ReactNode; accent?: string }) {
    return (
        <div className="border border-[var(--al-line-2)] bg-[var(--al-panel)] p-5">
            {kicker && (
                <div className="al-mono mb-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: accent }}>
                    {kicker}
                </div>
            )}
            <div className="al-display mb-2 text-[18px] tracking-[-0.01em]">{title}</div>
            <div className="text-[14px] leading-relaxed text-[var(--al-dim)]">{children}</div>
        </div>
    );
}
