'use client';

import HoverSwapLab from '../demos/HoverSwapLab';
import SequenceXRay from '../demos/SequenceXRay';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function InteractChapter() {
    return (
        <article>
            <ChapterHead
                n="06"
                kicker="Hovers & overlays"
                title="Small swaps, big sheets, one owner per element."
                lead={
                    <>
                        Everything that happens <em>between</em> the big scenes: a line that swaps under a link, an arrow that slides out and another in, a header that slides down, a gallery that
                        opens over the page, a black sheet that wipes between pages. They are small GSAP <Term k="timeline">timelines</Term> with a few rules in common.
                    </>
                }
            />

            <Section id="hovers" n="6.1" title="Swap, don’t fade">
                <P>
                    The page’s hovers all use one idea: the old thing <strong>leaves in one direction</strong> while an identical new one <strong>arrives from the other</strong>. Two underlines, two
                    arrows, two rule lines. It reads as a continuous belt rather than something turning on and off, and it works with no colour change at all, which suits a black-and-paper page.
                </P>
                <HoverSwapLab />
                <TryThis
                    items={[
                        <>
                            Flick the mouse in and out of the link quickly. In “smooth” mode the lines reverse from wherever they are. Switch to “snap”: each re-entry restarts and the line jumps. That
                            jump is what bad hovers feel like.
                        </>,
                        <>Set “out starts after” to 0: grazing the link makes the line flicker. The page’s 0.2s delay is a tiny debounce.</>,
                        <>Try the in-out-cubic against linear at 0.5s. The curve makes the line leave with intent and arrive softly; linear looks mechanical.</>,
                    ]}
                />
                <Table
                    head={['Hover', 'In', 'Out']}
                    rows={[
                        ['Underline swap (links)', '0.5s, both lines +140%, in-out-cubic', '0.4s after a 0.2s wait, back to 0'],
                        ['Arrow swap (“Learn More”)', '0.4s, arrow 1 → +150%, arrow 2 −150% → 0', '0.3s, ease out'],
                        ['Rule wipe (top line of the button)', '0.8s: line 1 → +110%, line 2 −100% → 0, 0.1s later', '0.5s, in-out-cubic'],
                    ]}
                />
                <Code
                    file="src/modules/pages/AimObys/sections/UnderlineLink.tsx"
                    lang="ts"
                    highlight={['overwrite: true', 'xPercent: 140']}
                >{`const onEnter = () => gsap.to(lines, { xPercent: 140, duration: 0.5, ease: 'aimInOutCubic', overwrite: true })
const onLeave = () => gsap.to(lines, { xPercent: 0,   duration: 0.4, delay: 0.2, ease: 'aimInOutCubic', overwrite: true })
// to() starts from the current position, overwrite kills the other direction: that is what makes it interruptible`}</Code>
                <Callout tone="warn" title="Hover only where hover exists">
                    Touch screens have no hover. The page’s hover swaps are decoration only: the link works without them. Always make sure nothing important hides behind a hover, and give keyboard
                    focus the same effect (the lab does: tab to the link).
                </Callout>
                <KeyIdea>Make hovers swap, not fade: one thing leaves while its twin arrives. Use .to() with overwrite so a quick in-and-out reverses from where it is.</KeyIdea>
            </Section>

            <Section id="sequences" n="6.2" title="Overlays are small timelines, written down">
                <P>
                    The gallery, the phone menu, the page wipe and the pinned header are all the same kind of thing: a handful of tweens with exact start times, durations and curves. The x-ray below
                    draws those numbers as bars, and runs the very same data as a real GSAP timeline in the mock page.
                </P>
                <SequenceXRay />
                <TryThis
                    items={[
                        <>Play “Gallery opens” at 0.3× speed: three bars overlap heavily. The backdrop is still fading in when the panel starts rising: overlap is what makes it one gesture.</>,
                        <>
                            Compare “opens” and “closes”: closing is <em>not</em> the opening reversed. The text leaves first and fast (0.4s), the panel waits 0.7s. Exits are quicker and lead with the
                            content.
                        </>,
                        <>In “Page wipe”, find the dashed marker: the page resets while the black sheet fully covers it, so the visitor never sees the jump.</>,
                        <>“Phone menu”: three words, 0.1s apart, all 1s long. A stagger of 100ms is wide enough to read each word land.</>,
                    ]}
                />
                <Callout tone="tip" title="Rules these sequences follow">
                    <strong>Old before new:</strong> in the wipe, the old page is fully covered before anything changes. <strong>Exits shorter than entrances.</strong>{' '}
                    <strong>Lock scroll while an overlay is open</strong> (the gallery stops the smooth scroll and restores it at the end). <strong>Escape closes it</strong>, focus returns to where it
                    came from.
                </Callout>
                <Lens>An After Effects comp with five layers where you have typed the in-points, durations and easing into a spreadsheet, and the spreadsheet is the animation.</Lens>
                <KeyIdea>
                    Write an overlay as a list of tweens: target, start, duration, curve. Overlap them, make exits shorter than entrances, and keep the list as the single source of truth.
                </KeyIdea>
            </Section>

            <Section id="owner" n="6.3" title="One owner per element">
                <P>
                    The most common bug when mixing CSS and GSAP: both move the same element. If a stylesheet says <C>transform: translateY(10%)</C> and GSAP also animates <C>yPercent</C>, the two
                    <em> add up</em> (a 10% offset you didn’t ask for) or fight each other. While building the clone this showed up in the gallery: the panel started 10% lower than intended, because
                    the stylesheet and GSAP had each added their own 10%.
                </P>
                <Table
                    head={['Symptom', 'Cause', 'Fix']}
                    rows={[
                        ['Element starts at the wrong place', 'A CSS transform and a GSAP yPercent stack', 'Set start states in GSAP (gsap.set / fromTo), not in CSS'],
                        ['Animation jumps on first hover', 'GSAP read a CSS translateX as pixels, not as a percentage', 'Park elements with gsap.set({ xPercent: -150 })'],
                        ['Hover feels sticky or snaps', 'fromTo() restarts from a fixed value', 'Use to() with overwrite: true'],
                        ['Overlay stays on top of everything', 'display: none was never restored', 'Set display at the end of the closing timeline'],
                    ]}
                />
                <Code file="src/modules/pages/AimObys/AimObysPage.tsx" lang="ts" highlight={['y: 0', 'yPercent: 10']}>{`// GSAP owns both ends: the start state is set here, not in the stylesheet
galleryTl.current = gsap.timeline()
  .fromTo(q('gallery-blur'),  { opacity: 0 },            { opacity: 1, duration: 1.2, ease: 'aimInOutQuart' }, 0)
  .fromTo(q('gallery-cut'),   { yPercent: 10, y: 0 },    { yPercent: 0, duration: 1, ease: 'aimInOutCubic' }, 0.3)
  .fromTo(q('gallery-popup'), { opacity: 0 },            { opacity: 1, duration: 1.4, ease: 'power1.out' }, 0.4)`}</Code>
                <Where
                    files={[
                        { path: 'AimObys/AimObysPage.tsx', note: 'gallery, menu, wipe timelines' },
                        { path: 'AimObys/sections/UnderlineLink.tsx' },
                        { path: 'AimObys/sections/Experiment.tsx', note: 'LearnMore button' },
                        { path: 'AimObys/shell/Gallery.tsx · MobileMenu.tsx · Transition.tsx' },
                    ]}
                />
                <KeyIdea>One owner per element: if GSAP animates a property, GSAP also sets its start state. Never split a transform between CSS and GSAP.</KeyIdea>
            </Section>
        </article>
    );
}
