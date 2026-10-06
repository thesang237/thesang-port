'use client';

import SandType from '../demos/SandType';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Steps, Term, TryThis, Where } from '../kit/ui';

export default function SandTypeChapter() {
    return (
        <>
            <ChapterHead
                n="10"
                kicker="Explore · Sand type"
                title="Words made of grains."
                lead={
                    <>
                        Solace gets its shapes from boundary maps, but the brush doesn’t care where the draw chance comes from. Feed it a picture instead, and any word, logo or photo can be poured as
                        sand. This exploration swaps the dunes for an image and keeps everything else.
                    </>
                }
            />

            <Section id="idea" n="01 · The idea" title="Darkness becomes chance">
                <P>
                    In the art, each zone has a draw chance. Here every grain cell reads the brightness of a picture at its position, and its darkness becomes the chance. Black letters keep nearly
                    every grain; white paper keeps almost none; greys in a photo keep some.
                </P>
                <SandType />
                <TryThis
                    items={[
                        <>Type your name. Then switch to “Sans black”: heavy type holds grain better than a thin serif.</>,
                        <>Raise erosion to 0.04 and lower its size to 4: the letters weather into dunes.</>,
                        <>Turn on “three zones, like the art” and load a photo: it becomes a Solace-style piece, posterised into core, slope and sky.</>,
                        <>Set the contrast curve to 3: only the darkest parts keep grain. At 0.4, mid-greys fill in.</>,
                    ]}
                />
                <KeyIdea>Any image is a map of draw chances: darkness in, grain out.</KeyIdea>
            </Section>

            <Section id="texture" n="02 · Words into the shader" title="Draw, upload, sample">
                <Steps
                    items={[
                        <>The words are drawn with the 2D canvas API into a hidden 1024 × 1024 canvas, black on white (an image is drawn to cover it instead).</>,
                        <>
                            That canvas is uploaded to the GPU as a <Term k="texture">texture</Term>. It is only re-uploaded when the words or image change, never per frame.
                        </>,
                        <>The shader samples it at each pixel’s position, like the dune shader looked up its baked maps.</>,
                    ]}
                />
                <Code file="SandType.tsx · paintSource (trimmed)" highlight={['measureText', 'fillText']}>
                    {`ctx.font = \`\${weight} 100px \${family}\`;
const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
const size = Math.min((100 * SIZE * 0.86) / widest, (SIZE * 0.8) / (lines.length * 1.05));
ctx.font = \`\${weight} \${size}px \${family}\`;     // fit: widest line = 86 % of the width
lines.forEach((l, i) => ctx.fillText(l, SIZE / 2, y(i)));`}
                </Code>
                <Callout tone="warn">
                    Draw the words only after <C>document.fonts.ready</C>: a canvas can’t wait for a web font, and would quietly use the fallback face.
                </Callout>
                <KeyIdea>The 2D canvas makes the picture once; the GPU reads it every frame.</KeyIdea>
            </Section>

            <Section id="tone" n="03 · Shaping the tone" title="A curve between darkness and chance">
                <P>
                    Raw darkness makes flat, grey-ish sand. A contrast curve (darkness to a power) pushes it: above 1, only strong darks keep grain and edges harden; below 1, midtones fill in. A small
                    floor (“paper grain”) keeps a few grains everywhere, the role the sky plays in Solace.
                </P>
                <Code file="TYPE_FRAG (GLSL)" lang="glsl" highlight={['pow(1.0 - lum, uGamma)', 'mix(uSky, 1.0, dark)']}>
                    {`float lum = dot(texture(uImage, q).rgb, vec3(0.299, 0.587, 0.114));  // brightness
float dark = pow(1.0 - lum, uGamma);                               // the contrast curve
float density = mix(uSky, 1.0, dark);                              // paper keeps a little grain
fragColor = vec4(mix(uPaper, uInk, inkAt(c, density)), 1.0);`}
                </Code>
                <Lens>Curves in Photoshop, applied before a halftone. The same image can read soft and photographic or bold and graphic depending on one bend.</Lens>
                <KeyIdea>Put a curve between the picture and the chance: that’s your contrast control.</KeyIdea>
            </Section>

            <Section id="erode" n="04 · Erosion" title="Read the picture from slightly the wrong place">
                <P>
                    Sand letters shouldn’t have perfect edges. Instead of disturbing the grains, the shader disturbs where it <em>reads</em> the picture: each pixel looks up a spot nudged by noise (
                    <Term k="domainWarp">domain warping</Term>). Near an edge, the nudge decides which side a grain belongs to, and the edge frays. Adding a push along the wind smears it in one
                    direction, like drift.
                </P>
                <Code file="TYPE_FRAG (GLSL)" lang="glsl" highlight={['fbm(p, 4)', 'c + uErode']}>
                    {`vec2 wind = vec2(cos(uWindDir), sin(uWindDir));
vec2 p = c * uErodeScale;
vec2 bend = vec2(fbm(p, 4), fbm(p + vec2(5.2, 1.3), 4));          // two noise fields: x and y
vec2 q = c + uErode * (bend + wind * abs(bend.x) * 1.5);          // read from here instead of c`}
                </Code>
                <Callout tone="meta">
                    This is the same move as Solace’s pull from chapter 06: don’t move the result, change where each pixel asks. The pour (“Pour ↓”) is the art’s top-to-bottom scan.
                </Callout>
                <KeyIdea>To roughen an edge, bend the lookup, not the shape.</KeyIdea>
                <Where
                    files={[
                        { path: 'art/scene.ts', note: 'the brush rule' },
                        { path: '../ArtSolaceLearn/kit/glsl.ts', note: 'GRAIN · NOISE' },
                        { path: '../ArtSolaceLearn/demos/SandType.tsx', note: 'this piece' },
                    ]}
                />
            </Section>
        </>
    );
}
