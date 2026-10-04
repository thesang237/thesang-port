'use client';

import BokehLab from '../demos/BokehLab';
import SpriteXray from '../demos/SpriteXray';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Bokeh() {
    return (
        <>
            <ChapterHead
                n="07"
                kicker="Bokeh"
                title="Out-of-focus dots that your pointer brings into focus."
                lead={
                    <>
                        Every scene on /corn floats in soft, coloured specks, like a macro photo shot through a fast lens. Move the pointer and the specks near it sharpen while the rest melt. It is
                        not a blur effect: each speck is a single point, and its size and softness are calculated from how far it is from a moving focus point.
                    </>
                }
            />

            <Section id="look" n="01 · The look" title="Defocused light, faked one point at a time">
                <P>
                    In a photo, out-of-focus highlights become discs (<Term k="bokeh">bokeh</Term>), shaped like the lens aperture: with five blades, pentagons. The page draws hundreds of{' '}
                    <Term k="sprite">point sprites</Term> per scene and gives each one exactly that behaviour: on the focus it’s small, crisp and five-sided; away from it, it swells into a soft,
                    dimmer disc.
                </P>
                <BokehLab />
                <Lens>
                    Lens blur in After Effects with an iris shape set to pentagon, except here every dot carries its own blur amount, computed from its distance to a focus point that follows your
                    hand.
                </Lens>
                <KeyIdea>Bokeh = sprites whose size, softness and brightness come from their distance to a focus point.</KeyIdea>
            </Section>

            <Section id="sprite" n="02 · One sprite" title="One dot, one number">
                <P>
                    The vertex shader measures each point’s distance to the focus and squeezes it into <C>vSize</C>, 0 (on the focus) to 1 (far away). That one number sets the point size (from “in
                    focus” px to “out of focus” px), how soft the polygon’s edge is (0.05 → 0.3) and how bright it is (1 → 0.4). The fragment shader cuts the square sprite into a polygon with a
                    distance function.
                </P>
                <SpriteXray />
                <Code file="engine/fx/particles.ts · polyMaterial() (trimmed)" lang="glsl" highlight={['vSize = smoothstep', 'gl_PointSize', 'polygonDf(gl_PointCoord']}>
                    {`// vertex: distance to the focus point, in clip space
vSize = smoothstep(dofAmount.x, dofAmount.y, distance(transformed.xyz, dofFocus));
float scale = resolution.y / 800.0;                              // same look on any screen height
gl_PointSize = mix(size.x * scale, size.y * scale, vSize) * uDpr;

// fragment: cut the square into a polygon that softens as it defocuses
float polygonDf(vec2 st, float N) {
    st = st * 2.0 - 1.0;
    float a = atan(st.x, st.y) + PI * 0.5;
    float r = TWO_PI / N;
    return cos(floor(0.5 + a / r) * r - a) * length(st);
}
float shapeAlpha = smoothstep(0.5, 0.5 - mix(0.05, 0.3, vSize), polygonDf(gl_PointCoord, shapeSides));
float distanceAlpha = mix(1.0, 0.4, smoothstep(0.0, 0.2, vSize));`}
                </Code>
                <TryThis
                    items={[
                        <>Drag vSize slowly from 0 to 0.2: brightness drops fast (to 0.4), then the dot keeps growing. Most of the “fade” happens near focus.</>,
                        <>Set sides to 3: triangles read as graphic, not optical. Five is the most lens-like.</>,
                        <>In the lab, set “sharp within” to 30: everything is in focus and the depth vanishes.</>,
                    ]}
                />
                <KeyIdea>vSize (0 at the focus → 1 far away) drives size, edge softness and brightness at once.</KeyIdea>
            </Section>

            <Section id="focus" n="03 · Focus" title="The focus follows your pointer">
                <P>
                    <C>DofController</C> holds the focus point. Each frame it eases (about 5 % a frame at 60 fps, λ ≈ 3) toward the pointer’s position scaled to the scene’s focus box, and while the
                    pointer is on the page it widens the far edge of the focus band. Each world has its own box and band.
                </P>
                <Code file="engine/fx/particles.ts · DofController" highlight={['this.target.set', 'this.far +=']}>
                    {`update(ptr: THREE.Vector2, active: boolean, dt: number) {
    const k = 1 - Math.exp(-3.08 * dt);                         // ≈ 5 % a frame at 60 fps
    this.target.set((ptr.x * this.o.width) / 2, (ptr.y * this.o.height) / 2, -2);
    this.focus.lerp(this.target, k);
    this.far += ((active ? this.o.farMax : this.o.farMin) - this.far) * k;
    this.amount.y = this.far;                                   // the far edge of the band
}`}
                </Code>
                <Table
                    head={['Scene', 'Focus box (w × h)', 'Far edge', 'Feel']}
                    mono={[1, 2]}
                    rows={[
                        ['Hero', '5 × 12', '25 → 40', 'Opens up when you arrive with the pointer'],
                        ['Helix', '5 × 12', '32', 'Fixed band: the strands stay readable'],
                        ['Network', '20 × 15', '55', 'Wide: the nodes stay mostly sharp'],
                        ['Kernel', '10 × 5', '40 → 70', 'Very wide when active: a calm, clear finale'],
                    ]}
                />
                <KeyIdea>The focus point eases toward the pointer (λ ≈ 3) and the focus band widens while you’re on the page.</KeyIdea>
            </Section>

            <Section id="areas" n="04 · The clouds" title="Spiral clouds from one formula">
                <P>
                    Each cloud (“area”) is a few hundred points on a flat spiral with a pseudo-random depth, then placed, scaled and rotated by a preset copied from the reference’s scene editor. The
                    random numbers are seeded, so every visitor sees the same designed composition.
                </P>
                <Code file="engine/fx/particles.ts · particleArea() (trimmed)" highlight={['Math.sin(a)', 'rng(seed)']}>
                    {`const rand = rng(seed);                              // seeded: the same layout for everyone
for (let e = 0; e < count; e++) {
    const i = e / count + (rand() * 1.5 - 0.75) / count;   // fraction along the spiral, jittered
    const a = 100 * i;                                     // 100 rad over the cloud: many turns
    pos.set([r * i * Math.sin(a), 2 * r * i * Math.cos(a), r * Math.sin(9873986723 * i)], e * 3);
}
pts.position.set(p.pX ?? 0, p.pY ?? 0, p.pZ ?? 0);       // editor preset
pts.rotation.set(p.rX ?? 0, p.rY ?? 0, p.rZ ?? 0);`}
                </Code>
                <KeyIdea>A seeded spiral + an editor preset per cloud: designed composition, generated detail.</KeyIdea>
            </Section>

            <Section id="blend" n="05 · Blending" title="Added together, unsorted, no depth">
                <P>
                    Bokeh is light, so it’s drawn with <Term k="additive">additive blending</Term>: overlapping dots get brighter, order doesn’t matter, nothing needs sorting. The reference added in
                    display colour; this pipeline adds in linear light, so each dot’s weight is raised to the power 2.2 to stay as faint as it reads on the reference. And sprites that would end up
                    nearly invisible are thrown off screen in the vertex shader, so the GPU never fills their (big, soft, expensive) squares.
                </P>
                <Code file="engine/fx/particles.ts (trimmed)" lang="glsl" highlight={['pow(max(peak', 'pow(max(a']}>
                    {`// vertex: big soft sprites cost the most and show the least: skip any that cannot reach 0.4 %
if (pow(max(peak, 0.0), 2.2) < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);

// fragment: additive, weight raised to 2.2 for the linear pipeline
gl_FragColor = vec4(color * distanceAlpha, pow(max(a, 0.0), 2.2));`}
                </Code>
                <Callout tone="tip" title="Why not a real depth-of-field blur?">
                    A blur pass would cost a full-screen effect every frame and blur everything evenly. Per-sprite defocus costs almost nothing and each dot can sit at its own depth. The stalk chapter
                    does use a real depth blur, for the field behind the plant (chapter 10).
                </Callout>
                <KeyIdea>Additive (no sorting), weight raised to 2.2 for linear light, and invisible sprites skipped before they cost a pixel.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/fx/particles.ts', note: 'polyMaterial, DofController, particleArea' },
                        { path: 'engine/worlds/World.ts', note: 'updateFx, the reference camera' },
                        { path: 'engine/worlds/HeroWorld.ts', note: 'hero presets' },
                    ]}
                />
            </Section>
        </>
    );
}
