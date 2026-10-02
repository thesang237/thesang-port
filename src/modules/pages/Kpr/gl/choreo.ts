'use client';

/**
 * Choreography: every card's state is a pure function of the film clock `t` (screens), the layout
 * anchors and a few smoothed inputs (pointer, velocity, time for idle motion). Nothing here keeps
 * history, so scrolling back up reverses everything exactly.
 */
import { GALLERY_RING, IMAGES } from '../data/media';
import { clamp01, ease, launchLeave, lerp, seg, sub, W } from '../scroll/timeline';
import { film } from '../scroll/useScrollStore';

import { anchor, type Rect } from './layout';
import { baseState, type CardState, type NotchedCard } from './NotchedCard';

export type Cast = {
    hero: NotchedCard;
    introSmall: NotchedCard;
    introTall: NotchedCard;
    /** three purple layers behind the 10K portrait (darker, darker, gallery lavender) */
    lav: NotchedCard[];
    ring: NotchedCard[];
    keepB: NotchedCard;
    keepC: NotchedCard;
    keep: NotchedCard;
    factions: NotchedCard;
    world: NotchedCard;
    launchA: NotchedCard;
    launchB: NotchedCard;
    launchC: NotchedCard;
    word: NotchedCard;
};

const { inOutStrong: io, outStrong: out, inOut, in: easeIn } = ease;

function reset(s: CardState) {
    Object.assign(s, baseState());
}
function rect(s: CardState, r: Rect) {
    s.x = r.x;
    s.y = r.y;
    s.w = r.w;
    s.h = r.h;
}
function mixRect(a: Rect, b: Rect, k: number): Rect {
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) };
}
const fromEdges = (l: number, r: number, t: number, b: number): Rect => ({ x: (l + r) / 2, y: (t + b) / 2, w: r - l, h: t - b });

/** one "rem" of the reference (10px at 1600 wide, clamped 6.4–12) */
const unit = (vw: number) => Math.min(12, Math.max(6.4, vw * 0.00625));

const IMAGE_COUNT = IMAGES.gallery.length;

/** landing close-up: camera zoom on the girl's face (1 = the file's own framing) */
const LANDING_ZOOM = 3.1;
/** first half turn (girl → story), the shrink to a sliver, second half turn (story → portrait) */
const GROW = [4.0, 4.6] as const;
const FLIP1 = [4.2, 5.1] as const;
const SHRINK = [9.7, 10.15] as const;
const FLIP2 = [10.15, 10.9] as const;
/** the glow that passes over cards while they change scale (screen-blended, see notched.ts) */
const GLOW_COLOR = '#c06cff';
const HAND_GLOW = 0.4;

/** the story painting is framed a little tighter than the file's camera (as the reference) */
const STORY_ZOOM = 1.12;

/** where the logo wipe's symbol sits (x, px from centre) and how much it is turned (1 = facing) */
export const logoRide = { x: 0, squash: 1 };

/**
 * The story painting's camera pan (0..1 of the file's clip), matched to the reference recording: it
 * drifts over the clouds with row 1, travels steadily down the mountains with row 3, and lands on the
 * two figures (≈ 0.92 of the clip, figures filling the frame) while the logo wipe plays.
 */
export function storyProgress(t: number) {
    return 0.12 * ease.smooth(seg(t, 5.0, 6.4)) + 0.5 * inOut(seg(t, 6.2, 8.3)) + 0.3 * inOut(seg(t, 8.3, 9.15));
}

/** cards that nearly fill the screen stop leaning (their edges would show) */
function settleTilt(s: CardState, vw: number, vh: number) {
    const cover = (s.w * s.h) / (vw * vh);
    const k = 1 - clamp01((cover - 0.4) / 0.45);
    s.tiltX *= k;
    s.tiltY *= k;
}

/** auto radius (as NotchedCard does), for shapes that blend it toward 0 */
const autoRadius = (w: number, h: number, u: number) => Math.min(4.2 * u, Math.max(1.2 * u, 0.058 * Math.min(w, h)));

/**
 * The hero card's rect during the opening (Intro.tsx drives `film.intro` 0 → 1): a thin line in the
 * centre grows to full height, widens into a narrow card, then opens to full screen. Exported so the
 * DOM can clip the white copy of the KPR wordmark to it.
 */
