'use client';

import ScatterLab from '../demos/ScatterLab';
import TrailXray from '../demos/TrailXray';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Scatter() {
    return (
        <>
            <ChapterHead
                n="05"
                kicker="Scatter"
                title="Your pointer is a brush that undraws the letters."
                lead={
                    <>
                        Move over a title on /corn and the letters near the pointer melt back into their outline while a constellation of dots flies out of their edges, then heals a second later.
                        Press and hold and a much bigger hole opens. It looks like a particle system; it is mostly one small list of points and one function in the shader.
                    </>
                }
            />

            <Section id="field" n="01 · The idea" title="A brush that heals behind you">
                <P>
                    The pointer leaves a short trail of points over the title. Each point has a strength that starts at 1 and fades to 0 in a second. Together they make a <em>field</em>: a value
                    between 0 and 1 for every spot on the screen. Wherever the field is strong, the letters let go. As the points fade, the letters re-form.
                </P>
                <TrailXray />
                <Lens>An eraser brush on a layer mask whose strokes slowly grow back. The trail is the brush stroke; its fading strength is the mask healing.</Lens>
                <KeyIdea>The pointer paints a fading field over the title; strong field = letters let go, fading field = letters heal.</KeyIdea>
            </Section>

            <Section id="trail" n="02 · The trail" title="Sixteen points that fade">
                <P>
                    <C>Trail</C> keeps a ring of 16 positions. A new one is recorded every 12 px of pointer travel, but only while the pointer is over a drawn title. Each point’s strength follows{' '}
                    <C>(1 − k)² × 1.5</C> over its life: it stays near full for a moment (the 1.5 is clipped to 1), then falls away. Quick break-up, slow heal. A resting field also stays open around
                    the pointer while it sits on a title, even if it doesn’t move.
                </P>
                <Code file="engine/text/Trail.ts (trimmed)" highlight={['(1 - k) * (1 - k) * 1.5', 'SPACING']}>
                    {`push(x: number, y: number) {
    if (Math.hypot(x - this.last.x, y - this.last.y) < SPACING) return;   // 12 px
    this.last.set(x, y);
    this.head = (this.head + 1) % TRAIL_SIZE;                             // ring of 16
    this.uniform[this.head].set(x, y, 1);
    this.age[this.head] = 0;
}
update(dt: number) {
    for (let i = 0; i < TRAIL_SIZE; i++) {
        this.age[i] += dt;
        const k = Math.min(1, this.age[i] / LIFE);                         // LIFE = 1.0 s
        this.uniform[i].z = Math.min(1, (1 - k) * (1 - k) * 1.5);          // quick break-up, slow heal
    }
}`}
                </Code>
                <Table
                    head={['Setting', 'Value', 'What it feels like']}
                    mono={[1]}
                    rows={[
                        ['Points kept', '16', 'A short comet tail, never a long smear'],
                        ['Spacing', '12 px', 'Even coverage whatever your speed'],
                        ['Life', '1.0 s', 'Letters re-form about a second after you pass'],
                        ['Radius', '1.15 cap', 'About three letters around the pointer'],
                        ['Resting field', '1.6 × radius', 'A calm hole while you hover still'],
                    ]}
                />
                <TryThis
                    items={[
                        <>Set life to 4 s and sweep: the whole word stays broken. Too long and the title stops being readable.</>,
                        <>Raise spacing to 60 px and sweep fast: the 16 points spread out and the field becomes a dotted line.</>,
                        <>Turn off the resting field and hold the pointer still: the hole heals even though you’re still there.</>,
                    ]}
                />
                <KeyIdea>16 points, one every 12 px, each fading over 1 s as (1 − k)² × 1.5: that list is the whole pointer state.</KeyIdea>
            </Section>

            <Section id="shader" n="03 · The shader" title="Every pixel reads the field">
                <P>
                    The 16 points are handed to the shader as <Term k="uniform">uniforms</Term>. For each pixel, <C>disturb()</C> takes the strongest influence of any point (a soft disc around each,
                    times its strength), the resting field and the hold disc. Where the result passes 0.32 → 0.48, the fill gives way to the outline; on that outline, bright segments travel along the
                    letter’s path (the same path map as the reveal).
                </P>
                <Code file="engine/text/TitleText.ts · fieldGlsl + quadFrag (trimmed)" lang="glsl" highlight={['float disturb', 'float open', 'float seg']}>
                    {`float disturb(vec2 p) {
    float d = 0.0;
    for (int i = 0; i < 16; i++) {
        vec3 t = uTrail[i];                                      // x, y, strength
        d = max(d, (1.0 - smoothstep(uTrailR * 0.35, uTrailR, distance(p, t.xy))) * t.z);
    }
    d = max(d, (1.0 - smoothstep(uTrailR * 0.7, uTrailR * 1.6, distance(p, uHover.xy))) * uHover.z);
    float r = uHoldR * (0.35 + 0.65 * uHold.z);
    return max(d, (1.0 - smoothstep(r * 0.55, r, distance(p, uHold.xy))) * uHold.z);
}
float open = smoothstep(0.32, 0.48, disturb(vPos));              // fill → outline
float seg = smoothstep(0.4, 0.46, fract(pathPos * 1.4 + vIndex * 0.37 + uTime * 0.06));
float body = fill * lf * (1.0 - open);`}
                </Code>
                <KeyIdea>disturb() = the strongest of 16 soft discs, the resting field and the hold disc; past 0.32–0.48 the fill turns into a travelling outline.</KeyIdea>
            </Section>

            <Section id="nodes" n="04 · The constellation" title="Dots that live on the GPU">
                <P>
                    When the title is built, points are sampled on the edges of the letters (where the atlas median sits just inside the edge). Each node gets a random flight direction and length (up
                    to about one cap height) and is linked to its two nearest neighbours <em>at full flight</em>. All of this is stored once in buffers. Every frame, the vertex shader moves each node
                    from its rest spot toward rest + offset by its own field value. No JavaScript touches a node after it’s built.
                </P>
                <ScatterLab />
                <Code file="engine/text/TitleText.ts · nodeGlsl" lang="glsl" highlight={['vec2 nodePos', 'step(seed, 0.5)']}>
                    {`vec2 nodePos(vec2 rest, vec2 off, float seed, float d) {
    float e = d * d * (3.0 - 2.0 * d);                          // smooth flight
    float spread = 1.0 + 0.9 * uHold.z;                          // the hold sends them 1.9× further
    vec2 drift = vec2(sin(uTime * 0.7 + seed * 40.0), cos(uTime * 0.6 + seed * 23.0)) * uCap * 0.05;
    return uOrigin + rest + (off * spread + drift) * e;
}
// half of the nodes only join while the press field is open
float nodeAlpha(vec2 rest, float seed) {
    float shown = mix(step(seed, 0.5), 1.0, uHold.z);
    return smoothstep(0.18, 0.55, disturb(uOrigin + rest)) * uReady * shown;
}`}
                </Code>
                <TryThis
                    items={[
                        <>Turn letters off and sweep: only the constellation is left. Then turn links off too: just dots.</>,
                        <>Hold radius × 2.5, then press and hold: most of the title opens and twice as many nodes join.</>,
                        <>Hover radius at 0.3 cap: a pinprick. The 1.15 default reads as “about three letters”, which feels deliberate.</>,
                    ]}
                />
                <Callout tone="tip" title="Why links fade with their fainter end">
                    Each link is drawn as a line between two nodes, and its alpha is the smaller of the two nodes’ alphas. A link never hangs in the air from a node that’s still part of a letter.
                </Callout>
                <KeyIdea>Nodes and links are built once; the vertex shader flies each one out by its own field value, so the scatter costs no JavaScript per frame.</KeyIdea>
            </Section>

            <Section id="hold" n="05 · Press and hold" title="One big disc that opens and closes">
                <P>
                    Pressing on a drawn title opens a single disc at the pointer. It grows to 3 cap heights over 0.55 s with an ease-out (fast, then settling), sends the nodes about 1.9× further,
                    brings in the second half of the nodes and closes over 1.1 s with a smoothstep after release. The asymmetry matters: it answers your press quickly and lets go gently.
                </P>
                <Code file="engine/text/Trail.ts · update() (hold)" highlight={['HOLD_IN', 'Math.pow(1 - t, 3)']}>
                    {`this.holdT = clamp01(this.holdT + (this.pressed ? dt / HOLD_IN : -dt / HOLD_OUT));  // 0.55 s / 1.1 s
const t = this.holdT;
// ease out while opening, ease in-out while closing
this.hold.z = this.pressed ? 1 - Math.pow(1 - t, 3) : t * t * (3 - 2 * t);`}
                </Code>
                <KeyIdea>Hold opens fast (0.55 s, ease-out) and closes slow (1.1 s, smoothstep): respond quickly, release gently.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/text/Trail.ts', note: 'trail, rest, hold' },
                        { path: 'engine/text/TitleText.ts', note: 'disturb, nodes, links' },
                        { path: 'engine/text/msdf.ts', note: 'samplePoints' },
                        { path: 'engine/Engine.ts', note: 'onDown, updateTitles' },
                    ]}
                />
            </Section>
        </>
    );
}
