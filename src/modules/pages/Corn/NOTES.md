# /corn — study notes

Study clone of a chapter-by-chapter WebGL story about seed breeding. Sources: `refs/corn/corn.mp4`
(76 s, 1920×994, 30 fps), `refs/corn/assets/` (ASTC KTX textures, glTF models, two MSDF font
atlases) and, since pass 3, the site's own webpack bundle `refs/corn/assets/webpack/` (decoded in
`.clone-analysis/corn/bundle/`: `main.js` beautified, `shaders.glsl` = every GLSL string with its
line number). Private study route; copy and brand are my own ("Grainline"), the layout, motion and 3D
assets follow the reference. The bottom-left "cookie preferences" badge in the recording is not built.
The arrow cursor in the recording is the system cursor.

## Timeline of the recording (s → what)

| Video   | What                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------- |
| 0–2     | Loader: outlined logo fills in with the percentage (0 → 100 %), "Loading…" line under it             |
| 2–3.2   | Logo fades out; hero fades up from black (cob + leaves, green/teal gradient, bokeh)                  |
| 3.2–5.0 | Hero title draws as broken outlines (letters left → right), then fills grey → white; header fades in |
| 6–17    | Pointer passes over the title: letters near it break into dots that drift and re-form                |
| 17.5–19 | Menu opens: scene blurs heavily; section titles + outline buttons + legal row fade in                |
| 26–28   | Menu closes, hero title redraws                                                                      |
| 29.6    | Scroll → slanted wipe (edge rises ≈14° to the right) brings in the brown helix world                 |
| 30.5–31 | Scrubbed back up and forward again: the wipe follows the wheel (it is scroll-driven, then snaps)     |
| 31–33   | "First, a solid foundation." draws in; body copy fades; CTA ring "Explore the library"; nav label    |
| 36–37   | Helix fades, brown → green-teal; node network; next title draws in ("Computers cut down…")           |
| 38–40   | Seeds fall, teal-blue; potted seedling rises from the bottom ("Our breeders dial it in…")            |
| 41.7    | Wipe → young stalk in front of a blurred field ("We take it to the field.")                          |
| 44.6    | Wipe → top-down trial plots ("Testing, testing and more testing.")                                   |
| 48.9    | Wipe → giant kernel on an orange horizon ("Less than 0.01 % of seeds make it.")                      |
| 52–56   | Kernel slides up, footer links draw in centred; the list scrolls                                     |
| 62      | Footer scrolls off; hero is underneath (loop back to the start)                                      |

## Measurements (1920 × 994)

- Header: burger lines x 60–92, y 60–74; logo x 160–303, y 52–80.
- Hero title: cap height 105 px (rows 466–570), ink span 138–1744 (1606 px), centred.
  Subtitle: Gilroy Light ≈ 19 px, centre y 672. "Scroll to discover" centre y 895, tracked caps.
- Chapter title: left 157 px, cap 68 px, line pitch 96 px (1.41 cap), first cap top 255.
  Body: Gilroy Light ≈ 19 px / 31 px line, left 153, top ≈ 563, max width ≈ 690 px.
- Right nav: ring centre (1862, 496), r ≈ 18; dots at y 443 / 549.
- Wipe edge at one frame: (0, 612) → (1920, 135): slope −0.248 (≈ 14°), crosses the screen in ≈ 5 frames.

## Fonts

- `manifold-msdf.png` (headline face) shipped without metrics. `public/corn/fonts/manifold.json` is
  rebuilt by `.clone-analysis/corn/tools/manifold_json.py`: ink boxes from the MSDF median, characters
  identified by eye, spacing measured from the hero title (ink gap 0.15 cap after the ink-width
  correction, word space 0.26 cap, line pitch 1.41 cap). Distance range ≈ 12 atlas px.
- `gradient-map.png` (same layout at 4×) holds, per glyph, the position along its outline (0 → 1):
  the outline is drawn where `gradient < progress`, which gives the broken, tracing outline.
- `ManifoldTraced.woff2` is the same glyphs traced to vectors (`trace_font.py`) for DOM labels.
- Gilroy Light: `gilroy-msdf.png` + `gilroy.json` (range ≈ 9) and the woff2 for DOM body copy.
- Study only: both faces are commercial; swap before publishing anywhere.

## Pass 3: what the bundle revealed (2026-10-03)

The bundle (`main.js`, 37 k lines once beautified) holds every scene class, shader and editor preset.

