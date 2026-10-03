'use client';

import LookLab from '../demos/LookLab';
import MaskLab from '../demos/MaskLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, TryThis, Where } from '../kit/ui';

export default function Masks() {
    return (
        <>
            <ChapterHead
                n="06"
                kicker="Cards are masks"
                title="The card moves; the picture stays put."
                lead={
                    <>
                        When a KPR card leans, turns or shrinks, the painting inside doesn’t tilt with it. It stays upright, as if the card were a window cut into the screen. That single decision
                        makes the motion feel heavy and filmic instead of “a photo on a spinning plane”.
                    </>
                }
            />

            <Section id="pinned" n="06.1" title="Sample the picture from the screen, not the card">
                <P>
                    Normally a texture is glued to its plane: turn the plane and the image turns with it. The card shader does something else. For every pixel it asks “where am I on the screen?”, then
                    looks that position up inside the card’s <strong>upright</strong> rectangle. The card’s turn and lean only change which pixels are inside the outline. The painting behind them
                    never rotates.
                </P>
                <MaskLab />
                <Code file="src/modules/pages/Kpr/gl/materials/notched.ts (main, trimmed)" highlight={['gl_FragCoord', 'fuv = (sp - uRect.xy)']}>
                    {`// The picture is pinned to the screen, not to the card: it is sampled from where this
// pixel is on screen inside the card's upright rect (uRect: centre + size in stage px).
vec2 fuv = uv;
if (uRect.z > 0.5) {
    vec2 sp = gl_FragCoord.xy / uView.zw * uView.xy - uView.xy * 0.5; // device px → stage px
    fuv = (sp - uRect.xy) / uRect.zw + 0.5;
}
// then cover-fit, zoom around the focus point, add the pointer parallax
vec2 puv = uFocus + (fuv - 0.5) * region / uZoom + uParallax;`}
                </Code>
                <Lens>
                    In Figma this is a <strong>frame with “clip content”</strong> whose image is not a child of the frame’s rotation: you rotate the frame, the image stays level. In After Effects it’s
                    a track matte: the card is the matte layer, the painting is a separate, unrotated layer underneath.
                </Lens>
                <TryThis
                    items={[
                        'Stop the animation and set the lean to 17°: the left picture is tilted, the right one is level. The right one reads as a window.',
                        'Turn the right card to 60°: its picture doesn’t squash. Only the outline gets narrower, like a door closing over a fixed backdrop.',
                        'Switch on “fixed frame” and shrink the size: the right card closes around a painting that doesn’t move or scale at all.',
                    ]}
                />
                <KeyIdea>Turn the outline, not the picture: the card is a window onto a still painting.</KeyIdea>
            </Section>

            <Section id="frame" n="06.2" title="Holding the painting still while the card changes">
                <P>
                    The <C>frame</C> field takes it one step further: it gives the picture a fixed rectangle of its own. The hero card uses it three times. While the girl’s card grows and turns away,
                    her picture stays exactly where it was. While the story card shrinks into a sliver, the story painting stays full screen behind it. While the portrait turns in, it is already in
                    its final place.
                </P>
                <Code file="src/modules/pages/Kpr/gl/choreo.ts (hero)" highlight={['s.frame']}>
                    {`// the girl's picture stays where it was while her card grows and turns away
const girlFrame = { ...r };
if (facing === 0 && (grow > 0 || f > 0)) s.frame = girlFrame;
else if (facing === 1) s.frame = full;            // the story stays full screen while its card shrinks
else if (facing === 2 && f2 < 1) s.frame = portraitRect;`}
                </Code>
                <Grid>
                    <Card kicker="Without a frame" title="The painting zooms with the card">
                        As the card shrinks, cover-fit scales the picture down too: the story would visibly shrink before it turns.
                    </Card>
                    <Card kicker="With a frame" title="The card closes over a still image" tint>
                        Only the window changes. That is what makes the hand-off from story to portrait feel like one continuous shot.
                    </Card>
                </Grid>
                <Callout tone="tip">
                    Two kinds of picture opt out: images whose shape is baked into their transparency (the ring portraits, the KEEPERS word). Their outline <em>is</em> the image, so it must stay glued
                    to the card.
                </Callout>
                <KeyIdea>Give the picture its own rectangle when the card must change but the shot must not.</KeyIdea>
            </Section>

            <Section id="look" n="06.3" title="The finishing layers">
                <P>
                    On top of the picture, the shader adds a few film-like layers. They are subtle on the page, so the demo lets you push each one far past the source’s value to see what it does, then
                    bring it back.
                </P>
                <LookLab />
                <Table
                    mono={[1]}
                    head={['Layer', 'Source value', 'What it does']}
                    rows={[
                        ['Wash', '0.36 · #c06cff', 'A screen-blended glow while a card changes scale (landing → card, handoffs). Lightens, never greys.'],
                        ['Grain', '0.03', 'noise.webp tiled at 512 px and jumped to a random offset every frame.'],
                        ['Flicker', '0.03', 'Brightness wobble read from a 1-px strip (flick.webp), like old film.'],
                        ['Dim', '0 → 0.25', 'Darkens cards turned away on the gallery ring.'],
                        ['Chroma', 'min(0.012, |vel| × 0.0035)', 'The red channel slides apart when you scroll fast.'],
                        ['Skew', '±0.06 × vel', 'Tableau cards shear slightly with scroll speed (the vertex shader shifts x by y).'],
                    ]}
                />
                <TryThis
                    items={[
                        'Switch the wash blend to “fade” at strength 0.6: the picture goes milky grey. Screen blend only ever pushes toward the glow colour.',
                        'Set grain to 0.3: you see the noise texture jumping. At the source’s 0.03 it just gives the paint a surface.',
                        'Drag scroll speed back and forth: the red fringe and the shear only appear in motion, so a still frame stays clean.',
                    ]}
                />
                <KeyIdea>Effects that react to speed disappear when you stop; still frames stay clean.</KeyIdea>
                <Where
                    files={[
                        { path: 'Kpr/gl/materials/notched.ts', note: 'uRect, wash, grain, chroma' },
                        { path: 'Kpr/gl/NotchedCard.ts', note: 'uRect from the card, SCROLL_LAG' },
                        { path: 'Kpr/gl/choreo.ts', note: 'frame, wash, skew' },
                    ]}
                />
            </Section>
        </>
    );
}
