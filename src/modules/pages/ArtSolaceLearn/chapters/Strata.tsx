'use client';

import Strata from '../demos/Strata';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function StrataChapter() {
    return (
        <>
            <ChapterHead
                n="11"
                kicker="Explore · Strata"
                title="Warped noise, sliced into rock."
                lead={
                    <>
                        The original sketch had render modes called Banners and Modulo that this port never drew: they sliced the scene into bands. This exploration takes that idea and runs with it: a
                        landscape of folded rock, cut into layers, each layer painted with Solace’s three zones.
                    </>
                }
            />

            <Section id="idea" n="01 · The idea" title="Three ideas from this guide, combined">
                <P>
                    Nothing in this piece is new to you. The land is noise (chapter 03), bent by more noise. The layers are the Sandstorm trick, slicing a smooth field into bands. The look is the sand
                    brush (chapter 07): every band rolls a zone and keeps grains with that zone’s chance.
                </P>
                <Strata />
                <TryThis
                    items={[
                        <>Set warp to 0: plain, polite noise hills. Bring it back to 5: marbled, geological folds. That one dial is the whole look.</>,
                        <>Set tilt to 0 and bands to 30: a topographic map. Tilt 3 and bands 6: canyon walls.</>,
                        <>Put contour line to 0 and lit face to 1: no lines at all, the layers read only through grain, like the dunes.</>,
                        <>Press Drift: the rock flows slowly, like sand moving through an hourglass.</>,
                    ]}
                />
                <KeyIdea>Most generative pieces are three old tricks combined in a new order.</KeyIdea>
            </Section>

            <Section id="warp" n="02 · Domain warping" title="Noise of noise of noise">
                <P>
                    <Term k="domainWarp">Domain warping</Term> feeds noise coordinates that were themselves moved by noise. One layer bends the hills; a second bends the bend. Smooth hills fold into
                    shapes that look like marble, smoke or rock strata. The technique is Inigo Quilez’s, and it is one of the most used in shader art.
                </P>
                <Code file="STRATA_FRAG (GLSL)" lang="glsl" highlight={['uWarp * q', 'uWarp * r']}>
                    {`float height(vec2 p, float t) {
    vec2 q = vec2(fbm(p, n), fbm(p + vec2(5.2, 1.3), n));                  // a field of offsets
    vec2 r = vec2(fbm(p + uWarp * q + vec2(1.7, 9.2) + 0.15 * t, n),       // offsets of the offsets
                  fbm(p + uWarp * q + vec2(8.3, 2.8) - 0.126 * t, n));
    return fbm(p + uWarp * r, n);                                         // the land
}`}
                </Code>
                <Lens>After Effects: Turbulent Displace applied to a Fractal Noise layer, then displaced again. Each pass makes the shapes more liquid.</Lens>
                <KeyIdea>Bend the input of noise with more noise and smooth hills become folded rock.</KeyIdea>
            </Section>

            <Section id="slice" n="03 · Slicing" title="floor and fract">
                <P>
                    A smooth height h becomes layers with two functions (<Term k="fract">floor and fract</Term>). Multiply by the number of bands, then <C>floor</C> gives the layer’s number and{' '}
                    <C>fract</C> says where you are inside it, from 0 at one edge to 1 at the other. A thin slice of fract near 0 is a contour line; fract itself is a gradient across each band.
                </P>
                <Code file="STRATA_FRAG (GLSL)" lang="glsl" highlight={['floor(b)', 'fract(b)', 'f < uLine']}>
                    {`float b = h * uBands;
float band = floor(b);                          // which layer
float f = fract(b);                             // where inside it, 0 → 1
density *= mix(1.0, 0.35 + 0.65 * f, uFace);    // each layer shades across itself
if (f < uLine) density = 1.0;                   // the layer's edge: a solid line`}
                </Code>
                <Callout tone="meta">
                    The Sandstorm trait (chapter 03) does exactly this on the CPU: <C>noise % 0.1 {'<'} 0.005</C> is “fract of noise × 10 is under 0.05”: a contour line.
                </Callout>
                <KeyIdea>floor picks the layer, fract places you inside it: any smooth value becomes strata.</KeyIdea>
            </Section>

            <Section id="zones" n="04 · Zones per band" title="Every layer rolls its dice">
                <P>
                    In Solace each dune is placed by the seed. Here each band is given a zone by hashing its number, the GPU’s version of rolling dice. Shares decide the odds: with core 0.25 and slope
                    0.45, a quarter of the layers are dark cores, almost half are pale lit slopes, the rest are sky. The chances inside each zone are Solace’s: 1, 0.1 and the sky’s.
                </P>
                <Code file="STRATA_FRAG (GLSL)" lang="glsl" highlight={['hash12(vec2(band']}>
                    {`float roll = hash12(vec2(band, 7.31));          // this layer's die: same every frame
int zone = roll < uShare.x ? 0 : roll < uShare.x + uShare.y ? 1 : 2;
float density = zone == 0 ? uDensity.x : zone == 1 ? uDensity.y : uDensity.z;`}
                </Code>
                <KeyIdea>Hash a band’s number and it gets a fixed, random role, like a trait for each layer.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/traits.ts', note: 'Render: Banners, Modulo' },
                        { path: 'art/dunes.ts', note: 'the sandstorm contour' },
                        { path: '../ArtSolaceLearn/demos/Strata.tsx', note: 'this piece' },
                    ]}
                />
            </Section>
        </>
    );
}
