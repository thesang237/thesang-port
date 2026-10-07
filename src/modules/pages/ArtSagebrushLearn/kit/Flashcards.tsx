'use client';

import { useState } from 'react';

import type { RecallCard } from '../content/lessons';

function Flashcard({ card, number }: { card: RecallCard; number: number }) {
    const [revealed, setRevealed] = useState(false);
    return (
        <button type="button" className="sg-flashcard" aria-expanded={revealed} onClick={() => setRevealed(!revealed)}>
            <span className="sg-label">
                Recall {String(number).padStart(2, '0')} · {revealed ? 'Hide answer −' : 'Reveal answer +'}
            </span>
            <strong>{card.question}</strong>
            {revealed && <span>{card.answer}</span>}
        </button>
    );
}
export function Flashcards({ cards }: { cards: readonly RecallCard[] }) {
    return (
        <div className="sg-flashcards">
            {cards.map((card, index) => (
                <Flashcard key={card.question} card={card} number={index + 1} />
            ))}
        </div>
    );
}
