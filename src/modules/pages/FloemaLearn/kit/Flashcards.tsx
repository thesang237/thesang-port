import { useEffect, useRef, useState } from 'react';

import { type Card, CHAPTERS } from '../content/chapters';

export function Flashcards({ cards }: { cards: Card[] }) {
    const [open, setOpen] = useState<number[]>([]);
    return (
        <section className="fl-flashcards" aria-label="Chapter flashcards">
            <div className="fl-section-label">
                <span className="fl-label">LOCK IT IN</span>
                <p>Try to answer, then turn a card.</p>
            </div>
            <div className="fl-card-grid">
                {cards.map((card, index) => (
                    <button
                        key={card.question}
                        className={`fl-flashcard ${open.includes(index) ? 'is-open' : ''}`}
                        aria-expanded={open.includes(index)}
                        onClick={() => setOpen((previous) => (previous.includes(index) ? previous.filter((i) => i !== index) : [...previous, index]))}
                    >
                        <span className="fl-label">
                            {String(index + 1).padStart(2, '0')} / {open.includes(index) ? 'ANSWER' : 'QUESTION'}
                        </span>
                        <strong>{card.question}</strong>
                        {open.includes(index) && <span>{card.answer}</span>}
                        <small>{open.includes(index) ? 'Hide answer −' : 'Show answer +'}</small>
                    </button>
                ))}
            </div>
        </section>
    );
}
const POOL = CHAPTERS.flatMap((chapter) => chapter.cards.map((card) => ({ ...card, chapter: chapter.id, label: chapter.label })));
export function Quiz() {
    const heading = useRef<HTMLHeadingElement>(null);
    const [questions, setQuestions] = useState<typeof POOL>([]);
    const [position, setPosition] = useState(0);
    const [shown, setShown] = useState(false);
    const [missed, setMissed] = useState<typeof POOL>([]);
    useEffect(() => {
        if (questions.length) heading.current?.focus({ preventScroll: true });
    }, [position, shown, questions.length]);
    const start = () => {
        const shuffled = [...POOL];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setQuestions(shuffled.slice(0, 10));
        setPosition(0);
        setShown(false);
        setMissed([]);
    };
    const grade = (correct: boolean) => {
        if (!correct) setMissed((old) => [...old, questions[position]]);
        setPosition(position + 1);
        setShown(false);
    };
    return (
        <div className="fl-quiz">
            {questions.length === 0 ? (
                <>
                    <span className="fl-label">FINAL QUIZ</span>
                    <h3>Can you explain the core rules?</h3>
                    <p>10 questions drawn from all 13 chapters. Recall first, reveal second. You grade yourself.</p>
                    <button className="fl-button fl-primary" onClick={start}>
                        Start the quiz →
                    </button>
                </>
            ) : position >= questions.length ? (
                <>
                    <span className="fl-label">COMPLETE</span>
                    <h3 ref={heading} tabIndex={-1}>
                        {10 - missed.length} / 10 remembered
                    </h3>
                    <p>{missed.length ? 'Revisit these ideas, then try again.' : 'Choose one technique and build something with it.'}</p>
                    {missed.map((q) => (
                        <p key={q.question}>
                            <a href={`#${q.chapter}`}>{q.label} →</a> {q.question}
                        </p>
                    ))}
                    <button className="fl-button" onClick={start}>
                        Try another set ↺
                    </button>
                </>
            ) : (
                <>
                    <span className="fl-label">
                        {position + 1} / 10 · {questions[position].label}
                    </span>
                    <h3 ref={heading} tabIndex={-1}>
                        {questions[position].question}
                    </h3>
                    {shown ? (
                        <>
                            <p className="fl-quiz-answer">{questions[position].answer}</p>
                            <div className="fl-action-row">
                                <button className="fl-button fl-primary" onClick={() => grade(true)}>
                                    I had it
                                </button>
                                <button className="fl-button" onClick={() => grade(false)}>
                                    Not quite
                                </button>
                            </div>
                        </>
                    ) : (
                        <button className="fl-button" onClick={() => setShown(true)}>
                            Reveal answer
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
