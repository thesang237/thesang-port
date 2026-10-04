'use client';

import Quiz from '../demos/Quiz';
import StoryPlanner from '../demos/StoryPlanner';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, P, Section, Steps, Table, Where } from '../kit/ui';

export default function Build() {
    return (
        <>
            <ChapterHead
                n="12"
                kicker="Build your own"
                title="From a list of chapters to a living story."
                lead={
                    <>
                        You’ve seen every piece. This chapter puts them back together as a recipe you can follow for your own project: plan the story as data, give each world a clock, stitch the
                        worlds with a shader, then lay text and interaction on top.
                    </>
                }
            />

            <Section id="recipe" n="01 · The recipe" title="Eight steps, in this order">
                <Steps
                    items={[
                        <>
                            <strong>Write the story as data.</strong> One entry per stop: id, world, title lines, body, <C>enter: &apos;wipe&apos; | &apos;blend&apos;</C> and <C>dwell</C>. Everything
                            else reads from it (chapter 00).
                        </>,
                        <>
                            <strong>Build the step scroller.</strong> Catch the wheel, move a target in steps, follow it with a critically damped spring, settle with a 10 % commit (chapter 01).
                        </>,
                        <>
                            <strong>Turn steps into the story position.</strong> Dwell steps hold the chapter, the move step advances it; worlds get <C>local</C> and <C>dwell</C> (chapter 02).
                        </>,
                        <>
                            <strong>Make each world paint off screen.</strong> One render target per world, a composite shader for the wipe, grade and grain at the end (chapter 03).
                        </>,
                        <>
                            <strong>Give every world a camera rig.</strong> Orbit + lens shift from the pointer, scroll moves on top; light with bakes or matcaps, not real-time lights (chapter 06).
                        </>,
                        <>
                            <strong>Fill the worlds procedurally.</strong> Bokeh clouds, splines, networks, springs: a few rules each, seeded so the composition is designed (chapters 07–10).
                        </>,
                        <>
                            <strong>Lay the text on top.</strong> Transparent HTML headings as anchors, MSDF titles drawn on them, reveal and pointer field in the shader (chapters 04–05).
                        </>,
                        <>
                            <strong>Measure and trim.</strong> Only on-screen worlds, smaller transitions, capped pixel ratio, everything compiled behind the loader (chapter 11).
                        </>,
                    ]}
                />
                <KeyIdea>Data first, then the clock, then the pictures, then the words: each layer only reads from the one before it.</KeyIdea>
            </Section>

            <Section id="planner" n="02 · Plan it" title="Your chapters, as a timeline and as code">
                <P>
                    Start your own story here. The planner uses the same rule as the page’s Timeline (each chapter owns its dwell steps plus one move step), warns you about the classic mistakes (a
                    blend between two worlds, a title the caps face can’t draw) and writes the config you’d paste into <C>data/story.ts</C>.
                </P>
                <StoryPlanner />
                <KeyIdea>The chapter list decides everything: steps, transitions, the nav and the copy timing all fall out of it.</KeyIdea>
            </Section>

            <Section id="world" n="03 · A new world" title="The smallest world that works">
                <P>
                    A world only needs a scene, a camera and an <C>update(ctx)</C> that reads <C>local</C>, <C>dwell</C> and the pointer. The engine handles its render target, the wipe, the titles and
                    the bokeh layer.
                </P>
                <Code file="engine/worlds/StudioWorld.ts (a template, in the style of the page)" highlight={['extends World', 'this.orbit']}>
                    {`export class StudioWorld extends World {
    readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    private subject: THREE.Mesh;
    private yaw = 0;
    private pitch = 0;

    constructor(a: Assets) {
        super();
        this.scene.add(backdrop(myCardFrag, {}));                     // background card
        this.subject = new THREE.Mesh(a.models.product.scene.children[0].geometry, kernelMaterial(a));
        this.scene.add(this.subject);
        this.fx.add(particleArea({ color: '#55ffc2', o: 0.5, particleSizeMin: 6, particleSizeMax: 90 }, this.dof));
    }

    update(ctx: FrameCtx) {
        const { dt, ptr, local, dwell, time } = ctx;
        this.updateFx(ctx);                                           // bokeh camera + focus
        const s = local + 0.4 * dwell;                                // never still while scrolling
        this.subject.rotation.y = time * 0.2 + s * 1.2;
        this.yaw = damp(this.yaw, ptr.x * TILT.yaw + s * 0.3, 4, dt);
        this.pitch = damp(this.pitch, ptr.y * TILT.pitch, 4, dt);
        this.lens.set(1200, 530);                                     // where the subject sits on the layout
        this.orbit(new THREE.Vector3(), 10 - dwell, this.yaw, this.pitch);
    }
}`}
                </Code>
                <Callout tone="tip" title="Register it">
                    Add it to the engine’s world map (<C>this.worlds.set(&apos;studio&apos;, new StudioWorld(a))</C>) and give some chapters <C>world: &apos;studio&apos;</C>. The first chapter in a
                    new world should enter with a wipe; the next ones in the same world with a blend.
                </Callout>
                <KeyIdea>A world = scene + camera + update(ctx); the engine does the rest.</KeyIdea>
            </Section>

            <Section id="briefs" n="04 · Practice" title="Three briefs to try">
                <Grid cols={3}>
                    <Card kicker="Brief 1 · 1 world" title="A product turntable story">
                        Four chapters, one world, all blends. A matcap product orbits with a lens shift; each chapter’s dwell turns it to a new feature. Titles trace in on transparent anchors.
                    </Card>
                    <Card kicker="Brief 2 · 3 worlds" title="Seed to plate">
                        Three worlds joined by wipes (slope and push of your choice), a bokeh preset per world, a spring field in the middle one. Keep every frame under 30 draw calls.
                    </Card>
                    <Card kicker="Brief 3 · 1 effect" title="Your logo, scattered" tint>
                        Only chapter 04–05: build an MSDF of your logo, trace it in, and make the pointer field and the press-and-hold disc work on it. No 3D at all.
                    </Card>
                </Grid>
                <KeyIdea>Start small: one world with blends, then add a second world and your first wipe.</KeyIdea>
            </Section>

            <Section id="quiz" n="05 · Final quiz" title="Ten questions from the whole guide">
                <P>Ten random cards from every chapter. Answer before you reveal, then grade yourself honestly; the misses are listed with their chapter at the end.</P>
                <Quiz />
            </Section>

            <Section id="next" n="06 · Further" title="Where to go next">
                <Table
                    head={['Topic', 'Look up', 'Why']}
                    rows={[
                        ['MSDF fonts', 'msdfgen / msdf-atlas-gen (Viktor Chlumský)', 'Generate atlases and metrics for your own faces'],
                        ['Distance functions', 'Inigo Quilez, 2D distance functions', 'Polygons, rings and rounded shapes in a fragment shader'],
                        ['Fixed time steps', '“Fix Your Timestep!” (Glenn Fiedler)', 'The accumulator pattern used by every simulation here'],
                        ['Springs', 'Critically damped springs (game-dev write-ups)', 'Why ω and 2ω give a landing with no bounce'],
                        ['three.js', 'Render targets, InstancedMesh, ShaderMaterial docs', 'The three building blocks of this page'],
                    ]}
                />
                <Where
                    files={[
                        { path: 'data/story.ts', note: 'the chapter list' },
                        { path: 'engine/Engine.ts', note: 'registering worlds' },
                        { path: 'engine/worlds/World.ts', note: 'the base class' },
                        { path: 'NOTES.md', note: 'how the clone was built' },
                    ]}
                />
            </Section>
        </>
    );
}
