'use client';

import DofLab from '../demos/DofLab';
import SliceLab from '../demos/SliceLab';
import WeatherBlender from '../demos/WeatherBlender';
import { C, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function Fakes() {
    return (
        <>
            <ChapterHead
                n="10"
                kicker="Fakes"
                title="Three ways to fake depth, and the weather too."
                lead={
                    <>
                        The trial plots look like real crops seen from a drone, the field behind the stalk melts into a photographic blur, and the weather can turn stormy in two seconds. None of it is
                        simulated for real. Each is a cheap trick that only has to look right from where the camera is.
                    </>
                }
            />

            <Section id="slices" n="01 · Slices" title="Volume from a stack of flat pictures">
                <P>
                    Each plot is a stack of 5 to 7 transparent slices of crop from one <Term k="atlas">atlas</Term>, lifted 0.13 apart. From straight above they line up into one picture; as soon as
                    the camera tilts, the higher slices slide further than the lower ones and the crop gains real-looking volume. All the slices of all 1,600 plots are one{' '}
                    <Term k="instancing">instanced</Term> mesh.
                </P>
                <SliceLab />
                <Code file="engine/worlds/PlotsWorld.ts (trimmed)" highlight={['ELEV + g * (ELEV']}>
                    {`for (let g = 0; g < m.quads; g++) {                       // 5 or 7 slices per plot
    const idx = m.quads > 5 ? 12 - (g + 1) : 5 - (g + 1);  // which atlas frame
    base.set([x, y, ELEV + g * (ELEV + m.plus * 0.5)], h * 3);   // lift each slice (ELEV = 0.13)
    frame.set(FRAME(idx), h * 4);
}`}
                </Code>
                <Lens>A paper theatre: flat cut-outs on layers a few centimetres apart look three-dimensional the moment you move your head.</Lens>
                <TryThis
                    items={[
                        <>Set the gap to 0 and tilt: a flat sticker. Then 0.4: the layers separate into floating sheets. 0.13 sits between.</>,
                        <>Switch to “side x-ray” to see the slices as what they are: stacked planes.</>,
                        <>Set slices per plot to 1: only the bottom layer is left, and the field looks like a printed map.</>,
                    ]}
                />
                <KeyIdea>5–7 transparent slices, 0.13 apart: parallax turns flat crop pictures into volume.</KeyIdea>
            </Section>

            <Section id="dof" n="02 · Depth of field" title="Blur by distance, from the depth buffer">
                <P>
                    The stalk chapter renders its field at half resolution with a <Term k="depthBuffer">depth buffer</Term>. Three blur passes each take 8 samples on a rotated disk whose radius grows
                    with the distance from the focus depth. Then the front stalk is drawn on top, sharp, so the subject never blurs. Half resolution is fine: it ends up blurred anyway, and it’s a
                    quarter of the pixels.
                </P>
                <DofLab />
                <Code file="engine/worlds/StalkWorld.ts · blurFrag" lang="glsl" highlight={['float r =']}>
                    {`float depth = abs(focusPoint - readDepth(vUv));
float r = (minBlur + radius * depth) * k;              // k = 2.0, 1.414, 1.0 over the 3 passes
for (int i = 0; i < 8; i++) {
    vec2 p = vUv + vec2(cos(a), sin(a)) / iResolution * r;
    vec3 s = texture2D(tDiffuse, p).rgb;
    sum += s * s;                                       // average in squares: brighter, lens-like
    a += da;
}`}
                </Code>
                <TryThis
                    items={[
                        <>
                            Set minimum blur to 0 and move the focus from 0.02 to 0.08: the sharp band walks from the front plant into the far rows. The page keeps 10 px so the field never looks
                            crisp.
                        </>,
                        <>Switch to “depth buffer” and move the focus: the orange band is the depth that stays sharp.</>,
                        <>Set the blur passes to 1: you can see the 8 separate samples. Three rotated passes (24 samples) read as one smooth blur.</>,
                        <>Turn off “sharp plant on top”: there’s no hero in focus any more, just a blurry field.</>,
                    ]}
                />
                <KeyIdea>Blur radius = min + radius × |focus − depth|, three rotated 8-tap passes, then the subject drawn sharp on top.</KeyIdea>
            </Section>

            <Section id="weather" n="03 · Weather" title="Conditions are presets, blended">
                <P>
                    The “Run the tests” mode switches between conditions. Each is just a preset of numbers; picking one eases a set of weights to the new preset over 2.5 s (sine in-out), and every
                    value in the scene is the weighted sum. Slower states (wetness, sickness, dead leaves) creep toward their targets by at most 0.002 a step, so a drought takes seconds to set in.
                </P>
                <WeatherBlender />
                <Code file="engine/worlds/StalkWorld.ts · blendProps()" highlight={['this.from[k] +']}>
                    {`this.blendT = Math.min(1, this.blendT + dt / 2.5);
const e = 0.5 - 0.5 * Math.cos(Math.PI * this.blendT);           // sine in-out
for (let k = 0; k < 6; k++) this.amounts[k] = this.from[k] + (this.to[k] - this.from[k]) * e;
this.amounts.forEach((w, k) => {
    p.windPower += PROPS[k].windPower * w;                       // every value: a weighted sum
    p.sunBrightness += PROPS[k].sunBrightness * w;
    // … minBlur, plantSpacing, zoom, sunColor
});`}
                </Code>
                <TryThis
                    items={[
                        <>Pick storm, then drought straight away: the weights cross-fade, so for a moment it’s a dry storm. No special case needed.</>,
                        <>Watch “dead leaves” after picking drought: the weights arrive in 2.5 s, the leaves take several seconds more. Two speeds make it feel like time passing.</>,
                    ]}
                />
                <KeyIdea>
                    Weather = presets of numbers mixed by weights that ease over 2.5 s; <C>windPower</C> alone makes the storm.
                </KeyIdea>
                <Where
                    files={[
                        { path: 'engine/worlds/PlotsWorld.ts', note: 'slices, tilt-shift' },
                        { path: 'engine/worlds/StalkWorld.ts', note: 'depth of field, conditions' },
                        { path: 'dom/Hotspots.tsx', note: 'the conditions picker' },
                    ]}
                />
            </Section>
        </>
    );
}
