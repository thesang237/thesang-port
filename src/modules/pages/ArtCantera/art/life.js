/** A lightweight living layer drawn over the finished print; source motion advances every 80ms. */
export function createLife(world, math) {
    let personHeight = 1.6;
    let silhouettes = [
        [
            -5, 89, -5, 96, -4, 98, -1, 100, 1, 100, 6, 96, 5, 89, 4, 86, 5, 85, 8, 85, 14, 78, 17, 61, 14, 60, 13, 59, 11, 47, 9, 43, 8, 10, 10, 3, 7, 0, 4, 0, 0, 30, 2, 7, 1, 1, -5, 1, -7, 1, -3, 6,
            -10, 43, -13, 58, -15, 61, -17, 66, -11, 81, -4, 85, -4, 86,
        ],
        [
            -2, 100, 3, 99, 5, 95, 5, 93, 6, 92, 5, 91, 5, 86, 2, 86, 0, 84, 4, 80, 10, 67, 10, 63, 8, 62, 6, 61, 10, 29, 6, 5, 12, 2, 12, 1, 11, 0, 0, 0, -2, 1, 2, 27, 2, 34, -4, 10, -1, 4, -2, 0,
            -7, 0, -9, 1, -9, 3, -7, 41, -12, 77, -11, 82, -6, 87, -5, 89, -8, 94, -6, 99, -3, 100,
        ],
        [1, 100, 5, 97, 5, 88, 12, 84, 15, 62, 7, 25, 7, 13, 5, 10, 4, 1, -5, 1, -6, 3, -6, 40, -9, 44, -11, 46, -12, 48, -15, 79, -10, 84, -8, 88, -6, 90, -6, 98, -2, 100],
        [
            1, 101, 6, 98, 6, 93, 5, 89, 5, 88, 14, 77, 14, 44, 11, 43, 6, 6, 7, 2, 7, 0, -2, -1, -2, 1, 0, 3, 1, 4, 1, 35, -1, 40, -3, 1, -4, 0, -14, -1, -14, 1, -11, 2, -10, 4, -11, 58, -11, 63,
            -12, 64, -13, 67, -6, 84, -3, 86, -4, 87, -6, 88, -6, 97, -4, 100,
        ],
        [
            -6, 98, -8, 86, -13, 80, -13, 64, -12, 63, -9, 10, -11, 2, -11, 1, -4, 0, -5, 9, -1, 41, 4, 6, 3, 3, 3, 0, 12, 0, 12, 2, 8, 8, 10, 48, 13, 50, 12, 56, 8, 63, 13, 64, 13, 73, 8, 87, 6, 88,
            5, 97, 3, 99, -2, 100,
        ],
        [
            5, 89, 5, 96, 3, 100, -2, 99, -5, 98, -5, 95, -5, 87, -14, 81, -18, 68, -16, 65, -14, 62, -11, 62, -12, 49, -9, 25, -10, 6, -15, 1, -14, 0, -4, 1, -5, 4, -4, 6, -4, 8, 0, 44, 1, 44, 3, 2,
            4, 1, 10, 1, 11, 6, 10, 8, 11, 63, 13, 63, 18, 66, 15, 81, 5, 88,
        ],
        [
            -3, 98, -1, 100, 5, 100, 6, 97, 6, 88, 7, 86, 7, 85, 10, 82, 11, 47, 9, 43, 10, 6, 11, 3, 11, 1, -10, 1, -11, 3, -4, 7, -9, 62, -11, 67, -6, 79, -2, 82, -1, 84, -1, 85, -2, 87, -4, 87, -4,
            95,
        ],
    ];
    let random = new math.LocalRandom(1);
    let flocks = [];
    let skipRates = [];
    let people = [];
    function placePeople(block, subdivisions, pixelScale, width, height) {
        if (block.isEmpty && block.roof) {
            for (let ix = 0; ix < subdivisions; ix++)
                for (let iy = 0; iy < subdivisions; iy++)
                    for (let attempt = 0; attempt < 10; attempt++) {
                        let x = block.x0 + ((0.2 + 0.6 * random.next()) * (block.x1 - block.x0)) / subdivisions + (ix * (block.x1 - block.x0)) / subdivisions;
                        let y = block.y0 + ((0.2 + 0.6 * random.next()) * (block.y1 - block.y0)) / subdivisions + (iy * (block.y1 - block.y0)) / subdivisions;
                        let z = block.z0 + 0.1;
                        let headZ = block.z0 + 1.92 + 0.1;
                        let halfWidthX = (world.camera.planeX[0] * personHeight) / 4;
                        let halfWidthY = (world.camera.planeX[1] * personHeight) / 4;
                        let person = new Person(x, y, z, 0.02 * (0.5 + 0.5 * random.next()));
                        let footLeft = new Person(x - halfWidthX, y - halfWidthY, z, 0);
                        let footRight = new Person(x + halfWidthX, y + halfWidthY, z, 0);
                        let headLeft = new Person(x - halfWidthX, y - halfWidthY, headZ, 0);
                        let headRight = new Person(x + halfWidthX, y + halfWidthY, headZ, 0);
                        if (
                            (person.updateVisibility(pixelScale, width, height),
                            footLeft.updateVisibility(pixelScale, width, height),
                            footRight.updateVisibility(pixelScale, width, height),
                            headLeft.updateVisibility(pixelScale, width, height),
                            headRight.updateVisibility(pixelScale, width, height),
                            person.updateColor((footLeft.brightness + footRight.brightness + headRight.brightness + headLeft.brightness) / 4),
                            person.visible && footLeft.visible && footRight.visible && headRight.visible && headLeft.visible)
                        ) {
                            if (person.random.next() > 0.1 + 0.4 * person.brightness) {
                                people.push(person);
                            }
                            break;
                        }
                    }
        }
    }
    class LivingMark {
        constructor(x, y, z) {
            this.moving = true;
            this.firstFrame = true;
            this.position = [x, y, z];
            this.renderPosition = [x, y, z];
            this.screenPosition = [0, 0, 0];
            this.random = new math.LocalRandom(Math.round(1000 * random.next()));
            this.speed = 0.25 + 1.5 * this.random.next();
            this.brightness = 0;
            this.targetBrightness = 0;
            this.opacity = 0;
            let colorRoll = this.random.next();
            this.color = [255, 255, 255];
            if (colorRoll < 0.4) {
                this.color = world.cutColor;
            } else {
                if (colorRoll < 0.6) {
                    this.color = [1.75 * world.terrainColor[0], 1.75 * world.terrainColor[1], 1.75 * world.terrainColor[2]];
                }
            }
            this.visible = false;
            this.blockedFrames = 0;
            this.isolatedFrames = 0;
        }
        updateVisibility(pixelScale, width, height) {
            this.screenPosition = world.camera.project(this.renderPosition, pixelScale, width, height);
            let distanceFade = 1 - 0.33 * Math.max(0, Math.min(1, (this.screenPosition[2] - 400) / 350));
            if (
                ((this.visible = !math.isFrame(this.screenPosition[0], this.screenPosition[1], width, height, pixelScale, 0.5) && math.isVisible(this.screenPosition, width, height)),
                (this.random.next() < 0.05 && this.moving) || this.firstFrame)
            ) {
                world.traceStep = world.cellSize / 2;
                let jitter = this.moving ? 1 : 0;
                let shadowHit = math.trace(
                    this.renderPosition,
                    math.rotateXZ(world.light[0], world.light[1], world.light[2], 0.2 * jitter * (this.random.next() - 0.5), 0.15 * jitter * (this.random.next() - 0.5)),
                    0.2 * world.extent,
                    true,
                    true,
                );
                let light = null == shadowHit ? 1 : Math.min(1, shadowHit[0] / (0.2 * world.extent));
                this.targetBrightness = light * (this.moving ? 1.2 + 0.6 * this.random.next() : 1);
            }
            let targetOpacity = this.visible && this.blockedFrames < 0.5 && this.isolatedFrames < 30 ? 1 : 0;
            this.opacity = this.opacity + (targetOpacity - this.opacity) * (this.firstFrame ? 1 : 0.75);
            this.brightness = this.brightness + (this.targetBrightness * (0.5 + 0.5 * targetOpacity) - this.brightness) * (this.firstFrame ? 1 : 0.25);
            this.firstFrame = false;
            return distanceFade;
        }
    }
    class Person extends LivingMark {
        constructor(x, y, z, fadeSpeed) {
            super(x, y, z);
            this.fadeSpeed = fadeSpeed;
            this.silhouetteIndex = Math.max(0, Math.min(silhouettes.length - 1, Math.floor(0.999 * this.random.next() * silhouettes.length)));
            this.flip = this.random.next() > 0.5 ? 1.25 : -1.25;
            this.moving = false;
            this.age = 20 * this.random.next();
        }
        updateColor(brightness) {
            this.brightness = brightness;
            if (this.random.next() < 0.6 * this.brightness + 0.2) {
                this.color = [world.terrainColor[0] / 1.6, world.terrainColor[1] / 1.6, world.terrainColor[2] / 1.6];
            }
        }
        render(pixelScale, width, height) {
            this.age -= this.fadeSpeed;
            if (this.age <= 0) {
                this.age = 20;
            }
            let distanceFade = this.updateVisibility(pixelScale, width, height);
            let fade = 0.8 * Math.min(this.age, 10 - this.age, 0.5) * 2;
            if (fade > 0.01) {
                let screenScale = distanceFade / pixelScale;
                let shapeScale = 0.016 * screenScale;
                world.lifeContext.beginPath();
                world.lifeContext.moveTo(
                    this.screenPosition[0] + this.flip * shapeScale * silhouettes[this.silhouetteIndex][0],
                    this.screenPosition[1] - shapeScale * silhouettes[this.silhouetteIndex][1],
                );
                for (let pointIndex = 2; pointIndex < silhouettes[this.silhouetteIndex].length - 1; pointIndex += 2)
                    world.lifeContext.lineTo(
                        this.screenPosition[0] + this.flip * shapeScale * silhouettes[this.silhouetteIndex][pointIndex],
                        this.screenPosition[1] - shapeScale * silhouettes[this.silhouetteIndex][pointIndex + 1],
                    );
                world.lifeContext.closePath();
                let fill = world.lifeContext.createLinearGradient(this.screenPosition[0], this.screenPosition[1] - screenScale * personHeight, this.screenPosition[0], this.screenPosition[1]);
                fill.addColorStop(0, math.rgbaHex([this.color[0], this.color[1], this.color[2], 0.95 * fade]));
                fill.addColorStop(1, math.rgbaHex([this.color[0], this.color[1], this.color[2], 0.05 * fade]));
                let outline = world.lifeContext.createLinearGradient(this.screenPosition[0], this.screenPosition[1] - screenScale * personHeight, this.screenPosition[0], this.screenPosition[1]);
                outline.addColorStop(0, math.rgbaHex([0, 0, 0, 0.95 * fade]));
                outline.addColorStop(0.5, math.rgbaHex([0, 0, 0, 0.9 * fade]));
                outline.addColorStop(1, math.rgbaHex([0, 0, 0, 0.05 * fade]));
                world.lifeContext.lineWidth = 0.04 / pixelScale;
                world.lifeContext.strokeStyle = outline;
                for (let stroke = 0; stroke < 2; stroke++) world.lifeContext.stroke();
                world.lifeContext.fillStyle = fill;
                world.lifeContext.fill();
            }
        }
    }
    class Bird extends LivingMark {
        constructor(x, y, z) {
            super(x, y, z);
            this.neighbours = [];
            this.randomDirection();
            this.towards = [0, 1, 0];
            this.right = [1, 0, 0];
        }
        randomDirection() {
            this.forward = [0, 1, 0];
            let tilt = 2 * Math.PI * this.random.next() - Math.PI;
            let turn = 2 * Math.PI * this.random.next() - Math.PI;
            this.forward = math.rotateXZ(0, 1, 0, tilt, turn);
        }
        render(pixelScale, width, height) {
            let valid = false;
            for (let attempt = 0; attempt < 25; attempt++) {
                valid = true;
                let previous = [this.position[0], this.position[1], this.position[2]];
                if (
                    ((this.position = math.addVec(this.position, this.forward, 0.08 * this.speed * 4)),
                    ((this.position[2] > world.height / 1.4 && this.forward[2] > 0) ||
                        (this.position[0] > world.extent && this.forward[0] > 0) ||
                        (this.position[0] < 0 && this.forward[0] < 0) ||
                        (this.position[1] < 0 && this.forward[1] < 0) ||
                        (this.position[1] > world.extent && this.forward[1] > 0) ||
                        (this.position[2] < 0 && this.forward[2] < 0) ||
                        null != math.getBlock(this.position)) &&
                        ((valid = false), (this.position = previous), this.randomDirection()),
                    valid)
                ) {
                    this.blockedFrames = 0;
                    break;
                }
            }
            if (!valid) {
                this.blockedFrames++;
            }
            let velocity = [0.08 * (this.position[0] - this.renderPosition[0]), 0.08 * (this.position[1] - this.renderPosition[1]), 0.08 * (this.position[2] - this.renderPosition[2])];
            this.towards = math.lerp(this.towards, velocity, 0.8);
            this.renderPosition = math.addVec(this.renderPosition, this.towards, 1);
            let distanceFade = this.updateVisibility(pixelScale, width, height);
            if (this.opacity > 0.1) {
                let brightness = this.brightness * (1 + 0.45 * this.random.next());
                let color = math.rgbaHex([this.color[0] * brightness, this.color[1] * brightness, this.color[2] * brightness, this.opacity]);
                let forward = math.normalize(this.towards);
                let up = [0, 0, 1];
                let right = [1, 0, 0];
                if (Math.abs(forward[2]) > 0.999) {
                    forward = [0, 0, forward[2] > 0.5 ? 1 : -1];
                    right = [this.right[0], this.right[1], 0];
                    right = Math.sqrt(right[0] * right[0] + right[1] * right[1]) < 0.1 ? math.rotateXZ(1, 0, 0, 0, 2 * Math.PI * this.random.next()) : math.normalize(right);
                } else {
                    right = math.cross(forward, up);
                }
                this.right = right;
                up = math.cross(right, forward);
                let wingAngle = 0.65 * Math.PI * this.random.next() - 0.35;
                let tip = world.camera.project(math.addVec(this.renderPosition, forward, 0.36 * distanceFade), pixelScale, width, height);
                for (let side = -1; side < 1.2; side += 2) {
                    let wing = math.rotateZ(side, 0, 0, side * wingAngle);
                    let wingtip = world.camera.project(
                        math.addVec(this.renderPosition, math.normalize(math.addVec(math.addVec([0, 0, 0], right, wing[0]), up, wing[1])), 0.35 * distanceFade),
                        pixelScale,
                        width,
                        height,
                    );
                    world.lifeContext.fillStyle = color;
                    world.lifeContext.beginPath();
                    world.lifeContext.moveTo(this.screenPosition[0], this.screenPosition[1]);
                    world.lifeContext.lineTo(wingtip[0], wingtip[1]);
                    world.lifeContext.lineTo(tip[0], tip[1]);
                    world.lifeContext.strokeStyle = color;
                    world.lifeContext.lineWidth = 0.07 / pixelScale;
                    world.lifeContext.stroke();
                    world.lifeContext.fill();
                }
            }
        }
    }
    return {
        seedFlocks: function () {
            random = new math.LocalRandom(Math.round(1000 * world.random.next()));
            flocks = [];
            skipRates = [];
            for (let flockIndex = 0; flockIndex < 45; flockIndex++) {
                let flock = [];
                let minimum = 1;
                let range = 4;
                if (random.next() < 0.08) {
                    minimum = 8;
                    range = 14;
                }
                let count = minimum + Math.round(range * random.next());
                for (let attempt = 0; attempt < 150; attempt++) {
                    let x = Math.floor((random.next() * world.extent) / world.cellSize) * world.cellSize + world.cellSize / 2;
                    let y = Math.floor((random.next() * world.extent) / world.cellSize) * world.cellSize + world.cellSize / 2;
                    let z = Math.floor((random.next() * world.height * 0.5) / world.cellSize) * world.cellSize + world.cellSize / 2;
                    if (null == math.getBlock([x, y, z])) {
                        for (let birdIndex = 0; birdIndex < count; birdIndex++) flock.push(new Bird(x + 2 * random.next() - 1, y + 2 * random.next() - 1, z + 2 * random.next() - 1));
                        break;
                    }
                }
                if (0 != flock.length) {
                    flocks.push(flock);
                    skipRates.push(0.1 + 0.5 * random.next());
                }
            }
        },
        seedPeople: function (pixelScale, width, height) {
            people = [];
            for (let column of world.blocks) {
                for (let stack of column) {
                    for (let block of stack) {
                        try {
                            placePeople(block, 2, pixelScale, width, height);
                        } catch {
                            /* An optional silhouette may fail placement; skip this mark. */
                        }
                    }
                }
            }
            if (!(people.length < 1)) {
                people.sort(function (t, n) {
                    return t.renderPosition[2] - n.renderPosition[2];
                });
            }
        },
        render: function (pixelScale, width, height) {
            world.lifeContext.imageSmoothingEnabled = false;
            world.lifeContext.lineJoin = 'round';
            for (let index = 0, marks = people; index < marks.length; index++) {
                let person = marks[index];
                person.render(pixelScale, width, height);
            }
            for (let flockIndex = 0; flockIndex < flocks.length; flockIndex++) {
                let flock = flocks[flockIndex];
                for (let index = 0; index < flock.length; index++) {
                    flock[index].neighbours.splice(0, flock[index].neighbours.length);
                    if (0 == index && flock[index].random.next() < 0.005) {
                        flock[index].randomDirection();
                    }
                }
                for (let index = 0; index < flock.length; index++)
                    try {
                        let bird = flock[index];
                        let x = bird.position[0];
                        let y = bird.position[1];
                        let z = bird.position[2];
                        if (bird.blockedFrames > 5 || bird.isolatedFrames > 50) {
                            for (let neighbour of flock) {
                                if (!(neighbour.blockedFrames > 0 || neighbour.isolatedFrames > 10)) {
                                    bird.blockedFrames = 0;
                                    bird.isolatedFrames = 0;
                                    bird.position = [
                                        neighbour.position[0] + bird.random.next() + 0.01,
                                        neighbour.position[1] + bird.random.next() + 0.01,
                                        neighbour.position[2] + bird.random.next() + 0.01,
                                    ];
                                    break;
                                }
                            }
                        }
                        if (index >= flock.length - 1) {
                            continue;
                        }
                        for (let otherIndex = index + 1; otherIndex < flock.length; otherIndex++) {
                            if (bird.random.next() < skipRates[flockIndex]) {
                                continue;
                            }
                            let other = flock[otherIndex];
                            let otherX = other.position[0];
                            let otherY = other.position[1];
                            let otherZ = other.position[2];
                            let dx = Math.abs(x - otherX);
                            if (index > 0 && dx > 4) {
                                continue;
                            }
                            let dy = Math.abs(y - otherY);
                            if (index > 0 && dy > 4) {
                                continue;
                            }
                            let dz = Math.abs(z - otherZ);
                            if (index > 0 && dz > 4) {
                                continue;
                            }
                            let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                            if (!(index > 0 && distance > 4)) {
                                other.neighbours.push([index, distance]);
                                if (0 == index) {
                                    if (distance > 60) {
                                        other.isolatedFrames = Math.min(other.isolatedFrames + 1, 99999);
                                    } else {
                                        other.isolatedFrames = 0;
                                    }
                                }
                            }
                        }
                    } catch {
                        /* An optional silhouette may fail placement; skip this mark. */
                    }
                for (let bird of flock) {
                    try {
                        let cohesion = [0, 0, 0];
                        let separation = [0, 0, 0];
                        let firstNeighbour = true;
                        for (let neighbour of bird.neighbours) {
                            if (bird.random.next() < 0.25) {
                                bird.forward = math.lerp(bird.forward, flock[neighbour[0]].forward, 0.08);
                            }
                            let difference = [
                                flock[neighbour[0]].position[0] - bird.position[0],
                                flock[neighbour[0]].position[1] - bird.position[1],
                                flock[neighbour[0]].position[2] - bird.position[2],
                            ];
                            if (firstNeighbour || bird.random.next() < 0.25) {
                                cohesion = math.addVec(cohesion, difference, 0.33);
                            }
                            firstNeighbour = false;
                            let overlap = 3.5 - neighbour[1];
                            if (overlap > 0) {
                                separation = math.addVec(separation, math.normalize(difference), -overlap);
                            }
                        }
                        bird.forward = math.clamp(bird.forward, 3.3);
                        bird.forward = math.addVec(math.addVec(bird.forward, cohesion, 0.02), separation, 0.04);
                        bird.render(pixelScale, width, height);
                    } catch {
                        /* An optional silhouette may fail placement; skip this mark. */
                    }
                }
            }
        },
    };
}
