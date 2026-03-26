'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

// ─── Mini noise implementation for demos ─────────────────────────────────────

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
const _lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function buildNoise(seed = 42) {
    const rng = (() => {
        let s = seed | 0;
        return () => {
            s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
            s = Math.imul(s ^ (s >>> 11), 0xac4d);
            return ((s ^ (s >>> 15)) >>> 0) / 0x100000000;
        };
    })();
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    return (px: number, py = 0, pz = 0): number => {
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
            AA = perm[A] + Z,
            AB = perm[A + 1] + Z,
            B = perm[X + 1] + Y,
            BA = perm[B] + Z,
            BB = perm[B + 1] + Z;
        const g = (h: number, dx: number, dy: number, dz: number) => {
            const gg = _G3[h % 12];
            return gg[0] * dx + gg[1] * dy + gg[2] * dz;
        };
        const n = _lerp(
            _lerp(_lerp(g(perm[AA], x, y, z), g(perm[BA], x - 1, y, z), u), _lerp(g(perm[AB], x, y - 1, z), g(perm[BB], x - 1, y - 1, z), u), v),
            _lerp(_lerp(g(perm[AA + 1], x, y, z - 1), g(perm[BA + 1], x - 1, y, z - 1), u), _lerp(g(perm[AB + 1], x, y - 1, z - 1), g(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
            w,
        );
        return (n + 1) * 0.5;
    };
}

const DEMO_NOISE = buildNoise(1337);

// ─── Demo 1: Noise + Domain Warp ─────────────────────────────────────────────

function NoiseWarpDemo() {
    const rawRef = useRef<HTMLCanvasElement>(null);
    const warpRef = useRef<HTMLCanvasElement>(null);
    const [freq, setFreq] = useState(0.04);
    const [warpStr, setWarpStr] = useState(8);
    const W = 160,
        H = 160;

    const draw = useCallback(() => {
        const drawCanvas = (ref: React.RefObject<HTMLCanvasElement | null>, warp: boolean) => {
            const ctx = ref.current?.getContext('2d');
            if (!ctx) return;
            const img = ctx.createImageData(W, H);
            const d = img.data;
            for (let py = 0; py < H; py++) {
                for (let px = 0; px < W; px++) {
                    let sx = px * (100 / W),
                        sy = py * (100 / H);
                    if (warp) {
                        const wx = DEMO_NOISE(sx * freq * 2 + 100, sy * freq * 2 + 100);
                        const wy = DEMO_NOISE(sx * freq * 2 + 200, sy * freq * 2 + 200);
                        sx += Math.cos(wx * Math.PI * 2) * warpStr;
                        sy += Math.sin(wy * Math.PI * 2) * warpStr;
                    }
                    let ns = 0;
                    ns += DEMO_NOISE(sx * freq, sy * freq) * 1;
                    ns += DEMO_NOISE(sx * freq * 2, sy * freq * 2) * 0.5;
                    ns += DEMO_NOISE(sx * freq * 4, sy * freq * 4) * 0.25;
                    ns = ns / 1.75;
                    const v = Math.round(Math.pow(Math.max(0, Math.min(1, ns)), 1) * 255);
                    const i = (py * W + px) * 4;
                    d[i] = v;
                    d[i + 1] = v;
                    d[i + 2] = v;
                    d[i + 3] = 255;
                }
            }
            ctx.putImageData(img, 0, 0);
        };
        drawCanvas(rawRef, false);
        drawCanvas(warpRef, true);
    }, [freq, warpStr]);

    useEffect(() => {
        draw();
    }, [draw]);

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap gap-6 items-start">
                <div className="flex flex-col gap-1.5">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        Raw fBm noise
                    </p>
                    <canvas ref={rawRef} width={W} height={H} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: W, height: H }} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        Domain-warped fBm
                    </p>
                    <canvas ref={warpRef} width={W} height={H} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: W, height: H }} />
                </div>
                <div className="flex flex-col gap-3 flex-1 min-w-[140px]">
                    {[
                        { label: 'Frequency', val: freq, min: 0.01, max: 0.12, step: 0.005, set: setFreq },
                        { label: 'Warp strength', val: warpStr, min: 0, max: 20, step: 0.5, set: setWarpStr },
                    ].map(({ label, val, min, max, step, set }) => (
                        <label key={label} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                    {label}
                                </span>
                                <span className="text-amber-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                                    {val.toFixed(3)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={val}
                                onChange={(e) => set(parseFloat(e.target.value))}
                                className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                            />
                        </label>
                    ))}
                </div>
            </div>
            <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '12px' }}>
                Set <strong className="text-zinc-300">Warp strength → 0</strong> to see raw fBm, then increase it. Domain warping curls and folds the terrain into organic ridge patterns.
            </p>
        </div>
    );
}

// ─── Demo 2: Erosion ─────────────────────────────────────────────────────────

