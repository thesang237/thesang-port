/**
 * Plain-language dictionary. Hover any dotted-underlined word in the guide to
 * see its entry. `lens` = how a designer might already think about it.
 */
export type GlossaryEntry = { term: string; plain: string; lens?: string };

export const GLOSSARY: Record<string, GlossaryEntry> = {
    lerp: {
        term: 'lerp',
        plain: 'Short for "linear interpolation": find the value part-way between A and B. lerp(0, 100, 0.25) = 25.',
        lens: 'Like the opacity slider between two states in Smart Animate.',
    },
    damp: {
        term: 'damp',
        plain: 'Each frame, move a fixed share of the remaining distance toward a target, adjusted for frame time so it feels the same at 30 or 144 fps.',
        lens: 'A spring with no bounce: fast at first, then gently settles.',
    },
    ease: {
        term: 'easing',
        plain: 'A curve that reshapes progress 0→1 so motion speeds up, slows down, overshoots or bounces.',
        lens: 'The bezier curve in the Figma/AE graph editor.',
    },
    progress: {
        term: 'progress',
        plain: 'A number from 0 to 1 that says how far through something you are. Every animation in the guide starts from one.',
        lens: 'The playhead position, as a percentage.',
    },
    scrub: {
        term: 'scrub',
        plain: 'Tie an animation to the scrollbar so scrolling moves it forward and back instead of playing it on its own.',
        lens: 'Dragging the playhead in the timeline panel.',
    },
    timeline: {
        term: 'timeline',
        plain: 'A GSAP object that holds many tweens at exact times, so they can overlap and be controlled as one.',
        lens: 'An After Effects composition.',
    },
    tween: {
        term: 'tween',
        plain: 'One animation of one or more values from A to B over a duration with an ease.',
        lens: 'Two keyframes and the curve between them.',
    },
    position: {
        term: 'position parameter',
        plain: 'The third argument of a timeline call: the exact time a tween starts, e.g. tl.to(x, {...}, 2.4).',
        lens: 'Where the keyframe bar starts on the AE timeline.',
    },
    scrolltrigger: {
        term: 'ScrollTrigger',
        plain: 'GSAP plugin that watches the scroll position and turns it into progress for an animation.',
    },
    lenis: {
        term: 'Lenis',
        plain: 'A tiny library that intercepts the mouse wheel and glides the page to the target instead of jumping.',
        lens: 'Motion blur for scrolling.',
    },
    splittext: {
        term: 'SplitText',
        plain: 'GSAP plugin that wraps each line, word or letter of a paragraph in its own element so each can animate.',
    },
    mask: {
        term: 'mask',
        plain: 'A wrapper with overflow: hidden. Text moving inside it appears to rise out of an invisible slot.',
        lens: 'A clipping mask on a frame.',
    },
    stagger: {
        term: 'stagger',
        plain: 'Start the same animation on many items with a small delay between each, so they ripple instead of moving in lockstep.',
        lens: 'Offsetting layers by a few frames in AE.',
    },
    scramble: {
        term: 'scramble',
        plain: 'Text that "decodes" from random glyphs into the real characters, left to right.',
    },
    scene: {
        term: 'scene',
        plain: 'The 3D container that holds every object, light and fog. Nothing is drawn unless it is inside a scene.',
        lens: 'An artboard, but in 3D.',
    },
    camera: {
        term: 'camera',
        plain: 'Decides what part of the scene you see and with what lens (field of view).',
        lens: 'The viewport of the artboard — and the cinematographer.',
    },
    renderer: {
        term: 'renderer',
        plain: 'Turns scene + camera into pixels on a <canvas>, once per frame.',
        lens: 'Export — but 60 times a second.',
    },
    mesh: {
        term: 'mesh',
        plain: 'A visible 3D object = geometry (its shape) + material (its surface).',
    },
    geometry: {
        term: 'geometry',
        plain: 'The shape of an object as a list of points (vertices) joined into triangles.',
        lens: 'The vector path, but in 3D.',
    },
    material: {
        term: 'material',
        plain: 'How a surface reacts to light: colour, roughness, metalness, transparency — or a custom shader.',
        lens: 'Fill + effects of a layer.',
    },
    fov: {
        term: 'field of view',
        plain: 'How wide the camera lens is, in degrees. Small = telephoto (flat), large = wide angle (dramatic perspective).',
    },
    fog: {
        term: 'fog',
        plain: 'Fades far-away objects into a colour. When the fog colour equals the background, the horizon disappears.',
        lens: 'An atmospheric-perspective gradient.',
    },
    shader: {
        term: 'shader',
        plain: 'A small program that runs on the graphics card, once per vertex or per pixel, all in parallel.',
        lens: 'A blend mode or filter you write yourself.',
    },
    vertex: {
        term: 'vertex shader',
        plain: 'Runs once per point of a geometry and decides where it lands on screen. Moves shapes.',
    },
    fragment: {
        term: 'fragment shader',
        plain: 'Runs once per pixel and decides its colour. Paints surfaces.',
    },
    uniform: {
        term: 'uniform',
        plain: 'A value you send to a shader that is the same for every pixel/vertex this frame — time, progress, mouse.',
        lens: 'A design token or a global dial.',
    },
    attribute: {
        term: 'attribute',
        plain: 'Per-vertex data stored in the geometry: position, uv, or your own (a random seed, a delay).',
        lens: 'A property on each layer instance.',
    },
    varying: {
        term: 'varying',
        plain: 'A value the vertex shader hands to the fragment shader, smoothly blended across the triangle.',
    },
    uv: {
        term: 'uv',
        plain: 'A 2D coordinate from 0 to 1 across a surface or the screen: (0,0) bottom-left, (1,1) top-right.',
        lens: 'Percent-based x/y inside a frame.',
    },
    noise: {
        term: 'noise',
        plain: 'Smooth randomness: nearby inputs give similar outputs, so it looks like clouds, terrain or water rather than TV static.',
    },
    fbm: {
        term: 'fbm',
        plain: '"Fractal Brownian motion": several layers of noise at growing detail and shrinking strength, added together.',
        lens: 'Stacking the same texture at different scales and opacities.',
    },
    fresnel: {
        term: 'fresnel',
        plain: 'Surfaces seen at a grazing angle reflect more light. Used to make edges glow on glass, ice and water.',
        lens: 'An inner-glow that follows the silhouette.',
    },
    instancing: {
        term: 'instancing',
        plain: 'Draw one geometry many times in a single GPU call, each copy with its own position, rotation, scale and colour.',
        lens: 'Component instances — one master, many overrides.',
    },
    drawcall: {
        term: 'draw call',
        plain: 'One "please draw this" request from JavaScript to the GPU. Each costs time, so fewer is faster.',
    },
    rendertarget: {
        term: 'render target',
        plain: 'An invisible image you render a scene into, so you can use it as a texture later.',
        lens: 'A pre-comp in After Effects.',
    },
    post: {
        term: 'post-processing',
        plain: 'Effects applied to the finished frame as a whole image: bloom, blur, grain, colour grading, distortion.',
        lens: 'An adjustment layer on top of everything.',
    },
    bloom: {
        term: 'bloom',
        plain: 'Bright areas bleed a soft glow into their surroundings, like light in a camera lens.',
    },
    ca: {
        term: 'chromatic aberration',
        plain: 'Red, green and blue channels slightly offset, like a cheap lens. Reads as speed, glitch or "lens-ness".',
    },
    tonemapping: {
        term: 'tone mapping',
        plain: 'Squeezes very bright (HDR) values into what a screen can show, keeping highlights soft instead of clipped.',
    },
    hdr: {
        term: 'HDR colour',
        plain: 'Colour values brighter than 1.0 (pure white). They are what bloom and glow pick up.',
    },
    raycast: {
        term: 'raycast',
        plain: 'Shoot an invisible line from the camera through the cursor and see what 3D object it hits first.',
        lens: 'Hit-testing, but in 3D.',
    },
    ndc: {
        term: 'NDC',
        plain: '"Normalised device coordinates": the screen as -1..1 on both axes, centre = (0,0), y pointing up.',
    },
    project: {
        term: 'project',
        plain: 'Convert a 3D point into its 2D screen position — how HTML labels stick to 3D objects.',
    },
    gpgpu: {
        term: 'GPGPU',
        plain: 'Using the graphics card for general maths — here, physics for 65k particles — by storing data in textures.',
    },
    spring: {
        term: 'spring',
        plain: 'A force that pulls toward a target, stronger the further away you are. Paired with damping to stop wobble.',
    },
    dpr: {
        term: 'device pixel ratio',
        plain: 'How many real screen pixels per CSS pixel (2 on Retina). Rendering 3D at full DPR is 4× the work of DPR 1.',
    },
    seeded: {
        term: 'seeded random',
        plain: 'A random generator that gives the same sequence every time for the same seed, so the scene looks identical on every reload.',
    },
    smoothstep: {
        term: 'smoothstep',
        plain: 'Returns 0 below a start value, 1 above an end value, and an S-shaped blend between. The shader world’s favourite ease.',
    },
    clamp: {
        term: 'clamp',
        plain: 'Keep a number inside a range — anything below 0 becomes 0, above 1 becomes 1.',
    },
    ticker: {
        term: 'ticker',
        plain: 'GSAP’s heartbeat: one requestAnimationFrame loop that calls everything that needs to update each frame.',
    },
};
