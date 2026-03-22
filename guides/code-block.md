# CodeBlock Component

A reusable syntax-highlighted code block with copy button, powered by [Shiki](https://shiki.style) and Tailwind CSS.

## Dependencies

```bash
pnpm add shiki hast-util-to-jsx-runtime
```

Optional (for the `cn` utility):

```bash
pnpm add clsx tailwind-merge
```

## Files to copy

| File                            | Purpose                 |
| ------------------------------- | ----------------------- |
| `src/components/code-block.tsx` | The component           |
| `src/utils/cn.ts`               | Classname merge utility |

If you don't use `cn`, replace it with a plain classname concatenation.

### `cn` utility (if needed)

```ts
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

## Requirements

- React 18+
- Tailwind CSS v3 or v4
- Next.js App Router (or any framework supporting `'use client'`)

## Props

| Prop        | Type          | Default  | Description                                                   |
| ----------- | ------------- | -------- | ------------------------------------------------------------- |
| `children`  | `string`      | required | The code string to highlight                                  |
| `lang`      | `string`      | `'tsx'`  | Shiki language id                                             |
| `highlight` | `string[]`    | —        | Lines containing any of these strings get an indigo highlight |
| `className` | `string`      | —        | Additional classes on the wrapper                             |
| `initial`   | `JSX.Element` | —        | Server-pre-rendered JSX to avoid client flash                 |

## Usage

### Basic

```tsx
import { CodeBlock } from '@/components/code-block';

<CodeBlock>{`const greeting = 'hello';`}</CodeBlock>;
```

### Specify language

```tsx
<CodeBlock lang="css">{`.container { display: grid; }`}</CodeBlock>
<CodeBlock lang="bash">{`pnpm add shiki`}</CodeBlock>
<CodeBlock lang="json">{`{ "name": "my-app" }`}</CodeBlock>
```

### Line highlighting

Pass an array of substrings. Any line containing a match gets highlighted.

```tsx
<CodeBlock highlight={['important', 'critical']}>
    {`const normal = 1;
const important = true;   // highlighted
const another = 2;
const critical = 'yes';   // highlighted`}
</CodeBlock>
```

### Custom class

```tsx
<CodeBlock className="my-8 max-w-2xl">{`const x = 1;`}</CodeBlock>
```

### Server-side pre-render (optional)

To avoid a flash of unstyled code on first paint, pre-render in a Server Component and pass as `initial`:

```tsx
// ServerCodeBlock.tsx (Server Component)
import { codeToHast } from 'shiki/bundle/web';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { CodeBlock } from '@/components/code-block';

export async function ServerCodeBlock({ code, lang = 'tsx' }) {
    const hast = await codeToHast(code, { lang, theme: 'github-dark-dimmed' });
    const initial = toJsxRuntime(hast, { Fragment, jsx, jsxs });
    return (
        <CodeBlock lang={lang} initial={initial}>
            {code}
        </CodeBlock>
    );
}
```

## How it works

### Architecture

```
children (string)
    |
    v
codeToHast()          — Shiki parses code into a HAST (HTML AST)
    |
    v
transformers          — Custom transforms applied during parsing:
  pre()               — Strips Shiki's inline styles (Tailwind controls styling)
  code()              — Removes \n text nodes (block layout handles line breaks)
  line()              — Adds `.hl` class to lines matching highlight strings
    |
    v
toJsxRuntime()        — Converts HAST to React JSX (no dangerouslySetInnerHTML)
    |
    v
<div>                 — Outer wrapper: padding, border, copy button
  <CopyButton />      — Absolute positioned, clipboard API, 2s success feedback
  <pre><code>          — Shiki output with syntax-colored spans
    <span.line>        — One per line, display: block
```

### Key decisions

1. **`shiki/bundle/web`** — Lazy-loads grammars on demand. Includes tsx, typescript, javascript, css, html, json, bash, glsl, markdown, and more. Use `shiki/bundle/full` for uncommon languages.

2. **`toJsxRuntime` over `dangerouslySetInnerHTML`** — Proper React JSX tree. No XSS risk, works with React DevTools, supports concurrent features.

3. **Stripping Shiki inline styles** — The `pre()` transformer clears inline `style` so Tailwind has full control over background, padding, and colors.

4. **Block-level `.line` spans** — All `.line` spans are `display: block`. Mixing block (highlighted) and inline (non-highlighted) breaks `<pre>` layout. The `\n` text nodes between block elements would create double line breaks, so the `code()` transformer strips them.

5. **Padding on outer div, not `<pre>`** — The outer `div` owns padding (`p-6`). The inner `<pre>` is reset to `p-0 bg-transparent`. This avoids fighting Shiki's inline styles. Highlighted lines use `-mx-6 px-6` to extend edge-to-edge within the padded container.

6. **Copy button** — Uses `navigator.clipboard.writeText()`. Shows a checkmark icon for 2 seconds after copying. Positioned absolute top-right with a semi-transparent backdrop blur.

## Customization

### Change theme

Replace `'github-dark-dimmed'` in `highlightCode()` with any [Shiki theme](https://shiki.style/themes). Update the `bg-[#0d0d12]` color to match.

### Change highlight color

Edit the `[&_.hl]` classes:

```
[&_.hl]:bg-indigo-500/10   →   [&_.hl]:bg-yellow-500/10
```

### Change padding

Edit `p-6` on the wrapper div and matching `-mx-6`/`px-6` on `.hl`:

```
p-6 ... [&_.hl]:-mx-6 [&_.hl]:px-6
p-8 ... [&_.hl]:-mx-8 [&_.hl]:px-8
```

### Add line numbers

Add a `line()` transformer that injects a line number element:

```ts
line(node, line) {
    node.children.unshift({
        type: 'element',
        tagName: 'span',
        properties: { class: 'line-number' },
        children: [{ type: 'text', value: String(line) }],
    });
}
```

Then style `.line-number` with Tailwind:

```
[&_.line-number]:select-none [&_.line-number]:text-zinc-600 [&_.line-number]:mr-4 [&_.line-number]:inline-block [&_.line-number]:w-8 [&_.line-number]:text-right
```

## Supported languages (shiki/bundle/web)

tsx, typescript, javascript, css, html, json, bash, shell, markdown, glsl, python, go, rust, yaml, toml, sql, graphql, xml, diff, and more.

For the full list or to use uncommon languages, switch the import to `shiki/bundle/full`.
