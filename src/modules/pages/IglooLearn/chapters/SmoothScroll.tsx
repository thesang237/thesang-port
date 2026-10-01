'use client';

import LerpFollower from '../demos/LerpFollower';
import ScrollFeel from '../demos/ScrollFeel';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function SmoothScrollChapter() {
    return (
        <article>
            <ChapterHead
                n="01"
                kicker="Smooth scroll"
                title="Heavy, glassy scroll starts with one line of maths."
                lead={
                    <>
                        The first thing you feel on Igloo is the scroll itself: weighty, cinematic, never jerky. That feeling comes from a tiny library called <Term k="lenis">Lenis</Term> and a
                        one-line formula you will use everywhere in this guide.
                    </>
                }
            />

            <Section id="why" n="1.1" title="Why native scroll feels steppy">
                <P>
                    A mouse wheel doesn’t send smooth motion. It sends <strong>notches</strong>: “jump 100 pixels”, “jump 100 pixels”. The browser applies each jump almost instantly. On a text page
                    that is fine. On a page where scroll drives a 3D camera, every notch becomes a visible lurch.
                </P>
                <P>
                    Lenis sits between the wheel and the page. It adds each notch to a <strong>target</strong> position, then every frame moves the real scroll a little way toward that target. The
                    notches melt into one continuous glide.
                </P>
                <ScrollFeel />
                <TryThis
                    items={[
                        'Set lerp to 1 — Lenis becomes identical to native.',
                        'Set lerp to 0.03 — scroll feels like wading through snow. Too heavy for UI, great for a hero moment.',
                        'Turn wheelMultiplier up to 2 and back to 0.85. Lower = each scene gets more screen time per notch.',
                    ]}
                />
            </Section>

            <Section id="lerp" n="1.2" title="Lerp: the one-line animation">
                <P>
                    <Term k="lerp">Lerp</Term> means “find the value part-way between A and B”. If you run it <em>every frame</em> with the result fed back in, you get motion that starts fast and
                    slows down as it arrives — a natural ease-out, with no timeline and no duration.
                </P>
                <Code file="the whole idea">{`const lerp = (a, b, t) => a + (b - a) * t;

// every frame:
current = lerp(current, target, 0.085); // cover 8.5% of the remaining gap`}</Code>
                <P>
                    There is one catch. “8.5% per frame” runs twice as often on a 120Hz screen as on a 60Hz one, so the motion is faster on nicer monitors. The fix is <Term k="damp">damp</Term>: the
                    same idea, but measured per second instead of per frame. Igloo uses it for the smoothed pointer, the hover states and the compositor’s speed effects.
                </P>
                <LerpFollower />
                <Code file="utils/math.ts" highlight={['damp']}>{`export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Frame-rate independent damping. */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
    lerp(a, b, 1 - Math.exp(-lambda * dt));

// usage (IglooPage.tsx → Inputs): the pointer follows the mouse with weight
motion.pointerSmooth.x = damp(motion.pointerSmooth.x, motion.pointer.x, 3.5, dt);`}</Code>
                <KeyIdea>Lerp every frame = an ease-out with no duration. Use damp(a, b, λ, dt) so it feels the same on every screen.</KeyIdea>
                <Lens>
                    λ (lambda) is the “stiffness” of an invisible spring with no bounce. Around 2–4 feels heavy and luxurious (camera, parallax). Around 6–10 feels responsive (hover states, UI). Above
                    15 it is basically instant.
                </Lens>
            </Section>

            <Section id="clock" n="1.3" title="One clock for everything">
                <P>
                    Lenis moves the scroll, ScrollTrigger reads it, the 3D scene renders it. If each ran on its own timer they would drift by a frame and you’d see jitter — text sliding against 3D. So
                    Igloo turns off Lenis’s own loop and hands it to GSAP’s <Term k="ticker">ticker</Term>. One heartbeat, everything in the same frame.
                </P>
                <Code file="IglooPage.tsx" highlight={['gsap.ticker.add', 'autoRaf: false', 'ScrollTrigger.update']}>{`// 1 · GSAP's ticker drives Lenis
useLayoutEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0); // never "skip ahead" after a slow frame
    return () => gsap.ticker.remove(update);
}, []);

// 2 · every Lenis scroll event updates ScrollTrigger in the same tick
lenis.on('scroll', () => {
    ScrollTrigger.update();
    motion.velocity = lenis.velocity; // reused for glitch + wind sound
});

<ReactLenis root ref={lenisRef}
    options={{ autoRaf: false, infinite: true, syncTouch: true,
               lerp: 0.085, wheelMultiplier: 0.85, touchMultiplier: 1.4 }} />`}</Code>
                <Callout tone="meta">This guide is wired exactly like this. Every demo on the page also runs on the same GSAP ticker and pauses itself when you scroll past it.</Callout>
            </Section>

            <Section id="settings" n="1.4" title="The Igloo settings, translated into feel">
                <Table
                    head={['Option', 'Igloo value', 'What it feels like']}
                    mono={[0, 1]}
                    rows={[
                        ['lerp', '0.085', 'Heavy, cinematic glide. The default 0.1 is a touch lighter.'],
                        ['wheelMultiplier', '0.85', 'Each notch travels a bit less — scenes breathe longer.'],
                        ['touchMultiplier', '1.4', 'Phones need a bigger push, fingers move short distances.'],
                        ['syncTouch', 'true', 'Touch scrolling is smoothed too, so the 3D camera doesn’t stutter on phones.'],
                        ['infinite', 'true', 'Scrolling past the end wraps to the top. The last act rebuilds the igloo so the loop is seamless.'],
                        ['autoRaf', 'false', 'Lenis doesn’t run its own loop — GSAP’s ticker calls lenis.raf().'],
                    ]}
                />
            </Section>

            <Section id="lock" n="1.5" title="Scroll lock, restoration and nested scroll">
                <P>Three small details make the experience feel intentional:</P>
                <Table
                    head={['Detail', 'Code', 'Why']}
                    mono={[1]}
                    rows={[
                        ['Locked until the intro ends', 'lenis.stop() … lenis.start()', 'You can’t scroll past the igloo while it is still assembling. The Loader calls start() when done.'],
                        ['Always start at the top', "history.scrollRestoration = 'manual'", 'A reload never drops you mid-story with the wrong scene half-built.'],
                        ['Panels that scroll on their own', 'data-lenis-prevent', 'The detail overlay and Tweak panel keep native scroll inside them — Lenis ignores events there.'],
                        ['Lock while an overlay is open', 'lenis.stop() on open', 'Scrolling behind a modal would silently move the 3D story.'],
                    ]}
                />
                <Where files={[{ path: 'IglooPage.tsx', note: 'Scroller + ReactLenis' }, { path: 'ui/Loader.tsx', note: 'onIntroEnd → lenis.start()' }, { path: 'ui/DetailOverlay.tsx' }]} />
                <Callout tone="warn">
                    Smooth scroll is a design choice with a cost. Keep lerp above ~0.07 for pages people read, and respect <C>prefers-reduced-motion</C> by turning smoothing off for those users.
                </Callout>
            </Section>
        </article>
    );
}
