'use client';

import FlickDecay from '../demos/FlickDecay';
import ScrollCompare from '../demos/ScrollCompare';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function SmoothScrollChapter() {
    return (
        <article>
            <ChapterHead
                n="02"
                kicker="Smooth scroll"
                title="The page glides because every frame covers 10% of the way."
                lead={
                    <>
                        Every scroll-linked effect on the page inherits its feel from one setting: how quickly the visible scroll catches up with where you asked it to go. Get this right and pinned
                        scenes feel heavy and cinematic; get it wrong and everything feels either laggy or jittery.
                    </>
                }
            />

            <Section id="what" n="2.1" title="What smooth scroll actually does">
                <P>
                    A mouse wheel moves the page in jumps of ~100 px. <Term k="lenis">Lenis</Term> keeps a <strong>target</strong> (where you asked to be) and a <strong>current</strong> position (what
                    you see). On every frame it moves current toward target by a share of the remaining gap. That share is the <Term k="lerp">lerp</Term> value.
                </P>
                <ScrollCompare />
                <Lens>
                    It’s a “follow” expression in After Effects: each frame, the layer moves 10% of the way to its target. Far away, it moves fast; close, it creeps in. No keyframes, no duration —
                    just a chase.
                </Lens>
                <TryThis
                    items={[
                        <>Set lerp to 1 on the right box: it becomes identical to the native one.</>,
                        <>Set it to 0.03 and flick hard. Beautiful for five seconds, then maddening — the page never seems to stop.</>,
                        <>Turn on lenis.stop() and try to scroll the right box. That’s what happens to the page behind the open menu.</>,
                    ]}
                />
            </Section>

            <Section id="measure" n="2.2" title="Measuring 0.1 from the video">
                <P>
                    How do you find the lerp of a site you don’t own? Flick the wheel once in the recording and measure how far the page still has to go every 0.1 s (3 frames). In the reference, the
                    remaining distance shrank to <strong>×0.55</strong> each time. Lenis moves by <C>1 − e^(−lerp·60·dt)</C> per frame, so after 0.1 s what’s left is <C>e^(−6·lerp)</C>. Solve{' '}
                    <C>e^(−6·lerp) = 0.55</C> → <strong>lerp ≈ 0.0996</strong>. That’s exactly Lenis’s default, 0.1.
                </P>
                <FlickDecay />
                <TryThis
                    items={[
                        <>Drag lerp until “left after 0.1 s” reads ×0.55 — the circles (the video) sit right on the 60 fps line.</>,
                        <>Switch to “naive per-frame lerp”. Now the 120 fps dot arrives twice as fast as the 30 fps one: the feel changes with the screen. That’s why Lenis uses time, not frames.</>,
                    ]}
                />
                <Table
                    head={['lerp', 'Left after 0.1 s', 'Feels like']}
                    rows={[
                        ['0.05', '×0.74', 'heavy, floaty — luxury / editorial'],
                        ['0.1 (this site)', '×0.55', 'smooth but responsive — the default'],
                        ['0.2', '×0.30', 'crisp, barely smoothed'],
                        ['1', '×0', 'no smoothing at all'],
                    ]}
                    mono={[0, 1]}
                />
                <KeyIdea>Measure the decay once, and a single number reproduces the whole scroll feel of a site.</KeyIdea>
            </Section>

            <Section id="clock" n="2.3" title="One clock for scroll, triggers and tweens">
                <P>
                    Lenis could run its own animation loop. Instead, the source turns that off (<C>autoRaf: false</C>) and calls <C>lenis.raf()</C> from GSAP’s <Term k="ticker">ticker</Term>. Every
                    scroll event then calls <C>ScrollTrigger.update</C>. The result: in every frame, the scroll moves first, then triggers and timelines update from that exact position, then the
                    browser paints. Pinned scenes can’t lag one frame behind the page.
                </P>
                <Code file="src/components/motion-kit/SmoothScroll.tsx" highlight={['autoRaf: false', 'ScrollTrigger.update', 'ticker.add', 'lagSmoothing']}>{`useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instance = new Lenis({ lerp: 0.1, autoRaf: false, ...options, ...(reduce ? { smoothWheel: false } : null) });
    const onTick = (time: number) => instance.raf(time * 1000);

    instance.on('scroll', ScrollTrigger.update);   // triggers read the smoothed position
    gsap.ticker.add(onTick);                        // one clock
    gsap.ticker.lagSmoothing(0);                    // never "skip ahead" after a slow frame
    window.__lenis = instance;
    return () => { gsap.ticker.remove(onTick); instance.destroy(); };
}, [options]);`}</Code>
                <Callout tone="meta">
                    This guide does the same thing: its own Lenis (lerp 0.1) is driven by <C>gsap.ticker</C>, and every demo animates on that ticker too — paused when it scrolls off screen.
                </Callout>
            </Section>

            <Section id="control" n="2.4" title="Stopping, jumping and restoring">
                <P>A few small rules keep smooth scroll from fighting the rest of the page:</P>
                <Table
                    head={['Situation', 'What the source does', 'Where']}
                    rows={[
                        ['Menu open', <C key="a">lenis.stop()</C>, 'shell/Menu.tsx'],
                        ['Route changed', <C key="b">scrollTo(0, {'{ immediate, force }'})</C>, 'motion-kit/PageTransition.tsx'],
                        ['Back/forward', <C key="c">history.scrollRestoration = &apos;manual&apos;</C>, 'LandoShell.tsx'],
                        ['Fonts loaded / page load', <C key="d">ScrollTrigger.refresh()</C>, 'LandoShell.tsx'],
                        ['Scroll box inside the page', <C key="e">data-lenis-prevent</C>, '(this guide’s demos)'],
                    ]}
                    mono={[2]}
                />
                <Callout tone="warn">
                    Fonts change text heights. If ScrollTrigger measured the page before the web fonts arrived, every pin starts in the wrong place. That’s why the shell refreshes after{' '}
                    <C>document.fonts.ready</C>.
                </Callout>
            </Section>

            <Section id="reduced" n="2.5" title="Reduced motion">
                <P>
                    With <Term k="reduced">reduced motion</Term> on, the source keeps Lenis (so ScrollTrigger still gets its updates) but sets <C>smoothWheel: false</C>: the wheel scrolls natively,
                    with no glide. Motion-sensitive people get a page that goes exactly where they scroll.
                </P>
                <KeyIdea>Smoothing is decoration. Keep the machinery, drop the glide when someone asks for less motion.</KeyIdea>
                <Where files={[{ path: 'motion-kit/SmoothScroll.tsx' }, { path: 'LandoNorris/LandoShell.tsx' }, { path: 'shell/Menu.tsx', note: 'lenis.stop()' }]} />
            </Section>
        </article>
    );
}
