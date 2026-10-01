'use client';

import GalleryLab from '../demos/GalleryLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function GalleryChapter() {
    return (
        <article>
            <ChapterHead
                n="07"
                kicker="Horizontal gallery"
                title="Scroll down, travel sideways — and let the light change on the way."
                lead={
                    <>
                        The photo gallery turns your vertical scroll into a long sideways pan: 2500 px of scrolling moves the track 3060 px to the left. On the way, the background fades from the dark
                        section green to paper white, and every caption wipes in as it arrives from the right.
                    </>
                }
            />

            <Section id="travel" n="7.1" title="Vertical in, horizontal out">
                <P>
                    It’s the same <Term k="pin">pin</Term> + <Term k="scrub">scrub</Term> pair as the hero, with a different output. The section pins for 2500 px. A scrubbed tween moves the whole
                    track’s <C>x</C> from 0 to −3060 px. The movement starts half a screen early, so about 3000 px of scrolling becomes 3060 px of travel — roughly one pixel sideways for every pixel
                    scrolled. That 1 : 1 rate is why the pan feels natural: your wheel moves the photos exactly as far as it would move the page.
                </P>
                <GalleryLab />
                <TryThis
                    items={[
                        <>
                            Turn off “start moving before the pin”: the track now sits still while the section rises, then lurches. Starting early (at 50% of the screen) hides the seam between
                            vertical and sideways.
                        </>,
                        <>Set depth × to 20: the cards with depth 1.02 now slide over their neighbours. At 1 the effect is almost subliminal — you feel layers without noticing them.</>,
                        <>Set pin length to 800: the photos whip past. That’s the danger of horizontal scroll — the speed ratio is a design decision.</>,
                    ]}
                />
                <Code
                    file="src/components/motion-kit/HorizontalScroll.tsx"
                    lang="ts"
                    highlight={['pin: true', 'start: moveStart', 'x * (d - 1)']}
                >{`ScrollTrigger.create({ trigger: el, start: 'top top', end: \`+=\${pinDistance}\`, pin: true });

const state = { x: 0 };
gsap.to(state, {
    x: 1,
    ease: 'none',
    scrollTrigger: {
        trigger: el,
        start: moveStart,                              // 'top 50%' — before the pin starts
        end: () => \`top+=\${pinDistance} top\`,         // = the end of the pin
        scrub,
    },
    onUpdate: () => {
        const x = -dist() * state.x;                   // 0 → −3060 px
        gsap.set(track, { x });
        items.forEach((it) => {
            const d = Number(it.dataset.depth ?? 1);
            if (d !== 1) gsap.set(it, { x: x * (d - 1) });   // parallax: a little extra
        });
        onUpdate?.(state.x, x);
    },
});`}</Code>
                <Lens>
                    In Figma terms: a horizontal frame much wider than the screen, placed inside a “fixed while scrolling” frame. The prototype’s vertical scroll drives the inner frame’s X position
                    instead of Y.
                </Lens>
            </Section>

            <Section id="depth" n="7.2" title="Depth with a 2% difference">
                <P>
                    Each card has a <C>data-depth</C>: 1 moves with the track, 1.02 moves 2% faster, 0.98 moves 2% slower. At 3060 px of travel, 2% is about 60 px of drift — enough to make the flat
                    row feel like it has layers (<Term k="parallax">parallax</Term>), too little to look like a gimmick.
                </P>
                <KeyIdea>Parallax works best at the edge of perception. If people notice it, it’s probably too strong.</KeyIdea>
            </Section>

            <Section id="colour" n="7.3" title="A background that follows the journey">
                <P>
                    The track’s <C>onUpdate</C> also paints the section’s background. It waits for the first 700 px of travel, then blends each RGB channel from #22281C to #F1F3E8 over the next 2444
                    px, with an ease-out curve <C>1 − (1 − t)^1.8</C> so most of the change happens early. At 40% it rewrites the section’s <C>data-header</C>, so the header flips to its light theme
                    mid-pan, and at 45% the caption ink flips from light to dark.
                </P>
                <Code file="src/modules/pages/LandoNorris/sections/Gallery.tsx" lang="ts" highlight={['Math.pow', 'dataset.header']}>{`const onUpdate = (_p, x) => {
    const h = -x;                                                   // px travelled
    const f = 1 - Math.pow(1 - gsap.utils.clamp(0, 1, (h - 700) / 2444), 1.8);
    const c = DARK.map((d, i) => Math.round(d + (LIGHT[i] - d) * f));
    el.style.backgroundColor = \`rgb(\${c.join(',')})\`;
    el.style.setProperty('--g-ink', f > 0.45 ? '#2a2b25' : '#d9ddd0');
    el.dataset.header = f > 0.4 ? 'light' : 'dark';               // the header reads this (chapter 04)
    // … and the caption check below
};`}</Code>
                <TryThis items={[<>Set the colour ease to 0.5: the room stays dark almost to the end, then brightens abruptly. At 5 it’s light almost immediately.</>]} />
            </Section>

            <Section id="h-triggers" n="7.4" title="Triggers that look sideways">
                <P>
                    ScrollTrigger fires when something crosses a line on the <em>vertical</em> axis. But inside a pinned section nothing moves vertically — the cards move horizontally. So the gallery
                    runs its own check in <C>onUpdate</C>: when a card’s left edge (its x on the track + the current track x) passes 96% of the screen width, and its top is on screen, its caption
                    plays its block reveal, once.
                </P>
                <Code file="src/modules/pages/LandoNorris/sections/Gallery.tsx" lang="ts" highlight={['vw * 0.96']}>{`reveals.current.forEach((r) => {
    if (!r.done && r.x + x < vw * 0.96 && top + r.y < window.innerHeight * 0.92) {
        r.done = true;
        r.h.play();          // BlockReveal (trigger="manual")
    }
});`}</Code>
                <Callout tone="tip" title="Designer habit">
                    When you spec a horizontal section, spec its reveals horizontally too: “caption appears when the photo is 4% from the right edge”. It keeps the pan from showing empty frames.
                </Callout>
                <Where files={[{ path: 'motion-kit/HorizontalScroll.tsx' }, { path: 'sections/Gallery.tsx' }, { path: 'data.ts', note: 'GALLERY layout + depths' }]} />
            </Section>
        </article>
    );
}
