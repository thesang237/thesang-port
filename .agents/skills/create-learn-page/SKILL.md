---
name: create-learn-page
description: Full checklist for building a /learn page — structure, components, theming, hydration safety, and pre-commit ESLint compliance.
---

# Create a `/learn` Page

Use this skill when building any `/[page]/learn` breakdown for a project page.

---

## 1. Learn Page Requirements

### Route & file

- Path: `src/app/[locale]/[page-slug]/learn/page.tsx`
- First line: `'use client';`

### Accent color

Pick one Tailwind color family as the page accent (examples from existing pages):

| Page slug     | Accent  |
| ------------- | ------- |
| dithering     | amber   |
| grid-hover    | violet  |
| art-sagebrush | emerald |
| omma-3d-cubes | sky     |
| r3f-bulge     | rose    |

Apply consistently to `Tag`, `StepBadge`, `Callout tip`, rule gradients, and active button states.

### Required shared components

```tsx
import { CodeBlock } from '@/components/code-block';
import { FadeIn, NOISE_BG } from '@/components/fade-in';
```

`NOISE_BG` goes on the outermost wrapper `<div>` as a className alongside `min-h-screen text-white`.

### Required primitive components (define inline in the file)

| Component     | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `Tag`         | Accent-colored label badge above each step title    |
| `StepBadge`   | Circled step number, accent color                   |
| `Pill`        | Inline monospace code reference in prose            |
| `SectionRule` | Horizontal rule between major sections              |
| `Callout`     | `tip` / `info` / `warn` bordered note block         |
| `DemoShell`   | macOS-style window frame wrapping interactive demos |

Copy these verbatim from any existing learn page and swap the accent color tokens.

### Page shell structure

```tsx
export default function LearnPage() {
    return (
        <div className={`${NOISE_BG} min-h-screen text-white`}>
            <FadeIn className="max-w-3xl mx-auto px-6 py-20 space-y-6">
                {/* Back link */}
                <Link href="/[page-slug]" className="...">
                    ← back
                </Link>

                {/* Page title block */}
                <div>
                    <h1 className="text-3xl font-black tracking-tight">...</h1>
                    <p className="text-zinc-400 ...">One-sentence summary</p>
                </div>

                <SectionRule />

                {/* Steps */}
                {/* ... */}

                <SectionRule />

                {/* Final summary / checklist */}
            </FadeIn>
        </div>
    );
}
```

### Step anatomy

Each step follows this structure — never deviate:

```tsx
<div className="space-y-5">
    {/* Header */}
    <div className="flex items-start gap-3">
        <StepBadge n={N} />
        <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
                <Tag>CATEGORY</Tag>
            </div>
            <h2 className="text-xl font-bold">Step Title</h2>
        </div>
    </div>

    {/* Prose explanation — 2–4 sentences */}
    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>...</p>

    {/* Code block (always present) */}
    <CodeBlock lang="tsx">{`...`}</CodeBlock>

    {/* Optional callout */}
    <Callout variant="tip">...</Callout>

    {/* Optional interactive demo */}
    <DemoShell title="demo.tsx">
        <SomeInteractiveComponent />
    </DemoShell>
</div>

<SectionRule />
```

### Step count

Aim for **8–12 steps**. Each step covers exactly one concept. Never combine two unrelated concepts in a single step.

### Interactive demos

- Every non-trivial concept should have a `DemoShell` with a live interactive component.
- Controls (sliders, buttons) go inside `DemoShell`, not outside.
- Demo components must be pure React — no side-effects outside `useEffect` / `useGSAP`.
- Prefer `useGSAP` over `useEffect` for any GSAP animation inside demos.

---

## 2. Hydration Checks

Run these Grep passes before shipping. Each targets one class of SSR/CSR mismatch.

### Pass 1 — HTML entities in JSX text

```
pattern: &[a-z]+;|&#[0-9]+;
file types: tsx, jsx
```

HTML entities produce different text-node boundaries between SSR and CSR.

