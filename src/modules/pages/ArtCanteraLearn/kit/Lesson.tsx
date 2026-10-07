import type { ReactNode } from 'react';

import { chapterById, type ChapterId, CHAPTERS } from '../content/chapters';

import { Code, Lens, Remember, Section, Term } from './ui';

export default function Lesson({ id, children, creativeDemo }: { id: ChapterId; children: ReactNode; creativeDemo?: ReactNode }) {
    const chapter = chapterById(id),
        index = CHAPTERS.indexOf(chapter);
    return (
        <>
            <header className="cl-chapter-head">
                <span className="cl-label">
                    {String(index).padStart(2, '0')} / {chapter.label}
                </span>
                <h2>{chapter.title}</h2>
                <p>{chapter.lead}</p>
            </header>
            <Section id={`${id}-idea`} title="01 / Learn to see it">
                <p>{chapter.idea}</p>
                <p className="cl-vocabulary">
                    <Term word={chapter.term} meaning={chapter.definition} /> — {chapter.definition}
                </p>
                <Lens>{chapter.lens}</Lens>
                <Remember>{chapter.remember}</Remember>
            </Section>
            <Section id={`${id}-lab`} title="02 / Open the mechanism">
                {children}
                <Code
                    file={`ArtCantera/${chapter.source.slice(0, 2).join(' + ')} · ${id === 'map' ? 'pipeline outline' : id === 'build' ? 'new study using the source helper' : 'source excerpts'}`}
                    highlight={chapter.highlight}
                >
                    {chapter.code}
                </Code>
                <Remember>{chapter.labRemember}</Remember>
            </Section>
            <Section id={`${id}-creative`} title="03 / Push it into a new piece">
                <p>{chapter.creative}</p>
                {creativeDemo}
                <div className="cl-try">
                    <span className="cl-label">Break it on purpose</span>
                    <ul>
                        {chapter.try.map((prompt) => (
                            <li key={prompt}>{prompt}</li>
                        ))}
                    </ul>
                </div>
                <Remember>{chapter.creativeRemember}</Remember>
            </Section>
            <Section id={`${id}-source`} title="04 / Carry it into the source">
                <ol className="cl-steps">
                    {chapter.steps.map((step, index) => (
                        <li key={step}>
                            <span className="cl-label">{String(index + 1).padStart(2, '0')}</span>
                            {step}
                        </li>
                    ))}
                </ol>
                <div className="cl-source">
                    <span className="cl-label">In the source →</span>
                    {chapter.source.map((file) => (
                        <code key={file}>{file}</code>
                    ))}
                </div>
                <Remember>{chapter.sourceRemember}</Remember>
            </Section>
        </>
    );
}
