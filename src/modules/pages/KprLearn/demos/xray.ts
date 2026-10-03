import * as THREE from 'three';

import { type CardState, type Cast, choreograph, film, GALLERY_RING, KPR, NotchedCard, PAINTINGS, stageDistance } from '../kit/source';

/**
 * The film x-ray: a cast of real NotchedCards (materials only, never drawn) run through the source's
 * real `choreograph()`, so a demo can ask "where is every card at time t?" and draw the answer in 2D.
 * No GPU needed: choreograph only writes plain numbers into each card's `state`.
 */

export const STAGE = { w: 1440, h: 900 };

export type CastKey = keyof Cast;
export type XCard = { key: string; group: CastKey; s: CardState };

let cast: Cast | null = null;

function getCast(): Cast {
    if (cast) return cast;
    const geo = new THREE.PlaneGeometry(1, 1);
    const shared = { noise: null, flick: null, view: { value: new THREE.Vector4(1, 1, 1, 1) } };
    const card = () => new NotchedCard(geo, shared);
    cast = {
        hero: card(),
        introSmall: card(),
        introTall: card(),
        lav: [card(), card(), card()],
        ring: Array.from({ length: GALLERY_RING.count }, card),
        keepB: card(),
        keepC: card(),
        keep: card(),
        factions: card(),
        world: card(),
        launchA: card(),
        launchB: card(),
        launchC: card(),
        // KEEPERS is drawn into a texture on the page; only its aspect matters to the choreography
        word: card().setFaces({ tex: null, aspect: 5.6, base: '#000' }),
    };
    return cast;
}

/** The source reads its inputs from the shared `film` object; borrow it for one call, then put it back. */
const KEYS = ['view', 'vw', 'vh', 'time', 'reduced', 'phone', 'ringDrag', 'intro'] as const;

export function sampleAt(t: number, opts: { vw?: number; vh?: number; time?: number; ringDrag?: number } = {}): XCard[] {
    const c = getCast();
    const saved = KEYS.map((k) => film[k]);
    Object.assign(film, { view: t, vw: opts.vw ?? STAGE.w, vh: opts.vh ?? STAGE.h, time: opts.time ?? 0, reduced: false, phone: false, ringDrag: opts.ringDrag ?? 0, intro: 1 });
    try {
        choreograph(c);
    } finally {
        KEYS.forEach((k, i) => Object.assign(film, { [k]: saved[i] }));
    }
    const out: XCard[] = [];
    (Object.keys(c) as CastKey[]).forEach((group) => {
        const v = c[group];
        if (Array.isArray(v)) v.forEach((card, i) => out.push({ key: `${group}${i}`, group, s: card.state }));
        else out.push({ key: group, group, s: v.state });
    });
    return out;
}

/** Copy the numbers out (states are reused objects, overwritten on the next sample). */
export const snapshot = (s: CardState) => ({ ...s, notch: [...s.notch] as CardState['notch'], view: { ...s.view } });

/** cards built with `.single()` in Stage.tsx: past 90° their back is discarded, so they vanish */
const DOUBLE_SIDED = new Set<CastKey>(['hero', 'keep', 'factions', 'world']);
export const SINGLE_SIDED = (group: CastKey) => !DOUBLE_SIDED.has(group);

export const isVisible = (s: CardState) => s.opacity > 0.001 && s.w > 0.5 && s.h > 0.5;
/** visible on screen: also hidden when a one-sided card shows its back */
export const isShown = (c: XCard) => isVisible(c.s) && !(SINGLE_SIDED(c.group) && Math.cos(c.s.ry) * Math.cos(c.s.rx) < 0);

/** Hero face shown for a turn (girl → story → portrait). */
export const heroFace = (ry: number) => ['girl', 'story', 'portrait'][Math.min(2, Math.round(Math.abs(ry) / Math.PI))];

export const GROUP_STYLE: Record<CastKey, { fill: string; label?: string }> = {
    hero: { fill: KPR.lavender, label: 'hero' },
    introSmall: { fill: '#b7a3b0', label: 'small' },
    introTall: { fill: '#9aa0c8', label: 'trailer' },
    lav: { fill: KPR.lavDark },
    ring: { fill: '#cfc8f3' },
    keepB: { fill: '#9db6cf' },
    keepC: { fill: '#c99aa8' },
    keep: { fill: PAINTINGS.keep.clear, label: 'the keep' },
    factions: { fill: PAINTINGS.factions.clear, label: 'factions' },
    world: { fill: '#6b4a5c', label: 'the world' },
    launchA: { fill: '#c99aa8' },
    launchB: { fill: '#9db6cf' },
    launchC: { fill: '#d9a99a' },
    word: { fill: '#111', label: 'KEEPERS' },
};

/**
 * The card outline as a polygon (rounded corners left out): a box, a stepped notch at one corner,
 * an optional second notch and a 45° corner cut, matching the shader's `shape()` in notched.ts.
 * Points are in the card's own frame (centre origin, y up).
 */
