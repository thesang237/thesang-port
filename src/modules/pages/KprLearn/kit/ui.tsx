'use client';

import type { ReactNode } from 'react';

import { CodeBlock } from '@/components/code-block';
import { cn } from '@/utils/cn';

import { GLOSSARY } from '../content/glossary';

// ─── Chapter + section scaffolding ──────────────────────────────────────────

export function ChapterHead({ n, kicker, title, lead, children }: { n: string; kicker: string; title: ReactNode; lead: ReactNode; children?: ReactNode }) {
    return (
        <header className="mb-14 sm:mb-20">
            <div className="kl-mono mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[-0.01em] text-[var(--kl-dim)]">
                <span className="kl-display text-[44px] leading-none tracking-normal text-[var(--kl-lav)]">{n}</span>
                <span className="kl-dot text-[var(--kl-ink)]" />
                <span>{kicker}</span>
            </div>
            <h1 className="kl-head mb-6 max-w-[17ch] text-[clamp(36px,6vw,72px)] leading-[0.98]">{title}</h1>
            <p className="max-w-[60ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[var(--kl-dim)]">{lead}</p>
            {children}
        </header>
    );
}

export function Section({ id, n, title, children, className }: { id: string; n: string; title: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section id={id} className={cn('scroll-mt-32 border-t border-[var(--kl-line-2)] pb-6 pt-12 sm:pt-16', className)}>
            <div className="kl-mono mb-3 flex items-center gap-2 text-[11px] uppercase text-[var(--kl-faint)]">
                <span className="kl-dot text-[var(--kl-lav)]" />
                {n}
            </div>
            <h2 data-toc={id} className="kl-head mb-6 max-w-[24ch] text-[clamp(25px,3.1vw,36px)] leading-[1.06]">
                {title}
            </h2>
            <div className="space-y-6">{children}</div>
        </section>
    );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('kl-p', className)}>{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
    return <code className="kl-code-inline">{children}</code>;
}

/** Glossary word — dotted underline, plain-language tooltip on hover/focus. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children?: ReactNode }) {
    const entry = GLOSSARY[k];
    if (!entry) return <>{children}</>;
    return (
        <span className="kl-term" tabIndex={0}>
            {children ?? entry.term}
            <span role="tooltip" className="kl-term-tip bg-[var(--kl-black)] p-3.5 text-left shadow-2xl">
                <span className="kl-mono mb-1.5 flex items-center gap-2 text-[10px] uppercase text-[var(--kl-lime)]">
                    <span className="kl-dot" />
                    {entry.term}
                </span>
                <span className="block text-[13px] font-normal leading-relaxed text-[#ececf0]">{entry.plain}</span>
                {entry.lens && <span className="mt-2 block border-t border-white/15 pt-2 text-[12px] leading-snug text-[#b9b4e8]">{`◇ ${entry.lens}`}</span>}
            </span>
        </span>
    );
}

// ─── Teaching blocks ────────────────────────────────────────────────────────

/** "Designer lens": map the new idea onto something you already know. */
export function Lens({ title = 'Designer lens', children }: { title?: string; children: ReactNode }) {
    return (
        <aside className="kl-notch relative max-w-[72ch] bg-[var(--kl-panel-2)] p-5 pr-6 sm:p-6" style={{ ['--n-w' as string]: '28%' }}>
            <div className="kl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase text-[var(--kl-lav-deep)]">
                <span aria-hidden>◇</span>
                {title}
            </div>
            <div className="text-[15px] leading-relaxed text-[#2f2a52]">{children}</div>
        </aside>
    );
}

/** The one line worth memorising. */
export function KeyIdea({ children }: { children: ReactNode }) {
    return (
        <div className="kl-cut relative max-w-[66ch] bg-[var(--kl-black)] px-5 py-5 sm:px-7" style={{ ['--c' as string]: '18px' }}>
            <div className="kl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase text-[var(--kl-lime)]">
                <span className="kl-dot" />
                Remember
            </div>
            <p className="text-[clamp(18px,2vw,23px)] font-semibold leading-snug tracking-[-0.025em] text-white">{children}</p>
        </div>
    );
}

