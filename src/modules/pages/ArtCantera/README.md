# Cantera: an artist's map of the code

Start with `art/scene.js`. It reads in the order the piece is made:

**hash → traits → camera and sun → two eroded fields → carved cells → grounded structure → curvature → ray print → living layer.**

The artwork uses CPU ray tracing and Canvas 2D. It does not require WebGL, mesh assets or image textures. The browser needs workers and OffscreenCanvas.

| Module                  | Artistic responsibility                                                 | Good first experiment                                              |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `random.js`             | TokenRandom for trait choices; LocalRandom for independent details      | Give a new mark its own stream                                     |
| `noise.js`              | The original seeded 3D OpenSimplex kernel                               | Change sampling scale in the caller, rather than the kernel tables |
| `height-field.js`       | Noise layers, bilinear heights/slopes, droplet erosion, curvature       | Try fewer droplets or a different material resistance              |
| `carving.js`            | Axis segments, offsets, copies and junction bounds that clear cells     | Change the rhythm or spacing of removed volumes                    |
| `blocks.js`             | A cell's terrain coverage, neighbour rules and surface intersection     | Explore thinner tips or a different support rule                   |
| `camera.js` / `math.js` | Parallel projection and pure vector operations                          | Photograph the same world from another angle                       |
| `tracing.js`            | Grid-plane crossings, surface hits, visibility and local noise sampling | Inspect one ray before changing traversal                          |
| `surface.js`            | Light, fog, windows, stripes, grids, grain and sample averaging         | Change one family of marks while keeping the world                 |
| `life.js`               | People silhouettes, bird steering, occlusion and brightness             | Change flock behaviour without rerolling the terrain               |
| `scene.js`              | Trait order and the build/render pipeline                               | Add an explicit new scene version                                  |
| `render.worker.ts`      | CPU ownership, progression, pause and bitmap transfer                   | Keep expensive work off the main thread                            |
| `useCanteraCanvas.ts`   | Worker lifetime, visibility, reduced motion and canvas ownership        | Reuse the renderer in a smaller preview                            |

## Coordinate and data conventions

- **x/y** run across the ground; **z** goes up. The original cell size is **8**, extent **392**, upper height **80**, and base depth **8**.
- `HeightField` is an array of columns: `field[x][y]`. `sample(x,y,heightOnly)` returns `[downhillX, downhillY, height]`; set the final argument to `true` when slope is unnecessary.
- Terrain starts at 100 × 100, grows to 393 × 393, then 785 × 785. Each terrain uses erosion stages of 15,000, 70,000 and 100,000 droplets.
- Each block owns bounds (`x0`…`z1`), an empty/solid flag, terrain selection, support flags and a local random stream. `contX/Y/Z` means the adjacent face continues into a compatible cell; `winX/Y` identifies an exposed wall.
- An eye-ray hit is `[x,y,z,face,distance,materialCue]`. Face **0** is terrain, **1/2** are cut walls, **3** is a horizontal cut. For terrain, the cue is curvature; for cut faces it helps gate window marks. A shadow-only hit is `[distance]`; no hit is `null`.
- Four interleaved passes cover the four pixel parity offsets. `floor(pass / 4)` is the count of earlier samples for each pixel. Do not treat an individual pass as a full-image sample.

For new studies, use the named artist controls instead of memorizing parameter slots:

```js
const { HeightField } = createTerrainTools(world, math);
const field = new HeightField(65, 65, 0.39);
field.addLayer({ amplitude: 8, frequency: 0.025 });
field.normalize();
field.erodeWith({ droplets: 8000, inertia: 0.05 });
```

The scene keeps the positional kernels so the original call sequence stays reviewable. The named helpers forward directly to those kernels.

## Keep old hashes reproducible

The refactor preserves the original formulas, random draw order, numeric rounding, terrain/cut rules and print dimensions. The original compiled file lives in `scripts/fixtures/cantera.original.js` as a regression oracle; it is no longer served or injected into the page.

Keep these invariants when making a compatible edit:

1. Preserve TokenRandom warm-up and trait draw order. New global dice calls change later traits.
2. Preserve construction/detail stream ownership, including draws consumed by field resizing and curvature-map construction.
3. Preserve 1/1000 height rounding and 1/10000 erosion updates. Small numeric changes can redirect a droplet.
4. Preserve traversal order, hit refinement and four-pass averaging if an old image must remain exact.
5. Compare at the same output dimensions. Per-pixel rays and sampling budgets depend on the raster size.

For a deliberate artistic change, create a new version/recipe. Do not silently claim that its hash reproduces the old algorithm.

Run the CPU oracle with Node 22 or later:

```sh
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/verify-cantera.mjs
```

It compares both complete terrain arrays, every block's structural flags, the depth map and paint pixels after eight passes against the original, for three hashes spanning carved/front and carved/diagonal modes. It intentionally omits silhouette rasterization; browser checks cover the visible living layer separately.

## Browser ownership

React owns controls and status. One worker owns the scene, paint canvas and living canvas. It transfers ImageBitmaps, which the main thread closes after painting. Visibility pauses the worker; unmount terminates it. Scene failures produce a readable error instead of the original unlimited retry loop. The living layer retains the original fixed 80ms update cadence (12.5 steps/second).

`/art-cantera?seed=0x…` reproduces a full 64-digit hash. Optional `w` and `h` query parameters preserve the original portrait sizing rule; inputs are validated to 18…4096. The raster is fixed at mount, then CSS fits it to the viewport without rerolling the scene on resize.

## Study and develop

`/art-cantera/learn` has ten chapters and intentionally smaller teaching copies. They import the real random, noise, height-field, erosion and camera helpers. Erosion dials use fewer droplets to stay responsive. The carved sculpture, light cross-section and flock are clearly labeled simplified models. Three new studies explore tidal ink, architectural voids and engraved atlases.

Guide recipes are study inputs; they are not token trait overrides. The original art helpers remain the reference for any new full-scene version.
