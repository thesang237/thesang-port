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
                    <div className="kl-mono mb-1 flex items-center gap-2 text-[10.5px] uppercase text-[var(--kl-lav-deep)]">
                        <span className="kl-dot" />
                        {title}
                    </div>
                    <p className="text-[14px] text-[var(--kl-dim)]">Answer in your head first, then flip. Memory sticks when you try to recall before you look.</p>
                </div>
                <div className="kl-mono flex items-center gap-3 text-[11px] text-[var(--kl-faint)]">
                    <span className="tabular-nums">{`${count} / ${cards.length} flipped`}</span>
                    <button
                        type="button"
                        onClick={() => setFlipped(cards.map(() => false))}
                        className="kl-btn border border-[var(--kl-line-2)] px-2 py-1 uppercase hover:border-[var(--kl-black)] hover:text-[var(--kl-ink)]"
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
                        className={cn('kl-card h-[210px] text-left', flipped[i] && 'is-flipped')}
                        aria-label={flipped[i] ? `Answer: ${c.a}` : `Question: ${c.q}`}
                    >
                        <span className="kl-card-inner block">
                            <span className="kl-card-face kl-notch flex flex-col justify-between bg-[var(--kl-panel)] p-5 pt-7 shadow-[inset_0_0_0_1px_var(--kl-line-2)]">
                                <span className="kl-mono text-[10.5px] uppercase text-[var(--kl-faint)]">{`Q${String(i + 1).padStart(2, '0')}`}</span>
                                <span className="text-[18px] font-semibold leading-snug tracking-[-0.025em]">{c.q}</span>
                                <span className="kl-mono text-[10.5px] uppercase text-[var(--kl-lav-deep)]">Tap to flip ↻</span>
                            </span>
                            <span className="kl-card-face kl-card-back kl-cut flex flex-col justify-between bg-[var(--kl-black)] p-5">
                                <span className="kl-mono text-[10.5px] uppercase text-[var(--kl-lime)]">Answer</span>
                                <span className="text-[14.5px] leading-relaxed text-white/90">{c.a}</span>
                                <span />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
