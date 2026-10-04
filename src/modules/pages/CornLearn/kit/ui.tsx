'use client';

import type { ReactNode } from 'react';

import { CodeBlock } from '@/components/code-block';
import { cn } from '@/utils/cn';

import { GLOSSARY } from '../content/glossary';

// ─── Chapter + section scaffolding ──────────────────────────────────────────

/** A small ring like the page's side nav: track + arc (0..100) + core dot. */
export function Ring({ arc = 0, className, core = true }: { arc?: number; className?: string; core?: boolean }) {
    return (
        <svg viewBox="0 0 14 14" className={cn('cl-ring', className)} style={{ ['--arc' as string]: arc }} aria-hidden>
            <circle className="cl-ring__track" cx="7" cy="7" r="5.6" />
            <circle className="cl-ring__arc" cx="7" cy="7" r="5.6" pathLength="100" />
            {core && <circle className="cl-ring__core" cx="7" cy="7" r="1.2" />}
        </svg>
    );
}

/** Chapter titles use the page's caps face: keep them to A–Z 0–9 . , ! ? % $ - (no apostrophes, no colons). */
export function ChapterHead({ n, kicker, title, lead, children }: { n: string; kicker: string; title: ReactNode; lead: ReactNode; children?: ReactNode }) {
    return (
        <header className="mb-14 sm:mb-20">
            <div className="cl-mono mb-6 flex items-center gap-3 text-[11px] uppercase text-[var(--cl-dim)]">
                <span className="cl-display text-[40px] leading-none text-[var(--cl-mint)]">{n}</span>
                <Ring arc={100} className="text-[var(--cl-ink)]" />
                <span>{kicker}</span>
            </div>
            <h1 className="cl-head mb-6 max-w-[18ch] text-[clamp(34px,5.6vw,68px)]">{title}</h1>
            <p className="max-w-[60ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[var(--cl-dim)]">{lead}</p>
            {children}
        </header>
    );
}

export function Section({ id, n, title, children, className }: { id: string; n: string; title: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section id={id} className={cn('scroll-mt-32 border-t border-[var(--cl-line-2)] pb-6 pt-12 sm:pt-16', className)}>
            <div className="cl-mono mb-3 flex items-center gap-2 text-[11px] uppercase text-[var(--cl-faint)]">
                <span className="cl-dot text-[var(--cl-mint)]" />
                {n}
            </div>
            <h2 data-toc={id} className="mb-6 max-w-[26ch] text-[clamp(25px,3vw,36px)] font-semibold leading-[1.12] tracking-[-0.02em]">
                {title}
            </h2>
            <div className="space-y-6">{children}</div>
        </section>
    );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('cl-p', className)}>{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
    return <code className="cl-code-inline">{children}</code>;
}

/** Glossary word — dotted underline, plain-language tooltip on hover/focus. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children?: ReactNode }) {
    const entry = GLOSSARY[k];
    if (!entry) return <>{children}</>;
    return (
        <span className="cl-term" tabIndex={0}>
            {children ?? entry.term}
            <span role="tooltip" className="cl-term-tip rounded-md border border-[var(--cl-line-2)] bg-[#030806] p-3.5 text-left shadow-2xl">
                <span className="cl-mono mb-1.5 flex items-center gap-2 text-[10px] uppercase text-[var(--cl-mint)]">
                    <span className="cl-dot" />
                    {entry.term}
                </span>
                <span className="block text-[13px] font-normal leading-relaxed text-[#e4ebe6]">{entry.plain}</span>
                {entry.lens && <span className="mt-2 block border-t border-white/10 pt-2 text-[12px] leading-snug text-[var(--cl-gold)]">{`◇ ${entry.lens}`}</span>}
            </span>
        </span>
    );
}

// ─── Teaching blocks ────────────────────────────────────────────────────────

/** "Designer lens": map the new idea onto something you already know. */
export function Lens({ title = 'Designer lens', children }: { title?: string; children: ReactNode }) {
    return (
        <aside className="relative max-w-[72ch] rounded-xl border border-[rgba(233,196,106,0.22)] bg-[rgba(233,196,106,0.05)] p-5 pr-6 sm:p-6">
            <div className="cl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase text-[var(--cl-gold)]">
                <span aria-hidden>◇</span>
                {title}
            </div>
            <div className="text-[15.5px] leading-relaxed text-[#e9e2cc]">{children}</div>
        </aside>
    );
}

/** The one line worth memorising. */
export function KeyIdea({ children }: { children: ReactNode }) {
    return (
        <div className="relative max-w-[66ch] overflow-hidden rounded-xl border border-[rgba(85,255,194,0.28)] bg-[linear-gradient(120deg,rgba(85,255,194,0.1),rgba(85,255,194,0.02))] px-5 py-5 sm:px-7">
            <div className="cl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase text-[var(--cl-mint)]">
                <Ring arc={100} />
                Remember
            </div>
            <p className="text-[clamp(18px,2vw,23px)] font-semibold leading-snug tracking-[-0.015em] text-white">{children}</p>
        </div>
    );
}

