/** Cells marry smooth terrain with hard cuts. Face ids: 0 terrain, 1/2 walls, 3 horizontal cut. */
export function createBlockTools(world, math) {
    return {
        Block: class Block {
            constructor(x, y, z, size) {
                this.x0 = x;
                this.x1 = x + size;
                this.y0 = y;
                this.y1 = y + size;
                this.z0 = z;
                this.z1 = z + size;
                this.detailRandom = new math.LocalRandom(Math.round(1000 * (1 + math.noise(x, y, z, 77.072))));
                this.isEmpty = false;
                this.isThin = false;
                this.isFlat = false;
                this.isTip = false;
                this.contX = false;
                this.contY = false;
                this.contZ = false;
                this.terrain = world.carved ? Math.round(0.5 * math.noise(x, y, 0, 0.02) + 0.5) : 0;
                this.hasTerrain = false;
                this.visited = false;
                this.winX = false;
                this.winY = false;
                this.roof = false;
            }
            unvisitedNeighbours() {
                let neighbours = [];
                let left = math.getBlock([this.x0 + 0.1 - world.cellSize, this.y0 + 0.1, this.z0 + 0.1]);
                let right = math.getBlock([this.x0 + 0.1 + world.cellSize, this.y0 + 0.1, this.z0 + 0.1]);
                let front = math.getBlock([this.x0 + 0.1, this.y0 + 0.1 - world.cellSize, this.z0 + 0.1]);
                let back = math.getBlock([this.x0 + 0.1, this.y0 + 0.1 + world.cellSize, this.z0 + 0.1]);
                let below = math.getBlock([this.x0 + 0.1, this.y0 + 0.1, this.z0 + 0.1 - world.cellSize]);
                let above = math.getBlock([this.x0 + 0.1, this.y0 + 0.1, this.z0 + 0.1 + world.cellSize]);
                if (!(null == left || left.visited || (this.hasTerrain && left.terrain != this.terrain))) {
                    neighbours.push(left);
                }
                if (!(null == right || right.visited || (this.hasTerrain && right.terrain != this.terrain))) {
                    neighbours.push(right);
                }
                if (!(null == front || front.visited || (this.hasTerrain && front.terrain != this.terrain))) {
                    neighbours.push(front);
                }
                if (!(null == back || back.visited || (this.hasTerrain && back.terrain != this.terrain))) {
                    neighbours.push(back);
                }
                if (!(null == below || below.visited || below.isFlat || (below.hasTerrain && below.terrain != this.terrain))) {
                    neighbours.push(below);
                }
                if (!(null == above || above.visited || this.isFlat || (this.hasTerrain && above.terrain != this.terrain))) {
                    neighbours.push(above);
                }
                for (let index = 0, items = neighbours; index < items.length; index++) {
                    let block = items[index];
                    block.visited = true;
                }
                return neighbours;
            }
            resolveTerrain() {
                let wasCarved = this.isEmpty;
                this.isEmpty = true;
                let minimumHeight = world.cellSize;
                let maximumHeight = -1;
                let samples = 0;
                let coverage = 0;
                for (let dx = 0; dx < world.cellSize; dx += 0.35)
                    for (let dy = 0; dy < world.cellSize; dy += 0.35) {
                        samples++;
                        let height = world.landscape.evaluate(this.x0 + dx, this.y0 + dy, this) * world.height;
                        let relativeHeight = height - this.z0;
                        if (relativeHeight < minimumHeight) {
                            minimumHeight = relativeHeight;
                        }
                        if (maximumHeight < relativeHeight) {
                            maximumHeight = relativeHeight;
                        }
                        if (height <= this.z1) {
                            this.hasTerrain = true;
                        }
                        if (height > this.z0 - 0.02) {
                            coverage++;
                            this.isEmpty = false;
                        }
                    }
                if (samples > 0) {
                    coverage /= samples;
                }
                if (minimumHeight < 0.5 * world.cellSize || coverage < 0.5) {
                    this.isThin = true;
                }
                if (maximumHeight < world.cellSize) {
                    this.isFlat = true;
                }
                if ((maximumHeight < 0.25 * world.cellSize && minimumHeight < 0) || coverage < 0.3) {
                    this.isTip = true;
                }
                if (wasCarved && !this.isTip) {
                    this.isEmpty = true;
                }
            }
            intersect(entry, exit, shadowOnly, distanceBeforeCell) {
                let segmentLength = math.distance(entry, exit);
                let steps = Math.max(1, Math.round(segmentLength / world.traceStep));
                let previous = entry;
                let previousDepth = 0;
                for (let step = 0; step < steps + 0.1; step += 1) {
                    let progress = Math.min(step / steps, 1);
                    if (!shadowOnly && progress > 0.01 && progress < 0.99) {
                        progress = Math.max(0, Math.min(progress + (this.detailRandom.next() - 0.5) * (1 / steps), 1));
                    }
                    let point = math.lerp(entry, exit, progress);
                    let terrainDepth = world.landscape.evaluate(point[0], point[1], this) * world.height - point[2];
                    if (terrainDepth >= -0.1) {
                        if (shadowOnly) {
                            return [distanceBeforeCell + progress * segmentLength];
                        }
                        let face = step > 0 || terrainDepth < 0.125 * world.traceStep ? 0 : 3;
                        let onX = previous[0] <= this.x0 + 0.05;
                        let onY = previous[1] <= this.y0 + 0.05;
                        let onTop = previous[2] >= this.z1 - 0.05;
                        if (!(!onTop || !this.contZ || (onX && !this.contX) || (onY && !this.contY))) {
                            face = 0;
                        }
                        if (!(!onX || !this.contX || (onY && !this.contY) || (onTop && !this.contZ))) {
                            face = 0;
                        }
                        if (!(!onY || !this.contY || (onX && !this.contX) || (onTop && !this.contZ))) {
                            face = 0;
                        }
                        if (face > 0) {
                            if (onTop && (!onX || (onX && this.contX)) && (!onY || (onY && this.contY))) {
                                face = 3;
                            } else {
                                if (onX && (!onY || (onY && this.contY))) {
                                    face = 1;
                                } else {
                                    if (onY) {
                                        face = 2;
                                    }
                                }
                            }
                        }
                        let windowDepth = terrainDepth;
                        if ((onX && !this.winX && (windowDepth = -999), onY && !this.winY && (windowDepth = -999), step > 0.001)) {
                            let aboveSurface = Math.abs(previousDepth);
                            previous = math.lerp(previous, point, aboveSurface / Math.max(0.001, aboveSurface + terrainDepth));
                            previous[2] = world.landscape.evaluate(previous[0], previous[1], this) * world.height;
                        }
                        return [
                            previous[0],
                            previous[1],
                            previous[2],
                            face,
                            distanceBeforeCell + progress * segmentLength,
                            0 == face ? world.landscape.color(previous[0], previous[1], this) : windowDepth,
                        ];
                    }
                    previous = point;
                    previousDepth = terrainDepth;
                }
                return null;
            }
        },
        isContinuous: function (a, b) {
            return a.isEmpty == b.isEmpty && ((!a.hasTerrain && !b.hasTerrain) || a.terrain == b.terrain);
        },
    };
}
