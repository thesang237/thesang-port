'use client';

import LayerStack from '../demos/LayerStack';
import PipelineDiagram from '../demos/PipelineDiagram';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, Where } from '../kit/ui';

const STORY: [string, string, string, string][] = [
    ['Preloader', 'time', 'Lime screen, monogram ticks, a “4”-shaped window grows and reveals the hero', '10 Page transitions'],
    ['Hero', 'pointer + time', 'Portrait on a light contour background; the cursor paints a helmet on; a wire helmet drops every second', '09 Shader effects'],
    ['Hero → card', 'scroll, pinned 780 px', 'The full-screen hero shrinks to a card, darkens, a lime signature draws over it', '06 Pinned scenes'],
    ['Manifesto', 'scroll, enter once', 'Seven huge lines, each wiped in by a lime block as it enters', '03 Block reveal'],
    ['Gallery', 'scroll, pinned 2500 px', 'Photos travel sideways; the background fades dark → light; captions wipe in', '07 Horizontal gallery'],
    ['On / Off track', 'scroll, scrubbed', 'Two portraits slide in from the edges, titles wipe in, the “On” script draws', '06 · 03'],
    ['Helmets', 'scroll, pinned 420 px', 'A full-bleed photo holds, a black band slides up, a staggered grid drifts', '07 · 04'],
    ['Store → Footer', 'scroll', 'Block wipes on light sections, a drawn “Collabs” script, a fanning card stack, logo marquees', '03 · 04'],
    ['Menu (any time)', 'click', 'Curved panel drops, photos clip in, nav rises; hover turns photos from duotone to colour', '05 Menu · 09'],
    ['Route change', 'click', 'A lime “4” covers the screen, the page swaps underneath, the “4” window opens on the new page', '10 Page transitions'],
];

