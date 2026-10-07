/** Walk sorted grid-plane crossings, skip empty cells, then refine the first terrain or cut hit. */
import { addVec, channelHex, lerp, rayPlane, rotate2, rotateXZ, rotateZ } from './math.js';
import { LocalRandom } from './random.js';
export function createTracing(world) {
    let noise3D;
    function getBlock(point) {
        let x = Math.floor(point[0] / world.cellSize);
        if (x < 0 || x >= world.blocks.length) {
            return null;
        }
        let y = Math.floor(point[1] / world.cellSize);
        if (y < 0 || y >= world.blocks[x].length) {
            return null;
        }
        let z = Math.floor((point[2] + world.baseDepth) / world.cellSize);
        if (z < 0 || z >= world.blocks[x][y].length) {
            return null;
        }
        let block = world.blocks[x][y][z];
        if (block.isEmpty) {
            return null;
        } else {
            return block;
        }
    }
    function insideBounds(point, x0, x1, y0, y1, z0, z1) {
        return !(point[0] < x0 - 0.01) && !(point[1] < y0 - 0.01) && !(point[2] < z0 - 0.01) && !(point[0] > x1 + 0.01) && !(point[1] > y1 + 0.01) && !(point[2] > z1 + 0.01);
    }
    return {
        setNoise: function (fn) {
            noise3D = fn;
        },
        noise: function (x, y, z, scale) {
            return Math.round(1000 * noise3D(Math.round(1000 * scale * x) / 1000, Math.round(1000 * scale * y) / 1000, Math.round(1000 * scale * z) / 1000)) / 1000;
        },
        distance: function (a, b) {
            return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2) + Math.pow(b[2] - a[2], 2));
        },
        getBlock: getBlock,
        rayPlane: rayPlane,
        isVisible: function (point, width, height) {
            return world.depthMap.readNormalized(point[0] / width, (height - point[1]) / height) > point[2] - 0.1;
        },
        normalize: function (vector) {
            let x = vector[0];
            let y = vector[1];
            let z = vector[2];
            let length = Math.sqrt(x * x + y * y + z * z);
            if (length > 0.001) {
                x /= length;
                y /= length;
                z /= length;
                return [x, y, z];
            } else {
                return [0, 0, 0];
            }
        },
        clamp: function (vector, maximum) {
            let x = vector[0];
            let y = vector[1];
            let z = vector[2];
            let length = Math.sqrt(x * x + y * y + z * z);
            if (length > maximum) {
                x *= maximum / length;
                y *= maximum / length;
                z *= maximum / length;
                return [x, y, z];
            } else {
                return [x, y, z];
            }
        },
        cross: function (a, b) {
            return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        },
        lerp: lerp,
        isFrame: function (x, y, width, height, pixelScale, padding) {
            return (
                x * pixelScale < world.frame + padding - pixelScale ||
                y * pixelScale < world.frame + padding - pixelScale ||
                x * pixelScale >= width * pixelScale - world.frame - padding ||
                y * pixelScale >= height * pixelScale - world.frame - padding
            );
        },
        rotate2: rotate2,
        rotateZ: rotateZ,
        rotateXZ: rotateXZ,
        addVec: addVec,
        rgbaHex: function (color) {
            return '#' + channelHex(color[0]) + channelHex(color[1]) + channelHex(color[2]) + channelHex(255 * color[3]);
        },
        pixelIndices: function (x, y, width, height, fragmentY) {
            let index = 4 * width * (height - 1 - y - fragmentY) + 4 * x;
            return [index, index + 1, index + 2, index + 3];
        },
        trace: function (origin, direction, maximumDistance, includeOrigin, shadowOnly) {
            let boundX0 = 0;
            boundX0 =
                direction[0] >= 0
                    ? Math.max(Math.floor((origin[0] + 0.001) / world.cellSize) * world.cellSize, 0)
                    : Math.max(0, Math.floor((origin[0] + 0.001 - maximumDistance) / world.cellSize) * world.cellSize);
            let boundX1 = 0;
            if (
                ((boundX1 =
                    direction[0] <= 0
                        ? Math.min(Math.ceil((origin[0] - 0.001) / world.cellSize) * world.cellSize, world.extent)
                        : Math.min(world.extent, Math.ceil((origin[0] - 0.001 + maximumDistance) / world.cellSize) * world.cellSize)),
                boundX1 - boundX0 <= 0.001)
            ) {
                return null;
            }
            let boundY0 = 0;
            boundY0 =
                direction[1] >= 0
                    ? Math.max(Math.floor((origin[1] + 0.001) / world.cellSize) * world.cellSize, 0)
                    : Math.max(0, Math.floor((origin[1] + 0.001 - maximumDistance) / world.cellSize) * world.cellSize);
            let boundY1 = 0;
            if (
                ((boundY1 =
                    direction[1] <= 0
                        ? Math.min(Math.ceil((origin[1] - 0.001) / world.cellSize) * world.cellSize, world.extent)
                        : Math.min(world.extent, Math.ceil((origin[1] - 0.001 + maximumDistance) / world.cellSize) * world.cellSize)),
                boundY1 - boundY0 <= 0.001)
            ) {
                return null;
            }
            let boundZ0 = 0;
            boundZ0 =
                direction[2] >= 0
                    ? Math.max(Math.floor((origin[2] + 0.001) / world.cellSize) * world.cellSize, -world.baseDepth)
                    : Math.max(-world.baseDepth, Math.floor((origin[2] + 0.001 - maximumDistance) / world.cellSize) * world.cellSize);
            let boundZ1 = 0;
            if (
                ((boundZ1 =
                    direction[2] <= 0
                        ? Math.min(Math.ceil((origin[2] - 0.001) / world.cellSize) * world.cellSize, world.height)
                        : Math.min(world.height, Math.ceil((origin[2] - 0.001 + maximumDistance) / world.cellSize) * world.cellSize)),
                boundZ1 - boundZ0 <= 0.001)
            ) {
                return null;
            }
            let boundaryHits = [];
            if (includeOrigin) {
                boundaryHits.push([origin[0], origin[1], origin[2], true, -1]);
            }
            for (let yPlane = boundY0; yPlane < boundY1 + 1; yPlane += boundY1 - boundY0) {
                let hit = rayPlane([0, yPlane, 0], [0, -1, 0], origin, direction);
                if (hit[3]) {
                    if (!(hit[4] <= 0)) {
                        if (insideBounds(hit, boundX0, boundX1, boundY0, boundY1, boundZ0, boundZ1)) {
                            boundaryHits.push(hit);
                        }
                    }
                }
            }
            for (let xPlane = boundX0; xPlane < boundX1 + 1; xPlane += boundX1 - boundX0) {
                let hit = rayPlane([xPlane, 0, 0], [-1, 0, 0], origin, direction);
                if (hit[3]) {
                    if (!(hit[4] <= 0)) {
                        if (insideBounds(hit, boundX0, boundX1, boundY0, boundY1, boundZ0, boundZ1)) {
                            boundaryHits.push(hit);
                        }
                    }
                }
            }
            for (let zPlane = boundZ0; zPlane < boundZ1 + 1; zPlane += boundZ1 - boundZ0) {
                let hit = rayPlane([0, 0, zPlane], [0, 0, 1], origin, direction);
                if (hit[3]) {
                    if (!(hit[4] <= 0)) {
                        if (insideBounds(hit, boundX0, boundX1, boundY0, boundY1, boundZ0, boundZ1)) {
                            boundaryHits.push(hit);
                        }
                    }
                }
            }
            if (boundaryHits.length < 2) {
                return null;
            }
            let x0 = 9999;
            let x1 = -9999;
            let y0 = 9999;
            let y1 = -9999;
            let z0 = 9999;
            let z1 = -9999;
            for (let index = 0; index < boundaryHits.length; index++) {
                let x = boundaryHits[index][0];
                let y = boundaryHits[index][1];
                let z = boundaryHits[index][2];
                if (x0 > x) {
                    x0 = x;
                }
                if (y0 > y) {
                    y0 = y;
                }
                if (z0 > z) {
                    z0 = z;
                }
                if (x1 < x) {
                    x1 = x;
                }
                if (y1 < y) {
                    y1 = y;
                }
                if (z1 < z) {
                    z1 = z;
                }
            }
            x0 = Math.floor((x0 + 0.01) / world.cellSize) * world.cellSize;
            y0 = Math.floor((y0 + 0.01) / world.cellSize) * world.cellSize;
            z0 = Math.floor((z0 + 0.01) / world.cellSize) * world.cellSize;
            x1 = Math.ceil((x1 - 0.01) / world.cellSize) * world.cellSize;
            y1 = Math.ceil((y1 - 0.01) / world.cellSize) * world.cellSize;
            z1 = Math.ceil((z1 - 0.01) / world.cellSize) * world.cellSize;
            let crossings = [];
            for (let index = 0; index < boundaryHits.length; index++) crossings.push(boundaryHits[index]);
            for (let yPlane = y0; yPlane < y1 + 1; yPlane += world.cellSize) {
                if (yPlane == boundY0 || yPlane == boundY1) {
                    continue;
                }
                let hit = rayPlane([0, yPlane, 0], [0, -1, 0], origin, direction);
                if (hit[3]) {
                    if (!(hit[4] <= 0 || hit[4] > maximumDistance)) {
                        if (insideBounds(hit, x0, x1, y0, y1, z0, z1)) {
                            crossings.push(hit);
                        }
                    }
                }
            }
            for (let xPlane = x0; xPlane < x1 + 1; xPlane += world.cellSize) {
                if (xPlane == boundX0 || xPlane == boundX1) {
                    continue;
                }
                let hit = rayPlane([xPlane, 0, 0], [-1, 0, 0], origin, direction);
                if (hit[3]) {
                    if (!(hit[4] <= 0 || hit[4] > maximumDistance)) {
                        if (insideBounds(hit, x0, x1, y0, y1, z0, z1)) {
                            crossings.push(hit);
                        }
                    }
                }
            }
            for (let zPlane = z0; zPlane < z1 + 1; zPlane += world.cellSize) {
                if (zPlane == boundZ0 || zPlane == boundZ1) {
                    continue;
                }
                let hit = rayPlane([0, 0, zPlane], [0, 0, 1], origin, direction);
                if (hit[3]) {
                    if (!(hit[4] <= 0 || hit[4] > maximumDistance)) {
                        if (insideBounds(hit, x0, x1, y0, y1, z0, z1)) {
                            crossings.push(hit);
                        }
                    }
                }
            }
            if (crossings.length < 2) {
                return null;
            }
            crossings.sort(function (t, n) {
                return t[4] - n[4];
            });
            for (let index = 0; index < crossings.length - 1; index++) {
                let block = getBlock(lerp(crossings[index], crossings[index + 1], 0.5));
                if (null != block) {
                    let surfaceHit = block.intersect(crossings[index], crossings[index + 1], shadowOnly, crossings[index][4]);
                    if (null != surfaceHit) {
                        return surfaceHit;
                    }
                }
            }
            return null;
        },
        hasUnsupportedDiagonal: function (x, y, z, offset) {
            if (world.blocks[x + offset[0]][y + offset[1]][z + offset[2]].isEmpty) {
                return false;
            }
            for (let axis = 0; axis < offset.length; axis++) {
                let adjacent = [offset[0], offset[1], offset[2]];
                for (let otherAxis = 0; otherAxis < adjacent.length; otherAxis++)
                    if (axis != otherAxis) {
                        adjacent[otherAxis] = 0;
                    }
                if ((0 != adjacent[0] || 0 != adjacent[1] || 0 != adjacent[2]) && !world.blocks[x + adjacent[0]][y + adjacent[1]][z + adjacent[2]].isEmpty) {
                    return false;
                }
            }
            return true;
        },
        LocalRandom: LocalRandom,
    };
}
