# Cantera field guide

Approved curriculum: map, seeds, terrain, erosion, carving, projection, rays/light, stone/grain, living scale, build your own.

Approved visual direction: warm stone paper, charcoal ink and one clay accent; sans text with mono labels. A 4px spacing scale, hairline surfaces and double-ring keyboard focus follow UI-craft. Motion stays calm; reduced motion removes arrivals, disables smooth wheel scrolling and waits for explicit flock playback.

- `content/chapters.ts` owns prose, real source excerpts, prompts, source paths and 32 recall cards.
- `chapters/` contains independent lazy entry points. Only the active chapter mounts its studies.
- `kit/Lesson.tsx` enforces four sections with one Remember line each.
- `kit/art.ts` imports the artwork's helpers read-only. `studyField` is a smaller teaching recipe, not a replacement for Landscape.grow.
- `kit/canvas.ts` owns raster sizing and disposal. Static studies redraw on controls/resize; only the living study subscribes to the shared GSAP/Lenis clock. Its simulation advances in fixed 80ms steps.
- `demos/` contains source-helper studies and explicitly labeled simplified models. The original hero uses the full renderer at 270 × 480, then terminates its worker after printing.
- Tabs synchronize with hashes and browser history and support arrow/Home/End keys. TOC headings are observed from the mounted chapter.
- Quiz draws one card from each chapter and shuffles those ten, guaranteeing all topics are represented.

To add a chapter, add its data, its lazy view and its demo. Reuse the source helpers; keep new drawing styles and artistic recipes inside this guide. Never increase the source's global random consumption to support a demo.
