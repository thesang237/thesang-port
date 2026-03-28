'use client';

import { useEffect, useRef, useState } from 'react';

import { CodeBlock } from '@/components/code-block';
import { FadeIn, NOISE_BG } from '@/components/fade-in';
import TransitionLink from '@/components/ui/transition-link';

// ─── Primitives ───────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black font-mono shrink-0"
            style={{ fontSize: '12px' }}
        >
            {n}
        </span>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <code className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-mono rounded px-1.5 py-0.5" style={{ fontSize: '12px' }}>
            {children}
        </code>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />;
}

function Callout({ children, variant = 'tip' }: { children: React.ReactNode; variant?: 'tip' | 'info' | 'warn' }) {
    const styles = {
        tip: 'bg-amber-500/5 border-amber-500/20 text-amber-200/90',
        info: 'bg-stone-500/10 border-stone-500/20 text-stone-200/90',
        warn: 'bg-orange-500/5 border-orange-500/20 text-orange-200/90',
    };
    const icons = { tip: '💡', info: 'ℹ️', warn: '⚠️' };
    return (
        <div className={`border rounded-xl px-4 py-3 leading-relaxed flex gap-2.5 ${styles[variant]}`} style={{ fontSize: '13px' }}>
            <span className="shrink-0 mt-0.5">{icons[variant]}</span>
            <span>{children}</span>
        </div>
    );
}

// ─── Shared math ──────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

// sfc32 — same algorithm used inside cantera.js's PRNG
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

// The exact Art Blocks seeding: parse 4 uint32s from 32-char hex substring
function makeArtBlocksPRNG(hash: string) {
    const h = hash.startsWith('0x') ? hash.slice(2) : hash;
    const a = parseInt(h.substring(0, 8), 16);
    const b = parseInt(h.substring(8, 16), 16);
    const c = parseInt(h.substring(16, 24), 16);
    const d = parseInt(h.substring(24, 32), 16);
    const gen = makeSfc32(a, b, c, d);
    // warm-up — cantera runs 500 000 cycles per generator
    for (let i = 0; i < 500_000; i++) gen();
    return gen;
}

