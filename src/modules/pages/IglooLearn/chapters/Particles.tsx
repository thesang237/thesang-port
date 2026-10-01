'use client';

import DataTexture from '../demos/DataTexture';
import ParticleMorph from '../demos/ParticleMorph';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function ParticlesChapter() {
    return (
        <article>
            <ChapterHead
                n="09"
                kicker="Particles"
                title="65,536 dots that behave like a flock."
                lead={
                    <>
                        The colony figure isn’t a model — it’s a cloud of points, each one pulled toward a “home” on a shape by an invisible <Term k="spring">spring</Term>. Your cursor disturbs them,
                        they glow while excited, then settle back. Four simple rules, applied to every dot, every frame.
                    </>
                }
            />

            <Section id="rules" n="9.1" title="The four rules every particle follows">
                <Grid>
                    <Card kicker="Rule 1" title="Go home">
                        Each particle has a home point on the shape. A spring pulls it there: the further away, the harder the pull. Damping (friction) stops it overshooting forever.
                    </Card>
                    <Card kicker="Rule 2" title="Get pushed" accent="var(--il-lilac)">
                        Particles near the cursor ray inherit the cursor’s velocity and are pushed sideways. Faster gestures make a wider wake.
                    </Card>
                    <Card kicker="Rule 3" title="Get excited" accent="var(--il-mint)">
                        Being pushed adds <strong>energy</strong>. Energy loosens the spring, adds turbulence and makes the particle glow. It decays over about two seconds.
                    </Card>
                    <Card kicker="Rule 4" title="Never escape" accent="var(--il-warn)">
                        A soft invisible wall around the figure and a floor at the pedestal push stray particles back in.
                    </Card>
                </Grid>
                <Lens>
                    It is a flock of birds, each on an elastic band tied to its seat. Wave your hand through them and they scatter, flash, then drift back to their seats. The figure is not animated —
                    it <em>emerges</em> from the rules.
                </Lens>
            </Section>

            <Section id="play" n="9.2" title="Play with the colony">
                <P>
                    This is the Igloo colony simulation rewritten in plain JavaScript (12,000 particles instead of 65,536) so each rule is readable. Every dial is a real parameter from the page’s
                    Tweak panel.
                </P>
                <ParticleMorph />
                <TryThis
                    items={[
                        'Set damping to 1.5 and sweep: the figure wobbles like jelly. At 15 it moves like syrup.',
                        'Set loose spring to 0.5 and energy decay to 0.1 — excited particles turn to smoke and take ages to come home.',
                        'Choose “text” and type your name. Your name is now drawn on a hidden canvas, sampled into 12,000 points, and flown to.',
                        'Set plume to 0 and morph: particles cut straight across. Put it back: they swirl up like a sandstorm.',
                    ]}
                />
            </Section>

            <Section id="physics" n="9.3" title="The rules, as code">
                <P>On Igloo this runs in a shader (next section), but the maths is the same. Read it top to bottom — every line is one of the four rules.</P>
                <Code file="canvas/colonySim.ts — velocity shader (trimmed)" lang="glsl" highlight={['k =', 'fall', 'inject']}>{`// rule 1 · spring home — loosens as energy rises and while bursting
float k = mix(uSpring, uLoose, clamp(e, 0.0, 1.0)) * (1.0 - 0.85 * uBurst);
vec3 acc = (home - P.xyz) * k;
acc -= V.xyz * mix(uDamping, uDamping * 0.27, clamp(e, 0.0, 1.0));

// rule 3 · turbulence grows with energy → chaos follows the gesture
acc += noise3(P.xyz * 1.3 + uTime * 0.4) * (e * e * 7.0 + e * 3.0) * uChaos;

// rule 2 · cursor: particles near the cursor ray are dragged with it
vec3 v = P.xyz - uRayO;
vec3 perp = v - uRayD * dot(v, uRayD);                 // shortest vector to the ray
float fall = exp(-dot(perp, perp) / (uRadius * uRadius));
acc += (uMouseVel * 1.15 - V.xyz) * fall * uDrag;       // match the cursor's velocity
acc += normalize(perp) * fall * uMouseSpeed * 1.5;      // and get pushed aside

// rule 4 · soft containment + floor
acc -= normalize(c) * max(length(c) - 2.6, 0.0) * … * 30.0;
acc.y += max(0.24 - P.y, 0.0) * 90.0;

// energy: injected only by outside causes, then fades into a glow trail
e = max(e - uDt * uDecay, min(inject, 1.4));`}</Code>
                <Table
                    head={['Dial', 'Igloo value', 'Feel']}
                    mono={[0, 1]}
                    rows={[
                        ['spring', '26', 'Crisp, readable figure when calm'],
                        ['looseSpring', '2.8', 'Excited particles drift like mist'],
                        ['damping', '7', 'Settles without visible wobble'],
                        ['energyDecay', '0.45', 'Glow trail lasts ~2 seconds'],
                        ['radius (+ gain × speed)', '0.26 + 0.035 × v', 'Slow hand = scalpel, fast hand = broom'],
                        ['morph duration', '2.1s', 'Long enough to read the swirl'],
                    ]}
                />
            </Section>

            <Section id="morph" n="9.4" title="Morphing with a stagger baked into every dot">
                <P>
                    To change shape, each particle gets a new home. If all moved at once the figure would slide like a cross-fade. Instead each particle has a random number <C>rnd</C> (0–1) that
                    shifts its personal window — the stagger trick from chapter 02, applied to 65,536 items for free. Mid-morph, homes also rise along noisy “plumes” and a vortex kicks everything
                    outward, so the change reads as a swirl of snow.
                </P>
                <Code file="canvas/colonySim.ts" lang="glsl">{`// staggered morph progress per particle
float m = smoothstep(rnd * 0.45, rnd * 0.45 + 0.55, uMorph);
vec3 home = mix(fromShape, toShape, m);

// mid-morph, homes travel along swirling plumes instead of cutting straight through
float mid = sin(m * 3.14159);
home += (noise3(home * 0.55 + …) + vec3(0.0, 0.5, 0.0) * rnd + outward * 0.43) * mid * uPlume;

// scroll: gather out of the cloud — the same trick, driven by motion.form
float f = smoothstep(rnd * 0.5, rnd * 0.5 + 0.5, uForm);
return mix(cloudPosition, home, f);`}</Code>
                <KeyIdea>One random number per particle + smoothstep = a stagger across tens of thousands of items, with zero extra code.</KeyIdea>
            </Section>

            <Section id="gpgpu" n="9.5" title="GPGPU: the graphics card as a spreadsheet">
                <P>
                    JavaScript can comfortably simulate ~15,000 particles. For 65,536, Igloo moves the whole simulation onto the GPU. The trick (<Term k="gpgpu">GPGPU</Term>): store each particle’s
                    position in one <strong>pixel</strong> of a 256×256 floating-point texture — red = x, green = y, blue = z, alpha = energy. A shader that runs “per pixel” is now a shader that runs
                    per particle.
                </P>
                <DataTexture />
                <Grid>
                    <Card kicker="Step 1" title="Simulate">
                        A full-screen pass reads last frame’s position + velocity textures and writes new ones. Two textures are swapped every frame (“ping-pong”) because a shader can’t read and write
                        the same image.
                    </Card>
                    <Card kicker="Step 2" title="Draw" accent="var(--il-lilac)">
                        65,536 points each know which pixel is theirs (an <C>aRef</C> uv attribute). The vertex shader reads its position from the texture instead of from the geometry.
                    </Card>
                </Grid>
                <Code file="canvas/colonySim.ts + ParticleWorld.tsx" highlight={['addVariable', 'texture2D(tPos']}>{`// three.js ships a helper for the ping-pong bookkeeping
const gpu = new GPUComputationRenderer(256, 256, renderer);
const posVar = gpu.addVariable('tPos', positionShader, initialPositions);
const velVar = gpu.addVariable('tVel', velocityShader, initialVelocities);
gpu.setVariableDependencies(posVar, [posVar, velVar]);
gpu.setVariableDependencies(velVar, [posVar, velVar]);
gpu.init();

// every frame (two half steps keep the stiff spring stable)
sim.step(dt / 2); sim.step(dt / 2);
material.uniforms.tPos.value = gpu.getCurrentRenderTarget(posVar).texture;

// particle vertex shader: "where am I?" = read my pixel
vec4 P = texture2D(tPos, aRef);           // xyz = position, w = energy
gl_Position = projectionMatrix * modelViewMatrix * vec4(P.xyz, 1.0);`}</Code>
                <Callout>Phones get a 176×176 texture (31k particles) instead of 256×256 (65k): same look, half the work. Choose particle counts per device, not per design.</Callout>
            </Section>

            <Section id="shapes" n="9.6" title="Shapes from pixels and from maths">
                <P>
                    The <strong>X</strong> and <strong>M</strong> logos are drawn onto an invisible 512px canvas, then points are sampled where pixels are filled (72% on the front/back faces, 28% on
                    the edges to give them thickness). The <strong>penguin</strong> is built from 12 ellipsoids: points are scattered on each surface, and any point buried inside another part is
                    thrown away.
                </P>
                <Code file="canvas/shapes.ts → extruded()">{`const ctx = canvas.getContext('2d');
draw(ctx, 512);                                         // e.g. ctx.fill(new Path2D(X_PATH))
const alpha = ctx.getImageData(0, 0, 512, 512).data;    // every pixel's opacity
// collect filled pixels, then pick random ones as particle homes
for (let i = 0; i < n; i++) {
    const k = randomFilledPixel();
    pos.set([toX(k.x), toY(k.y), side * depth / 2, rand[i]], i * 4);  // front or back face
}`}</Code>
                <Where files={[{ path: 'canvas/ParticleWorld.tsx' }, { path: 'canvas/colonySim.ts' }, { path: 'canvas/shapes.ts' }, { path: 'tweaks.ts', note: 'colonyParams' }]} />
            </Section>
        </article>
    );
}
