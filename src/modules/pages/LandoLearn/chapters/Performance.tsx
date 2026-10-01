'use client';

import Checklist from '../demos/Checklist';
import PauseBench from '../demos/PauseBench';
import ReducedSwitch from '../demos/ReducedSwitch';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function PerformanceChapter() {
    return (
        <article>
            <ChapterHead
                n="11"
                kicker="Performance & accessibility"
                title="Smooth for everyone: 16.7 ms a frame, and calm when asked."
                lead={
                    <>
                        A motion-heavy page has two duties beyond looking good: never stutter, and never force movement on someone who asked for less. Here’s how the clone was measured, what keeps it
                        light, and what changes under reduced motion.
                    </>
                }
            />

            <Section id="numbers" n="11.1" title="The numbers">
                <P>
                    At 60 frames per second, each frame gets <strong>16.7 ms</strong> for everything: scroll, triggers, tweens, WebGL and the browser’s own painting. The clone was measured with a
                    headless browser scrolling the whole page with the mouse wheel, on a production build.
                </P>
                <Table
                    head={['Check', 'Result']}
                    rows={[
                        ['Frame time while scrolling (median / 99th percentile)', '16.7 ms / 16.8 ms'],
                        ['Worst frame', '33.4 ms (one dropped frame)'],
                        ['Frames slower than 20 ms', '0.2%'],
                        ['Long tasks (> 50 ms)', '0'],
                        ['5 round trips home ↔ On Track: ScrollTriggers', '42 ↔ 0 (all cleaned up)'],
                        ['…WebGL canvases', '1–2 (the menu layer stays once opened)'],
                        ['…window listeners / memory', '42–46 / flat'],
                    ]}
                    mono={[1]}
                />
                <Lens>16.7 ms is your frame budget, like a page budget in print: every effect spends some of it. When it’s overspent, frames drop and the page stutters.</Lens>
            </Section>

            <Section id="pause" n="11.2" title="Only draw what’s on screen">
                <P>
                    The hero canvas watches its section with an <Term k="io">IntersectionObserver</Term>. The moment the hero leaves the screen, its render loop switches to{' '}
                    <C>frameloop=&quot;never&quot;</C> — zero GPU work while you read the rest of the page. The menu canvas only exists after the menu’s first opening, and stops 1.2 s after it closes.
                    Every demo in this guide does the same.
                </P>
                <PauseBench />
                <Code file="src/modules/pages/LandoNorris/gl/HeroGL.tsx" highlight={['IntersectionObserver', 'active={active}']}>{`const [active, setActive] = useState(true);
useEffect(() => {
    const section = wrap.current?.closest('.ln-hero');
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '100px' });
    io.observe(section);
    return () => io.disconnect();
}, []);

<WebGLCanvas active={active}>   {/* → frameloop: active ? 'always' : 'never' */}`}</Code>
                <TryThis items={[<>Turn “pause off screen” off, scroll the canvas away and watch the counter keep climbing. On a phone, that’s battery and heat for nothing.</>]} />
            </Section>

            <Section id="cheap" n="11.3" title="Cheap properties, cheap loops">
                <Table
                    head={['Rule', 'How the source follows it']}
                    rows={[
                        ['Animate transform and opacity', 'block scaleX, yPercent rises, marquee translate3d, card image scale via a CSS variable'],
                        ['Masks and clips are fine', 'clip-path inset for photos, SVG mask for the “4”'],
                        ['No React re-renders per frame', 'heroState is a plain object; WebGL reads it in its own loop'],
                        ['Blurry things at low resolution', 'the trail canvas is 25% size — 16× fewer pixels to paint'],
                        ['Cap the pixel ratio', 'dpr [1, 2]: a 3× phone renders 4× the pixels, not 9×'],
                        ['One clock', 'Lenis, ScrollTrigger, the marquee and every tween on gsap.ticker'],
                    ]}
                />
                <Callout tone="warn" title="Could be better">
                    Two spots break the “transform only” rule: the hero card writes <C>width/height/left/top</C> every frame, and the header tweens its buttons’ <C>width/height</C>. Both are small
                    elements and measured fine — but on a heavier page, use <C>clip-path</C> or <C>scale</C> instead.
                </Callout>
            </Section>

            <Section id="reduced" n="11.4" title="Reduced motion, effect by effect">
                <P>Reduced motion doesn’t mean “no design”. The source keeps every piece of content and every state change, and removes only movement that travels, zooms or loops.</P>
                <ReducedSwitch />
                <Table
                    head={['Effect', 'Full motion', 'Reduced motion']}
                    rows={[
                        ['Smooth scroll', 'lerp 0.1 glide', 'native wheel (smoothWheel: false)'],
                        ['Preloader / route change', '“4” zoom', 'lime fades in / out'],
                        ['Hero pin', 'scrub 0.35 s', 'scrub: true (no lag)'],
                        ['Glass helmet loop', 'every 1 s', 'hidden'],
                        ['Marquees', 'drift', 'static'],
                        ['Block reveals', 'wipe', 'wipe — short, and it’s how text appears'],
                    ]}
                />
                <Code file="src/modules/pages/LandoNorris/sections/HeroSequence.tsx" lang="ts" highlight={['matchMedia', 'reduce ? true : 0.35']}>{`const mm = gsap.matchMedia();
mm.add({ reduce: '(prefers-reduced-motion: reduce)', full: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const reduce = Boolean(ctx.conditions?.reduce);
    const tl = gsap.timeline({ scrollTrigger: { /* … */ scrub: reduce ? true : 0.35 } });
    // gsap.matchMedia rebuilds this automatically if the setting changes while the page is open
});`}</Code>
                <KeyIdea>Reduced motion keeps the content and the states; it removes travel, zoom and loops.</KeyIdea>
            </Section>

            <Section id="checklist" n="11.5" title="Ship checklist">
                <P>The checks the clone went through before calling it done. Your ticks are saved in this browser.</P>
                <Checklist
                    id="lando-ship"
                    groups={[
                        {
                            title: 'Frame budget',
                            items: [
                                { id: 'f1', text: 'Scroll the whole page with a wheel; median frame ≈ 16.7 ms', where: 'Performance panel / trace' },
                                { id: 'f2', text: 'No long tasks while scrolling', where: 'Performance panel' },
                                { id: 'f3', text: 'Canvases capped at 2× pixel ratio', where: 'WebGLCanvas dpr' },
                                { id: 'f4', text: 'Canvases stop rendering off screen', where: 'IntersectionObserver' },
                            ],
                        },
                        {
                            title: 'Cleanup',
                            items: [
                                { id: 'c1', text: 'Navigate away and back 5×: ScrollTriggers return to 0', where: 'ScrollTrigger.getAll()' },
                                { id: 'c2', text: 'WebGL contexts don’t pile up', where: 'canvases in the DOM' },
                                { id: 'c3', text: 'Heap and listeners stay flat', where: 'Memory panel' },
                                { id: 'c4', text: 'ScrollTrigger.refresh() after fonts and route changes', where: 'LandoShell · PageTransition' },
                            ],
                        },
                        {
                            title: 'Reduced motion',
                            items: [
                                { id: 'r1', text: 'Turn on Reduce motion in the OS and reload', where: 'System settings' },
                                { id: 'r2', text: 'All text still appears', where: 'BlockReveal' },
                                { id: 'r3', text: 'No zoom, no loops, no drifting', where: 'Overlay · HeroGL · Marquee' },
                                { id: 'r4', text: 'Scroll goes exactly where the wheel says', where: 'SmoothScroll' },
                            ],
                        },
                        {
                            title: 'Accessibility',
                            items: [
                                { id: 'a1', text: 'Split and rolling text read once (aria-label on the word)', where: 'RollingText' },
                                { id: 'a2', text: 'Closed menu is aria-hidden and unclickable (autoAlpha 0)', where: 'Menu' },
                                { id: 'a3', text: 'Decorative canvases are aria-hidden', where: 'HeroGL · MenuGL' },
                                { id: 'a4', text: 'Cmd/ctrl-click on transition links opens a new tab', where: 'TransitionLink' },
                            ],
                        },
                    ]}
                />
                <Where files={[{ path: '.clone-analysis/DIFF_LOG.md', note: 'quality gates' }, { path: 'gl/HeroGL.tsx' }, { path: 'sections/HeroSequence.tsx' }, { path: 'shell/Overlay.tsx' }]} />
            </Section>
        </article>
    );
}
