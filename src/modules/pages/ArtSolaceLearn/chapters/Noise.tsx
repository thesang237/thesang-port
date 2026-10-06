'use client';

import GaussLab from '../demos/GaussLab';
import NoiseLab from '../demos/NoiseLab';
import SandstormXray from '../demos/SandstormXray';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Steps, Term, TryThis, Where } from '../kit/ui';

export default function Noise() {
    return (
        <>
            <ChapterHead
                n="03"
                kicker="Noise & bells"
                title="Randomness that looks like nature."
                lead={
                    <>
                        Pure dice rolls look like TV static. Nature looks smoother (hills, clouds) or clustered (most sand lands near where it was thrown). Two kinds of shaped randomness give you
                        that, and Solace uses both.
                    </>
                }
            />

            <Section id="smooth" n="01 · Smooth randomness" title="Neighbours that agree">
                <P>
                    <Term k="whiteNoise">White noise</Term> gives every point its own unrelated value. <Term k="perlin">Perlin noise</Term> is random too, but neighbouring points get similar values,
                    so it rolls like terrain. It is the most used tool in generative art.
                </P>
                <NoiseLab />
                <TryThis
                    items={[
                        <>Switch to white noise and back: same seed, same “amount” of randomness, completely different feel.</>,
                        <>Set scale to 1: one gentle hill. Set it to 30: almost static again.</>,
                        <>Raise octaves to 5: big shapes keep their place, but get a rough, rocky surface (that’s fBm).</>,
                    ]}
                />
                <KeyIdea>Perlin noise is randomness with memory: close points, close values.</KeyIdea>
            </Section>

            <Section id="perlin" n="02 · How Perlin works" title="Random slopes on a grid">
                <P>No need to memorise the maths; the idea fits in three steps:</P>
                <Steps
                    items={[
                        <>Lay a grid over the plane. At every grid corner, pick a random slope direction (from the seeded shuffle).</>,
                        <>For a point inside a cell, ask each of its corners: “if your slope continued to here, how high would it be?”</>,
                        <>
                            Blend those answers with <Term k="smootherstep">smootherstep</Term>, a curve that starts and ends flat, so cells join without creases.
                        </>,
                    ]}
                />
                <Code file="art/noise.ts (trimmed)" highlight={['const fade', 'lerp(']}>
                    {`const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);   // smootherstep

return (px, py = 0, pz = 0) => {
    const X = Math.floor(px) & 255, x = px - Math.floor(px);  // which cell, where inside
    ...
    const u = fade(x), v = fade(y), w = fade(z);
    // blend the 8 corner slopes: along x, then y, then z
    const n = lerp(lerp(lerp(grad(...), grad(...), u), ...), ..., w);
    return (n + 1) * 0.5;                                     // 0..1, centred on 0.5
};`}
                </Code>
                <Lens>After Effects’ Fractal Noise is this with octaves and a contrast curve. Its “Complexity” is the octaves slider; “Scale” is the grid size.</Lens>
                <KeyIdea>Grid of random slopes, smooth blend between them: that’s all Perlin noise is.</KeyIdea>
            </Section>

            <Section id="bell" n="03 · Bell curves" title="Mostly small, sometimes big">
                <P>
                    The other shape is the <Term k="gaussian">bell curve</Term>: values cluster around zero and thin out fast. The art makes it from two ordinary random numbers with the{' '}
                    <em>Marsaglia polar method</em>: pick a random point in a square, keep it only if it falls inside a circle, then stretch it with a logarithm.
                </P>
                <GaussLab />
                <Code file="art/random.ts · makeGaussian (trimmed)" highlight={['while (s >= 1', 'Math.log(s)']}>
                    {`do {
    u = next() * 2 - 1;                // a random point in the square −1..1
    v = next() * 2 - 1;
    s = u * u + v * v;
} while (s >= 1 || s === 0);           // keep it only inside the circle
const m = Math.sqrt((-2 * Math.log(s)) / s);
spare = v * m;                         // two bell values per round: keep one for later
return u * m;`}
                </Code>
                <Callout tone="warn">
                    The loop can take <em>any number</em> of random numbers (it retries points outside the circle), and the spare value is saved between calls. So the bell curve shares the art’s
                    stream: if a feature calls <C>gaussian()</C> one extra time, everything after it shifts.
                </Callout>
                <KeyIdea>A bell curve gives natural scatter: mostly near the middle, rarely far out.</KeyIdea>
            </Section>

            <Section id="storm" n="04 · Both at once" title="Sandstorm: noise picks where, the bell picks how much">
                <P>
                    The Sandstorm trait combines the two. Noise decides <em>where</em>: only points on thin contour lines of the noise field are affected. The bell curve decides <em>how much</em>:
                    those points jump up or down by a mostly-small, occasionally-large amount before the dune is asked about them.
                </P>
                <SandstormXray />
                <Code file="art/dunes.ts · stripeKeys" highlight={['% 0.1 < 0.005', 'gaussian()']}>
                    {`if (keys.sandstorm && keys.noise(30 * cx, 30 * cy) % 0.1 < 0.005) {
    cy += 0.18 * keys.gaussian();   // kick it up or down
}`}
                </Code>
                <P>
                    <C>% 0.1</C> slices the smooth noise into ten bands; <C>{'< 0.005'}</C> keeps only a hair-thin line at the start of each band. You will meet this “slice a smooth field into bands”
                    trick again in chapter 11 (Strata).
                </P>
                <KeyIdea>Noise for where, bell curve for how much: the classic recipe for natural-looking disturbance.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/noise.ts', note: 'createNoise' },
                        { path: 'art/random.ts', note: 'makeGaussian' },
                        { path: 'art/dunes.ts', note: 'stripeKeys · sandstorm' },
                    ]}
                />
            </Section>
        </>
    );
}
