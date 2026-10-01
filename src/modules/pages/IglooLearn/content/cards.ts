import type { ChapterId } from './chapters';

export type Flashcard = { q: string; a: string };

/** "Lock it in" cards at the end of every chapter — pooled for the final quiz. */
export const CARDS: Record<ChapterId, Flashcard[]> = {
    map: [
        {
            q: 'What does scrolling actually control on the Igloo page?',
            a: 'One playhead (0 → 16). A master timeline turns the playhead into ~12 numbers ("dials"); every 3D world and text layer just reads those dials each frame.',
        },
        { q: 'How long is the page, and what is one unit of the timeline?', a: '16 timeline units. One unit = one viewport height of scroll, so the invisible scroll track is (16 + 1) × 100vh tall.' },
        { q: 'Name the four worlds, in order.', a: 'Igloo (hero) → Crystals (portfolio) → Rings (portal) → Particle colony (socials). Then the loop returns to the igloo.' },
        {
            q: 'Why keep the dials in a plain object instead of React state?',
            a: 'They change 60 times a second. A plain object can be written by GSAP and read by WebGL without re-rendering React at all.',
        },
    ],
    smooth: [
        { q: 'What does Lenis do?', a: 'It intercepts wheel/touch input and glides the scroll position toward the target every frame (lerp) instead of jumping.' },
        {
            q: 'lerp(a, b, 0.1) each frame gives what kind of motion?',
            a: 'Fast at first, then slower and slower — an ease-out that never overshoots. 0.1 means "cover 10% of the remaining gap per frame".',
        },
        {
            q: 'Why use damp() instead of a fixed lerp factor?',
            a: 'A fixed factor moves faster on 144Hz screens than on 60Hz. damp(a, b, λ, dt) = lerp(a, b, 1 − e^(−λ·dt)) feels identical at any frame rate.',
        },
        { q: 'What is "the one clock"?', a: 'gsap.ticker. It drives Lenis (lenis.raf), ScrollTrigger updates and the demos, so everything moves in the same frame with no drift.' },
    ],
    mapping: [
        { q: 'The 4-step recipe to map scroll to a property?', a: '1 Normalise (value − start) / (end − start) · 2 Clamp to 0..1 · 3 Ease · 4 Lerp between the from and to values.' },
        {
            q: 'How do the igloo bricks build bottom-to-top from one number?',
            a: 'Each brick gets its own window: delay = height × 0.5 + random × 0.14. Local progress = clamp((intro − delay) / duration).',
        },
        { q: 'What does smoothstep(e0, e1, x) return?', a: '0 below e0, 1 above e1, and a soft S-curve in between. A clamp and an ease in one call.' },
        { q: 'Why add a little random to each stagger delay?', a: 'Perfectly even delays look mechanical. A small random offset makes the ripple feel organic, like real debris.' },
    ],
    timeline: [
        {
            q: 'Why one master timeline instead of many ScrollTriggers?',
            a: 'Exact overlaps between scenes, a single source of truth for timing, perfect reversibility, and easy looping — like one AE comp.',
        },
        { q: 'What does scrub: true do?', a: 'Links the timeline playhead directly to scroll progress. scrub: 1 adds 1 second of catch-up smoothing.' },
        {
            q: 'Why is the default ease on the master timeline "none"?',
            a: 'Scroll is already smoothed by Lenis. Easing is added per tween only where a move needs character, otherwise scroll feels laggy.',
        },
        {
            q: 'How does the UI know which section you are in without re-rendering every frame?',
            a: 'onUpdate computes the section from progress and only writes to the React store when the section number changes.',
        },
    ],
    text: [
        {
            q: 'How does a masked line reveal work?',
            a: 'SplitText wraps each line in an overflow-hidden mask. The line starts at yPercent: 110 (hidden below) and rises to 0 with expo.out and a small stagger.',
        },
        { q: 'What is the Igloo "decode" effect?', a: 'GSAP ScrambleTextPlugin: characters cycle through a glyph set (!<>-_\\/[]{}…) and resolve left to right into the real text.' },
        { q: 'How do you draw an SVG line on?', a: 'Give the path pathLength="1", set stroke-dasharray: 1 and animate stroke-dashoffset from 1 to 0.' },
        { q: 'Why remount the caption component with a key per section?', a: 'So SplitText always splits clean text and the reveal replays from scratch. The cleanup reverts the split.' },
    ],
    three: [
        { q: 'The five things every three.js picture needs?', a: 'A scene, a camera, a renderer, at least one mesh (geometry + material) and, for lit materials, a light.' },
        { q: 'How does the igloo camera travel on scroll?', a: 'Keyframe positions (INTRO → HERO → RISE) blended with lerp by eased progress, then camera.lookAt(target) every frame.' },
        { q: 'What makes the horizon vanish into the sky?', a: 'Fog whose colour equals the background colour. FogExp2 density is also animated during the intro and the explosion.' },
        { q: 'What does fitFov() fix?', a: 'On portrait screens the vertical field of view is widened so the scene keeps its horizontal framing instead of cropping the sides.' },
    ],
    objects: [
        { q: 'What is instancing?', a: 'Drawing one geometry many times in a single draw call, each copy with its own matrix (position/rotation/scale) and colour.' },
        { q: 'Where does the igloo shape come from?', a: 'Code: rows of rounded boxes placed around a dome (angle × row), every other row offset by half a brick, with a gap for the entrance.' },
        { q: 'Why seed the random generator?', a: 'rng(seed) returns the same sequence every load, so the scene is designed once and looks identical for everyone.' },
        { q: 'How does light glow through the seams?', a: 'A real point light inside, a tiny bright core with toneMapped=false (HDR colour > 1) and a dim backing sphere just behind the bricks.' },
    ],
    shaders: [
        { q: 'Vertex vs fragment shader?', a: 'Vertex runs per point and moves shapes. Fragment runs per pixel and decides colour.' },
        {
            q: 'Uniform vs attribute vs varying?',
            a: 'Uniform: one value for everyone (time, progress). Attribute: per-vertex data (position, seed). Varying: passed from vertex to fragment, blended across triangles.',
        },
        { q: 'How is the crystal edge glow made?', a: 'Fresnel: pow(1 − dot(normal, view), power). Grazing angles light up; a cosine palette on top gives thin-film iridescence.' },
        { q: 'What is the cosine palette formula?', a: 'color(t) = a + b · cos(2π(c·t + d)). Tweak the phase d to rotate hues — used for the rainbow streaks and iridescence.' },
    ],
    worlds: [
        { q: 'How can two 3D worlds cross-fade?', a: 'Each renders into its own render target (an offscreen image). A full-screen shader blends the two images.' },
        { q: 'What does motion.scene = 2.3 mean?', a: 'Floor 2 = Rings world is 70% visible, world 3 (colony) is 30% — the fraction is the blend amount.' },
        { q: 'How does the fog dissolve look organic?', a: 'The blend mask is noise: smoothstep(n − 0.28, n + 0.28, t) — each pixel switches at a slightly different time.' },
        { q: 'How is bloom so cheap here?', a: 'Render targets have mipmaps (pre-blurred smaller copies). Reading a high mip level of only the bright parts = free blur.' },
    ],
    particles: [
        { q: 'What keeps a particle on the shape?', a: 'A spring toward its home point: acceleration = (home − position) × stiffness, minus velocity × damping.' },
        { q: 'What is "energy" in the colony sim?', a: 'A per-particle value raised by the cursor, clicks and morphs. It loosens the spring, adds turbulence and drives the glow, then decays.' },
        { q: 'How are 65,536 particles simulated each frame?', a: 'GPGPU: positions and velocities live in 256×256 float textures; a shader updates every pixel (particle) in parallel.' },
        { q: 'How are shapes like the X logo turned into particles?', a: 'Draw it on a hidden 2D canvas, read the pixels, and randomly sample points where alpha > 0.5.' },
    ],
    interaction: [
        { q: 'Why smooth the pointer?', a: 'Raw mouse input is jittery. damp(pointerSmooth, pointer, 3.5, dt) gives the camera and parallax a soft, heavy follow.' },
        { q: 'How do HTML labels stick to 3D crystals?', a: 'Every frame, vector.project(camera) turns the 3D centre into screen x/y; the label gets translate3d(x, y, 0).' },
        { q: 'Click vs drag — how do they tell?', a: 'On pointer up: if it moved less than 6px and took less than 350ms it is a click (shockwave); otherwise it was a drag (spin).' },
        { q: 'How is sound made without audio files?', a: 'Web Audio: filtered brown noise for wind, detuned oscillators for drones, short square blips for UI ticks.' },
    ],
    performance: [
        { q: 'What is the frame budget at 60fps?', a: '16.7ms for everything — JavaScript, physics, rendering. Miss it and the frame drops.' },
        { q: 'Two cheap wins on the renderer?', a: 'Cap the pixel ratio (dpr [1, 1.5]) and turn off canvas antialias when post-processing renders into MSAA targets.' },
        { q: 'Why skip worlds with weight 0?', a: 'Off-screen worlds do no updates and no renders — at most two worlds cost anything at any time.' },
        { q: 'Rule for the per-frame loop?', a: 'No new objects, no React state, no layout reads. Reuse temp vectors and write straight to three.js / style.' },
    ],
    build: [
        { q: 'First thing to design before any code?', a: 'The storyboard in scroll units: which scene, from which screen to which, and which dials move in each act.' },
        { q: 'Minimum stack for a page like this?', a: 'Lenis + GSAP ScrollTrigger (one master timeline) + a plain motion object + three.js / R3F worlds + a compositor pass + a DOM text layer.' },
    ],
};
