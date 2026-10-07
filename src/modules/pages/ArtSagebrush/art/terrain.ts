import { cv, type Vec } from './math';

/** Forward differences, reversed at the far boundary. z stays zero:
 * this is a 2D slope direction used as an artistic lighting proxy. */
export function terrainGradient(hMap: number[][], i: number, j: number, mapW: number, mapH: number): Vec {
    const _i = i === mapW - 1 ? i - 1 : i + 1,
        iDir = i === mapW - 1 ? -1 : 1;
    const _j = j === mapH - 1 ? j - 1 : j + 1,
        jDir = j === mapH - 1 ? -1 : 1;
    return cv((hMap[_i][j] - hMap[i][j]) * iDir, (hMap[i][_j] - hMap[i][j]) * jDir);
}

export function terrainCurvature(hMap: number[][], i: number, j: number, mapW: number, mapH: number): Vec {
    const _i = i === mapW - 1 ? i - 1 : i + 1,
        iDir = i === mapW - 1 ? -1 : 1;
    const _j = j === mapH - 1 ? j - 1 : j + 1,
        jDir = j === mapH - 1 ? -1 : 1;
    const n = terrainGradient(hMap, i, j, mapW, mapH);
    const ni = terrainGradient(hMap, _i, j, mapW, mapH);
    const nj = terrainGradient(hMap, i, _j, mapW, mapH);
    return cv((ni.x - n.x) * iDir, (nj.y - n.y) * jDir);
}
