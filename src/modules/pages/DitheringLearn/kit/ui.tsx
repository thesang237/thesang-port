'use client';
import { CodeBlock } from '@/components/code-block';

import { CHAPTERS } from '../content/chapters';
import type { Lesson } from '../content/types';
import { MatrixLab, PipelineMap, ToneComparison } from '../demos/Diagrams';
import PrintLab from '../demos/PrintLab';
import { Quiz } from '../demos/Quiz';

import { Prose } from './Prose';

function Remember({ text }: { text: string }) {
    return (
        <p className="dl-remember">
            <span>Remember</span>
            {text}
        </p>
    );
}
export function LessonView({ lesson }: { lesson: Lesson }) {
    const index = CHAPTERS.findIndex((c) => c.id === lesson.id);
    const item = CHAPTERS[index];
    return (
        <article className="dl-lesson">
            <header className="dl-chapter-head">
                <span className="dl-kicker">
                    Chapter {String(index).padStart(2, '0')} / {item.label}
                </span>
                <h2>{item.promise}</h2>
                <p>{lesson.lead}</p>
            </header>
            <section aria-labelledby={`${lesson.id}-see`}>
                <h3 id={`${lesson.id}-see`} data-toc="What you see">
                    <span>01</span> What you see
                </h3>
                <Prose text={lesson.idea} />
                <aside className="dl-lens">
                    <span className="dl-kicker">Designer lens</span>
                    <p>{lesson.lens}</p>
                </aside>
                {lesson.id === 'map' && <PipelineMap />}
                {lesson.id === 'tone' && <ToneComparison />}
                <Remember text={lesson.remembers[0]} />
            </section>
            <section aria-labelledby={`${lesson.id}-work`}>
                <h3 id={`${lesson.id}-work`} data-toc="How it works">
                    <span>02</span> How it works
                </h3>
                <Prose text={lesson.mechanism} />
                {lesson.id === 'ordered' && <MatrixLab />}
                <figure className="dl-code">
                    <figcaption>{lesson.file} · excerpt</figcaption>
                    <CodeBlock lang={lesson.file.endsWith('.tsx') ? 'tsx' : lesson.file.includes('Shader') || lesson.file.includes('glsl') ? 'glsl' : 'typescript'} highlight={lesson.highlight}>
                        {lesson.code}
                    </CodeBlock>
                </figure>
                <Remember text={lesson.remembers[1]} />
            </section>
            <section aria-labelledby={`${lesson.id}-lab`}>
                <h3 id={`${lesson.id}-lab`} data-toc="Break it on purpose">
                    <span>03</span> Break it on purpose
                </h3>
                <PrintLab config={lesson.lab} />
                <div className="dl-try">
                    <span className="dl-kicker">Try this</span>
                    <ol>
                        {lesson.tries.map((text) => (
                            <li key={text}>{text}</li>
                        ))}
                    </ol>
                </div>
                <Remember text={lesson.remembers[2]} />
            </section>
            <section aria-labelledby={`${lesson.id}-make`}>
                <h3 id={`${lesson.id}-make`} data-toc="An artistic direction">
                    <span>04</span> An artistic direction
                </h3>
                <p>{lesson.application}</p>
                {lesson.id === 'map' && <Vocabulary />}
                {lesson.id === 'build' && <Quiz />}
                <Remember text={lesson.remembers[3]} />
                <div className="dl-sources">
                    <span className="dl-kicker">In the source →</span>
                    {lesson.sources.map((file) => (
                        <code key={file}>src/modules/pages/Dithering/{file}</code>
                    ))}
                </div>
            </section>
        </article>
    );
}
function Vocabulary() {
    return (
        <div className="dl-vocabulary">
            {[
                ['UV', 'A position on the image, from 0 to 1. Think of a normalized artboard coordinate.'],
                ['Uniform', 'A shared shader setting. Your slider writes it once; every pixel reads the same value.'],
                ['Render target', 'An offscreen image the GPU can read in the next pass. Like an After Effects precomp.'],
                ['Fragment shader', 'A tiny program deciding the colour of each output pixel.'],
                ['DPR', 'Device pixel ratio: physical pixels per CSS pixel. Doubling it quadruples pixel work.'],
            ].map(([term, definition]) => (
                <details key={term}>
                    <summary>{term}</summary>
                    <p>{definition}</p>
                </details>
            ))}
        </div>
    );
}
