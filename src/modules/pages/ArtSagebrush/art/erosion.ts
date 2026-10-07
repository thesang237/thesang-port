import { abs, floor, lerp, max, min, round, sq, sqrt } from './math';
import { type createRandom } from './random';

/** Height fields are column-major: map[x][y]. Erosion mutates them in place.
 * This preserves the original stylised model (rounded start cell, asymmetric
 * erosion footprint and in-place softening), not a physical water simulation.
 */
export function sampleHeightAndGradient(mp: number[][], posX: number, posY: number): [number, number, number] {
    if (posX < 0 || posX >= mp.length - 1 || posY < 0 || posY >= mp[0].length - 1) return [0, 0, 0];
    const cx = floor(posX),
        cy = floor(posY);
    const x = posX - cx,
        y = posY - cy;
    const hNW = mp[cx][cy],
        hNE = mp[cx + 1][cy],
        hSW = mp[cx][cy + 1],
        hSE = mp[cx + 1][cy + 1];
    return [(hNE - hNW) * (1 - y) + (hSE - hSW) * y, (hSW - hNW) * (1 - x) + (hSE - hNE) * x, hNW * (1 - x) * (1 - y) + hNE * x * (1 - y) + hSW * (1 - x) * y + hSE * x * y];
}

export function erodeTerrain(mp: number[][], depMap: number[][], eroMap: number[][], nDrops: number, sedAmt: number, dropR: number, rng: ReturnType<typeof createRandom>) {
    const mapW = mp.length,
        mapH = mp[0].length;
    const length = rng.range(0.5, 2);
    const maxIter = round(60 * length);
    const inertia = 0.5,
        sedCapF = 4 * sedAmt * 10,
        minSedCap = 0.01;
    const depSpd = 0.6 * sedAmt,
        eroSpd = 0.6 * sedAmt,
        gravity = 4,
        evapSpd = 0.1 / length;

    for (let j = 0; j < nDrops; j++) {
        const r1 = rng.r01(),
            r2 = rng.r01();
        let px = rng.range(mapW - 1),
            py = rng.range(mapH - 1);
        let dx = 0,
            dy = 0,
            speed = 0,
            water = 1,
            sediment = 0;

        for (let i = 0; i < maxIter; i++) {
            const nx = round(px),
                ny = round(py);
            if (nx < 0 || ny < 0 || nx >= mapW - 1 || ny >= mapH - 1) break;
            const offX = abs(px - nx),
                offY = abs(py - ny);
            const [gx, gy, ht] = sampleHeightAndGradient(mp, nx, ny);
            if (isNaN(gx) || isNaN(gy) || isNaN(ht)) break;

            dx = dx * inertia - gx * (1 - inertia);
            dy = dy * inertia - gy * (1 - inertia);
            const dm = sqrt(dx * dx + dy * dy);
            if (dm === 0) break;
            dx /= dm;
            dy /= dm;
            px += dx;
            py += dy;
            if (px < 0 || px >= mapW - 1 || py < 0 || py >= mapH - 1) break;

            const newHt = sampleHeightAndGradient(mp, px, py)[2];
            if (isNaN(newHt)) break;
            const dHt = newHt - ht;
            const sedCap = max(-dHt * speed * water * sedCapF, minSedCap);

            if (sediment > sedCap || dHt > 0) {
                const dep = dHt > 0 ? min(dHt, sediment) : (sediment - sedCap) * depSpd * depMap[nx][ny];
                sediment -= dep;
                const c1 = (1 - offX) * (1 - offY),
                    c2 = offX * (1 - offY),
                    c3 = (1 - offX) * offY,
                    c4 = offX * offY;
                mp[nx][ny] += dep * c1;
                mp[nx + 1][ny] += dep * c2;
                mp[nx][ny + 1] += dep * c3;
                mp[nx + 1][ny + 1] += dep * c4;
            } else {
                for (let m = 0; m <= dropR; m++) {
                    for (let k = 0; k <= dropR; k++) {
                        const inf = 1 / sq(dropR + 1);
                        const _nx = nx + (r1 < 0.5 ? -m : m);
                        const _ny = ny + (r2 < 0.5 ? -k : k);
                        if (_nx < 0 || _ny < 0 || _nx >= mapW - 1 || _ny >= mapH - 1) break;
                        const eroAmt = min((sedCap - sediment) * eroSpd, -dHt) * eroMap[_nx][_ny] * inf;
                        const ds = min(mp[_nx][_ny], eroAmt);
                        mp[_nx][_ny] -= ds;
                        sediment += ds;
                    }
                }
            }
            speed = sqrt(speed * speed + abs(dHt) * gravity);
            water *= 1 - evapSpd;
            if (water < 0.0001) break;
        }
    }
}

export function softenTerrain(mp: number[][], it: number, strength: number) {
    for (let k = 0; k < it; k++) {
        for (let i = 0; i < mp.length; i++) {
            for (let j = 0; j < mp[0].length; j++) {
                let sum = mp[i][j],
                    count = 1;
                if (i > 0) {
                    sum += mp[i - 1][j];
                    count++;
                    if (j > 0) {
                        sum += mp[i - 1][j - 1];
                        count++;
                    }
                    if (j < mp[0].length - 1) {
                        sum += mp[i - 1][j + 1];
                        count++;
                    }
                }
                if (i < mp.length - 1) {
                    sum += mp[i + 1][j];
                    count++;
                    if (j > 0) {
                        sum += mp[i + 1][j - 1];
                        count++;
                    }
                    if (j < mp[0].length - 1) {
                        sum += mp[i + 1][j + 1];
                        count++;
                    }
                }
                mp[i][j] = lerp(mp[i][j], sum / count, strength);
            }
        }
    }
}
