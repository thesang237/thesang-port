import { createBlockTools } from './blocks.js';
import { Camera } from './camera.js';
import { createCarving } from './carving.js';
import { createTerrainTools } from './height-field.js';
import { createLife } from './life.js';
import { createNoise3D } from './noise.js';
import { TokenRandom } from './random.js';
import { createSurfaceRenderer } from './surface.js';
import { createTracing } from './tracing.js';

export const PALETTES = [
    { name: 'graphite', terrain: [45, 48, 53], cut: [214, 196, 188] },
    { name: 'crimson', terrain: [75, 43, 43], cut: [255, 204, 185] },
    { name: 'goldblack', terrain: [65, 62, 54], cut: [226, 193, 142] },
    { name: 'blackAndWhite', terrain: [48, 48, 48], cut: [230, 230, 230] },
    { name: 'darkgreen', terrain: [48, 60, 58], cut: [203, 197, 196] },
    { name: 'sepia', terrain: [64, 57, 47], cut: [255, 229, 192] },
];

/** Roll in exactly this order: changing the draw count changes every later trait. */
export function createWorld(hash) {
    const random = new TokenRandom(hash);
    const world = {
        random,
        height: 80,
        cellSize: 8,
        extent: 392,
        traceStep: 1.5,
        baseDepth: 8,
        blocks: [],
        landscape: null,
        depthMap: null,
    };
    world.alternateTerrain = random.next() < 0.6;
    world.flattenEdges = random.next() < 0.4;
    world.stripeAxis = Math.round(random.next());
    world.carved = random.next() > 0.36;
    if (!world.carved) world.alternateTerrain = true;
    const palette = PALETTES[Math.floor(0.99 * PALETTES.length * random.next())];
    world.palette = palette.name;
    world.terrainColor = palette.terrain;
    world.cutColor = palette.cut;
    world.cameraType = Math.floor(1.4 * random.next());
    world.frame = 2;
    world.wallGrainAxis = Math.round(random.next());
    world.roofGrainAxis = Math.round(random.next());
    world.grid = random.next() > 0.35;
    world.smallGrid = random.next() > 0.35;
    return world;
}

function setCamera(world, math) {
    const roll = world.random.next();
    let sunTurn = world.cameraType === 0 ? (roll < 0.5 ? 0.4 - 1.1 * roll : -0.35 - 1.1 * (roll - 0.5)) : 0.33 - 1.17 * roll;
    // Keep light away from angles that make the entire print flat or too dark.
    if (sunTurn >= 0 && sunTurn < 0.1) sunTurn = 0.1;
    if (sunTurn < 0 && sunTurn > -0.1) sunTurn = -0.1;
    if (sunTurn >= -0.5 && sunTurn < -0.4) sunTurn = -0.4;
    if (sunTurn < -0.5 && sunTurn > -0.6) sunTurn = -0.6;
    world.light = math.rotateXZ(0, 1, 0, 0.29, sunTurn * Math.PI);
    const turn = world.cameraType === 0 ? -Math.PI / 4 : 0;
    world.imageSpan = world.cameraType === 0 ? 88 * Math.SQRT2 : 112;
    world.squeeze = world.cameraType === 0 ? 1 : 0.99;
    world.frame = (world.frame * world.imageSpan) / 128;
    world.squeeze *= (-2 * world.frame + (16 * (world.imageSpan + 2 * world.frame)) / 9) / ((16 * world.imageSpan) / 9);
    world.imageSpan += 2 * world.frame;
    world.camera = new Camera(-world.cellSize / 2 + world.extent / 2, world.cellSize / 2 + world.extent / 2, 0, Math.PI / 4, turn, world.squeeze);
    world.camera.moveBack(500);
}

/** Remove unsupported thin cells and diagonal-only contacts until the grid is stable. */
function resolveStructure(world, math) {
    const { blocks } = world;
    let changed = true;
    for (let iteration = 0; changed && iteration < 1000; iteration++) {
        changed = false;
        for (const column of blocks)
            for (const stack of column)
                for (let z = 0; z < stack.length; z++) {
                    const block = stack[z];
                    if (iteration === 0) block.resolveTerrain();
                    const below = stack[z - 1];
                    if (!block.isEmpty && block.hasTerrain && block.isThin && below && (below.isEmpty || below.isFlat || (block.terrain !== below.terrain && below.hasTerrain))) {
                        block.isEmpty = true;
                        changed = true;
                    }
                }
        for (let x = 1; x < blocks.length - 1; x++)
            for (let y = 1; y < blocks[x].length - 1; y++)
                for (let z = 1; z < blocks[x][y].length - 1; z++) {
                    const block = blocks[x][y][z];
                    if (block.isEmpty || block.isTip) continue;
                    if (
                        [
                            [1, 1, 0],
                            [1, -1, 0],
                            [1, 0, 1],
                            [1, 0, -1],
                            [0, 1, 1],
                            [0, 1, -1],
                        ].some((offset) => math.hasUnsupportedDiagonal(x, y, z, offset))
                    ) {
                        block.isEmpty = true;
                        changed = true;
                    }
                }
    }
    // Flood from the base. Reachability has terrain-specific rules in Block.unvisitedNeighbours.
    let frontier = [];
    for (const column of blocks)
        for (const stack of column)
            if (!stack[0].isEmpty) {
                frontier.push(stack[0]);
                stack[0].visited = true;
            }
    for (let iteration = 0; frontier.length && iteration < 1000; iteration++) {
        const next = [];
        for (const block of frontier) next.push(...block.unvisitedNeighbours());
        frontier = next;
    }
    for (const column of blocks) for (const stack of column) for (const block of stack) if (!block.visited) block.isEmpty = true;
}