function buildHeightMap(N: number, noiseF: ReturnType<typeof buildNoise>): number[][] {
    const map: number[][] = [];
    for (let i = 0; i < N; i++) {
        const row: number[] = [];
        for (let j = 0; j < N; j++) {
            let ns = noiseF(i * 0.04, j * 0.04) * 1 + noiseF(i * 0.08, j * 0.08) * 0.5 + noiseF(i * 0.16, j * 0.16) * 0.25;
            ns /= 1.75;
            row.push(Math.pow(ns, 1.2));
        }
        map.push(row);
    }
    return map;
}

function erodeSimple(mp: number[][], nDrops: number, rng: () => number) {
    const N = mp.length;
    for (let d = 0; d < nDrops; d++) {
        let px = rng() * (N - 2),
            py = rng() * (N - 2);
        let sediment = 0,
            speed = 0,
            water = 1;
        for (let step = 0; step < 40; step++) {
            const nx = Math.round(px),
                ny = Math.round(py);
            if (nx < 0 || nx >= N - 1 || ny < 0 || ny >= N - 1) break;
            const hNW = mp[nx][ny],
                hNE = mp[nx + 1][ny],
                hSW = mp[nx][ny + 1],
                hSE = mp[nx + 1][ny + 1];
            const offX = px - nx,
                offY = py - ny;
            const gx = (hNE - hNW) * (1 - offY) + (hSE - hSW) * offY;
            const gy = (hSW - hNW) * (1 - offX) + (hSE - hNE) * offX;
            const dm = Math.sqrt(gx * gx + gy * gy) || 1;
            const dx = -gx / dm,
                dy = -gy / dm;
            const ht = hNW * (1 - offX) * (1 - offY) + hNE * offX * (1 - offY) + hSW * (1 - offX) * offY + hSE * offX * offY;
            px += dx;
            py += dy;
            if (px < 0 || px >= N - 1 || py < 0 || py >= N - 1) break;
            const newHt = mp[Math.round(px)][Math.round(py)];
            const dHt = newHt - ht;
            const sedCap = Math.max(-dHt * speed * water * 4, 0.001);
            if (sediment > sedCap) {
                const dep = (sediment - sedCap) * 0.3;
                sediment -= dep;
                mp[nx][ny] = Math.min(1, mp[nx][ny] + dep * 0.5);
                if (nx + 1 < N) mp[nx + 1][ny] = Math.min(1, mp[nx + 1][ny] + dep * 0.25);
                if (ny + 1 < N) mp[nx][ny + 1] = Math.min(1, mp[nx][ny + 1] + dep * 0.25);
            } else {
                const ero = Math.min((sedCap - sediment) * 0.3, Math.max(0, -dHt));
                const ds = Math.min(mp[nx][ny], ero);
                mp[nx][ny] -= ds;
                sediment += ds;
            }
            speed = Math.sqrt(speed * speed + Math.abs(dHt) * 4);
            water *= 0.95;
            if (water < 0.01) break;
        }
    }
}

function ErosionDemo() {
    const beforeRef = useRef<HTMLCanvasElement>(null);
    const afterRef = useRef<HTMLCanvasElement>(null);
    const W = 160,
        H = 160,
        N = 60;

    useEffect(() => {
        const rawMap = buildHeightMap(N, buildNoise(42));
        const erodedMap = rawMap.map((row) => [...row]);
        let s = 9999;
        const rng = () => {
            s = Math.imul(s, 0x9e3779b9) >>> 0;
            return s / 0x100000000;
        };
        erodeSimple(erodedMap, 800, rng);

        const drawMap = (ref: React.RefObject<HTMLCanvasElement | null>, mp: number[][]) => {
            const ctx = ref.current?.getContext('2d');
            if (!ctx) return;
            const img = ctx.createImageData(W, H);
            const d = img.data;
            for (let py = 0; py < H; py++) {
                for (let px = 0; px < W; px++) {
                    const i2 = Math.floor((px * N) / W),
                        j2 = Math.floor((py * N) / H);
                    const v = Math.round(Math.max(0, Math.min(1, mp[i2][j2])) * 255);
                    const i = (py * W + px) * 4;
                    d[i] = v;
                    d[i + 1] = v;
                    d[i + 2] = v;
                    d[i + 3] = 255;
                }
            }
            ctx.putImageData(img, 0, 0);
        };
        drawMap(beforeRef, rawMap);
        drawMap(afterRef, erodedMap);
    }, []);

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap gap-6 items-start">
                <div className="flex flex-col gap-1.5">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        Before erosion
                    </p>
                    <canvas ref={beforeRef} width={W} height={H} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: W, height: H }} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        After erosion (800 drops)
                    </p>
                    <canvas ref={afterRef} width={W} height={H} className="rounded-lg border border-zinc-700" style={{ imageRendering: 'pixelated', width: W, height: H }} />
                </div>
                <p className="flex-1 text-zinc-500 leading-relaxed self-center" style={{ fontSize: '12px' }}>
                    Each raindrop slides downhill, picks up sediment on steep slopes, and deposits it in flatter areas. After thousands of drops the terrain develops sharp ridges, valleys, and
                    alluvial fans that look geologically plausible.
                </p>
            </div>
        </div>
    );
}

// ─── Demo 3: Pen Physics ─────────────────────────────────────────────────────

