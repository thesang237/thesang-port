'use client';
import type { ReactNode, SyntheticEvent } from 'react';
import { Fragment, useId } from 'react';

import { GLOSSARY } from '../content/glossary';
function Term({ word }: { word: string }) {
    const id = useId();
    const position = (event: SyntheticEvent<HTMLSpanElement>) => {
        const element = event.currentTarget;
        element.setAttribute('data-edge', element.getBoundingClientRect().left > window.innerWidth - 264 ? 'right' : 'left');
    };
    return (
        <span className="dl-term" role="term" tabIndex={0} aria-describedby={id} onFocus={position} onMouseEnter={position}>
            {word}
            <span id={id} role="tooltip" className="dl-definition">
                {GLOSSARY[word.toLowerCase()]}
            </span>
        </span>
    );
}
export function Prose({ text }: { text: string }) {
    const regex = /\b(render targets?|uniforms?|UV|DPR|luminance|threshold|seed|fragment shader)\b/gi;
    let cursor = 0;
    const seen = new Set<string>();
    const parts: ReactNode[] = [];
    for (const match of text.matchAll(regex)) {
        const start = match.index;
        const word = match[0];
        parts.push(<Fragment key={`${start}-before`}>{text.slice(cursor, start)}</Fragment>);
        parts.push(seen.has(word.toLowerCase()) ? <Fragment key={start}>{word}</Fragment> : <Term key={start} word={word} />);
        seen.add(word.toLowerCase());
        cursor = start + word.length;
    }
    parts.push(<Fragment key="rest">{text.slice(cursor)}</Fragment>);
    return <p>{parts}</p>;
}
