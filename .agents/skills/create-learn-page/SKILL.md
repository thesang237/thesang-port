---
name: create-learn-page
description: Checklist for building a /learn page in THIS repo — chapter guide (default) or single page, the reusable kit in src/modules/pages/IglooLearn, this site's CSS quirks, hydration safety and pre-commit ESLint compliance. The general process (curriculum, teaching pattern, demo types) lives in the global create-learn-page skill.
---

# Create a `/learn` Page (this repo)

Use this skill when building any `/[page]/learn` breakdown for a project page in this repo.
The general method — study the source, plan chapters, teaching pattern, demo types, verification —
is in the global **create-learn-page** skill (ts-design-skills). This file adds what is specific to
this codebase.

## 0. Pick the format

| Format                      | When                                                              | Reference implementation                                                      |
| --------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Chapter guide (default)** | A page with several techniques (scroll + 3D + text + interaction) | `src/modules/pages/IglooLearn/` → `/igloo/learn`                              |
| Single long page            | One effect, 8–12 steps                                            | any older learn page, e.g. `src/app/[locale]/google-countdown/learn/page.tsx` |

Ask the designer which one before starting, and show the chapter plan before building.

---

## 1. Chapter guide (default)

### Files

```text
src/app/[locale]/<slug>/learn/
  layout.tsx     # export const metadata (page.tsx is a client component, so metadata lives here)
  page.tsx       # 'use client'; import the scss HERE; dynamic(() => import(Guide), { ssr: false })
src/modules/pages/<Slug>Learn/
  <Slug>LearnPage.tsx   # shell: ReactLenis root + gsap.ticker, hero, tabs, TOC, chapter view
  learn.scss
  content/{chapters,cards,glossary}.ts
  kit/{ui.tsx,controls.tsx,loop.ts,gsap.ts,math.ts,glsl.ts,scramble.ts,Flashcards.tsx}
  chapters/*.tsx        # one per tab, lazy-loaded
  demos/*.tsx           # one per demo
```

**Copy `IglooLearn/kit/`, `IglooLearn/learn.scss`, `content/chapters.ts` shape and the shell as the
starting point**, then rename the root class and swap the accent tokens. Don't import from another
page's learn module; copy, so each guide can evolve on its own.

### Reuse the source page read-only

- Re-export the source's pure helpers from `kit/math.ts` / `kit/glsl.ts`
  (e.g. `export { damp, rng } from '@/modules/pages/<Slug>/utils/math'`) so demo numbers match.
- Never edit files under the source page's module while building its guide.
- Transcribe choreography (timelines, configs) as data in `content/` with a comment pointing to the
  source lines.

### This repo's quirks (all bit us once)

| Quirk                                                                                                                  | Fix                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Root font-size scales with the window (`_reboot.scss` → `dynamicOnWidth`), so Tailwind `rem` spacing is ~60% of normal | In `learn.scss`: `html:has(.<root>) { font-size: 16px; }`                                                   |
| `_reboot.scss` sets `pre, blockquote { all: unset }`                                                                   | `.<root> pre { display: block; }`                                                                           |
| Tailwind breakpoints are only `sm: 768px` and `lg: 1200px` (no `md`)                                                   | Design two-step layouts (stack < 1200, side controls ≥ 1200)                                                |
| Stylesheet imported in the lazily loaded module went missing after hot reload                                          | Import `learn.scss` in the route `page.tsx`                                                                 |
| Internal links                                                                                                         | `Link` from `@/i18n/navigation` (or `TransitionLink`); plain `<a target="_blank">` only for "open original" |
| Code blocks                                                                                                            | `CodeBlock` from `@/components/code-block` (shiki web bundle has tsx, glsl, bash)                           |
| React Scan overlay in dev                                                                                              | Toggle it off in its toolbar before screenshots                                                             |
| Dev server may already run on :3100 from another session                                                               | Attach to it (preview with a URL) instead of starting a second one                                          |

### Verify (see the global skill for the scripts)

- `npx tsc --noEmit -p . 2>&1 | grep <Slug>Learn` — no `timeout` wrapper (not on macOS); confirm it ran
- `npx eslint --fix src/modules/pages/<Slug>Learn "src/app/[locale]/<slug>/learn"` → 0 problems
- Click through every tab: zero console errors; `scrollWidth === clientWidth` at 375px and 1440px
- 3D demos pause off screen and dispose on tab change

---

## 2. Single long page (older format)

