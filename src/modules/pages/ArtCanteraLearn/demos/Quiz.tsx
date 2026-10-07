'use client';
import { useState } from 'react';

import { CHAPTERS } from '../content/chapters';
import { LocalRandom } from '../kit/art';

function deal() {
    const random = new LocalRandom(Date.now());
    const deck = CHAPTERS.map((chapter) => ({
        ...chapter.cards[Math.floor(random.next() * chapter.cards.length)],
        chapter: chapter.id,
        label: chapter.label,
    }));
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(random.next() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
export default function Quiz() {
    const [deck, setDeck] = useState(deal),
        [index, setIndex] = useState(0),
        [revealed, setRevealed] = useState(false),
        [missed, setMissed] = useState<number[]>([]);
    const answer = (remembered: boolean) => {
        if (!remembered) setMissed((current) => [...current, index]);
        setIndex(index + 1);
        setRevealed(false);
    };
    return (
        <section className="cl-quiz" aria-labelledby="quiz-title">
            <span className="cl-label">Final recall · one question from every chapter</span>
            <h3 id="quiz-title">Can you explain the quarry?</h3>
            {index < deck.length ? (
                <>
                    <p className="cl-label">
                        {index + 1} / {deck.length} · {deck[index].label}
                    </p>
                    <h4>{deck[index].question}</h4>
                    {revealed ? (
                        <>
                            <p>{deck[index].answer}</p>
                            <div className="cl-actions">
                                <button type="button" className="cl-button" onClick={() => answer(true)}>
                                    I had it
                                </button>
                                <button type="button" className="cl-button" onClick={() => answer(false)}>
                                    Not quite
                                </button>
                            </div>
                        </>
                    ) : (
                        <button type="button" className="cl-button" onClick={() => setRevealed(true)}>
                            Reveal answer
                        </button>
                    )}
                </>
            ) : (
                <>
                    <p role="status">
                        {deck.length - missed.length} / {deck.length} remembered. {missed.length ? 'Revisit these ideas:' : 'Every chapter is accounted for.'}
                    </p>
                    <ul>
                        {missed.map((i) => (
                            <li key={i}>
                                <a href={`#${deck[i].chapter}`}>
                                    {deck[i].label} → {deck[i].question}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        className="cl-button"
                        onClick={() => {
                            setDeck(deal());
                            setIndex(0);
                            setMissed([]);
                            setRevealed(false);
                        }}
                    >
                        Deal a new quiz ↺
                    </button>
                </>
            )}
        </section>
    );
}
