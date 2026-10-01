'use client';

import MiniIgloo from '../demos/MiniIgloo';
import TerrainLab from '../demos/TerrainLab';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function ObjectsChapter() {
    return (
        <article>
            <ChapterHead
                n="06"
                kicker="3D objects"
                title="Nothing was modelled. Everything was built by code."
                lead={
                    <>
                        There is no Blender file behind Igloo. The igloo, the terrain, the crystals and the portal rings are all generated from a few rules — “8 rows of bricks around a dome”, “noise
                        pushes the ground up”. That makes them tiny to download and, more importantly, easy to animate piece by piece.
                    </>
                }
            />

            <Section id="instancing" n="6.1" title="Instancing: 150 bricks, one draw call">
                <P>
                    Every separate object costs the browser a <Term k="drawcall">draw call</Term> — a request to the graphics card. 150 separate brick meshes would be 150 calls. With{' '}
                    <Term k="instancing">instancing</Term> there is one brick geometry and one list of 150 transforms (position, rotation, scale) plus 150 colours. The GPU stamps the brick 150 times
                    in a single call.
                </P>
                <Lens>
                    It is a component with 150 instances, each with its own position and colour override. Change the master (geometry or material) and every instance updates. Change one instance’s
                    override (its matrix) and only that brick moves.
                </Lens>
                <Code
                    file="canvas/IglooWorld.tsx (per frame, per brick)"
                    highlight={['setMatrixAt', 'setColorAt', 'needsUpdate']}
                >{`<instancedMesh ref={meshRef} args={[brickGeo, brickMat, bricks.length]} castShadow receiveShadow />

for (let i = 0; i < bricks.length; i++) {
    // … work out this brick's position p, rotation q and scale s …
    tmp.m.compose(p, q, s);            // pack into a 4×4 matrix
    mesh.setMatrixAt(i, tmp.m);        // instance i's transform
    mesh.setColorAt(i, glowColor);     // instance i's tint (hover glow)
}
mesh.instanceMatrix.needsUpdate = true; // upload once per frame
mesh.instanceColor.needsUpdate = true;`}</Code>
            </Section>

            <Section id="igloo" n="6.2" title="Play with the real igloo">
                <P>
                    This demo runs the same maths as the page, from the brick layout down to the hover and the light. Hover the dome, then play the intro and the explosion. Every brick is still one
                    instance of one rounded box.
                </P>
                <MiniIgloo />
                <TryThis
                    items={[
                        'Set seam backing to 0: the gaps between bricks go dark. That dim sphere behind the wall is the whole “light leaking through” trick.',
                        'Set response to 1.5 and sweep the cursor — the bricks now trail behind like they’re heavy. At 20 they snap.',
                        'Drag explode slowly: top bricks leave first, and the camera rises to look down into the glow.',
                    ]}
                />
            </Section>

            <Section id="procedural" n="6.3" title="Procedural layout: rules, not vertices">
                <P>
                    The igloo is a loop inside a loop. For each of 8 rows up the dome, work out the ring’s radius, fit as many 0.64-wide bricks as the circumference allows, and place each one facing
                    outward. Every other row is shifted by half a brick — the same bond pattern as a real brick wall. Rows near the ground skip the angle where the tunnel joins.
                </P>
                <Code file="canvas/IglooWorld.tsx → buildBricks()" highlight={['row % 2', 'continue']}>{`for (let row = 0; row < 8; row++) {
    const phi = (row + 0.5) * rowH;                     // angle up the dome
    const ringR = (R - TH * 0.5) * Math.cos(phi);        // ring gets smaller near the top
    const n = Math.max(5, Math.round((2 * Math.PI * R * Math.cos(phi)) / 0.64)); // how many bricks fit
    for (let k = 0; k < n; k++) {
        const theta = ((k + (row % 2) * 0.5) / n) * Math.PI * 2;   // half-brick offset on odd rows
        if (row < 3 && nearEntrance(theta)) continue;               // leave a doorway
        const pos = new Vector3(ringR * Math.sin(theta), (R - TH * 0.5) * Math.sin(phi), ringR * Math.cos(theta));
        const normal = /* points straight out of the dome */;
        add(pos, east, normal, brickSize);               // orient the brick to face outward
    }
}`}</Code>
                <Grid>
                    <Card kicker="Per-brick data" title="Each brick knows who it is">
                        <C>h01</C> height on the dome (0–1), <C>rand</C> a personal random, <C>start</C> where it flies in from, <C>fly</C> where it flies to, <C>spinAxis</C> how it tumbles. Motion is
                        just these numbers × the timeline dials.
                    </Card>
                    <Card kicker="Seeded random" title="Same “random” every time" accent="var(--il-lilac)">
                        <C>rng(100 + i)</C> is a <Term k="seeded">seeded</Term> generator: brick 37 always gets the same random values. The scene is designed once and every visitor sees exactly that
                        composition.
                    </Card>
                </Grid>
                <KeyIdea>Procedural = describe the rule once, get hundreds of pieces — each with its own data you can animate.</KeyIdea>
            </Section>

            <Section id="light" n="6.4" title="Light that leaks through the seams">
                <P>The glowing interior is three cheap layers working together, not one expensive effect:</P>
                <Table
                    head={['Layer', 'What it is', 'Why']}
                    rows={[
                        ['Point light', 'A real light at the centre, casting shadows', 'Lights the inner faces of lifted bricks and spills out of the doorway onto the snow.'],
                        ['Core', 'A 0.16-radius sphere, colour × 2.2, toneMapped: false', 'An HDR-bright dot: the eye reads it as a light source; the compositor’s bloom picks it up.'],
                        ['Seam backing', 'A sphere just inside the wall, dim light colour', 'Fills every gap between bricks with light. It shrinks away as soon as the shell cracks.'],
                        ['Flicker', 'sin(t·11.3)·0.5 + sin(t·6.7 + 1.3)·0.5', 'Two waves at odd frequencies never line up, so the flicker never looks like a loop.'],
                    ]}
                />
                <Callout>
                    <Term k="hdr">HDR colours</Term> (values above 1.0) are the secret to glow. A material with <C>toneMapped: false</C> and colour <C>[2.6, 2.6, 2.7]</C> is “brighter than white” —
                    the tone mapper and the bloom treat it as a real light.
                </Callout>
            </Section>

            <Section id="terrain" n="6.5" title="The landscape: noise, layered">
                <P>
                    The valley is a flat grid of points, each pushed up by a height function. The function is a sum of layers: a flat plateau for the igloo, gentle <Term k="fbm">fbm</Term> lumps
                    around it, and sharp ridged mountains far away. Colour comes from the slope: flat = snow, steep = rock.
                </P>
                <TerrainLab />
                <Code file="canvas/IglooWorld.tsx → terrainHeight()">{`export const terrainHeight = (x, z) => {
    const r = Math.hypot(x, z);                                            // distance from the igloo
    const plateau   = r < 2.7 ? 0 : -Math.min(Math.pow(r - 2.7, 2) * 0.028, 7);
    const lumps     = fbm2(x * 0.16 + 3, z * 0.16) * 1.6 * smoothstep(2.4, 9, r);
    const grain     = fbm2(x * 1.4, z * 1.4, 3) * 0.08 * smoothstep(2.0, 3.5, r);
    const mountains = ridged2(x * 0.03 + 7, z * 0.03 + 2) * 34 * smoothstep(12, 60, r);
    return plateau + lumps + grain + mountains;
};`}</Code>
                <Lens>Each layer is masked by distance with smoothstep — like painting a layer mask with a soft radial brush. Near the igloo: flat. Mid-distance: drifts. Horizon: peaks.</Lens>
            </Section>

            <Section id="others" n="6.6" title="The other worlds, same philosophy">
                <Grid cols={3}>
                    <Card kicker="Act 1" title="Crystals">
                        A low-poly icosahedron (or prism, box, octahedron). Every corner nudged randomly — with shared corners nudged the same so faces stay closed — and a chipped base. All the beauty
                        is in the shader (chapter 07).
                    </Card>
                    <Card kicker="Act 2" title="Ring segments" accent="var(--il-lilac)">
                        A rounded-rectangle profile, spun part-way round an axis with <C>LatheGeometry</C>, end caps added. 9 + 7 + 5 segments assemble from debris, tumble, then settle face-on.
                    </Card>
                    <Card kicker="Act 3" title="Particle figures" accent="var(--il-mint)">
                        The penguin is 12 ellipsoids; the X and M logos are drawn on a hidden canvas and sampled into points. No mesh at all — just 65,536 positions (chapter 09).
                    </Card>
                </Grid>
                <Code file="canvas/RingsWorld.tsx → segmentGeometry()">{`// rounded-rect profile → revolve a partial arc → a chunky ring segment
const body = new THREE.LatheGeometry(profilePoints, 28, phiStart, phiLength);
const caps = [phiStart, phiStart + phiLength].map((phi) => {
    const cap = new THREE.ShapeGeometry(new THREE.Shape(profilePoints));
    cap.rotateY(phi - Math.PI / 2);
    return cap;
});
const segment = mergeGeometries([body, ...caps]);`}</Code>
                <Where
                    files={[
                        { path: 'canvas/IglooWorld.tsx' },
                        { path: 'canvas/RingsWorld.tsx' },
                        { path: 'canvas/CrystalWorld.tsx', note: 'buildCrystalGeometry' },
                        { path: 'utils/math.ts', note: 'rng, fbm2, ridged2' },
                    ]}
                />
            </Section>
        </article>
    );
}
