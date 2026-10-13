'use client';
import { useState } from 'react';

import { cards, chapters } from './catalog';
const pool = chapters.flatMap((chapter) => cards[chapter.id].map((card) => ({ ...card, chapter: chapter.id, label: chapter.label })));
function draw() {
    const next = [...pool];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next.slice(0, 10);
}
export default function Quiz() {
    const [deck, setDeck] = useState(draw);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [revealed, reveal] = useState(false);
    const current = deck[answers.length];
    const grade = (correct: boolean) => {
        setAnswers((old) => [...old, correct]);
        reveal(false);
    };
    return (
        <section className="f2l-quiz" aria-label="Final recall quiz">
            <header>
                <div>
                    <span className="f2l-eyebrow">THE FINAL RECALL / POOLED FROM ALL CHAPTERS</span>
                    <h3>Explain it without the dials.</h3>
                </div>
                <span>{Math.min(answers.length + 1, 10)} / 10</span>
            </header>
            {current ? (
                <>
                    <p className="f2l-quiz-chapter">{current.label}</p>
                    <h4>{current.q}</h4>
                    {revealed ? (
                        <>
                            <p className="f2l-quiz-answer" aria-live="polite">
                                {current.a}
                            </p>
                            <div className="f2l-quiz-actions">
                                <button className="f2l-button f2l-primary" onClick={() => grade(true)}>
                                    I had it ✓
                                </button>
                                <button className="f2l-button" onClick={() => grade(false)}>
                                    Not quite
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Say your answer in your own words before you reveal it.</p>
                            <button className="f2l-button" onClick={() => reveal(true)}>
                                Reveal the answer ↗
                            </button>
                        </>
                    )}
                </>
            ) : (
                <div className="f2l-quiz-result" role="status">
                    <strong>{answers.filter(Boolean).length} / 10 recalled</strong>
                    <p>{answers.every(Boolean) ? 'You have the system in your head. Try a fresh set or build a small scene from scratch.' : 'Revisit the ideas below, then try a fresh set.'}</p>
                    <ul>
                        {deck
                            .filter((_, i) => !answers[i])
                            .map((item) => (
                                <li key={item.q}>
                                    <a href={`#${item.chapter}`}>
                                        {item.q}
                                        <span>Revisit {item.label} ↗</span>
                                    </a>
                                </li>
                            ))}
                    </ul>
                    <button
                        className="f2l-button"
                        onClick={() => {
                            setDeck(draw());
                            setAnswers([]);
                            reveal(false);
                        }}
                    >
                        Draw a new quiz ↻
                    </button>
                </div>
            )}
        </section>
    );
}
