# Floema reference rebuild

Fresh implementation of `/floema`, `/floema/collections`, and `/floema/about` using Next.js App Router, `@gsap/react`, and React Three Fiber. The superseded Floema components, styles, hooks, shaders, and store are removed. Only reference photographs, fonts, and the vector logo are reused.

## Source and content

Reference: `/Users/sang/Documents/dev/mengto/Floema-Vite-main`, inspected on 2026-10-07. Local `_site/index.html` supplies rendered content; the source's configured Prismic adapter supplied the authored rich text and product IDs. No CMS credentials are included in this rebuild. All 57 image assets are served locally (about 9.1 MiB combined, largest dimension 2000 px).

The user approved correcting the reference's content bugs:

- Render authored About paragraphs and footer links instead of the `isFilled.richText()` boolean.
- Resolve details by product ID, instead of pairing independently ordered CMS lists by their array index.
- Retain the CMS's original gallery order, repeat entries, exact collection descriptions, product copy, and external destinations. Existing Lorem Ipsum fields in the CMS are preserved rather than invented.

## Structure

- `FloemaExperience.tsx`: route-scoped lifecycle, persistent view stage and canvas, preferences, input-independent animation clock, navigation curtain. Route page files supply metadata; the layout stages their visual content to preserve exits across App Router history changes.
- `scene.ts`: typed imperative animation state and shared layout mathematics. The GSAP clock and R3F read the same values; frame updates do not trigger React renders.
- `motion.ts`: reference easings and shared timing tokens.
- `canvas/Scene.tsx`: one WebGL context, shared plane geometries, front/back product textures, portrait deformation, curved About galleries. Textures and geometry are disposed on unmount.
- `components`: reusable character-roll controls, oval outline drawing, intro, vertical titles, rich text, and accessible product dialog.
- `pages`: page-specific DOM, measurement, and animation choreography.
- `data/content.json`: static, typed-at-the-boundary CMS snapshot; runtime never depends on Prismic.
- `floema.css`: styles scoped to `.floema`; the reference's fluid unit is expressed as `--f`, without changing the portfolio's root font size.

The mutable scene object is an external renderer runtime, deliberately not reactive UI state. Narrow ESLint comments explain that exception to the React compiler's generic immutability heuristic. Selection and collection labels remain React state.

## Measured layout and motion

| Behavior              | Reference value                                                |
| --------------------- | -------------------------------------------------------------- |
| Desktop unit          | viewport width / 192                                           |
| Phone unit            | viewport width / 75; breakpoint 768 px                         |
| Camera                | perspective 45°, z = 5                                         |
| Home columns          | 5 desktop, 2 phone                                             |
| Home image alpha      | 0.4                                                            |
| Title cycle           | 219.6 units; labels 16 units                                   |
| Gallery card          | 35.76 × 50.48 units; 10.6-unit inter-card gap                  |
| Expanded card         | 55.4 × 78.2 desktop; 66.1 × 93.4 phone                         |
| About gallery card    | 30.9 × 43.7 units; 8-unit gap                                  |
| Page cover / uncover  | 1.5 s each, expo.inOut, sinusoidal edge                        |
| Product flip          | 2 s, expo.inOut, full 360° rotation, model photo on back       |
| Link / button letters | 0.5 s; 20 / 10 ms stagger                                      |
| Oval outline          | 1 s, cubic-bezier(.77,0,.175,1)                                |
| Paragraph reveal      | 1.5 s; 100 ms per line                                         |
| Smooth response       | reference 0.1 / 0.07 at 60 Hz, converted to delta-time damping |

The source's randomly rotated portraits use deterministic seeds here, and all continuous motion has the same speed on 60/120 Hz screens. Wheel-down advances collections; drag-left does the same. Keyboard arrows, Home/End, focus trapping, Escape, visible focus, reduced motion, and image fallbacks make the original interactions usable beyond a mouse. Reduced motion removes ambient movement and 3D flips. The persistent layout holds the outgoing view through the curved cover, then mounts the destination. Site links and browser Back/Forward share this sequence; Next.js still owns URLs, metadata, prefetching, and history.

## Validation

See `docs/floema/verification.md` for observed checks and remaining coverage limits.
