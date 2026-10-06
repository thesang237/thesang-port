'use client';

import Checklist from '../demos/Checklist';
import Quiz from '../demos/Quiz';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, P, Section, Steps, Table, Where } from '../kit/ui';

export default function Build() {
    return (
        <>
            <ChapterHead
                n="12"
                kicker="Build your own"
                title="Your turn to grow a collection."
                lead={
                    <>
                        You’ve seen every part of Solace and three new pieces made from its parts. This chapter turns that into a recipe, a tour of the tools in the source, three briefs to try, and a
                        final quiz.
                    </>
                }
            />

            <Section id="recipe" n="01 · The recipe" title="Seven steps to a generative piece">
                <Steps
                    items={[
                        <>
                            <strong>One seed, one stream.</strong> Hash the seed, deal numbers in order. Never <C>Math.random()</C>.
                        </>,
                        <>
                            <strong>Roll traits first.</strong> A short list of named features with odds, and rules between them.
                        </>,
                        <>
                            <strong>Roll every number in one place.</strong> A params file is the map of what can vary.
                        </>,
                        <>
                            <strong>Build simple shapes in a flat space.</strong> Walks, stripes, noise: whatever stays easy to test.
                        </>,
                        <>
                            <strong>Give each point a question.</strong> “Which zone am I in?” answered by a lookup, not geometry.
                        </>,
                        <>
                            <strong>Bend at the end, and pull.</strong> Warp the picture by asking each point where it came from.
                        </>,
                        <>
                            <strong>Paint with chance.</strong> A draw probability per zone; let dots make the tone.
                        </>,
                    ]}
                />
                <KeyIdea>Seed, traits, params, shapes, question, warp, chance: the whole of Solace in seven words.</KeyIdea>
            </Section>

            <Section id="panel" n="02 · The debug panel" title="Tweak a seed without breaking it">
                <P>
                    Open <C>/art-solace</C> and press <C>D</C>. The panel (leva) shows what the seed rolled and lets you force any of it. Every scene dial has a checkbox: unticked, it only shows the
                    seeded value; ticked, your value replaces it. Tiny values are shown in ‰ (thousandths of the canvas).
                </P>
                <Table
                    head={['Key', 'Does']}
                    mono={[0]}
                    rows={[
                        ['D', 'Show or hide the panel (or open /art-solace?debug)'],
                        ['R', 'A new random seed'],
                        ['L', 'Lock the seed: refresh keeps it, and the URL carries it as ?seed=…'],
                        ['S', 'Save the canvas as a PNG'],
                    ]}
                />
                <Table
                    head={['Folder', 'What you can force']}
                    rows={[
                        ['Seed', 'the seed itself, lock, animate build, copy link, save, and the rolled traits'],
                        ['Traits', 'Palette, Dunes, Sky, Margin, Brush, Dancers, Sandstorm, Misty (applied before the roll: may reshuffle)'],
                        ['Composition', 'flipX, skew, mistyLayout, margin'],
                        ['Warp', 'verticalCompression, warpFreqY, warpAmplY ‰, warpPhaseY'],
                        ['Dunes', 'nearY, farY, depthCurve, peakScale, special and smooth edges, ridge wobble, lean ‰, step ‰'],
                        ['Sand brush', 'core / slope / sky chances, blur, dots per frame, frames, dot size ‰, paper, ink, ink opacity'],
                    ]}
                />
                <Callout tone="tip">
                    Turn off <C>animate build</C> while tweaking: the piece then draws in one go after each change instead of pouring for a second.
                </Callout>
                <KeyIdea>Unticked shows the seed’s choice, ticked forces yours: explore a seed without losing it.</KeyIdea>
            </Section>

            <Section id="feature" n="03 · Adding a feature" title="Stars, without moving a single dune">
                <P>
                    Say you want to add stars to the sky. If the star positions came from the main stream, every dune and dot of every existing seed would shift. Give the feature its own stream,
                    seeded from the same seed, and draw it after the sand:
                </P>
                <Code file="art/scene.ts (an example, not in the source)" highlight={["createRandom(seed + ':stars')"]}>
                    {`// in buildScene(), after the dunes are placed
const starRand = createRandom(seed + ':stars');         // its own stream: nothing else moves
const stars = Array.from({ length: starRand.pick([0, 0, 40, 120]) }, () => ({
    x: starRand.next(),
    y: starRand.range(0, params.farY * 0.8),            // only above the back dunes
}));

// in drawFrame(), once the last frame is done
if (frame === params.frames - 1) for (const s of stars) ctx.fillRect(s.x * size, s.y * size, 2, 2);`}
                </Code>
                <KeyIdea>New feature, new stream: the old seeds never notice.</KeyIdea>
            </Section>

            <Section id="briefs" n="04 · Briefs" title="Three pieces to try">
                <Grid cols={3}>
                    <Card kicker="Brief 1 · CPU" title="Tide">
                        Replace the ridge walk with a single sine wave per layer and stack 20 layers. Keep the stripes and the three zones. Do the waves read as water or as dunes? What one number
                        changes that?
                    </Card>
                    <Card kicker="Brief 2 · GPU" title="Night pour" tint>
                        Start from the Living dunes shader. Use a rare dark palette, add a slow scan that pours the sand in again every 20 seconds, and let a few sky grains stay lit like stars.
                    </Card>
                    <Card kicker="Brief 3 · both" title="Your mark in sand">
                        Use Sand type with your logo. Pick a seed, roll three palettes from the bag with it, and export one PNG per palette: a seeded identity system.
                    </Card>
                </Grid>
                <KeyIdea>Change one ingredient at a time; the rest of the recipe carries the look.</KeyIdea>
            </Section>

            <Section id="check" n="05 · Checklist" title="Before you mint">
                <Checklist />
            </Section>

            <Section id="quiz" n="06 · Final quiz" title="All chapters, ten at random">
                <Quiz />
                <Where
                    files={[
                        { path: 'README.md', note: 'the rules' },
                        { path: 'debug/DebugPanel.tsx', note: 'the panel' },
                        { path: 'debug/seed.ts', note: 'lock + URL' },
                        { path: 'art/params.ts', note: 'what can vary' },
                    ]}
                />
            </Section>
        </>
    );
}
