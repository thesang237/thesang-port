# Floema 2 — interactive field guide

Route: `/floema-2/learn`. The designer approved the 12-chapter curriculum and the dark-slate / icy-accent visual direction. The audience is UI/UX product designers: visible behavior first, design-tool analogy next, a live experiment, then short source excerpts.

## Structure

- `Entry.tsx` loads the guide on the client. The route supplies metadata and CSS immediately.
- `Guide.tsx` provides the hero, how-to-use section, hash-synced chapter tabs, observed table of contents, explored-chapter persistence, and previous/next navigation.
- `catalog.ts` is the chapter order and the pool of 36 recall cards. `Quiz.tsx` draws 10 cards from that pool, supports self-grading and restart, and links missed ideas to their chapters.
- Each of the 12 `chapters/` modules is lazy-loaded. `Chapter.tsx` applies the same four-part teaching pattern without duplicating layout logic.
- The 14 labs are independent teaching copies. They use the actual `clamp`, `motion`, `gsap`, and ScrollTrigger exports from the source read-only. The depth lab also uses the source’s measured `heroTiles` positions, with neutral procedural artwork.
- `kit/runtime.ts` provides parameter state plus mutable frame values and an offscreen-aware GSAP ticker. The existing Floema shell owns Lenis; the guide does not create another document scroller.
- `kit/ThreeStage.tsx` owns a single WebGL renderer for the open 3D lab. It pauses offscreen and in hidden documents, starts still, responds to controls, and disposes geometry, materials, textures, environment targets, instancing buffers, the renderer, and its context on unmount.
- `learn.css` scopes the theme, fixed reading type scale, host `pre` reset correction, hidden source chrome, focus rings, responsive controls, and reduced-motion behavior to this guide.

The only source interaction change made alongside the guide is the separately requested rightward pill hover: the first piece remains fixed and later pieces sum the preceding opened gaps. The header reserves space for the expansion before the language control.

## Source inventory

| Technique                | Source                                          | Teaching focus                                                                   | Fragile point                                         |
| ------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Layer ownership and grid | `Shell.tsx`, `styles.css`, `motion.ts`          | 42px reference gutter; DOM above one canvas; numbers between input and rendering | A transformed ancestor changes fixed positioning      |
| Smooth scrolling         | `Shell.tsx`                                     | Lenis lerp 0.085; GSAP seconds converted to milliseconds; no second RAF          | Duplicate clocks, scroll lock cleanup                 |
| Sticky collections       | `Home.tsx`, `styles.css`                        | 900vh track; linear mask timeline; 4% inner parallax and 20% overscan            | Mask movement confused with whole-image movement      |
| Text choreography        | `Home.tsx`, `Shell.tsx`, `styles.css`           | 700ms, 18px; badge/heading/action at 60/140/240ms                                | Long delays, clipped type, competing transform owners |
| Forward image field      | `Scene.tsx`, `data.ts`                          | 35° perspective camera at z20; cruise 1.4, boost 5; 4–30 distance loop           | Visible recycling, variable-refresh-rate drift        |
| Wireframe/photo handoff  | `Scene.tsx`, `Sustainability.tsx`               | Shared 1064:1689 framing; photo at 90vh, top at 10vh                             | Scale mismatch along the wipe seam                    |
| Materials                | `Scene.tsx`, `Sustainability.tsx`               | Roughness 0.85/0.85/0.5, metalness 0.08/0.08/0.62; normal strength 0.55          | Colour-space errors, no environment for metal         |
| Hover and previews       | `ConnectedPills.tsx`, `Home.tsx`                | Gap 0.58 × height, 480ms stretch; 850ms image cycle                              | Interrupted hovers, collisions, offscreen timers      |
| Page transitions         | `Shell.tsx`                                     | Exit 240ms → route → enter 560ms; scroll/focus recovery                          | Route-wrapper transforms resize the fixed canvas      |
| Accessible interaction   | `Sustainability.tsx`, `Shell.tsx`, `Shared.tsx` | Native ranges, focusable hotspots, dialog cleanup                                | Hover-only content and trapped focus                  |
| Performance              | `Scene.tsx`, `SceneLoader.tsx`                  | DPR cap 1.5, mutable dials, owned-resource disposal                              | Software GPU measurements and leaked contexts         |
| Rebuilding               | `motion.ts`, source README                      | Storyboard → static layout → behavior → motion → measurement                     | Polishing effects before the composition works        |

## Intentional teaching differences

The labs use neutral vector landscapes, a simplified station silhouette, a rounded cube, and procedural image cards. They explain the mechanics without bundling the source’s brand assets again. The handoff lab is a two-layer screen-space diagram; the depth, material, and performance labs are real WebGL. The benchmark’s pixel-cost ratio is explicitly an estimate; frame interval and draw calls are live renderer observations. The generator is a JavaScript/React starter and explicitly asks the reader to add their reduced-motion layout before shipping.

No autoplay is required to understand the 3D lessons. Readers explicitly start and stop their motion. Reduced-motion reading removes chapter travel, animated preview resizing, reveal travel, and image cycling. All content remains readable, and manual dials continue to work.

## References

The implementation is based on the local source, with API behavior checked against the official [Lenis integration](https://github.com/darkroomengineering/lenis#gsap-scrolltrigger), [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), and [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

Verification artifacts and screenshots are kept locally in `.clone-analysis/floema-2/learn/`. The production build is served locally at port 3002; nothing is deployed.

## Verification

- Production build and a separate TypeScript run complete successfully. Scoped ESLint has zero errors and zero warnings.
- All 12 chapters mount in Chromium at 1440 × 1000 and 375 × 900 with four teaching sections, three recall cards, working demos, and no horizontal overflow. Every recall card opens. Firefox and WebKit also pass all 12 chapter mounts at 375px, recall and quiz interaction, and reduced-motion checks.
- Hash deep links survive reload; browser Back/Forward restores the selected chapter; arrow keys navigate the tablist; the current tab stays visible on narrow screens.
- Targeted controls pass: reversible scroll masks, source material presets, rightward hover, cycling previews, comparison range, focusable hotspots and Escape, transition sequencing, generated scene count, quiz grading/restart, and no reduced-motion autoplay.
- GPU tests confirm offscreen pause, one active canvas, stable resource counts across five chapter switches, and disposal after leaving a 3D chapter. The revised camera dial changes the lens without also resizing the world; Reset recreates the original still scene. The benchmark keeps 1/22/120/300 objects in frame and measures the expected call count; instancing reduces it to one call.
- The current Chromium environment reports 33.3ms median / 33.4ms p95 even on an empty page; the guide matched that cadence. Therefore this session’s normal frame-time check does **not** establish a 60Hz guide result. An uncapped diagnostic rendered 120 additional hero frames during a 1.8-second sample, with 17.9ms p95 RAF intervals; that diagnostic is recorded separately and is not a normal-browser FPS guarantee. Earlier 60fps figures in the lessons refer specifically to the measured source pages.
- Leaving the guide restores the source header, typography scope, and single canvas. The source navigation and slide CTA push right without colliding with the language control.

The final memory probe measured one geometry and three textures on each material-scene visit. After forced GC, JavaScript heap grew from 7.56MB to 8.72MB across five cycles (including route/lazy-module warmup); this is recorded as an observation, not a claim of perfectly flat heap usage. A forced WebGL context loss correctly displayed the designed fallback.
