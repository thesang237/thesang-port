import * as THREE from 'three';

import { type Layout, layoutLines, type MsdfFont, samplePoints } from './msdf';
import type { Trail } from './Trail';
import { TRAIL_SIZE } from './Trail';

/**
 * A headline in WebGL MSDF, placed in screen px (orthographic overlay camera, y down).
 *
 * Reveal (reference 3.2–5.0 s): letters left → right draw a hairline outline that grows along the
 * glyph's path (`outline` map < progress), then fill grey → white while the outline fades.
 *
 * Pointer (reference 6–17 s and the hover / hold stills): inside the pointer field the fill dissolves
 * and the letters show their outline instead — a dim full outline with bright broken segments that
 * travel along the path — while a constellation of nodes flies out of the letter edges, joined by
 * hairlines. Hover gives a small field along the trail; press & hold opens a big one.
 */

const fieldGlsl = /* glsl */ `
uniform vec3 uTrail[${TRAIL_SIZE}];   // px x, px y, strength 0..1
uniform vec3 uHold;                   // px x, px y, strength 0..1
uniform vec3 uHover;                  // px x, px y, strength 0..1 (resting field under the pointer)
uniform float uTrailR;                // px radius of one hover point
uniform float uHoldR;                 // px radius of the fully open press field
float disturb(vec2 p) {
    float d = 0.0;
    for (int i = 0; i < ${TRAIL_SIZE}; i++) {
        vec3 t = uTrail[i];
        d = max(d, (1.0 - smoothstep(uTrailR * 0.35, uTrailR, distance(p, t.xy))) * t.z);
    }
    // the resting field: the default area, open while the pointer is on the title
    d = max(d, (1.0 - smoothstep(uTrailR * 0.7, uTrailR * 1.6, distance(p, uHover.xy))) * uHover.z);
    float r = uHoldR * (0.35 + 0.65 * uHold.z);
    d = max(d, (1.0 - smoothstep(r * 0.55, r, distance(p, uHold.xy))) * uHold.z);
    return d;
}
`;

const quadVert = /* glsl */ `
attribute vec4 aRect;    // x, y, w, h (px, block space)
attribute vec4 aUv;      // u0, v0, u1, v1
attribute float aIndex;
uniform vec2 uOrigin;
varying vec2 vUv;
varying vec2 vPos;
varying float vIndex;
void main() {
    vec2 p = aRect.xy + position.xy * aRect.zw;
    vUv = mix(aUv.xy, aUv.zw, position.xy);
    vPos = uOrigin + p;
    vIndex = aIndex;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 0.0, 1.0);
}`;

