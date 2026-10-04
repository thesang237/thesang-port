'use client';

import Compositor from '../demos/Compositor';
import LayerStack from '../demos/LayerStack';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Worlds() {
    return (
        <>
            <ChapterHead
                n="03"
                kicker="Worlds & wipe"
                title="Each scene paints off screen. One shader stitches them together."
                lead={
                    <>
                        The slanted wipe can’t be done by moving 3D objects around: two different scenes, with two different cameras, have to share one frame. So every world paints into its own
                        invisible picture first, and a final shader cuts between the two pictures however it likes.
                    </>
                }
            />

            <Section id="targets" n="01 · Off screen" title="A world paints into its own picture">
                <P>
                    A <Term k="renderTarget">render target</Term> is an image the GPU draws into instead of the screen. Each world draws three passes into its target: the 3D scene, then the bokeh
                    layer seen through the reference camera, then the titles in screen pixels. Between passes only the depth is cleared, so each layer stacks over the one before it.
                </P>
                <LayerStack />
                <Code file="engine/Engine.ts · renderWorld() (trimmed)" highlight={['setRenderTarget(target)', 'clearDepth']}>
                    {`private renderWorld(id, target, pos, dt, dwell) {
    const world = this.worlds.get(id)!;
    world.update({ time, dt, ptr, local: pos - this.firstChapter.get(id)!, dwell, w, h, dpr, ptrActive });
    this.renderer.setRenderTarget(target);              // draw into the off-screen picture
    if (!world.render?.(this.renderer, target)) {        // worlds with their own post (stalk, plots)
        this.renderer.setClearColor(world.clear, 1);
        this.renderer.clear();
        this.renderer.render(world.scene, world.camera); // 1. the 3D scene
    }
    this.renderer.clearDepth();
    this.renderer.render(world.fx, world.fxCamera);      // 2. bokeh / strands
    this.renderer.clearDepth();
    this.renderer.render(world.overlay, this.overlayCam); // 3. titles, in screen px
}`}
                </Code>
                <Lens>Rendering a pre-comp. The main comp never sees the pre-comp’s layers or camera, only its finished frame, so it can wipe, scale or blur that frame like any footage.</Lens>
                <KeyIdea>Each world renders scene → bokeh → titles into its own target; the composite only ever sees finished pictures.</KeyIdea>
            </Section>

            <Section id="wipe" n="02 · The wipe" title="One shader cuts between two pictures">
                <P>
                    The composite is a single <Term k="shader">fragment shader</Term> drawn over the whole screen. For each pixel it asks: am I below the edge line? Then show the new world (B),
                    sampled 30 % lower and rising into place; otherwise show the old world (A), pushed up 22 %. The edge is a straight line rising to the right, measured from the reference at a slope
                    of 0.248 (about 14°). Blends inside one world just mix the two pictures.
                </P>
                <Compositor />
                <Code file="engine/Composite.ts · composeFrag (wipe part)" lang="glsl" highlight={['float edge', 'vUv.y < edge']}>
                    {`float hs = abs(uSlope) * 0.5;                 // half the edge's rise across the screen
float edge = mix(-hs - 0.02, 1.0 + hs + 0.02, uP) + uSlope * (vUv.x - 0.5);
vec2 ua = vUv - vec2(0.0, 0.22 * uP);           // old world pushed up
vec2 ub = vUv + vec2(0.0, 0.30 * (1.0 - uP));   // new world rises from below
col = vUv.y < edge ? texture2D(tB, ub).rgb : texture2D(tA, ua).rgb;`}
                </Code>
                <TryThis
                    items={[
                        <>Set push and lift to 0: the wipe becomes a flat curtain. The push and lift are what make it feel like the camera is moving up.</>,
                        <>Flip the slope negative: the edge now falls to the right. Same maths, a completely different mood.</>,
                        <>Pick “DNA → network”: a blend. Same world, so there’s no new place to wipe to.</>,
                        <>Drop “resolution while moving” to 25 % and play the move: soft during the wipe, crisp the moment it lands.</>,
                    ]}
                />
                <KeyIdea>The wipe is one line per pixel: below the slanted edge show the new world (rising 30 %), above it the old one (pushed up 22 %).</KeyIdea>
            </Section>

            <Section id="after" n="03 · After the cut" title="Colour, blur and grain, in that order">
                <P>
                    The worlds are drawn in <Term k="linear">linear light</Term> (where light adds up correctly). After the cut the shader converts to display colour (sRGB), then grades the frame
                    through a <Term k="lut">LUT</Term>: a 512 × 512 image holding a 64³ colour cube, here a gentle contrast curve. The menu blur only runs while the menu is open: the picture is halved
                    four times and scaled back up (a dual-filter blur, cheap and smooth). Vignette and grain come last.
                </P>
                <Code file="engine/Composite.ts · finalFrag" lang="glsl" highlight={['uBlur', 'uGrain']}>
                    {`vec3 col = texture2D(tSharp, vUv).rgb;                         // wiped + graded
if (uBlur > 0.001) col = mix(col, texture2D(tBlur, vUv).rgb * 0.8, uBlur);   // menu
float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.2, 1.0)));
col *= mix(0.78, 1.0, v);                                         // vignette
col += (texture2D(tNoise, vUv * uNoiseScale + uNoiseOffset).r - 0.5) * uGrain; // grain 0.07`}
                </Code>
                <Callout tone="tip" title="Why the grain moves">
                    <C>uNoiseOffset</C> gets a new random value every frame, so the noise texture jumps around and reads as film grain instead of a dirty screen.
                </Callout>
                <KeyIdea>Linear → sRGB → LUT grade → (menu blur) → vignette → grain: colour work happens once, on the finished frame.</KeyIdea>
            </Section>

            <Section id="cost" n="04 · The bill" title="Two worlds cost double, so draw them smaller">
                <P>
                    While a transition runs, two whole worlds render every frame. The page pays for that in three ways: worlds render only when they’re on screen; during a move both render into
                    smaller targets (72 % of the size), which the moving edge hides; and the targets use 2× <Term k="msaa">MSAA</Term> (4× was too slow with two worlds at once). Before the first
                    frame, the engine also draws every world once behind the loader, so no shader compiles mid-wipe.
                </P>
                <Table
                    head={['Target', 'Size', 'Used when']}
                    mono={[1]}
                    rows={[
                        ['a, b', '100 % · 2× MSAA · half-float', 'A world is parked (one world on screen)'],
                        ['aMove, bMove', '72 % · 2× MSAA', 'A wipe or blend is moving'],
                        ['sharp', '100 %', 'The composite’s result'],
                        ['blur chain', '1/2, 1/4, 1/8, 1/16', 'Only while the menu is open'],
                    ]}
                />
                <Code file="engine/Engine.ts · init() (warm-up behind the loader)" highlight={['renderer.compile', 'renderWorld(id']}>
                    {`// compile every world once behind the loader so the first wipe does not hitch
for (const w of this.worlds.values()) {
    this.renderer.compile(w.scene, w.camera);
    this.renderer.compile(w.fx, w.fxCamera);
}
// draw every world once off screen: post passes compile and their targets allocate now
for (const id of this.worlds.keys()) {
    this.renderWorld(id, this.composite.b, first(id), 1 / 60, 0);
    this.renderWorld(id, this.composite.bMove, first(id), 1 / 60, 0);
}`}
                </Code>
                <KeyIdea>Only on-screen worlds render, transitions run at 72 %, and everything compiles behind the loader: that’s how two worlds fit in 16.7 ms.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/Composite.ts', note: 'targets, wipe, grade, blur, grain' },
                        { path: 'engine/Engine.ts', note: 'renderWorld, tick, init' },
                        { path: 'public/corn/tex/map-grade.png', note: 'the LUT' },
                    ]}
                />
            </Section>
        </>
    );
}
