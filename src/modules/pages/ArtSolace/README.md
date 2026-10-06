# Solace

A generative artwork: sand dunes drawn with about 400,000 tiny dots. Every seed gives a different
piece, and the same seed always gives the same piece. Rebuilt from an fxhash-style p5.js sketch
onto a plain 2D canvas (no p5, no WebGL).

Open `/art-solace` and press **D** for the debug panel. A guide that takes the techniques apart is at
`/art-solace/learn`.

## How a piece is made

```
seed ─► traits stream ─► traits (Palette, Dunes, Sky…)
     └─► next number ─► render stream ─► scene params (warp, placement, density…)
                                      └─► dunes: ridge walks → boundary maps
                                      └─► drawFrame() × 50: scatter dots, keep or drop each one
```

For every dot: pick a random x and the current scan y, **unwarp** it back into model space, ask the
dunes which **shade** it falls in (dark core, lit slope, sky), then keep it with that shade's
probability (core 100 %, slope 10 %, sky 50–100 %). Probability alone makes the image: no outlines,
no fills.

## Files

| File                | What's in it                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `art/random.ts`     | Seeded random (cyrb128 + sfc32), bell-curve values, the `Random` helpers (`next`, `range`, `pick`, `chance`, `gaussian`) |
| `art/noise.ts`      | Seeded Perlin noise (used by the Sandstorm trait)                                                                        |
| `art/palettes.ts`   | The 18 palettes and the weighted bag they're drawn from                                                                  |
| `art/traits.ts`     | Trait odds (`rollTraits`)                                                                                                |
| `art/params.ts`     | **Every scene number**, rolled in one place, plus overrides. Start here to change the look                               |
| `art/warp.ts`       | Wavy horizon + depth squeeze, and its exact reverse                                                                      |
| `art/dunes.ts`      | Ridge walk, boundary maps, the shade test                                                                                |
| `art/scene.ts`      | Puts it together: `buildScene(seed, size, overrides)` → `drawFrame(ctx, frame)`                                          |
| `ArtSolacePage.tsx` | Canvas, draw loop, keyboard shortcuts                                                                                    |
| `debug/`            | Seed lock and URL handling, the leva panel                                                                               |

## The one rule

**Every random number is part of every seed.** The art draws from a single stream of numbers, so
adding, removing or reordering a `rand.*` call shifts every choice after it, and old seeds stop
reproducing their old pictures. That's why `params.ts` still has lines marked `⟲ legacy`: the
original sketch used them for features this port doesn't draw (clouds, sun, sand lines), and they
still take their number so the dunes stay identical.

- To **add** a random feature without changing existing seeds, give it its own stream:
  `const featureRand = createRandom(seed + ':my-feature')`. (Even a call added after the dunes are
  placed would shift every dot, because drawing reads the same stream.)
- To **force** a value, use an override (debug panel, or `buildScene(seed, size, { params: { … } })`):
  the seeded value is still rolled and then replaced, so nothing else moves.
- **Trait overrides** are different: they're applied before the scene is rolled, so forcing
  `Dunes: 24` gives "this seed, had it rolled 24 dunes", and the rest of the layout reshuffles.

The refactor that produced these files was checked by drawing 57 seeds before and after (including
every rare trait) and comparing a hash of every dot: identical.

## Debug panel

| Key | Action                                                                             |
| --- | ---------------------------------------------------------------------------------- |
| D   | Show / hide the panel (or add `?debug` to the URL)                                 |
| R   | New random seed                                                                    |
| L   | Lock the seed: refresh keeps it, and it goes into the URL as `?seed=…` (shareable) |
| S   | Save a PNG                                                                         |

Unlocked (the default), every refresh rolls a new seed, as the piece was meant to be seen.

Every scene dial has a checkbox: unticked shows the value this seed rolled; ticked forces your
value. Tiny values are shown in ‰ (thousandths of the canvas). Turn off **animate build** to draw in
one go while tweaking.

## Not drawn in this port

The original also had sky effects (`Sky`: Starry, Wool, Beam…; here Sky only sets the sky grain's
density), render modes (`Render`: Refine, Banners, Modulo; here always the simple scan) and dust
(`Dusty`). Their traits are still rolled and listed so seeds match the original.
