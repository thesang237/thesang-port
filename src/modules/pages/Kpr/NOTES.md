# /kpr — study notes

Study clone of the kprverse.com "Story" page. Sources: `refs/kpr.mp4` (148 s, 1920×1036, red = the
user's repainted `<body>`; read red as **white**), `refs/KPR/KPR _ Story.html` (DOM + ~65 KB of
scoped component CSS that survived in `<style>` tags), `refs/KPR/*` assets.

## Engine facts from the saved HTML

- Nuxt app. `#canvas-container` (fixed canvas) → `#ui-container` (fixed, `color:#fff`, every section
  absolutely stacked at top 0, toggled with `visibility/opacity/pointer-events`) → `.smooth-wrapper`
  (fixed) holding **two copies of the HUD frame** (`.the-frame-layer.theme-light` and `.theme-dark`)
  cross-faded/masked for the theme switch → `#page` with empty `*Ref` divs that only give scroll
  length (`projectStoryRef` is 2888 px tall) → footer in flow.
- Body height 24131 px at a 1328 px viewport → **≈ 18.2 screens** of scroll in total.
- Scale: `scale_mode: width`, desktop design 1600×850, **1rem = 10px × (vw/1600)** clamped to
  0.64–1.2 (so 12 px at 1920). Mobile < 768 px, design 375×667.
- Tokens seen in CSS: `--menu-pad` (frame inset), `--menu-height` (top bar), `--menu-width` (left
  column), `--menu-radius`, `--line-thickness: 1px`, `--line-dark` / `--line-light`, `--cl-green`
  (`#c0fb50` used literally in the menu), `--cl-lavender`.
- Measured at 1920: frame inset 19 px, top bar 55 px tall, left column 70 px wide, radius ≈ 12 px.
- Fonts: `ABCWhytePlus` (variable; menu labels weight 650, opsz .4, tracking −.07em, line-height .85;
  popup titles 700 / −.07em / .9), `HexaframeCF-Bold` (10K counter, KEEPERS, KPR footer logo),
  `IBMPlexMono` 450 for captions/nav (11 px, tracking −.02em, uppercase, `"zero" on`).
- Dot caption: 5×5 px square dot + mono text, per-character reveal (each char an inline-block).
- `hacky-text`: a hidden spacer keeps the width, an absolutely positioned copy decodes in uppercase.
- `link-hover`: a `.bg` block slides in from −101% behind the label; text colour flips.
- Menu (`.the-menu`): underlay `linear-gradient(90deg,#fff 27.97%, #fff 75%)` at .85; panel black,
  60rem content + `--menu-width` bar (close / keeper mark / audio). Items Whyte 6.4rem; active item
  lime `#c0fb50` block with a notched corner SVG + green "PAGE 001" superscript; hover = white block.
- Preloader: white, 87rem × 1px bar (`#e1e1e1`, progress black, scaleX), mono "LOADING - 100%",
  a column of decoding file URLs on the right, `loading-triangles.svg`, an audio CTA ring that
  follows the pointer ("Click to enable sound").
- Footer: black, 4 columns 35rem tall with 1 px dividers (`#333` / line-light), mono 1.4rem
  uppercase links with the `link-hover` block, "Download brand book" outline button with a notched
  SVG background, giant KPR logo (`footer_kpr.svg`) revealed by a mask, legal row 8rem.

## Timeline from the video (s → what) and my screen plan

The user scrolls in bursts; the clone maps each act to **screens of scroll** (one master clock).

