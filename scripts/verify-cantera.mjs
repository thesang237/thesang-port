/** CPU regression oracle. No browser or third-party test library needed (Node 22+). */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { DEFAULT_HASH } from '../src/modules/pages/ArtCantera/art/random.js';
import { createScene, renderSize } from '../src/modules/pages/ArtCantera/art/scene.js';

// Only the paint buffer is compared. Silhouette drawing is deliberately omitted from
// this CPU oracle; visual/lifecycle checks run in the browser separately.
class Canvas {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.style = {};
        this.context = new Context(this);
    }
    getContext() {
        return this.context;
    }
}
class Context {
    constructor(canvas) {
        this.canvas = canvas;
        this.data = new Uint8ClampedArray(0);
        this.fillStyle = '#000000';
    }
    ensure() {
        if (this.data.length !== this.canvas.width * this.canvas.height * 4) this.data = new Uint8ClampedArray(this.canvas.width * this.canvas.height * 4);
    }
    fillRect(x, y, w, h) {
        this.ensure();
        const rgb = this.fillStyle.startsWith('#')
            ? this.fillStyle
                  .slice(1, 7)
                  .match(/../g)
                  .map((value) => parseInt(value, 16))
            : [0, 0, 0];
        for (let py = Math.max(0, Math.floor(y)); py < Math.min(this.canvas.height, y + h); py++)
            for (let px = Math.max(0, Math.floor(x)); px < Math.min(this.canvas.width, x + w); px++) this.data.set([...rgb, 255], 4 * (py * this.canvas.width + px));
    }
    getImageData(x, y, w, h) {
        this.ensure();
        const data = new Uint8ClampedArray(w * h * 4);
        for (let row = 0; row < h; row++) data.set(this.data.subarray(4 * ((y + row) * this.canvas.width + x), 4 * ((y + row) * this.canvas.width + x + w)), row * w * 4);
        return { data, width: w, height: h };
    }
    putImageData(image, x, y) {
        this.ensure();
        for (let row = 0; row < image.height; row++) this.data.set(image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4), 4 * ((y + row) * this.canvas.width + x));
    }
    createLinearGradient() {
        return { addColorStop() {} };
    }
    drawImage() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    closePath() {}
    stroke() {}
    fill() {}
    arc() {}
    fillText() {}
}
const legacySource = readFileSync(new URL('./fixtures/cantera.original.js', import.meta.url), 'utf8');
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain = (value) => JSON.parse(JSON.stringify(value));
const snapshot = (world, canvas) => ({
    pixels: Buffer.from(canvas.getContext('2d').getImageData(0, 0, 90, 160).data).toString('base64'),
    terrainA: digest(world.landscape.terrainA),
    terrainB: digest(world.landscape.terrainB),
    grid: digest(world.blocks.map((column) => column.map((stack) => stack.map((block) => [block.isEmpty, block.terrain, block.contX, block.contY, block.contZ, block.winX, block.winY, block.roof])))),
    depth: digest(world.depthMap),
});
for (const hash of [DEFAULT_HASH, '0x' + '11'.repeat(32), '0x' + '22'.repeat(32)]) {
    let frame;
    const old = vm.createContext({
        tokenData: { hash, tokenId: '39000019' },
        console: { log() {} },
        URLSearchParams,
        window: { location: { search: '?w=30&h=30' } },
        self: { innerWidth: 30, innerHeight: 30 },
        document: { createElement: () => new Canvas(), body: { style: {}, prepend() {} } },
        setInterval: (callback) => {
            frame = callback;
            return 1;
        },
    });
    vm.runInContext(legacySource, old);
    const paint = new Canvas(),
        life = new Canvas();
    paint.width = life.width = 90;
    paint.height = life.height = 160;
    const current = createScene(hash, paint, life);
    for (let pass = 0; pass < 8; pass++) {
        frame();
        current.frame();
    }
    const before = snapshot({ landscape: { terrainA: old.landscape.t0, terrainB: old.landscape.t1 }, blocks: old.BLOCKS, depthMap: old.DMAP }, old.mainCanvas);
    const after = snapshot(current.world, paint);
    assert.deepEqual(plain(after), plain(before), `Regression for ${hash}`);
    console.log(`PASS ${hash.slice(0, 12)} · both terrains, full grid flags, depth, 8 paint passes`);
}
assert.deepEqual(renderSize(30, 30), { width: 90, height: 160 });
assert.deepEqual(renderSize(1440, 900), { width: 900, height: 1600 });
console.log('PASS portrait sizing · all Cantera regressions passed');
