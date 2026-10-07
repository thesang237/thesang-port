import { InkEllipse, type InkStroke } from './brush';
import { createHeightfield } from './heightfield';
import { abs, constrain, cos, cv, floor, lerp, mapRange, max, norm, PI, pow, round, sin, TAU, vdot, vmagsq, vnorm, vrot, vscale } from './math';
import { createNoise } from './noise';
import { buildPalettes, type InkColor, withA } from './palette';
import { createPlantBuilders } from './plants';
import { projectTerrain } from './projection';
import { createRandom } from './random';
import { ART_SIZE, NOISE_FREQUENCY } from './settings';
import { terrainCurvature, terrainGradient } from './terrain';

/** Composition order matters: plants write shadows before ground strokes read
 * the light map. Keep the random call order stable to preserve existing seeds. */

export type World = {
    shapes: InkStroke[];
    minY: number;
    maxY: number;
    palette: InkColor[];
    treePalette: InkColor[];
};

export function createWorld(rngSeed: number, noiseSeed: number): World {
    const rng = createRandom(rngSeed);
    const noise = createNoise(noiseSeed);

    const { palettes, treePalettes } = buildPalettes();
    const paletteIndex = rng.pick([0, 1, 2, 3, 4, 5]);
    const palette = palettes[paletteIndex];
    const treePalette = treePalettes[paletteIndex];

    const paletteColor = (br: number): InkColor => palette[constrain(floor(br * palette.length), 0, palette.length - 1)];
    const treePaletteColor = (br: number): InkColor => treePalette[constrain(floor(br * treePalette.length), 0, treePalette.length - 1)];

    const lightAngle = -PI / 2 + ((rng.r01() < 0.5 ? -1 : 1) * PI) / 3;
    const lgt = vnorm(cv(cos(lightAngle), sin(lightAngle), 0));

    const terrainHt = -0.2 * ART_SIZE;
    const warpSz = 10;

    // ── height map ──────────────────────────────────────────────────────────

    const { hMap, mapW, mapH, minY, maxY } = createHeightfield(rng, noise);

    // ── light map ───────────────────────────────────────────────────────────

    const lMap: number[][] = [];
    for (let i = 0; i < mapW; i++) {
        const row: number[] = [];
        for (let j = 0; j < mapH; j++) {
            row.push(vdot(vnorm(terrainGradient(hMap, i, j, mapW, mapH)), lgt));
        }
        lMap.push(row);
    }

    // ── shape generation ────────────────────────────────────────────────────

    const shapes: InkStroke[] = [];

    const { addTree, addBush } = createPlantBuilders({ rng, noise, shapes, treePaletteColor, lgt, hMap });

    const treeToScrubThresh = rng.range(0.18, 0.28);
    const plantThresh = constrain(rng.range(0.3, 0.5), 0.3, 0.45);
    const plantSide = rng.pick([-1, 1]);
    const plantSlopeLeniency = rng.range(0.01, 0.1);

    const nShapes = 8000;
    const nCircles = floor(nShapes * 0.2);

    // Pass 1: terrain scribbles + trees/bushes
    for (let _i = 0; _i < nCircles; _i++) {
        let x = rng.range(ART_SIZE),
            y = rng.range(ART_SIZE);
        const z = y + 10;
        const mi = constrain(floor(mapRange(x, 0, ART_SIZE, 0, mapW - 1)), 0, mapW - 1);
        const mj = constrain(floor(mapRange(y, 0, ART_SIZE, 0, mapH - 1)), 0, mapH - 1);
        const ns = hMap[mi][mj];
        if (ns === 0) continue;

        ({ x, y } = projectTerrain(x, y, ns, warpSz, terrainHt));

        const nrm = vnorm(terrainGradient(hMap, mi, mj, mapW, mapH));
        const dt = vdot(nrm, lgt);
        const nrm2 = terrainCurvature(hMap, mi, mj, mapW, mapH);

        const r = rng.range(4, 4);
        const off = vscale(vrot(cv(1, 0), noise(x * NOISE_FREQUENCY, y * NOISE_FREQUENCY, rng.r01() * TAU * 0.1) * 2 * TAU, 0, 0), rng.r01() * r);
        const scribble = new InkEllipse(x + off.x, y + off.y, r, r, 1, false);
        scribble.z = z;
        scribble.setWeight(2.5);
        scribble.setMaxV(0.3);
        scribble.setAcc(0.01);
        scribble.setDensity(1);
        scribble.setWobble(0.1);
        scribble.setAngle(rng.r01() * TAU);
        const lightValue = norm(dt, -1, 1);
        const landValue = noise(mi * NOISE_FREQUENCY * 4 + 1000, mj * NOISE_FREQUENCY * 4 + 1000);
        const col = paletteColor(lerp(landValue, lightValue, constrain(abs(lightValue - 0.5) * 2 + rng.range(-1, 1) * 0.1, 0, 1)));
        scribble.setColor(withA(col, 64));
        shapes.push(scribble);

        const treeNs = noise(mi * NOISE_FREQUENCY * 3 + 1234, mj * NOISE_FREQUENCY * 3 + 1234);
        if (abs(nrm.x) < plantThresh && (plantSide < 0 ? nrm2.x < rng.r01() * plantSlopeLeniency : nrm2.x > -rng.r01() * plantSlopeLeniency)) {
            let shadowLength = 0.5;
            const treeHtNs = noise(mi * NOISE_FREQUENCY * 9 + 100, mj * NOISE_FREQUENCY * 9 + 123);
            if (treeNs > treeToScrubThresh) {
                if (ns < PI * 2.5 && mj > 4) {
                    addTree(x, y, z - 10, lightValue, mapRange(treeHtNs, 0, 1, 10, 80));
                    shadowLength = 1;
                }
                if (rng.r01() < 0.5) addBush(x, y, z - 10 + 0.0001, lightValue, mapRange(treeHtNs, 0, 1, 10, 100) * 0.5, mi, mj);
            } else {
                addBush(x, y, z - 10 + 0.0001, lightValue, mapRange(treeHtNs, 0, 1, 10, 100), mi, mj);
            }
            const w = mapRange(treeHtNs, 0, 1, 4, 8) * shadowLength;
            const h = mapRange(treeHtNs, 0, 1, 1, 3);
            for (let wi = -w; wi <= w; wi++) {
                for (let wj = -h; wj <= h; wj++) {
                    const si = floor(mi + wi + cos(lightAngle) * w * 0.5);
                    const sj = floor(mj + wj + sin(lightAngle) * h * 0.5);
                    if (si >= 0 && si < mapW && sj >= 0 && sj < mapH) lMap[si][sj] = lerp(lMap[si][sj], -1, 0.7);
                }
            }
        }
    }

    // Pass 2: main terrain strokes
    for (let _i = 0; _i < nShapes; _i++) {
        let x = rng.range(ART_SIZE),
            y = rng.range(ART_SIZE);
        const z = y;
        const mi = constrain(floor(mapRange(x, 0, ART_SIZE, 0, mapW - 1)), 0, mapW - 1);
        const mj = constrain(floor(mapRange(y, 0, ART_SIZE, 0, mapH - 1)), 0, mapH - 1);
        const ns = hMap[mi][mj];
        ({ x, y } = projectTerrain(x, y, ns, warpSz, terrainHt));

        const nrm = vnorm(terrainGradient(hMap, mi, mj, mapW, mapH));
        const dt = lMap[mi][mj];
        const nrm2sq = vmagsq(terrainCurvature(hMap, mi, mj, mapW, mapH));
        const minLen = 15,
            maxLen = 30 * 0.8;
        const nScribbles = max(1, floor(mapRange(pow(abs(y - z), 1), 0, pow(abs(terrainHt) + abs(warpSz), 1), 1, rng.range(1, 3))));

        for (let k = 0; k < nScribbles; k++) {
            const r = constrain(mapRange(nrm2sq, 0.0001, 0.0008, maxLen, minLen), minLen, maxLen);
            const scribble = new InkEllipse(x, y, 5, r * rng.range(0.9, 1.1), rng.range(1, 2), false);
            scribble.z = z;
            scribble.setWeight(2.5);
            scribble.setMaxV(1);
            scribble.setAcc(0.02);
            scribble.setDensity(2);
            scribble.setWobble(0.2);
            scribble.setAngle(mapRange(nrm.x, 1, -1, 0, PI / 2) + PI / 4 + (round(rng.r01()) * 2 - 1) * PI);

            for (let pi = 0; pi < scribble.points.length; pi++) {
                const pt = scribble.points[pi];
                const pns = (noise(pt.x * NOISE_FREQUENCY * 4 + 100, pt.y * NOISE_FREQUENCY * 4 + 100) * 2 - 1) * 2 * TAU;
                pt.x += cos(pns) * 2;
                pt.y += sin(pns) * 2;
            }

            const lightValue = norm(dt, -1, 1);
            const landValue = noise(mi * NOISE_FREQUENCY * 4 + 1000, mj * NOISE_FREQUENCY * 4 + 1000);
            const col = paletteColor(lerp(landValue, lightValue, abs(lightValue - 0.5) * 2));
            scribble.setColor(withA(col, 64));
            shapes.push(scribble);
        }
    }

    // Sort descending so shapes[last] = lowest z (background), drawn first
    shapes.sort((a, b) => b.z - a.z);

    return { shapes, minY, maxY, palette, treePalette };
}