export function outline(s: Pick<CardState, 'w' | 'h' | 'notch' | 'notch2' | 'chamfer'>): [number, number][] {
    const hw = s.w / 2;
    const hh = s.h / 2;
    // corner-local path from the top edge to the right edge, as if the corner were top-right
    const local = (c: number): [number, number][] => {
        const n = [s.notch, s.notch2].find((v) => v[3] > 0.01 && v[0] === c);
        if (n) {
            const L = Math.min(n[2], (n[1] > 0.5 ? hh : hw) * 2);
            const D = n[3];
            return n[1] > 0.5
                ? [
                      [hw - D, hh],
                      [hw - D, hh - L + D],
                      [hw, hh - L],
                  ]
                : [
                      [hw - L, hh],
                      [hw - L + D, hh - D],
                      [hw, hh - D],
                  ];
        }
        if (s.chamfer[1] > 0.01 && s.chamfer[0] === c) {
            const k = s.chamfer[1];
            return [
                [hw - k, hh],
                [hw, hh - k],
            ];
        }
        return [[hw, hh]];
    };
    // clockwise: TL (mirror x, reversed), TR, BR (mirror y, reversed), BL (mirror both)
    const tl = local(0)
        .map(([x, y]) => [-x, y] as [number, number])
        .reverse();
    const tr = local(1);
    const br = local(2)
        .map(([x, y]) => [x, -y] as [number, number])
        .reverse();
    const bl = local(3).map(([x, y]) => [-x, -y] as [number, number]);
    return [...tl, ...tr, ...br, ...bl];
}

/**
 * Draw sampled cards onto a 2D canvas as the camera would roughly see them: turned cards narrow by
 * |cos ry|, cards pushed back (z) shrink by perspective, back faces are dashed.
 */
export function drawCards(g: CanvasRenderingContext2D, cards: XCard[], W: number, H: number, opts: { labels?: boolean; only?: CastKey[]; highlight?: CastKey } = {}) {
    const s = Math.min(W / STAGE.w, H / STAGE.h);
    const D = stageDistance(STAGE.h);
    const list = cards.filter((c) => isShown(c) && (!opts.only || opts.only.includes(c.group))).sort((a, b) => a.s.order - b.s.order);
    for (const c of list) {
        const st = c.s;
        const persp = D / Math.max(1, D - st.z);
        const sx = Math.cos(st.ry);
        const sy = Math.cos(st.rx);
        const style = GROUP_STYLE[c.group];
        g.save();
        g.translate(W / 2 + st.x * s * persp, H / 2 - st.y * s * persp);
        g.rotate(-st.rz);
        g.scale(Math.max(0.02, Math.abs(sx)) * persp * s, Math.max(0.02, Math.abs(sy)) * persp * s);
        const pts = outline(st);
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, -y) : g.moveTo(x, -y)));
        g.closePath();
        const back = sx < 0;
        g.globalAlpha = Math.min(1, st.opacity) * (opts.highlight && opts.highlight !== c.group ? 0.25 : 1);
        g.fillStyle = c.group === 'hero' ? heroFill(st.ry) : style.fill;
        g.fill();
        g.lineWidth = 1.2 / (s * persp * Math.max(0.02, Math.abs(sx)));
        g.strokeStyle = 'rgba(0,0,0,0.55)';
        if (back) g.setLineDash([6 / s, 5 / s]);
        g.stroke();
        g.restore();
        if (opts.labels && style.label && st.w * s * Math.abs(sx) > 46) {
            g.save();
            g.font = '500 10px ui-monospace, monospace';
            g.fillStyle = c.group === 'word' ? '#fff' : '#0c0c0e';
            g.globalAlpha = Math.min(1, st.opacity);
            const label = c.group === 'hero' ? `hero · ${heroFace(st.ry)}` : style.label;
            g.fillText(label.toUpperCase(), W / 2 + (st.x - (st.w * Math.abs(sx)) / 2) * s * persp + 6, H / 2 - (st.y + st.h / 2) * s * persp + 14);
            g.restore();
        }
    }
    return list.length;
}

function heroFill(ry: number) {
    const f = heroFace(ry);
    return f === 'girl' ? '#6d5fc4' : f === 'story' ? PAINTINGS.story.clear : KPR.lavender;
}

/** Story beats, for labels on timelines (film screens). */
export const ACTS: { t: number; label: string }[] = [
    { t: 0, label: 'Landing' },
    { t: 1.8, label: 'Project intro' },
    { t: 4.45, label: 'Story' },
    { t: 9.85, label: '10K' },
    { t: 11.25, label: 'Gallery' },
    { t: 13.95, label: 'The Keep' },
    { t: 15.45, label: 'Factions' },
    { t: 16.85, label: 'The World' },
    { t: 18.3, label: 'Launch' },
    { t: 20.2, label: 'Footer' },
];

export const actAt = (t: number) => [...ACTS].reverse().find((a) => t >= a.t)?.label ?? ACTS[0].label;
