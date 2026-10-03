'use client';

import Checklist from '../demos/Checklist';
import ReducedLab from '../demos/ReducedLab';
import RenderBudget from '../demos/RenderBudget';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Performance() {
    return (
        <>
            <ChapterHead
                n="11"
                kicker="Performance & reduced motion"
                title="Only what is on screen costs anything."
                lead={
                    <>
                        /kpr loads about 44 MB of paintings and sheets, keeps six 3D scenes and ~45 cards alive, and still holds 60 frames per second even with the processor slowed four times. It gets
                        there by doing very little on any given frame, and it respects people who don’t want motion at all.
                    </>
                }
            />

            <Section id="budget" n="11.1" title="Render what is visible, nothing else">
                <P>
                    Every card is one plane drawn by one shader, so the whole canvas stays under about 30 <Term k="drawCall">draw calls</Term>. The expensive part is the painted scenes: each is a full
                    3D render into a texture. The rule is simple: a scene renders only if a visible card is showing it, plus the next face while a card is nearly edge-on, so it’s ready before it comes
                    round. Most of the film needs one; handoffs need two.
                </P>
                <RenderBudget />
                <Code file="src/modules/pages/Kpr/gl/Stage.tsx (useFrame, trimmed)" highlight={['film.covered', 'rendered.has']}>
                    {`useFrame(() => {
    if (!built || film.covered) return;          // the footer covers the stage: skip everything
    choreograph(cast);
    for (const c of all) c.apply(film.time, film.dt, film.px, film.py, chroma);
    // paintings: only the ones on screen render, each once per frame
    rendered.clear();
    for (const c of all)
        for (const n of c.needs) {
            if (rendered.has(n.scene)) continue;
            rendered.add(n.scene);
            n.scene.render(gl, n.view);
        }
});`}
                </Code>
                <TryThis
                    items={[
                        'Park on 4.65 (the hero edge-on): two scenes render, the girl and the story.',
                        'Park on 12.6 (the ring): zero painted scenes. The 26 ring cards are flat images.',
                        'Scrub the handoffs (15.5–17.7): the outgoing and incoming tableaux overlap for a moment.',
                    ]}
                />
                <KeyIdea>Count what renders per frame, not what exists: six scenes, one or two on screen.</KeyIdea>
            </Section>

            <Section id="clock" n="11.2" title="One loop, no React on the hot path">
                <P>
                    React is great at changing what is on the page; it is not built to re-render 60 times a second. On /kpr, the frame loop never touches React state: scroll, pointer and speed live in
                    the plain <C>film</C> object, the canvas runs with <C>frameloop=&quot;never&quot;</C> and is advanced by the one clock, and DOM updates write styles directly. React only hears
                    about the HUD theme and the active nav item, a handful of times per visit.
                </P>
                <Table
                    mono={[0]}
                    head={['Technique', 'Where', 'Saves']}
                    rows={[
                        ['One ticker for everything', 'KprPage.tsx Clock', 'no competing animation loops'],
                        ["frameloop='never' + advance()", 'Stage.tsx', 'the render happens on the same beat as the clock'],
                        ['film object, not state', 'useScrollStore.ts', 'zero React commits while scrolling (checked)'],
                        ['Anchors measured on resize only', 'layout.ts', 'no layout reads in the loop'],
                        ['Write styles only when the value changes', 'Story.tsx counters', 'no needless style recalcs'],
                        ['Compile + upload behind the loader', 'Stage.tsx warm-up', 'no 100 ms hitch on first sight'],
                        ['KTX2 textures', 'loaders.ts', 'smaller downloads, much less video memory'],
                        ['Skip the frame under the footer', 'film.covered', 'zero GPU work at the end'],
                    ]}
                />
                <Callout tone="tip">
                    The first time a shader or texture is used, the browser compiles or uploads it, which can freeze a frame for 100 ms or more. The page renders every painting once while the loader
                    is still showing, so that cost is paid where nobody can see it.
                </Callout>
                <Lens>Like pre-rendering a heavy pre-comp before you hit play: the preview stutters the first time, so you render the cache while you’re still on the title card.</Lens>
                <KeyIdea>Keep React out of the frame loop and pay one-time costs behind the loader.</KeyIdea>
            </Section>

            <Section id="reduced" n="11.3" title="Reduced motion: a slideshow, not a film">
                <P>
                    People who turn on <Term k="reducedMotion">reduced motion</Term> still get the whole story. The page swaps the film for 11 still frames (the “rests”, one per beat) and cuts between
                    them with a 160 ms flash. No parallax, no scrubbed movement, no logo wipe: the symbol simply appears. Text reveals become short fades.
                </P>
                <ReducedLab />
                <Code file="src/modules/pages/Kpr/KprPage.tsx + scroll/timeline.ts" highlight={['nearestRest', 'RESTS =']}>
                    {`export const RESTS = [0.3, 3.1, 5.9, 7.9, 9.4, 10.95, 12.8, 15.1, 16.6, 18.1, 19.6];

if (film.reduced) {
    const r = nearestRest(Math.min(t, TOTAL));
    if (r !== film.view) {
        film.view = r;                                         // jump to the still
        gsap.fromTo(cut, { opacity: 1 }, { opacity: 0, duration: 0.16, ease: 'none' });
    }
} else film.view = Math.min(t, TOTAL + 1);
const pointerK = film.reduced ? 0 : 1;                        // no pointer parallax`}
                </Code>
                <TryThis items={['Drag slowly with reduced motion on: long stretches show the same still, then one quick cut.', 'Turn it off: the same scroll now moves everything continuously.']} />
                <KeyIdea>Reduced motion keeps the story and drops the movement: rest stills and soft cuts.</KeyIdea>
            </Section>

            <Section id="check" n="11.4" title="A checklist for your own film">
                <Checklist
                    id="perf"
                    groups={[
                        {
                            title: 'Frame loop',
                            items: [
                                { id: 'one-clock', text: 'One ticker drives scroll, DOM and WebGL', where: 'KprPage.tsx' },
                                { id: 'no-react', text: 'No React state written per frame', where: 'useScrollStore.ts' },
                                { id: 'no-alloc', text: 'No new objects inside the loop (reuse vectors)', where: 'PaintedScene.ts' },
                                { id: 'no-layout', text: 'No layout reads inside the loop', where: 'layout.ts' },
                            ],
                        },
                        {
                            title: 'GPU',
                            items: [
                                { id: 'visible', text: 'Only visible scenes render', where: 'Stage.tsx' },
                                { id: 'warm', text: 'Compile and upload behind the loader', where: 'Stage.tsx' },
                                { id: 'ktx', text: 'Compressed textures (KTX2)', where: 'loaders.ts' },
                                { id: 'dpr', text: 'Pixel ratio capped (1.75; scenes 1.5)', where: 'Stage.tsx, PaintedScene.ts' },
                            ],
                        },
                        {
                            title: 'Access',
                            items: [
                                { id: 'rm', text: 'Reduced motion: stills + fades, no parallax', where: 'KprPage.tsx' },
                                { id: 'sr', text: 'Animated text is aria-hidden with a plain copy', where: 'Text.tsx' },
                                { id: 'kbd', text: 'Menu, nav and hold button work with the keyboard', where: 'Menu.tsx, Tableaux.tsx' },
                                { id: 'sound', text: 'Sound only after a click, off by default', where: 'Loader.tsx, audio.ts' },
                            ],
                        },
                        {
                            title: 'Cleanup',
                            items: [
                                { id: 'dispose', text: 'Dispose scenes, textures and the KTX2 worker on leave', where: 'Stage.tsx' },
                                { id: 'reset', text: 'Reset the film object and UI store', where: 'KprPage.tsx' },
                                { id: 'covered', text: 'Stop rendering when covered', where: 'Footer.tsx' },
                            ],
                        },
                    ]}
                />
                <Callout tone="meta">
                    This guide follows the same rules: each chapter is a separate bundle, demos pause when scrolled off screen, and every WebGL demo disposes its renderer and releases its context when
                    you change chapter.
                </Callout>
                <Where
                    files={[
                        { path: 'Kpr/gl/Stage.tsx' },
                        { path: 'Kpr/gl/NotchedCard.ts', note: 'needs' },
                        { path: 'Kpr/KprPage.tsx', note: 'Clock, reduced motion' },
                        { path: 'Kpr/NOTES.md', note: 'measured: 60 fps, ≤31 draw calls' },
                    ]}
                />
            </Section>
        </>
    );
}
