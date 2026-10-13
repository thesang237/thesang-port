# Floema 2 — local reference study

Desktop study routes: `/floema-2/home` and `/floema-2/sustainability`. The source recording is `refs/floema-2/input.mp4` (1920 × 1000, 30 fps, 173.7 seconds). The recording determines composition and motion; supplied textures and identified public assets from https://floema.com/en and https://floema.com/en/sustainability supply the imagery. The user approved desktop-only scope and freedom in typography and placeholder imagery.

These are local, noindex study routes, not a production Floema website. No deployment or newsletter service is configured. Supporting copy is rewritten; product names and short brand headings identify the reference. Newsletter submissions stay in the current browser and say so explicitly. Search, product details, material information, journal previews, and privacy use local accessible dialogs.

## Reference clock

| Recording | Build position / interaction                              |
| --------- | --------------------------------------------------------- |
| 0–10s     | Sustainability hero, first viewport                       |
| 12–24s    | Three principles, rotating/growing charger, viewports 1–4 |
| 26–34s    | City quotation, viewport 4–5                              |
| 34–46s    | Charger photograph and hover hotspots, viewports 5–6.5    |
| 48–54s    | Materials editorial introduction, viewports 6.5–7.4       |
| 56–66s    | Recycled plastic, material track progress 0–⅓             |
| 68–72s    | HPL, material progress ⅓–⅔                                |
| 74–80s    | Steel, material progress ⅔–1                              |
| 82–96s    | Winter/summer comparison, below the material track        |
| 98–113s   | Integration, pillars, newsletter, footer                  |
| 114–115s  | Sequential route transition: 240ms exit + 560ms entrance  |
| 116–120s  | Home perspective image hero                               |
| 122–126s  | Urban, collection progress 0                              |
| 128–132s  | Nature, collection progress ¼                             |
| 134–138s  | RePlastic and Golf, progress ½ and ¾                      |
| 140–144s  | Details, progress 1                                       |
| 146–162s  | Editorial, featured products, collection hover index      |
| 164–173s  | Sustainability statement, pillars, newsletter, footer     |

Measurements at 1920 × 1000: 42px outer gutter; header top 32px, navigation height 48px; home heading 78px and approximately 960px wide; sustainability heading 58px at y≈204; collection text starts x494/y≈550; materials ring center x960/y505, radius≈456; description x42/y647; aside x1522/y454. CSS uses viewport-relative dimensions around these anchors. Recording palette samples: paper `#f0ebe6`, yellow `#e4e16c`, green `#022725`.

## Components and motion ownership

- `Shell.tsx`: persistent navigation, Lenis, route transitions, per-route ScrollTrigger context, dialogs and focus restoration. Lenis uses the GSAP ticker; cleanup removes it. Route fades only animate opacity, so they do not change the containing block of the fixed WebGL canvas.
- `Home.tsx`: perspective hero, sticky five-collection image sequence, editorial and collection exploration. Slide containers reveal with a vertical clip mask; images have 20% vertical overscan and a much slower 4% parallax movement.
- `ConnectedPills.tsx`: shared navigation and slide-button hover surface. Native HTML controls stay interactive while a small SVG connects their moving edges. Pointer glow, keyboard focus, rapid direction changes, resize measurement, and cleanup share one implementation.
- `Sustainability.tsx`: wireframe story, photograph hotspots, material controls, draggable cube, seasonal comparison. Tabs support arrows/Home/End; the cube supports arrow keys.
- `SceneLoader.tsx`: client-only R3F, static poster, error boundary, reduced-motion and context-loss handling.
- `Scene.tsx`: one canvas per page. Geometry is cached, owned resources are disposed, frame callbacks use mutable refs and Three.js objects rather than React state. DPR is capped at 1.5. Rendering stops offscreen and in hidden tabs. Plastic uses the supplied albedo and normal map; HPL uses its swatch; steel uses the supplied steel normal map and metallic response.
- `Shared.tsx`: shared pillars/footer and local newsletter confirmation.
- `data.ts`: identified collection assets, material descriptions, product catalogue, measured hero image positions.
- `styles.css`: styles scoped to `.f2-root`, including reduced motion, focus indicators, desktop sizing and compact fallback rules.

The material and collection tracks are reversible. Native document scrolling remains the source of truth. Reduced motion collapses long scroll tracks into directly selectable content and skips WebGL. Images and text remain server-rendered; JavaScript is needed for the interactive controls.

## Assets and deliberate differences

`public/floema-2/asset-manifest.json` identifies every bundled asset, its source and its use. Raster images are preoptimized WebP, capped at 1920px; textures retain their original encoding. Models use the repository's existing local Draco decoder. No new package dependencies or shared page changes are required.

