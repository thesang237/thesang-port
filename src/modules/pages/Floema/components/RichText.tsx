import { Fragment, type ReactNode } from 'react';

import type { RichParagraph } from '../data';

export function RichText({ paragraphs, reveal = true }: { paragraphs: RichParagraph[]; reveal?: boolean }) {
    return (
        <>
            {paragraphs.map((paragraph, index) => {
                let cursor = 0;
                const parts: ReactNode[] = [];
                for (const span of [...paragraph.spans].sort((a, b) => a.start - b.start)) {
                    if (span.type !== 'hyperlink' || !span.data?.url) continue;
                    parts.push(paragraph.text.slice(cursor, span.start));
                    parts.push(
                        <a key={span.start} href={span.data.url} target="_blank" rel="noopener noreferrer">
                            {paragraph.text.slice(span.start, span.end)}
                        </a>,
                    );
                    cursor = span.end;
                }
                parts.push(paragraph.text.slice(cursor));
                return (
                    <p data-about-reveal={reveal ? '' : undefined} key={index}>
                        {parts.map((part, index) => (
                            <Fragment key={index}>{part}</Fragment>
                        ))}
                    </p>
                );
            })}
        </>
    );
}
