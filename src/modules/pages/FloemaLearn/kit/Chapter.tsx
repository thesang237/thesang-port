import { type ReactNode, useRef } from 'react';

import { type ChapterId, CHAPTERS } from '../content/chapters';
import excerpts from '../content/excerpts.json';

import { gsap, useGSAP } from './motion';
import { Code, Remember, Section, Term } from './ui';

export default function Chapter({ id, children }: { id: ChapterId; children: ReactNode }) {
    const chapter = CHAPTERS.find((item) => item.id === id)!;
    const index = CHAPTERS.indexOf(chapter);
    const excerpt = excerpts[id];
    const root = useRef<HTMLElement>(null);
    useGSAP(
        () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const animation = gsap.fromTo('.fl-chapter-head', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
            return () => {
                animation.kill();
            };
        },
        { scope: root },
    );
    return (
        <article ref={root} className="fl-chapter" data-chapter={id}>
            <header className="fl-chapter-head">
                <span className="fl-label">
                    CHAPTER {String(index).padStart(2, '0')} / {chapter.label}
                </span>
                <h2>{chapter.title}</h2>
                <p className="fl-lead">{chapter.lead}</p>
                <div className="fl-vocabulary">
                    <span className="fl-label">TERMS TO KNOW</span>
                    {chapter.terms.map((term) => (
                        <Term key={term} name={term} />
                    ))}
                </div>
            </header>
            <Section id={`${id}-idea`} title="See it like a designer">
                <div className="fl-lens">
                    <span className="fl-label">DESIGNER LENS</span>
                    <p>{chapter.lens}</p>
                </div>
                <Remember>{chapter.remember}</Remember>
            </Section>
            <Section id={`${id}-demo`} title="Pull the effect apart">
                {children}
                <div className="fl-try">
                    <span className="fl-label">TRY THIS</span>
                    <ul>
                        {chapter.tryThis.map((prompt) => (
                            <li key={prompt}>{prompt}</li>
                        ))}
                    </ul>
                </div>
                <Remember>Change one dial at a time so you can tell what caused the difference.</Remember>
            </Section>
            <Section id={`${id}-logic`} title="The core logic">
                <ol className="fl-steps">
                    {chapter.logic.map((step, index) => (
                        <li key={step}>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <p>{step}</p>
                        </li>
                    ))}
                </ol>
                <Code {...excerpt} file={`Floema/${excerpt.file}`} highlighted={excerpt.highlight} />
                <aside className="fl-caution">
                    <span className="fl-label">WATCH FOR</span>
                    <p>{chapter.caution}</p>
                </aside>
                <Remember>{chapter.remember}</Remember>
            </Section>
            <Section id={`${id}-remix`} title="Take the idea somewhere else">
                <div className="fl-remix-grid">
                    {chapter.remixes.map((remix) => (
                        <div key={remix.title} className="fl-remix">
                            <h4>{remix.title}</h4>
                            <p>{remix.text}</p>
                        </div>
                    ))}
                </div>
                <Remember>Keep the rule; change the content, scale, and reason for the effect.</Remember>
            </Section>
            <div className="fl-source">
                <span className="fl-label">IN THE SOURCE →</span>
                <p>
                    Paths inside <code>src/modules/pages/Floema/</code>
                </p>
                <div>
                    {chapter.files.map((file) => (
                        <code key={file}>{file}</code>
                    ))}
                </div>
            </div>
        </article>
    );
}