function PenPhysicsDemo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [maxV, setMaxV] = useState(1.5);
    const [acc, setAcc] = useState(0.03);
    const [wobble, setWobble] = useState(0.15);
    const rafRef = useRef(0);
    const stateRef = useRef({ pen: { x: 0, y: 0 }, penV: { x: 0, y: 0 }, idx: 0, lineLen: 0 });
    const W = 220,
        H = 220;

    // Build hatch ellipse points
    const rx = 70,
        ry = 40;
    const nSteps = 18;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < nSteps; i++) {
        const x = ((i / (nSteps - 1)) * 2 - 1) * rx;
        const ht = ry * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)));
        points.push({ x, y: ht });
        points.push({ x, y: -ht });
    }

    const paramsRef = useRef({ maxV, acc, wobble });
    useEffect(() => {
        paramsRef.current = { maxV, acc, wobble };
    }, [maxV, acc, wobble]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const cx = W / 2,
            cy = H / 2;
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, W, H);
        // draw faint ellipse outline
        ctx.strokeStyle = 'rgba(120,80,40,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        // dot guides
        points.forEach((pt) => {
            ctx.fillStyle = 'rgba(180,120,60,0.2)';
            ctx.fillRect(cx + pt.x - 1, cy + pt.y - 1, 2, 2);
        });

        const st = stateRef.current;
        st.pen = { x: points[0].x, y: points[0].y };
        st.penV = { x: 0, y: 0 };
        st.idx = 1;
        st.lineLen = 0;

        const loop = () => {
            const { maxV: mv, acc: ac, wobble: wb } = paramsRef.current;
            if (st.idx >= points.length) {
                st.idx = 1;
                st.pen = { x: points[0].x, y: points[0].y };
                st.penV = { x: 0, y: 0 };
                st.lineLen = 0;
                ctx.fillStyle = '#18181b';
                ctx.fillRect(0, 0, W, H);
                ctx.strokeStyle = 'rgba(120,80,40,0.18)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
                points.forEach((pt) => {
                    ctx.fillStyle = 'rgba(180,120,60,0.2)';
                    ctx.fillRect(cx + pt.x - 1, cy + pt.y - 1, 2, 2);
                });
            }
            const target = points[st.idx];
            st.penV.x += (target.x - st.pen.x) * ac;
            st.penV.y += (target.y - st.pen.y) * ac;
            const wa = Math.random() * Math.PI * 2;
            st.penV.x += Math.cos(wa) * wb;
            st.penV.y += Math.sin(wa) * wb;
            st.penV.x *= 0.8;
            st.penV.y *= 0.8;
            const vm = Math.sqrt(st.penV.x * st.penV.x + st.penV.y * st.penV.y);
            if (vm > mv) {
                st.penV.x *= mv / vm;
                st.penV.y *= mv / vm;
            }
            st.lineLen += vm;
            st.pen.x += st.penV.x;
            st.pen.y += st.penV.y;
            if ((target.x - st.pen.x) ** 2 + (target.y - st.pen.y) ** 2 < 9) st.idx++;
            // draw dot with alpha
            const offDist = Math.sqrt(Math.random()) * 1.5;
            const offA = Math.random() * Math.PI * 2;
            const dotX = cx + st.pen.x + Math.cos(offA) * offDist;
            const dotY = cy + st.pen.y + Math.sin(offA) * offDist;
            ctx.fillStyle = 'rgba(210,170,100,0.55)';
            ctx.fillRect(dotX - 0.5, dotY - 0.5, 1, 1);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap gap-6 items-start">
                <div className="flex flex-col gap-1.5 shrink-0">
                    <p className="text-zinc-500 font-mono uppercase tracking-widest" style={{ fontSize: '9px' }}>
                        Live pen simulation
                    </p>
                    <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border border-zinc-700" style={{ width: W, height: H }} />
                </div>
                <div className="flex flex-col gap-3 flex-1 min-w-[140px]">
                    {[
                        { label: 'Max velocity', val: maxV, min: 0.2, max: 4, step: 0.1, set: setMaxV },
                        { label: 'Acceleration', val: acc, min: 0.005, max: 0.12, step: 0.005, set: setAcc },
                        { label: 'Wobble', val: wobble, min: 0, max: 0.6, step: 0.02, set: setWobble },
                    ].map(({ label, val, min, max, step, set }) => (
                        <label key={label} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                    {label}
                                </span>
                                <span className="text-amber-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                                    {val.toFixed(3)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={val}
                                onChange={(e) => set(parseFloat(e.target.value))}
                                className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                            />
                        </label>
                    ))}
                </div>
            </div>
            <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '12px' }}>
                The pen never jumps — it <em>chases</em> each hatch target. Low <strong className="text-zinc-300">acceleration</strong> creates smooth arcs. Adding{' '}
                <strong className="text-zinc-300">wobble</strong> introduces the hand-drawn jitter that makes strokes feel organic.
            </p>
        </div>
    );
}

// ─── Demo 4: Palette mapping ──────────────────────────────────────────────────

