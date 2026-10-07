'use client';
import { useState } from 'react';

import type { Card } from '../content/types';
function Flashcard({ card, number }: { card: Card; number: number }) {
    const [open, setOpen] = useState(false);
    return (
        <button type="button" className="dl-flashcard" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="dl-kicker">
                {String(number).padStart(2, '0')} / {open ? 'Answer · tap to close' : 'Recall · tap to reveal'}
            </span>
            <strong>{card.q}</strong>
            {open && <p>{card.a}</p>}
        </button>
    );
}
export function Flashcards({ cards }: { cards: Card[] }) {
    return (
        <section className="dl-flashcards" aria-label="Chapter flashcards">
            <div>
                <span className="dl-kicker">Keep the idea</span>
                <h3>Three things to remember.</h3>
                <p>Answer in your own words before you turn the card.</p>
            </div>
            <div>
                {cards.map((card, i) => (
                    <Flashcard key={card.q} card={card} number={i + 1} />
                ))}
            </div>
        </section>
    );
}
