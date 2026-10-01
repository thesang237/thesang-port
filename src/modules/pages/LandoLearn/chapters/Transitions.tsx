'use client';

import GlyphMaskLab from '../demos/GlyphMaskLab';
import TransitionSequencer from '../demos/TransitionSequencer';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Steps, Table, Term, TryThis, Where } from '../kit/ui';

export default function TransitionsChapter() {
    return (
        <article>
            <ChapterHead
                n="10"
                kicker="Page transitions"
                title="A number “4” opens like a window — and hides the page swap behind it."
                lead={
                    <>
                        The first thing you see is a lime screen. A race-number “4” appears in the middle and grows until the whole page shows through it. Clicking a menu link plays the same move in
                        reverse: a lime “4” swallows the screen, the page changes underneath, and a new “4” window opens on the new page. One overlay, two jobs.
                    </>
                }
            />

            <Section id="mask" n="10.1" title="A window shaped like a 4">
                <P>
                    The overlay is one SVG: a lime rectangle with a <Term k="mask">mask</Term>. In an SVG mask, white shows and black hides. The mask is a white rectangle with a black “4” in the
                    middle — so the lime is visible everywhere <em>except</em> inside the glyph. Scale the glyph up and the hole grows until the lime is gone. For the exit, the same glyph is simply
                    drawn in lime, on top.
                </P>
                <GlyphMaskLab />
                <TryThis
                    items={[
                        <>With expo.in, scrub progress slowly: the “4” seems to zoom at a steady speed — the log₂ line is straight.</>,
                        <>Switch to power2.in and scrub again. It jumps to visible size almost at once, then crawls. Same start and end, very different feel.</>,
                        <>Switch to “cover” mode: the exit. Same glyph, same growth, filled instead of cut out.</>,
                    ]}
                />
                <Code file="src/modules/pages/LandoNorris/shell/Overlay.tsx" lang="tsx" highlight={['fill="black"', 'mask="url(#ln-four-hole)"', 'skewX']}>{`<svg width="100%" height="100%">
    <mask id="ln-four-hole" maskUnits="userSpaceOnUse">
        <rect width="100%" height="100%" fill="white" />               {/* white = lime shows */}
        <path ref={hole} d={FOUR_PATH} fill="black" />                 {/* black = hole */}
    </mask>
    <rect width="100%" height="100%" fill="var(--ln-lime)" mask="url(#ln-four-hole)" />
</svg>

// grow from the screen centre: move to centre → scale → slant → put the glyph's own origin on that point
\`translate(\${cx} \${cy}) scale(\${s}) skewX(-13.5) translate(\${-ox} \${-oy})\``}</Code>
                <Lens>
                    It’s a track matte in After Effects: a lime solid with an inverted alpha matte of the “4”, and the matte layer’s Scale keyframed from 0.1% to 6000% with a strong ease-in. The
                    anchor point sits inside the bar of the 4, so the zoom punches through the glyph’s middle.
                </Lens>
            </Section>

            <Section id="expo" n="10.2" title="Why S1 / 1024 and expo.in belong together">
                <P>
                    The tween goes from <C>S0 = S1 / 1024</C> to <C>S1 = 60</C>. 1024 is 2¹⁰. GSAP’s <Term k="expo">expo.in</Term> is <C>2^(10 × (p − 1))</C> — it also covers exactly ten doublings.
                    Put together, the glyph doubles in size at a perfectly steady rate: every 0.051 s in 0.51 s. Our eyes judge size in ratios, so steady doubling reads as a steady camera push, even
                    though in pixels it’s explosive at the end. The measured video agrees: growth rate k ≈ 13.6 per second = 10 · ln 2 / 0.51.
                </P>
                <KeyIdea>For zooms, animate the scale exponentially: start ~1000× smaller and use expo. Linear scale looks like it slams into the screen.</KeyIdea>
            </Section>

            <Section id="preloader" n="10.3" title="The preloader sequence">
                <P>The same overlay starts the site. It waits for the fonts and the two hero images, then plays one short sequence:</P>
                <Steps
                    items={[
                        <>Lime screen with the “EM” monogram, whose top bar ticks every 0.97 s (CSS, so it runs before JavaScript arrives).</>,
                        <>When fonts + images are ready — and no earlier than 1.364 s after navigation, the moment measured in the video — the reveal starts.</>,
                        <>The monogram clips away (0.13 s) while the “4” window grows (0.51 s, expo.in).</>,
                        <>
                            When the glyph passes scale 1.3 — big enough to see the page through — the overlay fires <C>ln:enter</C>. The hero listens and plays its block reveals.
                        </>,
                        <>
                            At the end the overlay hides itself and sets <C>loaded: true</C> in the store.
                        </>,
                    ]}
                />
                <Code file="src/modules/pages/LandoNorris/shell/Overlay.tsx" lang="ts" highlight={['s > 1.3', 'emitEnter']}>{`grow(hole.current, (s) => {
    // the page becomes visible through the glyph from s ≈ 1 → start its enter animation
    if (!entered && s > 1.3) {
        entered = true;
        emitEnter();                  // window.dispatchEvent(new CustomEvent('ln:enter'))
    }
});`}</Code>
                <Callout tone="tip" title="Designer habit">
                    Start the next scene’s intro <em>during</em> the reveal, not after it. By the time the window is fully open, the hero’s text is already wiping in — the hand-off feels continuous.
                </Callout>
            </Section>

            <Section id="orchestrate" n="10.4" title="Exit → swap → enter">
                <P>
                    A route change in Next.js normally swaps the page instantly. The orchestrator (<C>PageTransition</C>) stretches that into three phases and, crucially, <em>waits</em> between them.
                    Try the mini site below — then break it.
                </P>
                <TransitionSequencer />
                <TryThis
                    items={[
                        <>
                            Turn off “wait for the new page” (keep “slow page” on) and navigate: the window opens on the old page, then the new one pops in unannounced. That’s the bug the wait
                            prevents.
                        </>,
                        <>Turn off “reset scroll”, scroll the home page down, then go to On Track: it opens half-way down, showing the “scroll wasn’t reset” line.</>,
                        <>Turn off “slow page”: with a fast render the missing wait is almost invisible — which is why this bug usually ships and shows up only on slow phones.</>,
                    ]}
                />
                <Code
                    file="src/components/motion-kit/PageTransition.tsx"
                    lang="ts"
                    highlight={['await h.exit', 'router.push', 'requestAnimationFrame', 'ScrollTrigger.refresh', 'await h.enter']}
                >{`const navigate = async (href) => {
    await h.exit(href);                                        // 1. cover (the overlay's lime "4")
    await new Promise((resolve) => {
        pending.current = { href, resolve };
        router.push(href, { scroll: false });                  // 2. swap under the cover
    });                                                        //    resolved when the pathname changes…
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();                                   // 3. re-measure pins for the new page
    await h.enter(href);                                       // 4. reveal
};

useEffect(() => {                                              // …plus two frames for layout
    if (pending.current && norm(pathname) === norm(pending.current.href))
        requestAnimationFrame(() => requestAnimationFrame(pending.current.resolve));
}, [pathname]);`}</Code>
                <Table
                    head={['Phase', 'What happens', 'Timing (measured)']}
                    rows={[
                        ['Exit', 'lime “4” grows from the centre', '0.51 s, expo.in'],
                        ['Hold', 'monogram shows, dissolves, redraws (the route swaps here)', '≈ 1 s'],
                        ['Enter', '“4” window grows on the new page', 'starts ≈ 1.53 s after the click, 0.60 s'],
                        ['Intro', 'TRACK letters rise, “On” script draws, block reveals', 'from s > 1.3'],
                    ]}
                />
                <Callout tone="warn">
                    Links that should transition must go through the orchestrator (<C>TransitionLink</C>). It lets cmd/ctrl-clicks, external links and <C>#anchors</C> behave natively — never hijack
                    “open in new tab”.
                </Callout>
            </Section>

            <Section id="reduced" n="10.5" title="Reduced motion">
                <P>
                    With <Term k="reduced">reduced motion</Term> on, there is no zoom at all: on load the lime layer fades out in 0.35 s; on navigation it fades in (0.3 s), the route swaps, and it
                    fades out. Same orchestration, same waits, no movement.
                </P>
                <KeyIdea>The transition is a sequence of waits, not a sequence of animations. Keep the waits; swap the animations for fades when needed.</KeyIdea>
                <Where
                    files={[{ path: 'shell/Overlay.tsx' }, { path: 'motion-kit/PageTransition.tsx' }, { path: 'graphics.tsx', note: 'FOUR_PATH' }, { path: 'pages/OnTrackPage.tsx', note: 'intro' }]}
                />
            </Section>
        </article>
    );
}
