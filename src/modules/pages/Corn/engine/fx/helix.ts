import * as THREE from 'three';

import { ADDITIVE, type DofController, polyMaterial, rng, SNOISE3 } from './particles';

/**
 * The science chapter's strands, rebuilt from the reference bundle:
 *
 * - `helixSpline` (reference `Vs`): a Catmull-Rom through 13 points of a helix (radius, turns over the
 *   height, phase) with a second, faster wobble (radius2 / frequency2). At each `crossAt` fraction the
 *   strand dives through the axis to the opposite side (phase + π): the "rungs" of the DNA.
 * - `dna` (reference `ru`): 2 backbones × 20 strands, height 15, radius 1.17, 0.9 turns, wobble 4 turns;
 *   strand r crosses over at the stripes where stripe % 3 = r % 3. Each strand is a 1 px hairline plus
 *   150 pentagon beads; both draw on along the strand (a progress window with a bright leading edge).
 * - `beadsOnCurve`: beads only (the reference "stream" and "thread" particles).
 */

export type SplineOpts = { height?: number; radius?: number; frequency?: number; phase?: number; radius2?: number; frequency2?: number; phase2?: number; crossAt?: number[] };

export function helixSpline(o: SplineOpts, rand: () => number) {
    const n = o.height ?? 1;
    const r = o.radius ?? 0.1;
    const u = o.frequency ?? 10;
    const c = o.phase ?? 0;
    const h = o.radius2 ?? 0;
    const d = o.frequency2 ?? 20;
    const m = o.phase2 ?? 0;
    const cross = o.crossAt ?? [0.5];
    let y = 0;
    const pts: THREE.Vector3[] = [];
    for (let e = 0; e < 13; e++) {
        const t = e / 13;
        const prev = (e - 1) / 13;
        const a = cross.some((k) => t >= k && prev < k);
        if (a) y += Math.PI;
        const p = t * Math.PI * 2 * u + c + y;
        const f = t * Math.PI * 2 * d + m;
        const l = [new THREE.Vector3(r * Math.sin(p) + h * Math.sin(f), t * n - n / 2, r * Math.cos(p) + h * Math.cos(f))];
        if (a) {
            const v = n / 13;
            const g = (rand() * 2 - 1) * (v / 8);
            const w = (rand() * 2 - 1) * (v / 4);
            const x = (rand() * 2 - 1) * (v / 4);
            for (let k = 0; k < 2; k++) {
                const i = -(((k + 1) / 5) * 2 - 1) * r;
                l.unshift(new THREE.Vector3(i * Math.sin(p) + w, t * n - n / 2 - v / 2 + g, i * Math.cos(p) + x));
            }
        }
        pts.push(...l);
    }
    return new THREE.CatmullRomCurve3(pts);
}

/** Thread hairlines (reference thread material: DOF-dimmed, draw-on window, bright leading edge). */
function threadMaterial(dof: DofController, color: THREE.ColorRepresentation) {
    return new THREE.ShaderMaterial({
        uniforms: {
            progress: { value: new THREE.Vector2(0, 1) },
            color: { value: new THREE.Color(color) },
            opacity: { value: 1 },
            time: { value: 0 },
            dofAmount: { value: dof.amount },
            dofFocus: { value: dof.focus },
            resolution: { value: new THREE.Vector2(1920, 994) },
            uDpr: { value: 1 },
            shapeSides: { value: 0 },
            uFade: { value: 1 },
        },
        vertexShader: /* glsl */ `
            attribute float aU;
            attribute float aOffset;
            uniform float time;
            uniform vec2 dofAmount;
            uniform vec3 dofFocus;
            varying float vSize;
            varying float vU;
            ${SNOISE3}
            void main() {
                vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                p += (snoise((p.xyz + time / 40.0) / 15.0) - 0.5) * 1.0;
                vSize = smoothstep(dofAmount.x, dofAmount.y, distance(p.xyz, dofFocus));
                vU = aU - aOffset;
                gl_Position = p;
            }`,
        fragmentShader: /* glsl */ `
            uniform vec2 progress;
            uniform vec3 color;
            uniform float opacity, uFade;
            varying float vSize;
            varying float vU;
            void main() {
                float distanceAlpha = mix(1.0, 0.2, smoothstep(0.0, 0.2, vSize));
                float distanceAddColor = mix(0.2, 0.0, smoothstep(0.0, 0.5, vSize));
                float distanceMultColor = mix(1.0, 0.5, smoothstep(0.0, 0.5, vSize));
                float progressAlpha = step(progress.x, vU) * step(vU, progress.y);
                float endFade = smoothstep(0.05, 0.4, vU);
                vec3 progressColor = (1.0 - endFade) * vec3(0.4) * (smoothstep(progress.x + 0.1, progress.x, vU) + smoothstep(progress.y - 0.1, progress.y, vU));
                // 1 px hairlines: kept at full weight (the reference reads them as bright strings)
                float a = distanceAlpha * opacity * progressAlpha * endFade * uFade;
                gl_FragColor = vec4(((color + distanceAddColor) * distanceMultColor * 0.5 + progressColor) * 1.6, a);
            }`,
        ...ADDITIVE,
    });
}

export type DnaOpts = { color: string; size: [number, number]; dof: DofController; seed?: number };