| Bad             | Good              |
| --------------- | ----------------- |
| `they&apos;re`  | `{"they're"}`     |
| `&mdash;`       | `—`               |
| `&nbsp;`        | `{'\u00A0'}`      |
| `&amp;`         | `&`               |
| `&quot;`        | `"`               |
| `&lt;` / `&gt;` | `{'<'}` / `{'>'}` |

> **Note on `react/no-unescaped-entities`:** ESLint wants `&apos;` for raw `'` in JSX text, but that causes hydration errors. Resolution: wrap the whole text fragment in `{"..."}` using a double-quoted JS string — this satisfies both the linter and the hydration rule.

### Pass 2 — Browser globals in render

```
pattern: typeof window|window\.|document\.|localStorage\.|sessionStorage\.|navigator\.
file types: tsx, jsx, ts, js
```

Move all access into `useEffect`, an event handler, or a lazy state initializer:

```tsx
// Bad
const width = window.innerWidth;

// Good
const [width, setWidth] = useState(0);
useEffect(() => {
    setWidth(window.innerWidth);
}, []);
```

### Pass 3 — Non-deterministic state initializers

```
pattern: useState\(Math\.random|useState\(Date\.now|useState\(new Date
file types: tsx, jsx
```

Initialize with a stable value; set the real value in `useEffect`.

### Pass 4 — Canvas / ref access outside useEffect

```
pattern: \.current\.(getContext|drawImage|fillRect|width|height)
file types: tsx, jsx
```

Every canvas operation must live inside `useEffect` or `useGSAP`.

### Pass 5 — Invalid HTML nesting

```
pattern: <p[^>]*>[\s\S]*?<(div|h[1-6]|ul|ol|p|table|section|article)
file types: tsx, jsx
multiline: true
```

Replace `<p>` wrappers around block elements with `<div>`. Use `<span>` for inline wrappers inside `<p>`.

### Pass 6 — Mixed inline elements in JSX text

```
pattern: <em>|<strong>|<code>|<b>|<i>|<Pill>
file types: tsx, jsx
```

When bare text and an inline element (`<Pill>`, `<em>`, `<strong>`, `<code>`, etc.) share a JSX block that Prettier may line-wrap, the space at a line break becomes a JSX whitespace boundary. SSR and the client disagree on whether that boundary produces a space, causing a hydration mismatch.

**This is not a post-write check — it is a writing rule. Never write bare text adjacent to an inline element in the first place.**

Every text segment in a mixed-content element must be an explicit JS string literal:

```tsx
// ✗ NEVER — Prettier will wrap this, stripping the space before "times"
<Callout>
    Cantera runs erosion <em>three</em> times interleaved with the noise layers.
</Callout>

// ✓ ALWAYS — spaces are locked inside string literals; Prettier cannot affect them
<Callout>
    {'Cantera runs erosion '}
    <em>{'three'}</em>
    {' times interleaved with the noise layers.'}
</Callout>
```

```tsx
// ✗ NEVER
<p>
    <Pill>useFrame</Pill> is R3F's hook — synchronized with <Pill>requestAnimationFrame</Pill>.
</p>

// ✓ ALWAYS
<p>
    <Pill>{'useFrame'}</Pill>
    {" is R3F\u2019s hook \u2014 synchronized with "}
    <Pill>{'requestAnimationFrame'}</Pill>
    {'.'}
</p>
```

This applies in every JSX element: `<p>`, `<Callout>`, `<li>`, `<span>`, `<blockquote>`, etc. If the element has **any** inline child, **all** text siblings must be `{'...'}` literals.

### Pass 7 — suppressHydrationWarning audit

```
pattern: suppressHydrationWarning
file types: tsx, jsx
```

Flag every usage. Only keep if intentional (e.g. a timestamp that must differ). Add a comment explaining why.

---

## 3. Pre-commit ESLint Checks

These are the rules in `eslint.config.mjs` that most commonly block commits. Scan for each before finalising.

### 3-a. `react/no-unescaped-entities`

Raw `'`, `"`, `>`, `}` in JSX text must be escaped. **Do not use HTML entities** (hydration risk). Use JS string expressions instead:

