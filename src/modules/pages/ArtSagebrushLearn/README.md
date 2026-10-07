# Sagebrush, in marks

The approved direction (7 October 2026) is a ten-chapter guide for designers and generative artists, with warm paper, one sage UI accent, editorial type, and the interaction depth of `/art-solace/learn`.

## Architecture

- `Guide.tsx`: chapter routes via URL hashes, roving keyboard tabs, browser history, visited chapters, native scrolling, automatically discovered section navigation.
- `content/chapters.ts`: labels and chapter promises.
- `content/lessons.ts`: source-based explanations, designer analogies, vocabulary, code excerpts, experiments, caveats and 30 recall cards.
- `chapters/`: explicit lazy entry points. Only the selected chapter is mounted.
- `kit/Chapter.tsx`: the four-part teaching structure, source captions and recall cards.
- `kit/canvas.ts`: a single shared GSAP ticker; drawings pause off screen and while the document is hidden; cleanup removes both the callback and observer.
- `demos/FieldLab.tsx`: real heightfield/erosion/projection helpers, with cached fields so changing the sun or warp does not repeat erosion.
- `demos/InkLab.tsx`: the source ink and plant builders, with isolated paths/compositions. Playback starts only on request, including reduced-motion mode. Pausing retains the job and ink.
- `demos/Recipe.tsx`: seed record and copyable starter; the landscape link applies the two seeds, not the creative brief.
- `demos/Quiz.tsx`: one random recall question from each of the ten chapters, self-grading and links back to missed ideas.

The learning demos import the art modules directly. The guide does not carry a second noise generator or a simplified erosion implementation. Its opaque field marks, new contour threshold, INK paths and specimen-sheet layout are explicitly labeled as teaching/new compositions.

## Curriculum

1. Map: whole pipeline, then field → slope → projected mark stages.
2. Seeds: independent random choices versus a smooth seeded field.
3. Terrain: three Perlin octaves, sustain and row taper.
4. Erosion: source droplet model, before/after, its legacy approximations.
5. Light and slope: normalized direction, dot product and palette bins.
6. Pen: target geometry, attraction, damping, wobble, translucent dot scatter.
7. Plants: procedural plant grammar isolated from ecological placement.
8. Depth: retain the original ground row before projection; painter's ordering.
9. Studies: contour prints and ink lettering, plus the botanical atlas brief.
10. Build: an edition record, starter code, performance boundaries and final recall.

The guide uses the same incremental rendering principle it teaches. Static field studies have no animation loop. Ink studies share one ticker and draw at most 2,000 steps / approximately 6 ms per tick. The guide keeps native scroll; reduced-motion users get no chapter entrance animation, and all ink playback is explicit. There are no WebGL contexts to allocate or dispose.

## Verification

Run `node scripts/verify-sagebrush.cjs` from the repository root to check three fixed seed pairs against the original pre-refactor shape plans and 5,000 ink updates per pair. Run `pnpm exec tsc --noEmit` and targeted ESLint for both Sagebrush modules and the route.

Browser verification was performed in headless Chrome against the local Next dev server at 1440 × 1000 and 375 × 1000. All ten chapters mounted at both widths with four teaching sections each, zero page errors and no document-width overflow. Interaction checks covered slider keyboard input/reset, flashcards, direct chapter hashes, browser back/forward, arrow-key tabs, reduced-motion playback, pause/resume without clearing, off-screen suspension, chapter disposal, seed recipe output, all ten quiz answers and restarting the quiz.

A 120-frame sample on this host measured a 16.7 ms median / 16.8 ms p95 frame interval. After warming both pen and plant chapters, five round trips and explicit garbage collection, JS heap measured 20.8 MB before and 21.6 MB after; one guide canvas remained active. These are development-browser observations, not a device-wide performance guarantee or proof of zero retained memory. The source artwork still builds its world synchronously; only its drawing is frame-budgeted.

The hero is an export of the actual completed canvas for seeds 42 / 1337, not a generated illustration. Its source file is `public/all/sagebrush-field-guide.png`.
