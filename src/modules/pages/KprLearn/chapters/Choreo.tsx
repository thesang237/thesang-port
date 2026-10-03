'use client';

import HeroGraph from '../demos/HeroGraph';
import TweensVsFormula from '../demos/TweensVsFormula';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Choreo() {
    return (
        <>
            <ChapterHead
                n="02"
                kicker="Choreography"
                title="Every card is a formula of time."
                lead={
                    <>
                        The most important decision in /kpr: no animation remembers anything. Each frame, every card is wiped back to a blank state and rebuilt from the film time. That one rule is why
                        the page can be scrubbed, reversed and jumped around without ever breaking.
                    </>
                }
            />

            <Section id="pure" n="02.1" title="Rebuilt from scratch, every frame">
                <P>
                    Many scroll sites start a tween when the scroll crosses a point: “at 40 %, slide the card in over 0.8 s”. That works when you scroll slowly and forwards. Scroll fast, stop half
                    way, or go back, and the tweens overlap, finish when they shouldn’t, or fight each other. /kpr writes each card as a <Term k="pure">pure function</Term> of time instead.
                </P>
                <TweensVsFormula />
                <Code file="src/modules/pages/Kpr/gl/choreo.ts (pattern)" highlight={['reset(s)', 'seg(t']}>
                    {`export function choreograph(c: Cast) {
    const t = film.view;               // the film clock, nothing else
    {
        const s = c.introSmall.state;
        reset(s);                      // back to a blank card: no memory of last frame
        const r = anchor('intro-small', vw, vh, [0.073, 0.323, 0.148, 0.155]);
        const k = out(seg(t, 2.05, 2.95));          // arrive
        const o = easeIn(sub(t, W.introOut, 0, 0.3)); // leave
        rect(s, r);
        s.y += lerp(-0.06 * vh, 0, k) + o * 0.05 * vh;
        s.opacity = k * (1 - o);
    }
    // … the same for every card
}`}
                </Code>
                <Lens>
                    Tweens fired on scroll are like playing a pre-rendered clip whenever a trigger fires. A pure function is like a <strong>keyframed layer</strong>: scrub anywhere and the layer is
                    exactly where its keyframes say, because its position is computed from the playhead, not from the last frame.
                </Lens>
                <TryThis
                    items={[
                        'Press “shake” with tween length 2 s: the left card ends up somewhere the storyboard never says. The right one is spot on.',
                        'Set tween length to 0.1 s and scrub slowly: the left lane now looks fine. Fast tweens hide the problem until someone scrolls quickly.',
                        'Stop the playhead in the middle of a window (t = 0.3): the right card stops half way, the left one always finishes its move.',
                    ]}
                />
                <KeyIdea>No memory, no drift: rebuild every card from the clock each frame.</KeyIdea>
            </Section>

            <Section id="state" n="02.2" title="A card’s property sheet">
                <P>
                    Each card has a <C>CardState</C>: a flat list of numbers the choreography writes and the card reads once per frame. It is the card’s “layer properties” panel. Because it is only
                    numbers, it costs nothing to rewrite 45 of them every frame.
                </P>
                <Table
                    mono={[0]}
                    head={['Field', 'Means', 'Design word']}
                    rows={[
                        ['x, y, z, w, h', 'Centre and size in screen pixels (y up, origin at the centre)', 'Position + size'],
                        ['rx, ry, rz', 'Turn around the horizontal, vertical and depth axes', '3D rotation'],
                        ['radius, notch, notch2, chamfer', 'The outline (chapter 03)', 'Corner radius + the folder tab'],
                        ['opacity, wash, dim', 'Fade, glow colour, darkening', 'Opacity + colour overlay'],
                        ['zoom, fx, fy, view', 'How the picture sits inside (chapters 05–06)', 'Image crop / camera'],
                        ['tiltX, tiltY, parallax', 'How much the card follows the pointer (chapter 07)', 'Hover lean'],
                        ['frame', 'A fixed rectangle for the picture while the card changes', 'Pinned image in a mask'],
                        ['order', 'Who is drawn on top', 'Layer order'],
                    ]}
                />
                <KeyIdea>A card is a list of numbers; the choreography fills it in, the shader draws it.</KeyIdea>
            </Section>

            <Section id="journey" n="02.3" title="Building a journey by chaining blends">
                <P>
                    The hero card has the longest journey on the page. It is written as a chain: start from a rectangle, blend it toward the next target by an eased amount, then blend the result
                    toward the next, and so on. Every link has its own window. When a window hasn’t started, its blend amount is 0 and that link changes nothing.
                </P>
                <Code file="src/modules/pages/Kpr/gl/choreo.ts (hero, trimmed)" highlight={['mixRect(big, charRect', 'mixRect(mixRect(r, tall', 'mixRect(r, sliver', 'ringFront, gIn']}>
                    {`// 1 · landing → card: left edge pulls in first, then the right
const big = fromEdges(lerp(-vw / 2, -0.29 * vw, kL), lerp(vw / 2, 0.34 * vw, kR), vh / 2, -vh / 2);
let r = mixRect(big, charRect, io(seg(t, W.introCardsIn)));     // → the intro card slot
// 3 · grow + lean, then a half turn onto the story, opening to full screen
r = mixRect(mixRect(r, tall, grow), full, io(clamp01(f * 2 - 1)));
s.ry = lerp(-0.32 * a, -Math.PI, f);
// 5 · shrink into a sliver, keep turning onto the portrait
r = mixRect(r, sliver, io(seg(t, SHRINK)));
r = mixRect(r, portraitRect, ease.smooth(f2));
s.ry -= Math.PI * f2;
// 6 · drop into the ring’s front slot
r = mixRect(r, ringFront, gIn);`}
                </Code>
                <HeroGraph />
                <Grid>
                    <Card kicker="Why chains work" title="Each link is idle outside its window">
                        Before its window, a link blends by 0 (no change); after, by 1 (fully at its target). So the order of the chain is the order of the story.
                    </Card>
                    <Card kicker="Why it reverses" title="Nothing is stored" tint>
                        Scroll back to 3.0 and links 3–6 all blend by 0 again. The card is exactly the intro card, computed fresh, not “undone”.
                    </Card>
                </Grid>
                <TryThis
                    items={[
                        'Turn on only “turn (ry)”: two clean steps, 0° → 180° → 360°. Each step is one half turn and one face change.',
                        'Look at width and height around t = 4.0–5.1: the card grows, turns edge-on and opens to full screen in one overlapping move.',
                        'Find where “notch depth” spikes: the notch is part of the motion, not a fixed style.',
                    ]}
                />
                <KeyIdea>Chain blends in story order; each link only acts inside its window.</KeyIdea>
            </Section>

            <Section id="exceptions" n="02.4" title="What runs on its own clock, on purpose">
                <P>
                    Two kinds of things are not formulas of scroll. <strong>Text reveals</strong> play as short timelines when their section’s window is entered, and reverse 2.2× faster when it is
                    left. The <strong>logo wipe</strong> plays at 48 frames per second once the film passes 8.35. Both are short “beats” that look broken when half-played, so the original site plays
                    them in time, not in scroll.
                </P>
                <Callout tone="warn">
                    A beat on its own clock can’t be scrubbed, so keep it short (under about a second) and make sure it reverses or resets when the visitor scrolls back past it.
                </Callout>
                <KeyIdea>Space follows the scroll; short beats follow the clock.</KeyIdea>
                <Where
                    files={[
                        { path: 'Kpr/gl/choreo.ts', note: 'choreograph(), every card' },
                        { path: 'Kpr/gl/NotchedCard.ts', note: 'CardState, baseState' },
                        { path: 'Kpr/dom/ui/reveal.ts', note: 'actWatcher (timed beats)' },
                    ]}
                />
            </Section>
        </>
    );
}
