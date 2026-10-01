/**
 * Plain-language dictionary. Hover any dotted-underlined word in the guide to
 * see its entry. `lens` = how a designer might already think about it.
 */
export type GlossaryEntry = { term: string; plain: string; lens?: string };

export const GLOSSARY: Record<string, GlossaryEntry> = {
    lerp: {
        term: 'lerp',
        plain: 'Short for “linear interpolation”: find the value part-way between A and B. lerp(0, 100, 0.25) = 25. Run every frame toward a moving target, it becomes a smooth follow.',
        lens: 'Like a layer that always moves 10% of the remaining distance toward its keyframe.',
    },
    ease: {
        term: 'easing',
        plain: 'A curve that reshapes progress 0→1 so motion speeds up, slows down or overshoots. GSAP names them: power1…4, expo, back… with .in / .out / .inOut.',
        lens: 'The graph editor in After Effects, or the bezier in Figma Smart Animate.',
    },
    expo: {
        term: 'expo.in',
        plain: 'An ease that starts almost frozen and accelerates exponentially. Perfect for zooms, because scale feels exponential to the eye.',
        lens: 'A camera push that starts slow and punches through at the end.',
    },
    scrub: {
        term: 'scrub',
        plain: 'Tie an animation’s progress to the scroll position instead of time. A number (0.35) adds catch-up lag in seconds, so it glides instead of jumping.',
        lens: 'Dragging the playhead in After Effects — the scroll bar is the playhead.',
    },
    pin: {
        term: 'pin',
        plain: 'Freeze an element on screen while the page keeps scrolling behind it, for a set distance (e.g. 780 px). The scroll during the pin drives a scene.',
        lens: 'A “fixed while scrolling” frame in a Figma prototype, but only for part of the page.',
    },
    pinSpacing: {
        term: 'pin spacing',
        plain: 'Extra empty space ScrollTrigger adds after a pinned element so the next section waits. Turn it off and the next section slides over the pinned one.',
    },
    scrolltrigger: {
        term: 'ScrollTrigger',
        plain: 'GSAP’s plugin that watches scroll position: fire something when an element enters (start: "top 92%"), or map a scroll range onto an animation.',
        lens: 'Figma’s “while scrolling” / “after delay” triggers, but with exact pixel ranges.',
    },
    timeline: {
        term: 'timeline',
        plain: 'A GSAP container that places many tweens at exact times (the “position” number). Play, reverse, scrub or kill it as one unit.',
        lens: 'An After Effects composition: layers, keyframes, one playhead.',
    },
    tween: {
        term: 'tween',
        plain: 'One animation of some properties from A to B over a duration with an ease — gsap.to(el, { x: 100, duration: 0.4 }).',
        lens: 'One pair of keyframes.',
    },
    stagger: {
        term: 'stagger',
        plain: 'The same animation applied to many elements, each starting a little later (e.g. every 0.075 s), optionally from the centre or the end.',
        lens: 'Offsetting layers in the After Effects timeline by a few frames each.',
    },
    origin: {
        term: 'transform-origin',
        plain: 'The pivot point a scale or rotation happens around. scaleX from the left edge grows rightwards; from the right edge it shrinks rightwards.',
        lens: 'The anchor point in After Effects.',
    },
    splittext: {
        term: 'SplitText',
        plain: 'A GSAP plugin that wraps each line, word or character in its own element so each can animate separately. autoSplit re-splits when fonts load or the width changes.',
    },
    mask: {
        term: 'mask',
        plain: 'A shape that decides which part of a layer is visible. In SVG: white shows, black hides. Scale the shape and the visible window grows.',
        lens: 'A layer mask / track matte.',
    },
    clip: {
        term: 'clip-path',
        plain: 'A CSS property that cuts an element to a shape, e.g. inset(0 100% 0 0) hides everything; animating to inset(0) wipes it in.',
        lens: 'A rectangle mask whose edges you keyframe.',
    },
    drawsvg: {
        term: 'stroke drawing',
        plain: 'Make a line look hand-drawn by animating how much of its stroke is visible (stroke-dasharray + stroke-dashoffset). GSAP’s DrawSVG does the maths.',
        lens: 'The Trim Paths “End” property in After Effects.',
    },
    ticker: {
        term: 'ticker',
        plain: 'GSAP’s heartbeat: one function called once per screen refresh (requestAnimationFrame). Anything added to it runs in lock-step with GSAP.',
        lens: 'The project frame rate everything is rendered at.',
    },
    raf: {
        term: 'frame (rAF)',
        plain: 'requestAnimationFrame: the browser calls you right before it paints the next frame, ~60 times a second (120 on ProMotion screens).',
    },
    lenis: {
        term: 'Lenis',
        plain: 'A small smooth-scroll library. It lets the browser scroll natively but eases the visible position toward the target each frame.',
    },
    uniform: {
        term: 'uniform',
        plain: 'A value sent from JavaScript to a shader, the same for every pixel in a frame (progress, time, mouse position).',
        lens: 'An exposed parameter on an effect, like “Amount” on a blur.',
    },
    shader: {
        term: 'shader',
        plain: 'A tiny program that runs on the graphics card for every pixel (fragment shader) or every vertex, all in parallel.',
        lens: 'A blend mode or effect you write yourself.',
    },
    texture: {
        term: 'texture',
        plain: 'An image uploaded to the graphics card so a shader can read its colours. A <canvas> can be a texture too, updated every frame.',
    },
    uv: {
        term: 'UV',
        plain: 'Coordinates across a surface from 0 to 1 (u across, v up). A shader uses them to look up where to read in a texture.',
        lens: 'Percent positions inside a frame: (0.5, 0.5) is the centre.',
    },
    ortho: {
        term: 'orthographic camera',
        plain: 'A camera with no perspective: things don’t shrink with distance. Set up so 1 unit = 1 CSS pixel, it lets WebGL shapes line up with the DOM exactly.',
        lens: 'A flat 2D artboard instead of a 3D camera.',
    },
    dpr: {
        term: 'DPR',
        plain: 'Device pixel ratio: real screen pixels per CSS pixel (2 on Retina). Canvases are capped at 2 so 3× phones don’t render 9× the pixels.',
    },
    webgpu: {
        term: 'WebGPU',
        plain: 'The newer browser graphics API. three.js’s WebGPURenderer uses it when available and falls back to WebGL2 automatically.',
    },
    tsl: {
        term: 'TSL',
        plain: 'Three.js Shading Language: shaders written as JavaScript functions (mix, texture, smoothstep…) that three compiles to WebGPU or WebGL code.',
        lens: 'Node-based shading (like Blender’s shader nodes), written as code.',
    },
    noise: {
        term: 'noise',
        plain: 'Smooth pseudo-random values that change gently across space (and time). Adding noise to an edge makes it organic, like liquid or ink.',
        lens: 'The Fractal Noise effect in After Effects.',
    },
    smoothstep: {
        term: 'smoothstep',
        plain: 'smoothstep(a, b, x) is 0 below a, 1 above b, and a soft S-curve in between. A narrow a→b gives a crisp but anti-aliased edge.',
        lens: 'A levels / threshold adjustment with a tiny feather.',
    },
    luma: {
        term: 'luma',
        plain: 'How bright a colour looks to the eye: 0.299·R + 0.587·G + 0.114·B. Map luma onto two colours and you get a duotone.',
        lens: 'A Gradient Map adjustment layer with two stops.',
    },
    store: {
        term: 'store',
        plain: 'A small shared state container (here zustand) that any component can read or set: loaded, menuOpen, headerCompact, headerTheme.',
        lens: 'Component “variables” in Figma, shared across the whole file.',
    },
    event: {
        term: 'custom event',
        plain: 'A named message broadcast on window (“ln:enter”). Anything listening reacts; the sender doesn’t need to know who listens.',
        lens: 'A prototype trigger that several frames listen to.',
    },
    io: {
        term: 'IntersectionObserver',
        plain: 'A browser API that tells you when an element enters or leaves the screen, without checking on every scroll.',
    },
    cssvar: {
        term: 'CSS variable',
        plain: 'A custom property (--clip, --br-text) set from JavaScript and read by CSS — a cheap bridge between an animation and a style.',
        lens: 'A variable bound to several properties in Figma.',
    },
    parallax: {
        term: 'parallax',
        plain: 'Layers moving at slightly different speeds for the same scroll, which reads as depth.',
    },
    autoalpha: {
        term: 'autoAlpha',
        plain: 'GSAP shortcut for opacity that also sets visibility: hidden at 0, so invisible things can’t be clicked or read by screen readers.',
    },
    overwrite: {
        term: 'overwrite',
        plain: 'When a new tween starts on the same property, overwrite: true kills the old one — no fighting when you hover in and out quickly.',
    },
    reduced: {
        term: 'reduced motion',
        plain: 'An operating-system setting (prefers-reduced-motion) for people who get dizzy or distracted by movement. Sites should swap big motion for fades or nothing.',
    },
    context: {
        term: 'WebGL context',
        plain: 'The connection between one canvas and the graphics card. Browsers allow about 16 at once; unused ones must be released.',
    },
    drawcall: {
        term: 'draw call',
        plain: 'One “draw this mesh” instruction from the CPU to the GPU. Fewer is faster; each hero plane here is one.',
    },
    ssim: {
        term: 'SSIM',
        plain: 'Structural similarity: a 0–1 score of how alike two images look (layout, contrast, edges). Used here to compare the clone with the reference video frame by frame.',
    },
    pathname: {
        term: 'pathname',
        plain: 'The path part of the URL (/landonorris/on-track). The transition waits until it changes to know the new page has rendered.',
    },
};
