'use client';

import BudgetChart from '../demos/BudgetChart';
import Checklist from '../demos/Checklist';
import DrawCallBench from '../demos/DrawCallBench';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Performance() {
    return (
        <>
            <ChapterHead
                n="11"
                kicker="Performance"
                title="Five 3D scenes, sixty frames a second."
                lead={
                    <>
                        Everything in the last ten chapters runs in one browser tab at a steady 60 fps on a laptop. Not because any single trick is clever, but because the page never pays for
                        something you can’t see, and pays for the rest before you arrive.
                    </>
                }
            />

            <Section id="budget" n="01 · The budget" title="16.7 milliseconds, measured">
                <P>
                    At 60 frames a second each frame has a <Term k="budget">16.7 ms budget</Term> for everything. The numbers below were measured on the real /corn page. Flicking through every stop
                    with the pointer moving, frames came out at 16.7 ms (median) and 16.8 ms (99th percentile), with none over 33 ms. The heaviest stop uses 1.1 ms of JavaScript.
                </P>
                <BudgetChart />
                <Table
                    head={['Measure', 'Value', 'What it means']}
                    mono={[1]}
                    rows={[
                        ['Frame time p50 / p99', '16.7 / 16.8 ms', 'Locked to the screen’s 60 Hz, even at the 99th percentile'],
                        ['Frames over 33 ms', '0', 'Not a single visibly dropped frame'],
                        ['Draw calls per frame', '11–34', 'Low: big batches instead of many small objects'],
                        ['Engine CPU per frame', '0.3–1.1 ms', 'JavaScript is a small slice; the GPU does the work'],
                        ['JS heap', '123 MB', 'Mostly decoded textures and geometry'],
                    ]}
                />
                <KeyIdea>Measure, don’t guess: 16.7 ms frames, 11–34 draw calls, at most 1.1 ms of JavaScript per frame.</KeyIdea>
            </Section>

            <Section id="calls" n="02 · Batching" title="Fewer, bigger draw calls">
                <P>
                    Each <Term k="drawCall">draw call</Term> costs the CPU a fixed amount, whatever it draws. So the page batches relentlessly: the 6,000 DNA beads are one object, the 9,600 plot
                    slices one <Term k="instancing">instanced</Term> mesh, every title three objects (links, letters, nodes). The bench shows the difference with the same dots and the same shader.
                </P>
                <DrawCallBench />
                <TryThis
                    items={[
                        <>3,000 dots as one object, then as one object per dot: the picture is the same, the CPU time jumps by an order of magnitude.</>,
                        <>Find the count where “one object per dot” starts to cost several milliseconds. The page would blow its budget long before 6,000 beads.</>,
                    ]}
                />
                <KeyIdea>Thousands of things, one draw call: points in one object, repeated shapes instanced.</KeyIdea>
            </Section>

            <Section id="unseen" n="03 · The unseen" title="Only what’s on screen costs anything">
                <Table
                    head={['Trick', 'Where', 'Saving']}
                    rows={[
                        ['Only the one or two worlds on screen render', 'Engine.tick', 'Three of five worlds idle at any time'],
                        ['Transitions render at 72 %', 'Composite aMove / bMove', '≈ 48 % fewer pixels while two worlds draw'],
                        ['Pixel ratio capped at 1.5', 'Engine MAX_DPR', '44 % fewer pixels than a Retina DPR 2'],
                        ['2× MSAA instead of 4×', 'Composite targets', '4× was fill-bound with two worlds'],
                        ['Blurred field at half resolution', 'StalkWorld.useSet', 'A quarter of the pixels for the depth of field'],
                        ['Plots at 0.75 ×', 'PlotsWorld.render', 'The 5–7 layers of overdraw get cheaper'],
                        ['Menu blur only while open', 'Composite.render', 'Zero cost the rest of the time'],
                        ['Invisible sprites skipped', 'polyMaterial vertex shader', 'Big soft bokeh never reach the pixel stage'],
                    ]}
                />
                <Code file="engine/worlds/StalkWorld.ts · useSet() (trimmed)" highlight={['* 0.5']}>
                    {`// Everything here ends up blurred: half resolution is plenty.
// One buffer set per target size (full and transition targets differ): no reallocation mid-wipe.
const W = Math.max(1, Math.round(target.width * 0.5));
const H = Math.max(1, Math.round(target.height * 0.5));
let set = this.sets.get(\`\${W}x\${H}\`);`}
                </Code>
                <Lens>Rendering proxies for the parts of a comp that are blurred or moving fast anyway, and full resolution only for the frames the viewer will actually study.</Lens>
                <KeyIdea>Skip what’s off screen, shrink what moves or blurs, and never allocate in the middle of a transition.</KeyIdea>
            </Section>

            <Section id="upfront" n="04 · Up front" title="Pay behind the loader">
                <P>
                    The first time a shader is used, the browser compiles it, which can freeze a frame for tens of milliseconds. The page makes all of that happen while the loader is still counting:
                    it uploads every texture, compiles every world’s materials and renders each world once into an off-screen target, so the first wipe into the stalk field is as smooth as the
                    hundredth. The textures themselves were decoded from GPU-compressed KTX files to WebP for this clone.
                </P>
                <Code file="engine/assets.ts + Engine.init() (trimmed)" highlight={['initTexture', 'renderer.compile']}>
                    {`// upload now, so the first frame of each world does not stall
Object.values(all.tex).forEach((t) => renderer.initTexture(t));

// compile every world once behind the loader so the first wipe does not hitch
for (const w of this.worlds.values()) {
    this.renderer.compile(w.scene, w.camera);
    this.renderer.compile(w.fx, w.fxCamera);
}`}
                </Code>
                <KeyIdea>Upload textures, compile shaders and render every world once while the loader runs: no first-time hitches later.</KeyIdea>
            </Section>

            <Section id="react" n="05 · React" title="Keep React off the hot path">
                <P>
                    React is great at deciding what HTML exists; it is the wrong tool for something that changes every frame. On /corn, React renders when the chapter, the menu or a deep dive changes.
                    Everything per frame lives in the engine’s own fields, and the one DOM value that moves every frame (the nav ring’s arc) is written directly with <C>setAttribute</C>.
                </P>
                <Checklist />
                <Callout tone="meta">
                    The guide follows the same rules: one GSAP ticker drives the smooth scroll and every demo, demos pause when they leave the screen, each chapter is its own lazy bundle, and every
                    demo frees its GPU memory (and its WebGL context) when you switch chapters.
                </Callout>
                <KeyIdea>React for decisions, the engine for frames: per-frame values never go through state.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/Engine.ts', note: 'loop, warm-up, nav arc' },
                        { path: 'engine/Composite.ts', note: 'targets, 72 %' },
                        { path: 'engine/assets.ts', note: 'loading, initTexture' },
                        { path: 'store.ts', note: 'rare writes' },
                        { path: '.clone-analysis/tools/corn_perf.mjs', note: 'the frame-time script' },
                    ]}
                />
            </Section>
        </>
    );
}
