export type RecallCard = { question: string; answer: string };
export type Lesson = {
    idea: string;
    lens: string;
    remember: string;
    code: string;
    file: string;
    tries: string[];
    note: string;
    application: string;
    cards: RecallCard[];
    terms: { word: string; meaning: string }[];
};

export const LESSONS = {
    map: {
        idea: 'Sagebrush looks like a forest drawn with a nervous pen. There is no forest mesh and no scanned brush texture. A grid of numbers describes the land; thousands of tiny paths describe its marks. The drawing emerges as a simulated pen visits those paths and leaves ink behind.',
        lens: 'Think of a print studio: the height field is your reference sculpture, the shape list is your drawing plan, and the pen is the person interpreting it. The plan and the performance are separate.',
        remember: 'The field decides what to draw; the pen decides how it feels.',
        code: 'const { hMap, mapW, mapH, minY, maxY } = createHeightfield(rng, noise);\n// Plants are added before ground strokes so their shadows enter the light map.\nconst { addTree, addBush } = createPlantBuilders({\n    rng, noise, shapes, treePaletteColor, lgt, hMap,\n});\n// Last item is the furthest mark: it gets drawn first.\nshapes.sort((a, b) => b.z - a.z);',
        file: 'world.ts',
        tries: [
            'Compare stages 1 and 2: the same field produces very different information.',
            'Move to stage 3: the marks are flat rectangles here so their direction is easy to inspect. The pen chapter replaces them with ink.',
        ],
        note: 'The pipeline is Perlin noise → height field → erosion → slope and light → plants and shadows → ground strokes → depth order → ink. Plants must write their shadows before the ground colors are chosen. Swapping those stages changes the picture.',
        application:
            'Build a visual identity around a shared field: use one field for the background print, the direction of letter strokes and the placement of small symbols. The parts will feel related without repeating the same image.',
        cards: [
            {
                question: 'What makes the texture look drawn?',
                answer: 'A moving pen scatters translucent dots while chasing a path; no brush image is stamped.',
            },
            {
                question: 'Why do plants come before ground color?',
                answer: 'Plants darken the light map. Ground strokes then read those shadows.',
            },
            {
                question: 'Does the picture need WebGL?',
                answer: 'No. The source draws persistent dots with Canvas 2D fillRect calls.',
            },
        ],
        terms: [
            {
                word: 'Height field',
                meaning: 'A grid storing one height per location, like a grayscale displacement map.',
            },
            {
                word: 'Pipeline',
                meaning: 'A sequence of stages where each stage prepares data for the next.',
            },
        ],
    },
    seeds: {
        idea: 'A seed is an address for a particular sequence of choices. Repeat it and the choices repeat. Sagebrush has two: one chooses the palette, plants and positions; the other builds a smooth noise pattern. Keeping them separate lets you explore variation without changing every ingredient at once.',
        lens: 'A seed is like a saved procedural preset, not an intensity slider. In a Figma component, think of two independent variant properties: composition and surface.',
        remember: 'A repeatable piece needs the same seeds and the same order of random calls.',
        code: 'const rng = createRandom(rngSeed);\nconst noise = createNoise(noiseSeed);\n// Drawing has its own stream; it does not restart each frame.\nconst random = createRandom(seed + 1);',
        file: 'random.ts',
        tries: ['Change Choice seed. Only the left panel changes because its samples use that stream.', 'Change Noise seed. The terrain changes, but the independent random sample panel stays fixed.'],
        note: 'A seeded generator is stateful: every call advances it. Even range(4, 4) consumes a random number in this artwork. Removing that seemingly redundant call changes later plants and marks. New features can use their own derived seed to avoid perturbing an existing edition.',
        application:
            'Create a triptych by holding the noise seed fixed and changing only the palette or the plant seed in a new composition. Keep a written seed pair with each exported image. The original route accepts ?seed=42&noise=1337 for repeatable viewing.',
        cards: [
            {
                question: 'Why use two seeds?',
                answer: 'One controls discrete choices, the other controls the smooth spatial field.',
            },
            {
                question: 'Will a seed survive arbitrary code changes?',
                answer: 'No. A seed repeats an algorithm and its call order, not an image independently of the code.',
            },
            {
                question: 'Why does the drawing stream live outside the frame function?',
                answer: 'Recreating it per frame would restart its sequence and make scheduling affect the texture.',
            },
        ],
        terms: [
            {
                word: 'Random stream',
                meaning: 'A repeatable sequence of values consumed one at a time.',
            },
            {
                word: 'Deterministic',
                meaning: 'The same inputs and operations produce the same result.',
            },
        ],
    },
    terrain: {
        idea: 'The land begins as broad, smooth variation. Two smaller layers add roughness, like drawing the silhouette first and the small folds second. The source combines three noise layers, normalizes their weights, then makes the terrain lower toward the front of the image.',
        lens: 'Imagine three copies of an After Effects noise layer at 100%, 200% and 400% scale, with smaller opacity on the fine copies. This is a useful mental model; the source performs the blend numerically.',
        remember: 'Large noise sets the silhouette; small noise supplies the detail.',
        code: 'const sustain = mapRange(mapScale, 0.15, 1, 0.6, 0.2);\nconst noiseDist = [\n    [1, 1 * mapScale],\n    [sustain, 2 * mapScale],\n    [pow(sustain, 2), 4 * mapScale],\n];\nconst noiseTotal = noiseDist.reduce((s, d) => s + d[0], 0);',
        file: 'heightfield.ts',
        tries: [
            'Set terrain scale to 0.15: broad hills dominate. Then set it to 1.',
            'Notice that the right view also includes the source’s row taper. It is a composed terrain, not just a more detailed copy of the left.',
        ],
        note: 'The source uses seeded gradient Perlin noise, not simplex noise. Its three-layer combination is commonly called fractal Brownian motion (fBm). Scale also changes sustain: at larger scales, the fine layers lose weight. That coupling is part of the art direction.',
        application:
            'Try the field as the thickness of a woven line, the spacing between repeated motifs or the edge of torn paper. Sample a smooth field for related neighbors; use independent random values when you want intentional visual static.',
        cards: [
            {
                question: 'What does frequency change?',
                answer: 'How much of the noise pattern fits into the field: higher frequency means more, smaller features.',
            },
            {
                question: 'Why divide by the total layer weight?',
                answer: 'To keep the combined value comparable when the layer weights change.',
            },
            {
                question: 'Is the source domain-warping its noise?',
                answer: 'No. It layers Perlin noise, erodes the result, then displaces mark positions later.',
            },
        ],
        terms: [
            {
                word: 'Octave',
                meaning: 'Another noise layer at a higher frequency and usually a lower weight.',
            },
            {
                word: 'fBm',
                meaning: 'A sum of noise layers at different scales, used here to build terrain detail.',
            },
        ],
    },
    erosion: {
        idea: 'Noise makes hills, but its valleys can feel equally rounded everywhere. Sagebrush sends droplets across the field. Each one follows a slope, gathers material and puts some down again. The marks are drawn only after this editing pass, so even the light and plants respond to the edited land.',
        lens: 'Think of a destructive sculpting pass on a displacement map. You are changing the reference surface itself, not adding a rain overlay to the final image.',
        remember: 'Erosion changes the field before color, plants or pen strokes read it.',
        code: 'const sedCap = max(-dHt * speed * water * sedCapF, minSedCap);\nif (sediment > sedCap || dHt > 0) {\n    // Deposit carried material.\n} else {\n    // Remove material from the erosion footprint.\n}\nspeed = sqrt(speed * speed + abs(dHt) * gravity);\nwater *= 1 - evapSpd;',
        file: 'erosion.ts',
        tries: [
            'Set rain to 0, then 2. Look for a change in the structure of the valleys, not just a darker overall tone.',
            'Try another noise seed with the same rainfall: different starting slopes guide different paths.',
        ],
        note: 'The default 100 × 100 field gets four passes of 10,000 droplets: three with radius 4 and one with radius 2. This is a stylized legacy model: it samples a rounded starting cell, uses directional footprints and softens in place. It should not be presented as a physically accurate fluid solver.',
        application:
            'Use erosion as an editing tool for weathered lettering or worn ceramic patterns. Make the original mask your height field, then let it weather. Keep a before/after pair so you can decide when the structure has become too damaged to read.',
        cards: [
            {
                question: 'When is material deposited?',
                answer: 'When a droplet carries more than its capacity or moves uphill.',
            },
            {
                question: 'What does evaporation do?',
                answer: 'It reduces water and carrying capacity and eventually ends the droplet.',
            },
            {
                question: 'Why preserve this model during refactoring?',
                answer: 'Changing its sampling or footprint would change existing seeded artworks; a corrected physical model should be an explicit new version.',
            },
        ],
        terms: [
            {
                word: 'Sediment capacity',
                meaning: 'How much material a moving droplet can carry at this step.',
            },
            {
                word: 'In-place',
                meaning: 'The field is changed directly; later samples can see the earlier changes.',
            },
        ],
    },
    light: {
        idea: 'A slope facing the light gets a different ink than one facing away. The source estimates a direction from neighboring heights, compares it with the light direction, then chooses a discrete palette color. That same slope also turns the long ground strokes, making texture and shading agree.',
        lens: 'This is an embossed effect with a limited print palette. Unlike a Photoshop bevel, it also steers the physical direction of your hatching.',
        remember: 'One slope can control both a mark’s orientation and its color.',
        code: 'const normal = vnorm(terrainGradient(hMap, i, j, mapW, mapH));\nconst lightValue = (vdot(normal, lgt) + 1) / 2;\nconst paletteColor = (br: number): InkColor =>\n    palette[constrain(floor(br * palette.length), 0, palette.length - 1)];',
        file: 'world.ts',
        tries: [
            'Turn the light by 180°: previously lit slopes move into dark palette bins.',
            'Find a light angle where several neighboring colors collapse into one. A stepped palette deliberately simplifies shading.',
        ],
        note: 'The normal here has z = 0. It represents slope direction in the map, not the normal of a 3D surface. The artwork also blends light with a separate land-noise value, and plants paint dark patches into the light map. The demo isolates the directional term so you can see it clearly.',
        application:
            'Map direction to a pair of complementary inks instead of realistic light and shadow. Keep stroke orientation linked to the same direction field so the color remains expressive while the terrain stays legible.',
        cards: [
            {
                question: 'What does a dot product measure here?',
                answer: 'Agreement between normalized slope and light directions, from −1 to 1.',
            },
            {
                question: 'Why normalize the slope?',
                answer: 'To compare direction rather than letting slope magnitude dominate the dot product.',
            },
            {
                question: 'Why does color change in steps?',
                answer: 'Brightness selects a bin from a finite palette rather than blending continuously.',
            },
        ],
        terms: [
            {
                word: 'Gradient',
                meaning: 'The direction and rate at which the height changes.',
            },
            {
                word: 'Dot product',
                meaning: 'A way of measuring how much two directions agree.',
            },
        ],
    },
    pen: {
        idea: 'A perfect ellipse would look too clean. Sagebrush turns it into a zigzag target path, then lets a small moving pen chase each target. Attraction pulls it in, wobble disturbs it, damping removes energy and a speed limit keeps it under control. The pen scatters transparent dots along its journey.',
        lens: 'The path is an After Effects motion path; the pen behaves like a follower with inertia. Brush width spreads dots around that follower instead of thickening a vector outline.',
        remember: 'Path geometry and mark-making are separate artistic decisions.',
        code: 'this.penV.x += dx * this.acc;\nthis.penV.y += dy * this.acc;\nthis.penV.x *= 0.8;\nthis.penV.y *= 0.8;\n// Scatter uniformly across a disk, not evenly along its radius.\nconst offDist = (sqrt(rng.r01()) * noiseV * this.wt) / 2;',
        file: 'brush.ts',
        tries: [
            'Set wobble to 0 and draw, then compare with 0.8. The path is identical, but the hand changes.',
            'Set ink alpha to 255. Notice how opaque dots flatten the layered texture.',
            'Raise speed and lower attraction. Watch the pen struggle to settle near a target.',
        ],
        note: 'The source advances targets when the pen comes within 3 artwork units. Speed is measured per simulation step, not per display frame. A frame may run hundreds of steps. Keeping that distinction avoids making a 120 Hz screen produce a different edition.',
        application:
            'Use the same pen on a signature, a contour line or a simple monogram. Change the target path first, then tune the hand. If you change both together, you will not know which change improved the result.',
        cards: [
            {
                question: 'Why use sqrt(random) for scatter radius?',
                answer: 'A disk has more area near its outside. The square root distributes samples uniformly over that area.',
            },
            {
                question: 'What does damping do?',
                answer: 'Multiplying velocity by 0.8 removes energy so the pen can settle instead of accelerating forever.',
            },
            {
                question: 'Why keep the canvas between frames?',
                answer: 'Each frame deposits more ink; clearing would erase the accumulated drawing.',
            },
        ],
        terms: [
            {
                word: 'Damping',
                meaning: 'Removing some motion energy at every simulation step.',
            },
            {
                word: 'Alpha',
                meaning: 'Opacity: 64 out of 255 in the source lets many dots build a richer mark.',
            },
        ],
    },
    plants: {
        idea: 'The forest uses the same material as the ground. A trunk and branches are hatched rectangles, while leaf clumps are hatched ellipses. Randomness changes their sizes and offsets inside a stable recipe. This is why the plants feel varied but still belong to one family.',
        lens: 'Think of a component system for plants. The trunk, branch and leaf are nested components; random parameters pick a new instance without inventing a new visual language.',
        remember: 'A small grammar produces variety when its relationships stay consistent.',
        code: 'const nClumps = round(rng.range(4, 5));\nconst branchHt = rng.range(0.1, 1);\nconst branchStartY = lerp(y, y - treeHt, branchHt);\n// The leaf is another instance of the same ink primitive.\nconst leaf = new InkEllipse(\n    x + off.x + co.x, y - treeHt + off.y + co.y,\n    4, r * 2, rng.range(1, 1.1), false,\n);',
        file: 'plants.ts',
        tries: [
            'Keep height fixed and change the seed to build a specimen collection.',
            'Switch to scrub: the vocabulary stays elliptical, but the offsets gather below the canopy.',
            'Make a 10-unit tree and an 80-unit tree. The recipe creates a family, not a scaled photograph.',
        ],
        note: 'In the full artwork, slope and curvature decide whether plants may grow at a sample. Noise decides the tree-versus-scrub region and influences height. The specimen demo removes that ecological placement so you can inspect one plant’s construction.',
        application:
            'Compose a botanical atlas: hold the paper, palette and plant height steady; vary only the seed. Then make a second series with the same seeds and a different height. This separates identity from proportion.',
        cards: [
            {
                question: 'Which primitive builds leaves?',
                answer: 'A hatched ellipse, drawn by the same inertial pen used for the ground.',
            },
            {
                question: 'Why use a grammar instead of random shapes everywhere?',
                answer: 'Constraints preserve recognizable structure while parameters supply variation.',
            },
            {
                question: 'Does the specimen demo reproduce terrain placement?',
                answer: 'No. It reuses the real plant builder but isolates the specimen from slope and curvature rules.',
            },
        ],
        terms: [
            {
                word: 'Grammar',
                meaning: 'A set of construction rules that produces a recognizable family of forms.',
            },
            {
                word: 'Curvature',
                meaning: 'How quickly the slope itself changes; the source estimates it with second differences.',
            },
        ],
    },
    depth: {
        idea: 'The artwork is painted back to front. A mark remembers its original ground row before height lifts it and the warp nudges it sideways. That remembered row decides when it is painted. A nearby tree can therefore cover a distant hill even if its top is high on the screen.',
        lens: 'Think of arranging cut-paper scenery in layers. A tree belongs to the depth of its base, not the position of its highest leaf.',
        remember: 'Sort by where a mark belongs in the world, not where its top lands on screen.',
        code: 'const z = y;\n({ x, y } = projectTerrain(x, y, ns, warpSz, terrainHt));\n// Keep z from before the projection.\nscribble.z = z;\nshapes.sort((a, b) => b.z - a.z);',
        file: 'world.ts',
        tries: ['Reverse the drawing order. Near rows lose their ability to cover distant ones.', 'Push warp to 60. Watch overlap become tangled even though the sorting rule stays consistent.'],
        note: 'The projection uses cos(height) and sin(height) for a 10-unit positional nudge, plus height-scaled vertical elevation. It does not alter the noise lookup coordinates. This is a screen-space displacement; calling it domain-warped noise would teach the wrong mechanism.',
        application:
            'Make folded-paper landscapes or typographic hills by projecting another set of marks through the same helper. Give each object an explicit ground-depth value before projection; never recover depth from its finished screen position.',
        cards: [
            {
                question: 'Why save z before moving the mark?',
                answer: 'Depth represents the original ground row. Projection changes the screen position, not that depth.',
            },
            {
                question: 'Why sort descending then use the last item?',
                answer: 'The last item has the smallest depth, so the background is painted first.',
            },
            {
                question: 'What happens if you clear each frame?',
                answer: 'Earlier layers disappear, destroying both ink accumulation and painter’s-order occlusion.',
            },
        ],
        terms: [
            {
                word: 'Projection',
                meaning: 'Turning a location in your imagined world into a screen position.',
            },
            {
                word: 'Painter’s algorithm',
                meaning: 'Drawing distant objects first, then painting nearer objects over them.',
            },
        ],
    },
    studies: {
        idea: 'You do not need a second forest to prove you understand Sagebrush. Extract a relationship and move it to another medium. Here, the height field becomes a topographic print, and the source pen performs a new lettering path. The helpers are real; the compositions are new.',
        lens: 'Treat each technique like a reusable effect in your design toolkit. A field can be a mask, a spacing rule or a color lookup. A pen can perform any ordered set of points.',
        remember: 'Transfer the rule that creates the character, not the whole composition.',
        code: 'const stroke = new InkStroke();\nstroke.points = points.map(([x, y]) => ({ x, y }));\nstroke.pen = cv(points[0][0], points[0][1]);\nstroke.setAcc(0.02);\nstroke.setWobble(0.2);\n// Feed this new path into the same source update() loop.',
        file: '../ArtSagebrushLearn/demos/InkLab.tsx',
        tries: [
            'In the print, raise contour bands until the map becomes too dense. Find the last setting that still reads at a distance.',
            'In the lettering, compare low wobble with a broad, transparent brush. The same path can feel mechanical or botanical.',
        ],
        note: 'The contour threshold and the INK letter paths are new studies, not hidden features of the original artwork. The contour image quantizes a scalar field; the lettering reuses InkStroke. Keeping that boundary explicit makes the experiments easier to adapt responsibly.',
        application:
            'Three briefs: a six-print topographic edition using one noise seed; a short word drawn with three different pen settings; a botanical specimen atlas from the previous chapter. For each series, lock every parameter except the one you are investigating.',
        cards: [
            {
                question: 'What is reused in the lettering study?',
                answer: 'The real InkStroke pen simulation; only its target path is new.',
            },
            {
                question: 'How do contour bands appear?',
                answer: 'Multiply height by a band count, take its fractional part and keep a thin interval.',
            },
            {
                question: 'What makes a study informative?',
                answer: 'Changing one relationship at a time so its visual effect can be recognized.',
            },
        ],
        terms: [
            {
                word: 'Quantization',
                meaning: 'Replacing continuous values with discrete bands or steps.',
            },
            {
                word: 'Transfer',
                meaning: 'Reusing a technique in a different composition or medium.',
            },
        ],
    },
    build: {
        idea: 'Start with one sentence about the image you want: a sparse botanical atlas, a dense contour print, or a nervous ink word. Then choose what stays fixed and what may vary. A series is easier to direct when you can name the rule that makes its pieces belong together.',
        lens: 'Write a small design system for the artwork: material, composition, allowed variation and a quality budget. Your seed becomes the instance ID.',
        remember: 'A clear constraint makes randomness useful.',
        code: 'const noise = createNoise(1337);\nconst random = createRandom(42);\n// Prepare once. Keep both streams alive for the entire drawing.\nconst field = createHeightfield(random, noise);\n// Draw in bounded batches; retain the ink between batches.',
        file: 'heightfield.ts',
        tries: [
            'Change only the noise seed in the recipe and compare two editions.',
            'Choose a smaller study first. A single convincing mark is a better starting point than thousands of unfinished marks.',
        ],
        note: 'World construction still runs synchronously. A short timeout lets the loading label paint; it is not a worker. Drawing is budgeted separately: up to 2,000 updates and approximately 8 ms per frame, checked every 32 steps. The guide’s pen studies share one GSAP clock, pause outside the viewport and remove their callbacks when you change chapters.',
        application:
            'Use the recipe builder below to save an edition. Keep screenshots with the seed pair and the code revision. If setup grows costly, move serializable field generation to a worker; keep Canvas ownership and random-stream boundaries explicit.',
        cards: [
            {
                question: 'What belongs in an edition record?',
                answer: 'Seeds, parameters and the code version, plus a reference image.',
            },
            {
                question: 'Does setTimeout move generation off the main thread?',
                answer: 'No. It delays the work but executes it on the same main thread.',
            },
            {
                question: 'Why does a time budget preserve the image?',
                answer: 'It changes how many sequential updates run in a frame, not their order or random stream.',
            },
        ],
        terms: [
            {
                word: 'Frame budget',
                meaning: 'The amount of work allowed before yielding so the browser can respond.',
            },
            {
                word: 'Worker',
                meaning: 'A separate execution context for CPU work that would otherwise block interaction.',
            },
        ],
    },
} as const;
