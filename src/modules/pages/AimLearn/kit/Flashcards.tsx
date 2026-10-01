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
                    <div className="al-mono mb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--al-blue)]">{title}</div>
                    <p className="text-[14px] text-[var(--al-dim)]">Answer in your head first, then flip. Memory sticks when you try to recall before you look.</p>
                </div>
                <div className="al-mono flex items-center gap-3 text-[11px] text-[var(--al-faint)]">
                    <span className="tabular-nums">{`${count} / ${cards.length} flipped`}</span>
                    <button
                        type="button"
                        onClick={() => setFlipped(cards.map(() => false))}
                        className="al-btn border border-[var(--al-line-2)] px-2 py-1 uppercase tracking-[0.12em] hover:text-[var(--al-ink)]"
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
                        className={cn('al-card h-[210px] text-left', flipped[i] && 'is-flipped')}
                        aria-label={flipped[i] ? `Answer: ${c.a}` : `Question: ${c.q}`}
                    >
                        <span className="al-card-inner block">
                            <span className="al-card-face flex flex-col justify-between border border-[var(--al-ink)] bg-[var(--al-panel)] p-5">
                                <span className="al-mono text-[10px] uppercase tracking-[0.16em] text-[var(--al-faint)]">{`Q${String(i + 1).padStart(2, '0')}`}</span>
                                <span className="al-display text-[19px] leading-snug tracking-[-0.01em]">{c.q}</span>
                                <span className="al-mono text-[10px] uppercase tracking-[0.16em] text-[var(--al-accent-ink)]">Tap to flip ↻</span>
                            </span>
                            <span className="al-card-face al-card-back flex flex-col justify-between border border-[var(--al-ink)] bg-[var(--al-ink)] p-5">
                                <span className="al-mono text-[10px] uppercase tracking-[0.16em] text-[var(--al-accent)]">Answer</span>
                                <span className="text-[14.5px] leading-relaxed text-[var(--al-bg)]">{c.a}</span>
                                <span />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
