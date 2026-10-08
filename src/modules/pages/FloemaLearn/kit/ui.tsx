import { type ReactNode, useId, useState } from 'react';

import { GLOSSARY } from '../content/glossary';

export function Term({ name }: { name: string }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const definition = GLOSSARY[name];
    return (
        <span className={`fl-term ${open ? 'is-open' : ''}`}>
            <button
                className="fl-term-button"
                aria-describedby={id}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                onFocus={(event) => {
                    if (event.currentTarget.matches(':focus-visible')) setOpen(true);
                }}
                onBlur={() => setOpen(false)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setOpen(false);
                    }
                }}
            >
                {name}
            </button>
            <span className="fl-term-tip" id={id}>
                <strong>{definition.plain}</strong>
                <span>{definition.lens}</span>
            </span>
        </span>
    );
}
export function Remember({ children }: { children: ReactNode }) {
    return (
        <p className="fl-remember">
            <span className="fl-label">REMEMBER</span>
            {children}
        </p>
    );
}
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section className="fl-section" aria-labelledby={id}>
            <h3 id={id} data-toc>
                {title}
            </h3>
            {children}
        </section>
    );
}
function highlight(line: string) {
    return line.split(/(\/\/.*$|'[^']*'|"[^"]*"|\b(?:const|let|return|if|else|export|function|new|true|false)\b|\b\d+(?:\.\d+)?\b)/g).map((part, i) => (
        <span
            key={i}
            className={
                part.startsWith('//')
                    ? 'fl-code-comment'
                    : /^(const|let|return|if|else|export|function|new|true|false)$/.test(part)
                      ? 'fl-code-keyword'
                      : /^["']|^\d/.test(part)
                        ? 'fl-code-value'
                        : undefined
            }
        >
            {part}
        </span>
    ));
}
export function Code({ code, file, line, highlighted = [] }: { code: string; file: string; line?: number; highlighted?: number[] }) {
    return (
        <figure className="fl-code">
            <figcaption>
                <span>
                    {file}
                    {line ? `:${line}` : ''}
                </span>
                <span>KEY LINES</span>
            </figcaption>
            <pre>
                <code>
                    {code.split('\n').map((text, index) => (
                        <span key={index} className={`fl-code-line ${highlighted.includes(index + 1) ? 'is-key' : ''}`}>
                            <span className="fl-line-number">{(line ?? 1) + index}</span>
                            <span>{highlight(text)}</span>
                        </span>
                    ))}
                </code>
            </pre>
        </figure>
    );
}
export function Artwork({ index = 0, className = '' }: { index?: number; className?: string }) {
    const id = useId().replace(/:/g, '');
    return (
        <svg className={`fl-artwork ${className}`} viewBox="0 0 180 240" aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor={['#a1bcc5', '#c5ae93', '#91a997', '#b1a2b9'][index % 4]} />
                    <stop offset="1" stopColor="#394854" />
                </linearGradient>
            </defs>
            <path fill={`url(#${id})`} d="M0 0h180v240H0z" />
            <circle cx="90" cy="105" r={35 + (index % 3) * 8} fill="none" stroke="#f3f0e9" strokeWidth="14" />
            <path d="M-10 180 190 80M-10 196 190 96" stroke="#f3f0e9" strokeWidth="2" opacity=".65" />
            <text x="16" y="224" fill="#f3f0e9" fontSize="10" fontFamily="monospace">
                FORM / {String(index + 1).padStart(2, '0')}
            </text>
        </svg>
    );
}
