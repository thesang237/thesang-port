/** The print medium: jittered light, distance fog, procedural windows, grooves and stone grain. */
export function createSurfaceRenderer(world, math) {
    let random = new math.LocalRandom(0);
    function frameMark(x, y, width, height, pixelScale, lineWidth) {
        if (
            (x * pixelScale + lineWidth > world.frame - pixelScale && x * pixelScale - lineWidth < world.frame - pixelScale) ||
            (y * pixelScale + lineWidth > world.frame - pixelScale && y * pixelScale - lineWidth < world.frame - pixelScale) ||
            (x * pixelScale + lineWidth > width * pixelScale - world.frame && x * pixelScale - lineWidth < width * pixelScale - world.frame) ||
            (y * pixelScale + lineWidth > height * pixelScale - world.frame && y * pixelScale - lineWidth < height * pixelScale - world.frame)
        ) {
            return 0.1 + 0.4 * random.next();
        } else {
            return 0;
        }
    }
    function needsStripes(hit, brightness) {
        if (3 == hit[3]) {
            return brightness < 0.5 || brightness > 1.1;
        } else {
            if (hit[3] == (world.stripeAxis > 0.5 ? 2 : 1)) {
                return brightness < 0.6 || brightness > 1.1;
            } else {
                return 0 == hit[3] && 2 * hit[5] < hit[2] / world.height - 0.1;
            }
        }
    }
    function groove(position, period, width) {
        let remainder = position % period;
        if (remainder < width || remainder > period - width) {
            return 0.1 + 0.35 * random.next();
        } else {
            return 0;
        }
    }
    function gridMark(hit, period, width) {
        if (0 == hit[3] || 3 == hit[3]) {
            return Math.max(groove(hit[0], period, width), groove(hit[1], period, width));
        } else {
            return 0;
        }
    }
    function windowMark(hit, jitter) {
        if (0 == hit[3] || 3 == hit[3]) {
            return 0;
        }
        let cellX = Math.floor((hit[0] + 0.1) / world.cellSize);
        let cellY = Math.floor((hit[1] + 0.1) / world.cellSize);
        let cellZ = Math.floor((hit[2] + 0.1 + world.baseDepth) / world.cellSize);
        let spacing = 1 + 0.6 * Math.round(0.5 + 0.5 * math.noise(cellX, cellY, cellZ, 0.23));
        let wallU = hit[0] + 100 * hit[1];
        let wallV = hit[2] + world.baseDepth;
        if (1 == hit[3]) {
            wallU = 100 * hit[0] + hit[1] + 100 * world.cellSize;
        }
        let u = (wallU + 0.4 * jitter * (random.next() - 0.5)) % spacing;
        let v = (wallV + 0.4 * jitter * (random.next() - 0.5)) % 2;
        let column = Math.floor(wallU / spacing);
        let row = Math.floor(wallV / 2);
        if (v + hit[5] < 3) {
            return 0;
        }
        let marginX = 1.2 * (0.12 + 0.12 * Math.round(0.5 + 0.5 * math.noise(column, row, 0, 1.3)));
        let marginY = 0.25 + 0.4 * Math.round(0.5 + 0.5 * math.noise(column, row, 77, 0.73));
        if (u < marginX) {
            return 0;
        }
        if (u > spacing - marginX) {
            return 0;
        }
        if (v < marginY) {
            return 0;
        }
        if (v > 1.5) {
            return 0;
        }
        if (math.noise(column, row, 11, 6.73) < 0.15) {
            return 0;
        }
        return (math.noise(column, row, -11, 4.73) > 0.4 ? 1 : -0.75) * (0.6 + (0.3 * Math.round(0.5 + 0.5 * math.noise(column, row, -111, 7.73))) / 2) * (0.5 + 0.5 * random.next());
    }
    function stoneGrain(hit, face) {
        let x = Math.floor(2 * hit[0]);
        let y = Math.floor(2 * hit[1]);
        let z = Math.floor(2 * (hit[2] + world.baseDepth));
        let crossU = 0;
        let crossV = 0;
        let along = 0;
        if (0 == face || 3 == face) {
            if (world.roofGrainAxis > 0.5) {
                along = hit[0];
                crossU = z;
                crossV = y;
            } else {
                along = hit[1];
                crossU = x;
                crossV = z;
            }
        } else {
            if (2 == face) {
                if (world.wallGrainAxis > 0.5) {
                    along = hit[0];
                    crossU = y;
                    crossV = z;
                } else {
                    along = hit[2];
                    crossU = x;
                    crossV = y;
                }
            } else {
                if (world.wallGrainAxis > 0.5) {
                    along = hit[1];
                    crossU = z;
                    crossV = x;
                } else {
                    along = hit[2];
                    crossU = y;
                    crossV = x;
                }
            }
        }
        return random.next() - 0.5 + 0.15 * Math.sin(0.125 * along + 3 * Math.floor(0.2 * along * math.noise(crossU, crossV, 0, 2134.567)) + 122 * math.noise(crossU, 0, crossV, 2134.567));
    }
    return {
        renderLight: function (pass, rayLength, pixelScale, width, height) {
            if (0 == pass) {
                world.paintContext.fillStyle = '#000000';
                world.paintContext.fillRect(-10, -10, width + 20, height + 20);
            }
            let evenColumns = Math.floor(pass / 2) % 2 == 0;
            let evenRows = (pass % 2) % 2 == 0;
            random = new math.LocalRandom(pass);
            let sampleCount = Math.floor(pass / 4);
            let up = world.camera.planeY;
            let right = world.camera.planeX;
            let direction = world.camera.direction();
            let fragmentHeight = Math.max(10, Math.round(1000000 / width));
            let fragments = Math.ceil(height / fragmentHeight);
            let processedRows = 0;
            let remainingRows = height;
            let halfWidth = Math.round(width / 2);
            let left = -halfWidth;
            let halfHeight = Math.round(height / 2);
            for (let fragment = 0; fragment < fragments; fragment++) {
                let rows = Math.min(fragmentHeight, remainingRows);
                processedRows += rows;
                remainingRows -= rows;
                let image = world.paintContext.getImageData(0, remainingRows, width, rows);
                let pixels = image.data;
                let bottom = -halfHeight + processedRows - rows;
                let top = -halfHeight + processedRows;
                for (let screenX = left; screenX < halfWidth; screenX++) {
                    let pixelX = screenX + halfWidth;
                    if ((!evenColumns || pixelX % 2 != 1) && (evenColumns || pixelX % 2 != 0)) {
                        for (let screenY = bottom; screenY < top; screenY++) {
                            let pixelY = screenY + halfHeight;
                            if (evenRows && pixelY % 2 == 1) {
                                continue;
                            }
                            if (!evenRows && pixelY % 2 == 0) {
                                continue;
                            }
                            let origin = math.addVec(world.camera.planeO, right, pixelScale * (screenX + random.next()));
                            origin = math.addVec(origin, up, world.squeeze * pixelScale * (screenY + random.next()));
                            let indices = math.pixelIndices(pixelX, pixelY, width, height, remainingRows);
                            let previousColor = [pixels[indices[0]], pixels[indices[1]], pixels[indices[2]]];
                            let color = [0, 0, 0];
                            world.traceStep = 1;
                            let hit = math.trace(origin, direction, rayLength, false, false);
                            let inFrame = math.isFrame(pixelX, pixelY, width, height, pixelScale, 0);
                            if (null == hit || inFrame) {
                                let groundHit = math.rayPlane([0, 0, -world.baseDepth], [0, 0, 1], origin, direction);
                                if (groundHit[3]) {
                                    hit = [groundHit[0], groundHit[1], groundHit[2], 3, inFrame ? 500 : groundHit[4], 200];
                                }
                            }
                            if (null != hit) {
                                let shadowOrigin = [0, 0, 0];
                                shadowOrigin =
                                    0 == hit[3]
                                        ? math.addVec(hit, [0, 0, 1], 0.045 * world.cellSize * random.next() + 0.05)
                                        : math.addVec(hit, direction, -0.02 * world.cellSize * random.next() - 0.02);
                                let brightness = 0;
                                world.depthMap.writeNormalized(inFrame ? 0 : hit[4], pixelX / width, pixelY / height);
                                let fog = 0.2 * (inFrame ? 0 : 1 - (hit[2] + world.baseDepth + 12) / (world.baseDepth + world.height + 25)) + 0.9 * Math.min(1, Math.max(0, hit[4] - 410) / 370);
                                world.traceStep = 8;
                                for (let shadowSample = 0; shadowSample < 2; shadowSample++)
                                    if (random.next() > 0.2 + 0.8 * fog && !inFrame) {
                                        let shadowHit = math.trace(
                                            shadowOrigin,
                                            math.rotateXZ(world.light[0], world.light[1], world.light[2], 0.2 * (random.next() - 0.5), 0.15 * (random.next() - 0.5)),
                                            0.2 * world.extent,
                                            true,
                                            true,
                                        );
                                        brightness += null != shadowHit ? (1.25 * Math.min(1, shadowHit[0] / (0.2 * world.extent)) + 0.125) / 2 : 0.5675;
                                    } else {
                                        brightness += inFrame ? 0.75 - 0.4 * Math.pow(random.next(), 2) : 0.06 * random.next() + 0.12;
                                    }
                                if (!(inFrame || 3 != hit[3])) {
                                    brightness *= 1.1 + 0.2 * random.next();
                                }
                                brightness += windowMark(hit, 0.1 + 0.4 * fog) * (1.3 - 0.5 * fog);
                                if (!inFrame && needsStripes(hit, brightness)) {
                                    brightness -= 2 * groove(hit[world.stripeAxis > 0.5 ? 0 : 1], world.cellSize / 16, 0.08);
                                }
                                if (!inFrame && world.grid) {
                                    brightness -= gridMark(hit, world.cellSize, 0.125) * (world.smallGrid ? 0.5 : 1);
                                }
                                if (!inFrame && world.smallGrid) {
                                    brightness -= 0.8 * gridMark(hit, world.cellSize / 2, 0.125);
                                }
                                brightness -= 2 * frameMark(pixelX, pixelY, width, height, pixelScale, 0.125);
                                let grain = (1 - 0.2 * brightness) * stoneGrain(hit, hit[3]) * (1 - fog);
                                let tone = 0 == hit[3] ? 1.125 * (brightness + 0.125 + 0.3 * grain) : 1.125 * (brightness + 0.3 * grain);
                                if (0 == hit[3]) {
                                    tone = 1.22 * tone + (0.5 + random.next()) * hit[5];
                                }
                                if (!inFrame) {
                                    tone = 1.35 * tone - 0.1;
                                }
                                let pigment = [world.terrainColor[0], world.terrainColor[1], world.terrainColor[2]];
                                if (0 != hit[3]) {
                                    pigment = [world.cutColor[0], world.cutColor[1], world.cutColor[2]];
                                }
                                let fogBlend = inFrame ? 0.3 : fog / 1.5;
                                let fogColor = 3 == hit[3] ? 125 : 155;
                                pigment[0] += fogBlend * (fogColor - pigment[0]);
                                pigment[1] += fogBlend * (fogColor - pigment[1]);
                                pigment[2] += fogBlend * (fogColor - pigment[2]);
                                color = [pigment[0] * tone, pigment[1] * tone, pigment[2] * tone];
                            }
                            pixels[indices[0]] = (sampleCount * previousColor[0]) / (sampleCount + 1) + color[0] / (sampleCount + 1);
                            pixels[indices[1]] = (sampleCount * previousColor[1]) / (sampleCount + 1) + color[1] / (sampleCount + 1);
                            pixels[indices[2]] = (sampleCount * previousColor[2]) / (sampleCount + 1) + color[2] / (sampleCount + 1);
                        }
                    }
                }
                world.paintContext.putImageData(image, 0, remainingRows);
            }
        },
    };
}
