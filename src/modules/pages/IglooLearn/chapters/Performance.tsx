'use client';

import Checklist from '../demos/Checklist';
import DrawCallBench from '../demos/DrawCallBench';
import RenderCounter from '../demos/RenderCounter';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

const BUDGET = [
    { label: 'input + scroll', w: 6, c: '#94dbff' },
    { label: 'timeline + dials', w: 5, c: '#d4c2ff' },
    { label: 'world updates', w: 14, c: '#aef0d8' },
    { label: 'particle sim (GPU)', w: 12, c: '#ffd08a' },
    { label: 'render world A (+B)', w: 26, c: '#94dbff' },
    { label: 'compositor pass', w: 9, c: '#d4c2ff' },
    { label: 'headroom', w: 28, c: 'rgba(196,212,235,0.12)' },
];

export default function PerformanceChapter() {
    return (
        <article>
            <ChapterHead
                n="11"
                kicker="Performance"
                title="Beautiful only counts at 60 frames a second."
                lead={
                    <>
                        A stutter destroys the illusion faster than any design flaw. Igloo runs four 3D worlds, 65,536 particles and a full-screen effect pass, and still stays smooth — because a dozen
                        small, boring decisions add up. Most of them are design decisions as much as code ones.
                    </>
                }
            />

            <Section id="budget" n="11.1" title="The 16.7 millisecond budget">
                <P>
                    At 60fps the browser has <strong>16.7ms</strong> per frame for everything: reading input, running the timeline, updating every world, simulating particles, rendering, and
                    compositing. Miss it and a frame is dropped — you feel it as a hitch.
                </P>
                <div className="max-w-[860px]">
                    <div className="flex h-10 overflow-hidden rounded-lg border border-[var(--il-line-2)]">
                        {BUDGET.map((b) => (
                            <div key={b.label} className="h-full border-r border-[#0a0d13]/60 last:border-r-0" style={{ width: `${b.w}%`, background: b.c }} title={b.label} />
                        ))}
                    </div>
                    <div className="il-mono mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-[var(--il-dim)]">
                        {BUDGET.map((b) => (
                            <span key={b.label} className="flex items-center gap-1.5">
                                <span className="size-2 rounded-sm" style={{ background: b.c }} />
                                {b.label}
                            </span>
                        ))}
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--il-faint)]">
                        Illustrative proportions — the point is that everything shares one 16.7ms slot, and headroom is what survives a slow laptop.
                    </p>
                </div>
                <Lens>Treat milliseconds like pixels in a tight layout. Every effect has a cost; the design question is which effects earn their space in the frame.</Lens>
            </Section>

            <Section id="react" n="11.2" title="Keep React off the hot path">
                <P>
                    React is great at building UI, and slow at doing it 60 times a second. Igloo splits state in two: a plain object (<C>motion</C>) for anything that changes every frame, and a React
                    store (<C>useIglooUI</C>) for things that change a few times per visit — the current section, which crystal is open, whether sound is on.
                </P>
                <RenderCounter />
                <Code file="store.ts">{`/**
 * Mutable, frame-rate state. Written by the GSAP master timeline (scroll) and
 * by time-based tweens, read every frame by the WebGL worlds. It is a plain
 * object on purpose: no React renders happen while scrolling.
 */
export const motion = { scene: 0, explode: 0, heroCam: 0, crystals: -0.8, … };

// coarse UI state — React re-renders only when these change
export const useIglooUI = create((set) => ({ section: 0, detail: -1, sound: false, … }));`}</Code>
                <KeyIdea>Per-frame values live in plain objects and are written straight to three.js or element.style. React state is for things that change a few times per visit.</KeyIdea>
            </Section>

            <Section id="drawcalls" n="11.3" title="Draw calls and pixels: the two big costs">
                <P>
                    Two numbers dominate WebGL cost. <Term k="drawcall">Draw calls</Term> (how many separate objects you ask the GPU to draw) cost CPU time. <strong>Pixels</strong> (how many you
                    shade, times how complex each shader is) cost GPU time. Instancing attacks the first; capping the <Term k="dpr">pixel ratio</Term> attacks the second.
                </P>
                <DrawCallBench />
                <TryThis
                    items={[
                        'At 5,000 cubes, flip between the modes: 1 draw call vs 5,000 — and watch CPU time jump.',
                        'Set pixel ratio 2 on a Retina screen: 4× the pixels of ratio 1. Igloo caps it at 1.5.',
                    ]}
                />
                <Code file="canvas/Experience.tsx">{`<Canvas
    dpr={[1, 1.5]}                                    // never render at full 2–3× Retina
    gl={{ antialias: false,                           // AA happens in the MSAA render targets instead
          powerPreference: 'high-performance',        // ask for the discrete GPU
          stencil: false }}                           // one less buffer
/>`}</Code>
            </Section>

            <Section id="loop" n="11.4" title="Rules for the frame loop">
                <Table
                    head={['Rule', 'Why', 'In Igloo']}
                    rows={[
                        ['Skip what isn’t visible', 'Hidden worlds cost nothing', 'if (worldWeight(i) <= 0) return; at the top of every useFrame'],
                        ['Never allocate in the loop', 'new Vector3() 60×/s → garbage-collector pauses', 'const tmp = useMemo(() => ({ p: new Vector3(), q: … }))'],
                        ['Clamp the time step', 'A background tab returns with a 3-second dt and explodes the physics', 'dt = Math.min(delta, 1/30)'],
                        ['Split stiff physics into sub-steps', 'Stiff springs blow up with large steps', 'sim.step(dt / 2); sim.step(dt / 2)'],
                        ['Move per-item work to the GPU', 'Shaders run in parallel', 'snow in a vertex shader, particles in GPGPU'],
                        ['One clock', 'No duplicated rAF loops, no drift', 'gsap.ticker drives Lenis, ScrollTrigger, pointer smoothing'],
                    ]}
                />
                <Code file="canvas/IglooWorld.tsx" highlight={['worldWeight', 'tmp']}>{`const tmp = useMemo(() => ({ m: new Matrix4(), p: new Vector3(), q: new Quaternion(), … }), []);

useFrame((state, delta) => {
    if (worldWeight(0) <= 0 && motion.intro >= 1) return;   // off screen → zero work
    // … reuse tmp.p / tmp.q / tmp.m for all 150 bricks, never "new" …
});`}</Code>
            </Section>

            <Section id="assets" n="11.5" title="The fastest asset is the one you don’t download">
                <P>
                    Igloo ships <strong>zero</strong> images, 3D models, textures or audio files. The igloo, terrain, crystals, rings and particle shapes are generated from code at load. Logos inside
                    the crystals are drawn on a canvas. Sound is synthesised. The whole scene is a few kilobytes of JavaScript plus the libraries.
                </P>
                <Callout>
                    Procedural isn’t always right — a detailed character still needs a model. But for abstract, geometric, atmospheric worlds, code is smaller, sharper at every resolution, and
                    infinitely tweakable (which is why the Tweak panel can exist at all).
                </Callout>
            </Section>

            <Section id="checklist" n="11.6" title="Checklist: shipping a page like this">
                <P>Tick these off on your own projects. Your ticks are remembered in this browser.</P>
                <Checklist
                    id="perf"
                    groups={[
                        {
                            title: 'Rendering',
                            items: [
                                { id: 'dpr', text: 'Cap pixel ratio at 1.5', where: 'Experience.tsx → dpr={[1, 1.5]}' },
                                { id: 'inst', text: 'Instance anything repeated', where: 'IglooWorld.tsx → instancedMesh' },
                                { id: 'skip', text: 'Skip hidden worlds entirely', where: 'store.ts → worldWeight()' },
                                { id: 'post', text: 'One combined post pass, not a chain', where: 'Compositor.tsx' },
                                { id: 'aa', text: 'MSAA on targets, antialias off on canvas', where: 'Experience.tsx + Compositor.tsx' },
                            ],
                        },
                        {
                            title: 'Frame loop',
                            items: [
                                { id: 'clock', text: 'One ticker drives scroll, timeline and 3D', where: 'IglooPage.tsx' },
                                { id: 'noalloc', text: 'No allocations per frame', where: 'useMemo temp vectors' },
                                { id: 'noreact', text: 'No React state per frame', where: 'store.ts → motion' },
                                { id: 'dt', text: 'Clamp dt; sub-step stiff physics', where: 'ParticleWorld.tsx' },
                                { id: 'gpu', text: 'Per-item motion on the GPU', where: 'Snow.tsx, colonySim.ts' },
                            ],
                        },
                        {
                            title: 'Loading',
                            items: [
                                { id: 'ssr', text: 'Load the WebGL page client-only', where: 'dynamic(() => import(…), { ssr: false })' },
                                { id: 'proc', text: 'Prefer procedural over downloaded assets', where: 'no /public files for the scene' },
                                { id: 'loader', text: 'Hide shader compilation behind a loader', where: 'Loader.tsx waits for ready' },
                                { id: 'mobile', text: 'Scale counts down on small screens', where: '256² → 176² particles' },
                            ],
                        },
                        {
                            title: 'Respect',
                            items: [
                                { id: 'rm', text: 'Honour prefers-reduced-motion', where: 'igloo.scss hides ghost glyphs' },
                                { id: 'sound', text: 'Sound off by default, user-toggled', where: 'Chrome.tsx → Sound: Off' },
                                { id: 'dispose', text: 'Dispose geometries, materials, targets', where: 'every useEffect cleanup' },
                                { id: 'restore', text: 'Reset shared state on mount', where: 'store.ts → resetMotion()' },
                            ],
                        },
                    ]}
                />
                <Where files={[{ path: 'canvas/Experience.tsx' }, { path: 'store.ts' }, { path: 'canvas/Compositor.tsx' }, { path: 'canvas/ParticleWorld.tsx', note: 'mobile count' }]} />
            </Section>
        </article>
    );
}
