/* Seed regressions captured from the pre-refactor artwork. Run: node scripts/verify-sagebrush.cjs.
 * Checks the complete shape plan and the first 5,000 simulation steps, including
 * every ink coordinate/color. No browser or pixel rasterizer is required.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};
const art = path.resolve(__dirname, '../src/modules/pages/ArtSagebrush/art');
const { createWorld } = require(path.join(art, 'world.ts'));
const { createNoise } = require(path.join(art, 'noise.ts'));
const { createRandom } = require(path.join(art, 'random.ts'));
const cases = [
    [42, 1337, 'eebcc727845dcfb16a4d01e7e1376386ab946578960b40cdab11608bef81d528', '5834c2c2e4cb48ec84c7e41ebab40028893205c1d3a1f1646981f8f015dec591'],
    [12345, 67890, '7f79525ea2706100c98383b6740af0f44c6ec24671e658436b8dcebb3bc8c4d1', '081d4872d669d6fa3d8bdc4a59ded4b63d421db6fc542eb8eeb8b8eed6e3504b'],
    [0, 0, 'f9ff206af36b61a1ffd55176b4d8c45d66a51e4431dbd847082f0541fcad2a26', '76679dcd46bfcc956e8e63ac546f60b246e1bea4add0e0997738ce1c97aa26df'],
];
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
for (const [seed, noiseSeed, worldHash, inkHash] of cases) {
    const world = createWorld(seed, noiseSeed);
    const noise = createNoise(noiseSeed);
    const random = createRandom(seed + 1);
    const log = [];
    const context = {
        save() {},
        restore() {},
        translate(...values) {
            log.push(values);
        },
        rotate(...values) {
            log.push(values);
        },
        fillRect(...values) {
            log.push(values);
        },
        set fillStyle(value) {
            log.push(value);
        },
    };
    for (let step = 0; step < 5000; step++) {
        if (world.shapes.at(-1).update(context, noise, random) === 'done') world.shapes.pop();
    }
    assert.equal(digest(world), worldHash, `Shape plan changed for ${seed}/${noiseSeed}`);
    assert.equal(digest(log), inkHash, `Ink changed for ${seed}/${noiseSeed}`);
    console.log(`PASS seed ${seed}, noise ${noiseSeed}: ${world.shapes.length} remaining shapes, 5,000 exact ink updates`);
}
