# Floema learning guide

Audience: UI/UX designers moving into creative development. Chapter guide at `/floema/learn`. Teach the visible result, a familiar design analogy, a live experiment, then the minimum code needed to recreate it.

## Source inventory

| Technique                                 | Source inside `src/modules/pages/Floema/`                           | Values / fragile point                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Input → shared numbers → DOM and GPU      | `FloemaExperience.tsx`, `scene.ts`, `context.ts`                    | React holds discrete page/product state; ticker holds continuous motion                                        |
| Frame-independent damping                 | `motion.ts`, `FloemaExperience.tsx`                                 | 0.1 home/collections, 0.07 About; delta capped at 0.05s                                                        |
| Wheel, drag, keyboard                     | `hooks/useGesture.ts`, `pages/*.tsx`                                | Wheel units normalized; capture after 6px; suppress the subsequent click                                       |
| Infinite portrait grid / giant titles     | `scene.ts`, `pages/Home.tsx`, `components/VerticalTitles.tsx`       | Modulo wrap; 5 desktop / 2 phone columns; 120px/s drift                                                        |
| Perspective camera / pixel alignment      | `canvas/Scene.tsx`                                                  | 45° camera at z=5; screen pixels converted into world units                                                    |
| Photo depth entrance / speed bend         | `canvas/Scene.tsx`                                                  | 20×20 plane subdivisions, 2s entrance, 0.16s batch stagger, sine displacement                                  |
| Letter roll / oval line draw              | `components/AnimatedControl.tsx`                                    | 0.5s letters, 0.01/0.02s stagger, 1s measured SVG path; reverse on leave                                       |
| Intro / masked text / once reveals        | `components/Intro.tsx`, `pages/About.tsx`                           | 1.5s lines + 0.1s stagger; autoSplit; played state survives resize                                             |
| Collection selection / caption handoff    | `pages/Collections.tsx`, `scene.ts`                                 | 46.36u card step; old group exits before new enters; kill interrupted timeline                                 |
| Card float / tilt / dimming               | `scene.ts`, `canvas/Scene.tsx`                                      | Shared cardPose function aligns transparent HTML buttons with GPU cards                                        |
| Product flip / expansion / text / icons   | `pages/Collections.tsx`, `components/ProductDetail.tsx`, `scene.ts` | One 0→1 expansion value, 2s expo.inOut, 360° flip; details begin after 0.5s                                    |
| Dialog and native phone scrolling         | `components/ProductDetail.tsx`                                      | Measured destination rectangle, scroll offset, Escape, focus loop and restoration                              |
| About smooth scroll / photo parallax      | `pages/About.tsx`, `FloemaExperience.tsx`                           | ±50px desktop / ±10px narrow; scale 1→1.15; cache measurements on resize                                       |
| Curved looping rows / highlights / footer | `canvas/Scene.tsx`, `pages/About.tsx`                               | Cosine arc, position-dependent tilt, 60px/s drift; highlights scale 1.2→1; footer moves in normal content flow |
| Route wipe / history / focus              | `FloemaExperience.tsx`                                              | Full viewport SVG; cover 1.5s, route change, rotated uncover 1.5s; 0.12s reduced motion                        |
| GPU lifecycle / fallback                  | `canvas/Scene.tsx`, `floema.css`                                    | Shared planes and textures; DPR capped at 1.5; cull objects; DOM fallback; dispose owned resources             |

## Curriculum

The map → Motion → Gestures → Infinite loops → WebGL photos → Hover details → Text reveals → Collections → Product opening → About galleries → Page transitions → Performance → Build your own.

Each chapter: short idea and designer lens, 1–2 adjustable teaching demos, a trimmed source excerpt with highlighted lines, an experiment that exaggerates or breaks the effect, one remember line, 3 flashcards, and source file links. The final chapter pools 10 quiz questions and generates a small motion brief. Demos use neutral artwork so they can be reused.

The guide imports `motion.ts` helpers read-only. Source modules remain untouched. A route boundary is required because the existing Floema layout owns all three source views and does not render nested children.

The designer approved the scope on 2026-10-08 and asked for good demos, with interactivity optional. The guide uses the proposed dark slate theme with an icy accent, Inter body text and mono labels. Demos are interactive where changing a value helps explain the rule.

## Observed source runtime

2026-10-07, Chromium in-app browser, warm development build on the local machine: one canvas throughout home → About; no console errors. Home frame probe: median 8.3ms, p95 9.4ms, 15 draw calls, 12,000 triangles, 13 resident textures, one geometry. About at its initial viewport: median 8.3ms, p95 9.3ms, seven calls, 14 triangles, 15 resident textures, two geometries; 30 text reveal blocks. These are observed frame intervals at the tested viewport, not a GPU benchmark or a promise for other devices. Previous desktop/phone source checks are recorded in `verification.md`.
