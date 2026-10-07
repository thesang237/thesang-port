/** Two related surfaces: grow noise → erode → resample → derive curvature. */
export function createTerrainTools(world, math) {
    class HeightField extends Array {
        constructor(width, height, seed) {
            super();
            this.seed = seed;
            this.constructionRandom = new math.LocalRandom(Math.round(1000 * seed));
            this.detailRandom = new math.LocalRandom(Math.round(1000 * world.random.next()));
            for (let x = 0; x < width; x++) {
                let column = [];
                for (let y = 0; y < height; y++) column.push(0);
                this.push(column);
            }
        }
        writeNormalized(value, u, v) {
            let x = Math.max(0, Math.min(this.length - 1, Math.round(u * this.length)));
            let y = Math.max(0, Math.min(this[x].length - 1, Math.round(v * this[x].length)));
            this[x][y] = value;
        }
        readNormalized(u, v) {
            let x = Math.max(0, Math.min(this.length - 1, u * this.length));
            let y = Math.max(0, Math.min(this[0].length - 1, v * this[0].length));
            return this.sample(x, y, true)[2];
        }
        /** Named controls for a new study; forwards to the original noise kernel. */
        addLayer({ amplitude = 8, offset = 0, frequency = 0.025, low = -0.5, high = 1, modulated = false, modulationOffset = 1, modulationFrequency = 1, invert = false } = {}) {
            this.addNoise(amplitude, offset, frequency, low, high, modulated, modulationOffset, modulationFrequency, invert);
        }
        /** Named erosion recipe. Keep erode()'s positional kernel for existing scene compatibility. */
        erodeWith({
            droplets = 3000,
            inertia = 0.05,
            lifetime = 40,
            depositRate = 0.2,
            erosionRate = 0.05,
            useResistance = false,
            erosionScale = 0.025,
            erosionOffset = 0,
            depositScale = 0.025,
            depositOffset = 0,
        } = {}) {
            this.erode(droplets, inertia, lifetime, depositRate, erosionRate, useResistance, erosionScale, erosionOffset, depositScale, depositOffset);
        }
        grow(erosionScale, erosionOffset, depositScale, depositOffset, invert) {
            this.addNoise(
                12 * (0.155 + 0.65 * this.constructionRandom.next()),
                100 * this.constructionRandom.next(),
                0.025,
                -0.5 * this.constructionRandom.next() - 0.5,
                0.5 + 0.5 * this.constructionRandom.next(),
                false,
                1,
                1,
                invert,
            );
            this.addNoise(
                12 * (0.45 + 0.65 * this.constructionRandom.next()),
                100 * this.constructionRandom.next(),
                0.025,
                -0.5 * this.constructionRandom.next() - 0.5,
                1,
                true,
                10 * this.constructionRandom.next(),
                0.03 + 0.06 * this.constructionRandom.next(),
                invert,
            );
            this.addNoise(8, 100 * this.constructionRandom.next(), 0.006, -0.5 * this.constructionRandom.next() - 0.5, 0.5 + 0.5 * this.constructionRandom.next(), false, 1, 1, invert);
            this.erode(15000, 0.05, 30, 0.2, 0.06, true, 2 * erosionScale, erosionOffset, 2 * depositScale, depositOffset);
            this.resize(world.extent, world.extent);
            this.addNoise(24, 100 * this.constructionRandom.next(), 0.004, -0.25 * this.constructionRandom.next() - 0.75, 1, false, 100 * this.constructionRandom.next(), 0.012, invert);
            let detailOffset = 100 * this.constructionRandom.next();
            this.addNoise(16.08, 100 * this.constructionRandom.next(), 0.012, -0.3 * this.constructionRandom.next() - 0.3, 1, true, detailOffset, 0.012, invert);
            this.addNoise(7.92, 100 * this.constructionRandom.next(), 0.022, -0.3 * this.constructionRandom.next() - 0.3, 1, true, detailOffset, 0.012, invert);
            this.addNoise(6, 100 * this.constructionRandom.next(), 0.015, -1, 1, true, 10 * this.constructionRandom.next(), 0.012, invert);
            this.erode(70000, 0.05, 40, 0.2, 0.05, true, erosionScale, erosionOffset, depositScale, depositOffset);
            this.normalize();
            this.resize(2 * world.extent, 2 * world.extent);
            this.erode(100000, 0.05, 40, 0.2, 0.05, true, erosionScale / 2, erosionOffset, depositScale / 2, depositOffset);
        }
        addNoise(amplitude, offset, frequency, low, high, modulated, modulationOffset, modulationFrequency, invert) {
            let transform = this.randomTransform();
            for (let x = 0; x < this.length; x++)
                for (let y = 0; y < this[x].length; y++) {
                    let point = math.rotate2(x * transform[1], y * transform[2], transform[0]);
                    let weight =
                        ((Math.min(high, Math.max(low, (invert ? -1 : 1) * math.noise(point[0], point[1], offset, frequency))) - low) / Math.max(0.1, high - low)) *
                        (modulated ? 0.75 + 0.75 * Math.min(0.5, Math.max(-0.5, (invert ? -1 : 1) * math.noise(x, y, modulationOffset, modulationFrequency))) : 1);
                    this[x][y] = Math.round(1000 * (this[x][y] + Math.round((1000 * amplitude * weight) / 30) / 1000)) / 1000;
                }
        }
        curvature(x, y, radius) {
            return 10 * (this.sample(x, y, true)[2] - this.neighbourHeight(x, y, radius));
        }
        neighbourHeight(x, y, radius) {
            return (
                (this.sample(x - radius, y - radius, true)[2] +
                    this.sample(x - radius, y + radius, true)[2] +
                    this.sample(x + radius, y + radius, true)[2] +
                    this.sample(x + radius, y - radius, true)[2]) /
                4
            );
        }
        /** Returns [downhillX, downhillY, height]; bilinear weights also drive erosion deposits. */
        sample(x, y, heightOnly) {
            let clampedX = Math.max(0, Math.min(this.length - 2, x));
            let clampedY = Math.max(0, Math.min(this[0].length - 2, y));
            let ix = Math.max(0, Math.min(this.length - 2, Math.floor(clampedX)));
            let iy = Math.max(0, Math.min(this[0].length - 2, Math.floor(clampedY)));
            let fx = clampedX - ix;
            let fy = clampedY - iy;
            let h00 = this[ix][iy];
            let h10 = this[ix + 1][iy];
            let h01 = this[ix][iy + 1];
            let h11 = this[ix + 1][iy + 1];
            let height = h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;
            if (heightOnly) {
                return [0, 0, Math.round(1000 * height) / 1000];
            }
            let gradientX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
            let gradientY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;
            return [Math.round(-1000 * gradientX) / 1000, Math.round(-1000 * gradientY) / 1000, Math.round(1000 * height) / 1000];
        }
        resize(requestedWidth, requestedHeight) {
            let width = requestedWidth;
            let height = requestedHeight;
            if (width < 1) {
                width = 1;
            }
            if (height < 1) {
                height = 1;
            }
            let resampled = new HeightField(0, 0, this.constructionRandom.next());
            if (this.length < 2) {
                return resampled;
            }
            if (this[0].length < 2) {
                return resampled;
            }
            let stepX = (this.length - 1) / width;
            let stepY = (this[0].length - 1) / height;
            for (let x = 0; x < width + 1; x++) {
                let column = [];
                for (let y = 0; y < height + 1; y++) column.push(this.sample(x * stepX, y * stepY, true)[2]);
                resampled.push(column);
            }
            this.splice(0, this.length);
            for (let x = 0; x < resampled.length; x++) this.push(resampled[x]);
        }
        normalize() {
            let minimum = 99999;
            let maximum = -99999;
            for (let x = 0; x < this.length; x++)
                for (let y = 0; y < this[x].length; y++) {
                    if (minimum > this[x][y]) {
                        minimum = this[x][y];
                    }
                    if (maximum < this[x][y]) {
                        maximum = this[x][y];
                    }
                }
            if (Math.abs(maximum - minimum) > 1) {
                for (let x = 0; x < this.length; x++) for (let y = 0; y < this[x].length; y++) this[x][y] = Math.round((1000 * (this[x][y] - minimum)) / Math.max(0.1, maximum - minimum)) / 1000;
            } else {
                for (let x = 0; x < this.length; x++) for (let y = 0; y < this[x].length; y++) this[x][y] = Math.round(1000 * (this[x][y] - minimum)) / 1000;
            }
        }
        /** Seeded droplets carry sediment downhill. Changes are weighted over four grid corners. */
        erode(droplets, inertia, lifetime, depositRate, erosionRate, useResistance, erosionScale, erosionOffset, depositScale, depositOffset) {
            if (this.length - 1 < 1) {
                return;
            }
            if (this[0].length - 1 < 1) {
                return;
            }
            let width = this.length - 1;
            let height = this[0].length - 1;
            for (let drop = 0; drop < droplets; drop++) {
                let x = Math.round(1000 * this.detailRandom.next() * width) / 1000;
                let y = Math.round(1000 * this.detailRandom.next() * height) / 1000;
                let water = 1;
                let sediment = 0;
                let steps = Math.max(1, 0.5 * this.detailRandom.next() * lifetime);
                let directionX = 0;
                let directionY = 0;
                let evaporation = 1 / steps;
                for (let step = 0; step < steps; step++) {
                    let ix = Math.floor(x);
                    let iy = Math.floor(y);
                    if (ix <= 0 || iy <= 0 || ix >= this.length - 1 || iy >= this[0].length - 1) {
                        break;
                    }
                    let fx = x - ix;
                    let fy = y - iy;
                    let surface = this.sample(x, y, false);
                    directionX = inertia * directionX + (1 - inertia) * surface[0];
                    directionY = inertia * directionY + (1 - inertia) * surface[1];
                    let directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
                    if (
                        (directionLength > 0.001 ? ((directionX /= directionLength), (directionY /= directionLength)) : ((directionX = 0), (directionY = 0)),
                        (x += directionX),
                        (y += directionY),
                        x < 0.5 || y < 0.5 || x > this.length - 1.5 || y > this[0].length - 1.5 || (0 == directionX && 0 == directionY))
                    ) {
                        break;
                    }
                    let heightChange = this.sample(x, y, true)[2] - surface[2];
                    let capacity = Math.max(0.01, -heightChange * water * 40);
                    if (sediment > capacity || heightChange > 0) {
                        let deposit = heightChange > 0 ? Math.min(heightChange, sediment) : (sediment - capacity) * depositRate * materialResistance(x, y, useResistance, depositScale, depositOffset);
                        sediment -= deposit;
                        this[ix][iy] = Math.round(10000 * (this[ix][iy] + deposit * (1 - fx) * (1 - fy))) / 10000;
                        this[ix + 1][iy] = Math.round(10000 * (this[ix + 1][iy] + deposit * fx * (1 - fy))) / 10000;
                        this[ix][iy + 1] = Math.round(10000 * (this[ix][iy + 1] + deposit * (1 - fx) * fy)) / 10000;
                        this[ix + 1][iy + 1] = Math.round(10000 * (this[ix + 1][iy + 1] + deposit * fx * fy)) / 10000;
                    } else {
                        let erode = Math.min(-heightChange, (capacity - sediment) * erosionRate * materialResistance(x, y, useResistance, erosionScale, erosionOffset));
                        let removed00 = Math.min(erode * (1 - fx) * (1 - fy), this[ix][iy]);
                        this[ix][iy] = Math.round(10000 * (this[ix][iy] - removed00)) / 10000;
                        let removed10 = Math.min(erode * fx * (1 - fy), this[ix + 1][iy]);
                        this[ix + 1][iy] = Math.round(10000 * (this[ix + 1][iy] - removed10)) / 10000;
                        let removed01 = Math.min(erode * (1 - fx) * fy, this[ix][iy + 1]);
                        this[ix][iy + 1] = Math.round(10000 * (this[ix][iy + 1] - removed01)) / 10000;
                        let removed11 = Math.min(erode * fx * fy, this[ix + 1][iy + 1]);
                        this[ix + 1][iy + 1] = Math.round(10000 * (this[ix + 1][iy + 1] - removed11)) / 10000;
                        sediment += removed00 + removed10 + removed01 + removed11;
                    }
                    water -= evaporation;
                }
            }
            this.round();
        }
        round() {
            for (let x = 0; x < this.length; x++) for (let y = 0; y < this[x].length; y++) this[x][y] = Math.round(1000 * this[x][y]) / 1000;
        }
        randomTransform() {
            return [
                Math.round(1000 * this.constructionRandom.next() * Math.PI) / 1000,
                Math.round(1000 * (1 + this.constructionRandom.next())) / 1000,
                Math.round(1000 * (1 + this.constructionRandom.next())) / 1000,
            ];
        }
    }
    function materialResistance(x, y, enabled, scale, offset) {
        if (enabled) {
            return Math.round(1000 * (0.25 + 0.75 * (Math.min(0.5, Math.max(-0.5, math.noise(x, y, offset, scale))) + 0.5))) / 1000;
        } else {
            return 1;
        }
    }
    return {
        Landscape: class Landscape {
            constructor(erosionScale, erosionOffset, depositScale, depositOffset) {
                let seed = world.random.next();
                this.terrainA = new HeightField(100, 100, seed);
                this.terrainA.grow(erosionScale, erosionOffset, depositScale, depositOffset, false);
                this.terrainB = new HeightField(100, 100, seed);
                this.terrainB.grow(erosionScale, erosionOffset, depositScale, depositOffset, true);
                for (let x = 0; x < this.terrainA.length; x++)
                    for (let y = 0; y < this.terrainA[x].length; y++) {
                        if (!world.alternateTerrain) {
                            this.terrainB[x][y] = this.terrainA[x][y];
                        }
                        let mean = 0.5 * (this.terrainA[x][y] + this.terrainB[x][y]);
                        let edgeBlend = Math.max(0, Math.min(1, (Math.sqrt(x * x + y * y) - 630) / 150));
                        if (!(world.carved && world.flattenEdges)) {
                            edgeBlend = 0;
                        }
                        this.terrainA[x][y] = this.terrainA[x][y] + edgeBlend * (mean - this.terrainA[x][y]);
                        this.terrainB[x][y] = this.terrainB[x][y] + edgeBlend * (mean - this.terrainB[x][y]);
                    }
                this.curvatureA = new HeightField(this.terrainA.length, this.terrainA[0].length, 0);
                this.curvatureB = new HeightField(this.terrainA.length, this.terrainA[0].length, 0);
            }
            calculateCurvature() {
                for (let x = 0; x < this.curvatureA.length; x++)
                    for (let y = 0; y < this.curvatureA[x].length; y++) {
                        let heightWeight = 2.5 * (0.4 + 0.6 * this.terrainA[x][y]);
                        this.curvatureA[x][y] =
                            0.3 * heightWeight * this.terrainA.curvature(x, y, 20) + 0.4 * heightWeight * this.terrainA.curvature(x, y, 6) + 3 * heightWeight * this.terrainA.curvature(x, y, 0.5);
                        heightWeight = 2.5 * (0.4 + 0.6 * this.terrainB[x][y]);
                        this.curvatureB[x][y] =
                            0.3 * heightWeight * this.terrainB.curvature(x, y, 20) + 0.4 * heightWeight * this.terrainB.curvature(x, y, 6) + 3 * heightWeight * this.terrainB.curvature(x, y, 0.5);
                    }
            }
            evaluate(x, y, block) {
                let height = 0;
                let fieldX = (2 * (x + world.cellSize / 2)) % (this.terrainA.length - 1);
                let fieldY = (2 * (y + world.cellSize / 2)) % (this.terrainA[0].length - 1);
                height = block.terrain < 0.5 ? this.terrainA.sample(fieldX, fieldY, true)[2] : this.terrainB.sample(fieldX, fieldY, true)[2];
                return height;
            }
            color(x, y, block) {
                let curvature = 0;
                let fieldX = (2 * (x + world.cellSize / 2)) % (this.curvatureA.length - 1);
                let fieldY = (2 * (y + world.cellSize / 2)) % (this.curvatureA[0].length - 1);
                curvature = block.terrain < 0.5 ? this.curvatureA.sample(fieldX, fieldY, true)[2] : this.curvatureB.sample(fieldX, fieldY, true)[2];
                return curvature;
            }
        },
        HeightField: HeightField,
    };
}
