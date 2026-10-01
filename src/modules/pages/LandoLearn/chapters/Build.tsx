'use client';

import ChoreographyBuilder from '../demos/ChoreographyBuilder';
import Quiz from '../demos/Quiz';
import { C, Callout, Card, ChapterHead, Grid, KeyIdea, P, Section, Steps, Table, Where } from '../kit/ui';

export default function BuildChapter() {
    return (
        <article>
            <ChapterHead
                n="12"
                kicker="Build your own"
                title="From a screen recording to a page that moves like it."
                lead={
                    <>
                        You’ve seen every piece. This chapter puts them in order: the recipe the clone followed, a tool to plan your own choreography as numbers, a few briefs to practise on, and the
                        final quiz.
                    </>
                }
            />

            <Section id="recipe" n="12.1" title="The recipe">
                <Steps
                    items={[
                        <>
                            <strong>Record and measure.</strong> A fixed-size recording, frames exported, every moment timed (chapter 01). Write the storyboard as a table: time, event, trigger.
                        </>,
                        <>
                            <strong>Tokens first.</strong> Colours, type sizes, the lerp value and a handful of eases (chapter 01).
                        </>,
                        <>
                            <strong>The shell.</strong> Smooth scroll on the GSAP ticker, the transition orchestrator, the overlay — before any section (chapters 02, 10).
                        </>,
                        <>
                            <strong>The signature.</strong> Build the one reusable effect that appears everywhere — here the block reveal — and use it consistently (chapter 03).
                        </>,
                        <>
                            <strong>Scenes, one at a time.</strong> Each section: layout in HTML, then its trigger (pin, scrub or enter-once), then its timeline (chapters 05–07).
                        </>,
                        <>
                            <strong>WebGL last.</strong> Only for what CSS can’t do, as a paint layer over the finished HTML (chapters 08–09).
                        </>,
                        <>
                            <strong>Verify.</strong> Replay the same scroll path, compare side by side, check frame times, leaks and reduced motion (chapter 11).
                        </>,
                    ]}
                />
                <KeyIdea>Build the page as HTML that works without motion, then add motion scene by scene, then WebGL on top. Every layer is optional to the one below.</KeyIdea>
            </Section>

            <Section id="kit" n="12.2" title="Your starter kit">
                <P>These seven pieces carried the whole site. They live in one folder, don’t know anything about the page, and are ready to reuse.</P>
                <Table
                    head={['Piece', 'Does', 'Key numbers']}
                    rows={[
                        ['SmoothScroll', 'Lenis on gsap.ticker, ScrollTrigger updated from it', 'lerp 0.1'],
                        ['BlockReveal', 'line-by-line block wipe; scroll / mount / manual / perLine', '0.24 · 0.05 · 0.30, stagger 0.06'],
                        ['RollingText', 'per-character hover roll', 'stagger 0.018, 0.42 s power3.inOut'],
                        ['HorizontalScroll', 'pinned sideways track with depth parallax', 'pinDistance, moveStart, scrub'],
                        ['Marquee', 'seamless loop on the ticker', '40 px/s'],
                        ['PageTransition', 'exit → push → wait → refresh → enter', '2 frames after the pathname changes'],
                        ['WebGLCanvas', 'R3F on WebGPU/WebGL2, pixel camera', 'dpr ≤ 2, pause when hidden'],
                    ]}
                    mono={[2]}
                />
            </Section>

            <Section id="builder" n="12.3" title="Plan your choreography as numbers">
                <P>
                    Before code, write every element as a row: what moves, how, when it starts, how long, which ease, and whether several copies stagger. That table <em>is</em> the timeline — the
                    builder turns it into GSAP code. Start from the real menu and change it into your own.
                </P>
                <ChoreographyBuilder />
                <Callout tone="tip" title="Designer habit">
                    Hand developers this table instead of a video. “Starts at 0.38 s, 0.26 s, power3.out, stagger 0.075” is unambiguous; “the links come in a bit after the panel” is not.
                </Callout>
            </Section>

            <Section id="briefs" n="12.4" title="Practice briefs">
                <Grid cols={3}>
                    <Card kicker="Brief 1 · 30 min" title="A block-reveal title">
                        Rebuild the block reveal on a three-line headline for a light section. Match 0.24 / 0.05 / 0.30, then try a version that reveals right-to-left.
                    </Card>
                    <Card kicker="Brief 2 · 1 hour" title="A pinned product card">
                        Pin a full-screen product photo for 600 px and shrink it to a card with <C>clip-path</C> instead of width/height. Add one scrubbed caption and one played-once caption.
                    </Card>
                    <Card kicker="Brief 3 · half a day" title="Your own glyph transition">
                        Pick a letter or number from your brand. Make it an SVG mask, grow it from 1/1024 to cover with expo.in, and wire it between two routes with a proper wait.
                    </Card>
                </Grid>
            </Section>

            <Section id="quiz" n="12.5" title="Final quiz">
                <P>Ten random cards from every chapter. Say the answer before revealing it — that’s what makes it stick.</P>
                <Quiz />
            </Section>

            <Section id="reading" n="12.6" title="Further reading">
                <ul className="max-w-[72ch] space-y-2 text-[15px] leading-relaxed text-[#cfd3c4]">
                    {[
                        ['GSAP — timelines, position parameter, eases', 'https://gsap.com/docs/v3/GSAP/Timeline/'],
                        ['GSAP ScrollTrigger — pin, scrub, start/end', 'https://gsap.com/docs/v3/Plugins/ScrollTrigger/'],
                        ['GSAP SplitText — autoSplit, masks', 'https://gsap.com/docs/v3/Plugins/SplitText/'],
                        ['Lenis — smooth scroll', 'https://github.com/darkroomengineering/lenis'],
                        ['three.js — WebGPURenderer and TSL', 'https://threejs.org/docs/#api/en/renderers/webgpu/WebGPURenderer'],
                        ['The Book of Shaders — noise, smoothstep, mix', 'https://thebookofshaders.com/'],
                    ].map(([label, href]) => (
                        <li key={href}>
                            <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--ll-ink)] underline decoration-[var(--ll-line-2)] underline-offset-4 hover:decoration-[var(--ll-lime)]"
                            >
                                {label} ↗
                            </a>
                        </li>
                    ))}
                </ul>
                <Where
                    files={[
                        { path: 'src/components/motion-kit/', note: 'the reusable kit' },
                        { path: '.clone-analysis/', note: 'SPEC, DIFF_LOG, tools' },
                    ]}
                />
            </Section>
        </article>
    );
}
