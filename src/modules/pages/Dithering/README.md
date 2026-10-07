# Dithering studio: an artist's map

The subject and the print are independent. The scene draws a smooth image into a
render target. A fullscreen fragment shader turns that image into marks.

## Read in this order

- `settings.ts`: defaults, artist-facing dial ranges, patterns, and six recipes.
- `Scene.tsx`: helmet / procedural subjects, camera, motion, and lighting.
- `Environment.tsx`: small photographic reflection map, rebuilt on colour change.
- `pipeline.ts`: scene -> optional bloom -> print -> optional bloom.
- `dithering-shader/DitheringShader.ts`: sampling, tone, screen, palette, surface.
- `dithering-shader/patterns.glsl.ts`: independent threshold functions.
- `dithering-shader/DitheringEffect.ts`: settings -> mutable GPU uniforms.
- `StudioPanel.tsx`: grouped controls; `Controls.tsx`: accessible input primitives.
- `PostProcessing.tsx`: R3F lifecycle adapter. Priority 1 owns the render output.

The renderer is created once. Sliders update uniforms and existing bloom objects;
they do not allocate new passes. Disabled blooms skip GPU work. Unmount disposes
the composer, its passes, effects, and render targets. R3F owns scene resources.
The existing helmet is 3.8 MB compressed, with about one million triangles; it remains
the most expensive subject. The procedural alternatives are considerably lighter. The
Draco decoder uses the repository’s local `/draco/gltf/` files, without a CDN dependency.
The GLTF cache owns the original geometry/textures; each helmet has its own material.

## Add a pattern

1. Write a pure threshold function in `patterns.glsl.ts`. Its input is a coordinate
   in **cells**, not UV or pixels; its output is in [0, 1].
2. Assign the next numeric ID in `PATTERNS` and in `printThreshold`.
3. The shared quantizer rounds each tone up or down against that threshold.
   Distance-based patterns reverse the threshold so their centers accumulate ink.
4. Check a uniform ramp at 0, 0.25, 0.5, 0.75 and 1 before trying the helmet.
5. Add a recipe and, if necessary, a dial to the typed settings and UI metadata.

Cell size and image sample size do different jobs. Cell size defines the screen;
sample size pixelates the source. Both are CSS pixels, multiplied by DPR exactly
once in the shader. Changing render density preserves the print's apparent scale.

## Tone and colour

The original RGB sum was replaced with weighted luminance (Rec. 709 coefficients).
Tone shaping runs on the sampled RGB before luminance; it uses exposure in stops,
contrast around 0.5, power-based midtone lift and an additive bias. Palette colours
enter as CSS hex strings and Three converts them into linear colour uniforms.
The composer's output material handles conversion back to display colour.

Two levels produce ink/paper. More levels produce intermediate shades; softened
edges also introduce transitional values. These are **ordered/stochastic screens**,
not error diffusion. Stipple is seeded white-noise thresholding, not blue noise.
Contour is an intentionally artistic tonal screen, not a contour extraction algorithm.

## Working safely

Keep randomness independent of time to avoid crawling marks. Animation moves only
the subject; Pause keeps sliders and orbit controls working via demand rendering.
Hidden documents stop the frame loop. Reduced motion starts still; Play explicitly
opts in. Render density is capped and the reflection map is 256px rather than 1024px.

The learn route imports the real pipeline and Bayer inspection helper read-only.
Its procedural image fields live in `DitheringLearn/kit/fields.glsl.ts`, so teaching
experiments never change the studio's subjects or shader.

Provenance: this page grows the original
[niccolofanton/dithering-shader](https://github.com/niccolofanton/dithering-shader)
experiment. Preserve that attribution when adapting it.

Helmet asset credit, embedded in the original GLTF: The Royal Armoury (Livrustkammaren),
Jousting Helmet, CC BY 4.0,
https://sketchfab.com/3d-models/jousting-helmet-a4eea31d9d9441af9434a7da5ae46b54.
