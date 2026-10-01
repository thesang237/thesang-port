'use client';

import Quiz from '../demos/Quiz';
import SceneGenerator from '../demos/SceneGenerator';
import { C, Callout, Card, ChapterHead, Grid, KeyIdea, P, Section, Steps, Table } from '../kit/ui';

export default function BuildChapter() {
    return (
        <article>
            <ChapterHead
                n="07"
                kicker="Build your own"
                title="A scroll page, in the order that works."
                lead={
                    <>
                        You have seen every piece. This chapter puts them in order: the recipe, a small generator to plan a scene as numbers, three briefs to practise on, a final checklist, and the
                        quiz.
                    </>
                }
            />

            <Section id="recipe" n="7.1" title="The recipe">
                <Steps
                    items={[
                        <>
                            <strong>Make it work still.</strong> Build the whole page as plain HTML and CSS that reads well with no motion (chapter 01). If motion fails or is reduced, this is what
                            people get.
                        </>,
                        <>
                            <strong>Pick the unit and the gutter.</strong> One root size (1em = 1vw for a poster-like page), one gutter, one thick element, a few hairlines.
                        </>,
                        <>
                            <strong>Name the clocks.</strong> For every scene decide: scrubbed by scroll, or triggered and then timed? (chapter 00).
                        </>,
                        <>
                            <strong>Build the reveal once.</strong> A mask reveal with two drivers (a trigger and a scrub) covers most of the text on the page (chapter 02).
                        </>,
                        <>
                            <strong>One scene at a time.</strong> A tall track and a sticky stage, then tracks per layer, then smoothing (chapters 03 and 04).
                        </>,
                        <>
                            <strong>Images last.</strong> Colour placeholders first, then the entrance, then the stage’s cover-and-zoom (chapter 05).
                        </>,
                        <>
                            <strong>Hovers and overlays.</strong> Written as lists of tweens, GSAP owning both ends (chapter 06).
                        </>,
                        <>
                            <strong>Then the phone.</strong> Same content, a layout that suits a thumb, usually without pinning (chapter 01.4).
                        </>,
                    ]}
                />
                <KeyIdea>Build the page so it works without motion, then add motion one scene at a time. Each layer is optional to the one below.</KeyIdea>
            </Section>

            <Section id="generator" n="7.2" title="Plan a scene as numbers">
                <P>
                    Before opening an editor, sketch the scene as a table: layer, property, start %, end %. That table <em>is</em> the animation. The generator below turns it into the CSS for the
                    pinned stage, the page-style keyframe tracks, and the equivalent GSAP <C>ScrollTrigger</C> timeline.
                </P>
                <SceneGenerator />
                <Callout tone="tip" title="Timeline units = percent of the scroll">
                    In the GSAP version, a timeline whose total duration is 100 maps one unit to one percent of the scroll. “At 20, for 20” means “from 20% to 40% of the track”. It is the same table
                    as the page’s tracks, in a different notation.
                </Callout>
            </Section>

            <Section id="briefs" n="7.3" title="Three briefs to practise on">
                <Grid cols={3}>
                    <Card kicker="Brief 1 · easiest" title="Collapse on scroll">
                        A logo made of 5 blocks. As you scroll the first 30% of the page the blocks fall apart; by 40% they are gone. One track set, linear, smoothing 70. Done when it scrubs forwards
                        and backwards cleanly.
                    </Card>
                    <Card kicker="Brief 2 · medium" title="Case-study stage">
                        A sticky stage, 6 screens tall, with four project slides: each covers the last, with a counter 1—4. Done when the counter changes as the new slide settles, and a phone gets a
                        plain list.
                    </Card>
                    <Card kicker="Brief 3 · harder" title="Gallery with overlay">
                        A 12-image grid that enters with a capped stagger and colour placeholders, plus a gallery overlay that opens with a blurred backdrop and closes with Escape. Done when focus
                        returns to the opener.
                    </Card>
                </Grid>
            </Section>

            <Section id="check" n="7.4" title="Before you call it done">
                <Table
                    head={['Check', 'How']}
                    rows={[
                        ['Reload halfway down', 'Everything above and in view must be in its right state, not hidden or half-built'],
                        ['Scroll fast and slow, up and down', 'No jumps, no layers left behind, no dead stretches of scroll'],
                        ['Reduced motion on', 'No travel, zoom or scrubbing; short fades remain; smooth scroll off'],
                        ['Phone width (375px)', 'No sideways scroll; the pinned stage replaced by a simple layout'],
                        ['Resize the window mid-scroll', 'Triggers re-measure; nothing stays at its old size'],
                        ['Only transform and opacity move', 'Performance panel: no layout work while animating'],
                    ]}
                />
            </Section>

            <Section id="quiz" n="7.5" title="Final quiz">
                <P>Ten random cards from every chapter. Answer first, then reveal.</P>
                <Quiz />
            </Section>
        </article>
    );
}
