// Bake a scene's boundary maps into arrays a shader can read.
//
// On the CPU each map is a hash map (stripe index → edge height) with gaps. A GPU can't look up a
// hash map, but it can read texture texels by index, so each map becomes a dense row from its
// smallest to its largest stripe index (gaps stored as 0, exactly what the CPU's `?? 0` returns).
// The cost: wide, steep dunes have huge index ranges. That's why the GPU demos cap the dune count.

import type { Fragment } from './gl';
import { rgb } from './gl';
import { type ArtOverrides, buildScene, type Peak, type Scene } from './source';

export const EDGE_W = 4096;
/** 4096 × 1024 floats = 16 MB of edges at most. */
const MAX_TEXELS = EDGE_W * 1024;

export type Baked = {
    /** RGBA per texel, 2 texels per dune. */
    meta: Float32Array;
    edges: Float32Array;
    rows: number;
    /** dunes that fit */
    count: number;
    /** dunes dropped because the texture would be too big */
    dropped: number;
    texels: number;
};

function range(map: Map<number, number>) {
    let lo = Infinity,
        hi = -Infinity;
    for (const k of map.keys()) {
        if (k < lo) lo = k;
        if (k > hi) hi = k;
    }
    return map.size ? { lo, count: hi - lo + 1 } : { lo: 0, count: 0 };
}

export function bakeDunes(peaks: Peak[]): Baked {
    const metaRows: number[] = [];
    const spans: { map: Map<number, number>; lo: number; count: number; offset: number }[] = [];
    let total = 0;
    let count = 0;
    for (const p of peaks) {
        const L = range(p.leftEdges);
        const R = range(p.rightEdges);
        if (total + L.count + R.count > MAX_TEXELS) break;
        const leftOffset = total;
        total += L.count;
        const rightOffset = total;
        total += R.count;
        spans.push({ map: p.leftEdges, lo: L.lo, count: L.count, offset: leftOffset }, { map: p.rightEdges, lo: R.lo, count: R.count, offset: rightOffset });
        metaRows.push(p.diagonalSlope, p.keyResolution, L.lo, L.count, R.lo, R.count, leftOffset, rightOffset);
        count++;
    }
    const rows = Math.max(1, Math.ceil(total / EDGE_W));
    const edges = new Float32Array(rows * EDGE_W);
    for (const s of spans) {
        for (const [k, y] of s.map) edges[s.offset + (k - s.lo)] = y;
    }
    const meta = new Float32Array(Math.max(2, count * 2) * 4);
    meta.set(metaRows);
    return { meta, edges, rows, count, dropped: peaks.length - count, texels: total };
}

/** Upload a bake: returns the two textures (free them with gl.deleteTexture, or let the harness do it). */
export function uploadBake(f: Fragment, baked: Baked) {
    return {
        edges: f.dataTexture(EDGE_W, baked.rows, baked.edges, 1),
        meta: f.dataTexture(Math.max(2, baked.count * 2), 1, baked.meta, 4),
    };
}

/** Every uniform the dune shader needs from a scene (warp, dunes, grain, colours). */
export function sceneUniforms(f: Fragment, scene: Scene, baked: Baked) {
    const p = scene.params;
    f.set('uVC', p.verticalCompression);
    f.set('uAmpY', p.warpAmplY);
    f.set('uFreqY', p.warpFreqY);
    f.set('uPhaseY', p.warpPhaseY);
    f.set('uFlip', p.flipX ? 1 : 0);
    f.setInt('uCount', baked.count);
    f.set('uSway', scene.traits.Dancers ? 0.15 : 0);
    f.set('uSkew', scene.keys.skew * scene.keys.skewAmount);
    f.set('uMargin', p.margin);
    f.set('uDensity', [p.coreDensity, p.slopeDensity, p.skyDensity]);
    f.set('uDotSize', p.dotSize);
    const inner = Math.max(1e-6, 1 - 2 * p.margin);
    f.set('uTries', (p.dotsPerFrame * p.frames * p.dotSize * p.dotSize) / (inner * inner));
    f.set('uInkAlpha', p.inkAlpha / 255);
    f.set('uPaper', rgb(p.paper));
    f.set('uInk', rgb(p.ink));
}

/** Roll a scene and bake it, timing the CPU work (for the demos' readouts). */
export function bakeSeed(seed: string, overrides?: ArtOverrides) {
    const t0 = performance.now();
    const scene = buildScene(seed, 600, overrides);
    const baked = bakeDunes(scene.peaks);
    return { scene, baked, bakeMs: performance.now() - t0 };
}
