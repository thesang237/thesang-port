'use client';

import DescenderDemo from '../demos/DescenderDemo';
import LineRevealLab from '../demos/LineRevealLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function MasksChapter() {
    return (
        <article>
            <ChapterHead
                n="02"
                kicker="Mask reveals"
                title="Lines rise out of invisible windows."
                lead={
                    <>
                        Almost all the text on the page arrives the same way: each line slides up from just below an invisible edge. It is the single most reused effect on the page, and it is only two
                        boxes and a <Term k="translate">translate</Term>.
                    </>
                }
            />

            <Section id="two-boxes" n="2.1" title="Two boxes and a number">
                <P>
                    A <Term k="mask">mask</Term> is a wrapper with <C>overflow: hidden</C> and the height of one line. Inside it, the text starts pushed one line down (<C>yPercent: 100</C>), so it is
                    clipped away, and then rises to 0. There is nothing to “draw”: the text was always there, just hidden below the edge.
                </P>
                <LineRevealLab />
                <TryThis
                    items={[
                        <>
                            Scroll the window slowly in “trigger” mode: each line plays once when it crosses the trigger line. Scroll back up: they stay (the page’s default). Turn on “replay” to
                            rewind them.
                        </>,
                        <>Switch to “scrub”: now the lines are tied to scroll position and the duration and ease dials stop mattering. Scroll back and forth to feel it.</>,
                        <>Set rise to 160 and duration to 2: it becomes slow and theatrical. The page’s 100% / 0.9s is quick enough to read while it happens.</>,
                        <>Turn on x-ray to see the windows. Notice they stack with no gaps: the rise distance of exactly one line is what keeps the neighbouring lines from showing.</>,
                    ]}
                />
                <Code
                    file="src/modules/pages/AimObys/AimObysPage.tsx"
                    lang="ts"
                    highlight={['rootMargin', 'yPercent: 100', 'duration: 0.9']}
                >{`// about lines: each line has its own trigger and plays once
const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
        if (!e.isIntersecting) continue
        io.unobserve(e.target)                       // once
        gsap.fromTo(e.target.firstElementChild,      // the inner line
            { yPercent: 100, y: 0 },
            { yPercent: 0, duration: 0.9, ease: 'aimInOutCubic' })
    }
}, { rootMargin: '-15% 0px -15% 0px' })              // “crossed the 15% line”`}</Code>
                <Lens>It is a clipping mask in Figma with the text layer inside it, animated from “below the mask” to “in the mask”. Same in After Effects: a layer with a track matte.</Lens>
                <KeyIdea>Mask reveal = a window with overflow hidden + the text moving from 100% down to 0. The window height equals one line, so only the moving text is ever visible.</KeyIdea>
            </Section>

            <Section id="three-uses" n="2.2" title="One mask, four drivers">
                <P>
                    The page reuses the same two boxes in four places and changes only <em>what drives the number</em>.
                </P>
                <Table
                    head={['Where', 'Driver', 'Numbers']}
                    rows={[
                        ['Hero lines (“AIM— / AI Modernism / Of Kharkiv”)', 'Timed, once at the end of the loader', 'from 110%, 1.0s, out-cubic, each line 0.1s later'],
                        ['About lines', 'Trigger at the 15% line, once per line', 'from 100%, 0.9s, in-out-cubic'],
                        ['“Explore / Experiment” on the stage', 'Scrubbed by scroll', 'from 120%, between 23% and 30% of the stage, linear'],
                        ['Phone menu words', 'A click, in order', 'from 120%, 1.0s, 0.1s apart'],
                    ]}
                />
                <P>
                    That is a useful habit: build <em>one</em> reveal and give it a driver per context, instead of designing four different text effects. The page feels consistent because it literally
                    is one effect.
                </P>
                <Callout tone="tip" title="Pick the ease by the driver">
                    Timed reveals use curves (out-cubic is quick at the start, calm at the end). Scrubbed reveals use <strong>no</strong> curve: the scroll position already shapes the motion, and an
                    extra ease finishes the move early and then leaves dead scroll.
                </Callout>
            </Section>

            <Section id="descenders" n="2.3" title="The descender trap">
                <P>
                    Display text uses a line-height below 1 (0.915 for the hero, 0.85 for the big headings). A mask that is exactly one line tall then cuts off the tails of g, p and y. The fix has two
                    halves: give the mask extra room with <C>padding-bottom</C>, and take it back with the same negative <C>margin-bottom</C>, so the layout does not change.
                </P>
                <DescenderDemo />
                <Callout tone="warn" title="The same trap, in the page">
                    The stage headings use a mask 9.2em tall (for 9.5em text at line-height 0.85) with <C>margin-bottom: −0.8em</C> and <C>padding-right: 0.5em</C>, so the right edge of a wide letter
                    isn’t clipped either.
                </Callout>
                <Where
                    files={[
                        { path: 'AimObys/aim.scss', note: '.aim-about__line, .aim-exp__hmask' },
                        { path: 'AimObys/AimObysPage.tsx', note: 'hero timeline + about observer' },
                    ]}
                />
            </Section>
        </article>
    );
}
