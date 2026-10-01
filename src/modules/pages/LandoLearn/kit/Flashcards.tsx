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
                    <div className="ll-mono mb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ll-mint)]">{title}</div>
                    <p className="text-[14px] text-[var(--ll-dim)]">Answer in your head first, then flip. Memory sticks when you try to recall before you look.</p>
                </div>
                <div className="ll-mono flex items-center gap-3 text-[11px] text-[var(--ll-faint)]">
                    <span className="tabular-nums">{`${count} / ${cards.length} flipped`}</span>
                    <button
                        type="button"
                        onClick={() => setFlipped(cards.map(() => false))}
                        className="ll-btn rounded-md border border-[var(--ll-line)] px-2 py-1 uppercase tracking-[0.12em] hover:text-[var(--ll-ink)]"
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
                        className={cn('ll-card h-[210px] text-left', flipped[i] && 'is-flipped')}
                        aria-label={flipped[i] ? `Answer: ${c.a}` : `Question: ${c.q}`}
                    >
                        <span className="ll-card-inner block">
                            <span className="ll-card-face flex flex-col justify-between rounded-2xl border border-[var(--ll-line-2)] bg-[var(--ll-panel)] p-5">
                                <span className="ll-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ll-faint)]">{`Q${String(i + 1).padStart(2, '0')}`}</span>
                                <span className="text-[17px] font-medium leading-snug tracking-[-0.01em]">{c.q}</span>
                                <span className="ll-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ll-lime)]">Tap to flip ↻</span>
                            </span>
                            <span className="ll-card-face ll-card-back flex flex-col justify-between rounded-2xl border border-[rgba(168,216,176,0.3)] bg-[linear-gradient(160deg,rgba(168,216,176,0.08),rgba(205,255,11,0.03))] p-5">
                                <span className="ll-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ll-mint)]">Answer</span>
                                <span className="text-[14.5px] leading-relaxed text-[#e4e7da]">{c.a}</span>
                                <span />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
