'use client';

import StripeXray from '../demos/StripeXray';
import ZoneOrder from '../demos/ZoneOrder';
import { Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Steps, Term, TryThis, Where } from '../kit/ui';

export default function Maps() {
    return (
        <>
            <ChapterHead
                n="05"
                kicker="Boundary maps"
                title="Diagonal stripes decide everything."
                lead={
                    <>
                        After chapter 04 a dune is just a wiggly line. But each dot needs to know whether it is <em>inside</em> the dune, on its lit side, or out in the sky. Solace answers with a neat
                        trick: slice the picture into diagonal stripes and remember where the ridge crossed each one.
                    </>
                }
            />

            <Section id="problem" n="01 · The problem" title="Inside a shape you never drew">
                <P>
                    There is no polygon to test against, only the path of a walk. And the test runs hundreds of thousands of times, so it must be fast. The answer has to be a lookup, not a geometry
                    calculation.
                </P>
                <Lens>
                    Think of a real dune: the crest separates a lit face from a shadow face. Stand anywhere and look up along two diagonals. Each one hits the crest somewhere (or misses it). Which hit
                    is lower tells you which face you are standing on; no hit means you are in the sky.
                </Lens>
                <KeyIdea>The art never stores a shape, only where a line crossed some stripes.</KeyIdea>
            </Section>

            <Section id="stripes" n="02 · Stripes and maps" title="Two sets of stripes, two maps">
                <P>
                    Picture two sets of thin diagonal <Term k="stripe">stripes</Term> over the canvas, one running \, one running /. Every point sits in exactly one stripe of each set; the stripe’s
                    number is its <em>key</em>. As the ridge is walked, each stripe it enters for the first time gets an entry in a <Term k="boundaryMap">boundary map</Term>: stripe number → the
                    height of that first crossing.
                </P>
                <StripeXray />
                <TryThis
                    items={[
                        <>Hover above the ridge, then below it on each side: watch which edge “counts”.</>,
                        <>Lower keyResolution to 8: the dune’s edge becomes a staircase, one step per stripe.</>,
                        <>Raise diagonalSlope: the V opens and the dune gets broader.</>,
                    ]}
                />
                <Code file="art/dunes.ts" highlight={['Math.floor((cy - diagonalSlope * cx)', 'Math.floor((cy + diagonalSlope * cx)', 'if (!leftEdges.get']}>
                    {`// which stripe of each set the point (x, y) falls in
const leftKey = Math.floor((cy - diagonalSlope * cx) * keyResolution);   //  \\ stripes
const rightKey = Math.floor((cy + diagonalSlope * cx) * keyResolution);  //  / stripes

// while walking the ridge: remember the FIRST crossing of each stripe
if (!leftEdges.get(leftKey)) leftEdges.set(leftKey, y);
if (!rightEdges.get(rightKey)) rightEdges.set(rightKey, y);`}
                </Code>
                <KeyIdea>Stripe number in, edge height out: a dune is two lookup tables.</KeyIdea>
            </Section>

            <Section id="test" n="03 · The test" title="Compare two numbers">
                <P>To shade a point, the art looks up both of its stripes and compares:</P>
                <Steps
                    items={[
                        <>Look up the edge on the point’s \ stripe and on its / stripe (no entry = 0).</>,
                        <>An edge only counts if the point is below it (further down the canvas). Otherwise treat it as 0.</>,
                        <>
                            If the / edge is further down: <strong>dark core</strong>. If the \ edge is: <strong>lit slope</strong>. If neither counts: <strong>not this dune</strong>.
                        </>,
                    ]}
                />
                <Code file="art/dunes.ts · shadeOfPeak" highlight={['right > left', 'left > right']}>
                    {`let left = peak.leftEdges.get(leftKey) ?? 0;
if (y <= left) left = 0;              // above the edge: doesn't count
let right = peak.rightEdges.get(rightKey) ?? 0;
if (y <= right) right = 0;

if (right > left) return Shade.Core;  // dark core
if (left > right) return Shade.Slope; // lit slope
return null;                          // not in this dune`}
                </Code>
                <Callout tone="tip">
                    It’s a few multiplications, two lookups and two comparisons per dune. That is why 400,000 dots finish in about 0.1 s for 3 dunes and about 1.5 s for 120 dunes on a laptop CPU
                    (measured).
                </Callout>
                <KeyIdea>Two lookups and a comparison: / edge lower = core, \ edge lower = slope, none = sky.</KeyIdea>
            </Section>

            <Section id="order" n="04 · Many dunes" title="Ask the front dune first">
                <P>
                    With many dunes, each point asks them in order, front to back. The first dune that says “mine” decides the shade and the rest are never asked. That is what makes nearer dunes hide
                    the ones behind: no layers, no depth sorting, just the order of a loop.
                </P>
                <ZoneOrder />
                <Code file="art/dunes.ts · shadeAt" highlight={['for (const peak of peaks)']}>
                    {`export function shadeAt(peaks, keys, x, y) {
    for (const peak of peaks) {                   // front dune first
        const shade = shadeOfPeak(peak, keys, x, y);
        if (shade !== null) return shade;         // the first claim wins
    }
    return Shade.Sky;
}`}
                </Code>
                <KeyIdea>Occlusion for free: the first dune to claim a point hides every dune behind it.</KeyIdea>
            </Section>

            <Section id="res" n="05 · Edge quality" title="Resolution is a design choice">
                <P>
                    <Term k="keyRes">keyResolution</Term> sets the stripes per unit of height. The front dune gets 110 to 160; dunes further back get up to 300, because they are smaller on the canvas
                    and need finer edges to stay crisp. Single-dune pieces use 100 to 130, a slightly grainier edge, and 2 % of seeds use 600 everywhere for glassy smooth silhouettes.
                </P>
                <Code file="art/scene.ts · placePeaks" highlight={['lerp(rand.range(110, 160), 300']}>
                    {`// dunes further back get finer edges (they're smaller on the canvas)
let keyResolution = lerp(rand.range(110, 160), 300, Math.pow(depth, 0.7));
if (params.smoothEdges) keyResolution = 600;`}
                </Code>
                <KeyIdea>Fewer stripes, rougher edges: resolution is part of the look, not just quality.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/dunes.ts', note: 'stripeKeys · shadeOfPeak · shadeAt' },
                        { path: 'art/scene.ts', note: 'placePeaks' },
                    ]}
                />
            </Section>
        </>
    );
}
