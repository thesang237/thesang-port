import type { ReactNode } from 'react';

import { type ChapterId, CHAPTERS } from '../content/chapters';
import { LESSONS } from '../content/lessons';

import { Flashcards } from './Flashcards';

export function Chapter({ id, children, extra }: { id: ChapterId; children: ReactNode; extra?: ReactNode }) {
    const number = CHAPTERS.findIndex((chapter) => chapter.id === id);
    const chapter = CHAPTERS[number];
    const lesson = LESSONS[id];
    const source = lesson.file.startsWith('..') ? 'src/modules/pages/ArtSagebrushLearn/demos/InkLab.tsx' : `src/modules/pages/ArtSagebrush/art/${lesson.file}`;
    return (
        <>
            <header className="sg-chapter-head">
                <span className="sg-label">
                    Chapter {String(number).padStart(2, '0')} / {chapter.label}
                </span>
                <h2>{chapter.title}</h2>
                <p>{chapter.blurb}</p>
            </header>
            <section id={`${id}-idea`} data-toc="The idea">
                <span className="sg-label">01 / The idea</span>
                <h3>Start with what you see.</h3>
                <p className="sg-prose">{lesson.idea}</p>
                <aside className="sg-lens">
                    <span className="sg-label">Designer lens</span>
                    <p>{lesson.lens}</p>
                </aside>
                <div className="sg-glossary">
                    {lesson.terms.map((term) => (
                        <details key={term.word}>
                            <summary>{term.word}</summary>
                            <p>{term.meaning}</p>
                        </details>
                    ))}
                </div>
                <p className="sg-remember">
                    <span>Remember</span>
                    {lesson.remember}
                </p>
            </section>
            <section id={`${id}-lab`} data-toc="The experiment">
                <span className="sg-label">02 / At the workbench</span>
                <h3>Change a rule. Read the result.</h3>
                {children}
                <div className="sg-code">
                    <div className="sg-label">{source} · excerpt / annotations</div>
                    <pre>
                        <code>
                            {lesson.code.split('\n').map((line, index) => (
                                <span className={line.includes('const ') || line.includes('this.penV') || line.includes('sort(') ? 'sg-code-key' : ''} key={`${index}-${line}`}>
                                    <i aria-hidden="true">{index + 1}</i>
                                    {line}
                                    {'\n'}
                                </span>
                            ))}
                        </code>
                    </pre>
                </div>
                <div className="sg-try">
                    <span className="sg-label">Try this / break it on purpose</span>
                    <ol>
                        {lesson.tries.map((prompt) => (
                            <li key={prompt}>{prompt}</li>
                        ))}
                    </ol>
                </div>
                <p className="sg-remember">
                    <span>Remember</span>Keep the seed fixed while comparing a parameter; otherwise you are comparing two different starting points.
                </p>
            </section>
            <section id={`${id}-studio`} data-toc="Studio notes">
                <span className="sg-label">03 / Beyond the demo</span>
                <h3>Know what you are borrowing.</h3>
                <div className="sg-notes">
                    <div>
                        <h4>In the actual artwork</h4>
                        <p>{lesson.note}</p>
                    </div>
                    <div>
                        <h4>A direction to explore</h4>
                        <p>{lesson.application}</p>
                    </div>
                </div>
                {extra}
                <p className="sg-remember">
                    <span>Remember</span>
                    {id === 'build' ? 'Record the code version as well as the seed pair.' : 'A teaching study isolates one rule; the finished artwork combines several.'}
                </p>
            </section>
            <section id={`${id}-recall`} data-toc="Recall & source">
                <span className="sg-label">04 / Keep the idea</span>
                <h3>Close the notes. Explain it back.</h3>
                <Flashcards cards={lesson.cards} />
                <p className="sg-remember">
                    <span>Remember</span>Being able to explain why a mark changes is more useful than memorizing a parameter.
                </p>
                <div className="sg-source">
                    <span className="sg-label">In the source →</span>
                    <code>{source}</code>
                    <code>src/modules/pages/ArtSagebrush/art/README.md</code>
                </div>
            </section>
        </>
    );
}
