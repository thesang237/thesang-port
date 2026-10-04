'use client';

import DialLab from '../demos/DialLab';
import PlantSpring from '../demos/PlantSpring';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function Springs() {
    return (
        <>
            <ChapterHead
                n="09"
                kicker="Springs"
                title="Everything that sways is a spring."
                lead={
                    <>
                        The stalk rippling in the wind, the field behind it, the seedling’s leaves when you brush past, the molecules leaning after your pointer, the kernel dial you can flick: all the
                        same tiny rule, applied to a lot of numbers, sixty times a second.
                    </>
                }
            />

            <Section id="rule" n="01 · The rule" title="Three lines per bone">
                <P>
                    The plants are rigged models: invisible <Term k="bones">bones</Term> bend the mesh. Each bone’s angle is a spring. Every step, the bone’s speed becomes a pull back toward its rest
                    angle (× DRAG, 0.05) plus what’s left of its old speed (× ELASTIC, 0.5); then the angle moves by that speed. Before that, each bone also inherits part of its parent’s speed (0.6 up
                    the stem, 0.9 along a leaf), which is why a push at the base ripples up to the tips.
                </P>
                <PlantSpring />
                <Code file="engine/worlds/StalkWorld.ts · step() (stem, trimmed)" highlight={['* DRAG', 'prev.speed, 0.6']}>
                    {`k.stem.forEach((w, y) => {
    const A = y / n0;                                        // 0 at the base → 1 at the top
    const s = 0.2 * (Math.sin(0.01 * n + L) + 1);              // a slow per-bone rhythm
    w.speed.addScaledVector(windHere, s * M * 0.5 * (1 + A)); // the wind pushes, more near the top
    if (prev) w.speed.addScaledVector(prev.speed, 0.6);       // inherit the parent's motion
    w.speed.set(
        (w.target.x + bend.x - w.rot.x) * DRAG + w.speed.x * ELASTIC,   // DRAG 0.05, ELASTIC 0.5
        (w.target.y + bend.y - w.rot.y) * DRAG + w.speed.y * ELASTIC,
        (w.target.z + bend.z - w.rot.z) * DRAG + w.speed.z * ELASTIC,
    );
    w.rot.add(w.speed);
    w.bone.rotation.set(w.rot.x, w.rot.y, w.rot.z);
    prev = w;
});`}
                </Code>
                <Lens>After Effects’ “inertial bounce” expression on every puppet pin, with each pin also dragged along by the pin below it.</Lens>
                <KeyIdea>speed = (rest − angle) × 0.05 + speed × 0.5, plus a share of the parent’s speed: one rule makes the whole plant move.</KeyIdea>
            </Section>

            <Section id="wind" n="02 · Wind" title="Noise in, gusts out">
                <P>
                    Random numbers each step would make the plants shiver, not sway. So the noise goes through five <Term k="leaky">leaky integrators</Term> in a row: each keeps 95 % of its own value
                    and adds 80 % of the stage before it. Every stage smooths the signal more; after five, jitter has become slow, rolling gusts. The noise is also biased (<C>rand − 0.3</C>), so the
                    wind has a direction.
                </P>
                <Code file="engine/worlds/StalkWorld.ts · step() (wind)" highlight={['multiplyScalar(0.95)']}>
                    {`const r = (Math.random() - 0.3) * -this.p.windPower * 3e-6;   // biased noise
this.wind[0].set(0, 0.4 * r, r);
for (let i = 1; i < this.wind.length; i++)                      // 5 stages
    this.wind[i].addScaledVector(this.wind[i - 1], 0.8).multiplyScalar(0.95);
this.windNow.copy(this.wind[this.wind.length - 1]);`}
                </Code>
                <TryThis
                    items={[
                        <>Set leaky stages to 1: the plant twitches with raw noise. Step up to 5 and watch the green line turn into gusts.</>,
                        <>Storm preset (3): the same chain, thirty times the power. That’s the whole storm, plus rain and lightning in the shader.</>,
                        <>ELASTIC 0.95: the plant keeps swinging long after a kick. 0.5 settles in about half a second.</>,
                    ]}
                />
                <KeyIdea>Five leaky integrators turn random jitter into gusts; wind power alone separates calm (0.1) from storm (3).</KeyIdea>
            </Section>

            <Section id="fixed" n="03 · The clock" title="Fixed steps: the same motion on every screen">
                <P>
                    Step a spring once per frame and it runs 2.4× faster on a 144 Hz monitor than on a 60 Hz one. The page runs the simulation on a <Term k="fixedStep">fixed time step</Term>: real
                    time accumulates, and the simulation takes as many 1/60 s steps as fit (at most four per frame, so a long pause can’t trigger a burst).
                </P>
                <Code file="engine/worlds/StalkWorld.ts · update()" highlight={['STEP * 4', 'while (this.acc >= STEP)']}>
                    {`this.acc = Math.min(this.acc + dt, STEP * 4);     // STEP = 1/60 s; cap after a pause
while (this.acc >= STEP) {
    this.acc -= STEP;
    this.simMs += STEP * 1000;
    this.step(this.simMs);                          // the reference animated in frames: keep its pace
}`}
                </Code>
                <KeyIdea>Accumulate real time, step in fixed 1/60 s ticks (max 4 per frame): springs feel identical at 30, 60 or 144 Hz.</KeyIdea>
            </Section>

            <Section id="field" n="04 · The field" title="A field of rigged plants">
                <P>
                    The stalk chapter is a small field simulator. A sharp front stalk with four leaf layers, a field of rigged plants behind it (each a clone with its own skeleton), rows of flat{' '}
                    <Term k="billboard">billboard</Term> plants towards the sky, all driven by the same wind. Picking a test condition kicks the front stalk so it shivers into the new weather (chapter
                    10 covers the weather).
                </P>
                <Table
                    head={['Layer', 'How many', 'Motion']}
                    mono={[1]}
                    rows={[
                        ['Front stalk', '1, 4 skinned leaf layers', 'Ripples up from the base: sin(0.3 · height + 0.2 · tick)'],
                        ['Field plants', '7 + 9 rigged clones', 'Full bone springs: stem chain + leaf chains, per plant phase'],
                        ['Billboard rows', '153 cards in 31 rows', 'One spring per card, leaning with the wind'],
                        ['Simulation', 'fixed 60 Hz', 'All of the above, every step'],
                    ]}
                />
                <Callout tone="tip" title="Each clone needs its own skeleton">
                    Copying a rigged model the normal way would share one skeleton between all copies, so they’d all bend together. The page uses <C>SkeletonUtils.clone</C>, which gives each plant its
                    own bones, and turns each plant a different way (<C>bone.rotation.y = index</C>).
                </Callout>
                <KeyIdea>One wind, three kinds of plant (rigged front stalk, rigged clones, billboards), all stepped together at 60 Hz.</KeyIdea>
            </Section>

            <Section id="dial" n="05 · Throwing" title="The kernel dial: a spring you can throw">
                <P>
                    In the “Meet the new class” deep dive you drag the kernel sideways like a dial. While you drag, a stiff, heavy spring follows your hand. When you let go, the dial projects your
                    release speed forward (as if a 0.95 friction let it coast) and snaps the target to the nearest third: one fact per third. Then a softer spring with a little overshoot carries it
                    there.
                </P>
                <DialLab />
                <Code file="engine/worlds/KernelWorld.ts · dragEnd()" highlight={['const proj', 'Math.round(proj / this.spinStep)']}>
                    {`this.spring = 0.05;
this.friction = 0.68;
// throw: project the release speed (reference project(v, 0.95)) and snap to a third
const proj = (2 * this.spinVel * 0.95) / (1 - 0.95);
const t = Math.round(proj / this.spinStep);
this.spinTg = t === 0
    ? Math.floor((this.spinTg + this.spinDelta + 0.5 * this.spinStep) / this.spinStep) * this.spinStep  // slow: nearest
    : Math.floor((this.spinTg + 0.5 * this.spinStep) / this.spinStep + t) * this.spinStep;              // flick: travel t`}
                </Code>
                <TryThis
                    items={[
                        <>Turn off “snap to thirds” and flick: it coasts and stops between two facts. Snapping is what makes it feel like a control, not a toy.</>,
                        <>Release friction 0.95: it rings back and forth around the fact. 0.68 gives one soft overshoot.</>,
                        <>Drag friction 0.9: the kernel lags and wobbles behind your hand. 0.52 makes it feel heavy and direct.</>,
                    ]}
                />
                <Callout tone="tip" title="The molecules too">
                    The columns of molecules beside the kernel are springs as well: each node is held at rest length 1 from a slowly turning anchor and pulled gently toward the pointer, so the whole
                    column leans after your cursor (<C>fx/cluster.ts</C>).
                </Callout>
                <KeyIdea>Drag = stiff, heavy spring; release = project the speed, snap to a third, soft spring there.</KeyIdea>
                <Where
                    files={[
                        { path: 'engine/worlds/StalkWorld.ts', note: 'bones, wind, fixed step' },
                        { path: 'engine/worlds/KernelWorld.ts', note: 'the dial' },
                        { path: 'engine/fx/cluster.ts', note: 'molecules' },
                        { path: 'engine/worlds/ScienceWorld.ts', note: 'leaf brush in the pot' },
                    ]}
                />
            </Section>
        </>
    );
}
