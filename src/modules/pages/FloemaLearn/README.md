# Floema, explained

A chapter guide at `/floema/learn` for product designers moving into creative development. Thirteen focused studies explain the actual Floema implementation, with 39 flashcards, a pooled ten-question quiz, and a motion-brief planner.

## Structure

- `Guide.tsx`: reading shell, hash-synced tabs/history, visited chapters, heading TOC, GSAP-driven Lenis wheel smoothing.
- `content/chapters.ts`: chapter promises, core logic, remix ideas, source paths, and recall cards. `excerpts.json` contains short excerpts extracted from the unchanged Floema modules, with original line numbers.
- `chapters/`: separate lazy bundles. Only the selected chapter and its demo are mounted.
- `demos/`: neutral teaching copies that isolate each rule. They import the actual easing/math from `Floema/motion.ts`. Simplifications are labeled in the visible demo captions: the shared-position study uses SVG; the product study uses CSS 3D; the loop is shown horizontally; the batch benchmark uses identical materials.
- `kit/`: controls, teaching blocks, glossary, flashcards/quiz, one-clock callbacks, timed-animation pause behavior, and a small Three.js lifecycle harness.
- `learn.css`: scoped theme, fixed reading type, mobile reflow, focus states and a scoped repair of the host’s `pre` reset.

The guide does not modify the experience’s modules. `FloemaRouteBoundary.tsx` is the routing integration: source views retain their persistent experience, while the learning route renders nested children and uses normal document scrolling.

## Demo lifecycle

No ambient demo starts moving automatically. Continuous playback has an explicit switch. Continuous callbacks use GSAP’s ticker, stop off screen or in a hidden tab, and are removed on unmount. Timed motion uses scoped `useGSAP`, reverses/retargets when appropriate, and pauses off screen. Reduced motion removes large timed travel/flip and disables guide wheel smoothing; readers can explicitly inspect static progress states or start and stop a teaching experiment.

Each Three.js study owns one renderer, one scene, and its resources. It caps DPR at 1.5, resizes with its container, displays a WebGL fallback, and disposes resources/renderer plus loses its context on chapter change. The performance demo reports actual renderer counters and unmodified clock intervals, not invented FPS. Instancing is presented as a controlled experiment, not as a claim that Floema’s different photo materials can be instanced unchanged.

Verification is in `docs/floema/learn-verification.md`. Chapter scope and source inventory are in `docs/floema/learn-plan.md`.
