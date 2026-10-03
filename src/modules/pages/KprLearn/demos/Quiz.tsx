'use client';

import { useState } from 'react';

import { CARDS } from '../content/cards';
import { CHAPTERS } from '../content/chapters';
import { Btn, Demo } from '../kit/controls';

type Q = { q: string; a: string; chapter: string };

const POOL: Q[] = CHAPTERS.flatMap((c) => CARDS[c.id].map((card) => ({ ...card, chapter: `${c.n} ${c.label}` })));

const draw = (n: number) => {
    const pool = [...POOL];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n);
};

/** Self-graded recall quiz across every chapter. Say the answer out loud, then check. */
export default function Quiz() {
    const [set, setSet] = useState<Q[]>(() => draw(10));
    const [i, setI] = useState(0);
    const [shown, setShown] = useState(false);
    const [score, setScore] = useState<boolean[]>([]);
    const done = i >= set.length;
    const q = set[i];

    const grade = (ok: boolean) => {
        setScore((s) => [...s, ok]);
        setShown(false);
        setI((n) => n + 1);
    };
    const restart = () => {
        setSet(draw(10));
        setI(0);
        setScore([]);
        setShown(false);
    };
    const right = score.filter(Boolean).length;

    return (
        <Demo title={`Final quiz — ${POOL.length} cards, 10 at random`} hint="Answer in your head (or out loud) before revealing. Be honest with the grade — it only helps you.">
            <div className="p-5 sm:p-8">
                <div className="mb-5 flex gap-1">
                    {set.map((_, k) => (
                        <span
                            key={k}
                            className="h-1 flex-1"
                            style={{ background: k < score.length ? (score[k] ? 'var(--kl-lav)' : 'var(--kl-warn)') : k === i ? 'var(--kl-black)' : 'rgba(12,12,14,0.12)' }}
                        />
                    ))}
                </div>
                {!done ? (
                    <div className="min-h-[260px]">
                        <div className="kl-mono mb-3 text-[10.5px] uppercase text-[var(--kl-faint)]">{`Question ${i + 1} / ${set.length} · from ${q.chapter}`}</div>
                        <p className="mb-6 max-w-[40ch] text-[clamp(20px,2.4vw,28px)] font-semibold leading-snug tracking-[-0.03em]">{q.q}</p>
                        {shown ? (
                            <>
                                <p className="kl-cut mb-6 max-w-[64ch] bg-[var(--kl-black)] p-4 text-[15px] leading-relaxed text-white/90">{q.a}</p>
                                <div className="flex flex-wrap gap-2">
                                    <Btn primary onClick={() => grade(true)}>
                                        ✓ I had it
                                    </Btn>
                                    <Btn onClick={() => grade(false)}>✗ Not quite</Btn>
                                </div>
                            </>
                        ) : (
                            <Btn primary onClick={() => setShown(true)}>
                                Reveal answer
                            </Btn>
                        )}
                    </div>
                ) : (
                    <div className="min-h-[260px]">
                        <div className="kl-mono mb-2 text-[10.5px] uppercase text-[var(--kl-lav-deep)]">Done</div>
                        <p className="kl-display mb-2 text-[clamp(32px,5vw,56px)]">{`${right} / ${set.length}`}</p>
                        <p className="mb-6 max-w-[56ch] text-[15px] leading-relaxed text-[var(--kl-dim)]">
                            {right >= 8
                                ? 'You can explain this page to a developer — and design the next one. Try building one of the practice briefs below.'
                                : right >= 5
                                  ? 'Solid. Revisit the chapters of the ones you missed, play with their demos for two minutes, then retake.'
                                  : 'Good start. Re-read chapters 00, 02 and 06 — they carry the core ideas — then come back.'}
                        </p>
                        {score.some((s) => !s) && (
                            <ul className="mb-6 space-y-1 text-[13px] text-[var(--kl-dim)]">
                                {set.map((qq, k) =>
                                    score[k] ? null : (
                                        <li key={qq.q}>
                                            <span className="kl-mono text-[var(--kl-warn)]">{qq.chapter}</span> — {qq.q}
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}
                        <Btn primary onClick={restart}>
                            ↻ New set of 10
                        </Btn>
                    </div>
                )}
            </div>
        </Demo>
    );
}
