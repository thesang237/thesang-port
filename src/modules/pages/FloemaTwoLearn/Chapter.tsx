'use client';
import type { ReactNode } from 'react';

import { Code, Flashcards, Lens, Section, Term } from './kit/ui';
import { cards, type ChapterId, chapters } from './catalog';
export type Lesson = {
    idea: string;
    lens: string;
    term: string;
    steps: string[];
    fragile: string;
    ship: string;
    remember: [string, string, string, string];
    code: string;
    file: string;
    lines: number[];
    sources: string[];
    docs?: { label: string; href: string }[];
};
export default function Chapter({ id, lesson, children }: { id: ChapterId; lesson: Lesson; children: ReactNode }) {
    const index = chapters.findIndex((c) => c.id === id);
    const meta = chapters[index];
    return (
        <article className="f2l-chapter">
            <header className="f2l-chapter-head">
                <span className="f2l-eyebrow">
                    CHAPTER {String(index).padStart(2, '0')} / {meta.minutes} MIN + EXPERIMENTS
                </span>
                <h2 tabIndex={-1}>{meta.title}</h2>
                <p>{meta.blurb}</p>
            </header>
            <Section id={`${id}-idea`} n="01 / SEE" title="What you’re seeing" remember={lesson.remember[0]}>
                <p>{lesson.idea}</p>
                <p className="f2l-vocabulary">
                    Vocabulary bridge: <Term name={lesson.term} /> <small>Hover or focus the term for a plain-language definition.</small>
                </p>
                <Lens>{lesson.lens}</Lens>
            </Section>
            <Section id={`${id}-lab`} n="02 / EXPERIMENT" title="Turn the dials" remember={lesson.remember[1]}>
                {children}
                <Code code={lesson.code} file={`src/modules/pages/FloemaTwo/${lesson.file}`} lines={lesson.lines} />
            </Section>
            <Section id={`${id}-recipe`} n="03 / REBUILD" title="Build it in order" remember={lesson.remember[2]}>
                <ol className="f2l-steps">
                    {lesson.steps.map((step, i) => (
                        <li key={step}>
                            <span>{String(i + 1).padStart(2, '0')}</span>
                            <p>{step}</p>
                        </li>
                    ))}
                </ol>
                <aside className="f2l-callout">
                    <span className="f2l-eyebrow">THE FRAGILE PART</span>
                    <p>{lesson.fragile}</p>
                </aside>
            </Section>
            <Section id={`${id}-source`} n="04 / APPLY" title="Take it to production" remember={lesson.remember[3]}>
                <p>{lesson.ship}</p>
                <div className="f2l-sources">
                    <span className="f2l-eyebrow">IN THE SOURCE →</span>
                    {lesson.sources.map((file) => (
                        <code key={file}>src/modules/pages/FloemaTwo/{file}</code>
                    ))}
                </div>
                {lesson.docs && (
                    <div className="f2l-docs">
                        {lesson.docs.map((doc) => (
                            <a key={doc.href} href={doc.href} target="_blank" rel="noreferrer">
                                {doc.label} ↗
                            </a>
                        ))}
                    </div>
                )}
            </Section>
            <Flashcards cards={cards[id]} />
        </article>
    );
}
