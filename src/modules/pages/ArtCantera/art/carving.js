/** A network of axis-aligned segments and junction bounds defines the removed volumes. */
export function createCarving(world, math) {
    let random = new math.LocalRandom(0);
    let cuts = [];
    let junctions = [];
    class CutSegment {
        constructor(x, y, z, spacingX, spacingY, spacingZ, alongX, alongY, alongZ) {
            this.start = [x, y, z];
            this.end = [x + alongX * spacingX, y + alongY * spacingY, z + alongZ * spacingZ];
            this.axis = [alongX, alongY, alongZ];
            this.startIndex = [Math.round(this.start[0] / spacingX), Math.round(this.start[1] / spacingY), Math.round((this.start[2] + world.baseDepth) / spacingZ)];
            this.endIndex = [Math.round(this.end[0] / spacingX), Math.round(this.end[1] / spacingY), Math.round((this.end[2] + world.baseDepth) / spacingZ)];
        }
        alter(dx, dy, dz, startShift, endShift) {
            this.start[0] += dx * world.cellSize + startShift * world.cellSize * this.axis[0];
            this.start[1] += dy * world.cellSize + startShift * world.cellSize * this.axis[1];
            this.start[2] += dz * world.cellSize + startShift * world.cellSize * this.axis[2];
            this.end[0] += dx * world.cellSize + endShift * world.cellSize * this.axis[0];
            this.end[1] += dy * world.cellSize + endShift * world.cellSize * this.axis[1];
            this.end[2] += dz * world.cellSize + endShift * world.cellSize * this.axis[2];
            this.update();
        }
        update() {
            appendJunction(this.startIndex, this.start);
            appendJunction(this.endIndex, this.end);
        }
        offsetCopy(axisRoll, offset) {
            let axis = [0, 0, 0];
            axis = this.axis[0] > 0.5 ? (axisRoll < 0.5 ? [0, 1, 0] : [0, 0, 1]) : this.axis[1] > 0.5 ? (axisRoll < 0.5 ? [1, 0, 0] : [0, 0, 1]) : axisRoll < 0.5 ? [0, 1, 0] : [1, 0, 0];
            let copy = new CutSegment(
                this.start[0] + axis[0] * offset * world.cellSize,
                this.start[1] + axis[1] * offset * world.cellSize,
                this.start[2] + axis[2] * offset * world.cellSize,
                this.end[0] - this.start[0],
                this.end[1] - this.start[1],
                this.end[2] - this.start[2],
                this.axis[0],
                this.axis[1],
                this.axis[2],
            );
            copy.startIndex = this.startIndex;
            copy.endIndex = this.endIndex;
            return copy;
        }
        clear() {
            new CutBounds(this.start[0], this.end[0], this.start[1], this.end[1], this.start[2], this.end[2]).clear();
        }
    }
    function appendJunction(index, point) {
        if (
            3 == index.length &&
            !(index[0] < 0 || index[1] < 0 || index[2] < 0 || index[0] >= junctions.length || index[1] >= junctions[index[0]].length || index[2] >= junctions[index[0]][index[1]].length)
        ) {
            try {
                junctions[index[0]][index[1]][index[2]].append(point);
            } catch {
                /* Offset endpoints may leave the carving grid; ignore that junction. */
            }
        }
    }
    class Junction {
        constructor() {
            this.box = null;
        }
        append(point) {
            if (null != this.box) {
                this.box.append(point);
            } else {
                this.box = new CutBounds(point[0], point[0], point[1], point[1], point[2], point[2]);
            }
        }
        clear() {
            if (null != this.box) {
                this.box.clear();
            }
        }
    }
    class CutBounds {
        constructor(x0, x1, y0, y1, z0, z1) {
            this.boundsX = [x0, x1];
            this.boundsY = [y0, y1];
            this.boundsZ = [z0, z1];
        }
        clear() {
            for (let x = this.boundsX[0]; x < this.boundsX[1] + 0.1; x += world.cellSize)
                for (let y = this.boundsY[0]; y < this.boundsY[1] + 0.1; y += world.cellSize)
                    for (let z = this.boundsZ[0]; z < this.boundsZ[1] + 0.1; z += world.cellSize) {
                        let block = math.getBlock([x + 0.1, y + 0.1, z + 0.1]);
                        if (null != block) {
                            block.isEmpty = true;
                        }
                    }
        }
        append(point) {
            this.boundsX[0] = Math.min(this.boundsX[0], point[0]);
            this.boundsY[0] = Math.min(this.boundsY[0], point[1]);
            this.boundsZ[0] = Math.min(this.boundsZ[0], point[2]);
            this.boundsX[1] = Math.max(this.boundsX[1], point[0]);
            this.boundsY[1] = Math.max(this.boundsY[1], point[1]);
            this.boundsZ[1] = Math.max(this.boundsZ[1], point[2]);
        }
    }
    return {
        grow: function (spacing) {
            let offsetX = 0;
            let offsetY = 0;
            let bestScore = 9999;
            for (let x = -world.extent / 2; x < world.extent / 2; x += 16)
                for (let y = -world.extent / 2; y < world.extent / 2; y += 16) {
                    let score = 0;
                    for (let dx = -32; dx < 33; dx += 16)
                        for (let dy = -32; dy < 33; dy += 16)
                            for (let dz = -16; dz < 17; dz += 16) score += Math.abs(math.noise(x + world.extent / 2 + dx, y + world.extent / 2 + dy, world.height / 2 + dz, 0.012));
                    if (score < bestScore) {
                        bestScore = score;
                        offsetX = x;
                        offsetY = y;
                    }
                }
            random = new math.LocalRandom(Math.round(1000 * world.random.next()));
            junctions = [];
            cuts = [];
            for (let x = 0; x < world.extent; x += spacing[0]) {
                let column = [];
                for (let y = 0; y < world.extent; y += spacing[1]) {
                    let stack = [];
                    for (let z = -world.baseDepth; z < world.height; z += spacing[2]) {
                        stack.push(new Junction());
                        if (!(Math.abs(math.noise(x + offsetX, y + offsetY, z, 0.012)) > (world.alternateTerrain && world.carved && !world.flattenEdges ? 0.4 : 0.6))) {
                            if (random.next() < 0.72) {
                                cuts.push(new CutSegment(x, y, z, spacing[0], spacing[1], spacing[2], 1, 0, 0));
                            }
                            if (random.next() < 0.72) {
                                cuts.push(new CutSegment(x, y, z, spacing[0], spacing[1], spacing[2], 0, 1, 0));
                            }
                            if (random.next() < 0.82) {
                                cuts.push(new CutSegment(x, y, z, spacing[0], spacing[1], spacing[2], 0, 0, 1));
                            }
                        }
                    }
                    column.push(stack);
                }
                junctions.push(column);
            }
            let copies = [];
            for (let index = 0, segments = cuts; index < segments.length; index++) {
                let cut = segments[index];
                cut.alter(
                    Math.round(3 * random.next() - 1),
                    Math.round(3 * random.next() - 1),
                    Math.round(3 * random.next() - 1),
                    Math.round(2 * random.next() - 1),
                    Math.round(2 * random.next() - 1),
                );
                let axisRoll = random.next();
                let offset = Math.round(2 * random.next() - 1);
                if (Math.abs(offset) > 0.2 && random.next() < 0.67) {
                    copies.push(cut.offsetCopy(axisRoll, offset));
                }
            }
            for (let copyIndex = 0, newCuts = copies; copyIndex < newCuts.length; copyIndex++) {
                let copy = newCuts[copyIndex];
                cuts.push(copy);
            }
        },
        clear: function () {
            for (const column of junctions) for (const stack of column) for (const junction of stack) junction.clear();
            for (const cut of cuts) cut.clear();
        },
    };
}
