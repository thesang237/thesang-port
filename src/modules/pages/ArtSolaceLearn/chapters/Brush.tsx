'use client';

import BrushLab from '../demos/BrushLab';
import ToneRamp from '../demos/ToneRamp';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Brush() {
    return (
        <>
            <ChapterHead
                n="07"
                kicker="Sand brush"
                title="Probability is the only paint."
                lead={
                    <>
                        Everything so far decided where things are. This chapter is about how they look: how a list of “core, slope, sky” answers becomes grain, tone and light, using nothing but a
                        dice roll per dot.
                    </>
                }
            />

            <Section id="tone" n="01 · Tone from chance" title="A gradient with no gradient in it">
                <P>
                    <Term k="stipple">Stippling</Term> makes tone from dots: more dots read as darker. Solace takes it one step further: it never decides how many dots go where. It only gives each
                    zone a <Term k="density">draw chance</Term> and lets the dice do the rest.
                </P>
                <ToneRamp />
                <Lens>Pointillism and mezzotint by dice. Or a halftone screen where each cell flips a weighted coin instead of growing a dot.</Lens>
                <KeyIdea>Give each zone a chance, roll for every dot: tone appears on its own.</KeyIdea>
            </Section>

            <Section id="brush" n="02 · The three chances" title="Core, slope, sky">
                <P>
                    The art uses only three numbers: the core keeps every dot (1), the lit slope keeps one in ten (0.1), and the sky keeps 0.5 to 1 depending on the Sky trait. The light on the dunes
                    is nothing but that 0.1.
                </P>
                <BrushLab />
                <TryThis
                    items={[
                        <>Set slope to 0.6: the lit side of every dune goes dull, the light is gone.</>,
                        <>Set sky to 0: dunes float on blank paper. Set it to 1: the sky is as dark as the cores, and only the slopes glow.</>,
                        <>Drop dots per frame to 1,000: the grain gets coarse and you can see each dot land.</>,
                        <>Pick the Soft preset: same dots, a fifth of the ink. Grainy: solid ink, double frames.</>,
                    ]}
                />
                <Code file="art/scene.ts · drawFrame" highlight={['densityOf[shade]']}>
                    {`const densityOf = { [Shade.Core]: params.coreDensity, [Shade.Slope]: params.slopeDensity, [Shade.Sky]: params.skyDensity };
...
if (rand.next() <= densityOf[shade]) {
    ctx.fillRect(x * size, y * size, dotSize, dotSize);
}`}
                </Code>
                <KeyIdea>The light on the dunes is one number: the slope keeps 1 dot in 10.</KeyIdea>
            </Section>

            <Section id="pour" n="03 · Pouring" title="Top to bottom, like settling sand">
                <P>
                    Each frame tries 8,000 dots. Their x is random, but their y follows a scan line that sweeps the canvas once over all the frames. So you watch the piece pour in from the top over
                    about a second, the way sand settles in an hourglass. The build-up is part of the work, not a loading screen.
                </P>
                <Code file="art/scene.ts · drawFrame" highlight={['progress']}>
                    {`const progress = (dots * frame + i) / (dots * params.frames); // 0 → 1 across ALL frames
const x = rand.range(marginMin, marginMax);                      // anywhere across
const y = lerp(marginMin, marginMax, progress);                  // the scan line`}
                </Code>
                <Callout tone="meta">The hero of this guide runs this exact loop: one frame of the art per screen refresh.</Callout>
                <KeyIdea>Random across, ordered down: the image pours in instead of popping in.</KeyIdea>
            </Section>

            <Section id="ink" n="04 · Ink" title="Three brushes, one formula">
                <P>
                    Every dot has the same opacity. Where dots overlap they darken, by <Term k="alphaStack">opacity stacking</Term>: k dots of opacity α leave 1 − (1 − α)ᵏ ink. The Brush trait only
                    changes α (and Grainy doubles the frames).
                </P>
                <Table
                    head={['Brush', 'Ink opacity', 'Frames', 'Look']}
                    mono={[1, 2]}
                    rows={[
                        ['Sand (90 %)', '80 / 255', '50', 'Soft grain, overlaps build tone'],
                        ['Soft (when the palette allows)', '24 / 255', '50', 'Faint, misty, like pencil'],
                        ['Grainy (3 %, never with Tabula)', '255 / 255', '100', 'Every dot solid: harsh, high-contrast grit'],
                    ]}
                />
                <Code file="art/params.ts" highlight={['inkStrength']}>
                    {`const inkStrength = traits.Brush === 'Grainy' ? 100 : traits.Brush === 'Sand' ? 1 : 0.3;
inkAlpha: Math.min(255, palette.inkAlpha * inkStrength),   // 80 → 255, 80, or 24
frames: traits.Brush === 'Grainy' ? 100 : 50,`}
                </Code>
                <Callout tone="tip">
                    The dot size is fixed at <C>0.0012</C> of the canvas and the canvas always renders at 2× pixel density. That keeps the grain the same size relative to the piece on every screen,
                    which matters more for this artwork than sharpness.
                </Callout>
                <KeyIdea>One dot, one opacity: overlaps do the shading.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/scene.ts', note: 'drawFrame' },
                        { path: 'art/params.ts', note: 'densities · brush' },
                        { path: 'ArtSolacePage.tsx', note: 'DPR 2 · the loop' },
                    ]}
                />
            </Section>
        </>
    );
}