// Minimal 3D Perlin noise (matches cantera's helper)
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
function buildNoise(seed: number) {
    let s = seed | 0;
    const lcg = () => {
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        return (s >>> 0) / 0x100000000;
    };
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(lcg() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return (px: number, py = 0, pz = 0) => {
        const X = Math.floor(px) & 255,
            Y = Math.floor(py) & 255,
            Z = Math.floor(pz) & 255;
        const x = px - Math.floor(px),
            y = py - Math.floor(py),
            z = pz - Math.floor(pz);
        const u = _fade(x),
            v = _fade(y),
            w = _fade(z);
        const A = perm[X] + Y,
            B = perm[X + 1] + Y,
            AA = perm[A] + Z,
            AB = perm[A + 1] + Z,
            BA = perm[B] + Z,
            BB = perm[B + 1] + Z;
        const g = (h: number, dx: number, dy: number, dz: number) => {
            const gg = _G3[h % 12];
            return gg[0] * dx + gg[1] * dy + gg[2] * dz;
        };
        return (
            (lerp(
                lerp(lerp(g(perm[AA], x, y, z), g(perm[BA], x - 1, y, z), u), lerp(g(perm[AB], x, y - 1, z), g(perm[BB], x - 1, y - 1, z), u), v),
                lerp(lerp(g(perm[AA + 1], x, y, z - 1), g(perm[BA + 1], x - 1, y, z - 1), u), lerp(g(perm[AB + 1], x, y - 1, z - 1), g(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
                w,
            ) +
                1) *
            0.5
        );
    };
}
const NOISE = buildNoise(42);

// ─── Demo 1: PRNG ─────────────────────────────────────────────────────────────

const PALETTES = [
    { name: 'graphite', terclr: [45, 48, 53], cutclr: [214, 196, 188] },
    { name: 'crimson', terclr: [75, 43, 43], cutclr: [255, 204, 185] },
    { name: 'goldblack', terclr: [65, 62, 54], cutclr: [226, 193, 142] },
    { name: 'blackAndWhite', terclr: [48, 48, 48], cutclr: [230, 230, 230] },
    { name: 'darkgreen', terclr: [48, 60, 58], cutclr: [203, 197, 196] },
    { name: 'sepia', terclr: [64, 57, 47], cutclr: [255, 229, 192] },
];

function randomHex64() {
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    return '0x' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

function deriveParams(hash: string) {
    const prngA = makeArtBlocksPRNG(hash.slice(0, 34)); // first 32 hex chars
    const prngB = makeArtBlocksPRNG('0x' + hash.slice(34)); // last 32 hex chars
    let useA = false;
    const R = () => {
        useA = !useA;
        return useA ? prngA() : prngB();
    };
    const terchange = R() < 0.6;
    const flatten = R() < 0.4;
    const stripes = Math.round(R());
    const mill = R() > 0.36;
    const palIdx = Math.min(5, Math.max(0, Math.floor(0.99 * 6 * R())));
    const camtype = Math.max(0, Math.floor(1.4 * R()));
    const grid = R() > 0.35;
    const smgrid = R() > 0.35;
    // first 64 raw outputs for visualisation
    const stream: number[] = [];
    for (let i = 0; i < 64; i++) stream.push(R());
    return { terchange, flatten, stripes, mill, palIdx, camtype, grid, smgrid, stream };
}

function PRNGDemo() {
    const [hash, setHash] = useState('0x86facdd03e31f201a86f89af35deaa4330aaf153067b83cec7fc194a27ca6856');
    const params = (() => {
        try {
            return deriveParams(hash);
        } catch {
            return null;
        }
    })();

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                <span className="font-mono text-zinc-500" style={{ fontSize: '11px' }}>
                    TOKEN HASH → WORLD PARAMS
                </span>
                <button
                    onClick={() => setHash(randomHex64())}
                    className="px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-mono transition-colors"
                    style={{ fontSize: '11px' }}
                >
                    re-roll hash ↺
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* hash display */}
                <div className="font-mono text-zinc-500 break-all leading-relaxed" style={{ fontSize: '10px' }}>
                    <span className="text-zinc-600">prngA seed → </span>
                    <span className="text-amber-400/70">{hash.slice(0, 18)}</span>
                    <span className="text-amber-400/40">{hash.slice(18, 34)}</span>
                    {'  '}
                    <span className="text-zinc-600">prngB seed → </span>
                    <span className="text-sky-400/70">{hash.slice(34, 50)}</span>
                    <span className="text-sky-400/40">{hash.slice(50)}</span>
                </div>

                {/* random stream */}
                {params && (
                    <div>
                        <p className="font-mono text-zinc-600 mb-2" style={{ fontSize: '10px' }}>
                            FIRST 64 VALUES — alternating prngA (amber) / prngB (blue)
                        </p>
                        <div className="flex flex-wrap gap-0.5">
                            {params.stream.map((v, i) => (
                                <div
                                    key={i}
                                    title={v.toFixed(4)}
                                    style={{
                                        width: 18,
                                        height: 18,
                                        background: i % 2 === 0 ? `rgba(251,191,36,${0.15 + v * 0.7})` : `rgba(56,189,248,${0.15 + v * 0.7})`,
                                        borderRadius: 2,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* derived params */}
                {params && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { label: 'palette', value: PALETTES[params.palIdx].name },
                            { label: 'camera', value: params.camtype === 0 ? 'dimetric' : 'top-down' },
                            { label: 'has buildings', value: params.mill ? 'yes' : 'no' },
                            { label: 'terrain change', value: params.terchange ? 'yes' : 'no' },
                            { label: 'flatten', value: params.flatten ? 'yes' : 'no' },
                            { label: 'stripes', value: params.stripes ? 'on' : 'off' },
                            { label: 'grid lines', value: params.grid ? 'yes' : 'no' },
                            { label: 'fine grid', value: params.smgrid ? 'yes' : 'no' },
                        ].map(({ label, value }) => (
                            <div key={label} className="rounded-lg border border-zinc-800 px-3 py-2 bg-zinc-900">
                                <p className="font-mono text-zinc-600 mb-0.5" style={{ fontSize: '9px' }}>
                                    {label.toUpperCase()}
                                </p>
                                <p className="font-mono text-amber-400" style={{ fontSize: '12px' }}>
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* palette swatch */}
                {params && (
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-zinc-600" style={{ fontSize: '10px' }}>
                            TERCLR
                        </span>
                        <div className="w-8 h-5 rounded border border-zinc-700" style={{ background: `rgb(${PALETTES[params.palIdx].terclr.join(',')})` }} />
                        <span className="font-mono text-zinc-600" style={{ fontSize: '10px' }}>
                            CUTCLR
                        </span>
                        <div className="w-8 h-5 rounded border border-zinc-700" style={{ background: `rgb(${PALETTES[params.palIdx].cutclr.join(',')})` }} />
                        <span className="font-mono text-zinc-500" style={{ fontSize: '10px' }}>
                            {PALETTES[params.palIdx].name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Demo 2: Noise at cantera's scales ───────────────────────────────────────

function NoiseDemo() {
    const refs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
    const scales = [0.004, 0.012, 0.025];
    const labels = ['0.004 — terrain macro', '0.012 — terrain detail', '0.025 — surface texture'];

    useEffect(() => {
        const N = 120;
        refs.forEach((ref, si) => {
            const canvas = ref.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = N;
            canvas.height = N;
            const img = ctx.createImageData(N, N);
            for (let y = 0; y < N; y++)
                for (let x = 0; x < N; x++) {
                    const v = NOISE(x * scales[si], y * scales[si], 0);
                    const c = Math.round(v * 255);
                    const i = (y * N + x) * 4;
                    img.data[i] = c;
                    img.data[i + 1] = c;
                    img.data[i + 2] = c;
                    img.data[i + 3] = 255;
                }
            ctx.putImageData(img, 0, 0);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-wrap gap-4">
            {refs.map((ref, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                    <canvas ref={ref} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: 120, height: 120 }} />
                    <span className="font-mono text-zinc-500 text-center" style={{ fontSize: '9px' }}>
                        {labels[i]}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Demo 3: Heightmap + Erosion ─────────────────────────────────────────────

const HM_N = 80;

function buildHM(): number[][] {
    const hm: number[][] = Array.from({ length: HM_N }, (_, x) =>
        Array.from({ length: HM_N }, (_, y) => {
            let v = 0;
            // three octaves matching cantera's NoiseGrowth layers
            v += NOISE(x * 0.025, y * 0.025, 0) * 0.5;
            v += NOISE(x * 0.05, y * 0.05, 1) * 0.3;
            v += NOISE(x * 0.1, y * 0.1, 2) * 0.2;
            return v;
        }),
    );
    // normalise
    let mn = 1,
        mx = 0;
    for (const row of hm)
        for (const v of row) {
            if (v < mn) mn = v;
            if (v > mx) mx = v;
        }
    for (let x = 0; x < HM_N; x++) for (let y = 0; y < HM_N; y++) hm[x][y] = (hm[x][y] - mn) / (mx - mn);
    return hm;
}

function erodeHM(hm: number[][], drops: number): number[][] {
    const m = hm.map((r) => [...r]);
    const N = m.length;
    let sx = Math.floor(Math.random() * N);
    for (let d = 0; d < drops; d++) {
        // deterministic seed cycling for reproducibility
        sx = (sx * 1664525 + 1013904223) & 0xffffffff;
        let px = Math.abs(sx % N),
            py = Math.abs(((sx * 6364136223846793) & 0xffffffff) % N);
        let dx = 0,
            dy = 0,
            _water = 1,
            sed = 0;
        for (let i = 0; i < 40; i++) {
            const cx = Math.round(px),
                cy = Math.round(py);
            if (cx < 1 || cy < 1 || cx >= N - 1 || cy >= N - 1) break;
            const gx = (m[cx + 1][cy] - m[cx - 1][cy]) * 0.5;
            const gy = (m[cx][cy + 1] - m[cx][cy - 1]) * 0.5;
            dx = dx * 0.5 - gx * 0.5;
            dy = dy * 0.5 - gy * 0.5;
            const dm = Math.sqrt(dx * dx + dy * dy);
            if (dm < 0.0001) break;
            dx /= dm;
            dy /= dm;
            px += dx;
            py += dy;
            if (px < 0 || px >= N - 1 || py < 0 || py >= N - 1) break;
            const nh = m[Math.round(px)][Math.round(py)];
            const oh = m[cx][cy];
            const dh = nh - oh;
            const cap = Math.max(-dh * 4, 0.001);
            if (sed > cap || dh > 0) {
                const dep = Math.min(dh > 0 ? dh : (sed - cap) * 0.3, sed);
                sed -= dep;
                m[cx][cy] += dep;
            } else {
                const ero = Math.min((-dh + (cap - sed)) * 0.3, 0.05);
                m[cx][cy] -= ero;
                sed += ero;
            }
            _water *= 0.9;
        }
    }
    return m;
}

function drawHM(canvas: HTMLCanvasElement, hm: number[][]) {
    const N = hm.length;
    canvas.width = N;
    canvas.height = N;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    for (let x = 0; x < N; x++)
        for (let y = 0; y < N; y++) {
            const v = hm[x][y];
            const i = (y * N + x) * 4;
            // terrain colouring similar to cantera TERCLR
            const r = Math.round(lerp(45, 180, v));
            const g = Math.round(lerp(48, 170, v));
            const b = Math.round(lerp(53, 150, v));
            img.data[i] = r;
            img.data[i + 1] = g;
            img.data[i + 2] = b;
            img.data[i + 3] = 255;
        }
    ctx.putImageData(img, 0, 0);
}

function HeightmapDemo() {
    const beforeRef = useRef<HTMLCanvasElement>(null);
    const afterRef = useRef<HTMLCanvasElement>(null);
    const [eroded, setEroded] = useState(false);
    const hmRef = useRef<number[][]>([]);

    useEffect(() => {
        hmRef.current = buildHM();
        if (beforeRef.current) drawHM(beforeRef.current, hmRef.current);
        if (afterRef.current) drawHM(afterRef.current, erodeHM(hmRef.current, 1200));
        // setState after async canvas work is intentional here — triggers re-render to show the "eroded" label
        setTimeout(() => setEroded(true), 0);
    }, []);

    return (
        <div className="flex flex-wrap gap-6 items-start">
            <div className="flex flex-col gap-1.5">
                <canvas ref={beforeRef} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: 160, height: 160 }} />
                <span className="font-mono text-zinc-500 text-center" style={{ fontSize: '9px' }}>
                    NOISE STACK — before erosion
                </span>
            </div>
            <div className="flex flex-col gap-1.5">
                <canvas ref={afterRef} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: 160, height: 160 }} />
                <span className="font-mono text-zinc-500 text-center" style={{ fontSize: '9px' }}>
                    AFTER 1 200 EROSION DROPS
                </span>
            </div>
            {eroded && (
                <div className="text-zinc-500 max-w-xs leading-relaxed self-center" style={{ fontSize: '12px' }}>
                    Erosion carves <span className="text-zinc-300">gullies</span> following the steepest gradient. Sediment accumulates on flat areas, softening peaks and creating natural valley
                    floors.
                </div>
            )}
        </div>
    );
}

// ─── Demo 4: Oblique projection ───────────────────────────────────────────────

function rotate2D(x: number, y: number, a: number): [number, number] {
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}
function rotateXZ(x: number, y: number, z: number, pitch: number, yaw: number): [number, number, number] {
    const [y2, z2] = rotate2D(y, z, pitch);
    const [x3, y3] = rotate2D(x, y2, yaw);
    return [x3, y3, z2];
}

function ProjectionDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pitch, setPitch] = useState(Math.PI / 4);
    const [yaw, setYaw] = useState(-Math.PI / 4);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = 300,
            H = 200;
        canvas.width = W;
        canvas.height = H;
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, W, H);

        // Camera basis vectors (cantera's Camera class)
        const px = rotateXZ(1, 0, 0, pitch, yaw);
        const py = rotateXZ(0, 1, 0, pitch, yaw);
        const pz = rotateXZ(0, 0, 1, pitch, yaw);
        const origin = [150, 100, 0]; // screen centre
        const scale = 40;
        const squeeze = 0.85;

        const project = (x: number, y: number, z: number): [number, number, number] => {
            const diff = [x, y, z];
            const sx = origin[0] + ((diff[0] * px[0] + diff[1] * px[1] + diff[2] * px[2]) / scale) * W * 0.5;
            const sy = origin[1] - ((diff[0] * py[0] + diff[1] * py[1] + diff[2] * py[2]) / (scale * squeeze)) * W * 0.5;
            const depth = -(diff[0] * pz[0] + diff[1] * pz[1] + diff[2] * pz[2]);
            return [sx, sy, depth];
        };

        // Draw a simple voxel city — 3×3 towers
        const blocks: [number, number, number, number, number, number, string][] = [];
        const heights = [
            [3, 5, 2],
            [4, 7, 3],
            [2, 4, 5],
        ];
        for (let bx = 0; bx < 3; bx++)
            for (let by = 0; by < 3; by++) {
                const h = heights[bx][by];
                for (let bz = 0; bz < h; bz++) {
                    blocks.push([bx - 1, by - 1, bz, 1, 1, 1, bz === h - 1 ? 'roof' : 'wall']);
                }
            }
        // sort back to front
        blocks.sort((a, b) => {
            const [, , da] = project(a[0] + 0.5, a[1] + 0.5, a[2] + 0.5);
            const [, , db] = project(b[0] + 0.5, b[1] + 0.5, b[2] + 0.5);
            return da - db;
        });

        for (const [bx, by, bz, , , , type] of blocks) {
            const corners3D: [number, number, number][] = [
                [bx, by, bz],
                [bx + 1, by, bz],
                [bx + 1, by + 1, bz],
                [bx, by + 1, bz],
                [bx, by, bz + 1],
                [bx + 1, by, bz + 1],
                [bx + 1, by + 1, bz + 1],
                [bx, by + 1, bz + 1],
            ];
            const pts = corners3D.map(([x, y, z]) => project(x, y, z));
            const faces = [
                { idx: [4, 5, 6, 7], color: type === 'roof' ? '#8a8070' : '#5a5448' }, // top
                { idx: [0, 1, 5, 4], color: '#3a3530' }, // front-Y
                { idx: [1, 2, 6, 5], color: '#312e2a' }, // front-X
            ];
            for (const { idx, color } of faces) {
                ctx.beginPath();
                ctx.moveTo(pts[idx[0]][0], pts[idx[0]][1]);
                for (let i = 1; i < idx.length; i++) ctx.lineTo(pts[idx[i]][0], pts[idx[i]][1]);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = '#1a1814';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        // draw axis labels
        ctx.font = '10px monospace';
        ctx.fillStyle = '#e84';
        ctx.fillText('X', ...(project(2.2, 0, 0).slice(0, 2) as [number, number]));
        ctx.fillStyle = '#4ae';
        ctx.fillText('Y', ...(project(0, 2.2, 0).slice(0, 2) as [number, number]));
        ctx.fillStyle = '#8e4';
        ctx.fillText('Z', ...(project(0, 0, 3.8).slice(0, 2) as [number, number]));
    }, [pitch, yaw]);

    return (
        <div className="flex flex-wrap gap-6 items-start">
            <canvas ref={canvasRef} className="rounded-lg border border-zinc-700" style={{ width: 300, height: 200 }} />
            <div className="flex flex-col gap-4 justify-center">
                {[
                    { label: 'Pitch (α)', value: pitch, min: 0, max: Math.PI / 2, step: 0.01, set: setPitch },
                    { label: 'Yaw (β)', value: yaw, min: -Math.PI, max: Math.PI, step: 0.01, set: setYaw },
                ].map(({ label, value, min, max, step, set }) => (
                    <label key={label} className="flex flex-col gap-1.5">
                        <span className="font-mono text-zinc-400" style={{ fontSize: '11px' }}>
                            {label} <span className="text-zinc-600">{value.toFixed(2)} rad</span>
                        </span>
                        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(parseFloat(e.target.value))} className="accent-amber-500 w-40" />
                    </label>
                ))}
                <div className="font-mono space-y-0.5" style={{ fontSize: '10px' }}>
                    <p className="text-zinc-600">cantera defaults:</p>
                    <p>
                        <span className="text-amber-400">dimetric</span> α=0.79 β=−0.79
                    </p>
                    <p>
                        <span className="text-sky-400">top-down</span> α=0.79 β=0.00
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Demo 5: Boids ────────────────────────────────────────────────────────────

type Boid = { x: number; y: number; vx: number; vy: number };

function BoidsDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boidsRef = useRef<Boid[]>([]);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const W = 300,
            H = 180;
        const N = 30;
        boidsRef.current = Array.from({ length: N }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
        }));

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;

        const tick = () => {
            const boids = boidsRef.current;
            ctx.fillStyle = 'rgba(15,14,12,0.35)';
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < boids.length; i++) {
                const b = boids[i];
                let ax = 0,
                    ay = 0,
                    cx = 0,
                    cy = 0,
                    sx = 0,
                    sy = 0,
                    nc = 0;

                for (let j = 0; j < boids.length; j++) {
                    if (i === j) continue;
                    const dx = boids[j].x - b.x,
                        dy = boids[j].y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 50) {
                        cx += boids[j].x;
                        cy += boids[j].y; // cohesion
                        ax += boids[j].vx;
                        ay += boids[j].vy; // alignment
                        nc++;
                    }
                    if (dist < 18) {
                        sx -= dx;
                        sy -= dy;
                    } // separation
                }
                if (nc > 0) {
                    b.vx += (cx / nc - b.x) * 0.001 + (ax / nc) * 0.05 + sx * 0.03;
                    b.vy += (cy / nc - b.y) * 0.001 + (ay / nc) * 0.05 + sy * 0.03;
                }
                // speed limit
                const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                if (spd > 2.5) {
                    b.vx = (b.vx / spd) * 2.5;
                    b.vy = (b.vy / spd) * 2.5;
                }
                b.x = (b.x + b.vx + W) % W;
                b.y = (b.y + b.vy + H) % H;

                // draw as small V shape
                const angle = Math.atan2(b.vy, b.vx);
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(6, 0);
                ctx.lineTo(-4, 3);
                ctx.lineTo(-2, 0);
                ctx.lineTo(-4, -3);
                ctx.closePath();
                ctx.fillStyle = `rgba(214,196,188,0.75)`;
                ctx.fill();
                ctx.restore();
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <div className="flex flex-wrap gap-6 items-start">
            <canvas ref={canvasRef} className="rounded-lg border border-zinc-700" style={{ width: 300, height: 180 }} />
            <div className="space-y-2 max-w-xs self-center" style={{ fontSize: '12px' }}>
                <p className="text-zinc-400">Each bird follows three rules:</p>
                <div className="space-y-1.5">
                    {[
                        ['Cohesion', 'steer toward the average position of neighbours within radius 50'],
                        ['Alignment', 'steer toward the average velocity of neighbours'],
                        ['Separation', 'steer away from any neighbour closer than 18 px'],
                    ].map(([rule, desc]) => (
                        <div key={rule} className="flex gap-2">
                            <span className="text-amber-400 shrink-0 font-mono" style={{ fontSize: '11px' }}>
                                {rule}
                            </span>
                            <span className="text-zinc-500">{desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArtCanteraLearnPage() {
    return (
        <div style={{ background: '#0f0e0c', minHeight: '100vh', color: '#e4e0dc' }}>
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <div className="relative border-b border-zinc-800/60 px-5 pt-14 pb-16" style={NOISE_BG}>
                <div className="max-w-3xl mx-auto">
                    <TransitionLink href="/art-cantera" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors mb-8 font-mono" style={{ fontSize: '12px' }}>
                        ← art-cantera
                    </TransitionLink>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {['Generative Art', 'Canvas 2D', 'Voxels', 'Ray Marching'].map((t) => (
                            <Tag key={t}>{t}</Tag>
                        ))}
                    </div>
                    <h1 className="font-black tracking-tight text-zinc-100 mb-4" style={{ fontSize: '36px' }}>
                        Cantera — Deep Dive
                    </h1>
                    <p className="text-zinc-400 leading-relaxed max-w-xl" style={{ fontSize: '15px' }}>
                        A step-by-step breakdown of all nine techniques behind this generative voxel city — from the Art Blocks hash contract through noise stacking, erosion, voxelisation, oblique
                        projection, and the ray-marching renderer that lights the scene.
                    </p>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-5 pb-32">
                {/* ── Step 1: PRNG ─────────────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={1} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Hash-Seeded PRNG
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        Every decision in the artwork — colour palette, terrain shape, building placement, camera angle, light direction — is derived from a single 64-character hex string: the token
                        hash embedded in <Pill>tokenData.hash</Pill>. Cantera uses the <strong className="text-zinc-300">Art Blocks PRNG contract</strong>: the hash is split in half, each half seeds
                        an independent <strong className="text-zinc-300">sfc32</strong> generator, and calls alternate between them. A mandatory 1,000,000-iteration warm-up burns off any correlation
                        between the seed bytes and the output stream.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['prngA', 'prngB', 'useA', 'random_dec']}>{`// Cantera's Art Blocks Random class (module 824)
class Random {
    prngA: () => number;
    prngB: () => number;
    useA = false;

    constructor() {
        const sfc32 = (hex: string) => {
            let a = parseInt(hex.slice(0, 8), 16);
            let b = parseInt(hex.slice(8, 16), 16);
            let c = parseInt(hex.slice(16, 24), 16);
            let d = parseInt(hex.slice(24, 32), 16);
            return () => {
                // sfc32: Small Fast Counting — passes BigCrush
                let t = (a + b | 0) + d | 0;
                d = d + 1 | 0;
                a = b ^ (b >>> 9);
                b = (c + (c << 3)) | 0;
                c = (c << 21) | (c >>> 11);
                c = (c + t) | 0;
                return (t >>> 0) / 4294967296;
            };
        };
        // hash = "0x" + 64 hex chars → split into two 32-char halves
        this.prngA = sfc32(tokenData.hash.substring(2, 34));
        this.prngB = sfc32(tokenData.hash.substring(34, 66));
        // 1 000 000 warm-up iterations — intentional Art Blocks contract
        for (let i = 0; i < 1_000_000; i += 2) { this.prngA(); this.prngB(); }
    }

    random_dec() {
        this.useA = !this.useA;
        return this.useA ? this.prngA() : this.prngB();
    }
}`}</CodeBlock>
                    <div className="mt-5">
                        <PRNGDemo />
                    </div>
                    <div className="mt-4">
                        <Callout variant="info">
                            The 1M warm-up is load-bearing — it is why the page takes 2–4 seconds before any pixels appear. It is not a bug: the Art Blocks contract requires it to guarantee that
                            outputs are statistically independent of the seed bits. Every token that has ever existed runs the same burn-in.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 2: World Parameters ─────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={2} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Deterministic World Parameters
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        The very first calls to <Pill>R.random_dec()</Pill> lock in every high-level trait before any geometry is built. All downstream systems read these globals — nothing is
                        re-randomised mid-render. This is the standard generative-art pattern: decide everything upfront so the piece is fully reproducible from the hash alone.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['TERCHANGE', 'FLATTEN', 'MILL', 'CAMTYPE', 'TERCLR', 'CUTCLR', 'LV']}>{`// All world parameters derived sequentially from R
const TERCHANGE = R.random_dec() < 0.6;  // terrain shifts across the map?
const FLATTEN   = R.random_dec() < 0.4;  // large flat areas?
const STRIPES   = Math.round(R.random_dec()); // façade stripe axis
const MILL      = R.random_dec() > 0.36; // buildings present? (64% yes)

// 6 palettes — one pair of (terrain, cut) colours
const palettes = [
    ['graphite',      [45, 48, 53],   [214, 196, 188]],
    ['crimson',       [75, 43, 43],   [255, 204, 185]],
    ['goldblack',     [65, 62, 54],   [226, 193, 142]],
    ['blackAndWhite', [48, 48, 48],   [230, 230, 230]],
    ['darkgreen',     [48, 60, 58],   [203, 197, 196]],
    ['sepia',         [64, 57, 47],   [255, 229, 192]],
];
const palIdx = Math.floor(0.99 * 6 * R.random_dec());
const TERCLR = palettes[palIdx][1]; // dark — solid voxel faces
const CUTCLR = palettes[palIdx][2]; // light — window-cut faces

// Camera mode: 0 = dimetric (yaw −45°), 1 = top-down (yaw 0°)
const CAMTYPE = Math.max(0, Math.floor(1.4 * R.random_dec()));

// Light vector — sun direction derived from two random angles
const c = /* skewed distribution */;
const LV = RotateXZ(0, 1, 0, 0.29, c * Math.PI);

// Surface detail toggles
const GRID   = R.random_dec() > 0.35;  // draw grid lines on façades?
const SMGRID = R.random_dec() > 0.35;  // finer inner grid?`}</CodeBlock>
                    <div className="mt-4">
                        <Callout variant="tip">
                            Re-roll the hash in the demo above and watch every parameter flip simultaneously. Each output is seeded by the same hash — there is no independent randomness anywhere in
                            the piece after this point.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 3: Simplex Noise ─────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={3} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Simplex Noise
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        {'Cantera uses '}
                        <strong className="text-zinc-300">OpenSimplex noise</strong>
                        {' (the '}
                        <Pill>simplex-noise</Pill>
                        {" npm package's "}
                        <Pill>makeNoise3D</Pill>
                        {'). The noise instance is seeded from '}
                        <Pill>R</Pill>
                        {', making it part of the deterministic chain. The same function is reused at three very different frequency scales throughout the codebase.'}
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['makeNoise3D', 'SetSimplex', 'noise', 'scale']}>{`// Module 413 — seeded simplex noise
import { makeNoise3D } from 'simplex-noise';

// The noise instance is seeded from R, linking it to the hash
const noiseFn = makeNoise3D(Math.round(10_000 * R.random_dec()));
SetSimplex(noiseFn); // stored in the shared 555 module

// All callers go through a thin wrapper that quantises inputs
// to 3 decimal places — preventing floating-point drift
function noise(x, y, z, scale) {
    return noiseFn(
        Math.round(1000 * scale * x) / 1000,
        Math.round(1000 * scale * y) / 1000,
        Math.round(1000 * scale * z) / 1000,
    );
}

// Three usage sites in cantera:
noise(x, y, z, 0.004);  // macro terrain shape (low-freq mountains)
noise(x, y, z, 0.012);  // medium terrain detail
noise(x, y, z, 0.025);  // surface texture (windows, stone pattern)`}</CodeBlock>
                    <div className="mt-5">
                        <NoiseDemo />
                    </div>
                    <div className="mt-4">
                        <Callout variant="tip">
                            The three canvases above use the same seed — only the frequency (scale) differs. Notice how the low-frequency version gives smooth continent-scale shapes while the
                            high-frequency one produces fine stone-like texture. Cantera layers all three to build the final surface appearance.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 4: Heightmap ─────────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={4} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Terrain: NoiseGrowth + Layer Stacking
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        The terrain height is not a single noise sample — it is built by calling <Pill>NoiseGrowth</Pill> seven times in sequence. Each call randomly rotates, scales, and offsets the
                        noise before adding it to the heightmap. The result is an irregular, non-repeating landscape that looks geologically plausible rather than mathematically smooth. Cantera also
                        builds <em>two</em> separate heightmaps (<Pill>t0</Pill> and <Pill>t1</Pill>) and blends between them across the map when <Pill>TERCHANGE</Pill> is true.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['NoiseGrowth', 'Grow', 'RandomTransformation', 'Normalize', 'Resize']}>{`// Mountain class — builds the 2D heightmap
class Mountain {
    t0: HeightMap;  // terrain type A
    t1: HeightMap;  // terrain type B (active when TERCHANGE = true)

    constructor(scaleX, offsetX, scaleY, offsetY) {
        const seed = R.random_dec();
        this.t0 = new HeightMap(100, 100, seed);
        this.t0.Grow(scaleX, offsetX, scaleY, offsetY, /* invert=false */);

        this.t1 = new HeightMap(100, 100, seed); // same seed!
        this.t1.Grow(scaleX, offsetX, scaleY, offsetY, /* invert=true */);
    }
}

// Grow() calls NoiseGrowth 7× with randomised parameters, then erodes:
Grow(params) {
    NoiseGrowth(scale=12*(0.15+0.65*rnd), offset=100*rnd, freq=0.025, ...); // base
    NoiseGrowth(scale=12*(0.45+0.65*rnd), offset=100*rnd, freq=0.025, ...); // mid
    NoiseGrowth(scale=8, offset=100*rnd, freq=0.006, ...);                   // broad
    Erode(15_000 drops); Resize(T, T);                                        // first erosion pass
    NoiseGrowth(scale=24, freq=0.004, ...);   // fine ridges
    NoiseGrowth(scale=16, freq=0.012, ...);   // medium detail
    NoiseGrowth(scale=8,  freq=0.022, ...);   // fine detail
    Erode(70_000 drops); Normalize(); Resize(2*T, 2*T);
    Erode(100_000 drops);             // final refinement
}

// RandomTransformation picks a random rotation angle and x/y scale
// so each noise layer is oriented differently — no visible repetition
RandomTransformation() {
    return [
        Math.round(1000 * rnd * Math.PI) / 1000,  // angle
        Math.round(1000 * (1 + rnd)) / 1000,       // x stretch
        Math.round(1000 * (1 + rnd)) / 1000,       // y stretch
    ];
}`}</CodeBlock>
                </FadeIn>

                {/* ── Step 5: Erosion ───────────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={5} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Hydraulic Erosion
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        After each noise layer is added, simulated raindrops are released onto the heightmap. Each drop follows the steepest downhill gradient, picking up sediment from steep slopes
                        and depositing it on flat areas. Over 70,000–100,000 drops the map transforms from smooth noise into a realistic landscape with carved gullies, alluvial fans, and rounded
                        peaks. This is the same technique used in real-time game terrain tools like World Machine.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['Erode', 'sediment', 'gradient', 'deposit', 'erode']}>{`// Hydraulic erosion — raindrop particle simulation
Erode(numDrops, inertia, maxLength, depositRate, erodeRate) {
    for (let d = 0; d < numDrops; d++) {
        let [px, py] = randomPosition();
        let [dx, dy] = [0, 0];        // current flow direction
        let water = 1, sediment = 0;

        for (let step = 0; step < maxLength; step++) {
            const [gx, gy, height] = gradient(px, py); // bilinear sample

            // Inertia: blend old direction with gradient direction
            dx = dx * inertia - gx * (1 - inertia);
            dy = dy * inertia - gy * (1 - inertia);
            normalise(dx, dy);
            px += dx; py += dy;

            const dHeight = newHeight - height;
            // Carrying capacity: more on steep slopes, less on flat
            const capacity = Math.max(-dHeight * speed * water * 4, 0.001);

            if (sediment > capacity || dHeight > 0) {
                // Over capacity or going uphill — deposit sediment
                const deposit = (sediment - capacity) * depositRate;
                sediment -= deposit;
                heightmap[px][py] += deposit;
            } else {
                // Under capacity — erode terrain, pick up material
                const erodeAmt = (capacity - sediment) * erodeRate;
                heightmap[px][py] -= erodeAmt;
                sediment += erodeAmt;
            }

            water *= (1 - evaporationRate);
        }
    }
}`}</CodeBlock>
                    <div className="mt-5">
                        <HeightmapDemo />
                    </div>
                    <div className="mt-4">
                        <Callout variant="info">
                            Cantera runs erosion <em>three</em> times interleaved with the noise layers — 15k, 70k, and 100k drops respectively. The first pass carves macro gullies before the fine
                            noise layers are added so the detail doesn&apos;t get washed out. The final 100k pass on the upsampled (2× resolution) map creates the crisp cliff edges visible in the
                            rendered output.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 6: Voxelisation ──────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={6} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Voxel Grid & Block Resolution
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        The continuous heightmap is discretised into a <strong className="text-zinc-300">3D grid of axis-aligned blocks</strong>. The world is <Pill>T=392</Pill> units wide with block
                        size <Pill>S=8</Pill>, giving a <strong className="text-zinc-300">49×49×11</strong> grid (49 blocks in X/Y, 11 layers in Z including 1 below ground). Each <Pill>BBlock</Pill>{' '}
                        is then <em>resolved</em> — sampled on an 8×8 sub-grid to determine whether the heightmap surface passes through it.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['BBlock', 'Resolve', 'isEmpty', 'isThin', 'isFlat', 'isTip', 'hasTerrain', 'roof']}>{`// World dimensions — constants in the global scope
const T = 392;  // world width/height in units
const S = 8;    // block size
const U = 80;   // max height above ground
const Z = S;    // depth below ground

// 3D array of BBlocks: [T/S][T/S][(U+Z)/S] = 49 × 49 × 11
const BLOCKS = Array.from({ length: T/S }, (_, bx) =>
    Array.from({ length: T/S }, (_, by) =>
        Array.from({ length: (U+Z)/S }, (_, bz) =>
            new BBlock(bx*S, by*S, bz*S - Z, S)
        )
    )
);

// BBlock.Resolve() — classify this block against the heightmap
Resolve() {
    let fillRatio = 0, minOverlap = S, maxOverlap = -1;

    // sample the heightmap on a 0.35-unit grid within the block
    for (let dx = 0; dx < S; dx += 0.35)
    for (let dy = 0; dy < S; dy += 0.35) {
        const worldH = landscape.Evaluate(x0+dx, y0+dy) * U;
        const overlap = worldH - z0;         // how far surface is above z0
        minOverlap = Math.min(minOverlap, overlap);
        maxOverlap = Math.max(maxOverlap, overlap);
        if (worldH > z0) { fillRatio++; this.isEmpty = false; }
    }

    // shape flags — used by the renderer to pick face brightness
    this.isThin = minOverlap < 0.5*S || fillRatio < 0.5;  // thin slice of terrain
    this.isFlat = maxOverlap < S;                          // surface near the top
    this.isTip  = maxOverlap < 0.25*S || fillRatio < 0.3; // just the very tip
}

// After all blocks are resolved, topology flags are propagated:
// contX / contY / contZ — block is continuous with its neighbour
// winX / winY — exposed face on X or Y side (potential window)
// roof — top face is exposed (where people are placed)`}</CodeBlock>
                    <div className="mt-4">
                        <Callout variant="warn">
                            <Pill>isTip</Pill> blocks that were previously empty stay empty even after <Pill>Resolve()</Pill> — this prevents spiky single-voxel protrusions on terrain peaks that would
                            look wrong at the block scale. The <Pill>if (wasEmpty && !isTip) isEmpty = true</Pill> guard is the key line.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 7: Buildings ─────────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={7} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Building Generation — Box Growing
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        Buildings are not placed procedurally on top of the terrain — they <em>replace</em> terrain blocks. <Pill>GrowBoxes</Pill> first locates the flattest patch of ground (by
                        scanning noise values and finding the minimum-variance region), then fills it with axis-aligned rectangular boxes. Each box (<Pill>BBox</Pill>) stores a start point, end point,
                        and direction vector pointing along its long axis. After creation, each box is randomly altered (shifted, stretched, randomly cloned with an offset) to break grid regularity.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['GrowBoxes', 'BBox', 'Alter', 'RandomCopy', 'ClearBoxes']}>{`// GrowBoxes — step 1: find the flattest terrain patch
let bestX = 0, bestY = 0, minVariance = 9999;
for (let x = -T/2; x < T/2; x += 16)
for (let y = -T/2; y < T/2; y += 16) {
    // sample noise at 9 points around (x, y) — low total = flat area
    const roughness = sum of |noise(x+dx, y+dy, U/2, 0.012)| over 9 offsets;
    if (roughness < minVariance) { minVariance = roughness; bestX = x; bestY = y; }
}

// step 2: fill the flat patch with axis-aligned BBox segments
for (let bx = 0; bx < T; bx += boxW)
for (let by = 0; by < T; by += boxH)
for (let bz = -Z; bz < U; bz += boxD) {
    if (noise(bx, by, bz, 0.012) > 0.6) continue; // skip high-noise voxels
    if (rnd() < 0.72) boxes.push(new BBox(bx, by, bz, dir=[1,0,0]));
    if (rnd() < 0.72) boxes.push(new BBox(bx, by, bz, dir=[0,1,0]));
    if (rnd() < 0.82) boxes.push(new BBox(bx, by, bz, dir=[0,0,1]));
}

// step 3: randomly perturb each box
for (const box of boxes) {
    // shift start and end independently along random axes
    box.Alter(randInt(-1,1), randInt(-1,1), randInt(-1,1), randInt(-1,1), randInt(-1,1));
    // 67% chance: clone the box offset perpendicular to its long axis
    if (Math.abs(randInt(-1,1)) > 0.2 && rnd() < 0.67)
        boxes.push(box.RandomCopy(rnd(), offset));
}

// step 4: ClearBoxes marks all voxels within each BBox as empty
// — carving rooms, courtyards, and window openings into the solid terrain`}</CodeBlock>
                    <div className="mt-4">
                        <Callout variant="tip">
                            The perturbed boxes do not generate geometry — they <em>remove</em> it. <Pill>ClearBoxes</Pill> sets <Pill>isEmpty=true</Pill> on every terrain block the box overlaps,
                            carving out voids that become the hollow interiors visible through windows. The façades and rooftops are whatever solid blocks remain at the boundary.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 8: Camera ────────────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={8} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Oblique Camera Projection
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        Cantera uses <strong className="text-zinc-300">orthographic oblique projection</strong> — a camera defined entirely by three pre-rotated basis vectors. There is no perspective
                        divide; objects do not shrink with distance. The camera has two modes: <strong className="text-zinc-300">dimetric</strong> (pitch 45°, yaw −45°, the classic isometric-like city
                        view) and <strong className="text-zinc-300">top-down</strong> (pitch 45°, yaw 0°, looking along the Y axis). Rays are shot as parallel beams from the screen plane into the
                        scene.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['planeX', 'planeY', 'planeZ', 'ScreenP', 'GetVector', 'MoveBack', 'SQUEEZE']}>{`// Camera class — stores three orthogonal basis vectors
class Camera {
    planeO: Vec3;  // origin (eye position)
    planeX: Vec3;  // screen right  = RotateXZ([1,0,0], pitch, yaw)
    planeY: Vec3;  // screen up     = RotateXZ([0,1,0], pitch, yaw)
    planeZ: Vec3;  // view forward  = RotateXZ([0,0,1], pitch, yaw)

    constructor(cx, cy, cz, pitch, yaw) {
        this.planeO = [cx, cy, cz];
        this.planeX = RotateXZ([1,0,0], pitch, yaw);
        this.planeY = RotateXZ([0,1,0], pitch, yaw);
        this.planeZ = RotateXZ([0,0,1], pitch, yaw);
    }

    MoveBack(dist: number) {
        // Push the eye 500 units along the view axis — sets depth range
        this.planeO = add(this.planeO, this.planeZ, dist);
    }

    GetVector() {
        return neg(this.planeZ);  // ray direction = -Z
    }

    ScreenP(worldPt, scale, W, H): [sx, sy, depth] {
        const d = worldPt - this.planeO;
        return [
            W/2 + dot(d, planeX) / scale,          // screen X
            H/2 - dot(d, planeY) / (scale*SQUEEZE), // screen Y (inverted + squeezed)
            -dot(d, planeZ),                         // depth for sorting
        ];
    }
}

// Mode 0 — dimetric: classic diagonal city view
CAM = new Camera(centerX, centerY, 0, Math.PI/4, -Math.PI/4);
// Mode 1 — top-down: looking along Y axis
CAM = new Camera(centerX, centerY, 0, Math.PI/4, 0);

CAM.MoveBack(500); // position camera far enough to see the whole world`}</CodeBlock>
                    <div className="mt-5">
                        <ProjectionDemo />
                    </div>
                    <div className="mt-4">
                        <Callout variant="info">
                            <Pill>SQUEEZE</Pill> is a subtle correction factor computed from <Pill>FRAME</Pill> (border width) and <Pill>IMG</Pill> (virtual image scale) to compensate for the aspect
                            ratio introduced by the oblique angle. Without it, circles in the world would appear as ellipses on screen.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 9: Ray Marching ──────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={9} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Voxel Ray Marching + Monte Carlo Accumulation
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        The final image is built by <Pill>renderLight</Pill>, which fires rays from the camera into the voxel grid. For each screen pixel it calls <Pill>Trace</Pill> — a slab-based DDA
                        traversal that steps through grid planes in X, Y, and Z to find the first non-empty block. At the intersection it determines{' '}
                        <strong className="text-zinc-300">face type</strong> (roof / X-wall / Y-wall / corner), casts a <strong className="text-zinc-300">shadow ray</strong> toward <Pill>LV</Pill>{' '}
                        (the sun), and computes brightness from shadow distance, surface texture, window pattern, and grid lines. The function runs multiple times (<Pill>m</Pill> passes), and each
                        pass&apos;s result is blended into a <strong className="text-zinc-300">running average</strong> (Monte Carlo accumulation) using stochastic ray jitter — giving soft shadows.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock
                        lang="typescript"
                        highlight={['Trace', 'renderLight', 'shadowRay', 'faceType', 'TERCLR', 'CUTCLR', 'accumulate']}
                    >{`// renderLight — called m times with pass index g (0…m-1)
function renderLight(pass, raysPerPass, scale, W, H) {
    const rayDir = CAM.GetVector(); // all rays are parallel (orthographic)

    for each pixel (px, py) {
        // ray origin = camera plane displaced by pixel offset
        const origin = planeO + px*planeX + py*planeY;

        // ── Trace — DDA through the voxel grid ──────────────────────
        // Cantera finds all grid-plane crossings (slab intersections)
        // in X, Y, Z, sorts them, then steps through adjacent blocks
        const hit = Trace(origin, rayDir, maxDist, /*fast=*/false);
        if (!hit) { pixel = skyColor; continue; }

        // hit = [faceType, x, y, z, depth, lightBrightness]
        // faceType: 0=roof, 1=X-wall, 2=Y-wall, 3=corner

        // ── Shadow ray ──────────────────────────────────────────────
        // Jitter the sun direction slightly per sample → soft shadows
        const jitteredSun = RotateXZ(LV, rand*0.2, rand*0.15);
        const shadowHit = Trace(hitPt, jitteredSun, 0.2*T, /*fast=*/true);
        const shadow = shadowHit ? shadowHit[0] / (0.2*T) : 1.0;
        let brightness = shadow * (1.2 + 0.6*rand);

        // ── Surface detail ───────────────────────────────────────────
        brightness += windowPattern(hit, rand);  // simulated windows
        brightness -= gridLines(hit, S, 0.125);  // grid seams
        brightness -= frameEdge(px, py, W, H);   // dark border vignette

        // ── Colour ───────────────────────────────────────────────────
        const baseColor = faceType===0 ? TERCLR : CUTCLR;
        const finalColor = baseColor * brightness;

        // ── Monte Carlo accumulation — running average ────────────────
        // pass 0 → just write; pass g → blend old + new
        pixel[r] = (pass * oldPixel[r] + finalColor[r]) / (pass + 1);
        pixel[g] = (pass * oldPixel[g] + finalColor[g]) / (pass + 1);
        pixel[b] = (pass * oldPixel[b] + finalColor[b]) / (pass + 1);
    }
}`}</CodeBlock>
                    <div className="mt-5">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-800">
                                <span className="font-mono text-zinc-500" style={{ fontSize: '11px' }}>
                                    HOW MANY PASSES DOES MY SCREEN NEED?
                                </span>
                            </div>
                            <div className="p-4 space-y-3" style={{ fontSize: '13px' }}>
                                <p className="text-zinc-400">
                                    Pass count <Pill>m</Pill> is computed from your canvas height so the total render time is roughly constant across devices:
                                </p>
                                <CodeBlock lang="typescript">{`// Canvas height is derived from your window dimensions
// (900 px max, ~900×1600 on a 1920×1080 screen)
m = 4 * Math.min(20, Math.round(Math.max(1, 3200 / canvasHeight)));

// Examples:
// height=1600 → m = 4 * round(2)  = 8  passes (fastest)
// height= 900 → m = 4 * round(4)  = 16 passes
// height= 400 → m = 4 * round(8)  = 32 passes (most detail)`}</CodeBlock>
                                <p className="text-zinc-500">
                                    Each pass fires 5,000 rays then calls <Pill>birdCtx.drawImage(mainCanvas, 0, 0)</Pill> to show the current accumulation, so you see it progressively sharpen every
                                    80 ms.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Callout variant="tip">
                            The running average formula <Pill>(g * old + new) / (g + 1)</Pill> gives every pass equal weight rather than exponentially decaying the history. After 8 passes each pixel
                            is the average of 8 independent shadow-ray samples with different jitter — enough to produce visually smooth soft shadows without explicit area-light integration.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 10: Inhabitants ──────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-center gap-3 mb-6">
                        <StepBadge n={10} />
                        <h2 className="font-bold text-zinc-100 tracking-tight" style={{ fontSize: '20px' }}>
                            Animated Inhabitants — Boids + Silhouettes
                        </h2>
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-5" style={{ fontSize: '14px' }}>
                        Once the main render reaches pass 3, two classes of inhabitants are added on a separate <Pill>birdCtx</Pill> overlay canvas drawn <em>on top of</em> the static scene each tick.{' '}
                        <strong className="text-zinc-300">Birds</strong> use a classic three-rule flocking model (cohesion, alignment, separation) extended with obstacle avoidance against the voxel
                        grid. <strong className="text-zinc-300">People</strong> are static silhouettes (7 polygon outlines) placed on rooftop blocks, each verified visible via a shadow ray before
                        spawning.
                    </p>
                </FadeIn>
                <FadeIn delay={0.05}>
                    <CodeBlock
                        lang="typescript"
                        highlight={['SetUpEffects', 'RenderBirds', 'cohesion', 'alignment', 'separation', 'SetUpPeople']}
                    >{`// 45 flocks — each a group of 1–14 birds sharing a position
function SetUpEffects() {
    for (let i = 0; i < 45; i++) {
        const size = rnd() < 0.08 ? 8 + rand(14) : 1 + rand(4); // rare large flocks
        // find a valid spawn point in empty airspace
        for (let attempt = 0; attempt < 150; attempt++) {
            const pos = randomAirPosition();
            if (GetBlock(pos) === null) { // no voxel here → valid
                for (let b = 0; b < size; b++) flock.push(new Bird(pos));
                break;
            }
        }
    }
}

// Per-frame flocking update for each bird
RenderBirds() {
    for (const bird of allBirds) {
        let cohesion=[0,0,0], alignment=[0,0,0], separation=[0,0,0], n=0;

        for (const other of bird.flock) {
            const dist = distance(bird, other);
            if (dist < 4) {
                cohesion  += other.pos * 0.33;   // steer toward centre
                alignment += other.vel * 0.08;   // match velocity
                if (dist < 3.5) separation -= normalize(diff) * (3.5 - dist); // push apart
                n++;
            }
        }
        // Obstacle avoidance: if moving toward a voxel, pick a random new direction
        if (GetBlock(nextPos) !== null) bird.forward = randomDirection();

        bird.vel = clamp(bird.vel + cohesion + alignment + separation, 3.3);
        bird.rPos = lerp(bird.rPos, bird.pos, 0.08); // smooth render position

        // Draw as a V-shape using ScreenP to project to 2D
        drawWingShape(bird.rPos, bird.forward, birdCtx);
    }
}

// People — polygon silhouettes placed on rooftop blocks
function SetUpPeople() {
    for (const block of allBlocks.filter(b => b.isEmpty && b.roof)) {
        // cast a shadow ray to the sun — only visible rooftops get a person
        const lit = Trace(block.center, LV, ...);
        if (lit) placePerson(block, /* one of 7 polygon outlines */);
    }
    // sort by depth so closer people draw on top
    people.sort((a, b) => a.z - b.z);
}`}</CodeBlock>
                    <div className="mt-5">
                        <BoidsDemo />
                    </div>
                    <div className="mt-4">
                        <Callout variant="info">
                            The people silhouettes use the same <Pill>BrighAndOp</Pill> method as birds — each frame they cast their own shadow ray to the sun and update brightness and opacity. If a
                            person becomes occluded by a newly-rendered building, their opacity fades to zero over several frames rather than popping out instantly.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Footer ─────────────────────────────────────────────────── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex flex-wrap gap-3">
                        <TransitionLink
                            href="/art-cantera"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 transition-colors font-mono"
                            style={{ fontSize: '13px' }}
                        >
                            ← View the artwork
                        </TransitionLink>
                        <TransitionLink
                            href="/art-sagebrush/learn"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 transition-colors font-mono"
                            style={{ fontSize: '13px' }}
                        >
                            Sagebrush guide →
                        </TransitionLink>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
