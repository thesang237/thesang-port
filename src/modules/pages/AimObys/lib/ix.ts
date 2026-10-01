/**
 * Tiny re-implementation of the reference site's scroll-keyframe engine (Webflow IX2 "while scrolling"):
 * - a track is a list of keyframes at 0–100 % of a scroll range;
 * - a custom curve is honoured only when the track's *first* key carries one, and then it shapes every segment
 *   (the reference engine builds it once per track); otherwise segments are linear;
 * - before the first / after the last keyframe the value holds;
 * - the scroll parameter is smoothed per frame: p += (target - p) * (1 - smoothing).
 */

export type Ease = (t: number) => number;

/** CSS cubic-bezier(x1, y1, x2, y2) as a function (same solver the browser uses). */
export function bezier(x1: number, y1: number, x2: number, y2: number): Ease {
    if (x1 === y1 && x2 === y2) return (t) => t;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sy = (t: number) => ((ay * t + by) * t + cy) * t;
    const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
    const solve = (x: number) => {
        let t = x;
        for (let i = 0; i < 8; i++) {
            const e = sx(t) - x;
            if (Math.abs(e) < 1e-6) return t;
            const d = dx(t);
            if (Math.abs(d) < 1e-6) break;
            t -= e / d;
        }
        let lo = 0;
        let hi = 1;
        t = x;
        while (lo < hi) {
            const v = sx(t);
            if (Math.abs(v - x) < 1e-6) return t;
            if (x > v) lo = t;
            else hi = t;
            t = (lo + hi) / 2;
            if (hi - lo < 1e-7) break;
        }
        return t;
    };
    return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : sy(solve(t)));
}

/** The easings used by the reference (Webflow names → curves). */
export const EASE = {
    linear: ((t: number) => t) as Ease,
    inOutCubic: bezier(0.645, 0.045, 0.355, 1),
    outCubic: bezier(0.215, 0.61, 0.355, 1),
    inOutQuart: bezier(0.77, 0, 0.175, 1),
    outQuad: ((t: number) => -t * (t - 2)) as Ease,
};

/** GSAP-compatible cubic-bezier strings for CustomEase. */
export const EASE_PATH = {
    inOutCubic: 'M0,0 C0.645,0.045 0.355,1 1,1',
    outCubic: 'M0,0 C0.215,0.61 0.355,1 1,1',
    inOutQuart: 'M0,0 C0.77,0 0.175,1 1,1',
    inCubic: 'M0,0 C0.55,0.055 0.675,0.19 1,1',
};

/** [position 0–100, value, curve — read from the first key only, see above] */
export type Key = [at: number, value: number, ease?: Ease];

/** Value of a keyframe track at progress `pct` (0–100). */
export function sample(keys: Key[], pct: number): number {
    let from = keys[0];
    let to: Key | null = null;
    for (let i = 0; i < keys.length; i++) {
        if (pct >= keys[i][0]) {
            from = keys[i];
            const next = keys[i + 1];
            to = next && pct !== keys[i][0] ? next : null;
        }
    }
    if (!to) return from[1];
    const span = to[0] - from[0];
    const local = span <= 0 ? 1 : (pct - from[0]) / span;
    return from[1] + (to[1] - from[1]) * (keys[0][2] ?? EASE.linear)(local);
}

type Unit = '%' | 'vh' | 'em' | 'px';

export type ElementTracks = {
    x?: Key[];
    y?: Key[];
    xUnit?: Unit;
    yUnit?: Unit;
    scale?: Key[];
    opacity?: Key[];
};

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Writes the tracks of one element for progress `pct` (0–100). */
export function applyTracks(el: HTMLElement | null, t: ElementTracks, pct: number) {
    if (!el) return;
    if (t.x || t.y || t.scale) {
        const x = t.x ? round(sample(t.x, pct)) : 0;
        const y = t.y ? round(sample(t.y, pct)) : 0;
        const s = t.scale ? round(sample(t.scale, pct)) : 1;
        el.style.transform = `translate3d(${x}${t.xUnit ?? '%'}, ${y}${t.yUnit ?? '%'}, 0)${s !== 1 ? ` scale(${s})` : ''}`;
    }
    if (t.opacity) el.style.opacity = String(round(sample(t.opacity, pct)));
}

/**
 * Scroll progress of an element the way the reference computes "while scrolling in view"
 * (start = element top at viewport top, end = element bottom at viewport top), 0–1.
 */
export function elementProgress(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight;
    const start = r.top + Math.min(r.height, vh);
    const range = Math.min(vh + (r.top + r.height - start), docH);
    return range > 0 ? Math.min(Math.max(0, vh - start), range) / range : 0;
}

/** Smoothing of a scroll parameter (reference "smoothing" 0–100), applied `frames` times (60 Hz frames). */
export function smooth(current: number, target: number, smoothing: number, frames = 1) {
    const keep = (1 - Math.max(1 - smoothing / 100, 0.01)) ** frames;
    const next = target + (current - target) * keep;
    return Math.abs(target - next) < 1e-5 ? target : next;
}
