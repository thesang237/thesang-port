'use client';

import HudAnchor from '../demos/HudAnchor';
import MagneticButton from '../demos/MagneticButton';
import PointerParallax from '../demos/PointerParallax';
import SoundLab from '../demos/SoundLab';
import { C, Callout, ChapterHead, Code, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function InteractionChapter() {
    return (
        <article>
            <ChapterHead
                n="10"
                kicker="Interaction"
                title="Scroll tells the story. The pointer makes it yours."
                lead={
                    <>
                        The timeline is the same for everyone. What makes Igloo feel alive is that every world also reacts to <em>you</em>: the camera leans toward the cursor, bricks lift, crystals
                        glitch, particles scatter, buttons lean in and tick. All of it grows from a single smoothed pointer value.
                    </>
                }
            />

            <Section id="pointer" n="10.1" title="One pointer value, smoothed">
                <P>
                    The mouse position is converted to <Term k="ndc">NDC</Term> — −1 on the left edge, +1 on the right, −1 at the bottom, +1 at the top — so it doesn’t care about screen size. A{' '}
                    <em>smoothed</em> copy follows it with <Term k="damp">damp</Term>. Every camera and parallax effect reads the smoothed copy; only hit-testing uses the raw one.
                </P>
                <PointerParallax />
                <Code file="IglooPage.tsx → Inputs" highlight={['damp']}>{`const onMove = (e: PointerEvent) => {
    motion.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;     // -1 … 1
    motion.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;   // -1 … 1, up is +
    motion.hasPointer = true;                                        // no hover effects until the mouse moves
};
gsap.ticker.add((_, dt) => {
    motion.pointerSmooth.x = damp(motion.pointerSmooth.x, motion.pointer.x, 3.5, dt / 1000);
    motion.pointerSmooth.y = damp(motion.pointerSmooth.y, motion.pointer.y, 3.5, dt / 1000);
});

// every world then adds a little of it to its camera, e.g. the igloo:
camera.position.x = rail.x + motion.pointerSmooth.x * 0.55;`}</Code>
                <Lens>
                    Parallax is a depth cue you control with numbers: the further a layer is from the subject, the less (or more) it moves. Keep the subject nearly still and let the world move around
                    it.
                </Lens>
            </Section>

            <Section id="picking" n="10.2" title="Picking, and HTML glued to 3D">
                <P>
                    To know what the cursor is over in 3D, you <Term k="raycast">raycast</Term>: shoot a ray from the camera through the cursor and ask which mesh it hits first. To put HTML labels
                    next to a 3D object, do the opposite: <Term k="project">project</Term> the object’s 3D position to 2D screen pixels, every frame, and move the label there. That’s the whole crystal
                    HUD.
                </P>
                <HudAnchor />
                <Code file="canvas/CrystalWorld.tsx (per frame)" highlight={['intersectObject', '.project(camera)']}>{`// 1 · picking: which crystal is under the cursor?
raycaster.setFromCamera(new Vector2(motion.pointer.x, motion.pointer.y), camera);
const hit = raycaster.intersectObject(crystalMesh, false)[0];
if (hit && hit.distance < best) hover = i;
document.body.style.cursor = hover >= 0 ? 'pointer' : '';

// 2 · anchoring: 3D centre → screen pixels → move the DOM node (no React render)
v.set(group.position.x, group.position.y, 0).project(camera);     // → NDC -1..1
const sx = v.x * halfW + halfW;
const sy = -v.y * halfH + halfH;
hudNodes[i].style.transform = \`translate3d(\${sx}px, \${sy}px, 0)\`;
hudNodes[i].style.opacity = String(smoothstep(0.5, 0.15, Math.abs(offset)));`}</Code>
                <Callout>
                    The igloo doesn’t raycast its 150 bricks at all. It intersects the ray with a mathematical sphere (the dome’s radius) — a few multiplications — then lifts bricks by their distance
                    to that hit point. Choose the cheapest shape that gives the right answer.
                </Callout>
                <TryThis
                    items={[
                        'Hover between crystals: the ray turns white only on a hit.',
                        'Click a crystal and watch three things happen from one value: the camera pushes in, the others dim, the frame sinks into blurred slate.',
                    ]}
                />
            </Section>

            <Section id="magnetic" n="10.3" title="Magnetic buttons and springy releases">
                <P>
                    The prev/next arrows lean toward the cursor while you hover inside their generous padding, then snap back with an elastic ease when you leave. Two tweens, a few lines. The elastic
                    release is the whole personality — try the three release types.
                </P>
                <MagneticButton />
                <Code file="ui/SocialCarousel.tsx → Arrow">{`const onMove = (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(inner, {
        x: (e.clientX - (r.left + r.width / 2)) * 0.25,   // follow 25% of the offset
        y: (e.clientY - (r.top + r.height / 2)) * 0.25,
        duration: 0.5, ease: 'power3.out',                 // re-targeted on every move = soft follow
    });
};
const onLeave = () => gsap.to(inner, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' });`}</Code>
            </Section>

            <Section id="gestures" n="10.4" title="Gestures in the colony: sweep, drag, click">
                <Table
                    head={['Gesture', 'How it’s detected', 'What it does']}
                    rows={[
                        ['Move (sweep)', 'Cursor ray + its velocity in the figure’s local space', 'Particles near the ray are dragged and glow'],
                        ['Rest > 1.6s', 'Time since last pointer move', 'An invisible breeze orbits the figure (idle wisps)'],
                        ['Drag', 'Pointer down + moved > 6px', 'Spin velocity += movementX × 0.0022, decays with damp (inertia)'],
                        ['Click', 'Pointer up within 350ms, moved < 6px', 'Shockwave along the click ray'],
                        ['← / → keys', 'Only while section === 3 and no overlay', 'Morph to the previous / next social shape'],
                    ]}
                />
                <Code file="canvas/ParticleWorld.tsx (trimmed)">{`const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; };
const onMove = (e) => {
    if (!down) return;
    if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) down.moved = true;
    spinVel += e.movementX * 0.0022;                        // drag → spin
};
const onUp = (e) => {
    if (down && !down.moved && performance.now() - down.t < 350) shockAt = pointerNDC(e); // click → shock
    down = null;
};
// every frame: inertia
spinVel = damp(spinVel, 0, 2.2, dt);
spin += dt * autoSpin + spinVel;`}</Code>
                <Callout tone="warn" title="Guard every interaction">
                    Each world checks it is actually on screen (<C>worldWeight &gt; 0.9</C>), that no overlay is open, that the pointer isn’t over a panel (<C>motion.overUI</C>) and that the mouse has
                    moved at least once (<C>hasPointer</C>). Without guards, hidden worlds react to clicks and touch devices get stuck hover states.
                </Callout>
            </Section>

            <Section id="sound" n="10.5" title="Sound as feedback">
                <P>
                    Igloo’s sound is generated live with the Web Audio API — there isn’t a single audio file. Wind is filtered noise, the hum is three detuned sine waves, and every hover or click
                    plays a 50-millisecond square blip at a pitch that means something (higher = forward/open, lower = back/close). It’s off by default and toggled by the user.
                </P>
                <SoundLab />
                <Code file="utils/sound.ts → tick()">{`tick(freq = 1800) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);  // 50ms blip
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.06);
}`}</Code>
                <KeyIdea>Every interaction gets three responses: motion (it moves), light (it glows or glitches) and sound (it ticks). Consistency across the three is what feels premium.</KeyIdea>
                <Where
                    files={[
                        { path: 'IglooPage.tsx', note: 'Inputs' },
                        { path: 'canvas/CrystalWorld.tsx', note: 'pick + HUD' },
                        { path: 'ui/SocialCarousel.tsx', note: 'magnetic' },
                        { path: 'utils/sound.ts' },
                    ]}
                />
            </Section>
        </article>
    );
}
