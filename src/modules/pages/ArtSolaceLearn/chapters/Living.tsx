'use client';

import LivingDunes from '../demos/LivingDunes';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, TryThis, Where } from '../kit/ui';

export default function Living() {
    return (
        <>
            <ChapterHead
                n="09"
                kicker="Explore · Living dunes"
                title="Let the wind back in."
                lead={
                    <>
                        The original is a still: it pours in once and stops. On the GPU every frame is free, so the same dunes can breathe. This first exploration adds one ingredient, time, and feeds
                        it into three dials the art already has.
                    </>
                }
            />

            <Section id="idea" n="01 · The idea" title="Time is just another dial">
                <P>
                    Nothing new is invented here. Each moving part is an existing number of the artwork, now changing with the clock: the horizon wave’s phase, the Dancers sway, and the seed of the
                    grain’s dice.
                </P>
                <LivingDunes />
                <TryThis
                    items={[
                        <>Set re-throws to 0 and wind to 0.1: frozen grain sliding sideways looks like a camera pan, not wind. Bring re-throws back and it becomes blowing sand.</>,
                        <>Push ripple to 0.12 and ripple speed to 3: the dunes turn liquid. Calm needs small numbers.</>,
                        <>Try seed r29 (a Dancers seed): its sway was baked in, and the ripple moves on top of it.</>,
                    ]}
                />
                <KeyIdea>Animate a parameter the piece already has, and it moves in its own language.</KeyIdea>
            </Section>

            <Section id="what" n="02 · What moves" title="Three clocks">
                <Table
                    head={['What you see', 'Uniform', 'Driven by']}
                    mono={[1]}
                    rows={[
                        ['The land rolls', 'uPhaseY', 'seeded phase + time × roll speed'],
                        ['Ridges ripple', 'uSwayPhase (uSway)', 'the Dancers sway, with a moving phase'],
                        ['Sand blows', 'grain seed, drift, streak', 'dice re-thrown n times a second, cells sliding with the wind'],
                        ['Light breathes', 'slope density', 'a slow sine per dune'],
                    ]}
                />
                <Code file="demos/LivingDunes.tsx (the frame function)" highlight={['t * p.roll', 't * p.swaySpeed']}>
                    {`(f, t) => {
    f.set('uPhaseY', scene.params.warpPhaseY + t * p.roll);   // the land rolls
    f.set('uSway', (scene.traits.Dancers ? 0.15 : 0) + p.sway);
    f.set('uSwayPhase', t * p.swaySpeed);                     // ridges ripple
    f.set('uWind', p.wind);                                   // used by the grain below
}`}
                </Code>
                <Lens>In After Effects terms: three keyframe-free properties driven by the time expression. The shader is the comp; the uniforms are its exposed properties.</Lens>
                <KeyIdea>Every moving part is phase or seed plus time × speed.</KeyIdea>
            </Section>

            <Section id="wind" n="03 · Blowing sand" title="Re-throw the dice, slide the cells">
                <P>
                    Two tricks make grain look blown rather than boiling. The cells of the sky grain slide sideways (<C>drift</C>) and are stretched along the wind (<C>stretch</C>), so each grain
                    becomes a short streak. And the dice are re-thrown a few times a second (<C>floor(t × flicker)</C> as the seed), so grains appear and vanish instead of sliding like a printed
                    texture.
                </P>
                <Code file="LIVING_FRAG (GLSL)" lang="glsl" highlight={['c + drift', 'floor(t * uFlicker)']}>
                    {`float inkAt(vec2 c, float density, vec2 drift, float stretch, float seed) {
    vec2 cell = floor((c + drift) / (uDotSize * vec2(stretch, 1.0)));  // slide + stretch the cells
    ...
}
float seed = floor(t * uFlicker);                                   // a new throw, n times a second
ink = inkAt(c, uDensity.z, vec2(-t * uWind, 0.0), uStreak, seed);    // sky only`}
                </Code>
                <Callout tone="tip">
                    Stretching a cell makes it bigger, so it would catch more dots and get darker. The shader multiplies the tries by the same stretch to keep the sky’s tone unchanged: change a shape,
                    then correct its density.
                </Callout>
                <KeyIdea>Motion that reads as wind: move the texture, but also keep re-rolling it.</KeyIdea>
            </Section>

            <Section id="calm" n="04 · Keeping it calm" title="Slow is the point">
                <P>
                    Solace is a quiet piece. The defaults move slowly on purpose: a full horizon cycle takes almost a minute. For readers who set “reduce motion” in their system, the demo starts
                    paused and only plays when asked. The same rule applies if you ever ship this: motion should be offered, not imposed.
                </P>
                <KeyIdea>Generative motion should feel like weather: slow, continuous, and easy to stop.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/warp.ts', note: 'warpPhaseY' },
                        { path: 'art/dunes.ts', note: 'the Dancers sway' },
                        { path: '../ArtSolaceLearn/demos/LivingDunes.tsx', note: 'this piece' },
                    ]}
                />
            </Section>
        </>
    );
}
