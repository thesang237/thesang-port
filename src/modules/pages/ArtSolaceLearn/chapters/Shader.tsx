'use client';

import ShaderDune from '../demos/ShaderDune';
import ShaderSteps from '../demos/ShaderSteps';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Shader() {
    return (
        <>
            <ChapterHead
                n="08"
                kicker="Into the shader"
                title="The same art, every pixel at once."
                lead={
                    <>
                        The original runs on the CPU: one dot after another, 400,000 times. A graphics card can run the same per-point question for every pixel of the screen in parallel. This chapter
                        rebuilds Solace as a single fragment shader, and that shader becomes the engine for the three new pieces that follow.
                    </>
                }
            />

            <Section id="why" n="01 · Why move it" title="A question per pixel is a shader">
                <P>
                    A <Term k="fragment">fragment shader</Term> is a small function the GPU runs for every pixel at the same time: it receives the pixel’s position and returns its colour. That is
                    exactly the shape of Solace’s drawing loop (unwarp, shade, roll), minus the loop. Measured on a laptop, the CPU needs about 0.1 s for 3 dunes and 1.5 s for 120. The shader redraws
                    the whole piece every frame, so the dials below update instantly and the piece can move.
                </P>
                <Table
                    head={['', 'CPU (the original)', 'GPU (this chapter)']}
                    rows={[
                        ['Runs', 'one dot at a time, 400,000 times', 'every pixel at once, every frame'],
                        ['Randomness', 'one seeded stream, in order', 'a hash of each pixel’s position'],
                        ['Dune shapes', 'hash maps (stripe → edge)', 'the same maps baked into a texture'],
                        ['Grain', 'draw a dot, overlap', 'count the dots a cell would get'],
                        ['A new frame costs', 'the whole build again', 'one draw call'],
                    ]}
                />
                <KeyIdea>A shader is the art’s per-dot question with the loop taken away: every pixel asks at once.</KeyIdea>
            </Section>

            <Section id="steps" n="02 · Four steps" title="Build it up one idea at a time">
                <ShaderSteps />
                <Lens>
                    A shader is like an Expression on every pixel’s colour: it can’t see its neighbours or remember the last frame, it only knows where it is and the values you hand it (
                    <Term k="uniform">uniforms</Term>).
                </Lens>
                <KeyIdea>Position in, colour out: everything the art does has to fit in that one function.</KeyIdea>
            </Section>

            <Section id="hash" n="03 · Random without a stream" title="Ask for the number at this place">
                <P>
                    Pixels run in parallel, so there is no “next number” to deal from the top of a deck. Instead each pixel asks a <Term k="gpuHash">hash function</Term> for the random number{' '}
                    <em>at its own position</em> (plus a seed). Same place, same number, every frame: repeatable, like the art’s stream, but in any order.
                </P>
                <Code file="kit/glsl.ts · HASH (Dave Hoskins, “Hash without Sine”)" lang="glsl" highlight={['fract(']}>
                    {`float hash13(vec3 p3) {           // (cell x, cell y, seed) → 0..1
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}`}
                </Code>
                <Callout tone="warn">
                    This means the GPU version can’t reproduce the CPU picture grain for grain: the dunes and zones match exactly, the grain has the same density but different dice. (The Sandstorm and
                    Blur kicks, which need the stream, are left out.) Use the CPU version for the collectible output, the GPU for live and animated work.
                </Callout>
                <KeyIdea>On the GPU, randomness is a place, not a sequence: hash the position.</KeyIdea>
            </Section>

            <Section id="bake" n="04 · Baking the maps" title="From hash maps to a texture">
                <P>
                    The dune shapes live in boundary maps: stripe number → edge height, with gaps. A shader can’t read a JavaScript map, but it can read a <Term k="texture">texture</Term> by index. So
                    the maps are <Term k="bake">baked</Term>: each one becomes a dense row of floats from its first stripe to its last (gaps stored as 0, which is what the CPU’s <C>?? 0</C> returns
                    anyway), all rows packed into one float texture, plus a tiny second texture saying where each dune’s rows start.
                </P>
                <Code file="kit/bake.ts (trimmed)" highlight={['edges[s.offset + (k - s.lo)]', 'metaRows.push']}>
                    {`for (const p of peaks) {
    const L = range(p.leftEdges), R = range(p.rightEdges);   // smallest key, how many keys
    metaRows.push(p.diagonalSlope, p.keyResolution, L.lo, L.count, R.lo, R.count, leftOffset, rightOffset);
}
for (const s of spans) {
    for (const [k, y] of s.map) edges[s.offset + (k - s.lo)] = y;  // dense row, gaps stay 0
}`}
                </Code>
                <Code file="kit/glsl.ts · DUNES (trimmed)" lang="glsl" highlight={['texelFetch(uEdges']}>
                    {`float edgeAt(float offset, float minKey, float count, float key) {
    float i = key - minKey;
    if (i < 0.0 || i >= count) return 0.0;          // a stripe the ridge never crossed
    float idx = offset + i;                         // one long row, wrapped every 4096 texels
    return texelFetch(uEdges, ivec2(int(mod(idx, EDGE_W)), int(idx / EDGE_W)), 0).r;
}`}
                </Code>
                <Callout tone="tip" title="The trade-off">
                    Dense rows cost memory for every stripe between the first and the last. Steep dunes at the back of busy scenes span hundreds of thousands of stripes, so the GPU demos cap the
                    texture at 16 MB and leave out the furthest dunes if needed (try seed r1 below). The CPU’s sparse maps never pay that.
                </Callout>
                <KeyIdea>Work out the shapes once on the CPU, hand them over as a texture, look them up per pixel.</KeyIdea>
            </Section>

            <Section id="grain" n="05 · Grain without a loop" title="Count the dots a cell would get">
                <P>
                    The CPU throws 400,000 dots. The shader can’t loop over them, so it flips the question: split the canvas into dot-sized cells and ask “how many of the art’s dots would land here,
                    and how many would be kept?”. On average a cell gets about 0.58 tries (<Term k="lambda">λ</Term>). The shader throws 4 hashed dice per cell, each succeeding with a quarter of λ ×
                    the zone’s chance, then stacks the kept dots’ opacity, exactly like overlapping dots on paper.
                </P>
                <Code file="kit/glsl.ts · GRAIN" lang="glsl" highlight={['step(h,', 'pow(']}>
                    {`float inkAt(vec2 c, float density) {
    vec2 cell = floor(c / uDotSize);                       // which dot-sized cell
    float kept = 0.0;
    for (int s = 0; s < 4; s++) {
        float h = hash13(vec3(cell, uGrainSeed + float(s) * 19.19));
        kept += step(h, density * uTries * 0.25);          // one die per try
    }
    return 1.0 - pow(max(1.0 - uInkAlpha, 1e-4), kept);    // k dots of opacity α
}`}
                </Code>
                <Callout tone="warn" title="A bug worth knowing">
                    The first version used <C>pow(1.0 - uInkAlpha, kept)</C>. With the Grainy brush (opacity 1) and no dots, that’s <C>pow(0, 0)</C>, which GPUs leave undefined: the whole canvas went
                    black. The <C>max(…, 1e-4)</C> fixes it.
                </Callout>
                <KeyIdea>Instead of throwing dots at pixels, let each pixel count the dots it would have caught.</KeyIdea>
            </Section>

            <Section id="live" n="06 · The whole thing" title="Solace, live">
                <ShaderDune />
                <TryThis
                    items={[
                        <>Switch to “Zones”, then drag warpPhaseY: the landscape rolls in real time. The CPU would need a full redraw for each position.</>,
                        <>Press “Re-throw grain”: same piece, new dice. That’s the seed of chapter 09.</>,
                        <>Try seed r1 (48 dunes): watch the texture budget readout, and which back dunes get left out.</>,
                        <>Push grain size to 4 and dots to 3: a coarse, printed look the original can’t reach.</>,
                    ]}
                />
                <KeyIdea>Shapes from the CPU, everything per-pixel on the GPU: the piece becomes a live instrument.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/dunes.ts', note: 'what the shader mirrors' },
                        { path: 'art/warp.ts', note: 'unwarp' },
                        { path: '../ArtSolaceLearn/kit/glsl.ts', note: 'the GLSL' },
                        { path: '../ArtSolaceLearn/kit/bake.ts', note: 'the bake' },
                    ]}
                />
            </Section>
        </>
    );
}
