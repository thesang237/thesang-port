'use client';

import type { ReactNode } from 'react';

import { CodeBlock } from '@/components/code-block';
import { cn } from '@/utils/cn';

import { GLOSSARY } from '../content/glossary';

// ─── Chapter + section scaffolding ──────────────────────────────────────────

/** A square grain mark: filled when done, outlined when not (the sand dot as an icon). */
export function Grain({ filled = true, className }: { filled?: boolean; className?: string }) {
    return <span aria-hidden className={cn('inline-block size-[7px] shrink-0 border border-current', filled && 'bg-current', className)} />;
}

export function ChapterHead({ n, kicker, title, lead, children }: { n: string; kicker: string; title: ReactNode; lead: ReactNode; children?: ReactNode }) {
    return (
        <header className="mb-14 sm:mb-20">
            <div className="sl-mono mb-6 flex items-center gap-3 text-[11px] uppercase text-[var(--sl-dim)]">
                <span className="sl-serif text-[44px] leading-none text-[var(--sl-rust-ink)]">{n}</span>
                <Grain />
                <span>{kicker}</span>
            </div>
            <h1 className="sl-head mb-6 max-w-[16ch] text-[clamp(44px,7vw,92px)]">{title}</h1>
            <p className="max-w-[60ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[var(--sl-dim)]">{lead}</p>
            {children}
        </header>
    );
}

export function Section({ id, n, title, children, className }: { id: string; n: string; title: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section id={id} className={cn('scroll-mt-32 border-t border-[var(--sl-line-2)] pb-6 pt-12 sm:pt-16', className)}>
            <div className="sl-mono mb-3 flex items-center gap-2 text-[11px] uppercase text-[var(--sl-faint)]">
                <span className="sl-dot text-[var(--sl-rust)]" />
                {n}
            </div>
            <h2 data-toc={id} className="sl-serif mb-6 max-w-[24ch] text-[clamp(30px,3.6vw,44px)] leading-[1.05]">
                {title}
            </h2>
            <div className="space-y-6">{children}</div>
        </section>
    );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('sl-p', className)}>{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
    return <code className="sl-code-inline">{children}</code>;
}

/** Glossary word: dotted underline, plain-language tooltip on hover/focus. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children?: ReactNode }) {
    const entry = GLOSSARY[k];
    if (!entry) return <>{children}</>;
    return (
        <span className="sl-term" tabIndex={0}>
            {children ?? entry.term}
            <span role="tooltip" className="sl-term-tip rounded-md border border-[var(--sl-line-2)] bg-[var(--sl-code)] p-3.5 text-left shadow-2xl">
                <span className="sl-mono mb-1.5 flex items-center gap-2 text-[10px] uppercase text-[var(--sl-rust)]">
                    <span className="sl-dot" />
                    {entry.term}
                </span>
                <span className="block text-[13px] font-normal leading-relaxed text-[#efe6dc]">{entry.plain}</span>
                {entry.lens && <span className="mt-2 block border-t border-white/10 pt-2 text-[12px] leading-snug text-[#f2b9a6]">{`◇ ${entry.lens}`}</span>}
            </span>
        </span>
    );
}

// ─── Teaching blocks ────────────────────────────────────────────────────────

/** "Designer lens": map the new idea onto something you already know. */
export function Lens({ title = 'Designer lens', children }: { title?: string; children: ReactNode }) {
    return (
        <aside className="relative max-w-[72ch] rounded-xl border border-[var(--sl-line-2)] bg-[var(--sl-panel)] p-5 pr-6 sm:p-6">
            <div className="sl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase text-[var(--sl-rust-ink)]">
                <span aria-hidden>◇</span>
                {title}
            </div>
            <div className="text-[15.5px] leading-relaxed text-[var(--sl-body)]">{children}</div>
        </aside>
    );
}

/** The one line worth memorising. */
export function KeyIdea({ children }: { children: ReactNode }) {
    return (
        <div className="relative max-w-[66ch] overflow-hidden rounded-xl bg-[var(--sl-ink)] px-5 py-5 sm:px-7">
            <div className="sl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase text-[var(--sl-rust)]">
                <Grain />
                Remember
            </div>
            <p className="sl-serif text-[clamp(22px,2.4vw,28px)] leading-snug text-[#f6ede4]">{children}</p>
        </div>
    );
}

