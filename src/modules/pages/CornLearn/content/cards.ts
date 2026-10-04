import type { ChapterId } from './chapters';

export type Flashcard = { q: string; a: string };

/** "Lock it in" cards at the end of every chapter — pooled for the final quiz. */
export const CARDS: Record<ChapterId, Flashcard[]> = {
    map: [
        {
            q: 'What single number does every frame on /corn start from?',
            a: 'The story position: the scroller’s step turned into chapters (0 = hero, 1.5 = half way from chapter 1 to 2). Scenes, wipes, titles, copy and the nav are all calculated from it.',
        },
        {
            q: 'How many canvases and animation loops does the page run?',
            a: 'One canvas and one requestAnimationFrame loop (Engine.frame). Five worlds share the canvas by rendering into their own off-screen images.',
        },
        {
            q: 'Who owns the text, links and buttons: WebGL or HTML?',
            a: 'HTML. A DOM layer on top owns layout, copy, links and accessibility; the WebGL draws pictures, including titles placed exactly over transparent HTML headings.',
        },
        {
            q: 'Why does the engine write to the UI store only rarely, never every frame?',
            a: 'React re-renders whatever reads the store. Writing 60 times a second would re-render the DOM layer constantly; the store only changes when the chapter, menu or mode changes.',
        },
    ],
    steps: [
        {
            q: 'Why does /corn block the browser’s own scrolling?',
            a: 'So the story can move in whole steps on a spring: one wheel notch or swipe = one step, and every transition plays fully instead of being skipped by a fast flick.',
        },
        {
            q: 'How far does a wheel have to travel for one step, and when does a half-scroll commit forward?',
            a: '420 px of wheel per step. When input stops for 170 ms, more than 10 % of a step in the direction of travel commits forward; less springs back.',
        },
        {
            q: 'Spring vs damp: why does the page use a spring for the scroll?',
            a: 'A critically damped spring starts softly (it accelerates) and lands without overshoot. Damp jumps off at full speed. The spring reads as slow and premium.',
        },
        {
            q: 'What are the two spring speeds and what do they feel like?',
            a: 'ω 3.4 while the hand is on the wheel (responsive) and 2.5 while landing (≈ 1.6 s, gentle, no bounce).',
        },
    ],
    story: [
        {
            q: 'What does a story position of 4.3 mean?',
            a: 'Chapter 4’s world is still the main one and the move into chapter 5 is 30 % done: floor = the chapter, fraction = how far through the move.',
        },
        {
            q: 'Why is the wipe progress smooth(0.12, 0.88, f) and not just f?',
            a: 'The edge waits for the first 12 % of the move and is gone before the last 12 %, with a soft start and end. The scroll keeps moving smoothly but the wipe reads as a decisive gesture.',
        },
        {
            q: 'When does a chapter’s body copy show?',
            a: 'While the story is within 0.22 of its stop (COPY_NEAR), not only once the scroll has settled, so copy arrives as the move lands.',
        },
        {
            q: 'What is “dwell” and what does it drive?',
            a: 'How far the scroll has travelled inside the current chapter (0 → 1). Worlds move their scene with it (the camera walks down the stalk, the field pans) while the copy holds.',
        },
        {
            q: 'How does the side nav ring know how full to be?',
            a: 'Timeline.section(step) gives the section’s progress 0 → 1; the engine writes it straight into the SVG arc’s stroke-dasharray every frame, without React.',
        },
    ],
    worlds: [
        {
            q: 'What is a render target and why does each world get one?',
            a: 'An off-screen image the GPU draws into. Each world paints there, so the final shader can cut between two finished pictures with any shape of wipe.',
        },
        {
            q: 'Describe the wipe in three numbers.',
            a: 'Edge slope −0.248 (≈ 14°, rising to the right); the old world is pushed up 22 % of the screen; the new one rises 30 % into place.',
        },
        {
            q: 'Why do the worlds render at 72 % during a transition?',
            a: 'Two worlds share the frame then, which doubles the work. The moving edge hides the softness, and a parked frame always renders at full resolution.',
        },
        {
            q: 'What happens to the final image after the wipe, in order?',
            a: 'Convert to display colour (sRGB) → colour grade through a LUT → menu blur (only while open) → vignette and grain.',
        },
    ],
    titles: [
        {
            q: 'What does each pixel of an MSDF atlas store?',
            a: 'How far it is from the letter’s edge (in three colour channels; their median gives the distance). The shader turns distance into a crisp edge at any size.',
        },
        {
            q: 'How does the outline seem to draw itself along each letter?',
            a: 'A second map stores, for every outline pixel, how far along the letter’s path it is (0 → 1). The shader shows the outline where that value is below the progress.',
        },
        {
            q: 'Why is there a transparent HTML heading under every WebGL title?',
            a: 'The browser does layout and wrapping, screen readers read it, and the engine measures it and draws the GL title on top (cap top = line top + 0.169 cap).',
        },
        {
            q: 'What are the reveal timings?',
            a: 'Wait 0.45 s, trace the outline over 2.4 s, fill from 1.9 s over 1.6 s (grey → white), sine in-out, every letter at once.',
        },
    ],
    scatter: [
        {
            q: 'What is the “trail”?',
            a: 'The last 16 pointer positions over a title (one every 12 px of travel), each with a strength that fades over 1 s: quick break-up, slow heal.',
        },
        {
            q: 'What happens inside the pointer field?',
            a: 'The fill gives way to the outline with bright segments travelling along it, and a constellation of nodes from the letter edges flies out, joined by hairlines.',
        },
        {
            q: 'What does press-and-hold add?',
            a: 'One big disc that opens to 3 cap heights over 0.55 s, sends the nodes about 1.9× further and brings in the second half of them; it closes over 1.1 s.',
        },
        {
            q: 'Why do the nodes move in the vertex shader and not in JavaScript?',
            a: 'Thousands of nodes and links would cost CPU every frame. The GPU computes each one’s position from its rest point, flight offset and the field: zero JavaScript per frame.',
        },
    ],
    camera: [
        {
            q: 'Why does the camera orbit with a lens shift instead of just turning?',
            a: 'Orbiting around the subject tilts the scene with the pointer; the lens shift keeps the subject at its designed screen spot (the cob at x 1050, y 548), so the composition holds.',
        },
        {
            q: 'How strong is the pointer orbit?',
            a: 'Yaw ±0.3 rad (≈ 17°) and pitch ±0.15 rad at the screen edge, damped at λ 4 so it trails the hand.',
        },
        {
            q: 'How does the cob’s light follow the pointer with no lights in the scene?',
            a: 'Its atlas is baked four times (lit from each corner). The shader mixes them by a 2D light position from the pointer and the cob’s turn.',
        },
        {
            q: 'What are the three steps of the kernel material?',
            a: 'Albedo × a multiply matcap → colour burn with (0.27, 0.88, 0.97) at 30 % → screen a second matcap on top.',
        },
    ],
    bokeh: [
        {
            q: 'What decides a bokeh sprite’s size and softness?',
            a: 'Its distance to a focus point: smoothstep(near, far, distance) goes 0 (sharp, small) → 1 (big, soft, dimmer).',
        },
        {
            q: 'Why are the sprites pentagons?',
            a: 'A camera’s aperture blades make polygonal bokeh. A polygon distance function cuts each sprite into a five-sided shape that softens as it defocuses.',
        },
        {
            q: 'How does the pointer change the bokeh?',
            a: 'The focus point follows the pointer (eased λ ≈ 3) and the focus band widens while the pointer is on the page, so the field racks focus where you look.',
        },
        {
            q: 'Why is additive blending a good fit for bokeh?',
            a: 'Light adds up: overlaps get brighter, nothing needs sorting by depth, and the dots never punch dark holes.',
        },
    ],
    strands: [
        {
            q: 'How is one DNA strand built?',
            a: 'A Catmull-Rom spline through 13 points of a helix (radius, turns, phase) plus a faster second wobble. At chosen heights it dives through the axis to the other side: the rungs.',
        },
        {
            q: 'How many strands and beads make the helix?',
            a: '2 backbones × 20 strands; each strand is a 1 px hairline plus 150 pentagon beads. All hairlines are one draw call, all beads another.',
        },
        {
            q: 'How does the helix draw on?',
            a: 'Every bead and line point knows its fraction t along the strand. The shader shows it only inside a progress window, with a bright leading edge.',
        },
        {
            q: 'How are the network’s links made?',
            a: 'Every pair of nodes closer than 1.8 is linked by 30 soft beads; nodes breathe outward on simplex noise and the beads are recomputed along each link.',
        },
    ],
    springs: [
        {
            q: 'Write the spring rule the plants use.',
            a: 'speed = (target − rotation) × 0.05 + speed × 0.5; rotation += speed. Plus a share of the parent bone’s speed, so motion ripples up the plant.',
        },
        {
            q: 'How does random noise become gusty wind?',
            a: 'Through a chain of five leaky integrators: each keeps 95 % of its value and adds 80 % of the previous one. Jitter in, slow gusts out.',
        },
        {
            q: 'Why does the simulation run in fixed 1/60 s steps?',
            a: 'Springs stepped once per frame run twice as fast on a 120 Hz screen. Fixed steps (as many as real time needs) make the motion identical everywhere.',
        },
        {
            q: 'How does the kernel dial decide where to land when you throw it?',
            a: 'It projects the release speed (v × 0.95 / 0.05 × 2) to where the spin would end, then snaps to the nearest third: one fact per third.',
        },
    ],
    fakes: [
        {
            q: 'How do flat plot tiles look like crops with volume?',
            a: 'Each plot is a stack of 5–7 transparent slices lifted 0.13 apart. When the camera tilts, the layers slide against each other: real parallax from flat pictures.',
        },
        {
            q: 'How is the stalk chapter’s depth of field made?',
            a: 'The field renders with a depth buffer; three rotated 8-tap disk blurs grow their radius with distance from the focus depth. Then the front stalk is drawn on top, sharp.',
        },
        {
            q: 'How do the weather conditions blend?',
            a: 'Each condition is a preset of numbers (blur, sun, wind, spacing, zoom). The scene mixes presets by weights that ease to the new condition over 2.5 s (sine in-out).',
        },
        {
            q: 'Why render the blurred field at half resolution?',
            a: 'It ends up blurred anyway: half resolution is a quarter of the pixels and looks the same.',
        },
    ],
    perf: [
        {
            q: 'Name four tricks that keep /corn at 60 fps.',
            a: 'Only on-screen worlds render; transitions at 72 %; DPR capped at 1.5; blurred passes at half resolution; every shader compiled behind the loader.',
        },
        {
            q: 'Why are all of one helix’s beads a single object?',
            a: 'Draw calls cost CPU each. 6,000 beads in one Points object is one draw call; 6,000 objects would be 6,000.',
        },
        {
            q: 'Why does the engine render every world once off screen during loading?',
            a: 'So shaders compile and render targets allocate behind the loader, not on the first wipe into a world, which would hitch.',
        },
        {
            q: 'What did the page measure at its heaviest stop?',
            a: '34 draw calls, 133,000 triangles and 1.1 ms of CPU per frame (the field simulator), still at 16.7 ms frames.',
        },
    ],
    build: [
        {
            q: 'What is the first thing to write when planning a story like this?',
            a: 'The chapter list as data: id, world, title, how it enters (wipe or blend) and its dwell. Everything else reads from it.',
        },
        {
            q: 'When should a chapter enter with a blend instead of a wipe?',
            a: 'When it stays in the same world (DNA → network → pot share the science world). Wipes mark a change of world.',
        },
        {
            q: 'What is the minimum a new world needs?',
            a: 'A scene, a camera, an update(ctx) that reads local and dwell, and a dispose. The engine handles targets, the wipe and titles.',
        },
    ],
};