| Found in the bundle                                                                                                                                                                                                           | Built as                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Bokeh = `ParticlesArea`: spiral clouds of **pentagon** sprites; size + softness from clip-space distance to a focus point that **follows the pointer** (`DofController`); simplex drift; per-scene presets                    | `fx/particles.ts`                                                        |
| Background cards: base colour + two accent glows (`BackgroundMaterial`)                                                                                                                                                       | `accentBackdropMaterial` (display-space maths; hero card offset + floor) |
| A reference "main camera": 45°, z 10, slides ±0.75 toward the pointer                                                                                                                                                         | `World.fx` + `fxCamera` in every world                                   |
| Hero corn: cards without depth in glTF "RENDER ORDER", premultiplied atlases, light blend from the cob's turn + pointer, leaves flutter / close / peel, intro turn −30° → 0                                                   | `HeroWorld`, `relitMaterial`                                             |
| DNA = 2 backbones × 20 strands that cross through the axis, hairline + 150 beads each, draw-on window                                                                                                                         | `fx/helix.ts`, `ScienceWorld`                                            |
| Data = funnel of nodes on two narrowing helices, links = strings of beads, simplex breathing                                                                                                                                  | `fx/network.ts`                                                          |
| Pot: root and shoot scale up bone by bone; leaves spring and are brushed by the pointer                                                                                                                                       | `ScienceWorld.updatePlant`                                               |
| The stalk chapter is a **field simulator**: 7 + 9 rigged plants on spring bones, leaky-integrator wind, 153 billboards, soil floor, sky, depth of field, front stalk sharp on top; storm / drought / disease / soil / density | `StalkWorld`                                                             |
| Plots = 40 × 40 stacks of 5–7 transparent height slices → parallax; wind, cloud shadow, tilt-shift + glow                                                                                                                     | `PlotsWorld`                                                             |
| Kernel: matcap multiply → colour-burn (0.27, 0.88, 0.97) 30 % → matcap screen; bg turned about its right edge; spring molecule columns                                                                                        | `KernelWorld`, `fx/cluster.ts`                                           |
| Each CTA opens a hotspot: library infographic, conditions picker with sprite icons (`icons-0/1/2`), kernel dial                                                                                                               | `dom/Hotspots.tsx`, engine `openHotspot` / `setCondition` / `setFact`    |

Colour: the reference had no colour management and added particles in display space. Worlds here are
linear, so backgrounds, kernel and plots do their maths on display values; additive particles raise
their weight to 2.2. Copy for the deep dives is my own (`data/story.ts`).

## Pass 4: scroll, titles, nav (2026-10-03, Sang's notes)

- **Scroll in steps** (`engine/Timeline.ts`, `engine/Scroller.ts`). Each chapter owns `dwell` snaps
  (default 1, the stalk 2, the footer stops 0) where the story stays on it and the scene travels on,
  then one snap that carries it to the next chapter. One mouse-wheel notch / short swipe = one snap
  (420 px of wheel, commits past 10 %); a long swipe can carry two. `pos` follows the target on a
  critically damped spring (ω 3.4 while scrolling, 2.5 when landing ≈ 1.6–2 s per snap): soft start,
  no overshoot.
- **Every world moves with the in-chapter scroll** (`FrameCtx.dwell`, 0 → 1): hero — the camera
  travels down the cob, turns a little, the husk starts to open, bokeh drift up; science — the helix,
  the network and the pot carry their own scroll moves on (`s = local + 0.4 · dwell`, eased back
  during the blends so the motion never reverses); stalk — the camera walks down the plant to the
  soil (two snaps); plots — the camera pans along the field and tilts; kernel — it turns and rises,
  the molecule columns climb past. Worlds keep their pointer orbit / parallax on top.
- **Titles**: trace 2.4 s, fill from 1.9 s over 1.6 s, sine in-out, every letter at once (no
  stagger); a chapter's title starts once the move into it is ≈ 70 % done; copy and CTA follow later.
- **Title pointer field**: a resting field (`Trail.hover`, ≈ 1.6 × the hover radius) stays open
  while the pointer is on a drawn title, moving or not, and closes ≈ 0.8 s after it leaves; the
  moving trail and the press-and-hold field still add on top.
- **Side nav**: the current section's ring track is cut into that section's snaps; its arc fills with
  the scroll through the section (engine writes `data-nav-arc` each frame). On a section change the
  ring glides (1.4 s) and the section name slides in from the right, rests 2.8 s, slides out left.
- **Transitions render at 72 %** (`Composite.aMove/bMove`) while two worlds share the screen; parked
  frames are full resolution. Stalk and plots keep one buffer set per target size.