const quadFrag = /* glsl */ `
uniform sampler2D uAtlas;
uniform sampler2D uOutline;
uniform float uPxRange;      // screen px per unit of signed distance
uniform float uDraw;         // 0..1 outline progress for the whole block
uniform float uFill;         // 0..1 fill progress for the whole block
uniform float uStagger;      // delay between letters, in units of one letter's own duration
uniform float uCount;
uniform float uAlpha;
uniform float uTime;
uniform float uHasOutline;
uniform float uTexel;        // one atlas px in uv
varying vec2 vUv;
varying vec2 vPos;
varying float vIndex;
${fieldGlsl}
float median(vec3 c) { return max(min(c.r, c.g), min(max(c.r, c.g), c.b)); }
float letter(float p) {
    // the block progress p spreads over the letters: each one runs 0..1 after its own delay
    float span = 1.0 + uStagger * (uCount - 1.0);
    return clamp(p * span - vIndex * uStagger, 0.0, 1.0);
}
// position along the outline (0..1). The map's background is white, so on the very edge take the
// smallest of a few taps: that is the glyph's own value, not the background.
float along() {
    if (uHasOutline < 0.5) return 0.0;
    vec2 o = vec2(uTexel * 1.5, 0.0);
    float a = texture2D(uOutline, vUv).r;
    a = min(a, texture2D(uOutline, vUv + o.xy).r);
    a = min(a, texture2D(uOutline, vUv - o.xy).r);
    a = min(a, texture2D(uOutline, vUv + o.yx).r);
    a = min(a, texture2D(uOutline, vUv - o.yx).r);
    return a;
}
void main() {
    float sd = (median(texture2D(uAtlas, vUv).rgb) - 0.5) * uPxRange;   // px, + inside
    float fill = clamp(sd + 0.5, 0.0, 1.0);
    float line = 1.0 - smoothstep(0.35, 1.25, abs(sd));                  // ≈1.5 px hairline
    float pathPos = line > 0.001 ? along() : 1.0;

    // reveal
    float lp = letter(uDraw);
    float drawn = smoothstep(pathPos - 0.02, pathPos, lp) * step(0.001, lp);
    float lf = letter(uFill);

    // pointer field: fill gives way to the outline (ragged edge), bright segments travel the path
    float d = disturb(vPos) * step(0.999, lf);
    float open = smoothstep(0.32, 0.48, d);
    float seg = smoothstep(0.4, 0.46, fract(pathPos * 1.4 + vIndex * 0.37 + uTime * 0.06));
    float fieldLine = line * open * (0.28 + 0.72 * seg);

    float body = fill * lf * (1.0 - open);
    float outline = max(line * drawn * (1.0 - lf * lf), fieldLine);
    float a = max(body, outline) * uAlpha;
    if (a < 0.004) discard;
    // fill arrives grey and brightens to white (reference row 5 of the reveal strip)
    vec3 col = mix(vec3(0.62), vec3(1.0), smoothstep(0.35, 1.0, lf));
    col = mix(col, vec3(1.0), outline * (1.0 - body));
    gl_FragColor = vec4(col * a, a);   // premultiplied
}`;

/**
 * Constellation node: rests on a letter edge, flies out to `rest + off` as the field opens, drifts.
 * Shared by the dots and by both ends of every link (a link fades with its fainter end).
 */
const nodeGlsl = /* glsl */ `
uniform vec2 uOrigin;
uniform float uTime;
uniform float uCap;
uniform float uReady;        // 1 once the title has filled
vec2 nodePos(vec2 rest, vec2 off, float seed, float d) {
    float e = d * d * (3.0 - 2.0 * d);
    float spread = 1.0 + 0.9 * uHold.z;
    vec2 drift = vec2(sin(uTime * 0.7 + seed * 40.0), cos(uTime * 0.6 + seed * 23.0)) * uCap * 0.05;
    return uOrigin + rest + (off * spread + drift) * e;
}
// half of the nodes only join while the press field is open (the hold still is about twice as dense)
float nodeAlpha(vec2 rest, float seed) {
    float shown = mix(step(seed, 0.5), 1.0, uHold.z);
    return smoothstep(0.18, 0.55, disturb(uOrigin + rest)) * uReady * shown;
}
`;

const dotVert = /* glsl */ `
attribute vec2 aRest;
attribute vec2 aOff;
attribute vec2 aSeed;        // seed, size 0..1
uniform float uDpr;
varying float vAlpha;
${fieldGlsl}
${nodeGlsl}
void main() {
    float d = disturb(uOrigin + aRest);
    vAlpha = nodeAlpha(aRest, aSeed.x);
    // most nodes are small, a few are big soft discs
    gl_PointSize = (3.0 + pow(aSeed.y, 3.0) * 9.0) * (uCap / 105.0) * uDpr * (0.6 + 0.4 * vAlpha);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(nodePos(aRest, aOff, aSeed.x, d), 0.0, 1.0);
}`;

const dotFrag = /* glsl */ `
uniform float uAlpha;
varying float vAlpha;
void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.55, 1.0, r)) * vAlpha * uAlpha * 0.95;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vec3(a), a);
}`;

const linkVert = /* glsl */ `
attribute vec2 aRest;
attribute vec2 aOff;
attribute float aSeedA;
attribute vec2 aRestB;       // the other end, so the link can fade with its fainter node
attribute float aSeedB;
varying float vAlpha;
${fieldGlsl}
${nodeGlsl}
void main() {
    float d = disturb(uOrigin + aRest);
    vAlpha = min(nodeAlpha(aRest, aSeedA), nodeAlpha(aRestB, aSeedB));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(nodePos(aRest, aOff, aSeedA, d), 0.0, 1.0);
}`;

