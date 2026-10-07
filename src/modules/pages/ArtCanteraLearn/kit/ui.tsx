'use client';

import { type ReactNode, useId, useState } from 'react';

import { CodeBlock } from '@/components/code-block';

export function Remember({ children }: { children: ReactNode }) {
    return (
        <p className="cl-remember">
            <span>Remember</span>
            {children}
        </p>
    );
}
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section className="cl-section" id={id}>
            <h3 data-toc={id}>{title}</h3>
            {children}
        </section>
    );
}
export function Lens({ children }: { children: ReactNode }) {
    return (
        <aside className="cl-lens">
            <span className="cl-label">Designer lens</span>
            <p>{children}</p>
        </aside>
    );
}
export function Code({ file, children, highlight = [] }: { file: string; children: string; highlight?: string[] }) {
    return (
        <figure className="cl-code">
            <figcaption>{file}</figcaption>
            <CodeBlock lang="javascript" highlight={highlight}>
                {children}
            </CodeBlock>
        </figure>
    );
}
export function Term({ word, meaning }: { word: string; meaning: string }) {
    const id = useId();
    return (
        <span tabIndex={0} className="cl-term" aria-describedby={id}>
            {word}
            <span id={id} role="tooltip">
                {meaning}
            </span>
        </span>
    );
}
export function Lab({ title, hint, children, controls, reset, note }: { title: string; hint: string; children: ReactNode; controls: ReactNode; reset: () => void; note?: string }) {
    return (
        <figure className="cl-lab">
            <figcaption>
                <div>
                    <span className="cl-label">Live study</span>
                    <h4>{title}</h4>
                    <p>{hint}</p>
                </div>
                <button type="button" className="cl-button" onClick={reset}>
                    Reset ↺
                </button>
            </figcaption>
            <div className="cl-lab-body">
                <div className="cl-stage">{children}</div>
                <div className="cl-controls">
                    {controls}
                    {note && <p className="cl-note">{note}</p>}
                </div>
            </div>
        </figure>
    );
}
export function Dial({ label, help, value, min, max, step = 1, onChange }: { label: string; help: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
    const id = useId();
    return (
        <div className="cl-dial">
            <div>
                <label htmlFor={id}>{label}</label>
                <output htmlFor={id}>{Number(value.toFixed(3))}</output>
            </div>
            <input id={id} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} aria-describedby={`${id}-help`} />
            <p id={`${id}-help`}>{help}</p>
        </div>
    );
}
export function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: T; onChange: (value: NoInfer<T>) => void }) {
    return (
        <fieldset className="cl-choice">
            <legend>{label}</legend>
            <div>
                {options.map((option) => (
                    <button type="button" key={option} aria-pressed={option === value} onClick={() => onChange(option)}>
                        {option}
                    </button>
                ))}
            </div>
        </fieldset>
    );
}
export type Card = { question: string; answer: string };
export function Flashcards({ cards }: { cards: Card[] }) {
    const [flipped, setFlipped] = useState<number[]>([]);
    return (
        <div className="cl-flashcards">
            <span className="cl-label">Keep these ideas · tap to reveal</span>
            <div>
                {cards.map((card, index) => (
                    <button
                        type="button"
                        key={card.question}
                        className="cl-flashcard"
                        aria-expanded={flipped.includes(index)}
                        onClick={() => setFlipped((current) => (current.includes(index) ? current.filter((n) => n !== index) : [...current, index]))}
                    >
                        <span className="cl-label">
                            {String(index + 1).padStart(2, '0')} · {flipped.includes(index) ? 'Answer' : 'Recall'}
                        </span>
                        <strong>{card.question}</strong>
                        {flipped.includes(index) ? <p>{card.answer}</p> : <span className="cl-flip-hint">Reveal answer ↗</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