- Path: `src/app/[locale]/[page-slug]/learn/page.tsx`, first line `'use client';`
- Shared components: `CodeBlock` from `@/components/code-block`, `FadeIn`/`NOISE_BG` from `@/components/fade-in`
- Inline primitives: `Tag`, `StepBadge`, `Pill`, `SectionRule`, `Callout` (tip/info/warn), `DemoShell` — copy from an existing learn page and swap the accent
- One accent family per page (dithering amber, grid-hover violet, art-sagebrush emerald, omma-3d-cubes sky, r3f-bulge rose)
- Step anatomy: `StepBadge` + `Tag` + `h2` → 2–4 sentences → `CodeBlock` → optional `Callout` → optional `DemoShell` → `SectionRule`
- 8–12 steps, one concept each; every non-trivial concept gets an interactive `DemoShell` with its controls inside; prefer `useGSAP`

---

## 3. Hydration checks (server-rendered learn pages)

Chapter guides load with `ssr: false`, so these matter for single-page learn pages only. Grep before shipping:

| Pass                       | Pattern                                               | Rule                                                                            |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| HTML entities              | `&[a-z]+;\|&#[0-9]+;` in tsx                          | Use the character or a JS string: `{"they're"}`, `—`, `{' '}`                   |
| Browser globals in render  | `typeof window\|window\.\|document\.\|localStorage\.` | Move into effects, handlers or lazy initialisers                                |
| Random/time initial state  | `useState\(Math\.random\|useState\(Date\.now`         | Stable initial value, real value later                                          |
| Canvas outside effects     | `\.current\.(getContext\|drawImage\|width)`           | Only inside `useEffect` / `useGSAP`                                             |
| Block inside `<p>`         | `<p[^>]*>[\s\S]*?<(div\|h[1-6]\|ul\|table)`           | Use `<div>`                                                                     |
| Mixed inline text          | text next to `<em>/<strong>/<code>/<Pill>`            | Every text segment as a `{'…'}` literal (Prettier line-wrapping changes spaces) |
| `suppressHydrationWarning` | —                                                     | Keep only with a comment explaining why                                         |

---

## 4. Pre-commit ESLint (rules that blocked commits here)

| Rule                                                      | Write it like this from the start                                                                                                                                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react/no-unescaped-entities`                             | `{"they're"}` — never HTML entities                                                                                                                                                                                          |
| `react/jsx-no-comment-textnodes`                          | Text starting with `//` (e.g. `////// 01 — Portfolio`) → `{'////// 01 — Portfolio'}`                                                                                                                                         |
| `react-hooks/set-state-in-effect`                         | Don't `setState` in an effect body (and don't hide it in `setTimeout`). Read hash/localStorage in `useState(() => …)`; update state in event handlers; effects only write to the outside world (storage, DOM, subscriptions) |
| `react-hooks/use-memo`                                    | `useMemo(() => build(), [])`, not `useMemo(build, [])`                                                                                                                                                                       |
| `@typescript-eslint/no-misused-promises`                  | GSAP tweens are thenable: use block bodies in `forEach((el) => { tween(el); })`; SplitText `onSplit` returning a tween needs a one-line disable comment with the reason                                                      |
| `no-return-assign`                                        | No `(x) => (a = b)`; use a block body                                                                                                                                                                                        |
| `@typescript-eslint/no-unused-expressions`                | No comma expressions `() => (a(), b())`; use a block body                                                                                                                                                                    |
| `@next/next/no-html-link-for-pages`                       | Internal links via `Link` from `@/i18n/navigation`                                                                                                                                                                           |
| `no-param-reassign`                                       | Copy params into locals before mutating                                                                                                                                                                                      |
| `unused-imports` / `no-unused-vars`                       | Remove, or prefix with `_`                                                                                                                                                                                                   |
| `simpleImportSort/imports`                                | Groups: styles → react/next/packages → `@/` → `../` → `./` (eslint --fix sorts)                                                                                                                                              |
| `consistent-type-imports` / `consistent-type-definitions` | `import type`; `type` not `interface` (except `declare global`)                                                                                                                                                              |
| `no-loss-of-precision`                                    | No integer literals beyond `Number.MAX_SAFE_INTEGER`                                                                                                                                                                         |
| `react-hooks/exhaustive-deps`                             | List deps, or a disable comment with the reason                                                                                                                                                                              |

## Pre-ship checklist

- [ ] Format agreed with the designer; chapter plan approved
- [ ] Stylesheet imported in the route; root font-size and `pre` fixes scoped to the guide root
- [ ] No file under the source page's module changed
- [ ] Type-check and lint really ran and pass (0 problems)
- [ ] Every tab mounts with zero console errors; hash, back/forward and TOC work
- [ ] No sideways scroll at 375px and 1440px on any tab (`overflow-x: clip` on the root)
- [ ] Every demo: hint, dials with meanings, reset, "try this"; 3D demos pause off screen and dispose
- [ ] Flashcards per chapter, final quiz, "In the source" chips
- [ ] Single-page format only: hydration passes clean