| Video   | Act                              | Screens (clone) | Notes                                                                                                                                                                                                                                                                                                                           |
| ------- | -------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–30    | Landing hold (+ menu demo 17–27) | 0 → 1.2         | Painted close-up, pointer parallax. Words `KEEP. / PROTECT. / REIMAGINE.` Whyte ~800, ~200 px at 1920, tracking ≈ −.05em, right/indent/left stagger; 01K/02P/03R mono index top-left of each word.                                                                                                                              |
| 30–34   | Landing → card                   | 1.2 → 2.2       | The painting **zooms out** (close-up → mid-shot, same character) while its **left edge pulls in** with a big 45° step: becomes a notched card ~60 % wide, full height, washed lavender; page behind white; HUD flips to black; text fades.                                                                                      |
| 34–47   | Project intro                    | 2.2 → 4.0       | `001` + "A FAMILIAR WORLD… SET / ON A DIFFERENT PATH." (h1 ≈ 68 px, 2 lines, first line indented); small landscape card (tab top-left) at left; character card (notch bottom-left, chamfer bottom-right) centre-bottom; tall card (tab top-right) right with play button + "Trailer V.004"; body bottom-left. Cards idle-float. |
| 47–55   | Intro → Story                    | 4.0 → 5.0       | Tall card swings to the right edge and turns edge-on (rotY ≈ 70°); character card grows, tilts and collapses into a vertical sliver (rotY); a sunset sliver with a top-right notch swings open from the left (rotY 80° → 0) and fills the screen.                                                                               |
| 55–64   | Story rows 1–3                   | 5.0 → 8.4       | GLB painting (`project-2048.glb`), baked camera clip scrubbed. HUD grid: horizontal hairline at ~55 % height, vertical at ~70 % width. `002` heading top-left, terminal block + ship top-right, coords + `33.8°` + topo point-cloud video bottom-right. `003` heading moves up/centre.                                          |
| ~65     | Glyph wipe                       | 8.4 → 8.9       | Tiled keeper-symbol pattern: rows of tall rounded pills alternating with rows of crosses/brackets; cells switch on at random, pills grow; then collapses to one big symbol. `header-sprite.webp` is a pre-rendered sheet of this pattern (not used: procedural shader instead).                                                 |
| 65–75   | Story row 4                      | 8.9 → 9.8       | Two figures from behind (GLB characters + hair flipbook), big white keeper symbol centred, "Keepers Symbol" caption.                                                                                                                                                                                                            |
| 75–82   | Collection intro                 | 9.8 → 11.2      | Scene card slides up/left as a sliver; vertical **10K** (Hexaframe, rotated 90°, ~210 px cap) counts up on the left; portrait card (notched) slides up from a sliver; crystal video over measurement lines (right top), `face-traits` card (right bottom).                                                                      |
| 82–100  | Gallery                          | 11.2 → 13.6     | Lavender (`#8B7ED9`) grows from the centre card to full bleed. `004` "10,000 UNIQUE DIGITAL / COLLECTIBLES." + body. **Convex** ring of portrait cards (camera outside the cylinder: centre big, sides foreshortened). Drifts, scroll-velocity, drag.                                                                           |
| 100–110 | → The Keep                       | 13.6 → 15.0     | Ring collapses into a 2-card box spinning on Y, cards scatter (3 notched cards of the Keep in 3D), main card grows to fullscreen. Caption "001 ■ The Keep", 3 centred lines, "click & hold" ring bottom-right.                                                                                                                  |
| 110–120 | → Factions                       | 15.0 → 16.4     | Handoff: current scene shrinks to a wide notched card (−3° tilt), slides up; next card rises from below with the opposite tilt; fills.                                                                                                                                                                                          |
| 120–130 | → The World                      | 16.4 → 17.8     | Same handoff.                                                                                                                                                                                                                                                                                                                   |
| 130–137 | Launch                           | 17.8 → 19.0     | KEEPERS (Hexaframe, full width, black), three small notched cards stacked in front; "Become a Keeper" caption + line.                                                                                                                                                                                                           |
| 137–148 | Footer                           | in flow         | Black footer slides over; KPR logo reveal.                                                                                                                                                                                                                                                                                      |

Easing feel: card moves are long in-out (strong), text arrives with a strong ease-out and line
masks; captions type per character; HUD labels decode.

HUD theme per act: landing **light text**, intro **dark**, story **light**, collection intro + gallery
**dark**, tableaux **light**, launch **dark**, footer light.

## Paintings are 3D scenes (pass 2, 2026-10-02)

