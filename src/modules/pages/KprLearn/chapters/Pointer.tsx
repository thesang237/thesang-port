'use client';

import DampVsLerp from '../demos/DampVsLerp';
import LagLab from '../demos/LagLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Pointer() {
    return (
        <>
            <ChapterHead
                n="07"
                kicker="Pointer layers"
                title="Two follow speeds make the depth."
                lead={
                    <>
                        Move your mouse on /kpr and every card leans toward it while the painting inside drifts the other way, a little quicker. Nothing is really 3D about that gap in timing, yet it
                        is the strongest depth cue on the page.
                    </>
                }
            />

            <Section id="layers" n="07.1" title="The frame is heavy, the picture is light">
                <P>
                    Each card follows the pointer twice. The <strong>frame</strong> leans toward it (a small turn around its vertical and horizontal axes) and takes its time: it closes the gap at
                    about 3.2 per second. The <strong>picture</strong> inside moves against the pointer at about 5.5 per second. For a painted scene that means its camera orbits (chapter 05); for a
                    flat image, the picture slides a little inside the window. Because the two layers arrive at different moments, your eye reads them as separate distances.
                </P>
                <LagLab />
                <Code file="src/modules/pages/Kpr/gl/NotchedCard.ts (apply, trimmed)" highlight={['FRAME_LAMBDA', 'INNER_LAMBDA', 'this.tilt.y']}>
                    {`const FRAME_LAMBDA = 3.2;  // the frame follows slower…
const INNER_LAMBDA = 5.5;  // …than the painting inside
// per card: a seeded ±15 % so a group never moves in lockstep
this.frameLambda = FRAME_LAMBDA * (0.85 + 0.3 * k);

// every frame (even while hidden, so a card never jumps when it appears)
this.tp.x = damp(this.tp.x, pointerX, this.frameLambda, dt);
this.ip.x = damp(this.ip.x, pointerX, this.innerLambda, dt);
// frame: lean toward the pointer on top of the choreography
this.tilt.y = this.tp.x * s.tiltY;               // ±0.16 rad at the screen edge
this.mesh.rotation.set(s.rx + this.tilt.x, s.ry + this.tilt.y, s.rz);
// flat pictures: slide against the pointer (painted scenes orbit their camera instead)
u.uParallax.value.set(-this.ip.x * shift, -this.ip.y * shift);`}
                </Code>
                <Lens>
                    In After Effects you’d parent the picture to a null that follows the cursor with a shorter “lag” than the card. In Figma prototypes, it’s two layers on the same hover with
                    different Smart Animate durations. The rule of thumb: <strong>far = slow, near = fast</strong> (or the reverse), never the same.
                </Lens>
                <TryThis
                    items={[
                        'Turn on “same speed”: the card and picture move as one sticker. The window illusion is gone.',
                        'Drop the frame λ to 0.8: the card drifts like it’s under water. Raise it to 15: it twitches with every hand tremor.',
                        'Drag “card covers” past 85 %: the lean disappears. A full-screen card that leaned would show its edges.',
                    ]}
                />
                <Callout tone="tip">Cards keep following the pointer while invisible. When a card appears, its lean is already where your pointer is; it never snaps into place.</Callout>
                <KeyIdea>Same pointer, two speeds: the gap between them is the depth you feel.</KeyIdea>
            </Section>

            <Section id="damp" n="07.2" title="Smoothing that ignores the frame rate">
                <P>
                    “Move 10 % of the way every frame” is the classic smooth follow. The catch: a 120 Hz screen has twice as many frames per second as a 60 Hz one, so the same code feels twice as fast
                    there. <Term k="damp">damp</Term> fixes it by working in time: it closes the share of the gap that matches how long the frame actually took.
                </P>
                <DampVsLerp />
                <Code file="src/modules/pages/Kpr/scroll/timeline.ts" highlight={['Math.exp']}>
                    {`/** frame-rate independent smoothing toward a target */
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));`}
                </Code>
                <Table
                    mono={[0, 1]}
                    head={['Where', 'λ', 'Feels like']}
                    rows={[
                        ['card frame lean', '3.2 (±15 %)', 'heavy, considered'],
                        ['picture inside', '5.5 (±15 %)', 'lighter, quicker'],
                        ['film.spx (pointer for the HUD)', '3.5', 'calm'],
                        ['film.vel (scroll speed for effects)', '10', 'responsive but not jittery'],
                    ]}
                />
                <TryThis
                    items={[
                        'Switch to “lerp per frame” and look at the three curves splitting apart. That is how a site feels different on a ProMotion laptop.',
                        'Back on damp, drag λ: the three curves always stay on top of each other.',
                    ]}
                />
                <KeyIdea>Smooth in time, not in frames: use 1 − e^(−λ·dt).</KeyIdea>
                <P>
                    One more knob lives in the choreography: <C>settleTilt</C> fades the lean out on big cards, and every card gets its own <C>tiltX</C>/<C>tiltY</C> so the ring cards (tilt 0) don’t
                    lean at all.
                </P>
                <Where
                    files={[
                        { path: 'Kpr/gl/NotchedCard.ts', note: 'two lambdas, tilt, uParallax' },
                        { path: 'Kpr/gl/PaintedScene.ts', note: 'camera orbit for scenes' },
                        { path: 'Kpr/scroll/timeline.ts', note: 'damp' },
                        { path: 'Kpr/gl/choreo.ts', note: 'settleTilt' },
                    ]}
                />
            </Section>
        </>
    );
}