export function introRect(o: number): Rect {
    const { vw, vh } = film;
    const hk = io(clamp01(o / 0.38));
    const w1 = out(clamp01((o - 0.08) / 0.5));
    const w2 = io(clamp01((o - 0.42) / 0.58));
    const w = lerp(lerp(2, 0.13 * vw, w1), vw, w2);
    return { x: lerp(0.025 * vw, 0, w2), y: 0, w, h: lerp(0.3 * vh, vh, hk) };
}

/** a card arriving from below while it turns to face the viewer (keep / launch stacks) */
function riseFlip(s: CardState, target: Rect, k: number, side: number, vh: number) {
    s.x = target.x;
    s.y = lerp(target.y - 0.95 * vh, target.y, k);
    s.w = target.w;
    s.h = target.h;
    s.ry = lerp(side * Math.PI * 0.5, 0, k);
    s.rx = lerp(0.35, 0, k);
}

export function choreograph(c: Cast) {
    const t = film.view;
    const { vw, vh, time } = film;
    const u = unit(vw);
    const full: Rect = { x: 0, y: 0, w: vw, h: vh };
    const idle = film.reduced ? 0 : 1;

    // ── HERO: one card, three faces ─────────────────────────────────────────────────────────────
    // front: the girl (landing close-up → intro card) · back: the story painting · front again: the
    // 10K portrait. Each half turn shows the next face; the hidden face is swapped while it faces away.
    const portraitRect = anchor('col-portrait', vw, vh, [0.283, 0.11, 0.435, 0.83]);
    const ringY = anchor('gallery-ring', vw, vh, [0.3, 0.42, 0.4, 0.4]).y;
    const ringCardW = film.phone ? Math.min(0.42 * vw, 0.3 * vh) : Math.min(0.2 * vw, 0.36 * vh);
    const ringFront: Rect = { x: 0, y: ringY, w: ringCardW, h: ringCardW * 1.096 };
    const gIn = io(sub(t, W.galleryIn, 0.1, 0.85));
    {
        const s = c.hero.state;
        reset(s);
        // 0 · the opening after the loader: a line opens into the full-screen close-up
        const opening = film.intro < 1;
        // 1 · landing → card: left edge pulls in first, then the right; the camera pulls back
        const kL = io(sub(t, W.landingToCard, 0, 0.75));
        const kR = io(sub(t, W.landingToCard, 0.3, 1));
        const big = opening ? introRect(film.intro) : fromEdges(lerp(-vw / 2, -0.29 * vw, kL), lerp(vw / 2, 0.34 * vw, kR), vh / 2, -vh / 2);
        const charRect = anchor('intro-char', vw, vh, [0.406, 0.549, 0.214, 0.384]);
        const k2 = io(seg(t, W.introCardsIn));
        let r = mixRect(big, charRect, k2);
        const notchK = io(sub(t, W.landingToCard, 0.05, 0.6));
        const zoomK = inOut(seg(t, W.landingToCard[0] - 0.2, W.introCardsIn[1]));
        s.view.zoom = lerp(LANDING_ZOOM, 1.8, zoomK);
        s.view.fx = 0.5;
        s.view.fy = lerp(0.418, 0.41, zoomK);
        // a gentle pink-purple glow passes over the painting as it becomes a card
        s.wash = 0.36 * Math.sin(Math.PI * seg(t, 1.2, 2.7));
        s.washColor = GLOW_COLOR;
        // 2 · intro idle float
        const hold = seg(t, 2.4, 2.8) * (1 - seg(t, W.introOut[0], W.introOut[0] + 0.2));
        r.y += Math.sin(time * 0.7) * 5 * hold * idle;
        s.rz = Math.sin(time * 0.45) * 0.006 * hold * idle;
        // 3 · grow + lean, then a half turn onto the story (back face), opening to full screen
        const a = io(sub(t, W.introOut, 0, 0.45));
        r = { ...r, w: r.w * (1 + 0.14 * a), h: r.h * (1 + 0.14 * a), x: r.x - 0.04 * vw * a };
        // the girl's picture stays where it was while her card grows and turns away
        const girlFrame: Rect = { ...r };
        const grow = io(seg(t, GROW));
        const f = inOut(seg(t, FLIP1));
        const tall: Rect = { x: -0.03 * vw, y: 0, w: 0.36 * vw, h: vh * 1.04 };
        r = mixRect(mixRect(r, tall, grow), full, io(clamp01(f * 2 - 1)));
        s.ry = lerp(-0.32 * a, -Math.PI, f);
        s.rz *= 1 - f;
        s.rz += 0.03 * a * (1 - f);
        // 4 · story: full screen, slightly zoomed (as the reference), the camera pans down with the scroll
        const facing0 = Math.round(Math.abs(s.ry) / Math.PI);
        if (facing0 === 1) {
            s.view.progress = storyProgress(t);
            s.view.zoom = STORY_ZOOM;
            s.view.fy = 0.5;
        }
        // 5 · the story card shrinks around the screen centre into a narrow card (the keeper symbol rides
        // it), then keeps turning the same way onto the portrait, dipping back in depth as it turns.
        // The story painting stays still behind it the whole time (fixed frame); so does the portrait.
        const e1 = io(seg(t, SHRINK));
        const sliver: Rect = { x: 0, y: 0, w: 0.16 * vw, h: vh * 0.92 };
        r = mixRect(r, sliver, e1);
        const f2 = inOut(seg(t, FLIP2));
        r = mixRect(r, portraitRect, ease.smooth(f2));
        s.ry -= Math.PI * f2;
        s.z = -320 * Math.sin(Math.PI * f2);
        // 6 · portrait shrinks into the ring's front slot while the purple layers grow out of it
        const pk = seg(t, FLIP2[1] - 0.1, FLIP2[1] + 0.2);
        r.y += Math.sin(time * 0.6) * 4 * idle * pk * (1 - seg(t, W.galleryIn));
        r = mixRect(r, ringFront, gIn);
        rect(s, r);

        // shape per face (measured on the reference): girl = tab on the upper left edge + cut corner
        // bottom right; story = tab on the top right while it opens and shrinks; portrait = the same as the girl
        const facing = Math.round(Math.abs(s.ry) / Math.PI);
        const R = autoRadius(r.w, r.h, u);
        if (facing === 0 && (grow > 0 || f > 0)) s.frame = girlFrame;
        else if (facing === 1) s.frame = full;
        else if (facing === 2 && f2 < 1) s.frame = portraitRect;
        if (facing === 0) {
            if (opening) {
                const w2 = io(clamp01((film.intro - 0.42) / 0.58));
                s.notch = [1, 0, 0.42 * r.w, 3 * u * (1 - w2)];
                s.radius = R * (1 - w2);
            } else {
                s.notch = [0, 1, lerp(lerp(0, 0.58, notchK), 0.52, k2) * r.h, lerp(lerp(0, 7 * u, notchK), 2.35 * u, k2)];
                s.chamfer = [2, lerp(0, 2.6 * u, k2)];
                s.radius = R * notchK;
            }
        } else if (facing === 1) {
            const open = io(clamp01(f * 2 - 1)) * (1 - e1);
            s.notch = [1, 0, 0.36 * r.w, lerp(9 * u, 0, open) + e1 * 2.6 * u];
            s.radius = R * (1 - open);
        } else {
            s.notch = [0, 1, 0.52 * r.h, lerp(2.35 * u, 0.05 * r.w, gIn)];
            s.chamfer = [2, lerp(2.6 * u, 0, gIn)];
        }
        s.edge = 7 * Math.abs(Math.sin(s.ry)) * (r.w < vw * 0.9 ? 1 : 0);
        s.opacity = (opening && film.intro <= 0 ? 0 : 1) * (1 - seg(t, W.galleryIn[1] - 0.12, W.galleryIn[1]));
        s.order = 22;

        // the keeper symbol (logo wipe) rides the sliver and turns with it
        logoRide.x = s.x;
        logoRide.squash = facing === 1 ? Math.abs(Math.cos(s.ry)) : 0;
    }

    // ── INTRO: small landscape card (baked shape) and the one-sided trailer card ─────────────────
    {
        const s = c.introSmall.state;
        reset(s);
        const r = anchor('intro-small', vw, vh, [0.073, 0.323, 0.148, 0.155]);
        const k = out(seg(t, 2.05, 2.95));
        const o = easeIn(sub(t, W.introOut, 0, 0.3));
        rect(s, r);
        s.y += lerp(-0.06 * vh, 0, k) + o * 0.05 * vh + Math.sin(time * 0.8 + 1) * 3 * idle;
        s.opacity = k * (1 - o);
        // measured: tab on the top left (the right 55 % sits lower), a cut corner bottom left
        s.notch = [1, 0, 0.55 * r.w, 1.4 * u];
        s.chamfer = [3, 1.8 * u];
        s.radius = 1 * u;
        s.order = 18;
    }
    {
        const s = c.introTall.state;
        reset(s);
        const r = anchor('intro-tall', vw, vh, [0.668, 0.126, 0.295, 0.791]);
        const k = out(seg(t, 2.15, 3.05));
        const a = io(sub(t, W.introOut, 0, 0.72));
        let rr: Rect = { ...r, y: r.y + lerp(-0.3 * vh, 0, k) + Math.sin(time * 0.6 + 2) * 4 * idle * (1 - a) };
        rr = mixRect(rr, { x: vw / 2 - 0.06 * vw, y: 0.03 * vh, w: r.w * 0.95, h: vh * 0.94 }, a);
        rect(s, rr);
        // swings past edge-on: one-sided, so it is simply gone after 90°
        s.ry = lerp(lerp(0.55, 0, k), 2.1, a);
        s.rz = Math.sin(time * 0.5 + 1) * 0.005 * idle * (1 - a);
        // measured: tab top right (the right 41 % sits 3.5 u lower), a small step on the lower left edge,
        // a cut corner bottom right
        s.notch = [1, 0, 0.41 * r.w, 3.5 * u];
        s.notch2 = [3, 1, 0.45 * r.h, 0.9 * u];
        s.chamfer = [2, 5.6 * u];
        s.zoom = 1.04;
        s.opacity = k;
        s.edge = 8 * a;
        s.order = 19;
    }

    // ── COLLECTION → GALLERY: three purple layers grow out of the portrait, one after another ──────
    // (darker, darker still, then the gallery's own lavender, which stays as the background)
    for (let i = 0; i < c.lav.length; i++) {
        const s = c.lav[i].state;
        reset(s);
        const g = io(sub(t, W.galleryIn, i * 0.16, 0.55 + i * 0.16));
        const r = mixRect(portraitRect, { x: 0, y: 0, w: vw * 1.02, h: vh * 1.02 }, g);
        rect(s, r);
        s.notch = [0, 1, 0.52 * r.h, lerp(2.35 * u, 0, g)];
        s.radius = autoRadius(r.w, r.h, u) * (1 - g);
        s.parallax = 0;
        s.tiltX = s.tiltY = 0;
        const last = i === c.lav.length - 1;
        // the first two are hidden once the last one covers the screen
        const covered = last ? 0 : seg(t, W.galleryIn[0] + (W.galleryIn[1] - W.galleryIn[0]) * 1.0, W.galleryIn[1] + 0.02);
        s.opacity = (g > 0.001 ? 1 : 0) * (1 - covered) * (last ? 1 - seg(t, W.keepIn[1] - 0.05, W.keepIn[1]) : 1);
        s.order = 2 + i;
    }

    // ── GALLERY: convex ring of portrait cards (camera outside the cylinder) ─────────────────────
    // exit: the ring closes into a small spinning box at the centre, then every card turns edge-on
    // and disappears (one-sided cards), one after another
    {
        const n = c.ring.length;
        const open = io(sub(t, W.galleryIn, 0.4, 1));
        const close = io(sub(t, W.galleryOut, 0, 0.6));
        const flip = sub(t, W.galleryOut, 0.5, 1);
        const R = lerp(lerp(0.05 * vw, (film.phone ? 1.0 : 0.62) * vw, open), 0.03 * vw, close);
        const step = (Math.PI * 2) / n;
        const rot = film.ringDrag + (t - 12.6) * 0.75 + time * 0.05 * idle + close * close * 6.5;
        const cw = lerp(ringCardW, ringCardW * 0.62, close);
        const visible = seg(t, W.galleryIn[1] - 0.15, W.galleryIn[1] - 0.05);
        for (let i = 0; i < n; i++) {
            const s = c.ring[i].state;
            reset(s);
            const th = i * step * lerp(0.35, 1, open) + rot;
            const cos = Math.cos(th);
            s.x = Math.sin(th) * R;
            s.z = (cos - 1) * R;
            s.y = ringY + lerp(0, 0.05 * vh, close);
            const wrapped = Math.atan2(Math.sin(th), cos);
            const fk = io(clamp01((flip - (i / n) * 0.35) / 0.65));
            // each card turns away toward its nearer edge (one-sided, so it vanishes past 90°)
            s.ry = lerp(wrapped, Math.sign(wrapped || 1) * Math.PI * 0.62, fk);
            s.w = cw;
            s.h = cw * 1.096;
            s.radius = 0;
            s.parallax = 0.5;
            s.tiltX = s.tiltY = 0;
            s.opacity = visible * (close > 0.98 ? 1 : clamp01((cos + 0.15) / 0.35)) * (t < W.galleryOut[1] ? 1 : 0);
            s.dim = lerp(0, 0.25, clamp01(1 - cos)) * (1 - close);
            s.order = 30 + Math.round(cos * 40);
            // repeated cards get a slight tint so the ring doesn't read as an obvious loop
            const repeat = Math.floor(i / IMAGE_COUNT);
            s.wash = repeat > 0 ? 0.14 : 0;
            s.washColor = GALLERY_RING.tints[repeat % GALLERY_RING.tints.length];
        }
    }

    // ── THE KEEP: three cards rise together on ONE curve, turning to face us as they come up; the
    // centre one grows to full screen while the two others keep travelling out past it (all at once)
    const kp = inOut(seg(t, W.keepIn));
    const flipK = io(clamp01(kp / 0.6));
    const sideFlip = (s: CardState, side: number) => {
        s.ry = side * (Math.PI / 2) * (1 - flipK);
        s.rx = 0.35 * (1 - flipK);
    };
    {
        const s = c.keepB.state;
        reset(s);
        rect(s, { x: lerp(-0.25, -0.5, kp * kp) * vw, y: lerp(-1.0, 0.95, kp) * vh, w: 0.13 * vw, h: 0.5 * vh });
        sideFlip(s, 1);
        s.rz = -0.02;
        s.zoom = 1.05;
        s.notch = [1, 1, 0.45 * s.h, 2 * u];
        s.opacity = kp > 0.001 && kp < 0.999 ? 1 : 0;
        s.order = 40;
    }
    {
        const s = c.keepC.state;
        reset(s);
        rect(s, { x: lerp(0.24, 0.52, kp * kp) * vw, y: lerp(-1.3, 0.4, kp) * vh, w: 0.15 * vw, h: 0.24 * vh });
        sideFlip(s, -1);
        s.rz = 0.03;
        s.zoom = 1.1;
        s.fy = 0.45;
        s.notch = [0, 0, 0.3 * s.w, 2.2 * u];
        s.opacity = kp > 0.001 && kp < 0.999 ? 1 : 0;
        s.order = 42;
    }

    // tableau handoffs: the outgoing card and the incoming one move TOGETHER on one curve — the
    // outgoing shrinks to a wide strip tilted one way and leaves upward, the incoming rises tilted the
    // other way and opens to full screen. Both paintings take a purple tint while they travel.
    // handoffs: ONE eased curve per handoff drives both cards, size and position together. The outgoing
    // scene shrinks while it travels up and away; the incoming one starts small, far below, and grows
    // into full screen as it rises. Both glow pink-purple mid-way.
    const away = (dir: number): Rect => ({ x: 0.02 * dir * vw, y: -dir * 1.08 * vh, w: 0.46 * vw, h: 0.3 * vh });
    const handOut = (s: CardState, win: readonly [number, number], tilt: number) => {
        const p = inOut(seg(t, win));
        if (p <= 0) return p;
        const r = mixRect({ x: s.x, y: s.y, w: s.w, h: s.h }, away(-1), p);
        rect(s, r);
        s.rz += tilt * p;
        s.notch = [3, 0, 0.27 * r.w, 5 * u * clamp01(p * 2.5)];
        s.wash = Math.max(s.wash, HAND_GLOW * Math.sin(Math.PI * p));
        s.opacity *= p < 0.999 ? 1 : 0;
        return p;
    };
    const handIn = (s: CardState, win: readonly [number, number], tilt: number) => {
        const p = inOut(seg(t, win));
        rect(s, mixRect(away(1), full, p));
        s.rz = tilt * (1 - p);
        s.notch = [0, 0, 0.62 * s.w, 3.5 * u * clamp01((1 - p) * 2.5)];
        s.wash = HAND_GLOW * Math.sin(Math.PI * p);
        s.opacity = p > 0.001 ? 1 : 0;
        return p;
    };
    const fullRadius = (s: CardState) => {
        const fullness = clamp01((s.w - vw * 0.96) / (vw * 0.04));
        s.radius = s.notch[3] > 0.5 ? -1 : autoRadius(s.w, s.h, u) * (1 - fullness);
        s.washColor = GLOW_COLOR;
        s.skew = Math.max(-0.06, Math.min(0.06, film.vel * 0.004)) * (s.w < vw * 0.99 ? 1 : 0.3);
    };
    {
        const s = c.keep.state;
        reset(s);
        // entrance: rises and turns with the two others while it grows to full screen (size eases in, so
        // it reads as a card first and fills the screen at the end)
        const grow = Math.pow(kp, 1.7);
        rect(s, { x: 0, y: lerp(-0.95 * vh, 0, out(kp)), w: lerp(0.24 * vw, vw, grow), h: lerp(0.4 * vh, vh, grow) });
        sideFlip(s, -1);
        s.notch = [3, 0, 0.3 * s.w, 3 * u * (1 - grow)];
        s.opacity = kp > 0.001 ? 1 : 0;
        handOut(s, W.handoff1, -0.09);
        fullRadius(s);
        s.order = 44;
    }
    {
        const s = c.factions.state;
        reset(s);
        handIn(s, W.handoff1, 0.05);
        handOut(s, W.handoff2, -0.09);
        fullRadius(s);
        s.order = 46;
    }
    {
        const s = c.world.state;
        reset(s);
        handIn(s, W.handoff2, 0.05);
        handOut(s, W.launchIn, -0.09);
        fullRadius(s);
        s.order = 48;
    }

    // ── LAUNCH: three cards rise flipping into a stack over KEEPERS (shapes measured on the reference,
    // spaced ~3 u apart so they never overlap; one-sided, so they vanish when they turn away) ──────
    const li = W.launchIn;
    const settle = seg(t, li[1] - 0.2, W.launch[1]);
    const leave = launchLeave(t);
    const stack = (s: CardState, r: Rect, k: number, side: number, bob: number, turn: number) => {
        riseFlip(s, r, k, side, vh);
        s.y += Math.sin(time * 0.7 + bob) * 3 * idle * settle;
        // they leave with the footer: rising with it while they turn away (one-sided, so they vanish)
        s.y += leave * 0.55 * vh;
        s.ry += side * leave * turn;
        s.radius = 1.1 * u;
        s.opacity = k > 0.001 && leave < 0.999 ? 1 : 0;
    };
    {
        const s = c.launchA.state;
        reset(s);
        stack(s, { x: -8 * u, y: 0, w: 39.3 * u, h: 36.6 * u }, io(sub(t, li, 0.15, 0.7)), 1, 0, Math.PI * 0.75);
        s.notch = [1, 1, 0.33 * s.h, 1.7 * u];
        s.notch2 = [2, 0, 0.19 * s.w, 2.7 * u];
        s.order = 48.5;
    }
    {
        const s = c.launchB.state;
        reset(s);
        stack(s, { x: 23.5 * u, y: -5.8 * u, w: 17.1 * u, h: 34.6 * u }, io(sub(t, li, 0.22, 0.77)), -1, 1, Math.PI * 0.9);
        s.zoom = 1.05;
        s.notch = [3, 1, 0.47 * s.h, 1.7 * u];
        s.order = 47;
    }
    {
        const s = c.launchC.state;
        reset(s);
        stack(s, { x: -5 * u, y: -30 * u, w: 31.4 * u, h: 17.75 * u }, io(sub(t, li, 0.3, 0.85)), 1, 2, Math.PI * 0.75);
        s.notch = [0, 0, 0.68 * s.w, 2.75 * u];
        s.chamfer = [3, 1.7 * u];
        s.order = 49;
    }
    {
        const s = c.word.state;
        reset(s);
        const k = out(sub(t, li, 0.2, 0.9));
        const ww = 137.2 * u;
        const wh = ww / (c.word.faces[0]?.aspect ?? 6);
        rect(s, { x: 2 * u, y: 21 * u + lerp(-0.19 * vh, 0, k) + leave * 0.55 * vh, w: ww, h: wh });
        s.radius = 0;
        s.parallax = 0;
        s.tiltX = 0.02;
        s.tiltY = 0.03;
        s.opacity = k;
        s.order = 45;
    }

    for (const card of [c.hero, c.introSmall, c.introTall, c.keepB, c.keepC, c.keep, c.factions, c.world, c.launchA, c.launchB, c.launchC]) settleTilt(card.state, vw, vh);
}
