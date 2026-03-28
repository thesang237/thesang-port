'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { CodeBlock } from '@/components/code-block';
import { FadeIn, NOISE_BG } from '@/components/fade-in';

// ─── Shared math (mirrors ArtSolacePage.tsx) ─────────────────────────────────

const TWO_PI = Math.PI * 2;

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

function makeSfc32(a0: number, b0: number, c0: number, d0: number): () => number {
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

function makeGaussian(rng: () => number): () => number {
    let spare: number | null = null;
    return (): number => {
        if (spare !== null) {
            const s = spare;
            spare = null;
            return s;
        }
        let u: number, v: number, s: number;
        do {
            u = rng() * 2 - 1;
            v = rng() * 2 - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);
        const m = Math.sqrt((-2 * Math.log(s)) / s);
        spare = v * m;
        return u * m;
    };
}

const G3 = [
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
] as const;

function makeNoise(seedN: number): (px: number, py?: number) => number {
    const rng = makeSfc32(...cyrb128(String(seedN)));
    const p = Array.from({ length: 256 }, (_: unknown, i: number) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lp = (a: number, b: number, t: number) => a + (b - a) * t;
    return (px: number, py = 0) => {
        const pz = 0;
        const X = Math.floor(px) & 255,
            Y = Math.floor(py) & 255,
            Z = 0;
        const x = px - Math.floor(px),
            y = py - Math.floor(py),
            z = pz - Math.floor(pz);
        const u = fade(x),
            v = fade(y),
            w = fade(z);
        const A = perm[X] + Y,
            AA = perm[A] + Z,
            AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y,
            BA = perm[B] + Z,
            BB = perm[B + 1] + Z;
        const g = (h: number, dx: number, dy: number, dz: number) => {
            const gg = G3[h % 12];
            return gg[0] * dx + gg[1] * dy + gg[2] * dz;
        };
        const n = lp(
            lp(lp(g(perm[AA], x, y, z), g(perm[BA], x - 1, y, z), u), lp(g(perm[AB], x, y - 1, z), g(perm[BB], x - 1, y - 1, z), u), v),
            lp(lp(g(perm[AA + 1], x, y, z - 1), g(perm[BA + 1], x - 1, y, z - 1), u), lp(g(perm[AB + 1], x, y - 1, z - 1), g(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
            w,
        );
        return (n + 1) * 0.5;
    };
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function mapRange(v: number, s1: number, e1: number, s2: number, e2: number) {
    return s2 + ((v - s1) * (e2 - s2)) / (e1 - s1);
}

// ─── Mini render (Step 10 demo) ───────────────────────────────────────────────

const MINI_FRAMES = 30;
const MINI_DOTS = 800;

function runMiniRender(canvas: HTMLCanvasElement, rafRef: { current: number }, setFrame: (f: number) => void, seedStr: string) {
    cancelAnimationFrame(rafRef.current);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = canvas.width;
    const rng = makeSfc32(...cyrb128(seedStr));

    const peakX = 0.3 + rng() * 0.4;
    const peakY = 0.18 + rng() * 0.15;
    const slope = 0.5 + rng() * 0.5;
    const keyRes = 200;

    const w1Amp = (1.5e-4 + rng() * 1.5e-4) * (rng() < 0.5 ? 1 : -1);
    const w1Phase = rng() * TWO_PI;
    const w2Amp = (5e-4 + rng() * 4e-4) * (rng() < 0.5 ? 1 : -1);
    const w2Phase = rng() * TWO_PI;

    let wx = peakX,
        wy = peakY;
    const b1: Record<number, number> = {},
        b2: Record<number, number> = {};
    while (wy < 1.05) {
        wx -= 2e-4;
        wy += 0.001;
        const sc = mapRange(wy - peakY, 0, 1, 0.5, 2.5);
        wx += w1Amp * sc * Math.sin(w1Phase + 7 * Math.pow(wy, 0.5));
        wx += w2Amp * sc * Math.sin(w2Phase + 15 * Math.pow(wy, 0.5));
        const lk = Math.floor((wy - slope * wx) * keyRes);
        const rk = Math.floor((wy + slope * wx) * keyRes);
        if (!b1[lk]) b1[lk] = wy;
        if (!b2[rk]) b2[rk] = wy;
    }

    const shade = (x: number, y: number): 'dark' | 'light' | 'sky' => {
        const lk = Math.floor((y - slope * x) * keyRes);
        const rk = Math.floor((y + slope * x) * keyRes);
        let lb = b1[lk] ?? 0;
        if (y <= lb) lb = 0;
        let rb = b2[rk] ?? 0;
        if (y <= rb) rb = 0;
        if (rb > lb) return 'dark';
        if (lb > rb) return 'light';
        return 'sky';
    };

    ctx.fillStyle = '#F5EFED';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = 'rgba(11,35,50,0.22)';

    let f = 0;
    const tick = () => {
        for (let i = 0; i < MINI_DOTS; i++) {
            const progress = (MINI_DOTS * f + i) / (MINI_DOTS * MINI_FRAMES);
            const x = rng();
            const y = lerp(0, 1, progress);
            const s = shade(x, y);
            const prob = s === 'dark' ? 1 : s === 'light' ? 0.08 : 0.72;
            if (rng() <= prob) ctx.fillRect(x * SIZE, y * SIZE, 1.5, 1.5);
        }
        f++;
        setFrame(f);
        if (f < MINI_FRAMES) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Tag({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border bg-orange-500/10 text-orange-400 border-orange-500/20" style={{ fontSize: '10px' }}>
            {children}
        </span>
    );
}

function StepBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center size-7 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-black font-mono shrink-0"
            style={{ fontSize: '12px' }}
        >
            {n}
        </span>
    );
}

function Pill({ children }: { children: ReactNode }) {
    return (
        <code className="inline-block bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-mono rounded px-1.5 py-0.5" style={{ fontSize: '12px' }}>
            {children}
        </code>
    );
}

function SectionRule() {
    return <div className="my-20 h-px bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent" />;
}

function Callout({ children, variant = 'tip' }: { children: ReactNode; variant?: 'tip' | 'info' | 'warn' }) {
    const styles = {
        tip: 'bg-orange-500/5 border-orange-500/20 text-orange-200/90',
        info: 'bg-stone-500/10 border-stone-500/20 text-stone-200/90',
        warn: 'bg-yellow-500/5 border-yellow-500/20 text-yellow-200/90',
    };
    const icons = { tip: '💡', info: 'ℹ️', warn: '⚠️' };
    return (
        <div className={`border rounded-xl px-4 py-3 leading-relaxed flex gap-2.5 ${styles[variant]}`} style={{ fontSize: '13px' }}>
            <span className="shrink-0 mt-0.5">{icons[variant]}</span>
            <span>{children}</span>
        </div>
    );
}

function DemoShell({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center gap-2">
                <div className="flex gap-1.5">
                    {['bg-red-500/60', 'bg-yellow-500/60', 'bg-green-500/60'].map((c) => (
                        <div key={c} className={`size-2.5 rounded-full ${c}`} />
                    ))}
                </div>
                <span className="text-zinc-500 font-mono ml-1" style={{ fontSize: '11px' }}>
                    {title}
                </span>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Step 1 demo ──────────────────────────────────────────────────────────────

function RngDemo() {
    const [seed, setSeed] = useState('solace');

    const squares = (() => {
        const rng = makeSfc32(...cyrb128(seed || 'solace'));
        return Array.from({ length: 64 }, () => {
            const h = Math.floor(rng() * 360);
            const s = 30 + Math.floor(rng() * 50);
            const l = 25 + Math.floor(rng() * 45);
            return `hsl(${h},${s}%,${l}%)`;
        });
    })();

    return (
        <div className="space-y-4">
            <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono text-sm outline-none focus:border-orange-500/50"
                placeholder="type any seed…"
            />
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
                {squares.map((color, i) => (
                    <div key={i} className="rounded-sm aspect-square" style={{ backgroundColor: color }} />
                ))}
            </div>
            <p className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                {'same seed → same 64 colours, every reload'}
            </p>
        </div>
    );
}

// ─── Step 2 demo ──────────────────────────────────────────────────────────────

function drawGaussianHistogram(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
        H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, W, H);

    const rng = makeSfc32(...cyrb128(String(Date.now())));
    const gauss = makeGaussian(rng);
    const bins = new Array(40).fill(0);
    for (let i = 0; i < 2000; i++) {
        const v = gauss();
        const bin = Math.floor(((v + 4) / 8) * 40);
        if (bin >= 0 && bin < 40) bins[bin]++;
    }
    const maxVal = Math.max(...bins);
    bins.forEach((count, i) => {
        const bx = (i / 40) * W;
        const bw = W / 40 - 1;
        const bh = (count / maxVal) * (H - 16);
        ctx.fillStyle = 'rgba(251,146,60,0.65)';
        ctx.fillRect(bx, H - bh, bw, bh);
    });

    ctx.strokeStyle = 'rgba(251,146,60,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
}

function GaussianDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) drawGaussianHistogram(canvasRef.current);
    }, []);

    return (
        <div className="space-y-3">
            <canvas ref={canvasRef} width={400} height={140} className="w-full rounded-lg" />
            <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                    {'2000 samples — bell curve centred at 0'}
                </span>
                <button
                    onClick={() => canvasRef.current && drawGaussianHistogram(canvasRef.current)}
                    className="px-3 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono hover:bg-orange-500/30 transition-colors"
                    style={{ fontSize: '11px' }}
                >
                    {'resample'}
                </button>
            </div>
        </div>
    );
}

// ─── Step 3 demo ──────────────────────────────────────────────────────────────

function NoiseDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [noiseSeed, setNoiseSeed] = useState(42);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = 200,
            H = 200;
        const noise = makeNoise(noiseSeed);
        const img = ctx.createImageData(W, H);
        for (let py = 0; py < H; py++) {
            for (let px = 0; px < W; px++) {
                const val = noise(px * 0.06, py * 0.06);
                const c = Math.floor(val * 255);
                const idx = (py * W + px) * 4;
                img.data[idx] = c;
                img.data[idx + 1] = c;
                img.data[idx + 2] = c;
                img.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    }, [noiseSeed]);

    return (
        <div className="space-y-3">
            <canvas ref={canvasRef} width={200} height={200} className="w-full rounded-lg" style={{ imageRendering: 'pixelated' }} />
            <div className="flex items-center gap-3">
                <span className="text-zinc-400 font-mono" style={{ fontSize: '12px' }}>
                    {'seed'}
                </span>
                <input type="range" min={1} max={100} value={noiseSeed} onChange={(e) => setNoiseSeed(Number(e.target.value))} className="flex-1 accent-orange-500" />
                <span className="text-zinc-300 font-mono w-6 text-right" style={{ fontSize: '12px' }}>
                    {noiseSeed}
                </span>
            </div>
        </div>
    );
}

// ─── Step 4 demo ──────────────────────────────────────────────────────────────

function TraitRollDemo() {
    const [tick, setTick] = useState(0);

    const rng = makeSfc32(...cyrb128(`traits-${tick}`));
    const duneArr = [1, 3, 6, 12, 24, 48];
    const dunes = rng() < 0.02 ? 120 : duneArr[Math.floor(rng() * 6)];
    const skyRaw = rng();
    const sky = skyRaw < 0.03 ? 'Tabula' : skyRaw < 0.14 ? 'Starry' : skyRaw < 0.2 ? 'Wool' : skyRaw < 0.35 ? 'Beam' : skyRaw < 0.6 ? 'Timelapse' : skyRaw < 0.8 ? 'Whisper' : 'Null';
    const marginRaw = rng();
    const margin = marginRaw < 0.6 ? 'None' : marginRaw < 0.9 ? 'Narrow' : 'Wide';
    const brushRaw = rng();
    const brush = brushRaw < 0.03 ? 'Grainy' : brushRaw < 0.9 ? 'Sand' : 'Soft';

    const traits = [
        { label: 'Dunes', value: String(dunes) },
        { label: 'Sky', value: sky },
        { label: 'Margin', value: margin },
        { label: 'Brush', value: brush },
    ];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                {traits.map(({ label, value }) => (
                    <div key={label} className="bg-zinc-800/60 rounded-lg p-3">
                        <div className="text-zinc-500 font-mono mb-1" style={{ fontSize: '10px' }}>
                            {label}
                        </div>
                        <div className="text-orange-400 font-mono font-bold" style={{ fontSize: '13px' }}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={() => setTick((t) => t + 1)}
                className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono text-sm hover:bg-orange-500/30 transition-colors"
            >
                {'re-roll →'}
            </button>
        </div>
    );
}

// ─── Step 5 demo ──────────────────────────────────────────────────────────────

const UNIQUE_PALETTES = [
    { name: 'Shadow', bg: '#FFFFFF', fill: '#000000', rare: false },
    { name: 'Weather', bg: '#FEEFEC', fill: '#1E1C21', rare: false },
    { name: 'Warm', bg: '#FFD7C2', fill: '#191919', rare: false },
    { name: 'Lamp', bg: '#FBE8DA', fill: '#00100B', rare: false },
    { name: 'Sweet', bg: '#FFC09F', fill: '#040404', rare: false },
    { name: 'Daze', bg: '#F0DED1', fill: '#543B3B', rare: false },
    { name: 'Secret', bg: '#FDEDF0', fill: '#25040B', rare: false },
    { name: 'Coffee', bg: '#FFF1D6', fill: '#5B3F34', rare: false },
    { name: 'Smart', bg: '#F5EFED', fill: '#0B2332', rare: false },
    { name: 'Mars', bg: '#DE8471', fill: '#221A23', rare: false },
    { name: 'Earth', bg: '#FFF3E4', fill: '#483434', rare: false },
    { name: 'Blood', bg: '#E45D50', fill: '#000000', rare: false },
    { name: 'Polar', bg: '#5858C6', fill: '#09060F', rare: true },
    { name: 'Forest', bg: '#F3F6F6', fill: '#3D514D', rare: true },
    { name: 'Cold', bg: '#3255A4', fill: '#000000', rare: true },
    { name: 'Underworld', bg: '#27637C', fill: '#000000', rare: true },
    { name: 'Leaf', bg: '#FFFFFF', fill: '#407060', rare: true },
    { name: 'Lychee', bg: '#FFFFFF', fill: '#F15060', rare: true },
] as const;

function PaletteDemo() {
    return (
        <div className="grid grid-cols-3 gap-2">
            {UNIQUE_PALETTES.map(({ name, bg, fill, rare }, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/40">
                    <div className="w-7 h-7 rounded flex-shrink-0 border border-zinc-600/50" style={{ backgroundColor: bg }} />
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                    <span className={`font-mono truncate ${rare ? 'text-orange-400' : 'text-zinc-300'}`} style={{ fontSize: '10px' }}>
                        {name}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Step 6 demo ──────────────────────────────────────────────────────────────

function drawBoundaryDemo(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
        H = canvas.height;

    const rng = makeSfc32(...cyrb128('boundary-demo'));
    const peakX = 0.5,
        peakY = 0.22;
    const slope = 0.7,
        res = 200;
    const w1Amp = 2e-4,
        w1Phase = rng() * TWO_PI;
    const w2Amp = 8e-4,
        w2Phase = rng() * TWO_PI;

    let walkX = peakX,
        walkY = peakY;
    const b1: Record<number, number> = {},
        b2: Record<number, number> = {};
    while (walkY < 1.05) {
        walkX -= 2e-4;
        walkY += 0.001;
        const sc = mapRange(walkY - peakY, 0, 1, 0.5, 3);
        walkX += w1Amp * sc * Math.sin(w1Phase + 7 * Math.pow(walkY, 0.5));
        walkX += w2Amp * sc * Math.sin(w2Phase + 15 * Math.pow(walkY, 0.5));
        const lk = Math.floor((walkY - slope * walkX) * res);
        const rk = Math.floor((walkY + slope * walkX) * res);
        if (!b1[lk]) b1[lk] = walkY;
        if (!b2[rk]) b2[rk] = walkY;
    }

    const img = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
            const x = px / W,
                y = py / H;
            const lk = Math.floor((y - slope * x) * res);
            const rk = Math.floor((y + slope * x) * res);
            let lb = b1[lk] ?? 0;
            if (y <= lb) lb = 0;
            let rb = b2[rk] ?? 0;
            if (y <= rb) rb = 0;
            const idx = (py * W + px) * 4;
            if (rb > lb) {
                img.data[idx] = 28;
                img.data[idx + 1] = 18;
                img.data[idx + 2] = 12;
            } else if (lb > rb) {
                img.data[idx] = 185;
                img.data[idx + 1] = 155;
                img.data[idx + 2] = 125;
            } else {
                img.data[idx] = 238;
                img.data[idx + 1] = 228;
                img.data[idx + 2] = 210;
            }
            img.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('DARK', W * 0.42, H * 0.62);
    ctx.fillStyle = 'rgba(80,55,35,0.9)';
    ctx.fillText('LIGHT', W * 0.66, H * 0.72);
    ctx.fillStyle = 'rgba(130,110,90,0.9)';
    ctx.fillText('SKY', W * 0.05, H * 0.12);
    ctx.fillText('SKY', W * 0.78, H * 0.12);
}

function BoundaryDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) drawBoundaryDemo(canvasRef.current);
    }, []);

    return <canvas ref={canvasRef} width={300} height={300} className="w-full rounded-lg" style={{ imageRendering: 'crisp-edges' }} />;
}

// ─── Step 7 demo ──────────────────────────────────────────────────────────────

function drawRidgeWalk(canvas: HTMLCanvasElement, tick: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
        H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f0f10';
    ctx.fillRect(0, 0, W, H);

    const rng = makeSfc32(...cyrb128(`ridge-${tick}`));
    const w1Freq = 5 + rng() * 5;
    const w1Amp = (1.5e-4 + rng() * 1.5e-4) * (rng() < 0.5 ? 1 : -1);
    const w1Phase = rng() * TWO_PI;
    const w2Freq = 10 + rng() * 20;
    const w2Amp = (5e-4 + rng() * 5e-4) * (rng() < 0.5 ? 1 : -1);
    const w2Phase = rng() * TWO_PI;

    let walkX = 0.5,
        walkY = 0.1;
    ctx.beginPath();
    ctx.moveTo(walkX * W, walkY * H);
    ctx.strokeStyle = 'rgba(251,146,60,0.85)';
    ctx.lineWidth = 1.5;

    while (walkY < 1.0) {
        walkX -= 2e-4;
        walkY += 0.001;
        const sc = mapRange(walkY - 0.1, 0, 0.9, 0.5, 3);
        walkX += w1Amp * sc * Math.sin(w1Phase + w1Freq * Math.pow(walkY, 0.5));
        walkX += w2Amp * sc * Math.sin(w2Phase + w2Freq * Math.pow(walkY, 0.5));
        ctx.lineTo(Math.max(0, Math.min(W, walkX * W)), walkY * H);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(251,146,60,0.9)';
    ctx.beginPath();
    ctx.arc(0.5 * W, 0.1 * H, 4, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(251,146,60,0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('apex', 0.5 * W + 7, 0.1 * H + 4);
    ctx.fillText('ridge path', 8, H - 8);
}

function RidgeWalkDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (canvasRef.current) drawRidgeWalk(canvasRef.current, tick);
    }, [tick]);

    return (
        <div className="space-y-3">
            <canvas ref={canvasRef} width={300} height={280} className="w-full rounded-lg" />
            <button
                onClick={() => setTick((t) => t + 1)}
                className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono text-sm hover:bg-orange-500/30 transition-colors"
            >
                {'new seed →'}
            </button>
        </div>
    );
}

// ─── Step 8 demo ──────────────────────────────────────────────────────────────

function drawWarpGrid(canvas: HTMLCanvasElement, vc: number, amp: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width,
        H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f0f10';
    ctx.fillRect(0, 0, W, H);

    const freq = 6,
        phase = Math.PI * 0.4;

    ctx.strokeStyle = 'rgba(113,113,122,0.2)';
    ctx.lineWidth = 1;
    for (let xi = 0; xi <= 10; xi++) {
        ctx.beginPath();
        ctx.moveTo((xi / 10) * W, 0);
        ctx.lineTo((xi / 10) * W, H);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(251,146,60,0.5)';
    ctx.lineWidth = 1.5;
    const HLINES = 18;
    for (let li = 0; li <= HLINES; li++) {
        const yn = li / HLINES;
        ctx.beginPath();
        for (let xi = 0; xi <= 60; xi++) {
            const xn = xi / 60;
            const sinOffset = amp * Math.sin(phase + freq * xn);
            const rawY = yn + sinOffset;
            const clamped = Math.max(0, rawY + 0.05);
            const powY = Math.pow(clamped, vc);
            const wy = mapRange(powY, Math.pow(0.05, vc), Math.pow(1.05, vc), 0, 1);
            const px = xn * W;
            const py = Math.max(0, Math.min(H, wy * H));
            if (xi === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
}

function WarpDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [compression, setCompression] = useState(5);
    const [amplitude, setAmplitude] = useState(3);

    const vc = mapRange(compression, 0, 10, 0.2, 1.5);
    const amp = mapRange(amplitude, 0, 10, 0, 0.25);

    useEffect(() => {
        if (canvasRef.current) drawWarpGrid(canvasRef.current, vc, amp);
    }, [vc, amp]);

    return (
        <div className="space-y-4">
            <canvas ref={canvasRef} width={400} height={200} className="w-full rounded-lg" />
            <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono w-28 flex-shrink-0" style={{ fontSize: '11px' }}>
                        {'verticalComp'}
                    </span>
                    <input type="range" min={0} max={10} value={compression} onChange={(e) => setCompression(Number(e.target.value))} className="flex-1 accent-orange-500" />
                    <span className="text-orange-400 font-mono w-8 text-right" style={{ fontSize: '11px' }}>
                        {vc.toFixed(1)}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-zinc-400 font-mono w-28 flex-shrink-0" style={{ fontSize: '11px' }}>
                        {'warpAmplY'}
                    </span>
                    <input type="range" min={0} max={10} value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} className="flex-1 accent-orange-500" />
                    <span className="text-orange-400 font-mono w-8 text-right" style={{ fontSize: '11px' }}>
                        {amp.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Step 10 demo ─────────────────────────────────────────────────────────────

function MiniRenderDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const [frame, setFrame] = useState(0);
    const [seedDisplay, setSeedDisplay] = useState('');

    const regenerate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const bytes = new Uint8Array(8);
        crypto.getRandomValues(bytes);
        const s = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        setSeedDisplay(s);
        setFrame(0);
        runMiniRender(canvas, rafRef, setFrame, s);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const bytes = new Uint8Array(8);
        crypto.getRandomValues(bytes);
        const s = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        setTimeout(() => setSeedDisplay(s), 0);
        runMiniRender(canvas, rafRef, setFrame, s);
        const raf = rafRef;

        return () => cancelAnimationFrame(raf.current); // intentional: cancel latest scheduled frame
    }, []);

    return (
        <div className="space-y-3">
            <canvas ref={canvasRef} width={300} height={300} className="w-full rounded-xl border border-zinc-700/40" />
            <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-mono" style={{ fontSize: '11px' }}>
                    {frame < MINI_FRAMES ? `frame ${frame} / ${MINI_FRAMES}` : 'complete'}
                </span>
                <button
                    onClick={regenerate}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 font-mono hover:bg-orange-500/30 transition-colors"
                    style={{ fontSize: '12px' }}
                >
                    {'new seed →'}
                </button>
            </div>
            {seedDisplay && (
                <p className="text-zinc-700 font-mono truncate" style={{ fontSize: '10px' }}>
                    {`seed: ${seedDisplay}`}
                </p>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
    return (
        <div className={`${NOISE_BG} min-h-screen text-white`}>
            <FadeIn className="max-w-3xl mx-auto px-6 py-20 space-y-6">
                <Link href="/art-solace" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors font-mono" style={{ fontSize: '13px' }}>
                    {'← back'}
                </Link>

                <div>
                    <h1 className="text-3xl font-black tracking-tight">{'Art Solace'}</h1>
                    <p className="text-zinc-400 mt-2" style={{ fontSize: '15px' }}>
                        {'Generative desert dunes — dot-matrix rendering, seeded randomness, and procedural geometry on a 2D canvas.'}
                    </p>
                </div>

                <SectionRule />

                {/* Step 1 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={1} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'PRNG'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Seeded Randomness — cyrb128 + sfc32'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {'Every composition is deterministic: the same string seed always produces the same artwork. A two-stage pipeline achieves this.'}
                        {' First, '}
                        <Pill>{'cyrb128'}</Pill>
                        {' hashes the seed string into four 32-bit integers using bitwise mixing and '}
                        <Pill>{'Math.imul'}</Pill>
                        {'. Those four integers seed '}
                        <Pill>{'sfc32'}</Pill>
                        {', a fast counter-based generator that returns floats in [0, 1).'}
                    </p>

                    <CodeBlock lang="ts">{`function cyrb128(s: string): [number, number, number, number] {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0; i < s.length; i++) {
        const k = s.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    // finalise avalanche
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    // ... (3 more lines)
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function makeSfc32(a0: number, b0: number, c0: number, d0: number): () => number {
    let a = a0, b = b0, c = c0, d = d0;
    return () => {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;  // → [0, 1)
    };
}

// Usage
const rng = makeSfc32(...cyrb128('my-seed'));
rng(); // → deterministic float in [0, 1)`}</CodeBlock>

                    <Callout variant="tip">
                        {'The art uses two separate RNG instances: '}
                        <Pill>{'fxrand'}</Pill>
                        {' drives trait selection, then its next output seeds a second '}
                        <Pill>{'rng'}</Pill>
                        {' for all rendering. This keeps traits and geometry independently reproducible.'}
                    </Callout>

                    <DemoShell title="rng-demo.tsx">
                        <RngDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 2 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={2} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'MATH'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Gaussian Distribution — Box-Muller Transform'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {'Dunes need organic scatter, not uniform scatter. The Box-Muller transform converts two uniform random values into a pair of normally distributed values'}
                        {' (bell-curve, centred at 0). The trick: generate two uniform floats in a unit disk, then use the log of their squared magnitude to compute the standard deviation.'}
                        {' Each call consumes one value and caches the other in '}
                        <Pill>{'spare'}</Pill>
                        {' for the next call, so no work is wasted.'}
                    </p>

                    <CodeBlock lang="ts">{`function makeGaussian(rng: () => number): () => number {
    let spare: number | null = null;
    return (): number => {
        if (spare !== null) {
            const s = spare; spare = null; return s;
        }
        let u: number, v: number, s: number;
        do {
            u = rng() * 2 - 1;  // uniform in [-1, 1]
            v = rng() * 2 - 1;
            s = u * u + v * v;
        } while (s >= 1 || s === 0);  // reject outside unit circle

        const m = Math.sqrt((-2 * Math.log(s)) / s);
        spare = v * m;  // cache second value
        return u * m;   // return first value
    };
}

const gauss = makeGaussian(rng);
gauss(); // → normally distributed float (μ=0, σ=1)`}</CodeBlock>

                    <DemoShell title="gaussian-histogram.tsx">
                        <GaussianDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 3 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={3} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'NOISE'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Perlin Noise — Smooth Procedural Fields'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {'Classic 3D Perlin noise produces spatially coherent random fields — neighbouring pixels get similar values, creating smooth gradients instead of white noise.'}
                        {' The implementation uses a seeded-shuffle permutation table of 256 entries doubled to 512 to avoid wrap-around indexing, 12 gradient vectors at cube corners/edges,'}
                        {' and the quintic fade curve '}
                        <Pill>{'t³(6t²-15t+10)'}</Pill>
                        {' for C² continuity at lattice boundaries.'}
                    </p>

                    <CodeBlock lang="ts">{`// 12 gradient vectors (edges of a unit cube)
const G3 = [
    [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
    [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
    [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1],
] as const;

// Quintic fade: C² smooth, no visible lattice edges
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

// makeNoise(seed) → (x, y) → float in [0, 1]
// Permutation table is shuffled with the seeded RNG,
// so each seed produces a completely different noise field.
function makeNoise(seedN: number) {
    const rng = makeSfc32(...cyrb128(String(seedN)));
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return (px: number, py = 0) => { /* trilinear interpolation */ };
}`}</CodeBlock>

                    <Callout variant="info">
                        {'Noise is used for the Sandstorm trait: '}
                        <Pill>{'noise(30*cx, 30*cy) % 0.1 < 0.005'}</Pill>
                        {' randomly scatters some boundary Y-coordinates, roughening the dune edges to simulate wind-blown sand.'}
                    </Callout>

                    <DemoShell title="noise-field.tsx">
                        <NoiseDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 4 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={4} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'TRAITS'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Trait System — Weighted Probability Selection'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        <Pill>{'makeFeatures'}</Pill>
                        {' maps one RNG stream into nine visual traits. Each trait is selected by comparing a single '}
                        <Pill>{'fxrand()'}</Pill>
                        {' call against a set of probability thresholds — the order of thresholds sets the rarity. Traits that share similar visual character'}
                        {' (e.g. Misty, Dancers) check multiple conditions before resolving.'}
                        {' The total number of '}
                        <Pill>{'fxrand()'}</Pill>
                        {' calls in '}
                        <Pill>{'makeFeatures'}</Pill>
                        {' is always the same regardless of branching, so downstream RNG state stays deterministic.'}
                    </p>

                    <CodeBlock lang="ts">{`function makeFeatures(fxrand: () => number): Traits {
    const style = STYLES[Math.floor(fxrand() * STYLES.length)];

    // Dunes: 1/3/6/12/24/48, or 120 (2% ultra-rare)
    const a = Math.floor(6 * fxrand());
    const dunes = fxrand() < 0.02 ? 120 : [1,3,6,12,24,48][a];

    // Sky: seven variants with explicit probability brackets
    const r = fxrand();
    const sky = r < 0.03 ? 'Tabula'     //  3% rarest
              : r < 0.14 ? 'Starry'     // 11%
              : r < 0.20 ? 'Wool'       //  6%
              : r < 0.35 ? 'Beam'       // 15%
              : r < 0.60 ? 'Timelapse'  // 25%
              : r < 0.80 ? 'Whisper'    // 20%
              :             'Null';     // 20% most common

    return {
        Palette: style.name, Dunes: dunes, Sky: sky,
        Margin: ..., Brush: ..., Render: ...,
        Dusty: ..., Misty: ..., Dancers: ..., Sandstorm: ...
    };
}`}</CodeBlock>

                    <DemoShell title="trait-roller.tsx">
                        <TraitRollDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 5 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={5} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'COLOUR'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Style Palettes — 18 Named Colour Schemes'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {'Each style defines a background hex, a dot/fill hex, an alpha value (0–255), and a '}
                        <Pill>{'canSoft'}</Pill>
                        {' flag. The 12 common palettes appear three times in the '}
                        <Pill>{'STYLES'}</Pill>
                        {' pool (total 36 entries), while the 6 rare palettes appear once — giving common palettes roughly a 6-in-7 selection probability.'}
                        {' Dot colour is converted to an '}
                        <Pill>{'rgba()'}</Pill>
                        {' CSS string at scene-build time and reused for every '}
                        <Pill>{'fillRect'}</Pill>
                        {' call.'}
                    </p>

                    <CodeBlock lang="ts">{`type Style = {
    name: string;
    bgColor: string;   // background fill
    fillColor: string; // dot colour
    fillAlpha: number; // 0–255 base opacity
    canSoft: boolean;  // eligible for 'Soft' brush mode
};

// Common styles appear 3× in STYLES for ~6/7 probability
const COMMON_STYLES: Style[] = [
    { name: 'Smart', bgColor: '#F5EFED', fillColor: '#0B2332',
      fillAlpha: 80, canSoft: false },
    // ...
];

// Rare styles appear once — ~1/7 of picks
const RARE_STYLES: Style[] = [
    { name: 'Polar', bgColor: '#5858C6', fillColor: '#09060F',
      fillAlpha: 80, canSoft: false },
    // ...
];

const STYLES = [...COMMON_STYLES, ...COMMON_STYLES, ...COMMON_STYLES, ...RARE_STYLES];

// Convert to CSS at build time, not per dot
function toRgba(hex: string, alpha255: number): string {
    const [r, g, b] = hexToRgb(hex);
    return \`rgba(\${r},\${g},\${b},\${(alpha255/255).toFixed(4)})\`;
}`}</CodeBlock>

                    <DemoShell title="palette-swatches.tsx">
                        <PaletteDemo />
                    </DemoShell>

                    <Callout variant="tip">{'Orange labels above are the 6 rare palettes. The left square is the background colour, the small circle is the dot/dune fill colour.'}</Callout>
                </div>

                <SectionRule />

                {/* Step 6 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={6} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'GEOMETRY'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Boundary Maps — Dune Silhouette via Diagonal Scan Lines'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {'Each dune peak stores two hash maps — '}
                        <Pill>{'boundary1'}</Pill>
                        {' and '}
                        <Pill>{'boundary2'}</Pill>
                        {' — that record where a descending ridge walk first crossed each diagonal scan line.'}
                        {' A diagonal scan line is characterised by a single integer key: '}
                        <Pill>{'leftKey = floor((y - slope*x) * resolution)'}</Pill>
                        {' for one flank, and '}
                        <Pill>{'rightKey = floor((y + slope*x) * resolution)'}</Pill>
                        {' for the other.'}
                        {' Any later test point looks up its two keys and compares the stored boundary Y values to determine which zone it falls in.'}
                    </p>

                    <CodeBlock lang="ts">{`// Compute the two diagonal keys for a point (x, y)
function makeBoundaryKeys(
    x: number, y: number,
    diagonalSlope: number, keyResolution: number
): [number, number] {
    const leftKey  = Math.floor((y - diagonalSlope * x) * keyResolution);
    const rightKey = Math.floor((y + diagonalSlope * x) * keyResolution);
    return [leftKey, rightKey];
}

// During the ridge walk, record first-visit Y for each key
while (walkY < 1.0) {
    walkY += 0.001;
    // ... oscillate walkX ...
    const [lk, rk] = makeBoundaryKeys(walkX, walkY, slope, res);
    if (!boundary1[lk]) boundary1[lk] = walkY;  // left flank
    if (!boundary2[rk]) boundary2[rk] = walkY;  // right flank
}

// Shade test: compare stored boundaries at the test point
function calcShade(x: number, y: number): 'dark' | 'light' | 'sky' {
    const [lk, rk] = makeBoundaryKeys(x, y, peak.slope, peak.res);
    let lb = peak.boundary1[lk] ?? 0; if (y <= lb) lb = 0;
    let rb = peak.boundary2[rk] ?? 0; if (y <= rb) rb = 0;
    if (rb > lb) return 'dark';   // inside both flanks
    if (lb > rb) return 'light';  // inside left flank only
    return 'sky';                 // outside both
}`}</CodeBlock>

                    <DemoShell title="boundary-map.tsx">
                        <BoundaryDemo />
                    </DemoShell>

                    <Callout variant="info">
                        {'The '}
                        <Pill>{'keyResolution'}</Pill>
                        {
                            ' parameter controls silhouette detail. Distant peaks use higher resolution (up to 600) for fine, smooth edges; foreground peaks use 110–160 for a coarser look that reads as closer.'
                        }
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 7 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={7} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'GEOMETRY'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Ridge Walk — Dual Sine-Wave Oscillators'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        <Pill>{'createPeak'}</Pill>
                        {' traces the dune ridge from apex downward in 0.001 Y increments. At each step, two independent sine oscillators nudge the X position.'}
                        {' Each oscillator has its own frequency, amplitude (with random sign), and phase.'}
                        {' Amplitude scales non-linearly with depth: special (wavy) peaks use a quadratic scale so the wings flare dramatically at the base; normal peaks use linear growth.'}
                        {' A 15% chance silences the second oscillator, producing cleaner single-curve ridges.'}
                    </p>

                    <CodeBlock lang="ts">{`function createPeak(px, py, slope, res, isSpecial): Peak {
    const wave1Freq  = random(5, 10);
    const wave1Amp   = random(2e-4, 3e-4) * random([-1, 1]);
    const wave1Phase = random(TWO_PI);

    const wave2Freq  = random(10, 30);
    let   wave2Amp   = random(0.001, 0.0015) * random([-1, 1]);
    const wave2Phase = random(TWO_PI);
    if (random() < 0.15) wave2Amp = 0;  // 15%: single-wave ridge

    let walkX = px, walkY = py;
    while (walkY < 1.0) {
        walkX -= 2e-4;   // constant leftward drift
        walkY += 0.001;

        // Non-linear amplitude growth: wider base for special peaks
        const waveScale = isSpecial
            ? mapRange((walkY - py)**2 * numPeaks, 0, 1, 0.5, 10)
            : mapRange(walkY - py, 0, 1, 0.5, 1);

        walkX += wave1Amp * waveScale * sin(wave1Phase + wave1Freq * sqrt(walkY));
        walkX += wave2Amp * waveScale * sin(wave2Phase + wave2Freq * sqrt(walkY));

        // Record boundary crossings
        const [lk, rk] = makeBoundaryKeys(walkX, walkY, slope, res);
        if (!b1[lk]) b1[lk] = walkY;
        if (!b2[rk]) b2[rk] = walkY;
    }
    return { boundary1: b1, boundary2: b2, ... };
}`}</CodeBlock>

                    <DemoShell title="ridge-walk.tsx">
                        <RidgeWalkDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                {/* Step 8 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={8} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'TRANSFORM'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Warp & Unwarp — Vertical Compression + Sine Distortion'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {
                            'Every canvas dot is drawn at its warped position but shade-tested at its unwarped position. This decoupling lets you deform the entire composition without rebuilding the boundary maps.'
                        }
                        <Pill>{'warp(x, y)'}</Pill>
                        {' applies two transforms: a sine-wave undulation along Y (creating wavy horizons), then a power-curve compression pushing content into the lower canvas.'}
                        {' Drawing is done in warped space; the boundary maps live in unwarped space, so '}
                        <Pill>{'unwarp'}</Pill>
                        {' converts the draw coordinate back before the shade lookup.'}
                    </p>

                    <CodeBlock lang="ts">{`function warp(xin: number, yin: number): [number, number] {
    let x = xin;
    if (isFlipX) x = 1 - x;
    // 1. Sine-wave undulation
    const sinOffset = warpAmplY * sin(warpPhaseY + warpFreqY * x);
    const rawY = yin + sinOffset;
    // 2. Power-curve compression (pushes peaks downward)
    const powY = pow(rawY + 0.05, verticalCompression);
    const y = mapRange(powY,
        pow(0.05, verticalCompression),
        pow(1.05, verticalCompression), 0, 1);
    return [x, y];
}

function unwarp(xin: number, yin: number): [number, number] {
    // Invert power-curve
    const powY = mapRange(yin, 0, 1,
        pow(0.05, vc), pow(1.05, vc));
    const rawY = pow(powY, 1 / vc) - 0.05;
    // Invert sine
    const y = rawY - warpAmplY * sin(warpPhaseY + warpFreqY * xin);
    let x = xin;
    if (isFlipX) x = 1 - x;
    return [x, y];
}`}</CodeBlock>

                    <DemoShell title="warp-grid.tsx">
                        <WarpDemo />
                    </DemoShell>

                    <Callout variant="tip">
                        {'Drag '}
                        <Pill>{'verticalComp'}</Pill>
                        {
                            ' to 1.5 — the grid lines bunch near the bottom. This compresses all peaks into the lower third, giving compositions a panoramic horizon feel. Low values spread content evenly across the canvas.'
                        }
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 9 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={9} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'RENDERING'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Shade Classification — DARK / LIGHT / SKY Zones'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {'Once a dot has a shade zone, a probability gate decides whether to actually draw it.'}
                        {' The dark core draws every dot (100%). The lit slope draws 10% — creating a sparse, grainy highlight that reads as a sun-facing face.'}
                        {' The sky draws at '}
                        <Pill>{'skyProb'}</Pill>
                        {', controlled by the Sky trait (0.5 for Starry, 1.0 for Tabula). Skipping most sky dots keeps the background airy and lets the dunes read against it without a solid fill.'}
                    </p>

                    <CodeBlock lang="ts">{`// Per-dot draw decision inside drawFrame()
const [uwX, uwY] = unwarp(x, y);
const [shade] = calcShade(uwX, uwY);

const drawProbability =
    shade === SHADE_DARK  ? 1      // core: solid fill
  : shade === SHADE_LIGHT ? 0.1   // slope: sparse highlight
  :                         skyProb; // sky: density from trait

if (rng() <= drawProbability) {
    const dotSize = 0.0012 * size;  // ~1.2 px on 1000 px canvas
    ctx.fillRect(x * size, y * size, dotSize, dotSize);
}

// skyProb by Sky trait:
// 'Tabula'    → 1.0  (fully opaque background grid)
// 'Starry'    → 0.5–0.8  (very sparse = stars effect)
// 'Timelapse' → 0.8–1.0
// 'Null'      → 0.8–1.0`}</CodeBlock>

                    <Callout variant="info">
                        {'The Brush trait scales the dot alpha before drawing.'}
                        {' Grainy multiplies '}
                        <Pill>{'fillAlpha'}</Pill>
                        {' by 100 (opaque per dot) and runs 100 frames. Soft multiplies by 0.3 and runs 50 frames.'}
                        {' Both end up with similar total ink, but Grainy builds density through stacking while Soft uses semi-transparency.'}
                    </Callout>
                </div>

                <SectionRule />

                {/* Step 10 */}
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <StepBadge n={10} />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Tag>{'ANIMATION'}</Tag>
                            </div>
                            <h2 className="text-xl font-bold">{'Progressive Rendering — requestAnimationFrame Loop'}</h2>
                        </div>
                    </div>

                    <p className="text-zinc-300 leading-relaxed" style={{ fontSize: '15px' }}>
                        {'The artwork never renders in a single pass. Each '}
                        <Pill>{'requestAnimationFrame'}</Pill>
                        {' tick draws 8,000 dots whose Y coordinate advances linearly from '}
                        <Pill>{'marginMin'}</Pill>
                        {' to '}
                        <Pill>{'marginMax'}</Pill>
                        {' across the full 50–100 frame run.'}
                        {' This creates the sand-settling effect: the sky fills first, then dunes emerge from top to bottom. The canvas is never cleared between frames — dots accumulate.'}
                    </p>

                    <CodeBlock lang="ts">{`// Total progress 0→1 across all frames drives Y top→bottom
function drawFrame(ctx: CanvasRenderingContext2D, frameCount: number) {
    if (frameCount >= totalFrames) return false;

    ctx.fillStyle = fillStyle; // pre-computed rgba string

    for (let i = 0; i < TOTAL_DOTS; i++) {    // 8000 dots
        const progress = (TOTAL_DOTS * frameCount + i)
                       / (TOTAL_DOTS * totalFrames);

        const x = random(marginMin, marginMax);          // random X
        const y = lerp(marginMin, marginMax, progress);  // sweeping Y

        const [uwX, uwY] = unwarp(x, y);
        const [shade] = calcShade(uwX, uwY);
        // ... probability gate + fillRect
    }
    return true;
}

// Mount: fill background, then tick
useEffect(() => {
    ctx.fillStyle = scene.bgColor;
    ctx.fillRect(0, 0, size, size);

    let frame = 0;
    const tick = () => {
        scene.drawFrame(ctx, frame++);
        if (frame < scene.totalFrames)
            rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
}, []);`}</CodeBlock>

                    <Callout variant="warn">
                        {'Canvas DPR: the art hard-codes '}
                        <Pill>{'pixelDensity(2)'}</Pill>
                        {' — equivalent to setting '}
                        <Pill>{'canvas.width = size * 2'}</Pill>
                        {' and '}
                        <Pill>{'ctx.scale(2, 2)'}</Pill>
                        {'. All dot positions and sizes are passed in logical pixels; the 2× scale handles the physical pixel mapping. Without this, dots appear blurry on retina screens.'}
                    </Callout>

                    <DemoShell title="mini-render.tsx">
                        <MiniRenderDemo />
                    </DemoShell>
                </div>

                <SectionRule />

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-zinc-300">{'How it all connects'}</h2>
                    <div className="grid grid-cols-1 gap-2" style={{ fontSize: '13px' }}>
                        {[
                            ['cyrb128 + sfc32', 'String seed → deterministic float stream'],
                            ['makeGaussian', 'Sandstorm scatter + blur jitter'],
                            ['makeNoise', 'Sandstorm boundary roughness'],
                            ['makeFeatures', 'Traits from fxrand: palette, dunes, sky, brush…'],
                            ['createPeak', 'Ridge walk → boundary1 / boundary2 hash maps'],
                            ['warp / unwarp', 'Power-curve + sine distort draw positions'],
                            ['calcShade', 'DARK / LIGHT / SKY via diagonal key lookup'],
                            ['drawFrame × 50–100', 'Progressive Y sweep, 8 000 dots per frame'],
                        ].map(([fn, desc]) => (
                            <div key={fn} className="flex items-start gap-3 py-2 border-b border-zinc-800/60 last:border-0">
                                <Pill>{fn}</Pill>
                                <span className="text-zinc-400 pt-0.5">{desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>
        </div>
    );
}
