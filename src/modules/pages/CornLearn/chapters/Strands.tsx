'use client';

import HelixBuild from '../demos/HelixBuild';
import NetworkLab from '../demos/NetworkLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Term, TryThis, Where } from '../kit/ui';

export default function Strands() {
    return (
        <>
            <ChapterHead
                n="08"
                kicker="Strands"
                title="DNA from one curve and a few rules."
                lead={
                    <>
                        The amber double helix in the first science chapter looks hand-modelled: forty fibres braiding, crossing through each other, drawing themselves in as you arrive. There is no
                        model. It’s one curve function called forty times with slightly different numbers, then drawn as hairlines and beads.
                    </>
                }
            />

            <Section id="curve" n="01 · One curve" title="A spline through a spiral">
                <P>
                    <C>helixSpline()</C> computes 13 points on a spiral (a radius, a number of turns over the height, a starting angle), adds a second smaller and faster spiral on top (the wobble),
                    and threads a smooth <Term k="spline">Catmull-Rom spline</Term> through them. Step through the build-up: each step adds one rule.
                </P>
                <HelixBuild />
                <Code file="engine/fx/helix.ts · helixSpline() (trimmed)" highlight={['r * Math.sin(p) + h * Math.sin(f)', 'CatmullRomCurve3']}>
                    {`for (let e = 0; e < 13; e++) {
    const t = e / 13;
    if (crossAt.some((k) => t >= k && prev < k)) y += Math.PI;     // a crossing: jump to the far side
    const p = t * Math.PI * 2 * frequency + phase + y;              // main spiral angle
    const f = t * Math.PI * 2 * frequency2 + phase2;               // the wobble's angle
    pts.push(new THREE.Vector3(
        r * Math.sin(p) + h * Math.sin(f),                         // x: spiral + wobble
        t * height - height / 2,                                   // y: climb
        r * Math.cos(p) + h * Math.cos(f),                         // z
    ));
}
return new THREE.CatmullRomCurve3(pts);                            // smooth curve through them`}
                </Code>
                <Lens>
                    Drawing one path with the pen tool, then using “repeat” with a small rotation and offset for each copy. The richness comes from the variation between copies, not from any single
                    path.
                </Lens>
                <KeyIdea>Thirteen points on a spiral plus a wobble, smoothed by a spline: that’s one fibre.</KeyIdea>
            </Section>

            <Section id="rules" n="02 · Rules" title="Crossings and forty fibres">
                <P>
                    At a crossing height the curve’s angle jumps by half a turn, so the spline dives straight through the middle to the other side: the rungs of the DNA. Each fibre crosses at a
                    different subset of 7 stripes (<C>stripe % 3 === strand % 3</C>), so the crossings spread out instead of all happening at once. 20 fibres per backbone, two backbones half a turn
                    apart.
                </P>
                <Code file="engine/fx/helix.ts · dna() (trimmed)" highlight={['crossAt:', 'for (const phase of [0, Math.PI])']}>
                    {`const stripes = Array.from({ length: 7 }, (_, e) => e / 7 + 0.5 / 7);
for (const phase of [0, Math.PI]) {                 // two backbones
    for (let r = 0; r < 20; r++) {                 // 20 fibres each
        const spline = helixSpline({
            height: 15, phase,
            phase2: (r / 20) * Math.PI * 2 + 0.8 * (rand() - 0.5),
            radius: 1.3 * 0.9, radius2: 0.9 * (0.2 + rand() * 0.1),
            frequency: 0.9, frequency2: 4,
            crossAt: stripes.filter((_, t) => t % 3 === r % 3 && t !== 0 && t !== 1),
        }, rand);
        // … 200 hairline segments + 150 beads along it
    }
}`}
                </Code>
                <TryThis
                    items={[
                        <>Stay on step 3 and set turns to 2.5: the single fibre coils tightly and the crossings start to look random.</>,
                        <>On step 5, set wobble size to 0: forty fibres collapse onto two clean lines. The wobble is what makes it feel organic.</>,
                        <>Push wobble turns to 20: the fibres fizz. The page’s 4 reads as a slow braid.</>,
                    ]}
                />
                <KeyIdea>Crossings = a half-turn jump in the angle; varied crossing heights and wobble phases make forty copies look hand-made.</KeyIdea>
            </Section>

            <Section id="beads" n="03 · Drawing it" title="Hairlines and beads, two draw calls">
                <P>
                    All 40 fibres become one <C>LineSegments</C> (8,000 hairline segments) and one <C>Points</C> (6,000 pentagon beads from the bokeh shader of chapter 07). Every vertex also carries{' '}
                    <C>t</C>, its place along its fibre from 0 to 1. Two objects, two draw calls, for the whole helix.
                </P>
                <Code file="engine/fx/helix.ts · dna() (trimmed)" highlight={['lineU.push', 'ptT.push']}>
                    {`const pts = spline.getSpacedPoints(200);
for (let i = 0; i < 200; i++) {
    linePos.push(...pts[i].toArray(), ...pts[i + 1].toArray());
    lineU.push(i / 200, (i + 1) / 200);                 // place along the fibre
}
for (let k = 0; k < 150; k++) {
    const t = clamp(k / 150 + (rand() * 1.8 - 0.9) / 150, 0, 1);
    ptPos.push(...spline.getPoint(t).toArray());
    ptT.push(t);                                          // beads know their place too
}`}
                </Code>
                <KeyIdea>All fibres in one line object, all beads in one points object, each vertex tagged with its place t along its fibre.</KeyIdea>
            </Section>

            <Section id="drawon" n="04 · Draw-on" title="Revealed by a moving window">
                <P>
                    Because every vertex knows its <C>t</C>, revealing the helix is one comparison in the shader: show it only inside a window <C>[start, end]</C>, with a brighter band at the leading
                    edge. ScienceWorld moves the window’s start from 1.1 down to 0 as the chapter arrives, with a sine-in curve, so the fibres grow from one end while you scroll.
                </P>
                <Code file="engine/fx/helix.ts · threadMaterial (fragment) + ScienceWorld.update" lang="glsl" highlight={['progressAlpha', 'setProgress']}>
                    {`float progressAlpha = step(progress.x, vU) * step(vU, progress.y);      // inside the window?
float endFade = smoothstep(0.05, 0.4, vU);
vec3 progressColor = (1.0 - endFade) * vec3(0.4) * smoothstep(progress.x + 0.1, progress.x, vU);  // bright edge

// ScienceWorld (TypeScript): start sweeps 1.1 → 0 as the stop arrives
const t = sineIn(map(p0, -0.2, 0.29, 0, 1, true));
this.helix.setProgress(map(t, 0, 1, 1.1, 0, true), 3);`}
                </Code>
                <Callout tone="tip" title="Strand offsets">
                    Each fibre gets a small fixed offset (±0.2) subtracted from its t, so fibres don’t all start at exactly the same moment: the reveal looks grown, not printed.
                </Callout>
                <KeyIdea>Reveal = show vertices whose t is inside a moving window; the page slides the window with the scroll.</KeyIdea>
            </Section>

            <Section id="network" n="05 · The network" title="A funnel that breathes">
                <P>
                    The next chapter’s network uses the same toolkit. Candidate nodes sit on two helices that narrow toward the top (a funnel: many candidates in, few out), plus stragglers below.
                    Every pair of nodes closer than 1.8 gets a link, drawn as 30 soft beads. Each frame, nodes push outward on 3D <Term k="simplex">simplex noise</Term>, most near the top, and the
                    link beads are recomputed between their nodes.
                </P>
                <NetworkLab />
                <Code file="engine/fx/network.ts (trimmed)" highlight={['< 1.8', 'noise3d']}>
                    {`// links: every pair closer than 1.8 (done once)
this.nodes.forEach((a, i) => this.nodes.forEach((b, j) => j > i && a.pos.distanceTo(b.pos) < 1.8 && this.links.push([a, b])));

// breathing, every frame
const n = this.t / 1e5;                                       // very slow drift
const i = this.noise.noise3d(v.x + 100 + n, v.y + 100 + n, v.z + n);
const fall = clamp(1 + node.origin.y / 10, 0, 1);            // more near the top
node.pos.copy(node.origin).addScalar(0.2 * i * fall).add(dir.multiplyScalar(1.5 * i * fall));`}
                </Code>
                <TryThis
                    items={[
                        <>Raise nodes per spiral to 26: links multiply (every close pair connects) and it becomes a hairball.</>,
                        <>Speed 40×: you can see the noise: nodes near the top swing, the bottom ones barely move.</>,
                        <>Hide the nodes and keep the link beads: the structure is still readable from the beads alone.</>,
                    ]}
                />
                <KeyIdea>Nodes on narrowing spirals + “link anything closer than 1.8” + noise breathing = a living network from three rules.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/fx/helix.ts', note: 'helixSpline, dna, beadsOnCurve' },
                        { path: 'engine/fx/network.ts', note: 'Network' },
                        { path: 'engine/worlds/ScienceWorld.ts', note: 'placement, scroll mapping' },
                    ]}
                />
            </Section>
        </>
    );
}
