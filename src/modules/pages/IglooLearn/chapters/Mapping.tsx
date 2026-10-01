'use client';

import EaseGallery from '../demos/EaseGallery';
import RangeMapper from '../demos/RangeMapper';
import ScrubWords from '../demos/ScrubWords';
import StaggerWindows from '../demos/StaggerWindows';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Steps, Term, TryThis, Where } from '../kit/ui';

export default function MappingChapter() {
    return (
        <article>
            <ChapterHead
                n="02"
                kicker="Progress mapping"
                title="Everything is a number from 0 to 1."
                lead={
                    <>
                        This is the most useful idea in the whole guide. Once you can turn “how far through something” into <Term k="progress">progress</Term> and progress into any property, you can
                        build almost every scroll effect on the web — without memorising any library.
                    </>
                }
            />

            <Section id="recipe" n="2.1" title="The four-step recipe">
                <P>Any scroll-driven change — fade, slide, camera move, brick explosion — is the same four steps:</P>
                <Steps
                    items={[
                        <>
                            <strong>Normalise</strong> — where are we inside the window? <C>(value − start) / (end − start)</C>
                        </>,
                        <>
                            <strong>Clamp</strong> — keep it between 0 and 1, so before the window it’s 0 and after it’s 1. <C>clamp(x, 0, 1)</C>
                        </>,
                        <>
                            <strong>Ease</strong> — reshape the straight line into a curve with personality. <C>ease(x)</C>
                        </>,
                        <>
                            <strong>Lerp</strong> — turn 0..1 into real units: pixels, degrees, opacity, a camera position. <C>lerp(from, to, x)</C>
                        </>,
                    ]}
                />
                <RangeMapper />
                <KeyIdea>Normalise → clamp → ease → lerp. Every scroll effect you have ever admired is these four steps with different numbers.</KeyIdea>
                <Lens>
                    The window is a keyframe range on a timeline. Start = first keyframe, end = second keyframe, the ease is the graph-editor curve, and from/to are the two keyframe values. You just
                    drew an After Effects keyframe pair with maths.
                </Lens>
            </Section>

            <Section id="helpers" n="2.2" title="The helpers, in the real source">
                <P>
                    Igloo’s <C>utils/math.ts</C> is 100 lines and holds all of it. <Term k="smoothstep">smoothstep</Term> is the favourite — it does normalise, clamp and a soft S-ease in a single
                    call, which is why it appears in almost every world.
                </P>
                <Code file="utils/math.ts">{`export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
    const t = clamp((x - e0) / (e1 - e0));   // normalise + clamp
    return t * t * (3 - 2 * t);              // soft S-curve
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);`}</Code>
                <Code file="canvas/IglooWorld.tsx — the intro network fades while the igloo builds">{`// visible at intro 0.25, gone by 0.75 — one line, no timeline needed
const net = 1 - smoothstep(0.25, 0.75, intro);
lineMaterial.opacity = net * 0.65;`}</Code>
            </Section>

            <Section id="eases" n="2.3" title="Easing is personality">
                <P>
                    Same distance, same duration, a different curve — and the move feels cheap, premium, playful or heavy. Igloo uses a small, consistent set. Notice the pattern:{' '}
                    <strong>expo.out for anything that appears</strong>, <strong>inOut for anything that travels</strong>, and <strong>none on the scroll timeline itself</strong>.
                </P>
                <EaseGallery />
            </Section>

            <Section id="stagger" n="2.4" title="Stagger by data: one number, many timings">
                <P>
                    The igloo has ~150 bricks but only two numbers drive them: <C>intro</C> (0→1, bricks fly in) and <C>explode</C> (0→1, bricks fly out). The trick is that every brick computes its{' '}
                    <strong>own window</strong> from that one number. Its delay comes from its height on the dome, plus a pinch of randomness.
                </P>
                <StaggerWindows />
                <Code file="canvas/IglooWorld.tsx (per brick, every frame)" highlight={['delayIn', 'delayOut']}>{`// intro: fly in bottom → top
const delayIn = br.h01 * 0.5 + br.rand * 0.14;          // h01 = height on the dome, 0..1
const pin = easeOutCubic(clamp((intro - 0.12 - delayIn * 0.5) / 0.42));
position.copy(br.start).lerp(br.pos, pin);               // from scattered → home

// scroll: explode top → bottom (reverse order)
const delayOut = (1 - br.h01) * 0.42 + br.rand * 0.12;
const pe = clamp((explode - delayOut) / 0.46);
const e = pe * pe * (3 - 2 * pe);                        // smoothstep ease
position.addScaledVector(br.fly, e);                      // push along its own fly vector`}</Code>
                <TryThis
                    items={[
                        'Set spread to 0: everything moves at once. It looks like a single object, not 150 bricks.',
                        'Set jitter to 0 with bottom → top: rows move in perfect bands — mechanical. Add 0.14 back and it becomes physical.',
                        'Switch to explode + top → bottom. That is exactly the scroll moment on Igloo.',
                    ]}
                />
                <Callout>
                    The same pattern powers the particle colony (each of 65,536 particles has a random 0..1 used as its delay) and the crystal HUD (each label line has a stagger). Data-driven stagger
                    scales to any count without writing more animation code.
                </Callout>
            </Section>

            <Section id="reading" n="2.5" title="Scroll-scrubbed reading">
                <P>
                    A classic editorial effect, built entirely from the recipe: each word gets a position along the scroll (<C>i / n</C>), and lights up as progress passes it. There’s no animation
                    library involved — only mapping.
                </P>
                <ScrubWords />
                <Where files={[{ path: 'utils/math.ts' }, { path: 'canvas/IglooWorld.tsx', note: 'brick windows' }, { path: 'canvas/colonySim.ts', note: 'morphOf(rnd)' }]} />
            </Section>
        </article>
    );
}
