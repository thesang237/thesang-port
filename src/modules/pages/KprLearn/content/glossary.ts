/**
 * Plain-language dictionary. Hover any dotted-underlined word in the guide to see its entry.
 * `lens` = how a designer might already think about it.
 */
export type GlossaryEntry = { term: string; plain: string; lens?: string };

export const GLOSSARY: Record<string, GlossaryEntry> = {
    screen: {
        term: 'screen (unit)',
        plain: 'One viewport height of scrolling. The whole /kpr film is measured in screens, so “4.2” means “four screens and a fifth down the page”, on any monitor.',
        lens: 'A frame number on the After Effects timeline, except the playhead is the scroll bar.',
    },
    window: {
        term: 'window',
        plain: 'A start and end time, in screens, for one movement: [4.2, 5.1] means “this turn happens between 4.2 and 5.1 screens”.',
        lens: 'The in and out points of a layer’s keyframes.',
    },
    progress: {
        term: 'progress (0 → 1)',
        plain: 'How far the clock is through a window: 0 before it starts, 1 after it ends, 0.5 half way. Every animated value is built from these.',
        lens: 'The percentage readout on a Smart Animate transition.',
    },
    lerp: {
        term: 'lerp',
        plain: 'Short for “linear interpolation”: the value part-way between A and B. lerp(0, 100, 0.25) = 25.',
        lens: 'Dragging a layer 25 % of the way between two keyframes.',
    },
    ease: {
        term: 'easing',
        plain: 'A curve that reshapes progress so motion speeds up, slows down or both. /kpr uses “strong in-out” for card moves and “strong out” for text.',
        lens: 'The graph editor in After Effects, or the bezier in Figma Smart Animate.',
    },
    damp: {
        term: 'damp',
        plain: 'A smooth follow that closes a fixed share of the gap every second, so it feels the same at 30, 60 or 120 frames per second.',
        lens: 'A layer with “follow” and a lag amount, but measured in time, not frames.',
    },
    lenis: {
        term: 'Lenis',
        plain: 'A small library that smooths the browser’s scroll: the wheel sets a target and the page glides toward it.',
    },
    ticker: {
        term: 'ticker',
        plain: 'One function that runs once per screen refresh (about 60 times a second). Everything that moves listens to the same one, so nothing drifts out of sync.',
        lens: 'The project frame rate: every layer renders on the same frames.',
    },
    pure: {
        term: 'pure function',
        plain: 'A formula with no memory: give it the same time and it always returns the same result. Scrolling back simply asks for an earlier time.',
        lens: 'A keyframed layer: scrub anywhere and it is exactly where the keyframes say.',
    },
    shader: {
        term: 'shader',
        plain: 'A tiny program the graphics card runs for every pixel at once. Here it decides, per pixel, “am I inside the card shape, and what colour am I?”',
        lens: 'A blend mode or effect you write yourself.',
    },
    uniform: {
        term: 'uniform',
        plain: 'A value handed to a shader from outside, the same for every pixel of that card: its size, corner radius, notch, opacity… Changing a uniform is how the code animates the shader.',
        lens: 'An effect control (a slider in the Effect Controls panel).',
    },
    sdf: {
        term: 'SDF (signed distance field)',
        plain: 'For every pixel, the distance to the shape’s edge: negative inside, positive outside, zero on the edge. Shapes built this way stay crisp at any size and every number can animate.',
        lens: 'A vector path, but described as a formula the GPU can evaluate per pixel.',
    },
    smax: {
        term: 'smooth max',
        plain: 'Combines two shapes like a boolean “subtract”, but rounds the joint where they meet. Its k value is the size of that rounding.',
        lens: 'A boolean subtract followed by a corner radius on the new corners.',
    },
    antialias: {
        term: 'anti-aliasing',
        plain: 'Softening the shape’s edge over about one pixel so it looks smooth instead of stair-stepped.',
    },
    texture: {
        term: 'texture',
        plain: 'An image the graphics card can sample: a photo, a video frame, a canvas, or another scene rendered into an image.',
        lens: 'A fill image on a layer.',
    },
    renderTarget: {
        term: 'render target',
        plain: 'An invisible image the graphics card can draw a scene into, which can then be used as a texture somewhere else.',
        lens: 'A pre-comp: render a whole scene, then use it as a layer.',
    },
    gltf: {
        term: 'glTF / GLB',
        plain: 'The standard file format for 3D scenes on the web (planes, meshes, cameras, animation, textures) in one file.',
        lens: 'A .fig file for 3D.',
    },
    ktx2: {
        term: 'KTX2',
        plain: 'A compressed texture format the graphics card can read without unpacking it first: smaller to download and much lighter on video memory than PNG or JPG.',
    },
    viewOffset: {
        term: 'view offset',
        plain: 'Rendering only one part of a larger virtual picture. /kpr zooms into a painting this way, which keeps the planes’ true perspective instead of scaling a flat image.',
        lens: 'Cropping into a high-resolution comp instead of scaling up a flattened export.',
    },
    pivot: {
        term: 'orbit pivot',
        plain: 'The point the inner camera swings around when you move the pointer. Planes nearer than the pivot move with the pointer, planes behind it move against it.',
        lens: 'The anchor point of a 3D camera orbit in After Effects.',
    },
    flipbook: {
        term: 'flipbook (sprite sheet)',
        plain: 'Many animation frames packed into one big image. The player shows one rectangle of it at a time, switching rectangles to animate.',
        lens: 'An image sequence exported as one contact sheet.',
    },
    atlas: {
        term: 'atlas (JSON)',
        plain: 'The list that says where each frame sits inside a sprite sheet (x, y, width, height), written by a packing tool such as TexturePacker.',
    },
    anchor: {
        term: 'GL anchor',
        plain: 'An empty HTML box that marks where a WebGL card should sit. The page measures it once (and on resize), so CSS layout decides the 3D layout.',
        lens: 'A placeholder frame in Figma that something else snaps to.',
    },
    drawCall: {
        term: 'draw call',
        plain: 'One request from the browser to the graphics card: “draw this object”. Fewer is faster; /kpr stays under about 30 per frame.',
    },
    reducedMotion: {
        term: 'reduced motion',
        plain: 'An operating-system setting people turn on when movement makes them unwell or distracted. Sites should respond with gentle or no motion.',
    },
    momentum: {
        term: 'momentum',
        plain: 'After you let go of a drag, the movement carries on and slows down by itself, like a spun wheel.',
    },
    threshold: {
        term: 'threshold',
        plain: 'Turning a soft grey edge into a hard one: everything above the middle grey becomes solid, everything below becomes empty.',
        lens: 'The Threshold adjustment in Photoshop.',
    },
};
