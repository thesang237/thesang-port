// Original seeded 3D OpenSimplex kernel. Lookup tables are intentionally retained.
function advanceSeed(state) {
    let next = new Uint32Array(1);
    next[0] = 1664525 * state[0] + 1013904223;
    return next;
}
let squishConstant = (Math.sqrt(4) - 1) / 3;
let stretchConstant = (1 / Math.sqrt(4) - 1) / 3;
function createContribution(sum, cellX, cellY, cellZ) {
    return {
        dx: -cellX - sum * squishConstant,
        dy: -cellY - sum * squishConstant,
        dz: -cellZ - sum * squishConstant,
        xsb: cellX,
        ysb: cellY,
        zsb: cellZ,
    };
}
let basePatterns = [
    [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    [2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1, 3, 1, 1, 1],
    [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1],
];
let gradients = [
    -11, 4, 4, -4, 11, 4, -4, 4, 11, 11, 4, 4, 4, 11, 4, 4, 4, 11, -11, -4, 4, -4, -11, 4, -4, -4, 11, 11, -4, 4, 4, -11, 4, 4, -4, 11, -11, 4, -4, -4, 11, -4, -4, 4, -11, 11, 4, -4, 4, 11, -4, 4, 4,
    -11, -11, -4, -4, -4, -11, -4, -4, -4, -11, 11, -4, -4, 4, -11, -4, 4, -4, -11,
];
let lookupPairs = [
    0, 2, 1, 1, 2, 2, 5, 1, 6, 0, 7, 0, 32, 2, 34, 2, 129, 1, 133, 1, 160, 5, 161, 5, 518, 0, 519, 0, 546, 4, 550, 4, 645, 3, 647, 3, 672, 5, 673, 5, 674, 4, 677, 3, 678, 4, 679, 3, 680, 13, 681, 13,
    682, 12, 685, 14, 686, 12, 687, 14, 712, 20, 714, 18, 809, 21, 813, 23, 840, 20, 841, 21, 1198, 19, 1199, 22, 1226, 18, 1230, 19, 1325, 23, 1327, 22, 1352, 15, 1353, 17, 1354, 15, 1357, 17, 1358,
    16, 1359, 16, 1360, 11, 1361, 10, 1362, 11, 1365, 10, 1366, 9, 1367, 9, 1392, 11, 1394, 11, 1489, 10, 1493, 10, 1520, 8, 1521, 8, 1878, 9, 1879, 9, 1906, 7, 1910, 7, 2005, 6, 2007, 6, 2032, 8,
    2033, 8, 2034, 7, 2037, 6, 2038, 7, 2039, 6,
];
let contributionRecipes = [
    0, 0, 1, -1, 0, 0, 1, 0, -1, 0, 0, -1, 1, 0, 0, 0, 1, -1, 0, 0, -1, 0, 1, 0, 0, -1, 1, 0, 2, 1, 1, 0, 1, 1, 1, -1, 0, 2, 1, 0, 1, 1, 1, -1, 1, 0, 2, 0, 1, 1, 1, -1, 1, 1, 1, 3, 2, 1, 0, 3, 1, 2,
    0, 1, 3, 2, 0, 1, 3, 1, 0, 2, 1, 3, 0, 2, 1, 3, 0, 1, 2, 1, 1, 1, 0, 0, 2, 2, 0, 0, 1, 1, 0, 1, 0, 2, 0, 2, 0, 1, 1, 0, 0, 1, 2, 0, 0, 2, 2, 0, 0, 0, 0, 1, 1, -1, 1, 2, 0, 0, 0, 0, 1, -1, 1, 1, 2,
    0, 0, 0, 0, 1, 1, 1, -1, 2, 3, 1, 1, 1, 2, 0, 0, 2, 2, 3, 1, 1, 1, 2, 2, 0, 0, 2, 3, 1, 1, 1, 2, 0, 2, 0, 2, 1, 1, -1, 1, 2, 0, 0, 2, 2, 1, 1, -1, 1, 2, 2, 0, 0, 2, 1, -1, 1, 1, 2, 0, 0, 2, 2, 1,
    -1, 1, 1, 2, 0, 2, 0, 2, 1, 1, 1, -1, 2, 2, 0, 0, 2, 1, 1, 1, -1, 2, 0, 2, 0,
];
export function createNoise3D(seed) {
    let chains = [];
    for (let recipeIndex = 0; recipeIndex < contributionRecipes.length; recipeIndex += 9) {
        let pattern = basePatterns[contributionRecipes[recipeIndex]];
        let head = null;
        let tail = null;
        for (let patternIndex = 0; patternIndex < pattern.length; patternIndex += 4) {
            tail = createContribution(pattern[patternIndex], pattern[patternIndex + 1], pattern[patternIndex + 2], pattern[patternIndex + 3]);
            null === head ? (chains[recipeIndex / 9] = tail) : (head.next = tail);
            head = tail;
        }
        tail.next = createContribution(contributionRecipes[recipeIndex + 1], contributionRecipes[recipeIndex + 2], contributionRecipes[recipeIndex + 3], contributionRecipes[recipeIndex + 4]);
        tail.next.next = createContribution(contributionRecipes[recipeIndex + 5], contributionRecipes[recipeIndex + 6], contributionRecipes[recipeIndex + 7], contributionRecipes[recipeIndex + 8]);
    }
    let lookup = [];
    for (let pairIndex = 0; pairIndex < lookupPairs.length; pairIndex += 2) lookup[lookupPairs[pairIndex]] = chains[lookupPairs[pairIndex + 1]];
    let permutation = new Uint8Array(256);
    let gradientIndices = new Uint8Array(256);
    let source = new Uint8Array(256);
    for (let index = 0; index < 256; index++) source[index] = index;
    let state = new Uint32Array(1);
    state[0] = seed;
    state = advanceSeed(advanceSeed(advanceSeed(state)));
    for (let index = 255; index >= 0; index--) {
        state = advanceSeed(state);
        let selected = new Uint32Array(1);
        selected[0] = (state[0] + 31) % (index + 1);
        if (selected[0] < 0) {
            selected[0] += index + 1;
        }
        permutation[index] = source[selected[0]];
        gradientIndices[index] = (permutation[index] % 24) * 3;
        source[selected[0]] = source[index];
    }
    return function (x, y, z) {
        let stretch = (x + y + z) * stretchConstant;
        let stretchedX = x + stretch;
        let stretchedY = y + stretch;
        let stretchedZ = z + stretch;
        let cellX = Math.floor(stretchedX);
        let cellY = Math.floor(stretchedY);
        let cellZ = Math.floor(stretchedZ);
        let squish = (cellX + cellY + cellZ) * squishConstant;
        let localX = x - (cellX + squish);
        let localY = y - (cellY + squish);
        let localZ = z - (cellZ + squish);
        let fractionX = stretchedX - cellX;
        let fractionY = stretchedY - cellY;
        let fractionZ = stretchedZ - cellZ;
        let fractionSum = fractionX + fractionY + fractionZ;
        let value = 0;
        for (
            let contribution =
                lookup[
                    (fractionY - fractionZ + 1) |
                        ((fractionX - fractionY + 1) << 1) |
                        ((fractionX - fractionZ + 1) << 2) |
                        (fractionSum << 3) |
                        ((fractionSum + fractionZ) << 5) |
                        ((fractionSum + fractionY) << 7) |
                        ((fractionSum + fractionX) << 9)
                ];
            void 0 !== contribution;
            contribution = contribution.next
        ) {
            let dx = localX + contribution.dx;
            let dy = localY + contribution.dy;
            let dz = localZ + contribution.dz;
            let attenuation = 2 - dx * dx - dy * dy - dz * dz;
            if (attenuation > 0) {
                let gridX = cellX + contribution.xsb;
                let gridY = cellY + contribution.ysb;
                let gridZ = cellZ + contribution.zsb;
                let hashX = permutation[255 & gridX];
                let hashXY = permutation[(hashX + gridY) & 255];
                let gradient = gradientIndices[(hashXY + gridZ) & 255];
                value += attenuation * attenuation * attenuation * attenuation * (gradients[gradient] * dx + gradients[gradient + 1] * dy + gradients[gradient + 2] * dz);
            }
        }
        return 0.009708737864077669 * value;
    };
}
