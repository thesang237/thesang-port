/**
 * Plain-language dictionary. Hover any dotted-underlined word in the guide to see its entry.
 * `lens` = how a designer might already think about it.
 */
export type GlossaryEntry = { term: string; plain: string; lens?: string };

export const GLOSSARY: Record<string, GlossaryEntry> = {
    step: {
        term: 'step',
        plain: 'One notch of the story scroll. The page moves in whole steps: each chapter has one or two “dwell” steps where the scene travels on, then one step that carries the story to the next chapter.',
        lens: 'A keyframe the playhead always comes to rest on.',
    },
    dwell: {
        term: 'dwell',
        plain: 'The steps a chapter keeps for itself: the copy stays, the 3D scene keeps moving (the camera walks down the plant, the field pans). Measured 0 → 1 inside the chapter.',
        lens: 'Holding on a shot while the camera keeps drifting.',
    },
    pos: {
        term: 'story position',
        plain: 'The one number every frame is built from: 0 = hero, 1 = the DNA chapter, 1.5 = half way through the move from chapter 1 to 2, and so on up to 9 (the hero again).',
        lens: 'The playhead of an After Effects comp, in chapters instead of seconds.',
    },
    spring: {
        term: 'critically damped spring',
        plain: 'A follower with momentum: it accelerates toward its target, slows down as it arrives and never overshoots. It starts softly, unlike a plain “move 10 % closer each frame”.',
        lens: 'An ease-in-out that adapts when the target changes mid-move.',
    },
    damp: {
        term: 'damp (exponential smoothing)',
        plain: 'Each frame, close a fixed share of the gap to the target, corrected for frame time so it feels the same at 30 or 144 fps. Fast start, slow end, no momentum.',
        lens: 'An ease-out that you can retarget at any moment.',
    },
    lerp: {
        term: 'lerp',
        plain: 'Linear interpolation: mix(a, b, t) is a when t = 0, b when t = 1 and in between otherwise.',
        lens: 'Dragging a slider between two keyframe values.',
    },
    smoothstep: {
        term: 'smoothstep window',
        plain: 'smooth(a, b, v) turns any value v into 0 → 1 between a and b, with a soft start and end: 0 before a, 1 after b.',
        lens: 'A keyframe pair with easy ease, placed on the scroll instead of on time.',
    },
    world: {
        term: 'world',
        plain: 'One full-screen 3D scene with its own camera and background: hero, science, stalk, plots, kernel. Several chapters can share a world (the science world holds three).',
        lens: 'A pre-comp.',
    },
    renderTarget: {
        term: 'render target',
        plain: 'An invisible image the GPU draws into instead of the screen. Each world paints into its own; a final shader reads them and builds the picture you see.',
        lens: 'Rendering a pre-comp so the main comp can use it as a layer.',
    },
    shader: {
        term: 'shader',
        plain: 'A small program that runs on the graphics card for every vertex (corner) or every pixel, in parallel. The fragment shader decides each pixel’s colour.',
        lens: 'A blend mode or effect you write yourself, applied to every pixel at once.',
    },
    uniform: {
        term: 'uniform',
        plain: 'A value handed to a shader that is the same for every pixel in one frame: the wipe progress, the time, the pointer position.',
        lens: 'An effect’s slider, keyframed from JavaScript.',
    },
    msdf: {
        term: 'MSDF',
        plain: 'Multi-channel signed distance field: a font atlas where each pixel stores how far it is from the letter’s edge (in three colour channels, to keep sharp corners). The shader turns distance into crisp edges at any size.',
        lens: 'A vector shape baked into a picture that still scales without blurring.',
    },
    atlas: {
        term: 'atlas (sprite sheet)',
        plain: 'One image holding many small pictures (letters, plot tiles, lightings), with a table of where each one sits.',
        lens: 'A sprite sheet or a contact sheet.',
    },
    anchor: {
        term: 'DOM anchor',
        plain: 'A real HTML heading, set in the same face and kept transparent. The browser does the layout and screen readers read it; the engine measures it and draws the WebGL title exactly on top.',
        lens: 'A hidden guide layer that the visible artwork is snapped to.',
    },
    ndc: {
        term: 'NDC (−1 to 1)',
        plain: 'Screen position as −1 (left / bottom) to 1 (right / top), whatever the window size. The pointer is stored this way.',
        lens: 'Percentages from the centre of the artboard.',
    },
    lensShift: {
        term: 'lens shift (view offset)',
        plain: 'Moving the picture inside the camera, not the camera itself: the subject can sit left of centre while the camera still looks straight at it, so perspective stays natural.',
        lens: 'A tilt-shift lens, or cropping an off-centre frame from a larger render.',
    },
    orbit: {
        term: 'orbit',
        plain: 'The camera circles around a pivot point (yaw = left/right, pitch = up/down) while always looking at it.',
        lens: 'Rotating around a product on a turntable.',
    },
    baked: {
        term: 'baked lighting',
        plain: 'Light painted into the texture ahead of time instead of calculated live. The cob has four bakes (lit from top-left, top-right, bottom-left, bottom-right) and the shader mixes them.',
        lens: 'Rendering four passes in a 3D app and blending them in the comp.',
    },
    matcap: {
        term: 'matcap',
        plain: 'A small picture of a lit sphere. Each pixel of the model looks up the colour of the sphere point facing the same way: instant “studio lighting” with no lights.',
        lens: 'A material preview ball whose lighting is copied onto any shape.',
    },
    premultiplied: {
        term: 'premultiplied alpha',
        plain: 'Colours already multiplied by their transparency (so soft edges are stored on black). The shader divides by alpha to get the real colour back.',
        lens: 'Straight vs premultiplied alpha in After Effects’ interpret footage.',
    },
    bokeh: {
        term: 'bokeh',
        plain: 'The soft discs that out-of-focus lights make in a photo. Here they are sprites that grow bigger and softer the further they are from a focus point.',
        lens: 'Lens blur on fairy lights.',
    },
    sprite: {
        term: 'point sprite',
        plain: 'A square the GPU draws around a single point, always facing the camera. Its fragment shader can cut it into a circle, a pentagon or a soft blob.',
        lens: 'A particle in a particle system.',
    },
    additive: {
        term: 'additive blending',
        plain: 'New colour is added on top of what’s there, so overlaps get brighter and order doesn’t matter. Good for glows and light.',
        lens: 'The Add (Linear Dodge) blend mode.',
    },
    dof: {
        term: 'depth of field',
        plain: 'Things at the focus distance are sharp; nearer and further things blur more the further they are from it.',
        lens: 'Aperture and focus distance on a camera.',
    },
    depthBuffer: {
        term: 'depth buffer',
        plain: 'A second image the GPU fills while drawing a scene: how far away each pixel is. Post effects can read it to blur by distance.',
        lens: 'A Z-depth pass from a 3D render.',
    },
    spline: {
        term: 'spline (Catmull-Rom)',
        plain: 'A smooth curve that passes through a list of points. The code samples it at any fraction 0 → 1 along its length.',
        lens: 'A pen-tool path with automatic smooth handles.',
    },
    simplex: {
        term: 'simplex noise',
        plain: 'Smooth randomness: nearby inputs give nearby outputs. Feeding time into it makes things breathe and drift without ever repeating.',
        lens: 'The wiggle expression, but smooth.',
    },
    fixedStep: {
        term: 'fixed time step',
        plain: 'Running a simulation in equal 1/60 s ticks, as many as the real time needs, so springs behave the same on a 30 Hz phone and a 144 Hz monitor.',
        lens: 'Rendering an animation at a fixed frame rate whatever the preview speed.',
    },
    leaky: {
        term: 'leaky integrator',
        plain: 'A smoother that keeps most of its value each step and adds a bit of the input. Chaining five turns random jitter into slow, gusty wind.',
        lens: 'Stacking several “smooth” filters on a noisy keyframe curve.',
    },
    bones: {
        term: 'bones (skinned mesh)',
        plain: 'An invisible skeleton inside a model; turning a bone bends the mesh around it. The plants are rigged, and springs turn their bones.',
        lens: 'Puppet pins, or a character rig.',
    },
    billboard: {
        term: 'billboard',
        plain: 'A flat picture that always turns to face the camera. Dozens of them make the far rows of the field.',
        lens: 'A cut-out card standing in a set.',
    },
    instancing: {
        term: 'instancing',
        plain: 'Drawing the same shape many times in one go, each copy with its own position and data. 9,600 plot slices cost one draw call.',
        lens: 'Repeat grid, but the GPU does it.',
    },
    drawCall: {
        term: 'draw call',
        plain: 'One “draw this” instruction from JavaScript to the graphics card. Each has a fixed cost, so fewer, bigger calls are faster.',
        lens: 'Each separate export job, as opposed to one batch export.',
    },
    post: {
        term: 'post-processing',
        plain: 'Effects applied to the finished image (blur, grade, grain), by drawing a full-screen rectangle with a shader that reads the image.',
        lens: 'Adjustment layers on top of the comp.',
    },
    lut: {
        term: 'LUT (colour grade)',
        plain: 'A lookup table: an image that says “this input colour becomes that output colour”. One texture read grades the whole frame.',
        lens: 'A .cube grade in Premiere or Lightroom.',
    },
    linear: {
        term: 'linear vs display colour',
        plain: 'Light adds up correctly in “linear” values; screens expect gamma-encoded “display” (sRGB) values. Shaders convert between the two, and doing maths in the wrong one shifts brightness.',
        lens: 'The difference between a 32-bit linear comp and an 8-bit sRGB one.',
    },
    msaa: {
        term: 'MSAA',
        plain: 'Multisample anti-aliasing: the GPU tests a few sub-pixel positions on edges so they look smooth. 2 samples here; 4 was too slow when two worlds draw at once.',
    },
    dpr: {
        term: 'pixel ratio (DPR)',
        plain: 'How many device pixels one CSS pixel has (2 on Retina). The page caps it at 1.5: the scenes are soft anyway and it saves 44 % of the pixels.',
    },
    budget: {
        term: 'frame budget',
        plain: 'At 60 frames a second each frame has 16.7 ms for everything: input, maths, drawing. Go over and the motion stutters.',
    },
};
