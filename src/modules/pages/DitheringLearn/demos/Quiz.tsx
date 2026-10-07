'use client';
import { useState } from 'react';

import { CARDS } from '../content/cards';
import { CHAPTERS } from '../content/chapters';
function makeDeck() {
    const pool = CHAPTERS.flatMap((chapter) => CARDS[chapter.id].map((card) => ({ ...card, chapter })));
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 10);
}
export function Quiz() {
    const [deck, setDeck] = useState(makeDeck);
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [missed, setMissed] = useState<number[]>([]);
    const restart = () => {
        setDeck(makeDeck());
        setIndex(0);
        setRevealed(false);
        setMissed([]);
    };
    const grade = (remembered: boolean) => {
        if (!remembered) setMissed((m) => [...m, index]);
        setIndex(index + 1);
        setRevealed(false);
    };
    return (
        <div className="dl-quiz">
            <span className="dl-kicker">The final recall test · ten cards from the whole guide</span>
            {index < deck.length ? (
                <>
                    <div aria-live="polite">
                        <span className="dl-mini">
                            {index + 1} / 10 · {deck[index].chapter.label}
                        </span>
                        <h4>{deck[index].q}</h4>
                        {revealed && <p>{deck[index].a}</p>}
                    </div>
                    {revealed ? (
                        <div className="dl-actions">
                            <button type="button" onClick={() => grade(true)}>
                                I had it
                            </button>
                            <button type="button" onClick={() => grade(false)}>
                                Not quite
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setRevealed(true)}>
                            Reveal answer
                        </button>
                    )}
                </>
            ) : (
                <>
                    <h4>You recalled {10 - missed.length} of 10.</h4>
                    <p>{missed.length ? 'Revisit these ideas, then try another set.' : 'Now choose a subject and make a print with a deliberate texture.'}</p>
                    {missed.map((i) => (
                        <a key={i} href={`#${deck[i].chapter.id}`}>
                            {deck[i].chapter.label} → {deck[i].q}
                        </a>
                    ))}
                    <button type="button" onClick={restart}>
                        Shuffle another ten
                    </button>
                </>
            )}
        </div>
    );
}
