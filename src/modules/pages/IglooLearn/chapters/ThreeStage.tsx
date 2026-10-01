'use client';

import CameraRail from '../demos/CameraRail';
import SceneAnatomy from '../demos/SceneAnatomy';
import { C, Callout, Card, ChapterHead, Code, Grid, KeyIdea, Lens, P, Section, Table, Term, TryThis, Where } from '../kit/ui';

export default function ThreeStageChapter() {
    return (
        <article>
            <ChapterHead
                n="05"
                kicker="Three.js stage"
                title="A film set in the browser."
                lead={
                    <>
                        three.js is a library that turns a description of a 3D world into pixels on a <C>{'<canvas>'}</C>. Its vocabulary is borrowed from film: a set, a camera, lights and actors.
                        Learn five nouns and you can read any three.js code.
                    </>
                }
            />

            <Section id="nouns" n="5.1" title="The five nouns">
                <Grid cols={3}>
                    <Card kicker="Scene" title="The set">
                        A container. Everything you want drawn — objects, lights, fog — is added to it. <C>new THREE.Scene()</C>
                    </Card>
                    <Card kicker="Camera" title="The cinematographer">
                        Position, where it looks, and the lens (<Term k="fov">field of view</Term>). Igloo uses PerspectiveCamera, like a real lens.
                    </Card>
                    <Card kicker="Renderer" title="The projector">
                        Draws scene + camera onto the canvas, once per frame. <C>renderer.render(scene, camera)</C>
                    </Card>
                    <Card kicker="Mesh" title="An actor" accent="var(--il-lilac)">
                        <Term k="geometry">Geometry</Term> (the shape) + <Term k="material">material</Term> (the surface). An igloo brick is a rounded box + a rough grey standard material.
                    </Card>
                    <Card kicker="Light" title="The lighting crew" accent="var(--il-lilac)">
                        Hemisphere (soft sky fill), directional (sun), point (bulb). Lit materials are black without them.
                    </Card>
                    <Card kicker="Frame loop" title="The shutter" accent="var(--il-mint)">
                        A function called every frame: move things, then render. On Igloo it is R3F’s <C>useFrame</C>, driven by the same ticker as scroll.
                    </Card>
                </Grid>
                <Code file="the smallest complete three.js scene">{`const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 400); // lens, aspect, near, far
camera.position.set(0.6, 2.9, 12.6);
camera.lookAt(0.25, 1.15, 0);

const renderer = new THREE.WebGLRenderer({ canvas });
const brick = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 3, 0.09), new THREE.MeshStandardMaterial({ color: '#5c6470', roughness: 0.88 }));
scene.add(brick, new THREE.HemisphereLight('#dfe6ef', '#5d6574', 0.8));

gsap.ticker.add(() => renderer.render(scene, camera));   // the frame loop`}</Code>
            </Section>

            <Section id="anatomy" n="5.2" title="Build the picture, layer by layer">
                <P>
                    This is the igloo scene from act 0, rebuilt with vanilla three.js. Step through the layers to see what each ingredient contributes. By layer 7 it looks like the real page — and
                    there is not a single image file, model file or texture involved.
                </P>
                <SceneAnatomy />
                <Lens>
                    Layers 4–7 are lighting design, not modelling. The igloo is 150 identical grey boxes; the mood — soft, cold, foggy, glowing — comes from light, fog and colour. Treat a 3D scene
                    like a photo shoot: spend your time on light.
                </Lens>
                <Table
                    head={['Ingredient', 'Igloo setting', 'Design effect']}
                    mono={[1]}
                    rows={[
                        ['Background = fog colour', "'#c3cad4' for both", 'No horizon line. The world fades into weather.'],
                        ['FogExp2 density', '0.2 → 0.021 → 0.06', 'Animated: loader whiteout, clear hero, thickens as the shell cracks.'],
                        ['Field of view', '38° → 30° → 44°', 'Long lens for the hero (calm, flat), wider as the camera rises (dramatic).'],
                        ['Environment', 'RoomEnvironment × 0.35', 'Soft, believable reflections without an HDR image file.'],
                        ['Tone mapping', 'NeutralToneMapping', 'Bright glows roll off gently instead of clipping to flat white.'],
                        ['Pixel ratio', 'dpr={[1, 1.5]}', 'Sharp enough on Retina, never 4× the work.'],
                    ]}
                />
            </Section>

            <Section id="camera" n="5.3" title="Camera rails: keyframes you blend">
                <P>
                    Igloo’s camera never uses orbit controls or physics. It has three <strong>keyframe positions</strong> — where it starts in the loader, where it sits in the hero, and where it rises
                    to on scroll — and two dials that blend between them. Each frame, lerp the position, then <C>lookAt</C> the target. That’s a camera rail.
                </P>
                <CameraRail />
                <Code
                    file="canvas/IglooWorld.tsx (camera, every frame)"
                    highlight={['lerp(HERO_POS', 'lerp(RISE_POS', 'lookAt']}
                >{`const ei   = easeInOutCubic(clamp((motion.intro - 0.25) / 0.75)); // loader → hero
const rise = easeInOutCubic(motion.heroCam);                        // scroll → rise

p.copy(INTRO_POS).lerp(HERO_POS, ei).lerp(RISE_POS, rise);          // chained blends
target.copy(HERO_TARGET).lerp(RISE_TARGET, rise);

camera.position.set(
    p.x + pointerSmooth.x * 0.55,                 // parallax
    p.y + pointerSmooth.y * 0.3 + Math.sin(time * 0.3) * 0.04, // + a slow "breathing" bob
    p.z,
);
camera.lookAt(target);
camera.fov = fitFov(lerp(lerp(38, 30, ei), 44, rise), camera.aspect);
camera.updateProjectionMatrix();`}</Code>
                <KeyIdea>A camera move = a few keyframe positions + lerp + lookAt. Add a tiny sine “breath” and pointer parallax so it never feels frozen.</KeyIdea>
                <TryThis
                    items={[
                        'Press “Play the intro”: that is the 4.8-second move after the loader counts to 100.',
                        'Toggle portrait: without fitFov the igloo would be cropped on phones; with it the lens widens instead.',
                        'Turn parallax off and on while hovering. It is a small offset, but it is what makes the scene feel physical.',
                    ]}
                />
            </Section>

            <Section id="worlds" n="5.4" title="Four worlds, four sets">
                <P>
                    Each act is its own scene with its own camera, fog and background — like four separate film sets. <C>useWorld()</C> creates the pair and registers it in a shared list; the
                    compositor (chapter 08) decides which set is filmed this frame.
                </P>
                <Code file="canvas/useWorld.ts + IglooWorld.tsx">{`/** Creates an isolated scene + camera pair and registers it for the compositor. */
export default function useWorld(index, { fov, background, fog, environment }) {
    const world = useMemo(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(background);
        scene.fog = fog;
        const camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 400);
        return { scene, camera };
    }, []);
    useEffect(() => { worlds[index] = world; }, [index, world]);
    return world;
}

// in each world, R3F's createPortal renders JSX into that world's own scene
const { scene } = useWorld(0, { fov: 30, background: '#c3cad4', fog: new THREE.FogExp2('#c3cad4', 0.03) });
return createPortal(<>{/* lights, terrain, bricks … */}</>, scene);`}</Code>
                <Table
                    head={['World', 'Background', 'Fog', 'Lens']}
                    mono={[1, 2, 3]}
                    rows={[
                        ['0 · Igloo', '#c3cad4', 'FogExp2 0.03', '30°'],
                        ['1 · Crystals', '#bcc3cd', 'Fog 6 → 22', '35°'],
                        ['2 · Rings', '#b7bfca', 'Fog 8 → 30', '40° → 100° (dive)'],
                        ['3 · Colony', '#b4bcc7', 'Fog 9 → 30', '38°'],
                    ]}
                />
                <Callout>
                    Notice the four backgrounds: four almost identical cool greys, each a hair darker. When worlds cross-fade, the sky barely shifts — the transition reads as moving through weather,
                    not cutting between slides.
                </Callout>
            </Section>

            <Section id="r3f" n="5.5" title="React Three Fiber vs vanilla">
                <P>
                    Igloo is written with <strong>React Three Fiber</strong> (R3F): three.js objects as JSX, <C>useFrame</C> for the loop. The demos in this guide use plain three.js so you can see
                    every moving part. They are the same library — R3F is a React wrapper, not a different engine.
                </P>
                <Code file="same thing, two ways">{`// vanilla
const light = new THREE.DirectionalLight('#fbfcff', 1.8);
light.position.set(-7, 9, 5);
light.castShadow = true;
scene.add(light);

// React Three Fiber (IglooWorld.tsx)
<directionalLight position={[-7, 9, 5]} intensity={1.8} color="#fbfcff" castShadow shadow-mapSize={[1024, 1024]} />`}</Code>
                <Where
                    files={[
                        { path: 'canvas/Experience.tsx', note: 'Canvas, env, tone mapping' },
                        { path: 'canvas/useWorld.ts' },
                        { path: 'canvas/IglooWorld.tsx', note: 'camera rail' },
                        { path: 'utils/math.ts', note: 'fitFov' },
                    ]}
                />
            </Section>
        </article>
    );
}
