import { erodeTerrain, softenTerrain } from './erosion';
import { constrain, floor, mapRange, norm, pow, TAU } from './math';
import { type Noise } from './noise';
import { type createRandom } from './random';
import { ART_SIZE, NOISE_FREQUENCY } from './settings';

export type TerrainOptions = { size?: number; scale?: number; erosion?: number };

/** Three octaves → row taper → four erosion passes → softening.
 * Defaults reproduce the artwork. Bounds deliberately describe the pre-erosion
 * composition, preserving its framing. Options support small teaching studies. */
export function createHeightfield(rng: ReturnType<typeof createRandom>, noise: Noise, options: TerrainOptions = {}) {
    const sNoise = (x: number, y: number) => noise(x + 50000, y + 50000) * 2 - 1;
    const terrainHt = -0.2 * ART_SIZE;
    const mapW = options.size ?? 100,
        mapH = mapW;
    const sampledScale = rng.range(0.15, 1);
    const mapScale = options.scale ?? sampledScale;
    const sustain = mapRange(mapScale, 0.15, 1, 0.6, 0.2);
    const noiseDist = [
        [1, 1 * mapScale],
        [sustain, 2 * mapScale],
        [pow(sustain, 2), 4 * mapScale],
    ];
    const noiseTotal = noiseDist.reduce((s, d) => s + d[0], 0);

    let minY = 1e13,
        maxY = -1e13;
    const hMap: number[][] = [];
    const erodeMap: number[][] = [];
    const depositMap: number[][] = [];

    for (let i = 0; i < mapW; i++) {
        const row: number[] = [],
            eroRow: number[] = [],
            depRow: number[] = [];
        for (let j = 0; j < mapH; j++) {
            let nx = 0;
            for (const [amp, freq] of noiseDist) {
                nx += norm(sNoise(i * NOISE_FREQUENCY * freq * 2, j * NOISE_FREQUENCY * freq * 2), -1, 1) * amp;
            }
            let ns = constrain(pow(mapRange(nx, 0, noiseTotal, 0, 1), 1), 0, 1);
            ns = floor(ns * 100000) / 100000;
            ns *= TAU * 2 * mapRange(j, 0, mapH, 1, 0.5);
            const y = mapRange(j, 0, mapH - 1, 0, ART_SIZE) + mapRange(ns, 0, 2 * TAU, 0, 1) * terrainHt;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            row.push(ns);
            eroRow.push(0.1);
            depRow.push(0.001);
        }
        hMap.push(row);
        erodeMap.push(eroRow);
        depositMap.push(depRow);
    }

    const areaAdj = ((mapW * mapH) / 10000) * (options.erosion ?? 1);
    for (let pass = 0; pass < 3; pass++) erodeTerrain(hMap, depositMap, erodeMap, floor(10000 * areaAdj), 1, 4, rng);
    erodeTerrain(hMap, depositMap, erodeMap, floor(10000 * areaAdj), 1, 2, rng);
    softenTerrain(hMap, 1, 0.2);

    return { hMap, mapW, mapH, minY, maxY };
}
