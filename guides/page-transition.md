# Page Transition System

A canvas-based wave animation that plays between page navigations, built with GSAP and a Zustand state machine.

## Architecture Overview

```
TransitionLink (click) ──► PageProvider.navigate() ──► PageStore (EXITING)
                                                            │
                              PageTransition (canvas anim)◄─┘
                                      │
                                      ▼ animation complete
                              router.push(newPath)
                                      │
                                      ▼ pathname changes
                              PageProvider useEffect ──► PageStore (EXITED)
                                                            │
                              PageTransition (reverse anim)◄┘
                                      │
                                      ▼ animation complete
                              PageStore (ENTERED) ── page is interactive
```

## State Machine

The `PageState` enum in `stores/page.ts` drives the entire flow:

| State      | Meaning                                   |
| ---------- | ----------------------------------------- |
| `LOADING`  | Initial state, assets loading             |
| `READY`    | Assets loaded, about to enter             |
| `ENTERING` | Enter animation playing                   |
| `ENTERED`  | Page is fully visible and interactive     |
| `EXITING`  | Exit animation playing (wave covers page) |
| `EXITED`   | New route loaded, reveal animation starts |
| `ERROR`    | Something went wrong                      |

## Step-by-Step Flow

### 1. User clicks a `TransitionLink`

`components/ui/transition-link.tsx` intercepts the click:

- Calls original `onClick` if provided.
- **Same page?** → `window.location.reload()`, done.
- **External / hash / mailto / tel link?** → lets browser handle it normally.
- **Internal link** → calls `e.preventDefault()` and invokes `navigate({ pathname: href })`.

### 2. `navigate()` triggers exit

`providers/page.tsx` sets the Zustand store:

```ts
pageInfo: targetPageInfo,        // save destination URL
pageState: PageState.EXITING     // start exit transition
```

All subscribers are notified of the state change.

### 3. Exit animation (wave covers the screen)

`PageTransition` component (`modules/layouts/PageTransition/index.tsx`) listens via `useSubscribePage`. On `EXITING`:

1. Kills any running tween, resets progress to `0`.
2. Makes the canvas visible (full-screen, fixed position).
3. Animates `progress` from `0 → 1` over **1.5s** with `expo.inOut` easing.
4. On each frame, calls `draw(progress)` which renders a **wave wipe** on the canvas.
5. On complete, performs `router.push(newPath)` — the actual Next.js navigation.

### 4. Canvas `draw()` – the wave effect

```
progress = 0          progress = 0.5         progress = 1
                     ┌──────────────┐      ┌──────────────┐
                     │   ░░░░░░░░   │      │██████████████│
                     │  ░░░░░░░░░░  │      │██████████████│
┌──────────────┐     │ ░░░░░░░░░░░░ │      │██████████████│
│              │     │░░░░░░░░░░░░░░│      │██████████████│
│   (empty)    │     │██████████████│      │██████████████│
│              │     │██████████████│      │██████████████│
└──────────────┘     └──────────────┘      └──────────────┘
```

- **`t`** = `(1 - progress) * height` — the baseline Y position, moves upward as progress increases.
- **`amplitude`** = `250 * sin(progress * π)` — peaks at `progress = 0.5`, zero at start/end, creating a bulging wave leading edge.
- A sine curve is drawn across the width at the leading edge, then the area below is filled black.

### 5. Route changes, reveal begins

After `router.push()` triggers navigation, `pathname` changes. The `PageProvider` `useEffect` detects this:

```ts
if (isSamePage && isNotFirstLoad) {
    pageStore.actions.setState({ pageState: PageState.EXITED });
}
```

This sets state to `EXITED`.

### 6. Reveal animation (wave uncovers the screen)

`PageTransition` reacts to `EXITED`:

1. Rotates the canvas **180°** — this flips the wave so it now recedes from top-to-bottom instead of advancing bottom-to-top.
2. Animates `progress` from `1 → 0` over **1.5s** (`expo.inOut`).
3. On complete:
    - Hides the canvas (`visibility: hidden`, `pointerEvents: none`).
    - After `FORCE_DELAY_ENTERED_IN_MS` (currently **0ms**), sets state to `ENTERED`.

### 7. Page is interactive

`ENTERED` signals all subscribers that the page is fully visible and ready for interaction.

## Key Files

| File                                       | Role                                        |
| ------------------------------------------ | ------------------------------------------- |
| `stores/page.ts`                           | Zustand store with `PageState` enum         |
| `providers/page.tsx`                       | Context provider, `navigate()`, pub/sub     |
| `components/ui/transition-link.tsx`        | Drop-in `<Link>` replacement with exit anim |
| `modules/layouts/PageTransition/index.tsx` | Canvas wave animation                       |
| `constants/animation.ts`                   | `FORCE_DELAY_ENTERED_IN_MS` value           |
