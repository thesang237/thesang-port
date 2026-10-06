'use client';

import RidgeLab from '../demos/RidgeLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function Ridge() {
    return (
        <>
            <ChapterHead
                n="04"
                kicker="Ridge walk"
                title="Two waves walk down a dune."
                lead={
                    <>
                        A dune is born as a single line: its crest. The code doesn’t draw it with a curve tool; it walks it, one tiny step at a time, letting two sine waves push it sideways. The
                        result looks wind-shaped because it is built the way wind builds one: little by little, downhill.
                    </>
                }
            />

            <Section id="walk" n="01 · The walker" title="From the peak, one step at a time">
                <P>
                    Every dune starts at its peak. A walker steps down 0.001 of the canvas at a time (a thousand steps to the bottom), drifts a hair to the left on each step, and gets pushed sideways
                    by two <Term k="sine">sine waves</Term>. Wherever it goes is the <Term k="ridge">ridge</Term>.
                </P>
                <RidgeLab />
                <TryThis
                    items={[
                        <>Turn the wiggle off: the smooth ridges 15 % of dunes get.</>,
                        <>Set step to 15 ‰: you can see the footsteps. The real walk is so fine it reads as a line.</>,
                        <>Push lean to −2 ‰: the whole dune tips the other way.</>,
                        <>Turn on “special” and raise the dune count: the lower ridge flares into wings. That’s what busy scenes look like.</>,
                    ]}
                />
                <KeyIdea>A ridge is a walk, not a curve: tiny steps down, pushed sideways by waves.</KeyIdea>
            </Section>

            <Section id="waves" n="02 · Two waves" title="A sway and a wiggle">
                <P>
                    One wave is slow and wide (5 to 10 cycles, a gentle sway); the other is faster and smaller (10 to 30, sometimes +15, a wiggle). Their sum looks irregular even though each is
                    perfectly regular. Each dune rolls its own frequencies, amplitudes, signs and starting phases.
                </P>
                <Code file="art/dunes.ts · createPeak (trimmed)" highlight={['wave1Freq', 'wave2Freq', 'rand.chance(0.15)) wave2Amp = 0']}>
                    {`const wave1Freq = rand.range(5, 10);
const wave1Amp = rand.range(2e-4, 3e-4) * rand.pick([-1, 1]);  // sign: sway left or right first
const wave1Phase = rand.range(0, TWO_PI);

const wave2Freq = rand.range(10, 30) + (rand.chance(0.15) ? 15 : 0);
let wave2Amp = rand.range(0.001, 0.0015) * rand.pick([-1, 1]);
const wave2Phase = rand.range(0, TWO_PI);
if (rand.chance(0.15)) wave2Amp = 0;                            // a smooth ridge`}
                </Code>
                <Lens>
                    Two Wiggle expressions on one layer’s position, one slow and wide, one fast and small. Neither looks natural alone; layered, they read as organic. Same trick as octaves in noise.
                </Lens>
                <KeyIdea>Layer a slow big wave with a fast small one and a regular formula starts to look natural.</KeyIdea>
            </Section>

            <Section id="sqrt" n="03 · Stretching the waves" title="Why √y?">
                <P>
                    The waves don’t use the height directly; they use its square root. √y grows fast near the top and slowly near the bottom, so the waves are packed tight near the peak and stretched
                    out lower down: quick ripples at the crest, long lazy curves at the foot, like perspective.
                </P>
                <Code file="art/dunes.ts" highlight={['Math.pow(y, 0.5)']}>
                    {`x += wave1Amp * swayScale * Math.sin(wave1Phase + wave1Freq * Math.pow(y, 0.5));
x += wave2Amp * swayScale * Math.sin(wave2Phase + wave2Freq * Math.pow(y, 0.5));`}
                </Code>
                <KeyIdea>Feed a wave a curved input and you control where its ripples bunch up.</KeyIdea>
            </Section>

            <Section id="flare" n="04 · Growing sway" title="Normal peaks and flaring peaks">
                <P>
                    The push also grows as the walker descends. Normal peaks grow it gently (from 0.5× at the top to 1× at the bottom). In scenes with more than six dunes, most peaks are “special”:
                    their push grows with the <em>square</em> of the distance, times the dune count, up to 10×. The bottom of the ridge swings wide and the dune flares like a wing.
                </P>
                <Code file="art/dunes.ts" highlight={['isSpecial ?']}>
                    {`const depth = y - o.peakY;
const swayScale = o.isSpecial
    ? mapRange(depth * depth * o.numPeaks, 0, 1, 0.5, 10)   // grows fast: wings
    : mapRange(depth, 0, 1, 0.5, 1);                        // grows gently`}
                </Code>
                <Callout tone="tip">
                    Every one of these numbers is exposed in the debug panel as a multiplier: <C>ridgeWobble</C> scales both waves, <C>ridgeLean</C> the drift, <C>ridgeStep</C> the step.
                </Callout>
                <KeyIdea>Make the push depend on distance and one formula gives both calm dunes and wind-whipped wings.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/dunes.ts', note: 'createPeak' },
                        { path: 'art/scene.ts', note: 'placePeaks' },
                    ]}
                />
            </Section>
        </>
    );
}
