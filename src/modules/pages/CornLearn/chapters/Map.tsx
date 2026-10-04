'use client';

import Pipeline from '../demos/Pipeline';
import StoryStrip from '../demos/StoryStrip';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, Where } from '../kit/ui';

export default function Map() {
    return (
        <>
            <ChapterHead
                n="00"
                kicker="The map"
                title="One scroll number runs nine scenes."
                lead={
                    <>
                        /corn feels like a film: each scroll carries you to the next shot, the picture is cut by a slanted wipe, titles draw themselves. Under the hood it is one canvas, one loop and
                        one number. This chapter is the whole machine on one page; every later chapter zooms into one box of it.
                    </>
                }
            />

            <Section id="see" n="01 · What you see" title="Nine stops, five worlds">
                <P>
                    The story has nine <strong>stops</strong>: the hero, six chapters in three sections (science, field trials, outcome) and two footer stops. They are drawn by five{' '}
                    <Term k="world">worlds</Term>: the hero cob, the science world (which holds three stops: the DNA, the network, the pot), the stalk in its field, the trial plots, and the kernel.
                    Moving to a new world uses a <em>slanted wipe</em>; staying in the same world uses a <em>blend</em>.
                </P>
                <Lens>
                    Think of an After Effects project with five pre-comps. The main comp cuts between them with a diagonal wipe, or cross-fades inside one pre-comp. The scroll bar is the playhead, but
                    it only ever rests on keyframes.
                </Lens>
                <StoryStrip />
                <KeyIdea>Nine stops, five worlds: a new world arrives with a wipe, a new stop in the same world with a blend.</KeyIdea>
            </Section>

            <Section id="system" n="02 · The machine" title="One number, one loop, one canvas">
                <P>
                    Every frame runs the same short chain. The wheel nudges a target; a spring moves the <Term k="step">step</Term> toward it; the timeline turns the step into the{' '}
                    <Term k="pos">story position</Term>; the engine decides which worlds are on screen; each world paints into its own <Term k="renderTarget">render target</Term>; one shader stitches
                    the pictures together onto the canvas.
                </P>
                <Pipeline />
                <Code file="engine/Engine.ts · tick() (trimmed)" highlight={['toStory', 'Math.floor(pos)', 'composite.render']}>
                    {`private tick(dt: number) {
    this.scroller.update(dt);                              // spring → step
    this.story = this.timeline.toStory(this.scroller.pos); // step → story position
    const pos = this.story.pos;

    // which worlds are on screen, and how they meet
    const i0 = Math.floor(pos);        // the chapter we are in
    const f = pos - i0;                // how far the move to the next one is
    const A = worldAt(i0);
    const B = f > 1e-4 ? worldAt(i0 + 1) : A;
    let mode = 0, p = 0;               // 0 = one world, 1 = wipe, 2 = blend
    if (A !== B) {
        mode = CHAPTERS[i0 + 1].enter === 'wipe' ? 1 : 2;
        p = mode === 1 ? smooth(0.12, 0.88, f) : smooth(0, 1, f);
    }
    this.renderWorld(A, targetA, pos, dt, dwell);
    if (mode) this.renderWorld(B, targetB, pos, dt, 0);
    this.composite.render(this.renderer, mode, p, this.blur, this.fade);
}`}
                </Code>
                <KeyIdea>Input → step → story position → worlds → pictures → screen. Every visual is a function of one number.</KeyIdea>
            </Section>

            <Section id="layers" n="03 · Two layers" title="HTML on top, one canvas underneath">
                <P>
                    Everything you can read, click or tab to is ordinary HTML rendered by React: the body copy, the CTA rings, the header, the menu, the footer links. Underneath sits one fixed canvas
                    that draws all the pictures, including the big titles. The titles are a trick worth its own chapter: a real heading sits in the HTML, invisible, and the canvas draws the glowing
                    version exactly on top of it.
                </P>
                <Code file="CornPage.tsx (trimmed)" lang="tsx" highlight={['corn-canvas', '<main']}>
                    {`<div className="corn-root">
    <div ref={host} className="corn-canvas" aria-hidden />   {/* the engine's canvas */}
    <main className="corn-ui">                                {/* everything readable */}
        <HeroCopy />
        <Chapters onOpen={openHotspot} />
        <Footer />
        <Hotspots onClose={closeHotspot} onPick={pick} onFact={fact} />
    </main>
    <SideNav onGo={go} />
    <Header onMenu={toggleMenu} onHome={() => go(0)} />
    <Menu onClose={closeMenu} onGo={go} />
    <Loader onDone={onLoaded} />
</div>`}
                </Code>
                <Lens>A Figma frame whose bottom layer is a live video render, with real text layers stacked above it. The text stays text: selectable, searchable, readable by a screen reader.</Lens>
                <KeyIdea>The canvas paints, the HTML speaks: text, links and focus always live in the DOM.</KeyIdea>
            </Section>

            <Section id="store" n="04 · Talking between them" title="React reads, the engine writes (rarely)">
                <P>
                    The two layers share a tiny store: which chapter is showing, whether the menu is open, which deep dive is active, how much has loaded. The engine writes to it; React components
                    read it with a hook. The important word is <em>rarely</em>: <C>setUi</C> only notifies React when a value actually changes, so React renders a handful of times per chapter, not 60
                    times a second.
                </P>
                <Code file="store.ts (trimmed)" highlight={['if (!changed) return']}>
                    {`export function setUi(patch: Partial<UiState>) {
    let changed = false;
    for (const k in patch) if (state[k] !== patch[k]) changed = true;
    if (!changed) return;            // same value → nobody re-renders
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
}

// in the engine, once a frame:
const chapter = Math.abs(pos - Math.round(pos)) < COPY_NEAR ? nearest : -1;
if (chapter !== ui.chapter) setUi({ chapter });   // changes a few times per scroll`}
                </Code>
                <Callout tone="warn">
                    The one value that does change every frame, the side-nav ring’s arc, skips React entirely: the engine finds the SVG circle once and writes its <C>stroke-dasharray</C> directly.
                    Per-frame values never go through state.
                </Callout>
                <KeyIdea>Per-frame numbers stay in the engine; the store only carries decisions (chapter, menu, mode).</KeyIdea>
            </Section>

            <Section id="words" n="05 · Vocabulary bridge" title="Design words and code words">
                <P>The rest of the guide uses these pairs. Hover any dotted word for a plain definition.</P>
                <Table
                    head={['You might say', 'The code says', 'What it is']}
                    mono={[1]}
                    rows={[
                        ['Stop / shot', 'CHAPTERS[i]', 'One entry of the story data: title, copy, world, how it enters'],
                        ['Scroll notch', 'step (Scroller.pos)', 'The scroll, counted in whole steps on a spring'],
                        ['Playhead', 'story.pos', '0 → 9 through the chapters; the fraction is the move in progress'],
                        ['Hold on a shot', 'dwell (ctx.dwell)', 'Scroll inside a chapter: 0 → 1 while the scene keeps moving'],
                        ['Pre-comp', 'World', 'One full-screen 3D scene with its camera and background'],
                        ['Rendered pre-comp', 'render target', 'The off-screen picture a world paints into'],
                        ['Transition', 'Composite (mode 1 / 2)', 'Slanted wipe between worlds, blend inside one'],
                        ['Keyframe pair', 'smooth(a, b, v)', 'A 0 → 1 window with easing, placed on the story position'],
                        ['Easing', 'damp / spring', 'How a value follows its target over time'],
                        ['Deep dive', 'hotspot', 'A mode opened by a CTA ring; scrolling pauses while it is open'],
                    ]}
                />
                <KeyIdea>Stop, step, story position, dwell, world: five words and you can read the whole engine.</KeyIdea>
                <Where
                    files={[
                        { path: 'CornPage.tsx', note: 'layers' },
                        { path: 'engine/Engine.ts', note: 'the loop' },
                        { path: 'store.ts', note: 'shared state' },
                        { path: 'data/story.ts', note: 'the stops' },
                        { path: 'NOTES.md', note: 'measurements' },
                    ]}
                />
            </Section>
        </>
    );
}
