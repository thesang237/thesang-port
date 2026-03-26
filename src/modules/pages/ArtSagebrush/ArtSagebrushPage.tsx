'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Math helpers ─────────────────────────────────────────────────────────────

const { min, max, abs, floor, round, sqrt, cos, sin, atan2, pow } = Math;
const TAU = Math.PI * 2;
const PI = Math.PI;
const sq = (x: number) => x * x;
const dist2 = (x1: number, y1: number, x2: number, y2: number) => sqrt(sq(x2 - x1) + sq(y2 - y1));
const constrain = (v: number, lo: number, hi: number) => max(lo, min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mapRange = (v: number, s1: number, e1: number, s2: number, e2: number) => s2 + ((v - s1) * (e2 - s2)) / (e1 - s1);
const norm = (v: number, lo: number, hi: number) => (v - lo) / (hi - lo);

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function cyrb128(s: string): [number, number, number, number] {
    let h1 = 1779033703,
        h2 = 3144134277,
        h3 = 1013904242,
        h4 = 2773480762;
    for (let i = 0; i < s.length; i++) {
        const k = s.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function makeSfc32(a0: number, b0: number, c0: number, d0: number) {
    let a = a0,
        b = b0,
        c = c0,
        d = d0;
    return () => {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

function makeRNG(seed: number) {
    const base = makeSfc32(...cyrb128(String(seed)));
    return {
        r01: base,
        range: (a: number, b?: number) => (b === undefined ? base() * a : a + base() * (b - a)),
        pick: <T,>(arr: T[]) => arr[floor(base() * arr.length)],
    };
}

// ─── Perlin noise (returns [0,1]) ─────────────────────────────────────────────

const _G3 = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
];
const _fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function makeNoise(seed: number) {
    const rng = makeSfc32(...cyrb128(String(seed)));
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = floor(rng() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    return (px: number, py = 0, pz = 0): number => {
        const X = floor(px) & 255,
            Y = floor(py) & 255,
            Z = floor(pz) & 255;
        const x = px - floor(px),
            y = py - floor(py),
            z = pz - floor(pz);
        const u = _fade(x),
            v = _fade(y),
            w = _fade(z);
        const A = perm[X] + Y,
            AA = perm[A] + Z,
            AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y,
            BA = perm[B] + Z,
            BB = perm[B + 1] + Z;
        const g = (h: number, dx: number, dy: number, dz: number) => {
            const gg = _G3[h % 12];
            return gg[0] * dx + gg[1] * dy + gg[2] * dz;
        };
        const n = lerp(
            lerp(lerp(g(perm[AA], x, y, z), g(perm[BA], x - 1, y, z), u), lerp(g(perm[AB], x, y - 1, z), g(perm[BB], x - 1, y - 1, z), u), v),
            lerp(lerp(g(perm[AA + 1], x, y, z - 1), g(perm[BA + 1], x - 1, y, z - 1), u), lerp(g(perm[AB + 1], x, y - 1, z - 1), g(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
            w,
        );
        return (n + 1) * 0.5;
    };
}

// ─── Vector helpers ───────────────────────────────────────────────────────────

type Vec = { x: number; y: number; z: number };
const cv = (x: number, y: number, z = 0): Vec => ({ x, y, z });
const vdot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;
const vmag = (v: Vec) => sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
const vmagsq = (v: Vec) => v.x * v.x + v.y * v.y + v.z * v.z;
const vscale = (v: Vec, s: number): Vec => ({ x: v.x * s, y: v.y * s, z: v.z * s });
const vnorm = (v: Vec): Vec => {
    const m = vmag(v);
    return m === 0 ? v : vscale(v, 1 / m);
};
function vrot(v: Vec, a: number, b = 0, c = 0): Vec {
    const ca = cos(a),
        sa = sin(a),
        cb = cos(b),
        sb = sin(b),
        cc = cos(c),
        sc = sin(c);
    const rx = v.x * ca - v.y * sa,
        ry = v.x * sa + v.y * ca,
        rz = v.z;
    const rx2 = rx * cb - rz * sb,
        ry2 = ry,
        rz2 = rx * sb + rz * cb;
    return { x: rx2, y: ry2 * cc - rz2 * sc, z: ry2 * sc + rz2 * cc };
}

// ─── Color helpers ────────────────────────────────────────────────────────────

type Col = [number, number, number, number]; // r,g,b,a 0-255

function hex2col(h: string): Col {
    const s = h.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16), 255];
}
function lerpcol(a: Col, b: Col, t: number): Col {
    return [round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t), round(a[2] + (b[2] - a[2]) * t), 255];
}
function col2css(c: Col): string {
    return `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
}
function withA(c: Col, a: number): Col {
    return [c[0], c[1], c[2], a];
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

function buildPalettes() {
    const p3a = hex2col('#29264E'),
        p3b = hex2col('#9881F5'),
        p3c = hex2col('#82AFF9');
    const p3d = hex2col('#F97D81'),
        p3e = hex2col('#fcbcbe'),
        p3f = hex2col('#f7c066');

    const palettes: Col[][] = [
        ['#000', '#222', '#444', '#777', '#ddd', '#fff'].map(hex2col),
        ['#0f0347', '#1c0682', '#114ff2', '#114ff2', '#d91c2f', '#d91c2f', '#fe3da7', '#fe3da7', '#f79357', '#f79357', '#fbc442', '#fbc442'].map(hex2col),
        ['#1a1d28', '#377D71', '#8879B0', '#FBA1A1', '#FBC5C5'].map(hex2col),
        [p3a, lerpcol(p3a, p3b, 0.5), p3b, lerpcol(p3b, p3c, 0.5), p3d, lerpcol(p3d, p3e, 0.5), p3e, p3f],
        ['#232601', '#4a69fe', '#226330', '#ef412f', '#efac25', '#eeefd0'].map(hex2col),
        ['#040B21', '#0C282D', '#2B4039', '#9A422E', '#d87d1b', '#DFB4BF', '#F3E7DC'].map(hex2col),
    ];
    const treePalettes: Col[][] = [
        ['#000', '#222', '#444', '#777', '#ddd', '#fff'].map(hex2col),
        ['#0f0347', '#1c0682', '#114ff2', '#5f317d', '#5f317d', '#bb39a2', '#bb39a2', '#f45969', '#f45969', '#fbc442'].map(hex2col),
        ['#1a1d28', '#2d3351', '#214942', '#214942', '#704723', '#6dad9f', '#6dad9f', '#f99d9d', '#f8b861'].map(hex2col),
        [hex2col('#29264E'), hex2col('#354e6f'), hex2col('#8475bd'), hex2col('#6daba5'), hex2col('#fcbcde'), hex2col('#f7c066')],
        ['#232601', '#232601', '#6b8adc', '#226330', '#c4685b', '#c1a953', '#eeefd0'].map(hex2col),
        ['#040B21', '#0C282D', '#2B4039', '#9A422E', '#d87d1b', '#DFB4BF', '#F3E7DC'].map(hex2col),
    ];
    return { palettes, treePalettes };
}

// ─── Erosion ──────────────────────────────────────────────────────────────────

function calcHG(mp: number[][], posX: number, posY: number): [number, number, number] {
    if (posX < 0 || posX >= mp.length - 1 || posY < 0 || posY >= mp[0].length - 1) return [0, 0, 0];
    const cx = floor(posX),
        cy = floor(posY);
    const x = posX - cx,
        y = posY - cy;
    const hNW = mp[cx][cy],
        hNE = mp[cx + 1][cy],
        hSW = mp[cx][cy + 1],
        hSE = mp[cx + 1][cy + 1];
    return [(hNE - hNW) * (1 - y) + (hSE - hSW) * y, (hSW - hNW) * (1 - x) + (hSE - hNE) * x, hNW * (1 - x) * (1 - y) + hNE * x * (1 - y) + hSW * (1 - x) * y + hSE * x * y];
}

function erode(mp: number[][], depMap: number[][], eroMap: number[][], nDrops: number, sedAmt: number, dropR: number, rng: ReturnType<typeof makeRNG>) {
    const mapW = mp.length,
        mapH = mp[0].length;
    const length = rng.range(0.5, 2);
    const maxIter = round(60 * length);
    const inertia = 0.5,
        sedCapF = 4 * sedAmt * 10,
        minSedCap = 0.01;
    const depSpd = 0.6 * sedAmt,
        eroSpd = 0.6 * sedAmt,
        gravity = 4,
        evapSpd = 0.1 / length;

    for (let j = 0; j < nDrops; j++) {
        const r1 = rng.r01(),
            r2 = rng.r01();
        let px = rng.range(mapW - 1),
            py = rng.range(mapH - 1);
        let dx = 0,
            dy = 0,
            speed = 0,
            water = 1,
            sediment = 0;

        for (let i = 0; i < maxIter; i++) {
            const nx = round(px),
                ny = round(py);
            if (nx < 0 || ny < 0 || nx >= mapW - 1 || ny >= mapH - 1) break;
            const offX = abs(px - nx),
                offY = abs(py - ny);
            const [gx, gy, ht] = calcHG(mp, nx, ny);
            if (isNaN(gx) || isNaN(gy) || isNaN(ht)) break;

            dx = dx * inertia - gx * (1 - inertia);
            dy = dy * inertia - gy * (1 - inertia);
            const dm = sqrt(dx * dx + dy * dy);
            if (dm === 0) break;
            dx /= dm;
            dy /= dm;
            px += dx;
            py += dy;
            if (px < 0 || px >= mapW - 1 || py < 0 || py >= mapH - 1) break;

            const newHt = calcHG(mp, px, py)[2];
            if (isNaN(newHt)) break;
            const dHt = newHt - ht;
            const sedCap = max(-dHt * speed * water * sedCapF, minSedCap);

            if (sediment > sedCap || dHt > 0) {
                const dep = dHt > 0 ? min(dHt, sediment) : (sediment - sedCap) * depSpd * depMap[nx][ny];
                sediment -= dep;
                const c1 = (1 - offX) * (1 - offY),
                    c2 = offX * (1 - offY),
                    c3 = (1 - offX) * offY,
                    c4 = offX * offY;
                mp[nx][ny] += dep * c1;
                mp[nx + 1][ny] += dep * c2;
                mp[nx][ny + 1] += dep * c3;
                mp[nx + 1][ny + 1] += dep * c4;
            } else {
                for (let m = 0; m <= dropR; m++) {
                    for (let k = 0; k <= dropR; k++) {
                        const inf = 1 / sq(dropR + 1);
                        const _nx = nx + (r1 < 0.5 ? -m : m);
                        const _ny = ny + (r2 < 0.5 ? -k : k);
                        if (_nx < 0 || _ny < 0 || _nx >= mapW - 1 || _ny >= mapH - 1) break;
                        const eroAmt = min((sedCap - sediment) * eroSpd, -dHt) * eroMap[_nx][_ny] * inf;
                        const ds = min(mp[_nx][_ny], eroAmt);
                        mp[_nx][_ny] -= ds;
                        sediment += ds;
                    }
                }
            }
            speed = sqrt(speed * speed + abs(dHt) * gravity);
            water *= 1 - evapSpd;
            if (water < 0.0001) break;
        }
    }
}

function blurMap(mp: number[][], it: number, strength: number) {
    for (let k = 0; k < it; k++) {
        for (let i = 0; i < mp.length; i++) {
            for (let j = 0; j < mp[0].length; j++) {
                let sum = mp[i][j],
                    count = 1;
                if (i > 0) {
                    sum += mp[i - 1][j];
                    count++;
                    if (j > 0) {
                        sum += mp[i - 1][j - 1];
                        count++;
                    }
                    if (j < mp[0].length - 1) {
                        sum += mp[i - 1][j + 1];
                        count++;
                    }
                }
                if (i < mp.length - 1) {
                    sum += mp[i + 1][j];
                    count++;
                    if (j > 0) {
                        sum += mp[i + 1][j - 1];
                        count++;
                    }
                    if (j < mp[0].length - 1) {
                        sum += mp[i + 1][j + 1];
                        count++;
                    }
                }
                mp[i][j] = lerp(mp[i][j], sum / count, strength);
            }
        }
    }
}

// ─── Sketchy shapes ───────────────────────────────────────────────────────────

type NoiseF = (x: number, y?: number, z?: number) => number;
type RNG = ReturnType<typeof makeRNG>;
type Pt = { x: number; y: number };

class SketchyShape {
    x = 0;
    y = 0;
    z = 0;
    angle = 0;
    wt = 1;
    maxV = 3;
    acc = 0.005;
    c: Col = [0, 0, 0, 64];
    density = 1;
    wobble = 0;
    lineLen = 0;
    pen: Vec = cv(0, 0);
    _pen: Vec = cv(0, 0);
    penV: Vec = cv(0, 0);
    penTargetIndex = 1;
    points: Pt[] = [];

    update(ctx: CanvasRenderingContext2D, noise: NoiseF, rng: RNG): 'done' | 'continue' {
        if (this.points.length < 2 || this.penTargetIndex >= this.points.length) return 'done';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const target = this.points[this.penTargetIndex];
        const dx = target.x - this.pen.x,
            dy = target.y - this.pen.y;
        this.penV.x += dx * this.acc;
        this.penV.y += dy * this.acc;

        const wv = vrot(cv(this.wobble, 0), rng.r01() * TAU, 0, 0);
        this.penV.x += wv.x;
        this.penV.y += wv.y;
        this.penV.x *= 0.8;
        this.penV.y *= 0.8;

        const vm = vmag(this.penV);
        if (vm > this.maxV) {
            const s = this.maxV / vm;
            this.penV.x *= s;
            this.penV.y *= s;
        }

        this.lineLen += vm;
        this._pen.x = this.pen.x;
        this._pen.y = this.pen.y;
        this.pen.x += this.penV.x;
        this.pen.y += this.penV.y;

        if (sq(target.x - this.pen.x) + sq(target.y - this.pen.y) < 9) {
            this.penTargetIndex++;
            if (this.penTargetIndex >= this.points.length) {
                ctx.restore();
                this.points = [];
                return 'done';
            }
        }

        ctx.fillStyle = col2css(this.c);
        const noiseV = mapRange(noise(this.lineLen * 0.001), 0, 1, 0.5, 1);
        for (let i = 0; i < this.density; i++) {
            const offDist = (sqrt(rng.r01()) * noiseV * this.wt) / 2;
            const offA = rng.r01() * TAU;
            ctx.fillRect(this.pen.x + cos(offA) * offDist - 0.5, this.pen.y + sin(offA) * offDist - 0.5, 1, 1);
        }
        ctx.restore();
        return 'continue';
    }

    setWeight(v: number) {
        this.wt = v;
    }
    setMaxV(v: number) {
        this.maxV = v;
    }
    setAcc(v: number) {
        this.acc = v;
    }
    setColor(v: Col) {
        this.c = v;
    }
    setDensity(v: number) {
        this.density = v;
    }
    setWobble(v: number) {
        this.wobble = v;
    }
    setAngle(v: number) {
        this.angle = v;
    }
}

class SketchyEllipse extends SketchyShape {
    constructor(cx: number, cy: number, rx: number, ry: number, hatchDensity: number, outline: boolean, noise: NoiseF) {
        super();
        this.x = cx;
        this.y = cy;
        this.points = [];

        if (outline) {
            const n = max(2, round(rx / hatchDensity) * 10);
            for (let i = 0; i < n; i++) {
                const a = mapRange(i, 0, n - 2, 0, TAU);
                this.points.push({ x: rx * cos(a), y: ry * sin(a) });
            }
        } else {
            const n = max(2, round(rx / hatchDensity));
            for (let i = 0; i < n; i++) {
                const x = mapRange(i, 0, n - 1, -rx, rx);
                const ht = ry * sqrt(max(0, 1 - sq(x) / sq(rx)));
                this.points.push({ x, y: ht });
                this.points.push({ x, y: -ht });
            }
        }
        void noise; // not used in ellipse construction (unlike quad)
        this.pen = cv(this.points[0].x, this.points[0].y);
        this._pen = cv(this.pen.x, this.pen.y);
        this.penV = cv(0, 0);
        this.penTargetIndex = 1;
    }
}

class SketchyQuad extends SketchyShape {
    constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, hatchDensity: number, noise: NoiseF) {
        super();
        this.x = (x1 + x2 + x3 + x4) / 4;
        this.y = (y1 + y2 + y3 + y4) / 4;
        const lx1 = x1 - this.x,
            ly1 = y1 - this.y,
            lx2 = x2 - this.x,
            ly2 = y2 - this.y;
        const lx3 = x3 - this.x,
            ly3 = y3 - this.y,
            lx4 = x4 - this.x,
            ly4 = y4 - this.y;
        const d12 = dist2(lx1, ly1, lx2, ly2),
            d34 = dist2(lx3, ly3, lx4, ly4);
        const n = max(2, round(max(d12, d34) / hatchDensity));
        this.points = [];
        for (let i = 0; i < n; i++) {
            const m = mapRange(i, 0, n - 1, 0, 1);
            let px = lerp(lx1, lx2, m),
                py = lerp(ly1, ly2, m);
            let na = noise(px * 0.08, py * 0.08) * TAU;
            this.points.push({ x: px + cos(na), y: py + sin(na) });
            px = lerp(lx4, lx3, m);
            py = lerp(ly4, ly3, m);
            na = noise(px * 0.08, py * 0.08) * TAU;
            this.points.push({ x: px + cos(na), y: py + sin(na) });
        }
        this.pen = cv(this.points[0].x, this.points[0].y);
        this._pen = cv(this.pen.x, this.pen.y);
        this.penV = cv(0, 0);
        this.penTargetIndex = 1;
    }
}

class SketchyRect extends SketchyQuad {
    constructor(cx: number, cy: number, w: number, h: number, hatchDensity: number, noise: NoiseF) {
        super(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, hatchDensity, noise);
    }
}

class SketchyWeightedLine extends SketchyRect {
    constructor(x1: number, y1: number, x2: number, y2: number, weight: number, hatchDensity: number, noise: NoiseF) {
        const ht = dist2(x1, y1, x2, y2);
        const ang = atan2(y2 - y1, x2 - x1);
        super(lerp(x1, x2, 0.5), lerp(y1, y2, 0.5), weight, ht, hatchDensity, noise);
        this.angle = ang + PI / 2;
    }
}

// ─── World setup ──────────────────────────────────────────────────────────────

const TARGET_SZ = 400;
const NOISE_SCALE = 0.01;

type World = {
    shapes: SketchyShape[];
    minY: number;
    maxY: number;
    palette: Col[];
    treePalette: Col[];
};

function hMapNormal(hMap: number[][], i: number, j: number, mapW: number, mapH: number): Vec {
    const _i = i === mapW - 1 ? i - 1 : i + 1,
        iDir = i === mapW - 1 ? -1 : 1;
    const _j = j === mapH - 1 ? j - 1 : j + 1,
        jDir = j === mapH - 1 ? -1 : 1;
    return cv((hMap[_i][j] - hMap[i][j]) * iDir, (hMap[i][_j] - hMap[i][j]) * jDir);
}

function hMapNormal2(hMap: number[][], i: number, j: number, mapW: number, mapH: number): Vec {
    const _i = i === mapW - 1 ? i - 1 : i + 1,
        iDir = i === mapW - 1 ? -1 : 1;
    const _j = j === mapH - 1 ? j - 1 : j + 1,
        jDir = j === mapH - 1 ? -1 : 1;
    const n = hMapNormal(hMap, i, j, mapW, mapH);
    const ni = hMapNormal(hMap, _i, j, mapW, mapH);
    const nj = hMapNormal(hMap, i, _j, mapW, mapH);
    return cv((ni.x - n.x) * iDir, (nj.y - n.y) * jDir);
}

function buildWorld(rngSeed: number, noiseSeed: number): World {
    const rng = makeRNG(rngSeed);
    // Use different offset for simplex-like noise
    const noise = makeNoise(noiseSeed);
    const sNoise = (x: number, y: number) => noise(x + 50000, y + 50000) * 2 - 1; // returns [-1,1]

    const { palettes, treePalettes } = buildPalettes();
    const paletteIndex = rng.pick([0, 1, 2, 3, 4, 5]);
    const palette = palettes[paletteIndex];
    const treePalette = treePalettes[paletteIndex];

    const paletteColor = (br: number): Col => palette[constrain(floor(br * palette.length), 0, palette.length - 1)];
    const treePaletteColor = (br: number): Col => treePalette[constrain(floor(br * treePalette.length), 0, treePalette.length - 1)];

    const lightAngle = -PI / 2 + ((rng.r01() < 0.5 ? -1 : 1) * PI) / 3;
    const lgt = vnorm(cv(cos(lightAngle), sin(lightAngle), 0));

    const terrainHt = -0.2 * TARGET_SZ;
    const warpSz = 10;

    // ── height map ──────────────────────────────────────────────────────────

    const mapW = 100,
        mapH = 100;
    const mapScale = rng.range(0.15, 1);
    const sustain = mapRange(mapScale, 0.15, 1, 0.6, 0.2);
    const noiseDist = [
        [1, 1 * mapScale],
        [sustain, 2 * mapScale],
        [pow(sustain, 2), 4 * mapScale],
    ];
    const noiseTotal = noiseDist.reduce((s, d) => s + d[0], 0);

    let minY = 1e13,
        maxY = -1e13;
    const hMap: number[][] = [];
    const erodeMap: number[][] = [];
    const depositMap: number[][] = [];

    for (let i = 0; i < mapW; i++) {
        const row: number[] = [],
            eroRow: number[] = [],
            depRow: number[] = [];
        for (let j = 0; j < mapH; j++) {
            let nx = 0;
            for (const [amp, freq] of noiseDist) {
                nx += norm(sNoise(i * NOISE_SCALE * freq * 2, j * NOISE_SCALE * freq * 2), -1, 1) * amp;
            }
            let ns = constrain(pow(mapRange(nx, 0, noiseTotal, 0, 1), 1), 0, 1);
            ns = floor(ns * 100000) / 100000;
            ns *= TAU * 2 * mapRange(j, 0, mapH, 1, 0.5);
            const y = mapRange(j, 0, mapH - 1, 0, TARGET_SZ) + mapRange(ns, 0, 2 * TAU, 0, 1) * terrainHt;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            row.push(ns);
            eroRow.push(0.1);
            depRow.push(0.001);
        }
        hMap.push(row);
        erodeMap.push(eroRow);
        depositMap.push(depRow);
    }

    const areaAdj = (mapW * mapH) / 10000;
    for (let pass = 0; pass < 3; pass++) erode(hMap, depositMap, erodeMap, floor(10000 * areaAdj), 1, 4, rng);
    erode(hMap, depositMap, erodeMap, floor(10000 * areaAdj), 1, 2, rng);
    blurMap(hMap, 1, 0.2);

    // ── light map ───────────────────────────────────────────────────────────

    const lMap: number[][] = [];
    for (let i = 0; i < mapW; i++) {
        const row: number[] = [];
        for (let j = 0; j < mapH; j++) {
            row.push(vdot(vnorm(hMapNormal(hMap, i, j, mapW, mapH)), lgt));
        }
        lMap.push(row);
    }

    // ── shape generation ────────────────────────────────────────────────────

    const shapes: SketchyShape[] = [];

    const addTree = (x: number, y: number, z: number, lightValue: number, treeHt: number) => {
        const trunkWiggle = 2;
        const trunk = new SketchyWeightedLine(
            x + rng.range(-1, 1) * trunkWiggle,
            y + rng.range(-1, 1) * trunkWiggle,
            x + rng.range(-1, 1) * trunkWiggle,
            y - treeHt + rng.range(-1, 1) * trunkWiggle,
            0.5,
            0.2,
            noise,
        );
        trunk.setWeight(1.5);
        trunk.setMaxV(0.3);
        trunk.setAcc(0.02);
        trunk.setDensity(1);
        trunk.setWobble(0.2);
        trunk.setAngle(0);
        trunk.z = z;
        trunk.setColor(withA(treePaletteColor(rng.range(0.5)), 64));
        shapes.push(trunk);

        const nClumps = round(rng.range(4, 5));
        for (let j = 0; j < nClumps; j++) {
            const branchHt = rng.range(0.1, 1);
            const branchStartY = lerp(y, y - treeHt, branchHt);
            let co = cv(0, -rng.r01() * treeHt * 0.7 * mapRange(branchHt, 0.1, 1, 0.5, 0.8));
            co = vrot(co, (rng.range(-1, 1) * PI) / 2, 0, 0);
            co.y *= rng.range(1, 2);

            const branch = new SketchyWeightedLine(x, branchStartY, x + co.x, y - treeHt + co.y, 0.25, 0.1, noise);
            branch.setWeight(1.5);
            branch.setMaxV(0.3);
            branch.setAcc(0.02);
            branch.setDensity(1);
            branch.setWobble(0.2);
            branch.z = z;
            branch.setColor(withA(treePaletteColor(0), 64));
            shapes.push(branch);

            const nLeaves = round(rng.range(2, 20));
            for (let i = 0; i < nLeaves; i++) {
                const r = rng.range(2, 3) * mapRange(i, 0, nLeaves, 1.5, 1);
                const off = vrot(cv(rng.r01() * r * 1.8, 0), rng.r01() * TAU, 0, 0);
                const leaf = new SketchyEllipse(x + off.x + co.x, y - treeHt + off.y + co.y, 4, r * 2, rng.range(1, 1.1), false, noise);
                leaf.z = z;
                leaf.setWeight(2.5);
                leaf.setMaxV(1);
                leaf.setAcc(0.02);
                leaf.setDensity(2);
                leaf.setWobble(0.2);
                leaf.setAngle((mapRange(noise(leaf.x * NOISE_SCALE * 3, leaf.y * NOISE_SCALE * 3), 0, 1, -1, 1) * PI) / 6);
                const normal = vnorm(cv(-co.x * 0.3 - off.x, co.y * 0.3 + off.y + 6));
                const br = constrain(pow(norm(vdot(normal, lgt), -1, 1), mapRange(lightValue, 0, 1, 8, 1)) + mapRange(lightValue, 0, 1, 0, 0.2) + rng.range(-1, 1) * 0.1, 0, 1);
                leaf.setColor(withA(treePaletteColor(br), 64));
                shapes.push(leaf);
            }
        }
    };

    const addBush = (x: number, y: number, z: number, lightValue: number, rockHt: number, mi: number, mj: number) => {
        const nrm = vnorm(hMapNormal(hMap, mi, mj, mapW, mapH));
        const nClumps = round(rng.range(4, 5));
        for (let j = 0; j < nClumps; j++) {
            let co = cv(0, -rng.r01() * rockHt * 0.1);
            co = vrot(co, (rng.range(-1, 1) * PI) / 2, 0, 0);
            co.y = -abs(co.y);
            const nRocks = round(rng.range(10, 20) * 0.4);
            for (let i = 0; i < nRocks; i++) {
                const r = rng.range(2, 3) * mapRange(i, 0, nRocks, 1.5, 1);
                const off = vrot(cv(rng.r01() * r * 1.5, 0), rng.r01() * TAU, 0, 0);
                off.y = -abs(off.y);
                const rock = new SketchyEllipse(x + off.x + co.x, y + off.y + co.y, r * 2, 4, rng.range(1, 1.1), false, noise);
                rock.z = z;
                rock.setWeight(1.5);
                rock.setMaxV(1);
                rock.setAcc(0.02);
                rock.setDensity(2);
                rock.setWobble(0.2);
                const normal = vnorm(cv(-co.x * 0.3 - off.x, co.y * 0.3 + off.y + 6));
                const br = constrain(pow(norm(vdot(normal, lgt), -1, 1), mapRange(lightValue, 0, 1, 8, 1)) + mapRange(lightValue, 0, 1, 0, 0.2) + rng.range(-1, 1) * 0.4, 0, 1);
                rock.setColor(withA(treePaletteColor(br), 64));
                rock.setAngle(mapRange(nrm.x, 1, -1, 0, PI / 2) + PI / 4 + (round(rng.r01()) * 2 - 1) * PI + PI / 2 + mapRange(normal.x, -1, 1, 1, -1) * rng.range(PI / 4, PI / 8));
                shapes.push(rock);
            }
        }
    };

    const treeToScrubThresh = rng.range(0.18, 0.28);
    const plantThresh = constrain(rng.range(0.3, 0.5), 0.3, 0.45);
    const plantSide = rng.pick([-1, 1]);
    const plantSlopeLeniency = rng.range(0.01, 0.1);

    const nShapes = 8000;
    const nCircles = floor(nShapes * 0.2);

    // Pass 1: terrain scribbles + trees/bushes
    for (let _i = 0; _i < nCircles; _i++) {
        let x = rng.range(TARGET_SZ),
            y = rng.range(TARGET_SZ);
        const z = y + 10;
        const mi = constrain(floor(mapRange(x, 0, TARGET_SZ, 0, mapW - 1)), 0, mapW - 1);
        const mj = constrain(floor(mapRange(y, 0, TARGET_SZ, 0, mapH - 1)), 0, mapH - 1);
        const ns = hMap[mi][mj];
        if (ns === 0) continue;

        x += cos(ns) * warpSz;
        y += sin(ns) * warpSz;
        y += mapRange(ns, 0, 2 * TAU, 0, 1) * terrainHt;

        const nrm = vnorm(hMapNormal(hMap, mi, mj, mapW, mapH));
        const dt = vdot(nrm, lgt);
        const nrm2 = hMapNormal2(hMap, mi, mj, mapW, mapH);

        const r = rng.range(4, 4);
        const off = vscale(vrot(cv(1, 0), noise(x * NOISE_SCALE, y * NOISE_SCALE, rng.r01() * TAU * 0.1) * 2 * TAU, 0, 0), rng.r01() * r);
        const scribble = new SketchyEllipse(x + off.x, y + off.y, r, r, 1, false, noise);
        scribble.z = z;
        scribble.setWeight(2.5);
        scribble.setMaxV(0.3);
        scribble.setAcc(0.01);
        scribble.setDensity(1);
        scribble.setWobble(0.1);
        scribble.setAngle(rng.r01() * TAU);
        const lightValue = norm(dt, -1, 1);
        const landValue = noise(mi * NOISE_SCALE * 4 + 1000, mj * NOISE_SCALE * 4 + 1000);
        const col = paletteColor(lerp(landValue, lightValue, constrain(abs(lightValue - 0.5) * 2 + rng.range(-1, 1) * 0.1, 0, 1)));
        scribble.setColor(withA(col, 64));
        shapes.push(scribble);

        const treeNs = noise(mi * NOISE_SCALE * 3 + 1234, mj * NOISE_SCALE * 3 + 1234);
        if (abs(nrm.x) < plantThresh && (plantSide < 0 ? nrm2.x < rng.r01() * plantSlopeLeniency : nrm2.x > -rng.r01() * plantSlopeLeniency)) {
            let shadowLength = 0.5;
            const treeHtNs = noise(mi * NOISE_SCALE * 9 + 100, mj * NOISE_SCALE * 9 + 123);
            if (treeNs > treeToScrubThresh) {
                if (ns < PI * 2.5 && mj > 4) {
                    addTree(x, y, z - 10, lightValue, mapRange(treeHtNs, 0, 1, 10, 80));
                    shadowLength = 1;
                }
                if (rng.r01() < 0.5) addBush(x, y, z - 10 + 0.0001, lightValue, mapRange(treeHtNs, 0, 1, 10, 100) * 0.5, mi, mj);
            } else {
                addBush(x, y, z - 10 + 0.0001, lightValue, mapRange(treeHtNs, 0, 1, 10, 100), mi, mj);
            }
            const w = mapRange(treeHtNs, 0, 1, 4, 8) * shadowLength;
            const h = mapRange(treeHtNs, 0, 1, 1, 3);
            for (let wi = -w; wi <= w; wi++) {
                for (let wj = -h; wj <= h; wj++) {
                    const si = floor(mi + wi + cos(lightAngle) * w * 0.5);
                    const sj = floor(mj + wj + sin(lightAngle) * h * 0.5);
                    if (si >= 0 && si < mapW && sj >= 0 && sj < mapH) lMap[si][sj] = lerp(lMap[si][sj], -1, 0.7);
                }
            }
        }
    }

    // Pass 2: main terrain strokes
    for (let _i = 0; _i < nShapes; _i++) {
        let x = rng.range(TARGET_SZ),
            y = rng.range(TARGET_SZ);
        const z = y;
        const mi = constrain(floor(mapRange(x, 0, TARGET_SZ, 0, mapW - 1)), 0, mapW - 1);
        const mj = constrain(floor(mapRange(y, 0, TARGET_SZ, 0, mapH - 1)), 0, mapH - 1);
        const ns = hMap[mi][mj];
        x += cos(ns) * warpSz;
        y += sin(ns) * warpSz;
        y += mapRange(ns, 0, 2 * TAU, 0, 1) * terrainHt;

        const nrm = vnorm(hMapNormal(hMap, mi, mj, mapW, mapH));
        const dt = lMap[mi][mj];
        const nrm2sq = vmagsq(hMapNormal2(hMap, mi, mj, mapW, mapH));
        const minLen = 15,
            maxLen = 30 * 0.8;
        const nScribbles = max(1, floor(mapRange(pow(abs(y - z), 1), 0, pow(abs(terrainHt) + abs(warpSz), 1), 1, rng.range(1, 3))));

        for (let k = 0; k < nScribbles; k++) {
            const r = constrain(mapRange(nrm2sq, 0.0001, 0.0008, maxLen, minLen), minLen, maxLen);
            const scribble = new SketchyEllipse(x, y, 5, r * rng.range(0.9, 1.1), rng.range(1, 2), false, noise);
            scribble.z = z;
            scribble.setWeight(2.5);
            scribble.setMaxV(1);
            scribble.setAcc(0.02);
            scribble.setDensity(2);
            scribble.setWobble(0.2);
            scribble.setAngle(mapRange(nrm.x, 1, -1, 0, PI / 2) + PI / 4 + (round(rng.r01()) * 2 - 1) * PI);

            for (let pi = 0; pi < scribble.points.length; pi++) {
                const pt = scribble.points[pi];
                const pns = (noise(pt.x * NOISE_SCALE * 4 + 100, pt.y * NOISE_SCALE * 4 + 100) * 2 - 1) * 2 * TAU;
                pt.x += cos(pns) * 2;
                pt.y += sin(pns) * 2;
            }

            const lightValue = norm(dt, -1, 1);
            const landValue = noise(mi * NOISE_SCALE * 4 + 1000, mj * NOISE_SCALE * 4 + 1000);
            const col = paletteColor(lerp(landValue, lightValue, abs(lightValue - 0.5) * 2));
            scribble.setColor(withA(col, 64));
            shapes.push(scribble);
        }
    }

    // Sort descending so shapes[last] = lowest z (background), drawn first
    shapes.sort((a, b) => b.z - a.z);

    return { shapes, minY, maxY, palette, treePalette };
}

// ─── Page component ───────────────────────────────────────────────────────────

export function ArtSagebrushPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'drawing' | 'done'>('loading');
    const worldRef = useRef<World | null>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        if (!ctx) return;

        const SCL = 0.7;
        const canvSz = min(window.innerWidth, window.innerHeight);
        canvas.width = canvSz;
        canvas.height = canvSz;

        ctx.fillStyle = '#dfd8ce';
        ctx.fillRect(0, 0, canvSz, canvSz);

        // Build world off the main thread tick so "loading" renders first
        const buildTimer = setTimeout(() => {
            const rngSeed = floor(Math.random() * 100000000);
            const noiseSeed = floor(Math.random() * 100000000);
            worldRef.current = buildWorld(rngSeed, noiseSeed);
            setStatus('drawing');

            const { shapes, minY, maxY } = worldRef.current;
            const sizeAdj = canvSz / TARGET_SZ;
            const sf = SCL * sizeAdj;

            // Create once — must persist across frames for correct RNG state
            const drawNoise = makeNoise(noiseSeed);
            const drawRng = makeRNG(rngSeed + 1); // +1 offset from world-build rng

            function drawFrame() {
                if (!worldRef.current || shapes.length === 0) {
                    setStatus('done');
                    return;
                }

                ctx.save();
                ctx.scale(sf, sf);
                ctx.translate(canvSz / (2 * sf) - TARGET_SZ * 0.5, canvSz / (2 * sf) - (maxY - minY) * 0.5 - minY);

                for (let i = 0; i < 2000; i++) {
                    if (shapes.length === 0) break;
                    const shape = shapes[shapes.length - 1];
                    const result = shape.update(ctx, drawNoise, drawRng);
                    if (result === 'done') {
                        shapes.pop();
                        if (shapes.length === 0) break;
                    }
                }
                ctx.restore();

                if (shapes.length > 0) {
                    rafRef.current = requestAnimationFrame(drawFrame);
                } else {
                    setStatus('done');
                }
            }

            rafRef.current = requestAnimationFrame(drawFrame);
        }, 50);

        return () => {
            clearTimeout(buildTimer);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#212121]">
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#dfd8ce] text-sm tracking-widest uppercase opacity-60">Generating…</span>
                </div>
            )}
        </div>
    );
}
