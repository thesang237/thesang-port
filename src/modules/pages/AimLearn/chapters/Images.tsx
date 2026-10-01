'use client';

import CoverZoomLab from '../demos/CoverZoomLab';
import FooterStagger from '../demos/FooterStagger';
import ImageEntranceLab from '../demos/ImageEntranceLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function ImagesChapter() {
    return (
        <article>
            <ChapterHead
                n="05"
                kicker="Images in motion"
                title="Colour first, photo second, one gesture."
                lead={
                    <>
                        Photos are the heaviest thing on any page, so they arrive in two beats: a flat colour that is already there, then the photo easing in over it. Add a small settle-in zoom and a
                        steady <Term k="stagger">stagger</Term> and a grid of photos feels like one gesture instead of a grid loading.
                    </>
                }
            />

            <Section id="entrance" n="5.1" title="Colour first, then the photo settles in">
                <P>
                    Each image has a <Term k="placeholder">colour placeholder</Term> behind it (the page stores a dominant colour per photo). The photo fades in on top and, at the same time, settles
                    from
                    <C>scale 1.1</C> down to <C>1.02</C>. Because the colour is already on screen, there is never an empty hole while the photo loads, and the fade feels like the picture “developing”.
                </P>
                <ImageEntranceLab />
                <TryThis
                    items={[
                        <>
                            Turn off “colour placeholder”, then Replay: the tiles are paper and the photos pop out of nothing. With the colour on, the grid already has its overall tone before any
                            photo shows.
                        </>,
                        <>Set start zoom to 1 and end zoom to 1: only the fade is left. It looks fine, but flat: the settle is what makes it feel like a camera coming to rest.</>,
                        <>
                            Set the stagger step to 300 ms with the cap off: the last tile starts 3.3 seconds late and the group no longer reads as one gesture. Turn the cap on and it squeezes back to
                            half a second.
                        </>,
                        <>Switch “when” to “on scroll (batch)” and scroll the box: tiles that enter together are staggered together, so item 12 never waits for items 1 to 11.</>,
                    ]}
                />
                <Code file="src/modules/pages/AimLearn/demos/ImageEntranceLab.tsx" lang="ts" highlight={['ScrollTrigger.batch', 'scale: p.to', 'opacity: 1']}>{`// per tile, at its place in the order
tl.to(img, { scale: 1.02,  duration: 1.8, ease: 'inOutCubic' }, at)             // settle from ×1.1
  .to(img, { opacity: 1,   duration: 0.8, ease: 'inOutQuart' }, at + 0.2)       // fade in a beat later
  .to(ph,  { opacity: 0,   duration: 0.2, ease: 'none' },       at + 1.2)        // colour leaves last

// many tiles: group the ones that enter together, then stagger inside the group
ScrollTrigger.batch(tiles, { start: 'top 92%', once: true, onEnter: (batch) => play(batch) })`}</Code>
                <Callout tone="tip" title="Where this recipe comes from">
                    These numbers are the site’s own image-entrance recipe, defined in its interaction data (scale 1.1 → 1.02 over 1.8s, fade 0.8s after 0.2s, colour block gone at 2.0s). The home page
                    you saw in the recording uses its deck variant (5.3); this recipe is the one for ordinary image grids.
                </Callout>
                <KeyIdea>Put a colour where the photo will be, fade the photo in over it and let it settle from a slight zoom. The group starts one by one, never all at once.</KeyIdea>
            </Section>

            <Section id="stagger" n="5.2" title="Stagger: small gaps, a hard cap">
                <P>A stagger works because the eye reads many small motions as one. The rules the page follows, and one place where the stagger isn’t code at all:</P>
                <Table
                    head={['Where', 'Gap', 'Why']}
                    rows={[
                        ['Hero lines', '100 ms', 'Three big lines: wide gaps let each one land'],
                        ['Phone menu words', '100 ms', 'Three words, the first thing seen after a tap'],
                        ['Image grids (house rule)', '70 ms, capped at ~0.5s total', 'Many small items: the whole group should start within half a second'],
                        ['Stage photo columns', '3% of scroll apart', 'A scrubbed stagger: a different start position, not a delay'],
                        ['Footer logo blocks', '2 frames = 33 ms', 'Baked into the animation file'],
                    ]}
                />
                <FooterStagger />
                <TryThis
                    items={[
                        <>
                            Drag the progress from 15% to 45% very slowly: the blocks lift off one after another. Nothing in the page’s code delays them; the offsets are in the Lottie file’s layer
                            in-points.
                        </>,
                        <>Press Play: the whole logo builds in 2.8 seconds. At normal speed the 33 ms offsets read as a ripple, not as separate steps.</>,
                    ]}
                />
                <Lens>
                    Offsetting layers in After Effects by 2 frames each. When the stagger is in the file you cannot tune it in code, so choose the Lottie route only for decoration you won’t revisit.
                </Lens>
                <KeyIdea>Stagger = a small gap between items, in reading order, with the whole group capped so it never feels slow.</KeyIdea>
            </Section>

            <Section id="cover" n="5.3" title="Cover and zoom: the stage that never stops">
                <P>
                    On the pinned stage the six photos change by <em>covering</em>: the next one slides up over the current one. The trick that makes it feel expensive: the photo underneath keeps
                    zooming (×1 → ×1.2) while it is being covered, and the incoming photo fades in as it rises. Three tracks on one 10% window, so it reads as one gesture.
                </P>
                <CoverZoomLab />
                <Code
                    file="src/modules/pages/AimObys/scenes.ts"
                    lang="ts"
                    highlight={['scale: [[35, 1], [45, 1.2]', 'opacity: [[35, 0], [45, 1]]']}
                >{`// photo 1: just keeps pushing in, until slide 2 has covered it
{ scale: [[35, 1], [45, 1.2]] },
// photo 2: fades in as its slide rises (35→45), then pushes in while slide 3 covers it (45→55)
{ opacity: [[35, 0], [45, 1]], scale: [[45, 1], [55, 1.2]] },`}</Code>
                <KeyIdea>When one thing covers another, keep the covered one moving. A still image under a moving cover looks like a slideshow; a pushing image looks like a camera.</KeyIdea>
            </Section>

            <Section id="cheap" n="5.4" title="Keep image motion cheap">
                <Table
                    head={['Do', 'Avoid', 'Why']}
                    rows={[
                        ['Animate transform and opacity only', 'Animating width, height, top, left or filter on photos', 'Only those two skip layout and paint: it stays at 60fps'],
                        ['A colour block behind every photo', 'A blank tile while loading', 'The page never shows a hole; the colour is a free “first frame”'],
                        ['object-fit: cover on a fixed box', 'Letting the photo’s own size set the box', 'No layout shift when the photo arrives'],
                        ['Short, capped staggers', 'One long cascade for twenty items', 'A group that takes two seconds to appear feels broken'],
                        ['Reduced motion: no zoom, no stagger, short fade', 'Removing the entrance completely', 'People still need to see that something arrived'],
                    ]}
                />
                <Callout tone="warn" title="Could be better">
                    The clone loads the stage’s eight photos with <C>loading=&quot;eager&quot;</C> (about 2 MB) because the stage needs them the moment you reach it. A production build should preload
                    only the first two and lazy-load the rest; the colour placeholders are what make that safe.
                </Callout>
                <Where
                    files={[
                        { path: 'AimObys/scenes.ts', note: 'SLIDE_IMAGES' },
                        { path: 'AimObys/sections/Experiment.tsx', note: 'slides with colour placeholders' },
                        { path: 'AimObys/lottie/footer.json', note: 'the staggered footer blocks' },
                    ]}
                />
            </Section>
        </article>
    );
}