Every painted card is a small glTF scene, rendered from its own camera into a texture the card shows
(`gl/PaintedScene.ts`). Planes sit at real depths, characters are FaceBuilder head meshes with the
painting projected on them, so moving the camera gives true parallax (the girl's head even turns).
Inspect any of them with `/kpr?debug=glb&name=landing` (also `collection`, `tableaux-keep`,
`tableaux-factions`, `tableaux-universe`, `project`; `&wire`, `&solo=<node>`, `&p=0..1`).

| File                                       | Content                                                             | Where                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `landing-2048.glb`                         | the girl: head mesh + hair/hand/jacket planes, sky plane (17 nodes) | hero front face (landing close-up = camera zoom 3.1 with a view offset → intro card) |
| `project-2048.glb`                         | the story painting, baked camera pan clip (10.4 s)                  | hero back face (clip scrubbed by scroll)                                             |
| `collection-2048.glb`                      | the 10K portrait (no background → cleared lavender)                 | hero front face after the second turn                                                |
| `tableaux-keep/factions/universe-2048.glb` | the three tableaux, static cameras                                  | keep / factions / world cards                                                        |

Effect planes in the files have no texture; they play flipbooks (`PAINTINGS[*].fx` in `data/media.ts`):
`kai_fx` → kai, `ship_fx` → beam-ship, `beams_fx` → beam, `energy_left/right_fx` → energy-left/right,
`magic_fx` → magic, `male_hair_fx` / `female_hair_fx` / `female_cloth_fx` → the hair/cloth sheets.
Flat card images (KTX2): `front-face` (trailer card), `card-keep`, `card-universe`, `card-factions`
(eyes). Unused: `back-face` (lavender mountains: the trailer card's back in the source, single-sided
here by request), `character-light` (green streak sheet, placement unknown), `pnoise0`,
`header-sprite` (barcode without the symbol), `tableau-cards.ae.json` (After Effects keyframes for
the tableaux's secondary cards). Frames per sheet: `/kpr?debug=flip&sheets=kai-0,kai-1&every=4`
(TexturePacker JSON, sorted by name). Every KTX2 at once: `/kpr?debug=textures`.

### One card, three faces

The hero card is the girl (front), turns half way to show the story (back), and turns again to show
the 10K portrait (front). `NotchedCard.faces` lists them in turning order; every half turn of `ry`
moves one step, and the hidden face is swapped while it faces away. The back face is mirrored in
the shader and the shape is evaluated in viewer space, so notch corners mean the same on both sides.
Single-sided cards (`.single()`, e.g. the trailer card) vanish past 90°.

Windows (screens): grow to full height 4.0–4.6, first turn 4.2–5.1, shrink to a sliver 9.7–10.15
(the logo symbol rides it, squashed by |cos ry|), second turn 10.15–10.9 (`gl/choreo.ts`).

### Pointer

Each card follows the pointer twice, at different speeds (`NotchedCard`): the frame leans toward it
(yaw/pitch, slower, ~3 /s) and the painting inside moves with it (camera travel against the pointer,
faster, ~5.5 /s; flat images shift their uv instead). The inner camera also turns with the frame's
lean (85 %), so the picture reads as a world behind a window rather than a print on the card. Cards
that nearly fill the screen stop leaning (`settleTilt`) but keep the inner parallax. Travel per
scene (`PAINTINGS[*].look`) is set from the nearest plane's distance to its camera; zoomed views
travel less (÷ zoom^0.65).

### Logo wipe

`logo-anim-low-res-0` (101 trimmed frames, 220×124): barcode rows fill the screen, drop out, the
keeper symbol stays (frame 92; 93–100 are a zoomed symbol, unused). It plays on its own clock at
48 fps once the film passes 8.35, holds on frame 92, rewinds 2.5× faster when scrolled back above
8.35. Drawn white with a thresholded alpha so the 124-px-tall frames stay crisp full screen.

## Pass 3 (2026-10-02, from `refs/kpr-PageLoader.mp4` and `refs/kpr-orangeScene.mp4`)

- **Opening** (`dom/hud/Intro.tsx`): after "enter", the black barcode (`header-sprite`, 131 frames)
  fills the screen while the real KPR wordmark (path from the saved HTML) builds left to right in
  slanted pieces; a slit opens in the middle and widens into the girl (`film.intro` drives the hero
  card through `introRect`); over the painting the letters turn white (a clipped white copy) and
  break apart; the landing words arrive. ~4.3 s, reduced motion skips it.
- **Card shape**: radius is automatic (≈ 5.8 % of the short side, 1.2–4.2 u) and every joint of the
  notch and corner cut is rounded too; a second notch (`notch2`) for the trailer card's lower-left step.
  Shapes of the intro and launch cards measured from the reference screenshots.
- **Pointer = rotation, never sliding**: the frame leans (±0.10 / ±0.16 rad), the painted scene's
  camera orbits a pivot (`PAINTINGS[*].orbit/pivot`), flat images turn inside the frame with a
  perspective warp (`uLook`). Different speeds per layer, damped per card.
- **Story** matches the recording: camera curve `storyProgress`, framing zoom 1.12, text column keyframes
  (`COLUMN` in `Story.tsx`), no extra ship sprite (the painting has its own ship).
- **10K → gallery**: three purple layers grow out of the portrait one after another (`LAV_SHADES`:
  darker, darker, gallery lavender).
- **Ring exit**: cards close into a small spinning box, then each turns away (one-sided) and vanishes.
- **Keep**: three cards rise from below while turning to face the viewer, centred; the main one opens.
- **Handoffs**: the outgoing and incoming cards share one curve (`handK`), tilted opposite ways,
  purple-tinted while travelling.
- **Launch**: three measured cards (world, keep tower, eyes) rise flipping into an interlocking stack
  over KEEPERS, with captions; they turn edge-on as the footer comes.
- Verified: 60 fps with 4× CPU slowdown (max frame 16.8 ms, ≤ 31 draw calls), lint + build pass.

## Decisions

- Cards are one shader (`NotchedCard`): SDF rounded rect minus a chamfered notch, a 45° corner cut,
  a front and a back face, grain + flicker, skew/chroma from scroll speed.
- One master clock in screens (`scroll/timeline.ts`); GL and DOM read pure functions of it, so
  everything reverses exactly. Reveals are time-based tweens fired on act enter (as the original).
  The logo wipe is the one exception: time-based once triggered (as the original).
- Reduced motion: the film snaps between act rest states with a short fade; no pointer motion, the
  logo shows its last frame directly.

## Build map

| Piece                                                                                                                   | File                                                      |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Master clock (windows in screens, rests, nav/theme per moment, eases, damp)                                             | `scroll/timeline.ts`                                      |
| Per-frame values (`film`) + coarse UI store (`useUi`)                                                                   | `scroll/useScrollStore.ts`                                |
| One RAF: Lenis → `film.t` → DOM updaters → R3F `advance()`                                                              | `KprPage.tsx` (`Clock`)                                   |
| Fixed canvas, asset load with real progress, cast build, painted scenes (rendered only when on screen), ship, logo wipe | `gl/Stage.tsx`, `gl/assets.ts`, `gl/LogoWipe.ts`          |
| Notched folder-tab card shader (SDF, front/back faces, pointer lean + inner parallax, grain/flicker, skew, chroma)      | `gl/materials/notched.ts`, `gl/NotchedCard.ts`            |
| Every card's state as a pure function of `t`                                                                            | `gl/choreo.ts`                                            |
| Painted glTF scene → texture (unlit planes, flipbook FX planes, camera clip, pointer travel, zoom)                      | `gl/PaintedScene.ts`                                      |
| Text-to-texture (KEEPERS)                                                                                               | `gl/text.ts`                                              |
| DOM anchors → GL rects (measured on resize/font load only)                                                              | `gl/layout.ts`                                            |
| Reveals by data attribute (`lines`, `chars`, `fade`, `hline`, `vline`, `hacky`)                                         | `dom/ui/reveal.ts`, `dom/ui/Text.tsx`, `dom/ui/useAct.ts` |

Timing: immersive presets from web-motion (strong out `0.16,1,0.3,1`, strong in-out `0.76,0,0.24,1`,
text 0.95 s, draws 1.3 s, 70 ms stagger, exits reverse at 2.2× speed). Scrubbed values stay linear
and are eased per value in `choreo.ts`.

## Verification (2026-10-02)

Tools (git-ignored): `.clone-analysis/tools/kpr_run.mjs` (Playwright, real GPU: `--use-angle=metal`).

- `node kpr_run.mjs shots <dir> 0.3,5.9,...` → frames at film screens; `?skip&replay` skips the
  loader and exposes `__lenis` / `__kprGL`. Side-by-side sheets vs the video in `.clone-analysis/kpr/cmp/`.
- `node kpr_run.mjs perf [--cpu=4] [--mobile --w=390 --h=844]` → steady scroll through the film.
  Results on Apple M4: p50/p95/p99 16.7 ms, max 33 ms (one frame), 0 frames over 33 ms; same with 4×
  CPU throttle, desktop and phone. ≤ 19 draw calls, 63 textures, 10 programs.
- The first story frame used to hitch (100 ms: GLB texture upload + compile) → warmed up behind the
  loader in `Stage.tsx`.
- Reduced motion: the film snaps between `RESTS` with a 160 ms fade; no parallax, glyph wipe or scrub.
- Zero React commits while scrolling (checked with the DevTools hook).
- `pnpm build` passes (TypeScript included); eslint clean on the module; `/landonorris` and
  `/aim-obys` render unchanged; git shows only new files.

## Known differences / to do

- All painted art is the reference's own (refs/KPR). The gallery ring has 12 reference portraits plus
  14 generated originals (`card-gen-*.webp`, gpt-image via codex, prompts in
  `.clone-analysis/kpr/gen/prompts.tsv`), cut with the reference cards' notch masks.
- The tableaux's secondary cards still use my own layout; `tableau-cards.ae.json` has the original
  After Effects keyframes (keep0 / factions0 / universe0, 1920×1080, ~5.6 s work area) if a later
  pass wants them exact.
- The original's two HUD copies masked against the card edges are simplified to a colour transition.
- The trailer video is missing (play opens a placeholder panel); the console button is disabled.
- Total payload is now ~44 MB (six GLBs ≈ 21 MB); all loaded behind the loader.
- Desktop only in this pass (phone/tablet were not re-checked).
