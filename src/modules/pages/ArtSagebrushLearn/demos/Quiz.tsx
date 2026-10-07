'use client';

import { useState } from 'react';

import { CHAPTERS } from '../content/chapters';
import { LESSONS } from '../content/lessons';

function makeQuestions() {
    // Stratify the sample: one random card from every chapter, then shuffle.
    return CHAPTERS.map((chapter) => {
        const cards = LESSONS[chapter.id].cards;
        return { ...cards[Math.floor(Math.random() * cards.length)], chapter };
    }).sort(() => Math.random() - 0.5);
}
export default function Quiz() {
    const [questions, setQuestions] = useState(makeQuestions);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [revealed, setRevealed] = useState(false);
    const current = questions[answers.length];
    const reset = () => {
        setQuestions(makeQuestions());
        setAnswers([]);
        setRevealed(false);
    };
    return (
        <div className="sg-quiz">
            <span className="sg-label">Field test · one question from each chapter</span>
            {current ? (
                <>
                    <p className="sg-quiz-count">
                        {answers.length + 1} / {questions.length} · {current.chapter.label}
                    </p>
                    <h3>{current.question}</h3>
                    <div className="sg-answer" aria-live="polite">
                        {revealed ? current.answer : 'Say your answer before revealing it.'}
                    </div>
                    {revealed ? (
                        <div className="sg-actions">
                            {[
                                ['I had it', true],
                                ['Not quite', false],
                            ].map(([label, correct]) => (
                                <button
                                    type="button"
                                    key={String(label)}
                                    onClick={() => {
                                        setAnswers([...answers, Boolean(correct)]);
                                        setRevealed(false);
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button type="button" onClick={() => setRevealed(true)}>
                            Reveal answer
                        </button>
                    )}
                </>
            ) : (
                <>
                    <h3>{answers.filter(Boolean).length} of 10 remembered</h3>
                    <p>Return to these ideas, then take another pass.</p>
                    <ul>
                        {questions
                            .filter((_, index) => !answers[index])
                            .map((question) => (
                                <li key={question.question}>
                                    <a href={`#${question.chapter.id}`}>
                                        {question.chapter.label}: {question.question}
                                    </a>
                                </li>
                            ))}
                    </ul>
                    {answers.every(Boolean) && <p>You recalled every idea. Try applying one to a new study.</p>}
                    <button type="button" onClick={reset}>
                        Start a new quiz
                    </button>
                </>
            )}
        </div>
    );
}
