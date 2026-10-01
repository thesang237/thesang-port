'use client';

import DeckLab from '../demos/DeckLab';
import OdometerLab from '../demos/OdometerLab';
import PinCompare from '../demos/PinCompare';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function PinnedChapter() {
    return (
        <article>
            <ChapterHead
                n="04"
                kicker="Pinned stage"
                title="A tall track, a sticky stage, and layers on one progress."
                lead={
                    <>
                        The centre of the page: you scroll for about ten screens, but the picture barely moves. Three photos climb into place, a heading rises, six featured works take turns on the
                        right, and a little counter ticks. It is one <Term k="pin">pinned</Term> stage with every layer reading the same number.
                    </>
                }
            />

            <Section id="pin" n="4.1" title="Pin = a tall track and a stage that stays">
                <P>
                    To keep something on screen while the page scrolls you need <em>scroll distance</em> to spend. So a pinned scene is always two things: a tall <strong>track</strong> (here{' '}
                    <strong>1000vh</strong>, ten screens) that creates the distance, and a <strong>stage</strong> (100vh) that stays put inside it. There are two ways to build it, and the page uses
                    the simpler one.
                </P>
                <PinCompare />
                <Table
                    head={['', 'CSS position: sticky', 'GSAP ScrollTrigger pin']}
                    rows={[
                        ['How', 'a track + a sticky stage', 'pin: true on the stage; GSAP wraps it'],
                        ['Extra DOM', 'none', 'a pin-spacer element'],
                        ['JavaScript', 'none for the pin itself', 'ScrollTrigger'],
                        ['Breaks when', 'an ancestor has overflow: hidden / auto', 'transformed ancestors; layout changes after setup'],
                        ['Choose it for', 'a plain stage in the normal page (this page)', 'pinning inside a nested scroller, pin spacing control, or pinning things sticky cannot'],
                    ]}
                />
                <TryThis
                    items={[
                        <>Scroll both boxes: they look identical. Turn on the x-ray to see how: GSAP adds a spacer, sticky just needs a tall parent.</>,
                        <>
                            Turn GSAP’s pinSpacing off: the next section slides <em>over</em> the stage instead of waiting for it. Useful for “cards stacking” effects, wrong for this page.
                        </>,
                        <>
                            Set pin length to 6: long pins feel like being stuck. The page spends ten screens on <em>six</em> photos but fills them with change (counter, names, text) to justify it.
                        </>,
                    ]}
                />
                <Callout tone="warn" title="Sticky fails silently">
                    If any ancestor has <C>overflow: hidden</C> or <C>auto</C>, sticky quietly stops sticking. The page wraps everything in <C>overflow: clip</C> (hides overflow without making a
                    scroll container) for exactly this reason.
                </Callout>
                <KeyIdea>A pinned scene is a tall track (the scroll you spend) plus a stage that stays on screen. Prefer position: sticky; reach for GSAP pin when sticky can’t do it.</KeyIdea>
            </Section>

            <Section id="layers" n="4.2" title="Seven layers, one number">
                <P>
                    Here is the real stage in miniature, running the page’s own keyframes. Nothing on it is a separate animation: the three columns, the slider, the two headings, the buttons, the
                    slides, the counter and the name list each read their own track from <em>one</em> progress value.
                </P>
                <DeckLab />
                <Table
                    head={['Progress', 'What happens', 'Tracks']}
                    rows={[
                        ['0 → 12%', 'The two photo columns rise from below the screen', 'col 2 starts at 3%, col 3 at 6%: a stagger measured in scroll'],
                        ['12 → 13%', 'A short hold: all three photos stand still', 'keys at 12 and 13 have equal values'],
                        ['13 → 30%', 'The photos slide right and the third (slider) slides in from the left', 'slider x −203% → 0; col 2 → +110%; col 3 → +40%'],
                        ['23 → 31%', 'Headings rise from masks, the button and labels fade in', 'heading 1 at 23→30, heading 2 at 25→30; UI opacity 28→30/31'],
                        ['35 → 85%', 'Six slides take turns, each over a 10% range', 'slide n moves up 100vh while the counter and names change'],
                        ['90%', 'The track ends, so the sticky stage releases', 'not a keyframe: it is how tall the track is'],
                    ]}
                    mono={[0]}
                />
                <TryThis
                    items={[
                        <>Press 12%, then 30%: the photos are in place, then the whole composition has re-arranged itself without anything “jumping”. Every layer has its own start and end.</>,
                        <>Set smoothing to 0 and scroll fast with the wheel: the layers snap to the scroll position, and it feels brittle. At 70 the whole stage glides.</>,
                        <>Turn on the x-ray: it is only three real layers (photos, text, slider). The magic is in the keyframes, not in complex markup.</>,
                    ]}
                />
                <Lens>
                    A pre-comp ten screens long. Each layer has its own start and end inside it; the scroll bar is the playhead. If you can lay out a motion timeline with staggered layer offsets, you
                    can read this stage.
                </Lens>
                <KeyIdea>Stagger in a scrub is not a delay: it is a different start position on the track. Column 2 starts at 3%, column 3 at 6%, and that’s the whole effect.</KeyIdea>
            </Section>

            <Section id="counter" n="4.3" title="Small things that keep pace">
                <P>
                    A ten-screen scene needs signposts. Two small elements do it: a counter (<Term k="odometer">odometer</Term> style: a strip of digits moving behind a one-digit window) and a name
                    list where the current name is full strength and the others sit at 40%. They are driven by the same progress, just with their own keyframes.
                </P>
                <OdometerLab />
                <Callout tone="tip" title="Notice the offsets">
                    The counter moves at 40→45, while the slide moves at 35→45. The signposts change in the <em>second half</em> of each slide’s travel, so the number updates just as the new photo
                    settles. Tuning these offsets by eye is what makes a scene feel “locked”.
                </Callout>
                <Code file="src/modules/pages/AimObys/scenes.ts" lang="ts" highlight={['yUnit', '[45, -1.6]']}>{`export const COUNTER: ElementTracks = {
    yUnit: 'em',                                   // the strip moves in em, so it scales with the layout
    y: [[40, 0], [45, -1.6], [50, -1.6], [55, -3.15], [60, -3.15], [65, -4.74], [73, -4.74], [75, -6.28], [80, -6.28], [85, -7.86]],
}
export const NAMES = [   // the first name fades to 40% while the second rises to 100%
    { opacity: [[41, 1], [43, 0.4]] },
    { opacity: [[43, 0.4], [45, 1], [51, 0.4]] },
    // …
]`}</Code>
            </Section>

            <Section id="structure" n="4.4" title="How it is built, and what phones do">
                <Code
                    file="src/modules/pages/AimObys/aim.scss"
                    lang="scss"
                    highlight={['height: 1000vh', 'position: sticky']}
                >{`.aim-exp__track  { position: relative; height: 1000vh; overflow: clip; }   /* the tall track */
.aim-exp__sticky { position: sticky; top: 0; display: flex; height: 100vh; }   /* the stage */
.aim-exp__slider { position: absolute; right: 0; width: 33%; height: 100vh;
                   transform: translate3d(-203%, 100vh, 0); }                    /* start state */`}</Code>
                <P>
                    One <C>requestAnimationFrame</C>-style ticker (GSAP’s) measures how far the track has scrolled, smooths it, and writes each layer’s <C>transform</C> or <C>opacity</C> from its
                    track. Only those two properties change, so it stays at 60fps even with six full-bleed photos.
                </P>
                <P>
                    On a phone there is no stage: the tracks are simply not applied, and the six photos become a plain list of cards (chapter 01). Same content, a layout that suits a thumb: always
                    have the non-pinned version in mind first.
                </P>
                <Where
                    files={[
                        { path: 'AimObys/sections/Experiment.tsx', note: 'stage markup' },
                        { path: 'AimObys/scenes.ts', note: 'SLIDER, COL_2/3, HEADING_*, SLIDES, COUNTER, NAMES' },
                        { path: 'AimObys/AimObysPage.tsx', note: 'the ticker that applies the tracks' },
                    ]}
                />
            </Section>
        </article>
    );
}