const linkFrag = /* glsl */ `
uniform float uAlpha;
varying float vAlpha;
void main() {
    float a = vAlpha * uAlpha * 0.55;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vec3(a), a);
}`;

export type TitleOptions = { lines: string[]; capPx: number; align?: 'left' | 'center'; lineGap?: number };

type Node = { rest: [number, number]; off: [number, number]; seed: number; size: number };

/** Nodes on the letter edges, each with a flight offset; links join near neighbours at full flight. */
function buildConstellation(font: MsdfFont, layout: Layout, cap: number) {
    const pts = samplePoints(font, layout, Math.max(3, cap / 9), [105, 150], 0.75);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const nodes: Node[] = [];
    for (let i = 0; i < pts.points.length; i += 2) {
        const a = rnd() * Math.PI * 2;
        const len = (0.12 + 0.95 * Math.pow(rnd(), 1.6)) * cap;
        nodes.push({ rest: [pts.points[i], pts.points[i + 1]], off: [Math.cos(a) * len, Math.sin(a) * len * 0.85], seed: rnd(), size: rnd() });
    }
    const far = (n: Node) => [n.rest[0] + n.off[0], n.rest[1] + n.off[1]];
    const links: [number, number][] = [];
    const maxD = cap * 0.62;
    nodes.forEach((n, i) => {
        const [x, y] = far(n);
        const near: { j: number; d: number }[] = [];
        nodes.forEach((m, j) => {
            if (j <= i) return;
            const [u, v] = far(m);
            const d = Math.hypot(u - x, v - y);
            if (d < maxD) near.push({ j, d });
        });
        near.sort((p, q) => p.d - q.d)
            .slice(0, 2)
            .forEach(({ j }) => links.push([i, j]));
    });
    return { nodes, links };
}

export class TitleText {
    readonly group = new THREE.Group();
    layout!: Layout;
    /** Reveal state driven by the owner (time based). */
    draw = 0;
    fill = 0;
    alpha = 1;
    private meshes: (THREE.Mesh | THREE.Points | THREE.LineSegments)[] = [];
    private uniforms: Record<string, THREE.IUniform>;

    constructor(
        private font: MsdfFont,
        private opts: TitleOptions,
        trail: Trail,
    ) {
        this.uniforms = {
            uAtlas: { value: font.atlas },
            uOutline: { value: font.outline },
            uHasOutline: { value: font.outline ? 1 : 0 },
            uTexel: { value: 1 / font.size },
            uPxRange: { value: 1 },
            uDraw: { value: 0 },
            uFill: { value: 0 },
            uStagger: { value: 0 }, // pass 4: every letter traces and fills together
            uCount: { value: 1 },
            uAlpha: { value: 1 },
            uOrigin: { value: new THREE.Vector2() },
            uTrail: { value: trail.uniform },
            uHold: { value: trail.hold },
            uHover: { value: trail.hover },
            uTrailR: { value: 60 },
            uHoldR: { value: 300 },
            uTime: { value: 0 },
            uDpr: { value: 1 },
            uCap: { value: 68 },
            uReady: { value: 0 },
        };
        this.group.frustumCulled = false;
    }

    get lines() {
        return this.opts.lines;
    }

