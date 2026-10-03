'use client';

import SdfXray from '../demos/SdfXray';
import ShapeLab from '../demos/ShapeLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Steps, Term, TryThis, Where } from '../kit/ui';

export default function Shape() {
    return (
        <>
            <ChapterHead
                n="03"
                kicker="The notched card"
                title="One shader draws every card shape."
                lead={
                    <>
                        The folder-tab card is KPR’s signature. Every card on the page, from the tiny launch cards to the full-screen story, is the same rectangle drawn by one{' '}
                        <Term k="shader">shader</Term>, with a handful of numbers deciding the radius, the stepped notch and the 45° corner cut.
                    </>
                }
            />

            <Section id="anatomy" n="03.1" title="Anatomy of the outline">
                <P>
                    Look closely at any card: a rounded rectangle, one corner where the edge steps down at 45° like the tab of a paper folder, and sometimes a corner sliced off at 45°. Every joint,
                    even the inner ones of the step, is softly rounded. The shape is never an image or an SVG mask; it is described by numbers so that each part can animate.
                </P>
                <ShapeLab />
                <TryThis
                    items={[
                        'Choose “Trailer card”, then turn the second notch on and off: that small step on the lower left edge is a second copy of the same notch maths.',
                        'Turn on “breathe”: the notch and the cut grow and shrink. On the page, the notch opens while the hero becomes a card and closes as cards go full screen.',
                        'Drag the depth to 120 with a short length: the step becomes a deep bite. The rounding stays under control because it is capped by the depth.',
                        'Set the width to 60: the automatic radius shrinks with the card (5.8 % of the short side) but never below 10.8 px.',
                    ]}
                />
                <KeyIdea>The card shape is numbers, not a picture, so every part of it can move.</KeyIdea>
            </Section>

            <Section id="sdf" n="03.2" title="Shapes as distances">
                <P>
                    The shader is asked one question for every pixel of the card’s rectangle: “how far are you from the edge?” Negative means inside, positive outside. That map of distances is a{' '}
                    <Term k="sdf">signed distance field</Term>. Keeping pixels below zero draws the shape; softening the edge over about one pixel gives clean <Term k="antialias">anti-aliasing</Term>{' '}
                    at any size.
                </P>
                <SdfXray />
                <Steps
                    items={[
                        <>
                            Start with a <strong>rounded box</strong>: the classic distance formula, radius included.
                        </>,
                        <>
                            Describe the <strong>notch</strong> as the area “above the step line <em>and</em> right of the 45° line”, in the corner’s own frame (the corner is mirrored so one formula
                            serves all four).
                        </>,
                        <>
                            Subtract it from the box with a <Term k="smax">smooth max</Term>, so the new joints come out rounded.
                        </>,
                        <>
                            Do the same for the <strong>45° corner cut</strong> and the optional second notch.
                        </>,
                    ]}
                />
                <Code file="src/modules/pages/Kpr/gl/materials/notched.ts (trimmed)" highlight={['smax(d, notchCut', 'float k = min']}>
                    {`float shape(vec2 p, vec2 hs) {
    float r = min(uRadius, min(hs.x, hs.y));
    float d = sdRoundBox(p, hs, r);                 // rounded box
    if (uNotch.w > 0.01) {
        // round the joints like the corners, but never more than 3/4 of the step's depth
        float k = min(r * 1.1, uNotch.w * 0.75);
        d = smax(d, notchCut(p, hs, uNotch, k), k);  // subtract the notch, rounded
    }
    if (uChamfer.y > 0.01) { /* 45° corner cut, same idea */ }
    return d;
}
// in main(): keep the inside, soften the edge over one pixel
float aa = max(fwidth(d), 1e-3);
float mask = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);`}
                </Code>
                <Lens>
                    It’s a boolean subtract in Figma followed by a corner radius on the new corners, except the “path” is a formula, so the radius, the notch and the cut can all be keyframed
                    independently and the edge stays razor sharp at any zoom.
                </Lens>
                <TryThis
                    items={[
                        'Turn off “smooth joints”: the two inner corners of the step become hard. That is a plain max.',
                        'Push “joint rounding” to 4: the straight edges of the step melt into a wave. That is why the source caps k at 0.75 × the depth.',
                        'Move the pointer across the edge: the distance flips sign exactly on the black line.',
                    ]}
                />
                <KeyIdea>Every pixel asks “how far am I from the edge?”; the answer draws the shape.</KeyIdea>
            </Section>

            <Section id="uniforms" n="03.3" title="Dials the choreography turns">
                <P>
                    The shape’s numbers are <Term k="uniform">uniforms</Term>: values handed to the shader from outside, the same for every pixel of that card. The choreography sets them each frame,
                    so a notch can open as a card arrives and close as it fills the screen.
                </P>
                <Code file="src/modules/pages/Kpr/gl/choreo.ts (hero, girl face)" highlight={['s.notch =', 's.chamfer =']}>
                    {`// while the landing painting becomes a card: the tab grows in, then settles into the intro shape
s.notch = [0, 1, lerp(lerp(0, 0.58, notchK), 0.52, k2) * r.h, lerp(lerp(0, 7 * u, notchK), 2.35 * u, k2)];
s.chamfer = [2, lerp(0, 2.6 * u, k2)];
s.radius = R * notchK; // full screen = square corners; as a card = rounded`}
                </Code>
                <Grid>
                    <Card kicker="Units" title="u = the site’s rem">
                        Depths and radii are written in <C>u</C> (10 px × viewport width / 1600, clamped 6.4–12 px), so the shapes scale with the screen like the reference.
                    </Card>
                    <Card kicker="Both faces" title="Shape in viewer space" tint>
                        The shape is evaluated in what you see, not the card’s own frame. A notch set “top right” stays top right after the card turns over (chapter 04).
                    </Card>
                </Grid>
                <Callout tone="warn">A notch with a tiny depth still costs a smooth max per pixel. The shader skips each part when its size is under 0.01 px, so “off” really is free.</Callout>
                <KeyIdea>The outline is part of the motion: notch, cut and radius animate like position.</KeyIdea>
                <Where
                    files={[
                        { path: 'Kpr/gl/materials/notched.ts', note: 'the shader' },
                        { path: 'Kpr/gl/NotchedCard.ts', note: 'auto radius, uniforms' },
                        { path: 'Kpr/gl/choreo.ts', note: 'shapes per card' },
                    ]}
                />
            </Section>
        </>
    );
}
