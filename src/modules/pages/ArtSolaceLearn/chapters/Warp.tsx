'use client';

import PushPull from '../demos/PushPull';
import WarpGrid from '../demos/WarpGrid';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function Warp() {
    return (
        <>
            <ChapterHead
                n="06"
                kicker="Warp & unwarp"
                title="Bend the picture, then ask backwards."
                lead={
                    <>
                        The dunes are built in a flat, even world. The finished picture is bent: a rolling horizon, and depth that crowds distant dunes together. The clever part is how the bend is
                        applied: not to the shapes, but to every question a dot asks.
                    </>
                }
            />

            <Section id="spaces" n="01 · Two spaces" title="Model space and canvas space">
                <P>
                    <Term k="modelSpace">Model space</Term> is where ridges are walked and stripes are counted: flat, even, simple. Canvas space is what you see. <Term k="warp">Warp</Term> is the
                    formula that carries a point from the first to the second. It does two things:
                </P>
                <WarpGrid />
                <TryThis
                    items={[
                        <>Set verticalCompression to 1 and warpAmplY to 0: no bend at all. The dunes look flat and paper-cut.</>,
                        <>Push verticalCompression to 0.25: the horizon drops and the near dunes tower over you.</>,
                        <>Drag warpPhaseY slowly: the whole landscape rolls sideways. Chapter 09 animates exactly this.</>,
                    ]}
                />
                <KeyIdea>Build the world flat, bend it at the end: shapes stay simple, the picture gets depth.</KeyIdea>
            </Section>

            <Section id="bends" n="02 · The two bends" title="A wave and a curve">
                <P>
                    First a sine wave lifts and drops each column a little: the rolling horizon. Its height is divided by its frequency, so fast waves stay shallow. Then a{' '}
                    <Term k="powerCurve">power curve</Term> squeezes y: raise it to the power <C>verticalCompression</C> (0.4 to 1.3) and the rows bunch up, like distance in a photo.
                </P>
                <Code file="art/warp.ts · warp()" highlight={['Math.sin(w.warpPhaseY', 'Math.pow(wavyY + PAD']}>
                    {`function warp(modelX, modelY) {
    let x = modelX;
    if (w.flipX) x = 1 - x;
    const wavyY = modelY + w.warpAmplY * Math.sin(w.warpPhaseY + w.warpFreqY * x);       // 1. wave
    const y = mapRange(Math.pow(wavyY + PAD, w.verticalCompression), powLo, powHi, 0, 1); // 2. squeeze
    return [x, y];
}`}
                </Code>
                <Lens>Envelope distort in Illustrator, but defined by two formulas instead of handles. Because it’s a formula, it can be run backwards exactly.</Lens>
                <KeyIdea>A sine for the horizon, a power curve for depth: two lines of maths, a whole landscape.</KeyIdea>
            </Section>

            <Section id="pull" n="03 · Push or pull" title="Ask backwards and nothing is missed">
                <P>
                    There are two ways to apply a bend. <em>Push</em>: move every model point to its canvas spot. Where the bend stretches, points spread apart and leave gaps; where it squeezes, they
                    pile up. <em>Pull</em>: start from each canvas point and ask “where did you come from?”. Every canvas point gets exactly one answer. Solace pulls.
                </P>
                <PushPull />
                <Code file="art/warp.ts · unwarp() — warp(), step by step in reverse" highlight={['unsqueezeY', '- w.warpAmplY']}>
                    {`function unwarp(canvasX, canvasY) {
    const wavyY = unsqueezeY(canvasY);                                    // undo 2. the squeeze
    const y = wavyY - w.warpAmplY * Math.sin(w.warpPhaseY + w.warpFreqY * canvasX); // undo 1. the wave
    let x = canvasX;
    if (w.flipX) x = 1 - x;                                               // undo the mirror
    return [x, y];
}`}
                </Code>
                <Callout tone="meta">
                    Pulling is how every GPU shader works: a pixel can only colour itself, so it must ask where it came from. That’s why the art moves to a shader so naturally in chapter 08.
                </Callout>
                <KeyIdea>Don’t move the shapes to the pixels: ask each pixel where it came from.</KeyIdea>
            </Section>

            <Section id="place" n="04 · Placing peaks" title="Half an unwarp">
                <P>
                    One more use: peaks are placed by canvas height (“the front dune’s peak at 80 % down”), but stored in model space. So placement undoes only the squeeze, with <C>unsqueezeY</C>.
                    That’s why changing verticalCompression in the debug panel also moves the peaks: the art is keeping their canvas positions where the seed wanted them.
                </P>
                <Code file="art/scene.ts · placePeaks" highlight={['unsqueezeY(']}>
                    {`// y: from nearY (front) to farY (back), chosen on the canvas then un-squeezed into model space
let peakY = unsqueezeY(lerp(params.nearY, params.farY, curvedDepth));`}
                </Code>
                <KeyIdea>Design in canvas terms, store in model terms: the inverse formula translates.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/warp.ts', note: 'warp · unwarp · unsqueezeY' },
                        { path: 'art/params.ts', note: 'the warp numbers' },
                    ]}
                />
            </Section>
        </>
    );
}
