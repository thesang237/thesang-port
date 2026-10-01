'use client';

import HeroPinLab from '../demos/HeroPinLab';
import SignatureLab from '../demos/SignatureLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function PinnedChapter() {
    return (
        <article>
            <ChapterHead
                n="06"
                kicker="Pinned scenes"
                title="Hold the frame still, and let the scroll bar play the scene."
                lead={
                    <>
                        The most cinematic moment on the page: you scroll, but the hero doesn’t move. Instead it shrinks into a card, darkens, and a lime signature writes itself across it. That’s a{' '}
                        <Term k="pin">pin</Term> plus a <Term k="scrub">scrubbed</Term> timeline — the pattern behind almost every “scrollytelling” site.
                    </>
                }
            />

            <Section id="pin-scrub" n="6.1" title="Pin + scrub = a scene">
                <P>
                    <strong>Pin</strong> freezes the hero on screen for 780 px of scrolling. <strong>Scrub</strong> ties a timeline’s playhead to those 780 px: 0 px = the first frame, 780 px = the
                    last. Scroll back up and the scene plays backwards. The timeline itself uses <C>ease: &apos;none&apos;</C> everywhere — the scroll wheel, Lenis and the scrub lag already shape the
                    motion.
                </P>
                <HeroPinLab />
                <TryThis
                    items={[
                        <>Set scrub to 0 (locked) and scroll: the scene is glued to the scroll bar, a little mechanical. At 2 s it floats behind you like a rubber band.</>,
                        <>Set pin length to 200: the whole scene rushes past in one flick. At 2000 it drags. 780 ≈ three-quarters of a screen — one or two wheel flicks.</>,
                        <>Set the darken curve to 1 (linear), then 3. Watch when the portrait becomes hard to see.</>,
                    ]}
                />
                <Code file="src/modules/pages/LandoNorris/sections/HeroSequence.tsx" highlight={['pin:', 'scrub:', "ease: 'none'"]}>{`const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
        trigger: root.current,
        start: 'top top',
        end: \`+=\${PIN}\`,               // 780 px of scroll
        pin: q('.ln-hero-pin')[0],     // hold the stage still
        scrub: reduce ? true : 0.35,   // 0.35 s catch-up (none under reduced motion)
        onLeave: () => msgReveal.current?.play(),
    },
});
tl.to(state, { p: 1, duration: 1, onUpdate: apply }, 0)            // one progress for the card
  .fromTo(sig[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 }, 0.3)
  .fromTo(q('.ln-hero-mq-a'), { xPercent: -8 }, { xPercent: 4, duration: 1 }, 0)
  .fromTo(q('.ln-hero-mq-b'), { xPercent: 2 }, { xPercent: -10, duration: 1 }, 0)
  .to(q('.ln-hero-race'), { autoAlpha: 0, y: 20, duration: 0.08 }, 0);`}</Code>
                <Lens>
                    It’s a pre-comp that is exactly 1 second long, placed on a scroll “timeline” 780 px long. Scrolling is dragging the playhead through that comp. The durations inside (0.3, 0.16,
                    0.08…) are just shares of the 780 px.
                </Lens>
            </Section>

            <Section id="progress" n="6.2" title="One progress, many outputs">
                <P>
                    Look at the first tween: it doesn’t animate an element — it animates a plain number, <C>state.p</C>, from 0 to 1, and calls <C>apply()</C> on every update. <C>apply</C> turns that
                    one number into everything the card needs.
                </P>
                <Code file="src/modules/pages/LandoNorris/sections/HeroSequence.tsx" lang="ts" highlight={['heroState.progress', '--hpd']}>{`const apply = () => {
    const p = state.p;
    const w = gsap.utils.interpolate(vw(), 630, p);     // card width: screen → 630
    const h = gsap.utils.interpolate(vh(), 405, p);     // card height: screen → 405
    card.style.width = \`\${w}px\`;  card.style.left = \`\${(vw() - w) / 2}px\`;
    card.style.height = \`\${h}px\`; card.style.top = \`\${(vh() - h) / 2}px\`;
    heroState.progress = p;                                         // → WebGL image scale + darken
    root.current?.style.setProperty('--hp', String(p));             // → CSS image scale
    root.current?.style.setProperty('--hpd', String(Math.pow(p, 1.3) * 0.87)); // → CSS darken
    root.current.dataset.header = p > 0.04 ? 'dark' : 'light';     // → header theme
};`}</Code>
                <Table
                    head={['Output', 'From → to', 'Feels like']}
                    rows={[
                        ['Card box', '1920 × 1030 → 630 × 405', 'the window closes in'],
                        ['Image inside', 'scale 1 → 0.68', 'shrinks less than the box — the crop tightens, like a camera zoom'],
                        ['Darkening', 'p^1.3 × 0.87', 'stays bright at first, sinks into the green late'],
                        ['Marquee rows', 'x −8% → 4% and 2% → −10%', 'two lines drifting apart, behind the card'],
                    ]}
                />
                <KeyIdea>Animate one number from 0 to 1, then derive every property from it. One progress, many outputs — CSS, CSS variables and WebGL all stay in sync.</KeyIdea>
                <Callout tone="warn" title="Could be better">
                    <C>apply</C> writes <C>width</C>/<C>height</C>/<C>left</C>/<C>top</C> — layout properties — every frame. It works (the card is simple), but a <C>clip-path: inset()</C> or a scale
                    on the card would skip layout entirely. Measured frame times were still 16.7 ms, so it wasn’t worth changing here.
                </Callout>
            </Section>

            <Section id="signature" n="6.3" title="A signature that writes itself">
                <P>
                    A drawn line is a stroke with a dash as long as the path, pushed off by an offset. Offset = full length → nothing drawn; offset = 0 → fully drawn. Give the path{' '}
                    <C>pathLength=&quot;1&quot;</C> and the maths becomes “draw 0 → 1”. GSAP’s DrawSVG does this for you (<C>drawSVG: &apos;0%&apos; → &apos;100%&apos;</C>). The real trick is{' '}
                    <strong>sequencing</strong>: each of the four strokes gets its own window of the scene.
                </P>
                <SignatureLab />
                <TryThis
                    items={[
                        <>Pick “all at once”: every stroke draws together — it looks like a reveal, not handwriting.</>,
                        <>Pick “by length”: speed is even, like a plotter. Now “source”: the first long stroke is slow and the last ones flick — that’s what a hand does.</>,
                        <>Turn on x-ray to see where each stroke starts. The drawing direction is baked into the path — draw it the way a pen would.</>,
                    ]}
                />
                <Lens>It’s After Effects’ Trim Paths → End, keyframed 0 → 100% on each stroke, with the strokes staggered so they don’t overlap.</Lens>
            </Section>

            <Section id="once" n="6.4" title="Scrubbed vs played once">
                <P>
                    Not everything inside a pinned scene should scrub. When the pin ends, <C>onLeave</C> plays the “MESSAGE FROM ELLIS” block reveal <em>once</em>, at its own speed — text that scrubs
                    with scroll is hard to read. The same split happens all over the page:
                </P>
                <Table
                    head={['Scrubbed (tied to scroll)', 'Played once (triggered by scroll)']}
                    rows={[
                        ['hero card, signature, marquee rows', 'block reveals on every text'],
                        ['gallery travel + background colour', 'gallery captions and quotes'],
                        ['On/Off portraits sliding in, “Collabs” script', '“On” script, social cards fanning out'],
                        ['footer bust rising', 'footer signature'],
                    ]}
                />
                <KeyIdea>Scrub things that are about space (size, position, colour). Play once things you need to read.</KeyIdea>
                <Where
                    files={[
                        { path: 'sections/HeroSequence.tsx' },
                        { path: 'scribbles.ts', note: 'the hand-drawn paths' },
                        { path: 'sections/OnOffTrack.tsx', note: 'pinSpacing: false' },
                        { path: 'sections/Helmets.tsx', note: 'photo pin 420 px' },
                    ]}
                />
            </Section>
        </article>
    );
}