    /** (Re)build geometry for a cap height in px; call on resize. */
    build(capPx: number, dpr: number) {
        this.opts.capPx = capPx;
        this.disposeMeshes();
        const L = (this.layout = layoutLines(this.font, this.opts.lines, capPx, this.opts.lineGap, this.opts.align));
        const blend = {
            // the overlay camera is y-down, which flips winding: draw both faces
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.CustomBlending,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
        } as const;
        const material = (vertexShader: string, fragmentShader: string) => new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: this.uniforms, ...blend });

        // letters: one instanced quad per glyph
        const n = L.glyphs.length;
        const geo = new THREE.InstancedBufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3));
        geo.setIndex([0, 1, 2, 0, 2, 3]);
        const rect = new Float32Array(n * 4);
        const uv = new Float32Array(n * 4);
        const idx = new Float32Array(n);
        L.glyphs.forEach((g, i) => {
            rect.set([g.x, g.y, g.w, g.h], i * 4);
            uv.set(g.uv, i * 4);
            idx[i] = g.index;
        });
        geo.setAttribute('aRect', new THREE.InstancedBufferAttribute(rect, 4));
        geo.setAttribute('aUv', new THREE.InstancedBufferAttribute(uv, 4));
        geo.setAttribute('aIndex', new THREE.InstancedBufferAttribute(idx, 1));
        geo.instanceCount = n;
        const letters = new THREE.Mesh(geo, material(quadVert, quadFrag));

        // constellation: nodes (points) + links (line segments), both placed on the GPU
        const { nodes, links } = buildConstellation(this.font, L, capPx);
        const dg = new THREE.BufferGeometry();
        dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodes.length * 3), 3));
        dg.setAttribute('aRest', new THREE.BufferAttribute(new Float32Array(nodes.flatMap((p) => p.rest)), 2));
        dg.setAttribute('aOff', new THREE.BufferAttribute(new Float32Array(nodes.flatMap((p) => p.off)), 2));
        dg.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(nodes.flatMap((p) => [p.seed, p.size])), 2));
        const dots = new THREE.Points(dg, material(dotVert, dotFrag));

        const lg = new THREE.BufferGeometry();
        const ends = links.flatMap(([a, b]) => [
            [a, b],
            [b, a],
        ]);
        lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ends.length * 3), 3));
        lg.setAttribute('aRest', new THREE.BufferAttribute(new Float32Array(ends.flatMap(([a]) => nodes[a].rest)), 2));
        lg.setAttribute('aOff', new THREE.BufferAttribute(new Float32Array(ends.flatMap(([a]) => nodes[a].off)), 2));
        lg.setAttribute('aSeedA', new THREE.BufferAttribute(new Float32Array(ends.map(([a]) => nodes[a].seed)), 1));
        lg.setAttribute('aRestB', new THREE.BufferAttribute(new Float32Array(ends.flatMap(([, b]) => nodes[b].rest)), 2));
        lg.setAttribute('aSeedB', new THREE.BufferAttribute(new Float32Array(ends.map(([, b]) => nodes[b].seed)), 1));
        const lines = new THREE.LineSegments(lg, material(linkVert, linkFrag));

        this.meshes = [lines, letters, dots];
        this.meshes.forEach((m) => {
            m.frustumCulled = false;
            this.group.add(m);
        });

        const u = this.uniforms;
        u.uCount.value = n;
        u.uPxRange.value = this.font.range * L.scale;
        u.uTrailR.value = capPx * 1.15; // hover still: ≈ three letters around the pointer
        u.uHoldR.value = capPx * 3.0; // hold still: most of a line
        u.uDpr.value = dpr;
        u.uCap.value = capPx;
    }

    /** Block origin in screen px (left edge, top of the first line's caps). */
    setOrigin(x: number, y: number) {
        this.uniforms.uOrigin.value.set(x, y);
    }

    get origin() {
        return this.uniforms.uOrigin.value as THREE.Vector2;
    }

    update(time: number) {
        const u = this.uniforms;
        u.uDraw.value = this.draw;
        u.uFill.value = this.fill;
        u.uAlpha.value = this.alpha;
        u.uTime.value = time;
        u.uReady.value = this.fill >= 0.999 ? 1 : 0;
        this.group.visible = this.alpha > 0.001 && this.draw > 0;
    }

    /** True if a screen point is over (or near) the block: the pointer only affects titles there. */
    hits(x: number, y: number, pad: number) {
        if (!this.layout) return false;
        const o = this.origin;
        return x > o.x - pad && x < o.x + this.layout.width + pad && y > o.y - pad && y < o.y + this.layout.height + pad;
    }

    private disposeMeshes() {
        for (const m of this.meshes) {
            this.group.remove(m);
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
        }
        this.meshes = [];
    }

    dispose() {
        this.disposeMeshes();
    }
}