- 2026-10-03 19:26: many files were rolled back to a mid-pass-3 state outside this session; pass 3
  was re-applied on Sang's go-ahead.

## Architecture

- `CornPage.tsx` mounts `engine/Engine.ts` (vanilla three.js, one canvas, one rAF loop) under a DOM
  layer (`dom/*`) that owns layout, copy, links and accessibility. `store.ts` is the small UI store
  the engine writes and React reads (never per frame).
- **Scroll model** (`engine/Scroller.ts`, pass 2): the page never scrolls natively. Wheel / touch /
  keys move a target in _stops_ continuously (900 px of wheel per stop, ≤ 0.3 stop per event) and
  `pos` glides after it (λ 5.2, smooth-scroll inertia); the target may lead the view by ≤ 1.15 stops,
  so a hard flick still plays every transition. After 150 ms without input it eases to the nearest
  stop, biased forward past 16 % in the direction of travel. Every visual is a function of `pos`, so
  wipes, blends and scene moves are scrubbed by the scroll. One stop past the last wraps to the hero.
- **Camera rig** (`World.orbit`): every world orbits its camera around a pivot (pointer: yaw ±0.3,
  pitch ±0.15 rad, damped) with a lens shift that keeps the pivot at its measured screen spot, plus
  scroll-mapped moves per world (hero swings round and pushes in as it leaves; helix rises and twists,
  network and pot rise, seeds drift; the stalk keeps rising while the camera arcs round it; the field
  pans and pitches; the kernel turns with the scroll and rises into the footer). Near-camera motes
  in stalk, plots and kernel add depth to the orbit; the helix has soft glow sprites (no bloom pass).
- **Worlds** (`engine/worlds/*`): hero, science (3 stops blended by `local`), stalk, plots, kernel
  (cut + 2 footer stops). Each renders into its own MSAA half-float target: 3D scene, then the
  headline overlay (orthographic, screen px, y down). Only on-screen worlds render.
- **Composite** (`engine/Composite.ts`): wipe (slope −0.248 px/px, old world pushed up 22 %, new
  rises 30 %) or blend → sRGB → grade LUT (`map-grade.png`, a contrast curve) → menu blur
  (dual-filter, 4 levels, only while open) → grain + vignette.
