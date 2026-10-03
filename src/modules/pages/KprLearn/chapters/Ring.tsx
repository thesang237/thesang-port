'use client';

import RingLab from '../demos/RingLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function Ring() {
    return (
        <>
            <ChapterHead
                n="08"
                kicker="Gallery ring"
                title="A cylinder of cards you can spin."
                lead={
                    <>
                        After the 10K portrait, the page floods with lavender and 26 portrait cards open into a ring. It drifts with the scroll, spins when you drag it, and finally closes into a tiny
                        spinning box before each card turns away and vanishes.
                    </>
                }
            />

            <Section id="cylinder" n="08.1" title="Cards on a circle, seen from outside">
                <P>
                    Picture the cards standing on the rim of a round table, each facing outward, and the camera standing outside the table. The card in front is closest and widest; the ones toward the
                    sides turn away and get narrower; the back half is hidden. Every card gets one angle θ; sine and cosine of that angle give its position, and the card turns by the same angle so it
                    always faces out.
                </P>
                <RingLab />
                <Code file="src/modules/pages/Kpr/gl/choreo.ts (gallery, trimmed)" highlight={['Math.sin(th) * R', '(cos - 1) * R', 's.order']}>
                    {`const R = lerp(lerp(0.05 * vw, 0.62 * vw, open), 0.03 * vw, close);
const step = (Math.PI * 2) / n;
const rot = film.ringDrag + (t - 12.6) * 0.75 + time * 0.05 + close * close * 6.5;
for (let i = 0; i < n; i++) {
    const th = i * step * lerp(0.35, 1, open) + rot;  // bunched while opening
    const cos = Math.cos(th);
    s.x = Math.sin(th) * R;
    s.z = (cos - 1) * R;          // the front card sits at z = 0, the rest go back
    s.ry = wrapped;               // face outward
    s.opacity = clamp01((cos + 0.15) / 0.35); // fade before reaching the back
    s.dim = lerp(0, 0.25, clamp01(1 - cos));  // sides a little darker
    s.order = 30 + Math.round(cos * 40);      // nearer = drawn later = on top
}`}
                </Code>
                <Lens>
                    It’s the Cover Flow carousel, or an After Effects layer repeater with a radial offset. The <strong>draw order</strong> is the layer order in your layers panel, re-sorted every
                    frame by how close each card is.
                </Lens>
                <TryThis
                    items={[
                        'Switch the camera to concave: now you are inside the table. Side cards come toward you and loom large. Convex keeps the front card the hero.',
                        'Set the radius to 0.15: the cards crowd and overlap. At 1.4 only two or three are on screen.',
                        'Drag hard and let go with decay 0.3: it spins for ages. At 12 it stops dead. The source’s 3 stops in about a second.',
                    ]}
                />
                <KeyIdea>sin for sideways, cos for depth, the same angle for the turn, and re-sort by closeness.</KeyIdea>
            </Section>

            <Section id="drag" n="08.2" title="Drag, release, coast">
                <P>
                    While you drag, the ring follows your hand exactly: horizontal pixels become an angle (2.4 radians per screen width). The page also remembers how fast you were moving at the moment
                    you let go. After release, that speed keeps turning the ring and shrinks a little every frame, a <Term k="momentum">momentum</Term> that fades out by itself.
                </P>
                <Code file="src/modules/pages/Kpr/dom/sections/Collection.tsx (Gallery)" highlight={['Math.exp(-3']}>
                    {`const onMove = (e) => {
    const da = ((e.clientX - d.x) / Math.max(320, film.vw)) * 2.4;  // pixels → radians
    film.ringDrag += da;
    d.v = da / Math.max(0.008, (now - d.last) / 1000);           // speed at this moment
};
const onUp = () => (film.ringMomentum = Math.max(-6, Math.min(6, d.v)));
// every frame after release: coast and slow down (frame-rate independent)
film.ringDrag += film.ringMomentum * film.dt;
film.ringMomentum *= Math.exp(-3 * film.dt);`}
                </Code>
                <Grid>
                    <Card kicker="Capped" title="Max 6 radians per second">
                        A flick can’t send the ring spinning wildly; the speed is clamped when you let go.
                    </Card>
                    <Card kicker="Additive" title="Drag sits on top of scroll" tint>
                        <C>ringDrag</C> is just added to the angle the scroll already gives, so scrolling keeps working after you have spun it.
                    </Card>
                </Grid>
                <KeyIdea>Track the hand while dragging; on release, keep its speed and let it decay.</KeyIdea>
            </Section>

            <Section id="exit" n="08.3" title="Closing the ring">
                <P>
                    The ring doesn’t fade out; it leaves through motion. First the radius shrinks to 3 % of the screen width while the spin speeds up (<C>close² × 6.5</C> extra turns), so the cards
                    become a little spinning box. Then each card turns past 90° toward its nearer edge, one after another. The cards are single-sided (chapter 04), so a card that turns away simply
                    disappears.
                </P>
                <Callout tone="tip">
                    The flips are staggered by position in the ring (<C>i / n × 0.35</C>), which reads as a ripple running around the box rather than all cards vanishing at once.
                </Callout>
                <TryThis
                    items={[
                        'Drag “close” to 1, then slowly drag “flip away”: watch the ripple.',
                        'Drag “open” back from 1 to 0: the cards bunch together (their spacing shrinks to 0.35) as they converge.',
                    ]}
                />
                <KeyIdea>Exit through motion: shrink, spin, and let one-sided cards turn themselves invisible.</KeyIdea>
                <Where
                    files={[
                        { path: 'Kpr/gl/choreo.ts', note: 'GALLERY section' },
                        { path: 'Kpr/dom/sections/Collection.tsx', note: 'drag + momentum' },
                        { path: 'Kpr/data/media.ts', note: 'GALLERY_RING, images' },
                    ]}
                />
            </Section>
        </>
    );
}
