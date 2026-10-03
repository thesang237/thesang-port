import type { ChapterId } from './chapters';

export type Flashcard = { q: string; a: string };

/** "Lock it in" cards at the end of every chapter — pooled for the final quiz. */
export const CARDS: Record<ChapterId, Flashcard[]> = {
    map: [
        {
            q: 'What single number drives almost everything on /kpr?',
            a: 'film.t: the smoothed scroll position converted into “film screens”. Cards, text, theme colour, nav and the progress bar are all calculated from it every frame.',
        },
        {
            q: 'Why is the page’s scrollbar attached to an empty div?',
            a: 'The canvas and the text layers are fixed to the screen. An invisible “track” (SCROLL_TOTAL + 1 screens tall) only gives the browser something to scroll; nothing on it is visible.',
        },
        {
            q: 'How many animation loops (requestAnimationFrame) does the page run?',
            a: 'One: GSAP’s ticker. It reads Lenis, updates the film clock, runs the DOM updaters, then asks React Three Fiber to render (frameloop “never” + advance()).',
        },
        {
            q: 'Where do per-frame values live, and why not in React state?',
            a: 'In a plain object called film. React state would re-render components 60 times a second; the shader and DOM updaters just read the object.',
        },
    ],
    clock: [
        { q: 'What is one “screen” in the film clock?', a: 'One viewport height of scrolling. Measuring in screens makes the choreography identical on every monitor size.' },
        {
            q: 'What does seg(t, [4.2, 5.1]) return at t = 4.65?',
            a: '0.5: it is half way through the window. Before 4.2 it is 0, after 5.1 it is 1 (clamped).',
        },
        {
            q: 'What does the scroll warp change, and what does it leave alone?',
            a: 'It changes how many screens of real scrolling each stretch of the film takes (the hero plays ~1.6× faster). The windows stay in film screens, so the choreography never has to be retimed.',
        },
        {
            q: 'Why are scrubbed values linear in the clock and eased one by one?',
            a: 'Scroll already has your hand’s rhythm. Each value (position, turn, notch depth) gets its own ease inside its own window, so they can overlap with different feels.',
        },
    ],
    choreo: [
        {
            q: 'Why does every card move backwards perfectly when you scroll up?',
            a: 'Each card’s state is a pure function of t: it is rebuilt from scratch every frame (reset, then calculated). There is no history to undo.',
        },
        {
            q: 'What breaks if you trigger a tween each time the scroll crosses a point?',
            a: 'Fast or reversed scrolling can skip or overlap triggers, so things end in the wrong place or fight each other. A formula of t can’t get out of sync.',
        },
        { q: 'What does mixRect(a, b, k) do?', a: 'Blends two rectangles (x, y, w, h) by k from 0 to 1. Chaining several mixRects with different eased k builds a card’s whole journey.' },
        {
            q: 'Which part of /kpr is NOT a pure function of scroll, on purpose?',
            a: 'The text reveals and the logo wipe: they fire on entering a window and play on their own clock (reversing 2.2× faster on leave), like the original site.',
        },
    ],
    shape: [
        {
            q: 'What does a signed distance field return for each pixel?',
            a: 'Its distance to the shape’s edge: negative inside, positive outside. The shader keeps pixels below 0 and softens the edge over about one pixel.',
        },
        {
            q: 'What four numbers describe a notch?',
            a: 'Corner (0 TL, 1 TR, 2 BR, 3 BL), axis (along the top/bottom edge or the side edge), length and depth, in pixels.',
        },
        {
            q: 'Why is every joint of the notch rounded with a smooth max instead of a plain max?',
            a: 'A plain max gives sharp inner corners. Smooth max rounds them by k, which /kpr caps at 0.75 × the step depth so straight edges never melt into a wave.',
        },
        { q: 'How big is the automatic corner radius?', a: 'About 5.8 % of the card’s short side, clamped between 1.2 and 4.2 “units” (the site’s rem: 10 px × viewport/1600).' },
    ],
    faces: [
        {
            q: 'How can one card show three different pictures while it turns twice?',
            a: 'Faces are listed in turning order. Every half turn moves one step along the list, and the face that is currently hidden (facing away) is swapped before it comes round.',
        },
        {
            q: 'Why is the back face mirrored in the shader?',
            a: 'Seen from behind, the card’s uvs run right-to-left. Mirroring makes the back picture read the right way round once the card has turned.',
        },
        {
            q: 'What does “single-sided” do to a card?',
            a: 'Past 90° the back is discarded, so the card simply disappears. /kpr uses it for cards that should vanish by turning away (ring cards, the trailer card).',
        },
        {
            q: 'What is the “pixel stage”?',
            a: 'A perspective camera placed so 1 world unit = 1 CSS pixel at depth 0 (distance = max(1100, 1.25 × viewport height)). Cards can be sized from HTML boxes and still turn in real 3D.',
        },
    ],
    painted: [
        {
            q: 'Why does the painting inside a card have real parallax?',
            a: 'It is a small 3D scene: painted planes at different depths (and a head mesh for the girl). Moving its own camera makes near planes shift more than far ones.',
        },
        {
            q: 'How does a 3D scene end up inside a flat card?',
            a: 'It is rendered from its own camera into a render target, and that image is the card’s texture.',
        },
        {
            q: 'Why zoom with a view offset instead of scaling the image?',
            a: 'The view offset renders a crop of a bigger virtual frame, so perspective between planes stays true and the paint stays sharp.',
        },
        {
            q: 'How is the story painting’s camera move controlled?',
            a: 'The GLB contains a baked camera clip; storyProgress(t) maps the scroll to a position along that clip, and the mixer jumps there every frame.',
        },
    ],
    masks: [
        {
            q: 'What does “cards are masks” mean?',
            a: 'The picture is sampled in screen space inside the card’s upright rectangle, so leaning or turning the card moves only its outline; the painting stays straight.',
        },
        {
            q: 'What is the “frame” field in CardState for?',
            a: 'A fixed rectangle for the picture, so a card can shrink, grow or turn while its painting stays perfectly still behind it.',
        },
        { q: 'Why is the wash a screen blend and not a fade?', a: 'Screen only lightens toward the colour, so the glow never greys the painting out the way lowering opacity over white would.' },
        { q: 'What drives the red-channel shift and skew?', a: 'Scroll speed (film.vel): chroma = min(0.012, |vel| × 0.0035). Fast scrolling smears slightly; standing still is clean.' },
    ],
    pointer: [
        {
            q: 'Why does the card frame follow the pointer more slowly than the picture inside?',
            a: 'Two speeds read as two layers. Frame λ ≈ 3.2 /s, inner ≈ 5.5 /s; the gap between them is the depth you feel.',
        },
        {
            q: 'What does damp(current, target, λ, dt) do that a plain lerp doesn’t?',
            a: 'It uses 1 − e^(−λ·dt), so the follow feels identical at any frame rate. A fixed lerp of 0.1 per frame is twice as fast at 120 Hz as at 60 Hz.',
        },
        { q: 'Why do big cards stop leaning?', a: 'settleTilt fades the lean out as a card covers 40 % → 85 % of the screen; otherwise its edges would swing into view.' },
        { q: 'Why does each card get a slightly different follow speed?', a: 'A seeded ±15 % on each λ, so a group of cards never moves in lockstep; it feels like separate objects.' },
    ],
    ring: [
        {
            q: 'How is a card placed on the gallery ring?',
            a: 'x = sin(θ) × R, z = (cos θ − 1) × R, and the card turns by θ. The camera sits outside the cylinder, so the front card is biggest (a convex ring).',
        },
        { q: 'How are the cards layered without a depth buffer?', a: 'Each card’s draw order is set from cos θ every frame: nearer cards are drawn later, on top.' },
        {
            q: 'How does drag momentum fade out?',
            a: 'After release the speed is multiplied by e^(−3·dt) every frame, a frame-rate independent decay that stops in about a second.',
        },
        {
            q: 'How does the ring leave the screen?',
            a: 'It closes into a small spinning box (radius shrinks), then each card turns past 90° toward its nearer edge and, being single-sided, vanishes.',
        },
    ],
    flipbooks: [
        { q: 'What is in a sprite-sheet atlas JSON?', a: 'For every frame: where it sits in the big image (x, y, w, h) and, if trimmed, where it belongs inside the original frame.' },
        {
            q: 'Why does the logo wipe threshold its alpha?',
            a: 'Its frames are only 220×124 px. Stretched full screen they’d be blurry; a smoothstep around 0.5 turns the soft edge into a crisp one about 1.6 px wide.',
        },
        {
            q: 'Why does the logo wipe play on its own clock instead of following scroll?',
            a: 'It is a short animated beat (48 fps, held on frame 92). Once the film passes 8.35 it plays at its own speed and rewinds 2.5× faster if you scroll back above it.',
        },
        {
            q: 'How does the opening build the KPR wordmark?',
            a: 'The logo is masked by a grid of slanted pieces. Each piece has its own seeded “on” time (left to right) and “off” time, so it builds and breaks apart.',
        },
    ],
    words: [
        {
            q: 'How does HTML decide where a WebGL card sits?',
            a: 'An empty box with data-gl-anchor is measured (on resize and font load only), converted to stage coordinates, and read by the choreography every frame.',
        },
        {
            q: 'What happens when you scroll out of a text block’s window?',
            a: 'Its reveal timeline reverses at 2.2× speed, then hides the section. Entering again plays it forward at normal speed.',
        },
        { q: 'How does the decode (“hacky”) text keep its width while scrambling?', a: 'A hidden spacer holds the real text’s width; an absolutely placed copy shows the scramble on top.' },
        {
            q: 'What happens to the button’s 45° cut on hover?',
            a: 'One SVG path morphs (0.5 s) from the straight cut into a normal rounded corner while the fill switches instantly to black.',
        },
    ],
    perf: [
        {
            q: 'Which paintings render on a given frame?',
            a: 'Only the face that is showing on a visible card, plus the next face when a card is near edge-on. Six scenes exist; one or two render.',
        },
        {
            q: 'Why are all programs compiled and all paintings rendered once behind the loader?',
            a: 'The first frame a shader or texture is used costs a compile/upload (100 ms+). Doing it behind the loader means the first scroll never stalls.',
        },
        {
            q: 'What does reduced motion do on /kpr?',
            a: 'The film snaps between rest stills (RESTS) with a 160 ms fade; no pointer parallax, no scrubbed motion, the logo shows its last frame.',
        },
        { q: 'How does the page stop rendering under the footer?', a: 'Once the footer covers the stage, film.covered is true and the canvas skips its frame entirely.' },
    ],
    build: [
        {
            q: 'What is the first thing to write when planning a /kpr-style page?',
            a: 'The storyboard as windows in screens: each act and each movement gets a [from, to]. Everything else is formulas reading those windows.',
        },
        {
            q: 'In what order should you add the layers of a card?',
            a: 'Position/size from windows → shape (notch, radius) → faces/turns → picture behaviour (mask, frame) → pointer layers → effects (wash, grain).',
        },
        {
            q: 'When should a moment play on its own clock instead of the scroll?',
            a: 'When it is a short “beat” that looks wrong half-played: text reveals, a logo sting, a sound. Everything spatial stays on the scroll.',
        },
    ],
};
