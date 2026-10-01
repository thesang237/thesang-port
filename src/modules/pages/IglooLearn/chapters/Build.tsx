'use client';

import type { ReactNode } from 'react';

import Quiz from '../demos/Quiz';
import StoryboardBuilder from '../demos/StoryboardBuilder';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, P, Section } from '../kit/ui';

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
    return (
        <details className="group rounded-2xl border border-[var(--il-line)] bg-[var(--il-panel)] open:border-[var(--il-line-2)]">
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="il-mono flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--il-line-2)] text-[11px] text-[var(--il-ice)]">{n}</span>
                <span className="flex-1 text-[16px] font-semibold tracking-[-0.01em]">{title}</span>
                <span className="il-mono text-[12px] text-[var(--il-faint)] transition-transform duration-300 group-open:rotate-45">+</span>
            </summary>
            <div className="space-y-4 border-t border-[var(--il-line)] px-5 py-5">{children}</div>
        </details>
    );
}

export default function BuildChapter() {
    return (
        <article>
            <ChapterHead
                n="12"
                kicker="Build your own"
                title="From storyboard to shipped page."
                lead={
                    <>
                        You now know every technique on the Igloo page. This chapter puts them in order: a recipe you can follow, a tool that turns your storyboard into timeline code, practice briefs,
                        and a final quiz.
                    </>
                }
            />

            <Section id="recipe" n="12.1" title="The recipe, in ten steps">
                <P>Open each step for the minimum code. The order matters: design the film first, then the plumbing, then the worlds, then the polish.</P>
                <div className="max-w-[900px] space-y-2">
                    <Step n={1} title="Storyboard in screens of scroll">
                        <P>
                            Before any code: list your acts, how many screens each lasts, and what moves in each. Name every moving thing as a <strong>dial</strong> (0 → 1). Use the tool in 12.2 — it
                            writes the timeline for you.
                        </P>
                    </Step>
                    <Step n={2} title="Smooth scroll + one clock">
                        <Code file="Page.tsx">{`gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin);

useLayoutEffect(() => {
    const update = (time) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
}, []);

<ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.85 }}>`}</Code>
                    </Step>
                    <Step n={3} title="A dials object (not React state)">
                        <Code file="store.ts">{`export const motion = { scene: 0, heroCam: 0, explode: 0, pointer: { x: 0, y: 0 }, pointerSmooth: { x: 0, y: 0 } };`}</Code>
                    </Step>
                    <Step n={4} title="The master timeline + invisible track">
                        <Code file="Scroller.tsx">{`useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.to(motion, { heroCam: 1, duration: 1.7, ease: 'power1.inOut' }, 0.2)
      .to(motion, { scene: 1, duration: 1, ease: 'power1.inOut' }, 1.3)
      .set({}, {}, TOTAL);
    ScrollTrigger.create({ trigger: track.current, start: 'top top', end: 'bottom bottom', animation: tl, scrub: true });
});
return <div ref={track} style={{ height: \`\${(TOTAL + 1) * 100}vh\` }} />;`}</Code>
                    </Step>
                    <Step n={5} title="A fixed canvas with one world per act">
                        <Code file="Experience.tsx">{`<Canvas className="!fixed inset-0" dpr={[1, 1.5]} gl={{ antialias: false }}>
    <WorldA /> <WorldB />        {/* each: useWorld(index) → own scene + camera, createPortal */}
    <Compositor />               {/* renders visible worlds to targets, blends in one pass */}
</Canvas>`}</Code>
                    </Step>
                    <Step n={6} title="Worlds read dials every frame">
                        <Code file="WorldA.tsx">{`useFrame((state, delta) => {
    if (worldWeight(0) <= 0) return;                        // hidden → skip
    const rise = easeInOutCubic(motion.heroCam);
    camera.position.copy(HERO).lerp(RISE, rise);            // camera rail
    camera.position.x += motion.pointerSmooth.x * 0.55;     // parallax
    camera.lookAt(target);
    // … objects read motion.explode with per-item delay windows …
});`}</Code>
                    </Step>
                    <Step n={7} title="Compositor: blend + post effects">
                        <P>
                            Copy the pattern from chapter 08: two render targets, one full-screen shader with <C>mix(A, B, noiseMask)</C>, effects multiplied by <C>sin(t·π)</C>, then vignette and
                            grain.
                        </P>
                    </Step>
                    <Step n={8} title="Text layer on the same timeline">
                        <Code file="Hero.tsx / Caption.tsx">{`tl.to('.hero', { autoAlpha: 0, y: -30, filter: 'blur(10px)', duration: 0.7 }, 0.15);   // scrubbed

// time-based reveals, remounted per section
const split = SplitText.create(body, { type: 'lines,words', mask: 'lines' });
gsap.from(split.words, { yPercent: 120, rotate: 4, duration: 1, ease: 'expo.out', stagger: 0.025 });`}</Code>
                    </Step>
                    <Step n={9} title="Interaction: pointer, picking, HUD">
                        <P>
                            Normalise the pointer to −1..1, smooth it with <C>damp(…, 3.5, dt)</C>, raycast for hovers, <C>project()</C> 3D anchors for HTML labels, guard everything with “is this
                            world visible?”.
                        </P>
                    </Step>
                    <Step n={10} title="Polish and performance pass">
                        <P>Grain, vignette, fog colour = background colour, one hover ease everywhere, sound off by default, reduced-motion fallback — then run the checklist in chapter 11.</P>
                    </Step>
                </div>
                <KeyIdea>Storyboard → dials → timeline → worlds read dials → compositor → text → interaction → polish.</KeyIdea>
            </Section>

            <Section id="storyboard" n="12.2" title="Storyboard → timeline tool">
                <P>
                    Plan your page as a list of moves with a start and a length in screens. The tool draws the tracks and writes the timeline, the dials object and the scroll track height. It starts
                    with Igloo’s first act as an example.
                </P>
                <StoryboardBuilder />
            </Section>

            <Section id="structure" n="12.3" title="A starter file structure">
                <Code file="your-page/" lang="bash">{`YourPage.tsx          # ReactLenis root, ticker, <Experience/>, <Scroller/>, text layers
store.ts              # motion dials + small UI store
data.ts               # copy + TOTAL (screens)
canvas/
  Experience.tsx      # fixed <Canvas>, env light, worlds + compositor
  useWorld.ts         # scene + camera per act, registered by index
  WorldA.tsx …        # one per act — reads motion.* in useFrame
  Compositor.tsx      # blend + post FX in one shader
ui/
  Hero.tsx, Caption.tsx, Loader.tsx
utils/
  math.ts             # clamp, lerp, damp, smoothstep, rng, noise
  glsl.ts             # shared shader snippets`}</Code>
            </Section>

            <Section id="briefs" n="12.4" title="Practice briefs">
                <P>Pick one and build it with the recipe. Each uses a subset of the techniques, so you can grow into the full thing.</P>
                <Grid cols={3}>
                    <Card kicker="Brief 1 · text only" title="Manifesto scroll">
                        A 5-screen page, no 3D. Pinned section, words light up with scroll (2.5), captions decode per act (4.5), a rail that fills. Techniques: 01, 02, 03, 04.
                    </Card>
                    <Card kicker="Brief 2 · one world" title="Product reveal" accent="var(--il-lilac)">
                        One 3D object on a camera rail. Scroll explodes it into parts with per-part delays, then reassembles. Hover lifts parts. Techniques: 03, 05, 06, 10.
                    </Card>
                    <Card kicker="Brief 3 · full stack" title="Two-world story" accent="var(--il-mint)">
                        Two scenes with different moods joined by a fog dissolve, a particle logo you can sweep, and sound ticks. Techniques: everything.
                    </Card>
                </Grid>
                <Callout>
                    Start from the demos in this guide — they are self-contained vanilla three.js and GSAP, in <C>src/modules/pages/IglooLearn/demos</C>. Copy one, change the numbers, and you already
                    have a working prototype.
                </Callout>
            </Section>

            <Section id="quiz" n="12.5" title="Final quiz">
                <Quiz />
            </Section>

            <Section id="resources" n="12.6" title="Where to go next">
                <div className="grid max-w-[900px] gap-2 sm:grid-cols-2">
                    {[
                        ['GSAP ScrollTrigger docs', 'https://gsap.com/docs/v3/Plugins/ScrollTrigger/', 'scrub, pin, start/end, onUpdate'],
                        ['GSAP SplitText docs', 'https://gsap.com/docs/v3/Plugins/SplitText/', 'masks, autoSplit, accessibility'],
                        ['Lenis', 'https://github.com/darkroomengineering/lenis', 'smooth scroll options and recipes'],
                        ['three.js manual', 'https://threejs.org/manual/', 'scenes, cameras, materials, render targets'],
                        ['The Book of Shaders', 'https://thebookofshaders.com/', 'the gentlest shader course there is'],
                        ['Inigo Quilez — palettes', 'https://iquilezles.org/articles/palettes/', 'the cosine palette from chapter 07'],
                        ['React Three Fiber docs', 'https://r3f.docs.pmnd.rs/', 'useFrame, createPortal, the R3F way'],
                        ['Codrops', 'https://tympanus.net/codrops/', 'creative-coding tutorials in this exact style'],
                    ].map(([name, href, note]) => (
                        <a
                            key={href}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="group rounded-xl border border-[var(--il-line)] p-4 transition-colors hover:border-[var(--il-line-2)] hover:bg-white/[0.02]"
                        >
                            <div className="flex items-center justify-between text-[14.5px] font-semibold">
                                {name}
                                <span className="text-[var(--il-faint)] transition-transform group-hover:translate-x-1">↗</span>
                            </div>
                            <div className="text-[12.5px] text-[var(--il-dim)]">{note}</div>
                        </a>
                    ))}
                </div>
            </Section>
        </article>
    );
}