- **Titles** (`engine/text/*`): DOM headings in the traced face are transparent anchors; the engine
  measures them on resize and draws MSDF titles exactly on top (cap top = line top + 0.169 cap).
  Reveal: outline grows along the glyph path (`gradient-map.png` < progress, letters staggered 0.12),
  fill arrives grey → white (draw 1.1 s, fill from 0.85 s over 0.75 s).
  Pointer (pass 2, from the designer's hover / hold stills): inside the pointer field the fill gives
  way to the outline — a dim full outline with bright broken segments travelling along the glyph path
  — and a constellation of nodes (sampled on the letter edges) flies out, joined to near neighbours by
  hairlines that fade with their fainter end. Hover: a 16-point trail, radius 1.15 cap, life 1.0 s.
  Press & hold on a title: one disc that opens to 3 cap over 0.55 s, sends the nodes ≈ 1.9× further,
  and brings in the second half of the nodes; it closes over 1.1 s after release.
- The menu hides the titles with the blur and they redraw when it closes (reference 26–28 s).

## Stops (build) ↔ reference

| Stop | World / local   | Reference   | Enters with                                |
| ---- | --------------- | ----------- | ------------------------------------------ |
| 0    | hero            | 0–29.6 s    | intro / wipe from footer                   |
| 1    | science 0 helix | 29.6–36 s   | wipe                                       |
| 2    | science 1 nodes | 36–38 s     | blend                                      |
| 3    | science 2 pot   | 38–41.7 s   | blend (pot rises 0.4–1.8 s after arrival)  |
| 4    | stalk           | 41.7–44.6 s | wipe                                       |
| 5    | plots           | 44.6–48.9 s | wipe                                       |
| 6    | kernel          | 48.9–52 s   | wipe                                       |
| 7    | kernel footer   | 52–61 s     | blend (links draw in, kernel rises)        |
| 8    | kernel footer 2 | 61–62 s     | blend (list scrolls 380 px, kernel leaves) |
| →0   | hero            | 62 s        | wipe                                       |

## Assets (file → content → where)

| File                                                                               | Content                                                                                                 | Used in                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `cobb_test.gltf` + `TOP_L/TOP_R/BOTTOM_L/BOTTOM_R` + `alpha`                       | cob + 16 husk cards; one atlas lit from 4 directions + its alpha                                        | hero, pointer blends the 4 lightings (`relitMaterial`) |
| `hair.gltf` + `HAIR_*` + `alpha (1)`                                               | corn silk, same 4-way lighting                                                                          | hero                                                   |
| `KERNAL.gltf` + `map_diffuse_kernel` + `map_matcap_mult/screen`                    | kernel (Z-up, root rotation baked)                                                                      | kernel world, falling seeds                            |
| `pot3.gltf` + `diffuse_pot`                                                        | cut-away pot + skinned seedling (Z-up; plant rig `Armature001` sits 74 units off — moved into the soil) | science stop 3                                         |
| `bg_pot.gltf` + `bg_pot_diffuse`                                                   | the dark pot behind                                                                                     | science stop 3                                         |
| `stalk_rigged3.gltf` + `stalk_diffuse_flat`                                        | young stalk, 4 skinned leaf layers (330 units tall)                                                     | stalk world                                            |
| `bg` + `SingleStalk2.png`                                                          | field gradient + a leaf sheet sampled at a low mip (depth of field)                                     | stalk backdrop                                         |
| `map-field-diffuse` (4 × 4 plot tiles), `map-ground-diffuse`, `map-cloud-noise`    | plots from above, soil, cloud shadow                                                                    | plots world                                            |
| `map_bg`                                                                           | orange horizon band                                                                                     | kernel backdrop                                        |
| `map-grade.png`, `post-noise.png`                                                  | grade LUT, grain                                                                                        | composite                                              |
| `manifold-msdf.png` + `gradient-map.png`, `gilroy-msdf.png` + `gilroy.json`, woff2 | fonts (see Fonts)                                                                                       | titles, DOM                                            |

Unused, with the reason: `SingleStalk12_db` + `SingleStalk_DifF_0007(_DEAD/_reveal)` (a dying-stalk
reveal not seen in the recording), `stalk_diffuse_shadow`, `stalk-screen`, `stalk_energy` (stalk
variants not seen), `soil_*`, `soil-normal/-displacement`, `revealMap`, `rainTexture`, `plantShadow`
(interactive soil / weather states not in the recording), `icons-0/1/2` (plot glyph sprites; the
plot tiles cover the look), `lens-flare`, `bg_corn`, `map_bump_kernel` (subtle; matcap reads right
without them), UI PNGs (`arrow-*`, `rotate-icon`, `cookiepref`, partner logo — rebuilt in CSS/SVG or
not built), `svg.svg` (brand logos — replaced by the original Grainline mark).
Textures are decoded from ASTC KTX to WebP by `.clone-analysis/corn/tools/ktx_decode.py`.

## Verification (2026-10-03, Apple M4, Chrome/ANGLE Metal)

- Side-by-side at every stop: `.clone-analysis/corn/sheets/final_*.png` (build left, reference right).
- Motion sheets: intro, wipes, blends, hover scatter, menu: `.clone-analysis/corn/sheets/motion_*.png`.
- Frame times, flicking through all stops with the pointer wandering: p50 16.7 ms, p99 16.8 ms,
  0 frames over 33 ms — same with 4× CPU slowdown (`.clone-analysis/tools/corn_perf.mjs`).
- Lint and `tsc` clean; only new files (`src/modules/pages/Corn`, `src/app/[locale]/corn`, `public/corn`).

## Known differences

- Helix: the reference has a soft bloom on the fibres; the build uses additive lines, sparkles and glow sprites instead of a bloom pass.
- Pass 2 departs from the recording on purpose (designer's request): scroll is continuous with a soft settle instead of one stop per gesture, and the pot / seeds follow the scroll instead of a timer.
- Kernel reads slightly warmer than the reference's olive-yellow; the constellation is sparser.
- Plant growth: the reference seedling likely grows with its bones; the build rises it with the pot.
- Body copy is DOM text (crisp, selectable) where the reference may draw it in WebGL.
- Desktop only (scales with width via `--u`); no phone layout yet.

## Tools

- Asset viewer: `/corn?debug=model&name=<gltf>&tex=<webp>[&alpha=…][&uv]` (UV wireframe + world bounds).
- Jump: `/corn?skip&ch=<stop>`; `window.__corn` (dev only): `go`, `pos`, `state`, `renderer`.
- `.clone-analysis/tools/corn_shot.mjs` (stills; `--ptr="x,y;x,y"` for orbit pointer pairs), `corn_motion.mjs` (intro | wipe | hover | hold | scrub | menu
  sequences), `corn_eval.mjs`, `corn_perf.mjs`; `.clone-analysis/corn/tools/sbs.py`, `motion_sheet.py`.