export default function MapChapter() {
    return (
        <article>
            <ChapterHead
                n="00"
                kicker="The map"
                title="One scroll wheel, one clock, many small scenes."
                lead={
                    <>
                        Before learning any single effect, get the big picture. The page feels like one long film, but under the hood it is a stack of small, independent scenes — each listening to the
                        scroll position, a click or the pointer — all ticking on the same clock.
                    </>
                }
            />

            <Section id="one-sentence" n="0.1" title="The one-sentence version">
                <P>
                    Your wheel moves the page. <Term k="lenis">Lenis</Term> smooths that movement. On every frame, GSAP’s <Term k="ticker">ticker</Term> updates Lenis, and Lenis tells{' '}
                    <Term k="scrolltrigger">ScrollTrigger</Term> where the page is. ScrollTrigger then plays or <Term k="scrub">scrubs</Term> about forty small <Term k="timeline">timelines</Term>— one
                    for the hero, one for the gallery, one per text reveal — and those timelines move elements, set CSS variables, or write numbers that the WebGL layer reads.
                </P>
                <KeyIdea>Every scene is its own small timeline, and every timeline hangs off the same scroll position and the same clock.</KeyIdea>
                <Lens>
                    Think of a Figma prototype where every frame has its own “while scrolling” animation, and they all share one scroll bar. Or an After Effects project with many small comps, each
                    pre-composed and placed on the main timeline at the scroll distance where it should play.
                </Lens>
            </Section>

            <Section id="pipeline" n="0.2" title="The pipeline, from wheel to pixels">
                <P>
                    The same chain runs 60 times a second. Hover the boxes: each is a technique with its own chapter later. The dashed lines are the two “side doors” — the shared clock, and one-off
                    events like “the preloader finished”.
                </P>
                <PipelineDiagram />
            </Section>

            <Section id="storyboard" n="0.3" title="The storyboard">
                <P>
                    This is a <strong>clone</strong>: it was rebuilt from a two-minute screen recording of a real racing driver’s site, with all names, logos and photos replaced by a fictional driver
                    (“Ellis Morrow”) and original 3D renders. The motion is what was copied. Here is the page, top to bottom, with what triggers each scene.
                </P>
                <Table head={['Scene', 'Trigger', 'What you see', 'Chapter']} rows={STORY} mono={[1, 3]} />
                <Callout tone="tip" title="Designer habit">
                    Notice the “Trigger” column. Before designing any motion, decide what drives it: <strong>time</strong> (plays once), <strong>scroll</strong> (scrubbed or played on enter),{' '}
                    <strong>pointer</strong> or an <strong>event</strong>. The same animation feels completely different under each.
                </Callout>
            </Section>

            <Section id="layers" n="0.4" title="Layers, top to bottom">
                <P>
                    A lot of the magic is simply <strong>stacking order</strong>. The WebGL canvas sits between the photo and the text, the header sits above the menu so its button can become the
                    close “×”, and the lime overlay sits above everything so it can hide a page swap.
                </P>
                <LayerStack />
            </Section>

            <Section id="state" n="0.5" title="Three kinds of state">
                <P>
                    The page shares information in three ways, picked by <em>how often</em> it changes. Rare changes (is the menu open?) live in a small <Term k="store">store</Term> that React listens
                    to. Per-frame numbers (how far is the hero shrunk?) live in a plain object that React never sees. One-off moments (the preloader finished) are broadcast as a{' '}
                    <Term k="event">custom event</Term>.
                </P>
                <Table
                    head={['Kind', 'Changes', 'Example', 'Where']}
                    rows={[
                        ['Store (zustand)', 'a few times per visit', 'loaded, menuOpen, headerCompact, headerTheme', 'store.ts'],
                        ['Plain object', '60× per second', 'heroState.progress, heroState.mouse', 'gl/heroState.ts'],
                        ['Custom event', 'once', 'window “ln:enter” → hero + On Track intros play', 'store.ts · Overlay.tsx'],
                    ]}
                    mono={[3]}
                />
                <Code
                    file="src/modules/pages/LandoNorris/gl/heroState.ts"
                    lang="ts"
                    highlight={['progress: 0', 'mouse']}
                >{`// Mutable state shared between the DOM hero sequence and the WebGL layer (no React re-renders).
export const heroState = {
    /** 0 = full-screen hero, 1 = small card (pinned scrub progress) */
    progress: 0,
    /** pointer in viewport px */
    mouse: { x: -9999, y: -9999, active: false },
};`}</Code>
                <KeyIdea>Pick the container by frequency: store for UI switches, a plain object for per-frame numbers, an event for “it just happened”.</KeyIdea>
            </Section>

            <Section id="vocabulary" n="0.6" title="Vocabulary bridge">
                <P>The words this guide uses, in design terms and in code terms. Hover any dotted word later for a reminder.</P>
                <Table
                    head={['You might say', 'The code says', 'Meaning']}
                    rows={[
                        ['Smooth scroll', <C key="a">Lenis, lerp: 0.1</C>, 'The page glides to where you scrolled instead of jumping'],
                        ['Keyframes / comp', <C key="b">gsap.timeline()</C>, 'Tweens placed at exact times on one playhead'],
                        ['Scroll-linked', <C key="c">scrub: 0.35</C>, 'Progress follows the scroll bar (with 0.35 s catch-up)'],
                        ['Fixed while scrolling', <C key="d">pin: true, end: +=780</C>, 'Hold an element for 780 px of scroll'],
                        ['When it appears', <C key="e">start: &apos;top 92%&apos;, once</C>, 'Play when its top crosses 92% of the screen height'],
                        ['Offset layers', <C key="f">stagger: 0.075</C>, 'Each item starts 0.075 s after the previous one'],
                        ['Anchor point', <C key="g">transformOrigin</C>, 'The pivot of a scale or rotation'],
                        ['Track matte', <C key="h">SVG mask / clip-path</C>, 'A shape that decides what shows'],
                        ['Trim paths', <C key="i">drawSVG</C>, 'How much of a stroke is drawn'],
                        ['Effect parameter', <C key="j">uniform</C>, 'A number sent to a shader every frame'],
                    ]}
                />
            </Section>

            <Section id="files" n="0.7" title="Where things live">
                <P>
                    Reusable motion pieces live in <C>src/components/motion-kit</C>; everything specific to this page lives in <C>src/modules/pages/LandoNorris</C>. Chapters end with “In the source”
                    chips pointing to the exact file.
                </P>
                <Code file="file tree" lang="bash">{`src/components/motion-kit/        reusable, page-agnostic
  gsap.ts            plugins registered once (ScrollTrigger, SplitText, DrawSVG, Flip)
  SmoothScroll.tsx   Lenis on gsap.ticker (lerp 0.1)
  BlockReveal.tsx    the signature text wipe
  RollingText.tsx    per-character hover roll
  HorizontalScroll   pinned sideways track with depth parallax
  Marquee.tsx        ticker-driven seamless loop
  PageTransition.tsx exit → route swap → enter orchestrator
  WebGLCanvas.tsx    R3F canvas on three/webgpu (WebGL2 fallback)

src/modules/pages/LandoNorris/
  LandoShell.tsx     SmoothScroll + PageTransition + Header + Menu + Overlay
  store.ts           zustand UI state + the "ln:enter" event
  data.ts  graphics.tsx  scribbles.ts     copy, SVG art, hand-drawn paths
  shell/   Overlay (preloader + transition) · Header · Menu
  gl/      HeroGL · MenuGL · heroState
  sections/ HeroSequence · Manifesto · Gallery · OnOffTrack · Helmets · Store · Partners · Socials · Footer
  pages/   HomePage · OnTrackPage`}</Code>
                <Where
                    files={[
                        { path: 'LandoNorris/LandoShell.tsx' },
                        { path: 'LandoNorris/store.ts' },
                        { path: 'LandoNorris/gl/heroState.ts' },
                        { path: '.clone-analysis/SPEC.md', note: 'timeline + animation catalogue' },
                    ]}
                />
            </Section>
        </article>
    );
}
