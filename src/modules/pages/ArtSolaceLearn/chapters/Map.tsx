'use client';

import Pipeline from '../demos/Pipeline';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, Where } from '../kit/ui';

export default function Map() {
    return (
        <>
            <ChapterHead
                n="00"
                kicker="The map"
                title="Seed in, sand out."
                lead={
                    <>
                        Solace looks hand-made: dunes in soft grain, a lit slope, a hazy sky. Under the hood it is one seed, a handful of rolled numbers, and one question asked 400,000 times. This
                        chapter is the whole machine on one page; every later chapter zooms into one box of it.
                    </>
                }
            />

            <Section id="see" n="01 · What you see" title="Dunes made only of dots">
                <P>
                    Every piece is a square of paper with one ink colour. Dunes stack from the front (low on the canvas) to the back (higher, smaller). Each dune has a <em>dark core</em> and a{' '}
                    <em>lit slope</em>; around them is <em>sky</em>. There are no outlines and no fills anywhere: every shape you see is just where dots landed more or less often.
                </P>
                <Lens>
                    Think of a mezzotint or a halftone print. The plate has no lines, only a texture of dots; tone comes from how dense the dots are. Solace is a halftone whose screen is a dice roll.
                </Lens>
                <KeyIdea>No lines, no fills: every shape is a change in how likely a dot is to be kept.</KeyIdea>
            </Section>

            <Section id="system" n="02 · The machine" title="Four stages, one seed">
                <P>
                    A piece is made in four stages. The <Term k="seed">seed</Term> rolls the <Term k="trait">traits</Term>; the traits shape a set of scene numbers; those place the dunes and walk each
                    one’s <Term k="ridge">ridge</Term>; then 50 frames of dots are scattered, each kept or dropped. Step through them:
                </P>
                <Pipeline />
                <Code file="art/scene.ts · buildScene() (trimmed)" highlight={['rollTraits', 'rollSceneParams', 'placePeaks', 'drawFrame']}>
                    {`export function buildScene(seed: string, size: number, overrides = {}) {
    const traitRand = createRandom(seed);
    const traits = { ...rollTraits(traitRand), ...overrides.traits };      // 1. traits

    const rand = createRandom(String(1e9 * traitRand.next()));
    const params = rollSceneParams(rand, traits, palette, overrides.params); // 2. numbers
    const { warp, unwarp, unsqueezeY } = createWarp(params);

    const peaks = placePeaks(rand, keys, params, traits.Dunes, unsqueezeY);  // 3. dunes

    function drawFrame(ctx, frame) { /* 4. scatter sand, see below */ }
    return { traits, params, peaks, warp, unwarp, drawFrame };
}`}
                </Code>
                <KeyIdea>Seed → traits → numbers → dunes → sand. Each stage only reads the ones before it.</KeyIdea>
            </Section>

            <Section id="question" n="03 · The one question" title="Every grain asks where it is">
                <P>
                    Drawing is a loop. Each frame tries 8,000 dots: a random x, and a y that sweeps the canvas once from top to bottom over the 50 frames. For each dot the code asks the same question,
                    in three steps:
                </P>
                <Code file="art/scene.ts · drawFrame() (trimmed)" highlight={['unwarp(x, y)', 'shadeAt(', 'rand.next() <=']}>
                    {`for (let i = 0; i < dots; i++) {
    const x = rand.range(marginMin, marginMax);          // anywhere across
    const y = lerp(marginMin, marginMax, progress);      // the scan line

    const [modelX, modelY] = unwarp(x, y);               // 1. where did this point come from?
    const shade = shadeAt(peaks, keys, modelX, modelY);  // 2. core, slope or sky?

    if (rand.next() <= densityOf[shade]) {               // 3. roll the dice
        ctx.fillRect(x * size, y * size, dotSize, dotSize);
    }
}`}
                </Code>
                <Table
                    head={['Zone', 'Draw chance', 'Reads as']}
                    rows={[
                        ['Dark core', '1 (every dot)', 'solid ink with a fine grain'],
                        ['Lit slope', '0.1 (one in ten)', 'a pale speckle: the light side'],
                        ['Sky', '0.5 – 1 (from the Sky trait)', 'a hazy field, darker or lighter than the slope'],
                    ]}
                />
                <Callout tone="meta">
                    That per-point question is exactly how a GPU <Term k="fragment">fragment shader</Term> thinks: one small function, run for every pixel. Chapter 08 moves this loop onto the GPU and
                    it draws the whole piece in one frame.
                </Callout>
                <KeyIdea>Unwarp, shade, roll: three steps per grain, and the picture appears.</KeyIdea>
            </Section>

            <Section id="words" n="04 · Vocabulary bridge" title="Design words and code words">
                <P>The rest of the guide uses these pairs. Hover any dotted word for a plain definition.</P>
                <Table
                    head={['You might say', 'The code says', 'What it is']}
                    mono={[1]}
                    rows={[
                        ['Edition / variant', 'seed', 'The text everything is grown from'],
                        ['Variant properties', 'traits', 'Named features rolled first: Palette, Dunes, Sky…'],
                        ['Layout settings', 'params (SceneParams)', 'Every number that shapes the picture, rolled in one place'],
                        ['Dice', 'rand.next() / range / pick / chance', 'The seeded random stream'],
                        ['Crest line', 'ridge walk (createPeak)', 'A path walked down from each peak'],
                        ['Shape mask', 'boundary maps', 'Where the ridge crossed each diagonal stripe'],
                        ['Light / shadow', 'Shade.Core / Slope / Sky', 'The three answers a point can get'],
                        ['Mesh warp', 'warp / unwarp', 'The wavy horizon and the depth squeeze'],
                        ['Tone', 'density (draw chance)', 'How likely a dot is to stay'],
                    ]}
                />
                <KeyIdea>Seed, traits, params, ridge, zone, density: six words and you can read the whole artwork.</KeyIdea>
            </Section>

            <Section id="files" n="05 · Where things live" title="Nine small files">
                <P>
                    The source was one 680-line file. It is now split so each idea has its own file, in the order you meet them in this guide. <C>README.md</C> in the folder explains the rules for
                    changing it without breaking old seeds.
                </P>
                <Table
                    head={['File', 'Chapter', 'What’s in it']}
                    mono={[0]}
                    rows={[
                        ['art/random.ts', '01', 'Seeded random: hash, generator, bell curve, helpers'],
                        ['art/palettes.ts · traits.ts', '02', 'Palettes, the weighted bag, trait odds'],
                        ['art/noise.ts', '03', 'Seeded Perlin noise'],
                        ['art/dunes.ts', '04 – 05', 'Ridge walk, boundary maps, shade test'],
                        ['art/warp.ts', '06', 'Warp and its exact reverse'],
                        ['art/params.ts', '02 – 07', 'Every scene number, with overrides'],
                        ['art/scene.ts', '00, 07', 'Puts it together; drawFrame()'],
                        ['ArtSolacePage.tsx · debug/', '12', 'The canvas, the loop, the debug panel'],
                    ]}
                />
                <Where
                    files={[
                        { path: 'README.md', note: 'start here' },
                        { path: 'art/scene.ts', note: 'the pipeline' },
                        { path: 'art/params.ts', note: 'every number' },
                        { path: 'ArtSolacePage.tsx', note: 'the loop' },
                    ]}
                />
            </Section>
        </>
    );
}
