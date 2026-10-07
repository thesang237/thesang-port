import { InkEllipse, InkLine, type InkStroke } from './brush';
import { abs, constrain, cv, lerp, mapRange, norm, PI, pow, round, TAU, vdot, type Vec, vnorm, vrot } from './math';
import { type Noise } from './noise';
import { type InkColor, withA } from './palette';
import { type createRandom } from './random';
import { NOISE_FREQUENCY } from './settings';
import { terrainGradient } from './terrain';

/** One plant grammar, shared by the landscape and botanical studies.
 * Appends to the supplied depth stack; all randomness comes from its caller. */
export function createPlantBuilders({
    rng,
    noise,
    shapes,
    treePaletteColor,
    lgt,
    hMap,
}: {
    rng: ReturnType<typeof createRandom>;
    noise: Noise;
    shapes: InkStroke[];
    treePaletteColor: (brightness: number) => InkColor;
    lgt: Vec;
    hMap: number[][];
}) {
    const mapW = hMap.length,
        mapH = hMap[0].length;
    const addTree = (x: number, y: number, z: number, lightValue: number, treeHt: number) => {
        const trunkWiggle = 2;
        const trunk = new InkLine(
            x + rng.range(-1, 1) * trunkWiggle,
            y + rng.range(-1, 1) * trunkWiggle,
            x + rng.range(-1, 1) * trunkWiggle,
            y - treeHt + rng.range(-1, 1) * trunkWiggle,
            0.5,
            0.2,
            noise,
        );
        trunk.setWeight(1.5);
        trunk.setMaxV(0.3);
        trunk.setAcc(0.02);
        trunk.setDensity(1);
        trunk.setWobble(0.2);
        trunk.setAngle(0);
        trunk.z = z;
        trunk.setColor(withA(treePaletteColor(rng.range(0.5)), 64));
        shapes.push(trunk);

        const nClumps = round(rng.range(4, 5));
        for (let j = 0; j < nClumps; j++) {
            const branchHt = rng.range(0.1, 1);
            const branchStartY = lerp(y, y - treeHt, branchHt);
            let co = cv(0, -rng.r01() * treeHt * 0.7 * mapRange(branchHt, 0.1, 1, 0.5, 0.8));
            co = vrot(co, (rng.range(-1, 1) * PI) / 2, 0, 0);
            co.y *= rng.range(1, 2);

            const branch = new InkLine(x, branchStartY, x + co.x, y - treeHt + co.y, 0.25, 0.1, noise);
            branch.setWeight(1.5);
            branch.setMaxV(0.3);
            branch.setAcc(0.02);
            branch.setDensity(1);
            branch.setWobble(0.2);
            branch.z = z;
            branch.setColor(withA(treePaletteColor(0), 64));
            shapes.push(branch);

            const nLeaves = round(rng.range(2, 20));
            for (let i = 0; i < nLeaves; i++) {
                const r = rng.range(2, 3) * mapRange(i, 0, nLeaves, 1.5, 1);
                const off = vrot(cv(rng.r01() * r * 1.8, 0), rng.r01() * TAU, 0, 0);
                const leaf = new InkEllipse(x + off.x + co.x, y - treeHt + off.y + co.y, 4, r * 2, rng.range(1, 1.1), false);
                leaf.z = z;
                leaf.setWeight(2.5);
                leaf.setMaxV(1);
                leaf.setAcc(0.02);
                leaf.setDensity(2);
                leaf.setWobble(0.2);
                leaf.setAngle((mapRange(noise(leaf.x * NOISE_FREQUENCY * 3, leaf.y * NOISE_FREQUENCY * 3), 0, 1, -1, 1) * PI) / 6);
                const normal = vnorm(cv(-co.x * 0.3 - off.x, co.y * 0.3 + off.y + 6));
                const br = constrain(pow(norm(vdot(normal, lgt), -1, 1), mapRange(lightValue, 0, 1, 8, 1)) + mapRange(lightValue, 0, 1, 0, 0.2) + rng.range(-1, 1) * 0.1, 0, 1);
                leaf.setColor(withA(treePaletteColor(br), 64));
                shapes.push(leaf);
            }
        }
    };

    const addBush = (x: number, y: number, z: number, lightValue: number, rockHt: number, mi: number, mj: number) => {
        const nrm = vnorm(terrainGradient(hMap, mi, mj, mapW, mapH));
        const nClumps = round(rng.range(4, 5));
        for (let j = 0; j < nClumps; j++) {
            let co = cv(0, -rng.r01() * rockHt * 0.1);
            co = vrot(co, (rng.range(-1, 1) * PI) / 2, 0, 0);
            co.y = -abs(co.y);
            const nRocks = round(rng.range(10, 20) * 0.4);
            for (let i = 0; i < nRocks; i++) {
                const r = rng.range(2, 3) * mapRange(i, 0, nRocks, 1.5, 1);
                const off = vrot(cv(rng.r01() * r * 1.5, 0), rng.r01() * TAU, 0, 0);
                off.y = -abs(off.y);
                const rock = new InkEllipse(x + off.x + co.x, y + off.y + co.y, r * 2, 4, rng.range(1, 1.1), false);
                rock.z = z;
                rock.setWeight(1.5);
                rock.setMaxV(1);
                rock.setAcc(0.02);
                rock.setDensity(2);
                rock.setWobble(0.2);
                const normal = vnorm(cv(-co.x * 0.3 - off.x, co.y * 0.3 + off.y + 6));
                const br = constrain(pow(norm(vdot(normal, lgt), -1, 1), mapRange(lightValue, 0, 1, 8, 1)) + mapRange(lightValue, 0, 1, 0, 0.2) + rng.range(-1, 1) * 0.4, 0, 1);
                rock.setColor(withA(treePaletteColor(br), 64));
                rock.setAngle(mapRange(nrm.x, 1, -1, 0, PI / 2) + PI / 4 + (round(rng.r01()) * 2 - 1) * PI + PI / 2 + mapRange(normal.x, -1, 1, 1, -1) * rng.range(PI / 4, PI / 8));
                shapes.push(rock);
            }
        }
    };

    return { addTree, addBush };
}
