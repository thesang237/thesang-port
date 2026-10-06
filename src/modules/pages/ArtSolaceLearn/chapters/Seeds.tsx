'use client';

import OrderLab from '../demos/OrderLab';
import SeedLab from '../demos/SeedLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Steps, Term, TryThis, Where } from '../kit/ui';

export default function Seeds() {
    return (
        <>
            <ChapterHead
                n="01"
                kicker="Seeds"
                title="Same word, same artwork, forever."
                lead={
                    <>
                        Generative art has a strange promise: endless variety, yet every piece can be rebuilt exactly. The trick is that the randomness isn’t random at all. It is a long list of
                        numbers, fully decided by one piece of text.
                    </>
                }
            />

            <Section id="promise" n="01 · The promise" title="Random, but repeatable">
                <P>
                    On <Term k="fxhash">fxhash</Term>-style platforms each collector gets a random hash, and the artwork has to turn that hash into one unique piece that looks the same on every
                    screen, today and in ten years. So the code never calls <C>Math.random()</C>. It uses a <Term k="stream">random stream</Term> started from the <Term k="seed">seed</Term>.
                </P>
                <SeedLab />
                <TryThis
                    items={[
                        <>Switch between “solace” and “Solace”: one capital letter, a different piece.</>,
                        <>Type a seed, change it, then type it back: the original returns, grain for grain.</>,
                        <>Watch the first bar of the stream as you type: it alone picks the palette.</>,
                    ]}
                />
                <KeyIdea>The seed is the artwork: everything else is a recipe that unfolds it.</KeyIdea>
            </Section>

            <Section id="how" n="02 · How" title="A hash, then a stream">
                <P>Two tiny, well-known algorithms do the work:</P>
                <Steps
                    items={[
                        <>
                            <strong>cyrb128</strong> is a <Term k="hash">hash</Term>: it scrambles the seed text into four 32-bit numbers. Any change to the text changes all four.
                        </>,
                        <>
                            <strong>sfc32</strong> (“small fast counting”) takes those four numbers as its starting state. Each call mixes the state and returns a number between 0 and 1.
                        </>,
                        <>
                            Helpers turn that into what the art needs: <C>range(lo, hi)</C>, <C>pick(list)</C>, <C>chance(p)</C> and a bell-curve <C>gaussian()</C>.
                        </>,
                    ]}
                />
                <Code file="art/random.ts (trimmed)" highlight={['sfc32(...hashSeed(seed))', 'range:', 'pick:', 'chance:']}>
                    {`export function createRandom(seed: string): Random {
    const next = sfc32(...hashSeed(seed));      // hash the text, start the stream
    return {
        next,                                     // 0 ≤ n < 1
        range: (lo, hi) => lo + next() * (hi - lo),
        pick: (items) => items[Math.floor(next() * items.length)],
        chance: (p) => next() < p,                // true with probability p
        gaussian: makeGaussian(next),
    };
}`}
                </Code>
                <Lens>
                    A shuffled deck of cards. The seed is how you shuffled it; dealing from the top gives the same cards in the same order every time. You can’t peek at card 50 without dealing the 49
                    before it.
                </Lens>
                <KeyIdea>Hash the text into a starting state, then deal numbers off the top, always in the same order.</KeyIdea>
            </Section>

            <Section id="two" n="03 · Two streams" title="Traits first, then everything else">
                <P>
                    The art uses two streams. The seed’s own stream rolls the traits. Then its <em>next</em> number (× 1,000,000,000) becomes the seed of a second stream that rolls the scene and draws
                    the sand. That keeps the trait list readable without drawing anything, and nothing in the drawing can disturb it.
                </P>
                <Code file="art/scene.ts" highlight={['renderSeed']}>
                    {`const traitRand = createRandom(seed);                  // stream 1: traits
const traits = rollTraits(traitRand);

const renderSeed = 1e9 * traitRand.next();              // its next number…
const rand = createRandom(String(renderSeed));          // …seeds stream 2: everything else
const noise = createNoise(renderSeed);                  // (and the Perlin noise)`}
                </Code>
                <KeyIdea>Stream one names the piece; stream two paints it.</KeyIdea>
            </Section>

            <Section id="rule" n="04 · The one rule" title="Never insert a call in the middle">
                <P>
                    Because numbers are dealt in order, every call is part of every seed. Add one extra <C>rand.next()</C> somewhere and every choice after it receives the number meant for the one
                    before. Old seeds silently become different pictures.
                </P>
                <OrderLab />
                <P>
                    That is why <C>params.ts</C> still contains lines marked <C>⟲ legacy</C>. The original sketch used those numbers for clouds, a sun and sand lines this port doesn’t draw. Each still
                    takes its number, so the dunes stay identical to the original.
                </P>
                <Code file="art/params.ts (excerpt)" highlight={['⟲']}>
                    {`const flipX = rand.chance(0.2);

// ⟲ legacy draws: the original art used these for features this port doesn't draw.
//   They still take their random numbers so every seed keeps its original dunes.
if (!(sky === 'Starry' || sky === 'Wool')) rand.next(); // ⟲ isNoisyDark
if (!(sky === 'Beam' || ... || skyDensity < 0.6)) rand.next(); // ⟲ isSandLines

const blur = numPeaks >= 6 && rand.chance(0.15);`}
                </Code>
                <Callout tone="warn">
                    The refactor of this artwork was checked exactly this way: 57 seeds were drawn before and after, every dot hashed, and the two lists compared. Identical. Do the same whenever you
                    touch the random calls.
                </Callout>
                <Callout tone="tip" title="Adding a feature safely">
                    Give it its own stream: <C>{`createRandom(seed + ':stars')`}</C>. It is still fully decided by the seed, but it can’t shift anything else.
                </Callout>
                <KeyIdea>Every random call is part of every seed: add features from a separate stream, never in the middle.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/random.ts', note: 'hash, stream, helpers' },
                        { path: 'art/scene.ts', note: 'two streams' },
                        { path: 'art/params.ts', note: '⟲ legacy draws' },
                        { path: 'debug/seed.ts', note: 'lock + URL' },
                    ]}
                />
            </Section>
        </>
    );
}