export function Callout({ tone = 'tip', title, children }: { tone?: 'tip' | 'warn' | 'meta'; title?: string; children: ReactNode }) {
    const tones = {
        tip: { c: 'var(--sl-rust-ink)', b: 'var(--sl-rust)', bg: 'rgba(222,132,113,0.08)', icon: '✦', label: 'Tip' },
        warn: { c: 'var(--sl-warn)', b: 'rgba(194,65,47,0.55)', bg: 'rgba(194,65,47,0.06)', icon: '!', label: 'Watch out' },
        meta: { c: 'var(--sl-dim)', b: 'var(--sl-line-3)', bg: 'rgba(30,28,33,0.03)', icon: '↻', label: 'This guide does it too' },
    }[tone];
    return (
        <div className="max-w-[72ch] border-l-2 px-4 py-3.5 sm:px-5" style={{ borderColor: tones.b, background: tones.bg }}>
            <div className="sl-mono mb-1 flex items-center gap-2 text-[10.5px] uppercase" style={{ color: tones.c }}>
                <span aria-hidden>{tones.icon}</span>
                {title ?? tones.label}
            </div>
            <div className="text-[15px] leading-relaxed text-[var(--sl-body)]">{children}</div>
        </div>
    );
}

/** Where the technique lives in the real source (paths relative to src/modules/pages/ArtSolace). */
export function Where({ files }: { files: { path: string; note?: string }[] }) {
    return (
        <div className="flex max-w-[72ch] flex-wrap items-center gap-2">
            <span className="sl-mono text-[10.5px] uppercase text-[var(--sl-faint)]">In the source →</span>
            {files.map((f) => (
                <span key={f.path} className="sl-mono inline-flex items-center gap-1.5 rounded-full border border-[var(--sl-line-2)] bg-[var(--sl-panel)] px-2.5 py-1 text-[11px] text-[var(--sl-dim)]">
                    <span className="text-[var(--sl-ink)]">{f.path}</span>
                    {f.note && <span className="text-[var(--sl-faint)]">{`· ${f.note}`}</span>}
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
                <figcaption className="sl-mono mb-2 flex items-center gap-2 text-[11px] text-[var(--sl-dim)]">
                    <span className="sl-dot text-[var(--sl-rust)]" />
                    {file}
                </figcaption>
            )}
            <CodeBlock lang={lang} highlight={highlight} className="!rounded-lg !border !border-[var(--sl-line)] !bg-[var(--sl-code)] !p-5 text-[13px] [&_.hl]:!bg-[rgba(222,132,113,0.16)]">
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
                    <span className="sl-mono mt-0.5 flex size-6 shrink-0 items-center justify-center border border-[var(--sl-ink)] text-[10.5px] text-[var(--sl-ink)]">{i + 1}</span>
                    <div className="text-[16px] leading-relaxed text-[var(--sl-body)]">{it}</div>
                </li>
            ))}
        </ol>
    );
}

/** Comparison table, e.g. designer word ↔ code word. */
export function Table({ head, rows, mono = [] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
    return (
        <div className="sl-scrollbox max-w-[900px] overflow-x-auto rounded-lg border border-[var(--sl-line-2)] bg-[var(--sl-panel)]">
            <table className="w-full min-w-[560px] border-collapse text-left text-[14.5px]">
                <thead>
                    <tr className="bg-[var(--sl-panel-2)]">
                        {head.map((h) => (
                            <th key={h} className="sl-mono px-4 py-3 text-[10.5px] font-normal uppercase text-[var(--sl-dim)]">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--sl-line)] align-top">
                            {r.map((cell, j) => (
                                <td
                                    key={j}
                                    className={cn(
                                        'px-4 py-3 leading-relaxed text-[var(--sl-body)]',
                                        j === 0 && 'font-semibold text-[var(--sl-ink)]',
                                        mono.includes(j) && 'sl-mono text-[12.5px] text-[var(--sl-rust-ink)]',
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
        <div className="max-w-[72ch] rounded-lg border border-dashed border-[var(--sl-line-3)] px-5 py-4">
            <div className="sl-mono mb-2.5 flex items-center gap-2 text-[10.5px] uppercase text-[var(--sl-rust-ink)]">
                <span className="sl-dot" />
                Try this
            </div>
            <ul className="space-y-1.5">
                {items.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-[var(--sl-body)]">
                        <span className="text-[var(--sl-rust-ink)]" aria-hidden>
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
        <div className={cn('rounded-xl p-5', tint ? 'border border-[var(--sl-rust)] bg-[rgba(222,132,113,0.1)]' : 'border border-[var(--sl-line-2)] bg-[var(--sl-panel)]')}>
            {kicker && (
                <div className={cn('sl-mono mb-2 flex items-center gap-2 text-[10.5px] uppercase', tint ? 'text-[var(--sl-rust-ink)]' : 'text-[var(--sl-faint)]')}>
                    <span className="sl-dot" />
                    {kicker}
                </div>
            )}
            <div className="mb-2 text-[17px] font-semibold tracking-[-0.01em]">{title}</div>
            <div className="text-[15px] leading-relaxed text-[var(--sl-dim)]">{children}</div>
        </div>
    );
}
