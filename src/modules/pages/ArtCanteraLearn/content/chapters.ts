import type { Card } from '../kit/ui';

export type ChapterId = 'map' | 'seeds' | 'terrain' | 'erosion' | 'carving' | 'projection' | 'light' | 'grain' | 'life' | 'build';
export type Chapter = {
    id: ChapterId;
    label: string;
    title: string;
    lead: string;
    idea: string;
    term: string;
    definition: string;
    lens: string;
    remember: string;
    labRemember: string;
    code: string;
    highlight: string[];
    source: string[];
    try: string[];
    creative: string;
    creativeRemember: string;
    steps: string[];
    sourceRemember: string;
    cards: Card[];
};
export const CHAPTERS: Chapter[] = [
    {
        id: 'map',
        label: 'The map',
        title: 'A landscape, cut into a city.',
        lead: 'Cantera grows a rough landscape, removes architectural volumes, then prints it one ray at a time. Its detail comes from a small set of rules working together.',
        idea: 'Think of a quarry seen from above: rough stone meets straight cuts, deep voids and tiny signs of life. The source builds two height fields, assigns them to blocks, carves empty volumes, removes unsupported cells, and lights the surviving surfaces. It is CPU rendering on a 2D canvas; there is no three.js mesh or image texture.',
        term: 'Height field',
        definition: 'A grid whose numbers store surface height. It can describe hills, but cannot describe an overhang by itself.',
        lens: 'Start with a displacement map, combine it with a set of subtractive solids, then photograph the result with an architectural camera. Each stage changes one aspect of the composition.',
        remember: 'Terrain supplies the organic shape; removed volumes supply the architecture.',
        labRemember: 'The same landscape can become a different sculpture when you change what is removed.',
        code: `const world = createWorld(hash);
const math = createTracing(world);
world.landscape = new Landscape(depositScale, depositOffset, erosionScale, erosionOffset);
carving.grow(spacing);
carving.clear();
resolveStructure(world, math);
world.landscape.calculateCurvature();`,
        highlight: ['carving.clear()', 'resolveStructure'],
        source: ['art/scene.js', 'art/height-field.js', 'art/carving.js', 'art/render.worker.ts'],
        try: ['Move the build stage from 1 to 5. Name the job of each ingredient.', 'Set void amount to 0.9 and turn grounding off. See how scattered islands stop reading as architecture.'],
        creative:
            'Build a material vocabulary before a whole scene. Choose one natural rule, one geometric rule and one drawing rule. A landscape plus a circular subtraction plus ink contours already has a distinct voice.',
        creativeRemember: 'A coherent piece needs a small family of rules, not a large collection of effects.',
        steps: [
            'random.js rolls the trait choices; scene.js keeps the draw order.',
            'height-field.js grows and erodes two maps; carving.js clears block volumes.',
            'blocks.js and tracing.js find the surface; surface.js adds light and marks.',
            'render.worker.ts owns the expensive print; life.js adds moving details on top.',
        ],
        sourceRemember: 'Read scene.js first, then follow the module for the artistic decision you want to change.',
        cards: [
            {
                question: 'Why combine a height field with blocks?',
                answer: 'The field gives smooth terrain. Blocks give carved walls, cavities and cut faces that a single height map cannot describe.',
            },
            {
                question: 'Where does the image texture come from?',
                answer: 'Cantera creates it from light samples, curvature, stripes, grids, windows and stone grain. It does not load a stone photograph.',
            },
            {
                question: 'Which work repeats every frame?',
                answer: 'The print accumulates only until its sample budget is complete. The living layer then moves over the finished static canvas.',
            },
        ],
    },
    {
        id: 'seeds',
        label: 'Seeds',
        title: 'Give chance a memory.',
        lead: 'A seed is a way to return to a decision. Random ownership is a way to keep one experiment from unexpectedly changing another.',
        idea: 'The token hash starts two alternating random streams. Smaller Alea streams belong to height fields, individual cells, render passes and living marks. A repeatable stream gives the same sequence when its seed and call order stay the same. Reproducibility does not mean every subsystem uses the same dice.',
        term: 'Random stream',
        definition: 'A repeatable sequence of numbers. Drawing one number advances its state, so call order matters.',
        lens: 'Imagine a Figma component whose variants are chosen from a saved recipe. Form and surface details should have separate recipe pages, so editing one does not reorder the other.',
        remember: 'A seed repeats a sequence; stable ownership keeps edits local.',
        labRemember: 'Extra random calls affect everything downstream on the same stream.',
        code: `next() {
    this.useA = !this.useA;
    return this.useA ? this.a() : this.b();
}
// Elsewhere, each block owns local detail dice:
this.detailRandom = new math.LocalRandom(
    Math.round(1000 * (1 + math.noise(x, y, z, 77.072)))
);`,
        highlight: ['this.useA', 'this.detailRandom'],
        source: ['art/random.js', 'art/blocks.js', 'art/scene.js'],
        try: [
            'Switch to Shared stream and consume 40 extra form draws. Only the downstream detail changes.',
            'Switch back to Separate streams. Change the seed, then return to 19: both original mosaics return.',
        ],
        creative: 'Make a collection with a stable silhouette seed and a separate surface seed. Keep the composition recognizable while exploring different engraving, windows or flecks.',
        creativeRemember: 'A series can share its structure while varying its surface language.',
        steps: [
            'Keep TokenRandom warm-up and trait call order intact when preserving existing hashes.',
            'Use LocalRandom for a new feature instead of consuming the global trait stream.',
            'Store the full 64-digit hash with your exported image. The art page accepts ?seed=0x… .',
        ],
        sourceRemember: 'Adding a feature should not accidentally reroll every existing choice.',
        cards: [
            {
                question: 'Does a fixed seed guarantee the same result after any edit?',
                answer: 'No. The algorithm, draw order and image dimensions also need to stay the same.',
            },
            {
                question: 'Why give each block its own random stream?',
                answer: 'Local grain and intersection jitter can develop without consuming the scene trait stream.',
            },
            {
                question: 'What are the two random systems here?',
                answer: 'TokenRandom alternates warmed SFC32 streams from the hash. LocalRandom supplies Alea-based streams for smaller systems.',
            },
        ],
    },
    {
        id: 'terrain',
        label: 'Terrain',
        title: 'Let nearby points agree.',
        lead: 'A landscape begins as a table of numbers. Smooth noise makes neighbouring heights agree; overlapping scales make the surface interesting.',
        idea: 'Independent dice rolls make static. Smooth noise creates rolling forms. Cantera rotates and stretches the sampling coordinates, adds broad and detailed layers, then resamples the field at larger sizes. Bilinear sampling blends four nearby heights and also returns downhill slope, which the erosion chapter needs.',
        term: 'Bilinear sampling',
        definition: 'Blend the four corners of a grid cell to estimate the value between them.',
        lens: 'Treat the field like an After Effects displacement map. Large noise shapes establish the silhouette; finer layers add detail. Rotating the map changes the rhythm without rotating the camera.',
        remember: 'Large forms establish the composition before small noise adds texture.',
        labRemember: 'The same numerical field can become a shaded relief or an ink landscape.',
        code: `const height = h00 * (1 - fx) * (1 - fy)
    + h10 * fx * (1 - fy)
    + h01 * (1 - fx) * fy
    + h11 * fx * fy;
const gradientX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
const gradientY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;`,
        highlight: ['const height', 'gradientX'],
        source: ['art/height-field.js', 'art/noise.js'],
        try: [
            'Set layers to 1 and frequency to 0.006. The broad structure becomes easy to read.',
            'Push frequency to 0.1 and layers to 6. Small detail competes with the silhouette.',
            'Set relief height to 0. The heights still exist, but the drawing flattens them.',
        ],
        creative: 'Use the Ink view as a contour-print study. Draw the same terrain with lines instead of lit pixels. The generated world becomes a drawing tool, rather than a fixed visual style.',
        creativeRemember: 'Data and drawing style are separate artistic choices.',
        steps: [
            'HeightField.addNoise rotates sampling coordinates and layers noise.',
            'HeightField.sample returns downhill direction and height in one tuple.',
            'Landscape grows from 100 × 100 to 393 × 393 and finally 785 × 785 samples.',
        ],
        sourceRemember: 'Change the field when you want new landforms; change the renderer when you want a new medium.',
        cards: [
            {
                question: 'Why does smooth noise feel more natural than independent random heights?',
                answer: 'Nearby samples are related, so hills connect instead of becoming static.',
            },
            {
                question: 'What does bilinear sampling blend?',
                answer: 'The four corner values of a grid cell, weighted by the point’s fractional x and y position.',
            },
            {
                question: 'What does adding more noise layers change?',
                answer: 'It adds overlapping scales of detail. The broad structure can remain while the surface becomes more complex.',
            },
        ],
    },
    {
        id: 'erosion',
        label: 'Erosion',
        title: 'Water writes the valleys.',
        lead: 'Noise supplies a landscape with no history. Erosion gives it one: thousands of small downhill journeys move material from one place to another.',
        idea: 'Each droplet starts at a seeded location and reads the slope. Its direction mixes a little memory with the current downhill direction. Descending water can pick up sediment. Slower or uphill water deposits what it carries. The source distributes each change across four grid corners, so paths can move between samples smoothly.',
        term: 'Sediment capacity',
        definition: 'How much material a moving droplet can carry. Here it depends on downhill height change and remaining water.',
        lens: 'This is a subtractive brush that follows the image’s own slope, then puts some paint back. You choose the behaviour; the field chooses the path.',
        remember: 'Erosion moves material; it does not only lower the terrain.',
        labRemember: 'More droplets create more history, while inertia changes the shape of each journey.',
        code: `const surface = this.sample(x, y, false);
directionX = inertia * directionX + (1 - inertia) * surface[0];
directionY = inertia * directionY + (1 - inertia) * surface[1];
const heightChange = this.sample(x, y, true)[2] - surface[2];
const capacity = Math.max(0.01, -heightChange * water * 40);`,
        highlight: ['directionX', 'capacity'],
        source: ['art/height-field.js'],
        try: [
            'Compare 0 and 12,000 droplets. Switch to Ink to find the carved channels.',
            'Set inertia to 1. Droplets start with zero direction and keep it, so erosion stops.',
            'Try a broad field with one noise layer. The paths become easier to see than on a very rough field.',
        ],
        creative:
            'Make a tidal ink print. Use broad hills, many droplets and closely spaced horizontal lines. Let the channels bend the line spacing. The artistic gesture comes from material transport, not from animated water.',
        creativeRemember: 'A process can leave a visible trace even when the process itself is never shown.',
        steps: [
            'The three source stages use 15k, 70k and 100k droplets per terrain.',
            'Default inertia is 0.05; deposit rate is 0.2; later erosion rate is 0.05.',
            'The source varies erosion and deposition with noise-based material resistance. This small study turns resistance off to isolate water behaviour.',
        ],
        sourceRemember: 'Keep random draw order and numeric rounding stable when preserving old erosion results.',
        cards: [
            {
                question: 'When does a droplet deposit sediment?',
                answer: 'When it climbs uphill or carries more material than its current capacity.',
            },
            {
                question: 'Why does inertia 1 stop this erosion model?',
                answer: 'Each droplet begins with zero direction. At inertia 1 it ignores the slope and never starts moving.',
            },
            {
                question: 'Why distribute changes over four corners?',
                answer: 'A droplet moves between grid points. Weighted corner updates avoid forcing every change into one cell.',
            },
            {
                question: 'Why are there multiple erosion stages?',
                answer: 'The terrain grows through different resolutions; erosion works on broad forms first and finer detail later.',
            },
        ],
    },
    {
        id: 'carving',
        label: 'Carving',
        title: 'Design the space you remove.',
        lead: 'The straight cuts make Cantera read as architecture. Carving is a composition of absences, followed by a check that the remaining structure belongs to the ground.',
        idea: 'The source grows axis-aligned segments in a noise-selected region, offsets them, makes occasional copies and accumulates bounds at junctions. Clearing these volumes marks cells empty. Thin unsupported cells and diagonal-only contacts are pruned. A flood from the base then removes cells the ground cannot reach.',
        term: 'Flood fill',
        definition: 'Visit connected neighbours starting from a known set. Here the starting set is the solid base layer.',
        lens: 'Use Boolean subtract in a 3D tool, then ask whether the sculpture still forms a connected object. In Figma terms, art-direct the negative space before polishing the edges.',
        remember: 'Carving determines the void; connectivity determines what can survive.',
        labRemember: 'Grounding is a structural rule, not just a visual cleanup filter.',
        code: `let frontier = [];
for (const column of blocks) for (const stack of column)
    if (!stack[0].isEmpty) {
        frontier.push(stack[0]);
        stack[0].visited = true;
    }
for (const block of frontier)
    next.push(...block.unvisitedNeighbours());`,
        highlight: ['frontier.push', 'unvisitedNeighbours'],
        source: ['art/carving.js', 'art/blocks.js', 'art/scene.js'],
        try: [
            'Choose Monolith. Widen the interior until the remaining shell becomes fragile.',
            'Choose Quarry and turn grounding off. Increase void amount until unsupported islands appear.',
            'Choose Arcade. Repeated openings create a rhythm even without terrain detail.',
        ],
        creative:
            'Build an impossible arcade or a hollow monolith. Use repeated voids as the motif; use varied height as the disruption. The study uses simplified carving so you can see the decision clearly.',
        creativeRemember: 'Negative space can be the main motif of a generative collection.',
        steps: [
            'CutSegment alters and copies geometric cuts; CutBounds clears occupied cells.',
            'Block.resolveTerrain measures height coverage to classify thin, flat and tip cells.',
            'Block.unvisitedNeighbours applies terrain and flat-top rules. The demo uses plain six-neighbour reachability for clarity.',
        ],
        sourceRemember: 'Treat the carving, terrain intersection and support rules as separate editable decisions.',
        cards: [
            {
                question: 'Why flood from the base after carving?',
                answer: 'To remove detached cells that no surviving grounded path can reach.',
            },
            {
                question: 'Does the source use only ordinary six-neighbour connectivity?',
                answer: 'No. Neighbours also respect terrain boundaries and flat-top rules.',
            },
            {
                question: 'What is the artistic role of the cuts?',
                answer: 'They introduce straight walls, negative space and architectural rhythm into organic terrain.',
            },
        ],
    },
    {
        id: 'projection',
        label: 'Projection',
        title: 'Photograph it like a drawing.',
        lead: 'Parallel rays give Cantera the clarity of an architectural print. A camera angle changes which cuts, rooftops and relationships you can read.',
        idea: 'An orthographic camera measures each point along its right and up directions. Those measurements become screen coordinates. Depth is measured along the third direction. Distance does not make objects smaller; the small fade on living details is a separate artistic rule.',
        term: 'Orthographic projection',
        definition: 'A camera with parallel viewing rays. Parallel lines stay parallel and distant objects do not shrink.',
        lens: 'Think isometric drawing or an architectural axonometric view. Move the camera to show relationships, rather than using a wide-angle lens for drama.',
        remember: 'Orthographic projection preserves the scale relationships of the world.',
        labRemember: 'Camera choice is a composition choice, even when the underlying object is unchanged.',
        code: `const relative = point.map((value, axis) => value - this.planeO[axis]);
return [
    width / 2 + dot(relative, this.planeX) / pixelScale,
    height / 2 - dot(relative, this.planeY) / (pixelScale * this.squeeze),
    -dot(relative, this.planeZ),
];`,
        highlight: ['dot(relative', 'this.squeeze'],
        source: ['art/camera.js', 'art/math.js', 'art/scene.js'],
        try: [
            'Lower camera tilt to 5°. Rooftops nearly disappear into a stack of walls.',
            'Raise tilt to 85°. The void plan becomes readable while wall depth vanishes.',
            'Rotate the camera and compare the exact same seeded sculpture.',
        ],
        creative:
            'Create an edition of the same sculpture viewed from several controlled angles. Treat the camera as a graphic layout tool: choose which openings overlap and how much roof is visible.',
        creativeRemember: 'Changing the view can create a new image without changing the world.',
        steps: [
            'The source tilts the camera by π/4 (45°).',
            'Diagonal mode turns by −π/4; front mode turns by 0.',
            'Pixel scale relates world units to canvas pixels; squeeze adjusts vertical framing.',
        ],
        sourceRemember: 'Keep camera projection and eye-ray origin calculation consistent.',
        cards: [
            {
                question: 'What makes orthographic rays different from perspective rays?',
                answer: 'Orthographic rays are parallel; perspective rays spread from an eye point.',
            },
            {
                question: 'Does a faraway block get smaller here?',
                answer: 'No. Any distance-based fade or size adjustment must be added explicitly.',
            },
            { question: 'What do the right and up dot products give us?', answer: 'A point’s coordinates along the camera’s screen axes.' },
        ],
    },
    {
        id: 'light',
        label: 'Rays & light',
        title: 'A pixel asks what is in front.',
        lead: 'The renderer follows a line through the carved world to find the first visible surface. More lines toward the light decide how dark that surface should be.',
        idea: 'The tracer finds where a ray crosses grid planes, sorts these crossings by distance, and tests the occupied cell between each pair. Inside a cell it samples terrain until it finds a surface, then refines the hit. Shadow rays start near that surface and point toward a slightly varied sun direction.',
        term: 'Ray tracing',
        definition: 'Follow a line through a scene to find a surface or an obstruction. This artwork does it on the CPU.',
        lens: 'Imagine a straight thread passing through a stack of masks. The first solid point gives you the visible shape. Threads toward the light tell you which points are sheltered.',
        remember: 'Eye rays find the visible surface; light rays test its surroundings.',
        labRemember: 'Soft shadows come from varied light directions and repeated samples.',
        code: `const block = getBlock(lerp(crossings[index], crossings[index + 1], 0.5));
if (block != null) {
    const surfaceHit = block.intersect(
        crossings[index], crossings[index + 1], shadowOnly, crossings[index][4]
    );
    if (surfaceHit != null) return surfaceHit;
}`,
        highlight: ['block.intersect', 'return surfaceHit'],
        source: ['art/tracing.js', 'art/blocks.js', 'art/surface.js'],
        try: [
            'Set light spread to 0. The shadow becomes a hard geometric edge.',
            'Use one ray and a wide spread. The noisy edge shows the uncertainty in each sample.',
            'Switch to Light rays and lower the sun angle. Shadows reach much farther.',
        ],
        creative: 'Make a light study from a deliberately simple object. A deep void plus a low sun can become a dark compositional shape. Light can draw forms as strongly as carving does.',
        creativeRemember: 'A shadow is part of the composition, not a final decoration.',
        steps: [
            'math.rayPlane supplies the grid crossings; tracing.js walks them in order.',
            'Block.intersect distinguishes terrain hits from cut faces.',
            'The source uses two shadow tests per hit, with horizontal jitter 0.2 and vertical jitter 0.15 radians.',
        ],
        sourceRemember: 'Shadow-only traces return distance; surface traces return position, face, distance and a material cue.',
        cards: [
            {
                question: 'Why test the midpoint between grid crossings?',
                answer: 'It identifies which cell contains that ray segment, so empty cells can be skipped.',
            },
            { question: 'Why offset the shadow origin?', answer: 'To keep the new ray from immediately hitting its own surface.' },
            {
                question: 'How do jittered rays make a soft edge?',
                answer: 'Different rays disagree near an edge; averaging their answers creates a transition.',
            },
        ],
    },
    {
        id: 'grain',
        label: 'Stone & grain',
        title: 'Print a material, not a texture.',
        lead: 'Cantera turns geometry into marks. Curvature suggests weathered stone, repeated grooves suggest cutting, and noisy samples give the print a granular surface.',
        idea: 'The source measures height against surrounding heights at three radii: 20, 6 and 0.5. Their weighted combination accentuates ridges and hollows. Cut faces receive different pigments from terrain. Stripes, grids and procedural windows alter brightness; repeated samples gradually settle the grain.',
        term: 'Curvature',
        definition: 'How much a point rises above or falls below neighbouring heights. It identifies ridges and hollows rather than simply measuring elevation.',
        lens: 'A printmaker can use the same plate for contour lines, relief tone or engraved marks. Curvature is a second drawing map derived from the first height map.',
        remember: 'Curvature measures local shape; height measures elevation.',
        labRemember: 'Grain can be art-directed by the sampling budget as well as by the mark formula.',
        code: `curvature(x, y, radius) {
    return 10 * (this.sample(x, y, true)[2]
        - this.neighbourHeight(x, y, radius));
}
// The accumulated color gives each new sample equal weight:
pixels[indices[0]] = (sampleCount * previousColor[0]) / (sampleCount + 1)
    + color[0] / (sampleCount + 1);`,
        highlight: ['this.neighbourHeight', 'sampleCount + 1'],
        source: ['art/height-field.js', 'art/surface.js'],
        try: [
            'In the atlas, set mark contrast to 0, then 3. The land stays the same while its tonal reading changes.',
            'In the print, compare one accumulated sample with 20. Notice how the uncertainty settles.',
            'Compare Relief and Curvature. A high flat plateau need not be a bright curvature mark.',
        ],
        creative:
            'Make an engraved atlas: use terrain height for contour lines and curvature for tonal cuts. You get two related marks from one field, which makes the image coherent even when it becomes abstract.',
        creativeRemember: 'One field can generate several related graphic languages.',
        steps: [
            'Landscape.calculateCurvature combines radii with weights 0.3, 0.4 and 3.',
            'surface.js owns windowMark, stoneGrain, groove and gridMark.',
            'Four interleaved passes cover all checkerboard offsets. The sample count is floor(pass / 4).',
        ],
        sourceRemember: 'Preserve interleaving and averaging when changing the print’s performance budget.',
        cards: [
            { question: 'Is curvature the same as height?', answer: 'No. A high flat plateau has height but little local curvature.' },
            {
                question: 'Why use three curvature radii?',
                answer: 'They reveal broad ridges and fine surface features at different scales.',
            },
            {
                question: 'Why does the renderer need four interleaved passes?',
                answer: 'Each pass covers one checkerboard offset. All four offsets complete one full sample of the image.',
            },
            {
                question: 'Why average instead of adding samples?',
                answer: 'Averaging reduces uncertainty without making the image brighter with every pass.',
            },
        ],
    },
    {
        id: 'life',
        label: 'Living scale',
        title: 'Tiny marks change the scale.',
        lead: 'A silhouette makes a rough stone block feel like a building. A flock turns a static print into a place with time passing through it.',
        idea: 'Cantera seeds 45 flocks in empty air. Each bird responds to neighbouring directions, nearby positions and crowding. The source also avoids occupied cells. A depth map compares a living mark’s projected distance with the nearest printed surface, so marks can disappear behind buildings.',
        term: 'Depth map',
        definition: 'An image that stores the distance to a surface instead of its color. It lets later layers test whether they are behind it.',
        lens: 'This is a compositing holdout matte with distance information. Add only enough movement to imply a inhabited world; the sculpture should remain the main event.',
        remember: 'Motion suggests time; tiny silhouettes suggest scale.',
        labRemember: 'Local steering creates a group behaviour without a scripted path.',
        code: `bird.forward = math.clamp(bird.forward, 3.3);
bird.forward = math.addVec(
    math.addVec(bird.forward, cohesion, 0.02), separation, 0.04
);
// Visibility uses the printed surface distance:
return world.depthMap.readNormalized(point[0] / width, (height - point[1]) / height)
    > point[2] - 0.1;`,
        highlight: ['cohesion, 0.02', 'point[2] - 0.1'],
        source: ['art/life.js', 'art/tracing.js', 'art/render.worker.ts'],
        try: [
            'Set separation to 0. The flock can collapse into a dense cluster.',
            'Raise cohesion to 0.12. Compare loose wandering with a strong group pull.',
            'Turn the depth test off. Birds now appear on top of the wall even when they should be behind it.',
        ],
        creative: 'Use living marks to set the scale of an abstract sculpture. The same blocks can feel like a tabletop model or a vast city depending on the size and speed of the inhabitants.',
        creativeRemember: 'Small contextual details can change the meaning of the whole image.',
        steps: [
            'LivingMark shares projection, brightness and visibility between people and birds.',
            'Person draws one of seven polygon silhouettes; Bird draws paired wings.',
            'The original update pace is 80ms (12.5 steps per second). The worker retains that pace; the guide pauses its clock off screen.',
        ],
        sourceRemember: 'Keep a living layer separate from the costly static print.',
        cards: [
            {
                question: 'What are the three basic flocking tendencies?',
                answer: 'Move together (cohesion), match direction (alignment), and avoid crowding (separation).',
            },
            {
                question: 'Why use a depth map for birds?',
                answer: 'It lets them pass behind the already printed architecture without reprinting the entire scene.',
            },
            {
                question: 'Why does a person silhouette change the image so much?',
                answer: 'It provides a familiar size reference, turning abstract blocks into a landscape or city.',
            },
        ],
    },
    {
        id: 'build',
        label: 'Your quarry',
        title: 'Keep the rule. Change the art.',
        lead: 'Now make a piece with your own visual argument. Choose a natural process, a geometric intervention, a mark system and a way to test the result.',
        idea: 'Start by deciding what should remain recognizable across the series. It might be a broad eroded silhouette, repeated openings, or an engraved tonal map. Use separate random streams for new experiments. Save the recipe, then judge the image at both a thumbnail and a full print size.',
        term: 'Recipe',
        definition: 'A saved set of inputs and rules that can reproduce a study. A source token hash and a teaching recipe describe different pipelines.',
        lens: 'Make a mood board of rules, not screenshots: “water-carved lines,” “repeated voids,” “charcoal on stone.” Then choose which dial is allowed to vary within each rule.',
        remember: 'Art direction is deciding which changes belong to the same visual family.',
        labRemember: 'A useful recipe captures both the seed and the behaviour.',
        code: `const field = new HeightField(65, 65, 0.39);
field.addNoise(8, 0, 0.025, -0.5, 1, false, 1, 1, false);
field.normalize();
field.erode(8000, 0.05, 40, 0.2, 0.05, false, 0.025, 0, 0.025, 0);
// Keep the source helpers. Choose your own way to draw the field.`,
        highlight: ['field.erode'],
        source: ['README.md', 'art/scene.js', 'art/height-field.js', 'ArtCanteraPage.tsx'],
        try: [
            'Choose Tidal ink and set gesture amount to 2. Then return to 0 to compare the untouched field.',
            'Choose Engraved atlas. Change the seed until the contour pattern gives you a strong focal point.',
            'Choose Impossible arcade and reduce gesture amount to 0. The absence of voids changes the entire motif.',
        ],
        creative:
            'Three starting briefs: a tidal ink print made from eroded linework; an impossible arcade composed from repeated voids; an engraved atlas combining contour and curvature. Choose one, make three variations, and change only one family of rules at a time.',
        creativeRemember: 'A convincing collection has deliberate constraints.',
        steps: [
            'Use the recipe generator to choose a brief and save its inputs.',
            'Read ArtCantera/README.md for module responsibilities and invariants.',
            'For full-artwork experiments, make an explicit new scene version rather than silently changing old token semantics.',
            'Verify repeatability, support rules, worker cleanup, small screens and reduced motion. Then test what you remember below.',
        ],
        sourceRemember: 'Preserve the original as a reference while your teaching studies become new artworks.',
        cards: [
            {
                question: 'What should you record beside a generated image?',
                answer: 'The seed, algorithm version, settings and output dimensions needed to reproduce it.',
            },
            {
                question: 'Why change one family of rules at a time?',
                answer: 'It makes the artistic effect of a change legible and keeps a collection coherent.',
            },
            {
                question: 'Which work should live outside React rendering?',
                answer: 'Terrain growth, erosion and ray printing. React owns controls; the worker owns heavy computation.',
            },
        ],
    },
];
export const chapterById = (id: ChapterId) => CHAPTERS.find((chapter) => chapter.id === id)!;
export const isChapter = (id: string): id is ChapterId => CHAPTERS.some((chapter) => chapter.id === id);
