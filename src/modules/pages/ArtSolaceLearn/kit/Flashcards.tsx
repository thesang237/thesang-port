'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import type { Flashcard } from '../content/cards';

import { Grain } from './ui';

/** Flip cards: read the question, guess, flip. Tap again to flip back. */
export function Flashcards({ cards, title = 'Lock it in' }: { cards: Flashcard[]; title?: string }) {
    const [flipped, setFlipped] = useState<boolean[]>(() => cards.map(() => false));
    const count = flipped.filter(Boolean).length;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="sl-mono mb-1 flex items-center gap-2 text-[10.5px] uppercase text-[var(--sl-rust-ink)]">
                        <Grain filled={count === cards.length} />
                        {title}
                    </div>
                    <p className="text-[14.5px] text-[var(--sl-dim)]">Answer in your head first, then flip. Memory sticks when you try to recall before you look.</p>
                </div>
                <div className="sl-mono flex items-center gap-3 text-[11px] text-[var(--sl-faint)]">
                    <span className="tabular-nums">{`${count} / ${cards.length} flipped`}</span>
                    <button
                        type="button"
                        onClick={() => setFlipped(cards.map(() => false))}
                        className="sl-btn rounded-full border border-[var(--sl-line-2)] px-2.5 py-1 uppercase hover:border-[var(--sl-rust-ink)] hover:text-[var(--sl-rust-ink)]"
                    >
                        Reset
                    </button>
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((c, i) => (
                    <button
                        key={c.q}
                        type="button"
                        onClick={() => setFlipped((f) => f.map((v, j) => (j === i ? !v : v)))}
                        className={cn('sl-card h-[220px] text-left', flipped[i] && 'is-flipped')}
                        aria-label={flipped[i] ? `Answer: ${c.a}` : `Question: ${c.q}`}
                    >
                        <span className="sl-card-inner block">
                            <span className="sl-card-face flex flex-col justify-between rounded-xl border border-[var(--sl-line-2)] bg-[var(--sl-panel)] p-5">
                                <span className="sl-mono text-[10.5px] uppercase text-[var(--sl-faint)]">{`Q${String(i + 1).padStart(2, '0')}`}</span>
                                <span className="text-[18.5px] font-semibold leading-snug tracking-[-0.015em]">{c.q}</span>
                                <span className="sl-mono text-[10.5px] uppercase text-[var(--sl-rust-ink)]">Tap to flip ↻</span>
                            </span>
                            <span className="sl-card-face sl-card-back flex flex-col justify-between rounded-xl border border-[var(--sl-rust)] bg-[var(--sl-ink)] p-5">
                                <span className="sl-mono text-[10.5px] uppercase text-[var(--sl-rust)]">Answer</span>
                                <span className="text-[15px] leading-relaxed text-[#f6ede4]">{c.a}</span>
                                <span />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