function markFaces(world, isContinuous) {
    const { blocks } = world;
    for (let x = 0; x < blocks.length; x++)
        for (let y = 0; y < blocks[x].length; y++)
            for (let z = 0; z < blocks[x][y].length; z++) {
                const block = blocks[x][y][z];
                if (block.isEmpty) {
                    const below = blocks[x][y][z - 1];
                    if (!below || (!below.isEmpty && !below.hasTerrain)) block.roof = true;
                    continue;
                }
                const left = blocks[x - 1]?.[y][z];
                const front = blocks[x][y - 1]?.[z];
                const above = blocks[x][y][z + 1];
                block.contX = !!left && isContinuous(left, block);
                block.contY = !!front && isContinuous(front, block);
                block.winX = !left || left.isEmpty;
                block.winY = !front || front.isEmpty;
                block.contZ = !!above && isContinuous(block, above);
            }
}

/**
 * Build once, then render many times. Every mutable object belongs to this scene.
 * Run this expensive CPU pipeline in render.worker.ts, never in a React render.
 */
export function createScene(hash, paintCanvas, lifeCanvas) {
    const world = createWorld(hash);
    const math = createTracing(world);
    setCamera(world, math);
    const { HeightField, Landscape } = createTerrainTools(world, math);
    const { Block, isContinuous } = createBlockTools(world, math);
    const carving = createCarving(world, math);
    const life = createLife(world, math);
    math.setNoise(createNoise3D(Math.round(10000 * world.random.next())));
    const erosionScale = Math.round(1000 * (0.02 + 0.05 * world.random.next())) / 1000;
    const erosionOffset = Math.round(100000 * world.random.next()) / 1000;
    const depositScale = Math.round(1000 * (0.02 + 0.05 * world.random.next())) / 1000;
    const depositOffset = Math.round(100000 * world.random.next()) / 1000;
    world.landscape = new Landscape(depositScale, depositOffset, erosionScale, erosionOffset);
    for (let x = 0; x < world.extent - world.cellSize; x += world.cellSize) {
        const column = [];
        for (let y = 0; y < world.extent - world.cellSize; y += world.cellSize) {
            const stack = [];
            for (let z = -world.baseDepth; z < world.height; z += world.cellSize) stack.push(new Block(x, y, z, world.cellSize));
            column.push(stack);
        }
        world.blocks.push(column);
    }
    const extraSpacing = 1 - Math.round(world.random.next());
    const horizontal = world.random.next() < 0.5;
    carving.grow([(5 + (horizontal ? extraSpacing : 0)) * world.cellSize, (5 + (horizontal ? 0 : extraSpacing)) * world.cellSize, 4 * world.cellSize]);
    carving.clear();
    if (!world.carved)
        for (const column of world.blocks)
            for (const stack of column)
                for (const block of stack)
                    if (block.isEmpty) {
                        block.isEmpty = false;
                        block.terrain = 1;
                    }
    resolveStructure(world, math);
    world.landscape.calculateCurvature();
    markFaces(world, isContinuous);
    life.seedFlocks();
    world.paintContext = paintCanvas.getContext('2d', { willReadFrequently: true });
    world.lifeContext = lifeCanvas.getContext('2d');
    if (!world.paintContext || !world.lifeContext) throw new Error('Canvas 2D is unavailable.');
    world.depthMap = new HeightField(Math.min(paintCanvas.width, 900), Math.min(paintCanvas.height, 1600), 0);
    const surface = createSurfaceRenderer(world, math);
    let pass = 0;
    const totalPasses = 4 * Math.min(20, Math.round(Math.max(1, 3200 / paintCanvas.height)));
    const pixelScale = world.imageSpan / paintCanvas.width;
    return {
        world,
        totalPasses,
        /** Four passes cover all four checkerboard offsets before another sample is averaged. */
        frame(animate = true) {
            if (pass < totalPasses) {
                surface.renderLight(pass, 5000, pixelScale, paintCanvas.width, paintCanvas.height);
                if (pass === 0) for (let i = 0; i < 100; i++) life.render(pixelScale, paintCanvas.width, paintCanvas.height);
                if (pass === 3) life.seedPeople(pixelScale, paintCanvas.width, paintCanvas.height);
            }
            world.lifeContext.drawImage(paintCanvas, 0, 0);
            if (pass > 3 && animate) life.render(pixelScale, paintCanvas.width, paintCanvas.height);
            pass = Math.min(pass + 1, 10000);
            return Math.min(pass / totalPasses, 1);
        },
    };
}

/** Original portrait sizing, with validated query inputs handled by the page. */
export function renderSize(width, height) {
    let portraitWidth = Math.min(18 * Math.ceil(width / 18), 18 * Math.ceil(height / 32));
    portraitWidth = 18 * Math.ceil(Math.max(90, portraitWidth, Math.min(900, 3 * portraitWidth)) / 18);
    return { width: portraitWidth, height: Math.round((16 * portraitWidth) / 9) };
}
