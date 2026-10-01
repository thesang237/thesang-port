'use client';

import EmGridLab from '../demos/EmGridLab';
import HairlineAnatomy from '../demos/HairlineAnatomy';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function LayoutChapter() {
    return (
        <article>
            <ChapterHead
                n="01"
                kicker="Layout"
                title="The whole page is fractions of the window width."
                lead={
                    <>
                        Before anything moves, the page has to hold still beautifully. <C>/aim-obys</C> does it with almost nothing: one thick bar, a few <Term k="hairline">hairlines</Term>, and a lot
                        of empty paper. Every size is written in <Term k="em">em</Term>, and the page sets 1em to 1% of the window, so the layout scales like a single image.
                    </>
                }
            />

            <Section id="one-unit" n="1.1" title="One unit: 1em = 1vw">
                <P>
                    The page’s root rule is <C>font-size: 1vw</C>. At a 1920px window that makes 1em = 19.2px; at 1440px it is 14.4px. Then every length (text, gutters, bars, gaps) is written as a
                    multiple of that one unit. Shrink the window and <em>everything</em> shrinks together; the proportions never change, so there are no half-broken in-between layouts.
                </P>
                <EmGridLab />
                <TryThis
                    items={[
                        <>Start at 1440, then drag to 1920 and 1100. The layout is the same picture at different sizes: “em = 1vw” is a design that scales, not a design that re-flows.</>,
                        <>
                            Switch to “fixed px” and drag below 1100: the heading no longer fits, because its size didn’t shrink. This is why fluid em layouts suit posters and editorial pages, and why
                            ordinary apps don’t use them.
                        </>,
                        <>
                            Go to 479 or below: the page leaves the fluid scale and uses a phone layout, with <strong>bigger multipliers</strong> (more in 1.4).
                        </>,
                    ]}
                />
                <Code file="src/modules/pages/AimObys/aim.scss" lang="scss" highlight={['font-size: 1vw', '--aim-pad', 'height: 3.19em', 'width: 32.8%', 'width: 66.3%']}>{`.aim {
    --aim-pad: 0.97em;          /* the one gutter */
    font-size: 1vw;             /* 1em = 1% of the window width */
    line-height: 1;
}
.aim-bar    { width: 100%; height: 3.19em; background: var(--aim-black); }
.aim-line--1 { height: 1px; width: 98%; margin-left: var(--aim-pad); }
.aim-hero__left  { width: 32.8%; }
.aim-hero__right { width: 66.3%; }
.aim-h2 { font-size: 5.69em; line-height: 0.915; letter-spacing: -0.03em; }`}</Code>
                <Lens>
                    It is a Figma frame with “scale” instead of auto layout: you design one canvas and every resize is the same picture bigger or smaller. Auto layout is what ordinary sites use; this
                    page chose scale on purpose.
                </Lens>
                <KeyIdea>Set 1em to 1% of the window, write every size as a multiple of it, and the layout becomes one scalable image.</KeyIdea>
            </Section>

            <Section id="no-boxes" n="1.2" title="Structure without boxes">
                <P>
                    Look at what the page does <em>not</em> use: no cards, no shadows, no filled panels, no icons. Structure comes from a few repeated devices.
                </P>
                <HairlineAnatomy />
                <Table
                    head={['Device', 'Value', '1920px', '1440px']}
                    rows={[
                        ['Gutter', '0.97em', '18.6px', '14px'],
                        ['Thick bar', '3.19em', '61px', '46px'],
                        ['Label text', '0.95em', '18.2px', '13.7px'],
                        ['Hero lines', '5.69em', '109px', '82px'],
                        ['About text', '5.5em', '106px', '79px'],
                        ['Stage headings', '9.5em', '182px', '137px'],
                    ]}
                    mono={[1]}
                />
                <KeyIdea>Pick one gutter and use it everywhere; let one thick bar, hairlines and empty space do the organising instead of boxes.</KeyIdea>
            </Section>

            <Section id="space" n="1.3" title="Empty space is a design decision">
                <P>
                    The big gaps are written down as em too, and they are generous on purpose. The paragraph block starts <strong>20em</strong> below the hero (about 380px), the two paragraphs are{' '}
                    <strong>5.56em</strong> apart, the footnotes sit <strong>9.72em</strong> below the text, and a <strong>70vh spacer</strong> gives the falling logo room to land before the next
                    scene. The footer has <strong>25em</strong> above it.
                </P>
                <Table
                    head={['Gap', 'Value', 'What it does']}
                    rows={[
                        ['Hero → about text', '20em', 'The logo has room to break apart over empty paper before any text arrives'],
                        ['About block → footnotes', '9.72em', 'Marks the footnotes as a different layer of information'],
                        ['Spacer before the stage', '70vh', 'Lets the logo finish zooming before the photos start'],
                        ['Stage → footer', '25em', 'Gives the final logo a full screen of its own'],
                    ]}
                    mono={[1]}
                />
                <Callout tone="tip" title="Steal this for any UI">
                    Even in a dense product, pick two or three spacing values and reuse them. Space that follows a rule reads as calm; space picked by eye each time reads as noise. (The ui-craft skill
                    has a spacing scale for exactly this.)
                </Callout>
            </Section>

            <Section id="phone" n="1.4" title="Phones: same rules, new multipliers">
                <P>
                    At 1vw a 375px phone has a 3.75px “em”, so the desktop multipliers would be unreadable. At 479px and below the page keeps em but swaps every multiplier, and re-stacks the layout.
                </P>
                <Table
                    head={['Thing', 'Desktop', 'Phone ≤ 479px']}
                    rows={[
                        ['Hero lines', '5.69em → 109px at 1920', '9.6em → 36px at 375'],
                        ['Label text', '0.95em → 18px', '3.8em → 14px'],
                        ['Gutter', '0.97em → 18.6px', '5.2em → 19.5px'],
                        ['Columns', 'side by side (32.8 / 66.3)', 'stacked, 100% wide'],
                        ['Navigation', 'a row of links', 'one “Menu” button + overlay'],
                        ['Pinned photo stage', 'sticky stage, scroll-driven', 'a plain list of six photo cards'],
                    ]}
                />
                <Callout tone="warn" title="Could be better">
                    The page sizes full-screen blocks with <C>100vh</C>. On a phone the browser’s address bar changes that height while you scroll, so the first screen can jump. <C>100svh</C> (the
                    small viewport height) stays put; a rebuild should use it.
                </Callout>
                <Where
                    files={[
                        { path: 'AimObys/aim.scss', note: 'desktop rules + the @media (max-width: 479px) block' },
                        { path: 'AimObys/sections/Hero.tsx', note: 'hero markup' },
                    ]}
                />
            </Section>
        </article>
    );
}
