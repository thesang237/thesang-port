'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import type { Flashcard } from '../content/cards';

/** Flip cards: read the question, guess, flip. Tap again to flip back. */
export function Flashcards({ cards, title = 'Lock it in' }: { cards: Flashcard[]; title?: string }) {
    const [flipped, setFlipped] = useState<boolean[]>(() => cards.map(() => false));
    const count = flipped.filter(Boolean).length;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="il-mono mb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--il-mint)]">{title}</div>
                    <p className="text-[14px] text-[var(--il-dim)]">Answer in your head first, then flip. Memory sticks when you try to recall before you look.</p>
                </div>
                <div className="il-mono flex items-center gap-3 text-[11px] text-[var(--il-faint)]">
                    <span className="tabular-nums">{`${count} / ${cards.length} flipped`}</span>
                    <button
                        type="button"
                        onClick={() => setFlipped(cards.map(() => false))}
                        className="il-btn rounded-md border border-[var(--il-line)] px-2 py-1 uppercase tracking-[0.12em] hover:text-[var(--il-ink)]"
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
                        className={cn('il-card h-[210px] text-left', flipped[i] && 'is-flipped')}
                        aria-label={flipped[i] ? `Answer: ${c.a}` : `Question: ${c.q}`}
                    >
                        <span className="il-card-inner block">
                            <span className="il-card-face flex flex-col justify-between rounded-2xl border border-[var(--il-line-2)] bg-[var(--il-panel)] p-5">
                                <span className="il-mono text-[10px] uppercase tracking-[0.16em] text-[var(--il-faint)]">{`Q${String(i + 1).padStart(2, '0')}`}</span>
                                <span className="text-[17px] font-medium leading-snug tracking-[-0.01em]">{c.q}</span>
                                <span className="il-mono text-[10px] uppercase tracking-[0.16em] text-[var(--il-ice)]">Tap to flip ↻</span>
                            </span>
                            <span className="il-card-face il-card-back flex flex-col justify-between rounded-2xl border border-[rgba(174,240,216,0.3)] bg-[linear-gradient(160deg,rgba(174,240,216,0.08),rgba(148,219,255,0.03))] p-5">
                                <span className="il-mono text-[10px] uppercase tracking-[0.16em] text-[var(--il-mint)]">Answer</span>
                                <span className="text-[14.5px] leading-relaxed text-[#dde6ee]">{c.a}</span>
                                <span />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
