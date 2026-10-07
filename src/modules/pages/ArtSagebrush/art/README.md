# Sagebrush studio

Start at `world.ts`: seed → palette/light → heightfield → vegetation/shadows → ground marks → depth stack. The React page only owns the canvas and lifecycle.

## Where to work

| File | Artistic responsibility |
| --- | --- |
| `random.ts`, `noise.ts` | Repeatable choices and smooth Perlin variation |
| `heightfield.ts` | Three octaves, rear-to-front taper, erosion and softening |
| `erosion.ts` | In-place droplet carving and deposition (`map[x][y]`) |
| `terrain.ts` | First differences (slope), second differences (curvature) |
| `projection.ts` | Height → angle displacement and screen elevation |
| `palette.ts` | Paired ground/plant ramps, byte-alpha ink colors |
| `brush.ts` | Target paths plus an inertial pen that deposits dots |
| `plants.ts` | Trunks, branches and elliptical leaf/rock clumps |
| `world.ts` | Placement, shadows, stroke length/orientation and layer order |
| `renderer.ts` | Persistent surface, persistent drawing RNG and frame budget |
| `settings.ts` | Artwork coordinates, paper, composition and render limits |

## Making a study

Use `createNoise(noiseSeed)` and `createRandom(seed)` once per study. Make an `InkEllipse`, set its weight, speed, acceleration, density, wobble and color, then call `update(context, noise, random)` until it returns `done`. `plants.ts` exposes the same plant grammar used by the artwork. The learn route contains isolated examples that import these modules.

Coordinates are artwork units (400 × 400), not CSS pixels. A stroke's `z` is its original ground row, **before** projection; descending sort + reading the last element paints the back first. Ink color alpha is 0–255. Pen speed is units per simulation step; frame scheduling controls how many steps run, not the final image.

## Reproducibility contract

Open `/art-sagebrush?seed=42&noise=1337`. The two URL seeds are nonnegative integers up to eight digits. Without them each visit picks a new piece. Build randomness and drawing randomness are separate; the drawing stream uses `seed + 1`. Adding or removing a random call inside a builder changes everything later in that stream, even a call such as `range(4, 4)` that returns a constant. Keep such calls when preserving editions.

The refactor preserves the existing stylized model, including rounded-cell erosion sampling, directional erosion footprints, in-place softening and pre-erosion framing bounds. These are artistic choices/legacy quirks, not a physically accurate hydraulic simulation. The noise is Perlin, not simplex. The lighting normal has z = 0: it is a slope-direction proxy, not a three-dimensional surface normal. Warp happens to mark positions after the field is generated, not to noise input coordinates.

## Safe extension points

- Change ramps in `palette.ts` to explore ink families.
- Adjust the three noise octave weights in `heightfield.ts` for terrain character.
- Change `InkEllipse` target paths to draw ribbons, handwriting or woven forms.
- Reuse `createPlantBuilders` in a specimen sheet without terrain placement.
- Preserve world setup order: plants darken the light map before ground marks read it.
- Never clear the canvas between drawing frames or recreate the random stream per frame.

`createWorld` remains synchronous; the page yields before setup so its loading state paints, but that does not make it a worker. Large future scenes should move serializable terrain/composition work to a worker. Rendering is bounded to 2,000 updates and approximately 8 ms per frame (checked every 32 steps), stops when finished and cancels on unmount.
