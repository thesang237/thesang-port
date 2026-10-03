'use client';

import Quiz from '../demos/Quiz';
import StoryboardGen from '../demos/StoryboardGen';
import { Callout, Card, ChapterHead, Grid, KeyIdea, P, Section, Steps, Table, Where } from '../kit/ui';

export default function Build() {
    return (
        <>
            <ChapterHead
                n="12"
                kicker="Build your own"
                title="From storyboard to a film you scroll."
                lead={
                    <>
                        You have seen every piece. This chapter puts them in the order you would build them, gives you a generator for the first file you need, three practice briefs, and a final quiz
                        drawn from every chapter.
                    </>
                }
            />

            <Section id="recipe" n="12.1" title="The recipe, in build order">
                <Steps
                    items={[
                        <>
                            <strong>Storyboard in screens.</strong> Time a reference (or your animatic) and write each act and each movement as a window. Decide which beats should play faster per
                            scroll (the warp).
                        </>,
                        <>
                            <strong>One clock.</strong> Smooth scroll → film time → a plain object every part reads. One ticker for scroll, DOM and WebGL.
                        </>,
                        <>
                            <strong>Boxes first.</strong> Lay out empty HTML anchors with CSS and make each card a pure function of time: position, size, opacity. Scrub back and forth until the
                            blocking feels right, with flat colours.
                        </>,
                        <>
                            <strong>Shape.</strong> Add the outline (radius, notch, cut) as live numbers and animate them with the move.
                        </>,
                        <>
                            <strong>Faces and turns.</strong> Decide what each card shows and when it turns; swap hidden faces.
                        </>,
                        <>
                            <strong>Pictures.</strong> Flat images or painted 3D scenes; pin them to the screen; give them a fixed frame where the shot must not move.
                        </>,
                        <>
                            <strong>Pointer layers.</strong> Frame lean slow, picture fast; settle big cards.
                        </>,
                        <>
                            <strong>Words and beats.</strong> Reveals as attributes on enter/leave; short timed beats (logo wipe, opening) on their own clock.
                        </>,
                        <>
                            <strong>Finish and protect.</strong> Wash, grain, speed effects; render only what’s visible; warm up behind the loader; reduced-motion stills.
                        </>,
                    ]}
                />
                <KeyIdea>Block the film with boxes first; shape, pictures and effects are layers on a timing that already works.</KeyIdea>
            </Section>

            <Section id="generator" n="12.2" title="Your first file: the film clock">
                <P>
                    Every /kpr-style page starts with the same file: the windows, the length, the rests and the scroll warp. Fill in your acts below and copy the code. The choreography skeleton gives
                    each act a card that rises in and leaves upward; replace the targets with your own.
                </P>
                <StoryboardGen />
                <Callout tone="tip">
                    Keep the first pass ugly on purpose: flat-coloured rectangles, no shaders. If the timing works as boxes, it will work as paintings. If it doesn’t, no shader will save it.
                </Callout>
            </Section>

            <Section id="briefs" n="12.3" title="Three practice briefs">
                <Grid cols={3}>
                    <Card kicker="Brief 1 · 1 day" title="Product reveal in 4 screens">
                        One card: full-screen photo → notched card → turns to show the spec sheet → shrinks into a row of three. Use windows, mixRect chains and two faces.
                    </Card>
                    <Card kicker="Brief 2 · 2 days" title="Portfolio ring" tint>
                        Twelve project cards on a convex ring that opens from a stack, drags with momentum, and closes into a box before a contact section. Add the logo-style beat at the end.
                    </Card>
                    <Card kicker="Brief 3 · 1 week" title="A painted scene">
                        Split an illustration into 4–6 layers, place them at depths in a GLB, and show it in a card with pointer orbit, a view-offset zoom and a scroll-scrubbed camera move.
                    </Card>
                </Grid>
                <Table
                    mono={[1]}
                    head={['Tool', 'Use it for']}
                    rows={[
                        ['Lenis', 'smooth scroll; read lenis.scroll each tick'],
                        ['GSAP', 'the ticker, timed reveals, CustomEase'],
                        ['three.js / R3F', 'the pixel stage, ShaderMaterial, render targets, GLTFLoader + KTX2Loader'],
                        ['TexturePacker', 'sprite sheets and their atlas JSON'],
                        ['Blender / KeenTools FaceBuilder', 'painted planes and head meshes for parallax scenes'],
                    ]}
                />
            </Section>

            <Section id="quiz" n="12.4" title="Final quiz">
                <P>Ten cards drawn at random from every chapter. Answer in your head before you reveal, and be honest with the grade.</P>
                <Quiz />
                <Where files={[{ path: 'Kpr/NOTES.md', note: 'the study log' }, { path: 'Kpr/scroll/timeline.ts' }, { path: 'Kpr/gl/choreo.ts' }, { path: 'KprLearn/', note: 'this guide' }]} />
            </Section>
        </>
    );
}