/** Both backbones of the helix: one LineSegments (all hairlines) + one Points (all beads). */
export function dna(o: DnaOpts) {
    const rand = rng(o.seed ?? 5);
    const stripes = Array.from({ length: 7 }, (_, e) => (e % 7) / 7 + 0.5 / 7);
    const SEG = 200;
    const BEADS = 150;
    const linePos: number[] = [];
    const lineU: number[] = [];
    const lineOff: number[] = [];
    const ptPos: number[] = [];
    const ptT: number[] = [];
    const ptOff: number[] = [];
    const ptId: number[] = [];
    let id = 0;
    for (const phase of [0, Math.PI]) {
        for (let r = 0; r < 20; r++) {
            const off = 0.2 * Math.sin(10348.4726191 * r);
            const spline = helixSpline(
                {
                    height: 15,
                    phase,
                    phase2: (r / 20) * Math.PI * 2 + 0.8 * (rand() - 0.5),
                    radius: 1.3 * 0.9,
                    radius2: 0.9 * (0.2 + rand() * 0.1),
                    frequency: 0.9,
                    frequency2: 4,
                    crossAt: stripes.filter((_, t) => t % 3 === r % 3 && t !== 0 && t !== 1),
                },
                rand,
            );
            const pts = spline.getSpacedPoints(SEG);
            for (let i = 0; i < SEG; i++) {
                linePos.push(...pts[i].toArray(), ...pts[i + 1].toArray());
                lineU.push(i / SEG, (i + 1) / SEG);
                lineOff.push(off, off);
            }
            for (let k = 0; k < BEADS; k++) {
                const step = 1 / BEADS;
                const t = THREE.MathUtils.clamp(k * step + (rand() * 1.8 - 0.9) * step, 0, 1);
                ptPos.push(...spline.getPoint(t).toArray());
                ptT.push(t);
                ptOff.push(off);
                ptId.push(id++);
            }
        }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lg.setAttribute('aU', new THREE.Float32BufferAttribute(lineU, 1));
    lg.setAttribute('aOffset', new THREE.Float32BufferAttribute(lineOff, 1));
    const lineMat = threadMaterial(o.dof, o.color);
    const lines = new THREE.LineSegments(lg, lineMat);
    lines.frustumCulled = false;

    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(ptPos, 3));
    pg.setAttribute('t', new THREE.Float32BufferAttribute(ptT, 1));
    pg.setAttribute('aOffset', new THREE.Float32BufferAttribute(ptOff, 1));
    pg.setAttribute('id', new THREE.Float32BufferAttribute(ptId, 1));
    const beadMat = polyMaterial({ color: o.color, size: o.size, dof: o.dof, noise: true, progress: true });
    const beads = new THREE.Points(pg, beadMat);
    beads.frustumCulled = false;

    const group = new THREE.Group();
    group.add(lines, beads);
    /** Draw window along every strand; the offsets stagger strands by ±0.2. */
    const setProgress = (start: number, end: number) => {
        lineMat.uniforms.progress.value.set(start, end);
        beadMat.uniforms.progress.value.set(start, end);
    };
    const setOpacity = (v: number) => {
        lineMat.uniforms.opacity.value = v;
        beadMat.uniforms.opacity.value = v;
    };
    return { group, setProgress, setOpacity };
}

/**
 * Beads strewn along a curve (reference `qs` without its thread, and `cu`): `count` points at
 * t ≈ i / count with a little jitter, optionally scattered by `randomness`; shown inside [start, end].
 */
export function beadsOnCurve(
    curve: THREE.Curve<THREE.Vector3>,
    o: { count: number; randomness?: number; color: string; opacity: number; size: [number, number]; dof: DofController; window?: [number, number]; noise?: boolean; seed?: number },
) {
    const rand = rng(o.seed ?? 9);
    const pos: number[] = [];
    const ts: number[] = [];
    const ids: number[] = [];
    const rr = o.randomness ?? 0;
    for (let k = 0; k < o.count; k++) {
        const step = 1 / o.count;
        const t = THREE.MathUtils.clamp(k * step + (rand() * 1.8 - 0.9) * step, 0, 1);
        const p = curve.getPoint(t);
        p.x += (2 * rand() - 1) * rr;
        p.y += (2 * rand() - 1) * rr;
        p.z += (2 * rand() - 1) * rr;
        pos.push(p.x, p.y, p.z);
        ts.push(t);
        ids.push(k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('t', new THREE.Float32BufferAttribute(ts, 1));
    g.setAttribute('aOffset', new THREE.Float32BufferAttribute(new Array(o.count).fill(0), 1));
    g.setAttribute('id', new THREE.Float32BufferAttribute(ids, 1));
    const mat = polyMaterial({ color: o.color, opacity: o.opacity, size: o.size, dof: o.dof, noise: o.noise ?? false, progress: !!o.window });
    if (o.window) mat.uniforms.progress.value.set(...o.window);
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    return pts;
}

/** Reference `ql`: a wandering 1.5-turn path of 20 points (length 10, amplitude 2.5) from a seed. */
export function wanderPoints(seed: number, definition = 20, length = 10, amp = 2.5) {
    const Q = (x: number) => {
        const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453;
        return (s - Math.floor(s)) * 2 - 1;
    };
    return Array.from({ length: definition }, (_, e) => {
        const t = e / (definition - 1);
        const step = length / definition;
        const a = t * Math.PI * 1.5;
        return new THREE.Vector3(
            Q(seed + e) * Q(seed + e + 746.1) + amp * Math.cos(a),
            -length / 2 + t * length + Q(seed + e + 12.32) * step * 2,
            Q(seed + e + 21.241) * Q(seed + e + 84.11) + amp * Math.sin(a),
        );
    });
}
