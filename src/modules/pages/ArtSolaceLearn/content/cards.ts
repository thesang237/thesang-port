import type { ChapterId } from './chapters';

export type Flashcard = { q: string; a: string };

/** "Lock it in" cards at the end of every chapter, pooled for the final quiz. */
export const CARDS: Record<ChapterId, Flashcard[]> = {
    map: [
        {
            q: 'What single question does every grain of sand ask?',
            a: '“Am I in a dune’s dark core, on its lit slope, or in the sky?” The answer sets the chance the grain is drawn: 100 %, 10 %, or the sky’s 50–100 %.',
        },
        {
            q: 'In what order is a piece made?',
            a: 'Seed → traits → scene params → dunes (ridge walks + boundary maps) → 50 frames of scattered dots, each one unwarped, shaded and kept or dropped.',
        },
        {
            q: 'Does the artwork draw any outlines or fills?',
            a: 'No. Every shape you see comes from where dots were kept more or less often. Probability is the only paint.',
        },
        {
            q: 'Which file holds every number that can change between two seeds?',
            a: 'art/params.ts: rollSceneParams() rolls them all in one place (and applies overrides).',
        },
    ],
    seeds: [
        {
            q: 'What do cyrb128 and sfc32 each do?',
            a: 'cyrb128 hashes the seed text into four 32-bit numbers; sfc32 turns those four numbers into an endless, repeatable stream of values between 0 and 1.',
        },
        {
            q: 'Why are there two random streams?',
            a: 'Traits are rolled from the seed’s stream first; its next number seeds a second stream for everything else. Traits can be read without drawing, and drawing can’t disturb them.',
        },
        {
            q: 'What breaks if you add one rand.next() call in the middle of params.ts?',
            a: 'Every random choice after it shifts by one, so every existing seed produces a different picture. Add new features from their own stream instead.',
        },
        {
            q: 'What are the lines marked ⟲ legacy for?',
            a: 'Features of the original sketch this port doesn’t draw. They still take their random number so every seed keeps its original dunes.',
        },
    ],
    traits: [
        {
            q: 'How does the palette bag make some palettes rare?',
            a: 'By repetition: the common list (15 entries: 12 palettes, with Weather, Warm and Lamp listed twice) goes in three times, the 6 rare palettes once. 51 tickets, so each rare palette is 1 in 51.',
        },
        {
            q: 'How does a chance ladder like the Sky trait work?',
            a: 'Roll one number 0–1 and walk down the thresholds: < 0.03 Tabula, < 0.14 Starry, < 0.2 Wool… Each band’s width is its probability.',
        },
        {
            q: 'Why can’t a 1-dune piece have Dancers?',
            a: 'Traits depend on each other: Dancers is only rolled when Dunes ≥ 6 (then 3 %). Sandstorm odds also grow with the dune count.',
        },
        {
            q: 'Forcing Dunes: 24 in the debug panel reshuffles the layout. Forcing verticalCompression doesn’t. Why?',
            a: 'Trait overrides are applied before the scene is rolled (more dunes = more random numbers taken). Number overrides replace the value after it was rolled, so nothing else moves.',
        },
    ],
    noise: [
        {
            q: 'White noise vs Perlin noise in one sentence each?',
            a: 'White noise: every point unrelated to its neighbour (static). Perlin noise: random slopes on a grid blended smoothly, so neighbours are similar (hills).',
        },
        {
            q: 'Why does Perlin noise use smootherstep instead of a straight blend?',
            a: 'Its flat ends hide the grid: cells meet with zero slope change, so no creases show.',
        },
        {
            q: 'Where does Solace use the bell curve?',
            a: 'The Sandstorm kick (0.18 × gaussian()) and the Blur jitter (0.001 × gaussian()): small most of the time, occasionally big.',
        },
        {
            q: 'How does Sandstorm pick where to kick sand?',
            a: 'Where noise(30x, 30y) % 0.1 < 0.005: thin contour lines of the noise field. Points on those lines get a random vertical kick.',
        },
    ],
    ridge: [
        {
            q: 'How is a dune’s crest drawn?',
            a: 'A walker starts at the peak and steps down 0.001 at a time, drifting left a little and swaying with two sine waves. Its path is the crest.',
        },
        {
            q: 'What are the two sine waves for?',
            a: 'A slow, wide sway (frequency 5–10) and a faster, smaller wiggle (10–30, sometimes +15). 15 % of dunes switch the wiggle off for a smooth ridge.',
        },
        {
            q: 'Why does the sway use sqrt(y)?',
            a: 'It stretches the waves toward the bottom: near the peak the ridge wiggles quickly, lower down it makes long lazy curves.',
        },
        {
            q: 'What makes “special” peaks flare out?',
            a: 'Their sway grows with the square of the distance from the peak (× dune count), so the lower ridge swings wide, like wind-blown wings.',
        },
    ],
    maps: [
        {
            q: 'What does a boundary map store?',
            a: 'For each diagonal stripe the ridge crossed, the height where it crossed it first. Two maps per dune: \\ stripes and / stripes.',
        },
        {
            q: 'How does a point decide core, slope or sky for one dune?',
            a: 'Look up its \\ edge and its / edge. Ignore an edge the point is above. If the / edge is lower → core; if the \\ edge is lower → slope; neither → not this dune.',
        },
        {
            q: 'Several dunes overlap. Which one wins?',
            a: 'The first one asked: dunes are tested front to back and the first that claims the point decides its shade.',
        },
        {
            q: 'What does keyResolution change?',
            a: 'Stripes per unit height: more stripes = smoother edges (back dunes get up to 300, isSmoothKey gives 600), fewer = chunky steps.',
        },
    ],
    warp: [
        {
            q: 'What two bends does warp() apply?',
            a: 'A vertical sine wave across x (the wavy horizon) and a power curve on y (squeezes depth so far dunes crowd together).',
        },
        {
            q: 'Why does the art unwarp instead of warp?',
            a: 'Pulling (canvas point → where did it come from?) gives every pixel exactly one answer. Pushing model points onto the canvas leaves gaps and clumps.',
        },
        {
            q: 'What does verticalCompression below 1 do?',
            a: 'y^k with k < 1 pushes content down the canvas and stretches the top: the horizon sits low, near dunes get big.',
        },
        {
            q: 'Why is the wave amplitude divided by its frequency?',
            a: 'So fast waves stay small: a busy horizon with tall waves would look like noise.',
        },
    ],
    brush: [
        {
            q: 'What are the three draw chances?',
            a: 'Core 1 (always), slope 0.1 (one in ten), sky 0.5–1 depending on the Sky trait.',
        },
        {
            q: 'How does the picture “pour in”?',
            a: 'Each frame scatters 8,000 dots with random x, while y sweeps the canvas once from top to bottom across all 50 frames.',
        },
        {
            q: 'What do the Sand, Soft and Grainy brushes change?',
            a: 'Ink opacity: Sand uses the palette’s (80/255), Soft is 0.3× (faint), Grainy is solid ink over 100 frames.',
        },
        {
            q: 'Why does a 10 % slope read as a lighter tone and not as noise?',
            a: 'At this density your eye averages the dots: fewer kept dots = lighter grey. It’s stippling, like halftone.',
        },
    ],
    shader: [
        {
            q: 'What is a fragment shader, in one line?',
            a: 'A function the GPU runs for every pixel at once: position in, colour out. Exactly the art’s per-dot question, asked by every pixel in parallel.',
        },
        {
            q: 'Why can’t the shader use the art’s random stream?',
            a: 'Pixels run in parallel, so there is no “next number”. Each pixel hashes its own position (and a seed) into a random value instead.',
        },
        {
            q: 'How do the boundary maps reach the GPU?',
            a: 'They are baked: each map becomes a dense row of floats (gaps = 0) in a float texture, with a small meta texture saying where each row starts.',
        },
        {
            q: 'Why do the GPU demos cap the dune count?',
            a: 'Dense rows cost memory for every stripe between the first and last, and steep back dunes span hundreds of thousands. The CPU’s sparse maps don’t pay that.',
        },
        {
            q: 'How does the shader make grain without looping over 400,000 dots?',
            a: 'It splits the canvas into dot-sized cells and asks each cell how many dots would have landed and been kept (a few hashed tries), then stacks their opacity.',
        },
    ],
    living: [
        {
            q: 'What three things move in Living dunes?',
            a: 'The horizon wave’s phase (the land rolls), the Dancers sway phase (ridges ripple) and the grain seed (sand re-thrown, drifting with the wind).',
        },
        {
            q: 'Why does changing the grain seed over time look like blowing sand?',
            a: 'Every cell rolls new dice, so grains appear and vanish; offsetting the cells sideways each step makes them seem to travel.',
        },
        {
            q: 'What should the demo do for readers who prefer reduced motion?',
            a: 'Start paused and only move when asked, and keep rates slow: calm is the point of the piece.',
        },
    ],
    type: [
        {
            q: 'How does an image become sand?',
            a: 'Its darkness becomes the draw chance: each grain cell reads the image’s brightness and keeps a dot with probability = 1 − brightness (shaped by a curve).',
        },
        {
            q: 'How does text get into the shader?',
            a: 'It’s drawn into a hidden 2D canvas, uploaded as a texture, and sampled by position like any image.',
        },
        {
            q: 'What does the erosion dial do?',
            a: 'It bends where the shader samples the image with noise (domain warping), so letter edges fray like wind-worn sand.',
        },
    ],
    strata: [
        {
            q: 'What is domain warping?',
            a: 'Feeding noise coordinates that were themselves moved by noise: noise(p + noise(p)). Plain hills become folded, marbled rock.',
        },
        {
            q: 'How do floor and fract slice a smooth height into strata?',
            a: 'floor(h × bands) gives the band number (which layer), fract(h × bands) where you are inside it. Thin fract values make contour lines.',
        },
        {
            q: 'How does Strata reuse Solace’s brush?',
            a: 'Each band is given a zone (core, slope or sky) and that zone’s draw chance, so the rock is stippled exactly like the dunes.',
        },
    ],
    build: [
        {
            q: 'How do you add a random feature without changing existing seeds?',
            a: 'Give it its own stream: createRandom(seed + ":my-feature"). Never insert calls into the main stream.',
        },
        {
            q: 'What do the debug panel’s checkboxes mean?',
            a: 'Unticked: the dial shows what the seed rolled and doesn’t change anything. Ticked: your value replaces it.',
        },
        {
            q: 'How do you share one exact piece with someone?',
            a: 'Lock the seed (L) and copy the link: the seed is in the URL as ?seed=…, so the same piece draws for them.',
        },
    ],
};