export function Callout({ tone = 'tip', title, children }: { tone?: 'tip' | 'warn' | 'meta'; title?: string; children: ReactNode }) {
    const tones = {
        tip: { c: 'var(--kl-lav-deep)', b: 'rgba(91,77,170,0.25)', bg: 'rgba(139,126,217,0.06)', icon: '✦', label: 'Tip' },
        warn: { c: 'var(--kl-warn)', b: 'rgba(217,87,43,0.3)', bg: 'rgba(217,87,43,0.05)', icon: '!', label: 'Watch out' },
        meta: { c: '#3d6b00', b: 'rgba(120,180,20,0.4)', bg: 'rgba(192,251,80,0.16)', icon: '↻', label: 'This guide does it too' },
    }[tone];
    return (
        <div className="max-w-[72ch] border-l-2 px-4 py-3.5 sm:px-5" style={{ borderColor: tones.b, background: tones.bg }}>
            <div className="kl-mono mb-1 flex items-center gap-2 text-[10.5px] uppercase" style={{ color: tones.c }}>
                <span aria-hidden>{tones.icon}</span>
                {title ?? tones.label}
            </div>
            <div className="text-[14.5px] leading-relaxed text-[var(--kl-body)]">{children}</div>
        </div>
    );
}

/** Where the technique lives in the real /kpr source. */
export function Where({ files }: { files: { path: string; note?: string }[] }) {
    return (
        <div className="flex max-w-[72ch] flex-wrap items-center gap-2">
            <span className="kl-mono text-[10.5px] uppercase text-[var(--kl-faint)]">In the source →</span>
            {files.map((f) => (
                <span key={f.path} className="kl-mono inline-flex items-center gap-1.5 border border-[var(--kl-line-2)] bg-[var(--kl-panel)] px-2 py-1 text-[11px] text-[var(--kl-dim)]">
                    <span className="text-[var(--kl-ink)]">{f.path}</span>
                    {f.note && <span className="text-[var(--kl-faint)]">{`· ${f.note}`}</span>}
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
                <figcaption className="kl-mono mb-2 flex items-center gap-2 text-[11px] text-[var(--kl-dim)]">
                    <span className="kl-dot text-[var(--kl-lav)]" />
                    {file}
                </figcaption>
            )}
            <CodeBlock lang={lang} highlight={highlight} className="!rounded-none !border-0 !bg-[#0c0c0e] !p-5 text-[13px] [&_.hl]:!bg-[rgba(192,251,80,0.12)]">
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
                    <span className="kl-mono mt-0.5 flex size-6 shrink-0 items-center justify-center bg-[var(--kl-black)] text-[10.5px] text-[var(--kl-lime)]">{i + 1}</span>
                    <div className="text-[15.5px] leading-relaxed text-[var(--kl-body)]">{it}</div>
                </li>
            ))}
        </ol>
    );
}

/** Comparison table, e.g. designer word ↔ developer word. */
export function Table({ head, rows, mono = [] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
    return (
        <div className="kl-scrollbox max-w-[900px] overflow-x-auto border border-[var(--kl-line-2)] bg-[var(--kl-panel)]">
            <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
                <thead>
                    <tr className="bg-[var(--kl-black)]">
                        {head.map((h) => (
                            <th key={h} className="kl-mono px-4 py-3 text-[10.5px] font-normal uppercase text-white/70">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--kl-line)] align-top">
                            {r.map((cell, j) => (
                                <td
                                    key={j}
                                    className={cn(
                                        'px-4 py-3 leading-relaxed text-[var(--kl-body)]',
                                        j === 0 && 'font-medium text-[var(--kl-ink)]',
                                        mono.includes(j) && 'kl-mono text-[12.5px] text-[var(--kl-lav-ink)]',
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
        <div className="max-w-[72ch] border border-dashed border-[var(--kl-line-2)] px-5 py-4">
            <div className="kl-mono mb-2.5 flex items-center gap-2 text-[10.5px] uppercase text-[var(--kl-lav-deep)]">
                <span className="kl-dot" />
                Try this
            </div>
            <ul className="space-y-1.5">
                {items.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[14.5px] leading-relaxed text-[var(--kl-body)]">
                        <span className="text-[var(--kl-lav)]" aria-hidden>
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
        <div className={cn('p-5', tint ? 'bg-[var(--kl-panel-2)]' : 'border border-[var(--kl-line-2)] bg-[var(--kl-panel)]')}>
            {kicker && (
                <div className="kl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase text-[var(--kl-lav-deep)]">
                    <span className="kl-dot" />
                    {kicker}
                </div>
            )}
            <div className="mb-2 text-[16.5px] font-semibold tracking-[-0.02em]">{title}</div>
            <div className="text-[14.5px] leading-relaxed text-[var(--kl-dim)]">{children}</div>
        </div>
    );
}
