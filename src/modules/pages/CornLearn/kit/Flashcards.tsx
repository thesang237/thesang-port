'use client';

import { useState } from 'react';

import { cn } from '@/utils/cn';

import type { Flashcard } from '../content/cards';

import { Ring } from './ui';

/** Flip cards: read the question, guess, flip. Tap again to flip back. */
export function Flashcards({ cards, title = 'Lock it in' }: { cards: Flashcard[]; title?: string }) {
    const [flipped, setFlipped] = useState<boolean[]>(() => cards.map(() => false));
    const count = flipped.filter(Boolean).length;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="cl-mono mb-1 flex items-center gap-2 text-[10.5px] uppercase text-[var(--cl-mint)]">
                        <Ring arc={(count / cards.length) * 100} />
                        {title}
                    </div>
                    <p className="text-[14.5px] text-[var(--cl-dim)]">Answer in your head first, then flip. Memory sticks when you try to recall before you look.</p>
                </div>
                <div className="cl-mono flex items-center gap-3 text-[11px] text-[var(--cl-faint)]">
                    <span className="tabular-nums">{`${count} / ${cards.length} flipped`}</span>
                    <button
                        type="button"
                        onClick={() => setFlipped(cards.map(() => false))}
                        className="cl-btn rounded-full border border-[var(--cl-line-2)] px-2.5 py-1 uppercase hover:border-[var(--cl-mint)] hover:text-[var(--cl-mint)]"
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
                        className={cn('cl-card h-[220px] text-left', flipped[i] && 'is-flipped')}
                        aria-label={flipped[i] ? `Answer: ${c.a}` : `Question: ${c.q}`}
                    >
                        <span className="cl-card-inner block">
                            <span className="cl-card-face flex flex-col justify-between rounded-xl border border-[var(--cl-line-2)] bg-[var(--cl-panel)] p-5">
                                <span className="cl-mono text-[10.5px] uppercase text-[var(--cl-faint)]">{`Q${String(i + 1).padStart(2, '0')}`}</span>
                                <span className="text-[18.5px] font-semibold leading-snug tracking-[-0.015em]">{c.q}</span>
                                <span className="cl-mono text-[10.5px] uppercase text-[var(--cl-mint)]">Tap to flip ↻</span>
                            </span>
                            <span className="cl-card-face cl-card-back flex flex-col justify-between rounded-xl border border-[rgba(85,255,194,0.35)] bg-[#06150e] p-5">
                                <span className="cl-mono text-[10.5px] uppercase text-[var(--cl-mint)]">Answer</span>
                                <span className="text-[15px] leading-relaxed text-white/90">{c.a}</span>
                                <span />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
