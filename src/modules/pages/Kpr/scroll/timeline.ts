/**
 * ONE master clock for /kpr, in screens of scroll (1 = one viewport height).
 * Every GL and DOM value is a pure function of `t`, so scrolling back reverses everything exactly.
 * Windows are [from, to] in screens; see NOTES.md for the video timestamps they come from.
 */

export const W = {
    // landing: hold, then painting → notched card (zoom out + left edge pulls in), text leaves
    landingText: [1.0, 1.5],
    landingToCard: [0.9, 2.0],
    // project intro
    introCardsIn: [1.8, 2.75],
    introText: [2.1, 4.0],
    introOut: [3.85, 5.05],
    // story (GLB painting, camera clip scrubbed)
    storyOpen: [4.45, 5.1],
    story: [4.6, 9.9],
    storyRow1: [5.0, 6.6],
    storyRow2: [5.4, 7.6],
    storyRow3: [7.0, 8.55],
    glyph: [8.35, 9.05],
    storyRow4: [8.75, 9.95],
    storyOut: [9.7, 10.55],
    // collection intro (10K)
    collectionIn: [9.85, 10.9],
    collection: [9.95, 11.55],
    // gallery: lavender grows out of the portrait card, ring opens
    galleryIn: [11.25, 12.15],
    gallery: [11.4, 13.95],
    galleryOut: [13.45, 14.25],
    // tableaux
    keepIn: [13.95, 14.95],
    keep: [14.6, 15.85],
    handoff1: [15.45, 16.35],
    factions: [16.0, 17.25],
    handoff2: [16.85, 17.75],
    world: [17.45, 18.7],
    launchIn: [18.3, 19.2],
    launch: [18.75, 20.2],
} as const satisfies Record<string, readonly [number, number]>;

/** Length of the film; the page track is (TOTAL + 1) screens, then the footer follows in flow. */
export const TOTAL = 20.2;

/** Rest positions per act, used by reduced motion (the film snaps between stills) and nav jumps. */
export const RESTS = [0.3, 3.1, 5.9, 7.9, 9.4, 10.95, 12.8, 15.1, 16.6, 18.1, 19.6] as const;

export const NAV_TARGETS = { project: 3.1, keep: 15.1, factions: 16.6, world: 18.1 } as const;

export function navAt(t: number): 'project' | 'keep' | 'factions' | 'world' {
    if (t < 15.0) return 'project';
    if (t < 16.4) return 'keep';
    if (t < 17.75) return 'factions';
    return 'world';
}

/** HUD text colour per moment: light = white HUD over paintings, dark = black HUD over white/lavender. */
export function themeAt(t: number): 'light' | 'dark' {
    if (t < 1.45) return 'light';
    if (t < 4.85) return 'dark';
    if (t < 9.95) return 'light';
    if (t < 14.55) return 'dark';
    if (t < 18.55) return 'light';
    return 'dark';
}

// ── progress math (normalise → clamp → ease → lerp) ──────────────────────────────────────────────

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** progress of t through window w (or [a, b]) */
export const seg = (t: number, w: readonly [number, number] | number, b?: number) => {
    const [a0, b0] = typeof w === 'number' ? [w, b!] : w;
    return clamp01((t - a0) / (b0 - a0));
};
/** sub-window of a window: frac(t, w, 0.2, 0.7) = progress through the 20%–70% slice of w */
export const sub = (t: number, w: readonly [number, number], f0: number, f1: number) => seg(t, w[0] + (w[1] - w[0]) * f0, w[0] + (w[1] - w[0]) * f1);
export const inside = (t: number, w: readonly [number, number]) => t >= w[0] && t <= w[1];

// eases (pure, cheap)
export const ease = {
    linear: (k: number) => k,
    // immersive strong out (0.16, 1, 0.3, 1) ≈ expo-ish out; cubic-bezier evaluated via a fast approximation
    out: (k: number) => 1 - Math.pow(1 - k, 3),
    outStrong: (k: number) => (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    inOut: (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    inOutStrong: (k: number) => (k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2),
    in: (k: number) => k * k * k,
    smooth: (k: number) => k * k * (3 - 2 * k),
};

/** frame-rate independent smoothing toward a target (web-motion rule 16) */
export const damp = (current: number, target: number, lambda: number, dt: number) => lerp(current, target, 1 - Math.exp(-lambda * dt));