const PALETTES: [number, number, number][][] = [
    [
        [4, 11, 33],
        [12, 40, 45],
        [43, 64, 57],
        [154, 66, 46],
        [216, 125, 27],
        [223, 180, 191],
        [243, 231, 220],
    ],
    [
        [35, 38, 1],
        [74, 105, 254],
        [34, 99, 48],
        [239, 65, 47],
        [239, 172, 37],
        [238, 239, 208],
    ],
    [
        [26, 29, 40],
        [55, 125, 113],
        [136, 121, 176],
        [251, 161, 161],
        [251, 197, 197],
    ],
    [
        [41, 38, 78],
        [96, 84, 162],
        [152, 129, 245],
        [141, 152, 247],
        [249, 125, 129],
        [251, 157, 160],
        [252, 188, 190],
        [247, 192, 102],
    ],
];

function PaletteDemo() {
    const [pal, setPal] = useState(0);
    const [lightVal, setLightVal] = useState(0.6);
    const [landVal, setLandVal] = useState(0.4);
    const palette = PALETTES[pal];

    const blend = Math.abs(lightVal - 0.5) * 2;
    const mixed = lightVal * blend + landVal * (1 - blend);
    const idx = Math.min(Math.floor(mixed * palette.length), palette.length - 1);
    const [r, g, b] = palette[idx];

    return (
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <div className="flex gap-2 flex-wrap">
                    {PALETTES.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => setPal(i)}
                            className={`flex gap-0.5 rounded overflow-hidden border-2 transition-colors ${pal === i ? 'border-amber-400' : 'border-transparent'}`}
                        >
                            {p.map(([pr, pg, pb], j) => (
                                <span key={j} className="block w-4 h-6" style={{ background: `rgb(${pr},${pg},${pb})` }} />
                            ))}
                        </button>
                    ))}
                </div>
                {[
                    { label: 'Light value (from dot product)', val: lightVal, set: setLightVal },
                    { label: 'Land value (from noise)', val: landVal, set: setLandVal },
                ].map(({ label, val, set }) => (
                    <label key={label} className="flex flex-col gap-1">
                        <div className="flex justify-between">
                            <span className="text-zinc-400 font-mono" style={{ fontSize: '11px' }}>
                                {label}
                            </span>
                            <span className="text-amber-300 font-mono font-bold" style={{ fontSize: '11px' }}>
                                {val.toFixed(2)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={val}
                            onChange={(e) => set(parseFloat(e.target.value))}
                            className="w-full h-1 appearance-none rounded-full bg-zinc-700 accent-amber-500 cursor-pointer"
                        />
                    </label>
                ))}
                <div className="flex items-center gap-4 pt-1">
                    <div className="rounded-lg border border-zinc-700 flex-shrink-0" style={{ width: 56, height: 56, background: `rgb(${r},${g},${b})` }} />
                    <div className="font-mono text-zinc-400" style={{ fontSize: '12px' }}>
                        <div>
                            blend = <span className="text-amber-300">{blend.toFixed(2)}</span> <span className="text-zinc-600">(= |light − 0.5| × 2)</span>
                        </div>
                        <div>
                            mixed = <span className="text-amber-300">{mixed.toFixed(2)}</span> <span className="text-zinc-600">(lerp land→light by blend)</span>
                        </div>
                        <div>
                            palette[<span className="text-amber-300">{idx}</span> / {palette.length - 1}] →{' '}
                            <span style={{ color: `rgb(${r},${g},${b})` }}>
                                rgb({r},{g},{b})
                            </span>
                        </div>
                    </div>
                </div>
                <div className="rounded-md overflow-hidden h-3 flex">
                    {palette.map(([pr, pg, pb], i) => (
                        <div key={i} className="flex-1 relative" style={{ background: `rgb(${pr},${pg},${pb})` }}>
                            {i === idx && <div className="absolute inset-y-0 inset-x-0 ring-2 ring-white/60 ring-inset" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArtSagebrushLearnPage() {
    return (
        <div className="min-h-screen bg-[#0f0e0c] text-zinc-200" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* Hero */}
            <div className="relative border-b border-zinc-800/60 overflow-hidden" style={NOISE_BG}>
                <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
                    <FadeIn>
                        <div className="flex items-center gap-3 mb-6">
                            <TransitionLink href="/art-sagebrush" className="text-zinc-500 hover:text-amber-400 transition-colors font-mono" style={{ fontSize: '12px' }}>
                                ← art-sagebrush
                            </TransitionLink>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            <Tag>Generative Art</Tag>
                            <Tag>Canvas 2D</Tag>
                            <Tag>Terrain</Tag>
                            <Tag>Physics</Tag>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-100 mb-5 leading-tight">
                            How generative
                            <br />
                            landscapes are made
                        </h1>
                        <p className="text-zinc-400 leading-relaxed text-lg max-w-2xl">
                            A complete guide to the ten techniques behind the eucalyptus-and-sagebrush piece — from seeded randomness and terrain erosion to the physics-based pen that draws every
                            stroke.
                        </p>
                    </FadeIn>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 pb-32">
                {/* ── Step 1: Seeded RNG ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={1} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Seeded Deterministic Randomness</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                Every element in the piece — terrain shape, plant placement, palette — is controlled by two integer seeds. The same seeds always produce identical output, while
                                different seeds produce completely different artworks.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <p className="text-zinc-400 leading-relaxed mb-5">
                        JavaScript&apos;s <Pill>Math.random()</Pill> is not seedable. Instead, the piece uses <strong className="text-zinc-200">cyrb128</strong> (a fast non-cryptographic hash) to
                        derive four 32-bit integers from a seed string, then feeds them into <strong className="text-zinc-200">sfc32</strong> — a small-state counter-based generator that passes
                        statistical tests and runs extremely fast.
                    </p>

                    <CodeBlock lang="typescript">{`// Hash the seed string into 4 independent 32-bit integers
function cyrb128(str: string): [number, number, number, number] {
  let h1=1779033703, h2=3144134277, h3=1013904242, h4=2773480762;
  for (let i=0; i<str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    // ... h3, h4 ...
  }
  // Final mixing rounds
  return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

// sfc32: stateful generator, returns float in [0, 1)
function makeSfc32(a: number, b: number, c: number, d: number) {
  return () => {
    a>>>=0; b>>>=0; c>>>=0; d>>>=0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21 | c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

// Usage: two independent RNG streams from two seeds
const rng   = makeSfc32(...cyrb128(String(rngSeed)));   // positions, decisions
const noise = makeNoise(noiseSeed);                       // terrain shape`}</CodeBlock>

                    <div className="mt-5">
                        <Callout variant="tip">
                            Two separate seeds are used — one for the <strong>random placement decisions</strong> (position, size, which palette) and one for the <strong>noise field</strong> (terrain
                            shape). Decoupling them lets you change the terrain without altering plant density or palette.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 2: Perlin Noise ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={2} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Perlin Gradient Noise</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                Unlike white noise (each pixel fully independent), Perlin noise returns values that vary <em>smoothly</em> across space — essential for terrain that looks like a
                                continuous surface rather than static.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <p className="text-zinc-400 leading-relaxed mb-5">
                        The algorithm divides space into an integer grid, assigns a pseudo-random <em>gradient vector</em> to each corner (from a seeded permutation table), then interpolates using the
                        smooth <Pill>fade</Pill> polynomial <Pill>6t⁵ − 15t⁴ + 10t³</Pill>.
                    </p>

                    <CodeBlock lang="typescript" highlight={['fade', 'perm', 'lerp']}>{`function makeNoise(seed: number) {
  // Build seeded permutation table
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];    // Fisher-Yates shuffle
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  // Smooth interpolation curve — removes grid artifacts
  const fade = (t: number) => t*t*t*(t*(t*6-15)+10);

  return (x: number, y = 0, z = 0): number => {
    const X = Math.floor(x) & 255;  // integer grid cell
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);             // fractional position in cell
    y -= Math.floor(y);

    const u = fade(x), v = fade(y);

    // Dot products at four corners, bilinearly interpolated
    const A = perm[X]+Y, B = perm[X+1]+Y;
    const n = lerp(
      lerp(grad(perm[A],   x,   y), grad(perm[B],   x-1, y), u),
      lerp(grad(perm[A+1], x, y-1), grad(perm[B+1], x-1, y-1), u), v
    );
    return (n + 1) * 0.5;   // remap to [0, 1]
  };
}`}</CodeBlock>

                    <div className="mt-5">
                        <Callout variant="info">
                            The 3D version (used in the sketch) takes a third <Pill>z</Pill> coordinate — sampling different z values is like slicing through a 3D noise volume. With a small random z
                            offset per shape, no two shapes ever see exactly the same noise, adding variety without a second noise call.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 3: fBm + Domain Warping ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={3} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">fBm & Domain Warping</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                A single octave of Perlin noise looks too smooth. Layering octaves at increasing frequencies and decreasing amplitudes — <em>fractional Brownian motion</em> — gives the
                                multi-scale detail of real terrain.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript">{`// fBm: sum octaves with half amplitude each time
function fbm(x: number, y: number): number {
  return noise(x * freq)         * 1.0    // large hills
       + noise(x * freq * 2)     * 0.5    // medium detail
       + noise(x * freq * 4)     * 0.25;  // fine texture
  // normalize: / 1.75
}

// Domain warping: warp the input coordinates with another noise call
const wx = noise(x * freq * 2 + 100, y * freq * 2 + 100);
const wy = noise(x * freq * 2 + 200, y * freq * 2 + 200);
const warpedX = x + Math.cos(wx * TAU) * warpStrength;
const warpedY = y + Math.sin(wy * TAU) * warpStrength;
const ns = fbm(warpedX, warpedY);  // sample at warped coordinates`}</CodeBlock>

                    <div className="mt-5 mb-6">
                        <NoiseWarpDemo />
                    </div>
                    <Callout variant="tip">
                        Domain warping is the key to organic-looking terrain. Without it, fBm looks like rolling hills. With it, the noise folds on itself to create curling ridges, overhangs, and the
                        distinctive cliff-like ledges of the sagebrush landscape.
                    </Callout>
                </FadeIn>

                {/* ── Step 4: Height Map ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={4} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Height Map Generation</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                The terrain is represented as a 100 × 100 grid of floating-point heights. Each cell stores a value that controls both the <em>visual height</em> of shapes drawn there
                                and the local terrain <em>slope</em> used for plant placement.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript">{`// For each map cell (i, j):
let nx = 0;
for (const [amplitude, frequency] of noiseLayers) {
  nx += norm(sNoise.noise2D(                // simplex noise → [−1, 1]
    i * NOISE_SCALE * frequency,
    j * NOISE_SCALE * frequency
  ), -1, 1) * amplitude;                    // accumulate weighted octaves
}

// Quantise slightly (floor to 5 decimals) → subtle posterisation
let ns = floor(pow(nx / totalAmplitude, 1), 0, 1);
ns = floor(ns * 100000) / 100000;

// Compress near the top of the map (j → 0) to create horizon flatness
ns *= TAU * 2 * map(j, 0, mapH, 1.0, 0.5);

// Convert height to canvas y — this is where terrainHt creates the cliff
const y = map(j, 0, mapH, 0, targetSz) + map(ns, 0, 2*TAU, 0, 1) * terrainHt;`}</CodeBlock>

                    <div className="mt-5">
                        <Callout variant="info">
                            <strong>terrainHt</strong> is negative (−80 px), so higher ns values push shapes <em>upward</em> on screen, creating the illusion of hills towering above a flat valley. The
                            effect is purely 2D — no perspective projection involved.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 5: Hydraulic Erosion ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={5} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Hydraulic Erosion</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                Raw noise terrain looks too soft. Hydraulic erosion simulates 40,000 raindrops, each sliding downhill, carving gullies and depositing sediment in flat areas. The result
                                is the sharp ridges and alluvial fans that make the landscape feel geological.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['gravity', 'sediment', 'deposit', 'erode']}>{`// One raindrop simulation:
let { px, py } = randomStartPosition();
let direction = { x: 0, y: 0 };
let speed = 0, water = 1, sediment = 0;

for (let step = 0; step < 60; step++) {
  const [gradX, gradY, height] = calcHeightAndGradient(map, px, py);

  // Blend momentum with downhill gradient
  direction.x = direction.x * inertia - gradX * (1 - inertia);
  direction.y = direction.y * inertia - gradY * (1 - inertia);
  direction.normalize();

  px += direction.x;
  py += direction.y;

  const newHeight = getHeight(map, px, py);
  const deltaHeight = newHeight - height;

  const capacity = max(-deltaHeight * speed * water * sedCapacityFactor, minCapacity);

  if (sediment > capacity || deltaHeight > 0) {
    // Uphill or overloaded → deposit sediment
    const deposit = deltaHeight > 0 ? min(deltaHeight, sediment)
                                    : (sediment - capacity) * depositSpeed;
    map[nx][ny] += deposit;      // raise terrain at deposit site
    sediment    -= deposit;
  } else {
    // Downhill with capacity → erode
    const erodeAmount = min((capacity - sediment) * erodeSpeed, -deltaHeight);
    map[nx][ny] -= erodeAmount;   // lower terrain
    sediment    += erodeAmount;
  }

  speed = sqrt(speed² + |deltaHeight| * gravity);
  water *= (1 - evaporation);
}`}</CodeBlock>

                    <div className="mt-5 mb-6">
                        <ErosionDemo />
                    </div>
                    <Callout variant="warn">
                        The erosion step is the most computationally expensive part of setup — 4 passes × 10,000 drops each. On a modern machine this takes ~1–2 seconds synchronously. In production
                        you could move it to a <strong>Web Worker</strong> to keep the main thread free.
                    </Callout>
                </FadeIn>

                {/* ── Step 6: Surface Normals + Lighting ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={6} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Surface Normals & Directional Lighting</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                Slopes facing the light source receive brighter colors; slopes facing away get darker. The slope is computed by comparing each cell&apos;s height to its neighbors — a
                                discrete approximation of the gradient.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['dot', 'lgt', 'normal']}>{`// Light direction as a unit vector (fixed at −60° from horizontal)
const lightAngle = -PI / 2 + direction * PI / 3;
const lgt = normalize({ x: cos(lightAngle), y: sin(lightAngle) });

// Terrain normal = local slope vector at cell (i, j)
function hMapNormal(hMap, i, j): Vec {
  const di = i === mapW - 1 ? -1 : 1;          // handle edge
  const dj = j === mapH - 1 ? -1 : 1;
  return {
    x: (hMap[i + di][j] - hMap[i][j]) * di,    // slope in X
    y: (hMap[i][j + dj] - hMap[i][j]) * dj,    // slope in Y
  };
}

// Light value: dot product of normalized normal with light direction
const normal    = normalize(hMapNormal(hMap, i, j));
const lightValue = norm(dot(normal, lgt), -1, 1);  // remap to [0, 1]

// Build a light map for tree shadow stamping:
lMap[i][j] = dot(normal, lgt);
// ... later, when a tree is placed at (i,j):
for (shadow cells around tree) {
  lMap[si][sj] = lerp(lMap[si][sj], -1, 0.7);  // darken shadow cells
}`}</CodeBlock>

                    <div className="mt-5">
                        <Callout variant="tip">
                            The light map is computed once after the height map is ready, then shadows from trees are stamped into it during shape generation — before any drawing happens. This
                            decouples terrain generation from the rendering pass entirely.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 7: Palette Mapping ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={7} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Color Palette Mapping</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                Instead of continuous gradients, colors are picked from a small discrete palette — giving the artwork a hand-crafted, illustrative quality. A blend factor derived from
                                the lighting value decides how much terrain color vs light color to use.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript" highlight={['blend', 'paletteColor', 'lerp']}>{`// paletteColor: quantised lookup — maps [0,1] → palette[i]
function paletteColor(br: number): Color {
  const idx = constrain(floor(br * palette.length), 0, palette.length - 1);
  return palette[idx];
}

// For each terrain scribble:
const lightValue = norm(dotProduct, -1, 1);          // 0=dark slope, 1=bright slope
const landValue  = noise(i * 0.04 + 1000, j * 0.04 + 1000); // base terrain color

// How strongly to bias toward light vs land color?
// Extremes (near-black or near-white slopes) → pure lighting
// Mid-range slopes → mix more terrain color
const blend = constrain(abs(lightValue - 0.5) * 2 + random(-0.1, 0.1), 0, 1);

const colorValue = lerp(landValue, lightValue, blend);
const c = paletteColor(colorValue);

// Alpha 64/255 ≈ 25% — hundreds of overlapping semi-transparent
// strokes build up to the final tone (like hatching with ink)
scribble.setColor([c.r, c.g, c.b, 64]);`}</CodeBlock>

                    <div className="mt-5 mb-6">
                        <PaletteDemo />
                    </div>
                    <Callout variant="tip">
                        The <strong>blend</strong> value peaks when <Pill>lightValue</Pill> is near 0 or 1 (extreme slopes) and is zero when it is 0.5 (flat). This keeps the artistic texture visible
                        on mid-toned slopes, while letting the dramatic lighting fully take over on steep faces.
                    </Callout>
                </FadeIn>

                {/* ── Step 8: Sketchy Pen Physics ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={8} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Physics-Based Pen Simulation</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                Every stroke — ellipses, trunks, branches — is drawn by a simulated pen that chases a sequence of target points with Newtonian velocity and damping. The wobble term
                                keeps it from moving in perfect straight lines.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <p className="text-zinc-400 leading-relaxed mb-5">
                        Each shape pre-computes a list of <em>hatch points</em>: for an ellipse these are the top/bottom intercepts of equally spaced vertical slices; for a weighted line they zigzag
                        across the rectangle width. The pen then visits them in order.
                    </p>

                    <CodeBlock lang="typescript" highlight={['penV', 'acc', 'wobble', '0.8', 'fillRect']}>{`// Called once per animation-frame iteration (2000× per frame)
update(ctx: CanvasRenderingContext2D): 'done' | 'continue' {
  ctx.save();
  ctx.translate(this.x, this.y);  // move to shape center
  ctx.rotate(this.angle);         // apply shape rotation

  const target = this.points[this.penTargetIndex];

  // Spring force toward current target
  this.penV.x += (target.x - this.pen.x) * this.acc;
  this.penV.y += (target.y - this.pen.y) * this.acc;

  // Noise wobble — random jitter in a random direction each step
  const wobbleAngle = random() * TAU;
  this.penV.x += cos(wobbleAngle) * this.wobble;
  this.penV.y += sin(wobbleAngle) * this.wobble;

  // Damping — exponential decay prevents infinite oscillation
  this.penV.x *= 0.8;
  this.penV.y *= 0.8;

  // Speed clamp
  const speed = mag(this.penV);
  if (speed > this.maxV) { scale(this.penV, this.maxV / speed); }

  this.pen.x += this.penV.x;
  this.pen.y += this.penV.y;

  // Advance to next target when pen gets close enough
  if (distSq(this.pen, target) < 9) this.penTargetIndex++;
  if (this.penTargetIndex >= this.points.length) return 'done';

  // Draw scattered dots — the ink accumulates into visible strokes
  const spread = sqrt(random()) * map(noise(lineLen*0.001), 0,1, 0.5,1) * this.wt / 2;
  const dotAngle = random() * TAU;
  ctx.fillStyle = colorToCSS(this.c);                 // semi-transparent color
  ctx.fillRect(pen.x + cos(dotAngle)*spread, pen.y + sin(dotAngle)*spread, 1, 1);

  ctx.restore();
  return 'continue';
}`}</CodeBlock>

                    <div className="mt-5 mb-6">
                        <PenPhysicsDemo />
                    </div>
                    <Callout variant="tip">
                        The key insight: drawing 1 × 1 px rectangles instead of stroked paths is dramatically faster and enables the soft, accumulated-ink look. Each update call draws just one dot; it
                        takes hundreds of iterations for a shape to become fully visible.
                    </Callout>
                </FadeIn>

                {/* ── Step 9: Painter&apos;s Algorithm ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={9} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Painter&apos;s Algorithm & Depth Sorting</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                Nearer objects must be drawn on top of farther ones. Since Canvas 2D has no depth buffer, shapes are sorted once by their <Pill>z</Pill> value before rendering begins,
                                then drawn back-to-front.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript">{`// z is assigned during shape creation:
// terrain scribbles → z = y  (closer to bottom = closer to viewer)
// trees/bushes      → z = y − 10  (placed slightly behind their ground tile)

// Sort: highest z last (shapes array is drawn from end → start by pop())
shapes.sort((a, b) => b.z - a.z);
// shapes[last] = smallest z = furthest background → drawn first

// Draw loop: pop() removes the last element (smallest z remaining = background)
function drawFrame() {
  for (let i = 0; i < 2000; i++) {
    const shape = shapes[shapes.length - 1];
    const done  = shape.update(ctx, noise, rng);
    if (done === 'done') shapes.pop();   // finished → remove, next frame draws next
    if (shapes.length === 0) break;
  }
  requestAnimationFrame(drawFrame);
}`}</CodeBlock>

                    <div className="mt-5">
                        <Callout variant="info">
                            Using a <Pill>z = y + offset</Pill> convention means objects at the same screen height appear at the same depth — exactly what isometric-looking 2D landscapes need. The
                            small offset for trees ensures a tree&apos;s trunk base aligns with the terrain scribble beneath it.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Step 10: Progressive Rendering ── */}
                <SectionRule />
                <FadeIn>
                    <div className="flex items-start gap-4 mb-8">
                        <StepBadge n={10} />
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-100">Progressive Rendering</h2>
                            <p className="text-zinc-400 mt-2 leading-relaxed">
                                With tens of thousands of shapes — each requiring many pen iterations to complete — rendering the whole piece in one synchronous loop would block the browser for tens
                                of seconds. Instead, the draw loop processes a fixed budget per animation frame.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.05}>
                    <CodeBlock lang="typescript">{`// 2000 shape-update steps per frame ≈ 16ms budget on a modern machine
const STEPS_PER_FRAME = 2000;

function drawFrame() {
  ctx.save();

  // Apply the same transform every frame — shapes draw in local coordinates
  const sf = SCL * (canvasSize / TARGET_SZ);
  ctx.scale(sf, sf);
  ctx.translate(
    canvasSize / (2 * sf) - TARGET_SZ / 2,   // center horizontally
    canvasSize / (2 * sf) - (maxY - minY) / 2 - minY  // center terrain vertically
  );

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    if (shapes.length === 0) { noLoop(); break; }

    const shape  = shapes[shapes.length - 1];
    const result = shape.update(ctx, noise, rng);

    if (result === 'done') shapes.pop();
  }

  ctx.restore();
  requestAnimationFrame(drawFrame);   // schedule next frame
}`}</CodeBlock>

                    <div className="mt-5">
                        <Callout variant="tip">
                            The canvas is never cleared between frames — each frame adds more dots on top of what is already there. This is what makes the image <em>emerge</em> progressively rather
                            than flickering. The paper background color is painted once at the very start.
                        </Callout>
                    </div>
                </FadeIn>

                {/* ── Summary ── */}
                <SectionRule />
                <FadeIn>
                    <h2 className="text-2xl font-bold text-zinc-100 mb-6">The Full Pipeline</h2>
                    <div className="space-y-2.5">
                        {[
                            [
                                'Setup (once)',
                                [
                                    ['Seeds → RNG + noise functions', 'Deterministic randomness'],
                                    ['Simplex fBm → 100×100 height map', 'Terrain shape'],
                                    ['40,000 raindrop erosion passes', 'Geological realism'],
                                    ['Height map gradient → light map', 'Directional shading'],
                                    ['8,000 scribbles + trees/bushes generated', 'Shape list creation'],
                                    ['Sort shapes by z descending', "Painter's algorithm prep"],
                                ],
                            ],
                            [
                                'Per-frame (requestAnimationFrame)',
                                [
                                    ['2,000 × shape.update(ctx)', 'Dot accumulation'],
                                    ['Semi-transparent 1×1 px fillRect calls', 'Ink-like rendering'],
                                    ['Shapes popped when all targets reached', 'Progressive completion'],
                                ],
                            ],
                        ].map(([phase, steps]) => (
                            <div key={String(phase)} className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-zinc-800/70 bg-zinc-800/30">
                                    <span className="font-mono text-amber-400 font-bold" style={{ fontSize: '12px' }}>
                                        {String(phase)}
                                    </span>
                                </div>
                                <div className="divide-y divide-zinc-800/40">
                                    {(steps as [string, string][]).map(([code, desc]) => (
                                        <div key={code} className="px-4 py-2.5 flex items-baseline gap-3">
                                            <Pill>{code}</Pill>
                                            <span className="text-zinc-500" style={{ fontSize: '13px' }}>
                                                {desc}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="mt-12 flex gap-4 flex-wrap">
                        <TransitionLink
                            href="/art-sagebrush"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors font-mono"
                            style={{ fontSize: '13px' }}
                        >
                            ← View the artwork
                        </TransitionLink>
                        <TransitionLink
                            href="/omma-3d-cubes/learn"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors font-mono"
                            style={{ fontSize: '13px' }}
                        >
                            3D cubes guide →
                        </TransitionLink>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