export function Callout({ tone = 'tip', title, children }: { tone?: 'tip' | 'warn' | 'meta'; title?: string; children: ReactNode }) {
    const tones = {
        tip: { c: 'var(--cl-mint)', b: 'rgba(85,255,194,0.35)', bg: 'rgba(85,255,194,0.04)', icon: '✦', label: 'Tip' },
        warn: { c: 'var(--cl-warn)', b: 'rgba(255,122,89,0.45)', bg: 'rgba(255,122,89,0.05)', icon: '!', label: 'Watch out' },
        meta: { c: 'var(--cl-amber)', b: 'rgba(237,134,59,0.45)', bg: 'rgba(237,134,59,0.06)', icon: '↻', label: 'This guide does it too' },
    }[tone];
    return (
        <div className="max-w-[72ch] border-l-2 px-4 py-3.5 sm:px-5" style={{ borderColor: tones.b, background: tones.bg }}>
            <div className="cl-mono mb-1 flex items-center gap-2 text-[10.5px] uppercase" style={{ color: tones.c }}>
                <span aria-hidden>{tones.icon}</span>
                {title ?? tones.label}
            </div>
            <div className="text-[15px] leading-relaxed text-[var(--cl-body)]">{children}</div>
        </div>
    );
}

/** Where the technique lives in the real /corn source (paths relative to src/modules/pages/Corn). */
export function Where({ files }: { files: { path: string; note?: string }[] }) {
    return (
        <div className="flex max-w-[72ch] flex-wrap items-center gap-2">
            <span className="cl-mono text-[10.5px] uppercase text-[var(--cl-faint)]">In the source →</span>
            {files.map((f) => (
                <span key={f.path} className="cl-mono inline-flex items-center gap-1.5 rounded-full border border-[var(--cl-line-2)] bg-[var(--cl-panel)] px-2.5 py-1 text-[11px] text-[var(--cl-dim)]">
                    <span className="text-[var(--cl-ink)]">{f.path}</span>
                    {f.note && <span className="text-[var(--cl-faint)]">{`· ${f.note}`}</span>}
                </span>
            ))}
        </div>
    );
}

/** Code with a file caption. Keep snippets short and annotated. */
export function Code({ children, file, lang = 'ts', highlight }: { children: string; file?: string; lang?: string; highlight?: string[] }) {
    return (
        <figure className="max-w-[860px]">
            {file && (
                <figcaption className="cl-mono mb-2 flex items-center gap-2 text-[11px] text-[var(--cl-dim)]">
                    <span className="cl-dot text-[var(--cl-mint)]" />
                    {file}
                </figcaption>
            )}
            <CodeBlock lang={lang} highlight={highlight} className="!rounded-lg !border !border-[var(--cl-line)] !bg-[#030806] !p-5 text-[13px] [&_.hl]:!bg-[rgba(85,255,194,0.1)]">
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
                    <span className="cl-mono mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--cl-mint)] text-[10.5px] text-[var(--cl-mint)]">{i + 1}</span>
                    <div className="text-[16px] leading-relaxed text-[var(--cl-body)]">{it}</div>
                </li>
            ))}
        </ol>
    );
}

/** Comparison table, e.g. designer word ↔ developer word. */
export function Table({ head, rows, mono = [] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
    return (
        <div className="cl-scrollbox max-w-[900px] overflow-x-auto rounded-lg border border-[var(--cl-line-2)] bg-[var(--cl-panel)]">
            <table className="w-full min-w-[560px] border-collapse text-left text-[14.5px]">
                <thead>
                    <tr className="bg-[var(--cl-panel-2)]">
                        {head.map((h) => (
                            <th key={h} className="cl-mono px-4 py-3 text-[10.5px] font-normal uppercase text-[var(--cl-dim)]">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--cl-line)] align-top">
                            {r.map((cell, j) => (
                                <td
                                    key={j}
                                    className={cn(
                                        'px-4 py-3 leading-relaxed text-[var(--cl-body)]',
                                        j === 0 && 'font-semibold text-[var(--cl-ink)]',
                                        mono.includes(j) && 'cl-mono text-[12.5px] text-[#a8ffe0]',
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
        <div className="max-w-[72ch] rounded-lg border border-dashed border-[var(--cl-line-3)] px-5 py-4">
            <div className="cl-mono mb-2.5 flex items-center gap-2 text-[10.5px] uppercase text-[var(--cl-mint)]">
                <span className="cl-dot" />
                Try this
            </div>
            <ul className="space-y-1.5">
                {items.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-[var(--cl-body)]">
                        <span className="text-[var(--cl-mint)]" aria-hidden>
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

export function Card({ title, kicker, children, tint }: { title: ReactNode; kicker?: string; children: ReactNode; tint?: boolean }) {
    return (
        <div className={cn('rounded-xl p-5', tint ? 'border border-[rgba(85,255,194,0.2)] bg-[rgba(85,255,194,0.05)]' : 'border border-[var(--cl-line-2)] bg-[var(--cl-panel)]')}>
            {kicker && (
                <div className={cn('cl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase', tint ? 'text-[var(--cl-mint)]' : 'text-[var(--cl-faint)]')}>
                    <span className="cl-dot" />
                    {kicker}
                </div>
            )}
            <div className="mb-2 text-[17px] font-semibold tracking-[-0.01em]">{title}</div>
            <div className="text-[15px] leading-relaxed text-[var(--cl-dim)]">{children}</div>
        </div>
    );
}