The overall sequence, grid, palette, photographic assets and product geometry follow the recording. Supporting text and local dialog content are original. The cube's rotation is time/pointer/drag-driven, so its angle is not a frozen video-frame match. The source's worker renderer is rebuilt as idiomatic R3F; it is not executed. Desktop is the acceptance scope; compact CSS is a graceful fallback, not a validated mobile reference clone.

For inspection, `?debug=1` exposes `window.__floemaLenis` and `window.__floemaGPU`. Measurement sheets, production browser captures and validation logs are in the ignored `.clone-analysis/floema-2/` directory.

## Verification

- Production build and TypeScript pass. Scoped ESLint reports zero errors; its 39 advisory `no-img-element` warnings refer to intentionally preoptimized local images.
- Chromium tested at 1920 × 1000, 1440 × 900 and 1366 × 768. No horizontal overflow at the desktop sizes.
- Chromium, Firefox and WebKit checks cover navigation, reduced motion, material controls, product search and Escape dismissal. Three repeated route cycles retain one correctly sized canvas; browser Back also works.
- Captures compare home, sustainability and material scenes against extracted recording frames. Separate sheets record pointer pairs, route fades and hotspot hover states.
- A hardware-GPU Chromium run on Apple M4 / ANGLE Metal measured about 16.7ms median and 16.7–16.8ms p95 frame intervals in the hero, wireframe, material cube and full-page scroll passes. The material cube held the same interval under 4× CPU throttling. These are local measurements, not a guarantee for other hardware.
- Home renders 22 planes / 44 triangles. The wireframe uses 10 calls; the cube uses 2 calls / approximately 71k triangles. A visibility test checks that render-frame counts stop while offscreen.
- Newsletter validation/local confirmation, all image loads, scene reactivation at the top, lost-context posters, reduced-motion material switching, and the no-JavaScript heading/loader fallback are included in the browser checks.

Only the new route, module and `public/floema-2` directories are changed. Existing tracked files and other pages remain untouched.

## October 12 refinement pass

The two supplied screenshot crops and `Screen Recording 2026-10-12 at 20.59.54.mov` override the earlier recording for these interactions. The hover recording is 948 × 168 at 60fps. At 1.42s, the hovered About pill opens both adjacent connections while the right edge of the navigation stays fixed; the yellow highlight follows the pointer. Measured pill height is approximately 74px and the expanded separation approximately 44px. The implementation preserves that ratio: 48px height and 27.84px separation at 1920px viewport width, easing over 480ms. A subsequent user-requested change anchors the left edge and pushes the following controls right; reserved header space prevents a collision with the language control.

- Collection index: the blurred backdrop is removed. Each preview expands from 5vw to 25vw without rotating, at a constant 14.5vw height. At 1920px, the expanded box is 480 × 278px, matching the supplied 482 × 278px crop. Six images cycle every 850ms while the row is hovered or focused and the section is visible. Reduced motion keeps the selected image still.
- Hero: a perspective camera replaces the orthographic view. Images travel continuously toward the camera along fixed lanes, fade at the near/far limits, and recycle. Positive scroll velocity accelerates the travel and decays smoothly after scrolling; pointer movement no longer makes the image field drift.
- Collection slides: the parent stays anchored while its vertical mask reveals the image. At scroll positions 2050 / 2300 / 2550, the second mask reads 70.42% / 47.5% / 24.58% inset, while its image moves only −39.48 / −32.88 / −26.28px. Badge, heading, and CTA entrances begin at 60 / 140 / 240ms. Reversing scroll returns the mask to identical geometry.
- Charger handoff: the wireframe grows and rotates into the front view before the photograph reveals. Both share a centered 1064:1689 framing at 90vh height with their top at 10vh. The wireframe width is derived from the source model bounds, giving approximately 567px at the test viewport. Captured outer edges differ by about 3px. The photograph reveals in a fixed mask instead of sliding the product past the wireframe.
- Navigation and slide CTAs: connected SVG pill shapes push to the right around the hovered control, with a soft pointer-following highlight. Fast pointer changes overwrite existing tweens; keyboard focus uses the same treatment. Reduced motion disables the stretching.

The updated production pass has 29 general browser checks and 12 refinement checks passing. A separate render-level capture confirms the hero uses perspective, preserves fixed image lanes, and accelerates from 1.40 to 4.02 scene units per second during the tested downward scroll. Motion captures and logs are in `.clone-analysis/floema-2/revision/`; the full-page performance run is in `.clone-analysis/floema-2/final/results.json`. New checks cover fast hover recovery, focus hover, reverse scrolling, stagger timing, CTA dialog behavior, preview expansion/cycling, background removal, and reduced-motion navigation. The production build remains local at port 3002.

The interactive process breakdown is available at `/floema-2/learn`; its implementation and verification notes are in `src/modules/pages/FloemaTwoLearn/README.md`.
