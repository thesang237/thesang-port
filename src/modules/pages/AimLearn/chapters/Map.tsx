'use client';

import PipelineDiagram from '../demos/PipelineDiagram';
import ScrollMap from '../demos/ScrollMap';
import { C, Callout, ChapterHead, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function MapChapter() {
    return (
        <article>
            <ChapterHead
                n="00"
                kicker="The map"
                title="One scroll position runs seven scenes."
                lead={
                    <>
                        <C>/aim-obys</C> is a calm, black-and-paper editorial page that moves a lot: a logo that falls apart, text that rises out of nowhere, photos that climb a pinned stage. Behind
                        it all is one number, <Term k="progress">scroll progress</Term>, and a handful of repeating ideas. This chapter is the map; the next seven take each idea apart.
                    </>
                }
            />

            <Section id="seven" n="0.1" title="Seven things happen, on two kinds of clock">
                <P>
                    In order: the <strong>loader</strong>, the <strong>hero build</strong>, the <strong>logo falling apart</strong>, the <strong>about lines</strong>, the{' '}
                    <strong>photos rising</strong>, the <strong>photo deck</strong>, and the <strong>footer logo</strong>. The map below groups them into five lanes: the loader and hero build are one
                    timed sequence, and the rising photos and the deck are one pinned stage.
                </P>
                <P>
                    Two kinds of clock matter. <em>Scrubbed</em> scenes use the scroll position as their playhead: scroll down and they play, scroll up and they rewind. <em>Triggered</em> scenes are
                    only <em>started</em> by scroll, then play on their own time. Almost every decision on this page is “which of the two is this?”.
                </P>
                <ScrollMap />
                <TryThis
                    items={[
                        <>
                            Drag the playhead to about 3 300px: the logo has finished falling and zoomed to ×4, and the stage has not started. The page is “between scenes”, which is deliberate
                            breathing room.
                        </>,
                        <>
                            Look at the stage lane: it is by far the longest. Ten screens of scrolling for six photos. Long scenes need strong feedback (a counter, highlighted names) so people know
                            they are progressing.
                        </>,
                        <>Slide to the bottom: the footer logo is a triggered lane, so it plays on its own clock even if you stop scrolling.</>,
                    ]}
                />
                <Lens>
                    Think of the page as an After Effects project. The scrubbed lanes are comps whose playhead you drag with the scroll bar. The triggered lanes are comps that start playing when the
                    playhead crosses a marker.
                </Lens>
                <KeyIdea>Every scene is either scrubbed (scroll is the playhead) or triggered (scroll only presses play). Decide which before you animate anything.</KeyIdea>
            </Section>

            <Section id="flow" n="0.2" title="One number in, transforms out">
                <P>
                    The wheel goes through <Term k="lenis">Lenis</Term>, which turns steps into a glide. What comes out is a single number, <C>scrollY</C>. Scrubbed scenes convert it to a progress
                    percentage, <Term k="smoothing">smooth</Term> it, and read values from <Term k="track">tracks</Term>. Triggered scenes check thresholds and start timed GSAP animations. Both only
                    write <Term k="translate">transform</Term> and <C>opacity</C>.
                </P>
                <PipelineDiagram />
                <Callout tone="meta">
                    This guide runs on the same pipeline: the same Lenis-on-GSAP-ticker clock, the same mask-rise on its title, the same progress bar made of <C>scaleX</C> at the top of the screen.
                </Callout>
                <KeyIdea>One clock (GSAP’s ticker) drives smooth scroll, scroll triggers and every tween, so nothing lags a frame behind the scroll.</KeyIdea>
            </Section>

            <Section id="words" n="0.3" title="The vocabulary bridge">
                <P>The same idea has a design word and a code word. This guide uses both; this table is the translation.</P>
                <Table
                    head={['Design word', 'Code word', 'What it means here']}
                    rows={[
                        ['Playhead', 'scroll progress', 'How far down the scene you are, 0 to 100%'],
                        ['Keyframe', 'track key [at, value]', 'A value pinned to a scroll percentage'],
                        ['Layer property row', 'track', 'All keyframes of one property of one element'],
                        ['Clipping mask', 'overflow: hidden wrapper', 'The invisible window text rises out of'],
                        ['Fixed layer', 'position: sticky / pin', 'Holds the stage on screen while the page scrolls'],
                        ['Offset layers', 'stagger', 'Starting a group of motions a little apart'],
                        ['Placeholder', 'dominant-colour box', 'A flat colour shown until the photo fades in'],
                        ['Modal frame', 'overlay', 'The gallery and phone menu opening over the page'],
                    ]}
                    mono={[1]}
                />
                <Where
                    files={[
                        { path: 'AimObys/AimObysPage.tsx', note: 'the ticker loop: progress, smoothing, tracks' },
                        { path: 'AimObys/scenes.ts', note: 'all keyframes' },
                        { path: 'AimObys/lib/ix.ts', note: 'sample, smooth, elementProgress' },
                    ]}
                />
            </Section>
        </article>
    );
}