```tsx
// Bad (ESLint error + hydration risk)
<p>they&apos;re here</p>

// Good
<p>{"they're here"}</p>
```

### 3-b. `no-param-reassign`

Never mutate function parameters directly. Use local `let` copies:

```ts
// Bad
function sfc32(a, b, c, d) { a |= 0; ... }

// Good
function sfc32(a0, b0, c0, d0) {
    let a = a0, b = b0, c = c0, d = d0;
    ...
}
```

### 3-c. `@typescript-eslint/no-unused-vars` and `unusedImports/no-unused-imports`

- Remove all unused imports.
- Prefix intentionally unused variables/parameters with `_` (e.g. `_event`, `_i`).
- Pattern allowed: `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`.

### 3-d. `simpleImportSort/imports` — import group order

Imports must follow this exact group order (separated by blank lines):

```ts
// 1. CSS/SCSS
import './styles.css';

// 2. react, next, external packages
import { useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

// 3. internal @/ aliases
import { CodeBlock } from '@/components/code-block';

// 4. relative parent  ../
import { helper } from '../utils';

// 5. relative sibling  ./
import { local } from './local';
```

### 3-e. `@typescript-eslint/consistent-type-imports`

Use `import type` for type-only imports:

```ts
// Bad
import { SomeType } from './types';

// Good
import type { SomeType } from './types';
```

### 3-f. `@typescript-eslint/consistent-type-definitions`

Prefer `type` over `interface` in all new code:

```ts
// Bad
interface Props {
    name: string;
}

// Good
type Props = { name: string };
```

**Exception:** `declare global { interface Window { ... } }` requires `interface` for TypeScript merging. Add `// eslint-disable-next-line @typescript-eslint/consistent-type-definitions` above it.

### 3-g. `no-loss-of-precision`

Integer literals beyond `Number.MAX_SAFE_INTEGER` (9007199254740991) silently lose precision:

```ts
// Bad
const N = 6364136223846793005; // loses precision

// Good — trim to safe range or use BigInt
const N = 6364136223846793;
```

### 3-h. `react-hooks/rules-of-hooks`

Hooks must be called unconditionally at the top level of a component or custom hook. Never inside loops, conditions, or nested functions.

### 3-i. `react-hooks/exhaustive-deps`

All values referenced inside `useEffect` / `useGSAP` deps arrays must be listed. If a value should be excluded intentionally, add an `// eslint-disable-next-line react-hooks/exhaustive-deps` comment with a reason.

### 3-j. `react-hooks/set-state-in-effect` (react-eslint-plugin)

Calling `setState` synchronously in the body of a `useEffect` (not inside an async callback or event) triggers the rule. Defer with `setTimeout(..., 0)` or restructure to compute the value before mounting:

```tsx
// Bad
useEffect(() => {
    setReady(true);
}, []);

// Good
useEffect(() => {
    setTimeout(() => setReady(true), 0);
}, []);
```

---

## Pre-ship Checklist

- [ ] File is `'use client'` and exports a default function component
- [ ] Accent color applied consistently to all primitive components
- [ ] All steps follow the standard step anatomy (badge + tag + h2 + prose + code + optional demo)
- [ ] No HTML entities (`&apos;`, `&nbsp;`, `&mdash;`) in JSX text — use literals or `{}`
- [ ] No `window`, `document`, `localStorage` outside `useEffect` or event handlers
- [ ] No `Math.random()`, `Date.now()`, `new Date()` in `useState` initializers
- [ ] No `<p>` wrapping block elements
- [ ] No bare text adjacent to `<em>`/`<strong>`/`<code>` — wrap every text segment in `{'...'}` string literals
- [ ] No raw `'` or `"` in JSX text — wrap in `{"..."}` expressions
- [ ] No unused imports or variables (or prefixed with `_`)
- [ ] Import groups are in correct order
- [ ] Type-only imports use `import type`
- [ ] No `interface` outside of `declare global` blocks
- [ ] No integer literals beyond `Number.MAX_SAFE_INTEGER`
- [ ] `react-hooks/exhaustive-deps` warnings reviewed and intentional exclusions commented
