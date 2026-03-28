---
name: nextjs-hydration
description: Scan for and fix React/Next.js SSR hydration mismatches. Use when writing or reviewing any 'use client' component, after seeing a hydration error, or when asked to audit pages for SSR safety.
---

# Next.js Hydration Mismatch — Scan & Fix

## When to Use

- Writing or reviewing any `'use client'` component
- After a hydration error appears in the browser console
- When asked to audit a file or directory for SSR safety
- Before shipping a new page that renders dynamic or interactive content

---

## How to Run a Scan

When invoked on a file or directory, run these Grep passes in order. Each pass targets one class of violation. Report every match with file path and line number, then apply the fix described.

### Pass 1 — HTML entities in JSX text

```
pattern: &[a-z]+;|&#[0-9]+;
file types: tsx, jsx
```

**Why it breaks:** HTML entities produce different text-node boundaries between SSR (string concatenation) and CSR (DOM text nodes), so React sees a content mismatch.

| Bad             | Good              |
| --------------- | ----------------- |
| `they&apos;re`  | `they're`         |
| `&mdash;`       | `—`               |
| `&nbsp;`        | `{'\u00A0'}`      |
| `&amp;`         | `&`               |
| `&quot;`        | `"`               |
| `&lt;` / `&gt;` | `{'<'}` / `{'>'}` |

Single quotes, em dashes, and most punctuation can be typed directly into JSX text. For non-breaking spaces use `{'\u00A0'}`.

---

### Pass 2 — Browser globals used directly in render

```
pattern: typeof window|window\.|document\.|localStorage\.|sessionStorage\.|navigator\.
file types: tsx, jsx, ts, js
```

**Why it breaks:** The server has no `window` or `document`. Any value derived from them during render differs from what the server produces.

**Fix:** Move all access into `useEffect`, an event handler, or a lazy state initializer with a safe fallback:

```tsx
// ❌ Bad — executes during render on server too
const width = window.innerWidth;

// ✅ Good — only runs after mount
const [width, setWidth] = useState(0);
useEffect(() => {
    setWidth(window.innerWidth);
}, []);
```

---

### Pass 3 — Non-deterministic state initializers

```
pattern: useState\(Math\.random|useState\(Date\.now|useState\(new Date
file types: tsx, jsx
```

**Why it breaks:** Server and client call `Math.random()` / `Date.now()` at different times, producing different initial values.

**Fix:** Initialize with a stable value, then set the real value in `useEffect`:

```tsx
// ❌ Bad
const [id] = useState(Math.random());

// ✅ Good
const [id, setId] = useState(0);
useEffect(() => {
    setId(Math.random());
}, []);
```

---

### Pass 4 — Canvas / ref access outside useEffect

```
pattern: \.current\.(getContext|drawImage|fillRect|width|height)
file types: tsx, jsx
```

**Why it breaks:** `ref.current` is `null` on the server. Any read during render returns `null` server-side but the real canvas client-side.

**Fix:** Every canvas operation must live inside `useEffect`:

```tsx
useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillRect(0, 0, 100, 100);
}, []);
```

---

### Pass 5 — Invalid HTML nesting

```
pattern: <p[^>]*>[\s\S]*?<(div|h[1-6]|ul|ol|p|table|section|article)
file types: tsx, jsx
multiline: true
```

**Why it breaks:** The browser's HTML parser auto-closes an open `<p>` when it encounters a block element inside it. This produces a DOM structure different from React's virtual DOM.

Common violations:

| Bad                   | Good                             |
| --------------------- | -------------------------------- |
| `<p><div>…</div></p>` | `<div><span>…</span></div>`      |
| `<p><h2>…</h2></p>`   | close `<p>` before the `<h2>`    |
| `<p><ul>…</ul></p>`   | use `<div>` as the outer wrapper |

**Fix:** Use `<span>` for inline wrappers inside `<p>`. If a block wrapper is needed, replace `<p>` with `<div>` or close `<p>` before the block element.

---

### Pass 6 — Suppressions without justification (review only)

```
pattern: suppressHydrationWarning
file types: tsx, jsx
```

`suppressHydrationWarning` silences the error without fixing the root cause. Flag every usage and confirm it is intentional (e.g. a timestamp that must differ). If the root cause is one of the issues above, fix it instead.

---

## Quick-reference Fix Table

| Symptom in error diff                       | Root cause                                                | Fix                                                                                  |
| ------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Extra/missing space around inline component | HTML entity or whitespace around `</Component>` text node | Replace entity with literal character; keep text on one line or use explicit `{' '}` |
| Different number or string value            | `Math.random()` / `Date.now()` in state initializer       | Stable initial value + `useEffect` patch                                             |
| `window is not defined` during SSR          | Browser global in render path                             | Move to `useEffect`                                                                  |
| `null` ref error on server                  | Canvas/DOM ref read during render                         | Move to `useEffect`                                                                  |
| Extra wrapping element in DOM               | `<p>` containing block element                            | Replace `<p>` with `<div>` or inline wrapper with `<span>`                           |

---

## Checklist Before Shipping Any `'use client'` Page

- [ ] No `&apos;`, `&nbsp;`, `&mdash;`, or other HTML entities in JSX text
- [ ] No `window`, `document`, `localStorage` accessed outside `useEffect` or event handlers
- [ ] No `Math.random()`, `Date.now()`, `new Date()` as `useState` initializers
- [ ] All canvas / ref reads inside `useEffect`
- [ ] No `<p>` wrapping `<div>`, `<h*>`, `<ul>`, `<table>`, or another `<p>`
- [ ] Any `suppressHydrationWarning` has a comment explaining why it is intentional
