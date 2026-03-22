'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { CodeBlock } from '@/components/code-block';
import { E_OUT, FadeIn, NOISE_BG } from '@/components/fade-in';
import { cn } from '@/utils/cn';

// ─── Shared UI primitives ────────────────────────────────────────────────────

function SectionNum({ n }: { n: string }) {
    return (
        <span
            className="absolute -top-8 -left-2 font-black leading-none select-none pointer-events-none"
            style={{ color: 'rgba(99,102,241,0.05)', fontVariantNumeric: 'tabular-nums', fontSize: '144px' }}
        >
            {n}
        </span>
    );
}

function Tag({ children, variant = 'indigo' }: { children: React.ReactNode; variant?: 'indigo' | 'green' | 'rose' | 'zinc' | 'sky' | 'amber' | 'violet' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded font-mono tracking-wider uppercase border',
                variant === 'indigo' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                variant === 'green' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                variant === 'rose' && 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                variant === 'zinc' && 'bg-zinc-700/30 text-zinc-400 border-zinc-700/40',
                variant === 'sky' && 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                variant === 'amber' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                variant === 'violet' && 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            )}
            style={{ fontSize: '10px' }}
        >
            {children}
        </span>
    );
}

function Callout({ children, variant = 'indigo' }: { children: React.ReactNode; variant?: 'indigo' | 'amber' | 'green' }) {
    return (
        <div
            className={cn(
                'rounded-xl border px-6 py-5 leading-relaxed',
                variant === 'indigo' && 'bg-indigo-500/5 border-indigo-500/20 text-indigo-200/90',
                variant === 'amber' && 'bg-amber-500/5 border-amber-500/20 text-amber-200/90',
                variant === 'green' && 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90',
            )}
            style={{ fontSize: '15px' }}
        >
            {children}
        </div>
    );
}

function Slider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    color = '#6366f1',
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    color?: string;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-zinc-400">{label}</span>
                <span className="font-mono text-xs" style={{ color }}>
                    {value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: color, background: '#3f3f46' }}
            />
        </div>
    );
}

function ExperimentCard({ n, title, description, tags }: { n: number; title: string; description: string; tags: string[] }) {
    return (
        <Link href={`/r3f-experimental/${n}`} className="group block">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all duration-300 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/5">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-indigo-400 font-mono font-bold" style={{ fontSize: '13px' }}>
                        0{n}
                    </span>
                    <h3 className="font-bold text-white" style={{ fontSize: '17px' }}>
                        {title}
                    </h3>
                </div>
                <p className="text-zinc-400 mb-4 leading-relaxed" style={{ fontSize: '14px' }}>
                    {description}
                </p>
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Tag key={tag} variant="zinc">
                            {tag}
                        </Tag>
                    ))}
                </div>
            </div>
        </Link>
    );
}

function PerfCard({ n, title, bad, good, why }: { n: string; title: string; bad: string; good: string; why: string }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-indigo-400 font-mono font-bold" style={{ fontSize: '13px' }}>
                    {n}
                </span>
                <h4 className="font-bold text-white" style={{ fontSize: '16px' }}>
                    {title}
                </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 px-4 py-3">
                    <span className="text-rose-400 font-mono font-bold block mb-1" style={{ fontSize: '10px' }}>
                        AVOID
                    </span>
                    <p className="text-zinc-400" style={{ fontSize: '13px' }}>
                        {bad}
                    </p>
                </div>
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
                    <span className="text-emerald-400 font-mono font-bold block mb-1" style={{ fontSize: '10px' }}>
                        PREFER
                    </span>
                    <p className="text-zinc-400" style={{ fontSize: '13px' }}>
                        {good}
                    </p>
                </div>
            </div>
            <p className="text-zinc-500 leading-relaxed" style={{ fontSize: '13px' }}>
                <strong className="text-zinc-400">Why:</strong> {why}
            </p>
        </div>
    );
}

// ─── Interactive Visualizers ─────────────────────────────────────────────────

/** Shows how segment count affects displacement smoothness */
function SegmentViz() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [segCount, setSegCount] = useState(4);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#0c0c10';
        ctx.fillRect(0, 0, W, H);

        const PANELS = [2, segCount, 16];
        const panelW = W / 3 - 12;
        const panelH = H - 60;
        const strength = 0.6;
        const frequency = 0.5;

        PANELS.forEach((segs, pIdx) => {
            const offsetX = pIdx * (W / 3) + 8;
            const offsetY = 28;

            // Panel bg
            ctx.fillStyle = '#111118';
            ctx.beginPath();
            ctx.roundRect(offsetX, offsetY, panelW, panelH, 8);
            ctx.fill();
            ctx.strokeStyle = pIdx === 2 ? '#6366f1' : '#27272a';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label
            ctx.fillStyle = pIdx === 2 ? '#818cf8' : '#52525b';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${segs}×${segs} segs`, offsetX + panelW / 2, offsetY - 6);

            const N = segs;
            const _cellW = panelW / (N + 1);
            const _cellH = panelH / (N + 1);

            // Draw vertices with displacement applied
            for (let row = 0; row <= N; row++) {
                for (let col = 0; col <= N; col++) {
                    const nx = col / N; // uv x 0-1
                    const ny = row / N; // uv y 0-1
                    const worldY = (ny - 0.5) * 4; // ~world space
                    const xDisp = strength * Math.cos(worldY * frequency * Math.PI * 2) - strength;

                    const px = offsetX + (nx * panelW * 0.8 + panelW * 0.1) + xDisp * 20;
                    const py = offsetY + ny * panelH * 0.9 + panelH * 0.05;

                    // Draw edges
                    if (col < N) {
                        const nx2 = (col + 1) / N;
                        const worldY2 = (ny - 0.5) * 4;
                        const xDisp2 = strength * Math.cos(worldY2 * frequency * Math.PI * 2) - strength;
                        const px2 = offsetX + (nx2 * panelW * 0.8 + panelW * 0.1) + xDisp2 * 20;
                        const py2 = offsetY + ny * panelH * 0.9 + panelH * 0.05;
                        ctx.strokeStyle = pIdx === 2 ? 'rgba(99,102,241,0.35)' : 'rgba(63,63,70,0.8)';
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px2, py2);
                        ctx.stroke();
                    }
                    if (row < N) {
                        const ny2 = (row + 1) / N;
                        const worldY3 = (ny2 - 0.5) * 4;
                        const xDisp3 = strength * Math.cos(worldY3 * frequency * Math.PI * 2) - strength;
                        const px3 = offsetX + (nx * panelW * 0.8 + panelW * 0.1) + xDisp3 * 20;
                        const py3 = offsetY + ny2 * panelH * 0.9 + panelH * 0.05;
                        ctx.strokeStyle = pIdx === 2 ? 'rgba(99,102,241,0.35)' : 'rgba(63,63,70,0.8)';
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px3, py3);
                        ctx.stroke();
                    }

                    // Dot
                    ctx.fillStyle = pIdx === 2 ? '#6366f1' : '#3f3f46';
                    ctx.beginPath();
                    ctx.arc(px, py, pIdx === 2 ? 2 : 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // Bottom label
        ctx.fillStyle = '#52525b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('fewer segments = jagged curve', W / 6, H - 6);
        ctx.fillStyle = '#818cf8';
        ctx.fillText('16×16 = smooth', (W * 5) / 6, H - 6);
    }, [segCount]);

    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <canvas ref={canvasRef} width={540} height={300} className="w-full" style={{ display: 'block' }} />
            <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center gap-6">
                <div className="flex-1">
                    <Slider label="middle panel segments" value={segCount} min={1} max={15} step={1} onChange={setSegCount} />
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px]">Drag to see how subdivision count affects curve smoothness. Left = 2 segs (jagged). Right = 16 segs (smooth).</p>
            </div>
        </div>
    );
}

/** Shows the cosine X-displacement curve with live sliders */
function CurveViz() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strength, setStrength] = useState(0.8);
    const [frequency, setFrequency] = useState(0.4);

    const ITEM_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#22d3ee', '#06b6d4', '#34d399', '#10b981', '#f59e0b', '#f97316', '#f43f5e'];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        ctx.fillStyle = '#0c0c10';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = '#1c1c24';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Center vertical line (original axis)
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 20);
        ctx.lineTo(W / 2, H - 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label: "center axis"
        ctx.fillStyle = '#52525b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('center axis', W / 2, H - 8);

        const N = 10;
        const cardH = (H * 0.82) / N;
        const cardW = cardH * 0.72;
        const startY = H * 0.09;

        for (let i = 0; i < N; i++) {
            const y = startY + i * cardH;
            // worldY: map card center to world space (-2 to 2)
            const worldY = (i / (N - 1) - 0.5) * 4;
            // Shader formula: x += strength * cos(worldY * frequency) - strength
            const xDisp = strength * Math.cos(worldY * frequency * Math.PI * 2) - strength;
            const scale = 50;
            const cx = W / 2 + xDisp * scale;

            // Ghost (original)
            ctx.fillStyle = 'rgba(39,39,42,0.7)';
            ctx.strokeStyle = '#3f3f46';
            ctx.lineWidth = 0.8;
            ctx.fillRect(W / 2 - cardW / 2, y, cardW, cardH * 0.87);
            ctx.strokeRect(W / 2 - cardW / 2, y, cardW, cardH * 0.87);

            // Arrow from center to displaced
            const midY = y + cardH * 0.43;
            ctx.strokeStyle = ITEM_COLORS[i] + '55';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(W / 2, midY);
            ctx.lineTo(cx, midY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Displaced card
            ctx.fillStyle = ITEM_COLORS[i] + 'bb';
            ctx.strokeStyle = ITEM_COLORS[i];
            ctx.lineWidth = 1;
            ctx.fillRect(cx - cardW / 2, y, cardW, cardH * 0.87);
            ctx.strokeRect(cx - cardW / 2, y, cardW, cardH * 0.87);

            // Index
            ctx.fillStyle = '#0c0c10';
            ctx.font = `bold ${Math.max(8, cardH * 0.28)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(String(i), cx, y + cardH * 0.55);
        }

        // Legend
        ctx.fillStyle = '#52525b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('░ ghost = no displacement', 8, H - 8);
        ctx.fillStyle = '#818cf8';
        ctx.fillText('■ colored = displaced', W / 2 + 4, H - 8);
    }, [strength, frequency, ITEM_COLORS]);

    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <canvas ref={canvasRef} width={480} height={430} className="w-full" style={{ display: 'block' }} />
            <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/40 space-y-3">
                <Slider label="curveStrength" value={strength} min={-1.5} max={1.5} step={0.05} onChange={setStrength} />
                <Slider label="curveFrequency" value={frequency} min={0} max={2} step={0.05} onChange={setFrequency} color="#22d3ee" />
                <p className="text-zinc-600 text-xs">Ghost boxes = original positions. Colored = after displacement. Notice: strength=0 → no movement; frequency=0 → all shift equally (no wave).</p>
            </div>
        </div>
    );
}

/** Shows the scroll-driven sine wave distortion on a plane */
function WaveViz() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scrollSpeed, setScrollSpeed] = useState(0.4);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        ctx.fillStyle = '#0c0c10';
        ctx.fillRect(0, 0, W, H);

        const ROWS = 6;
        const COLS = 24;
        const marginX = 40;
        const marginY = 40;
        const planeW = W - marginX * 2;
        const planeH = H - marginY * 2;

        // Draw the original ghost plane
        for (let row = 0; row <= ROWS; row++) {
            const y0 = marginY + (row / ROWS) * planeH;
            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(marginX, y0);
            ctx.lineTo(marginX + planeW, y0);
            ctx.stroke();
        }
        for (let col = 0; col <= COLS; col++) {
            const x0 = marginX + (col / COLS) * planeW;
            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x0, marginY);
            ctx.lineTo(x0, marginY + planeH);
            ctx.stroke();
        }

        // Draw displaced mesh (rows are horizontal lines)
        const PI = Math.PI;
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5;

        for (let row = 0; row <= ROWS; row++) {
            const uy = row / ROWS; // 0 to 1
            ctx.beginPath();
            for (let col = 0; col <= COLS; col++) {
                const ux = col / COLS; // uv.x = 0 to 1
                const xCanvas = marginX + ux * planeW;
                // Shader: yDisplacement = -sin(uv.x * PI) * uScrollSpeed
                const yDisp = -Math.sin(ux * PI) * scrollSpeed;
                const yCanvas = marginY + uy * planeH + yDisp * 80;

                if (col === 0) ctx.moveTo(xCanvas, yCanvas);
                else ctx.lineTo(xCanvas, yCanvas);
            }
            ctx.stroke();
        }

        // Draw displaced vertical lines
        ctx.strokeStyle = 'rgba(99,102,241,0.3)';
        ctx.lineWidth = 0.8;
        for (let col = 0; col <= COLS; col += 3) {
            const ux = col / COLS;
            ctx.beginPath();
            for (let row = 0; row <= ROWS; row++) {
                const xCanvas = marginX + ux * planeW;
                const yDisp = -Math.sin(ux * PI) * scrollSpeed;
                const yCanvas = marginY + (row / ROWS) * planeH + yDisp * 80;
                if (row === 0) ctx.moveTo(xCanvas, yCanvas);
                else ctx.lineTo(xCanvas, yCanvas);
            }
            ctx.stroke();
        }

        // Labels
        ctx.fillStyle = '#52525b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('uv.x = 0', marginX, marginY - 10);
        ctx.fillText('uv.x = 0.5 (peak)', W / 2, marginY - 10);
        ctx.fillText('uv.x = 1', W - marginX, marginY - 10);

        if (scrollSpeed !== 0) {
            ctx.fillStyle = '#818cf8';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(`max displacement = ${(scrollSpeed * 1).toFixed(2)} at center`, W / 2, H - 8);
        } else {
            ctx.fillStyle = '#52525b';
            ctx.font = '11px monospace';
            ctx.fillText('no distortion when scrollSpeed = 0', W / 2, H - 8);
        }
    }, [scrollSpeed]);

    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <canvas ref={canvasRef} width={540} height={260} className="w-full" style={{ display: 'block' }} />
            <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/40 space-y-3">
                <Slider label="uScrollSpeed" value={scrollSpeed} min={-1} max={1} step={0.05} onChange={setScrollSpeed} color="#818cf8" />
                <p className="text-zinc-600 text-xs">The wave peaks at the horizontal center (uv.x = 0.5) where sin is maximum. Edges stay pinned. Negative speed bows up, positive bows down.</p>
            </div>
        </div>
    );
}

/** Shows UV aspect-ratio cover calculation */
function UVViz() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [planeAR, setPlaneAR] = useState(1.0);
    const [imageAR, setImageAR] = useState(1.5);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0c0c10';
        ctx.fillRect(0, 0, W, H);

        // Left half: plane space | Right half: uv space
        const half = W / 2;

        // ── Left: plane rectangle ──
        const maxPlaneW = half * 0.7;
        const maxPlaneH = H * 0.65;
        const planeW = planeAR >= 1 ? maxPlaneW : maxPlaneW * planeAR;
        const planeH = planeAR >= 1 ? maxPlaneW / planeAR : maxPlaneH;
        const planeX = half / 2 - planeW / 2;
        const planeY = H / 2 - planeH / 2;

        ctx.fillStyle = '#1c1c24';
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 1;
        ctx.fillRect(planeX, planeY, planeW, planeH);
        ctx.strokeRect(planeX, planeY, planeW, planeH);

        // Label
        ctx.fillStyle = '#52525b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`PLANE ${planeAR.toFixed(1)}:1`, half / 2, planeY - 8);
        ctx.fillText('mesh scale', half / 2, H - 8);

        // ── Right: UV space with crop rectangle ──
        const uvSize = Math.min(half * 0.7, H * 0.7);
        const uvX = half + half / 2 - uvSize / 2;
        const uvY = H / 2 - uvSize / 2;

        // UV 0-1 square
        ctx.fillStyle = '#1c1c24';
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.fillRect(uvX, uvY, uvSize, uvSize);
        ctx.strokeRect(uvX, uvY, uvSize, uvSize);

        // Compute ratio (same as shader)
        const ratioX = Math.min(planeAR / imageAR, 1.0);
        const ratioY = Math.min(1.0 / planeAR / (1.0 / imageAR), 1.0);

        // UV crop rect
        const cropX = uvX + (1.0 - ratioX) * 0.5 * uvSize;
        const cropY = uvY + (1.0 - ratioY) * 0.5 * uvSize;
        const cropW = ratioX * uvSize;
        const cropH = ratioY * uvSize;

        // Full image rect inside UV square (proportional)
        const imgInUVW = uvSize;
        const imgInUVH = uvSize;
        ctx.fillStyle = 'rgba(34,211,238,0.08)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.fillRect(uvX, uvY, imgInUVW, imgInUVH);
        ctx.strokeRect(uvX, uvY, imgInUVW, imgInUVH);
        ctx.setLineDash([]);

        // Active crop region
        ctx.fillStyle = 'rgba(99,102,241,0.2)';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.fillRect(cropX, cropY, cropW, cropH);
        ctx.strokeRect(cropX, cropY, cropW, cropH);

        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('sampled region', uvX + uvSize / 2, uvY + uvSize + 14);
        ctx.fillStyle = '#06b6d4';
        ctx.fillText(`IMAGE ${imageAR.toFixed(1)}:1`, uvX + uvSize / 2, uvY - 8);

        // Labels
        ctx.fillStyle = '#52525b';
        ctx.font = '10px monospace';
        ctx.fillText('UV space (0→1)', uvX + uvSize / 2, H - 8);

        // Center divider
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(half, 0);
        ctx.lineTo(half, H);
        ctx.stroke();
        ctx.setLineDash([]);
    }, [planeAR, imageAR]);

    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <canvas ref={canvasRef} width={520} height={240} className="w-full" style={{ display: 'block' }} />
            <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/40 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <Slider label="plane aspect ratio" value={planeAR} min={0.3} max={3} step={0.1} onChange={setPlaneAR} />
                    <Slider label="image aspect ratio" value={imageAR} min={0.3} max={3} step={0.1} onChange={setImageAR} color="#22d3ee" />
                </div>
                <p className="text-zinc-600 text-xs">
                    The indigo rectangle shows which UV region gets sampled. When ratios match it fills the whole square; when they differ, it crops like CSS object-fit: cover.
                </p>
            </div>
        </div>
    );
}

/** Animated modulo wrapping visualizer */
function ModWrapViz() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offsetRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const drawRef = useRef<() => void>(() => {});
    const [speed, setSpeed] = useState(1.0);
    const speedRef = useRef(speed);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    function modPositive(n: number, m: number) {
        return ((n % m) + m) % m;
    }

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0c0c10';
        ctx.fillRect(0, 0, W, H);

        const N = 8;
        const cardH = 38;
        const cardW = W * 0.55;
        const gap = 6;
        const totalH = N * (cardH + gap);
        const centerX = W / 2;

        const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#22d3ee', '#06b6d4', '#34d399', '#f59e0b', '#f97316'];

        // Advance offset
        offsetRef.current += speedRef.current * 0.6;

        // Draw viewport indicator
        const viewH = H * 0.7;
        const viewY = H / 2 - viewH / 2;
        ctx.fillStyle = 'rgba(99,102,241,0.04)';
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(centerX - cardW / 2 - 8, viewY, cardW + 16, viewH);
        ctx.setLineDash([]);
        ctx.fillStyle = '#3f3f46';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('visible', centerX - cardW / 2 - 12, viewY + 12);
        ctx.fillText('area', centerX - cardW / 2 - 12, viewY + 22);

        for (let i = 0; i < N; i++) {
            const rawY = i * (cardH + gap) - offsetRef.current;
            // Wrap: mod(rawY + totalH/2, totalH) - totalH/2
            const wrappedY = modPositive(rawY + totalH / 2, totalH) - totalH / 2;
            const cx = H / 2 + wrappedY;

            // Detect teleport (was near bottom, now near top)
            const isTeleporting = rawY < -totalH * 0.4 || rawY > totalH * 0.8;

            ctx.globalAlpha = isTeleporting ? 0.4 : 1;
            ctx.fillStyle = COLORS[i] + (isTeleporting ? '44' : 'cc');
            ctx.strokeStyle = COLORS[i];
            ctx.lineWidth = isTeleporting ? 0.5 : 1;
            ctx.fillRect(centerX - cardW / 2, cx, cardW, cardH);
            ctx.strokeRect(centerX - cardW / 2, cx, cardW, cardH);

            ctx.globalAlpha = isTeleporting ? 0.4 : 1;
            ctx.fillStyle = '#0c0c10';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`img${i + 1}`, centerX, cx + cardH * 0.65);
        }

        ctx.globalAlpha = 1;

        // Bottom info
        ctx.fillStyle = '#52525b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`mod(pos + totalH/2, ${totalH.toFixed(0)}) − totalH/2`, W / 2, H - 8);

        rafRef.current = requestAnimationFrame(drawRef.current);
    }, []);

    useEffect(() => {
        drawRef.current = draw;
    }, [draw]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(drawRef.current);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [draw]);

    return (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <canvas ref={canvasRef} width={320} height={360} className="w-full" style={{ display: 'block' }} />
            <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/40 space-y-3">
                <Slider label="scroll speed" value={speed} min={0} max={4} step={0.1} onChange={setSpeed} color="#34d399" />
                <p className="text-zinc-600 text-xs">Items scroll downward continuously. When a card exits the bottom, the mod() formula teleports it to the top — seamless loop with just 8 images.</p>
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function R3fExperimentalGuidePage() {
    return (
        <main className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none" style={NOISE_BG} />

            <div className="max-w-[1080px] mx-auto">
                <HeroSection />
                <ExperimentsSection />
                <ArchitectureSection />
                <GeometrySection />
                <CurveShaderSection />
                <ScrollWaveSection />
                <FragmentShaderSection />
                <InfiniteLoopSection />
                <ScrollIntegrationSection />
                <CompositionSection />
                <PerformanceSection />
                <ChecklistSection />
            </div>

            <footer className="border-t border-zinc-800/60 px-6 md:px-12 xl:px-24 py-10 text-center text-zinc-600 font-mono" style={{ fontSize: '14px' }}>
                R3F Experimental Carousel Guide · Six experiments, one architecture
            </footer>
        </main>
    );
}

// ─── 1. Hero ─────────────────────────────────────────────────────────────────
function HeroSection() {
    const words = ['R3F', 'Experimental', 'Carousel'];
    return (
        <section className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-12 xl:px-24 pt-32 pb-20">
            <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: E_OUT, delay: 0.1 }}
                className="font-mono tracking-[0.22em] uppercase text-indigo-400/70 mb-6"
                style={{ fontSize: '11px' }}
            >
                WebGL · GLSL Shaders · Smooth Scroll · Infinite Loop
            </motion.p>

            <h1 className="flex flex-wrap gap-x-5 gap-y-2 font-black leading-[0.9] tracking-tight mb-8" style={{ fontSize: 'clamp(48px, 9vw, 120px)' }}>
                {words.map((word, i) => (
                    <motion.span
                        key={word}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: E_OUT, delay: 0.2 + i * 0.1 }}
                        className={i === 0 ? 'text-indigo-400' : 'text-white'}
                    >
                        {word}
                    </motion.span>
                ))}
            </h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: E_OUT, delay: 0.7 }}
                className="text-zinc-400 max-w-2xl leading-relaxed"
                style={{ fontSize: '18px' }}
            >
                A step-by-step breakdown of the techniques that power six scroll-driven infinite carousels — from shared geometry and GLSL vertex displacement to modulo wrapping and Lenis integration.
                Learn by tweaking.
            </motion.p>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: E_OUT, delay: 0.9 }}
                style={{ transformOrigin: 'left' }}
                className="mt-16 h-px bg-gradient-to-r from-indigo-500/40 via-indigo-500/10 to-transparent"
            />
        </section>
    );
}

// ─── 2. Experiments Overview ─────────────────────────────────────────────────
function ExperimentsSection() {
    return (
        <section id="experiments" className="relative px-6 md:px-12 xl:px-24 py-20">
            <SectionNum n="01" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Six Experiments, One Component</h2>
                <p className="text-zinc-400 max-w-2xl mb-10 leading-relaxed" style={{ fontSize: '16px' }}>
                    Every experiment is a different composition of the same <code className="text-indigo-400 font-mono text-sm">{'<Carousel />'}</code> component with different props — no
                    experiment-specific code paths. The architecture is proved by what it produces.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ExperimentCard
                        n={1}
                        title="Parallax Trio"
                        description="Three vertical carousels side by side. Center scrolls at 0.4×, sides at 0.3× and 0.5× in reverse direction. Speed differential alone creates depth."
                        tags={['wheelFactor', 'wheelDirection', 'parallax']}
                    />
                    <ExperimentCard
                        n={2}
                        title="Mixed Aspect Ratios"
                        description="Wide 1.8:0.6 flanks with opposing curves (±1.2). Center portrait 1.6:1 with no curve. Fragment shader aspect-ratio math keeps every image crisp."
                        tags={['imageSize', 'curveStrength', 'aspect-ratio']}
                    />
                    <ExperimentCard
                        n={3}
                        title="Tilted Five-Column"
                        description="Camera rotated 36° (PI/5). Five columns with curveStrength gradient from +0.9 to −0.9. Speed increases left→right for a fan-spread feel."
                        tags={['camera.rotation', 'gradient speed', 'symmetry']}
                    />
                    <ExperimentCard
                        n={4}
                        title="Overlapping Clusters"
                        description="Six tiny 0.3×0.4 carousels at the same origin with individual Z-rotations (PI/5 to PI/9). High curveStrengths up to 1.8 create dense interference patterns."
                        tags={['z-rotation', 'overlap', 'interference']}
                    />
                    <ExperimentCard
                        n={5}
                        title="Horizontal Stacks"
                        description="Three horizontal carousels stacked vertically. direction='horizontal' switches the shader pair — Y curves from X position, X displacement from scroll."
                        tags={['direction="horizontal"', 'curveFrequency', 'axis swap']}
                    />
                    <ExperimentCard
                        n={6}
                        title="Rotated X Pattern"
                        description="Two groups rotated 45° (PI/4). Each has one large carousel flanked by tiny ones with extreme curveStrength=7.5. Group-level rotation creates the X shape."
                        tags={['group rotation', 'extreme curves', 'mirror symmetry']}
                    />
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 3. Architecture ─────────────────────────────────────────────────────────
function ArchitectureSection() {
    return (
        <section id="architecture" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="02" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Architecture — Two Primitives</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The entire system is built from two components and two shader pairs. Everything else is composition.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag variant="indigo">Leaf</Tag>
                                <span className="font-mono font-bold text-white" style={{ fontSize: '15px' }}>
                                    GLImage
                                </span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                A single textured plane. Receives a shared <code className="text-indigo-400 font-mono text-xs">PlaneGeometry</code>, loads one texture via{' '}
                                <code className="text-indigo-400 font-mono text-xs">useTexture</code>, and creates a <code className="text-indigo-400 font-mono text-xs">shaderMaterial</code> with
                                uniforms for scroll speed, curve params, and aspect-ratio correction. Exposed via <code className="text-indigo-400 font-mono text-xs">forwardRef</code> so the parent
                                can mutate position and uniforms directly at 60fps.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag variant="green">Parent</Tag>
                                <span className="font-mono font-bold text-white" style={{ fontSize: '15px' }}>
                                    Carousel
                                </span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                Instantiates 24 <code className="text-emerald-400 font-mono text-xs">GLImage</code> meshes. Owns the animation loop via{' '}
                                <code className="text-emerald-400 font-mono text-xs">useFrame</code> (position wrapping) and <code className="text-emerald-400 font-mono text-xs">useLenis</code>{' '}
                                (scroll-driven movement + shader uniform updates). All variation is props-only — no internal branching per experiment.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag variant="rose">GLSL Pair</Tag>
                                <span className="font-mono font-bold text-white" style={{ fontSize: '15px' }}>
                                    Vertical Shaders
                                </span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                <strong className="text-zinc-200">Vertex:</strong> X displacement from world Y (cosine curve) + Y displacement from scroll (sine wave across UV.x).{' '}
                                <strong className="text-zinc-200">Fragment:</strong> Aspect-ratio-correct UV sampling. Used when{' '}
                                <code className="text-rose-400 font-mono text-xs">direction=&quot;vertical&quot;</code> (default).
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag variant="sky">GLSL Pair</Tag>
                                <span className="font-mono font-bold text-white" style={{ fontSize: '15px' }}>
                                    Horizontal Shaders
                                </span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: '14px' }}>
                                Mirror of the vertical — axes swapped. <strong className="text-zinc-200">Vertex:</strong> Y displacement from world X + X displacement from scroll across UV.y. Same
                                fragment shader. Used when <code className="text-sky-400 font-mono text-xs">direction=&quot;horizontal&quot;</code> (Experiment 5).
                            </p>
                        </div>
                        <Callout>
                            <strong>Insight:</strong> Two components + two shader pairs + props = six visually distinct experiments. Flat by design — no inheritance, no state machines.
                        </Callout>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.15}>
                <h3 className="text-xl font-bold tracking-tight mb-4 text-white">Component Tree</h3>
                <CodeBlock lang="text">{`Canvas (fixed fullscreen)
└─ Suspense fallback={null}
   └─ Carousel (×1–6 per experiment)        props: position, rotation, imageSize, gap,
      └─ <group>                                    wheelFactor, wheelDirection,
         └─ GLImage (×24)                           curveStrength, curveFrequency, direction
            ├─ <primitive object={geometry} />  ← shared PlaneGeometry instance
            └─ <shaderMaterial {...shaderArgs}/> ← unique uniforms per image`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 4. Shared Geometry ──────────────────────────────────────────────────────
function GeometrySection() {
    return (
        <section id="geometry" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="03" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Shared Geometry — One Plane, Many Meshes</h2>
                <p className="text-zinc-400 max-w-2xl mb-6 leading-relaxed" style={{ fontSize: '16px' }}>
                    Every image in every carousel uses the same <code className="text-indigo-400 font-mono text-sm">PlaneGeometry(1, 1, 16, 16)</code>. The segment count (16×16) determines how smooth
                    the vertex displacement curves look. The sharing pattern eliminates 143 redundant GPU buffer uploads.
                </p>
            </FadeIn>

            <FadeIn delay={0.1} className="mb-8">
                <SegmentViz />
            </FadeIn>

            <FadeIn delay={0.15}>
                <CodeBlock lang="tsx" highlight={['useMemo', 'PlaneGeometry', 'primitive']}>{`// Carousel.tsx — geometry created ONCE, shared across all 24 meshes
const planeGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(1, 1, 16, 16); // width, height, widthSegs, heightSegs
}, []);

// Passed down to each GLImage as a prop
<GLImage geometry={planeGeometry} ... />

// GLImage.tsx — attaches without duplicating
<mesh ref={imageRef} scale={[w, h, 1]}>
    <primitive object={geometry} attach="geometry" />  {/* no new geometry */}
    <shaderMaterial {...shaderArgs} />
</mesh>`}</CodeBlock>
            </FadeIn>

            <FadeIn delay={0.2} className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                        <Tag variant="green">Why 1×1 unit size</Tag>
                        <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                            A unit plane scaled by <code className="text-emerald-400 font-mono text-xs">mesh.scale</code> handles any aspect ratio. Vertex positions stay normalized so shader math is
                            predictable — no hardcoded sizes in GLSL.
                        </p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                        <Tag variant="amber">Why 16×16 segments</Tag>
                        <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                            289 vertices per mesh. Enough for smooth cosine wave curves without aliasing. Fewer segments (2×2) produces angular jagged shapes even for gentle curves.
                        </p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                        <Tag variant="rose">Why shared</Tag>
                        <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                            One geometry object = one GPU buffer upload. A 6-carousel experiment without sharing would create 144 separate geometry buffers instead of 6 (one per carousel).
                        </p>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 5. Cosine Curve Shader ───────────────────────────────────────────────────
function CurveShaderSection() {
    return (
        <section id="curve-shader" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="04" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Technique 1 — Cosine Curve Displacement</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The static curve that bends each carousel strip. Three lines of GLSL in the vertex shader produce all the visual variety across experiments 1–4 and 6.
                </p>
            </FadeIn>

            <FadeIn delay={0.05} className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CurveViz />
                    <div className="space-y-5 flex flex-col justify-center">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="indigo">Step 1 — World position</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                Convert local vertex position to world space: <code className="text-indigo-400 font-mono text-xs">(modelMatrix * vec4(position, 1.0)).xyz</code>. This is critical —
                                using local space would mean the curve repeats identically per card instead of flowing continuously across the strip.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="green">Step 2 — Cosine displacement</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                <code className="text-emerald-400 font-mono text-xs">cos(worldY * frequency)</code> produces a repeating wave as you move up the strip. Multiplying by{' '}
                                <code className="text-emerald-400 font-mono text-xs">strength</code> sets the amplitude. Higher frequency = more waves per strip.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="amber">Step 3 — Re-center</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                <code className="text-amber-400 font-mono text-xs">pos.x -= uCurveStrength</code> after adding the cosine keeps the wave symmetric around the original axis. Without it,
                                the carousel drifts sideways as you increase strength.
                            </p>
                        </div>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.1}>
                <h3 className="text-xl font-bold tracking-tight mb-4 text-white">Vertical Vertex Shader — Annotated</h3>
                <CodeBlock lang="glsl" highlight={['worldPosition', 'xDisplacement', 'uCurveStrength', 'uCurveFrequency']}>{`uniform float uScrollSpeed;
uniform float uCurveStrength;
uniform float uCurveFrequency;
varying vec2 vUv;
#define PI 3.141592653

void main() {
  vec3 pos = position;

  // Step 1: world position — so the curve is continuous across all cards
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  // Step 2: cosine wave — X displacement based on where the vertex is on the Y strip
  float xDisplacement = uCurveStrength * cos(worldPosition.y * uCurveFrequency);
  pos.x += xDisplacement;

  // Step 3: re-center — subtract strength so cos(0)=1 doesn't push everything right
  pos.x -= uCurveStrength;

  // Step 4: scroll wave (covered in next section)
  float yDisplacement = -sin(uv.x * PI) * uScrollSpeed;
  pos.y += yDisplacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}`}</CodeBlock>
            </FadeIn>

            <FadeIn delay={0.15} className="mt-6">
                <Callout variant="amber">
                    <strong>Why world space matters:</strong> If you used <code className="font-mono text-amber-300">position.y</code> (local space), every image card would have the same displacement
                    shape — a single cosine cycle from its own bottom to top. Using <code className="font-mono text-amber-300">worldPosition.y</code> means each card gets a <em>different</em> slice of
                    the wave based on where it sits in the scene. That&apos;s what makes the curve flow continuously across the whole strip.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 6. Scroll Wave Shader ────────────────────────────────────────────────────
function ScrollWaveSection() {
    return (
        <section id="scroll-wave" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="05" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Technique 2 — Scroll-Driven Wave Distortion</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    While scrolling, each plane elastically bows in the direction of motion. The effect peaks at the horizontal center and falls to zero at both edges — giving the impression of
                    physical momentum.
                </p>
            </FadeIn>

            <FadeIn delay={0.05} className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WaveViz />
                    <div className="space-y-5 flex flex-col justify-center">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="violet">The sine window</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                <code className="text-violet-400 font-mono text-xs">sin(uv.x * PI)</code> creates a curve that starts at 0 (left edge), peaks at 1 (center, uv.x=0.5), and returns to 0
                                (right edge). This pins both edges while letting the middle flex — exactly how a physical card would react to drag.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="rose">Dynamic uniform</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                <code className="text-rose-400 font-mono text-xs">uScrollSpeed</code> is the only uniform that changes per frame. It&apos;s written directly from the{' '}
                                <code className="text-rose-400 font-mono text-xs">useLenis</code> callback via{' '}
                                <code className="text-rose-400 font-mono text-xs">ref.material.uniforms.uScrollSpeed.value = ...</code>. No React re-render, no allocations.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="sky">Horizontal variant</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                The horizontal shader mirrors the axes: <code className="text-sky-400 font-mono text-xs">sin(uv.y * PI) * uScrollSpeed</code> displaces X instead of Y. Both variants
                                share the same fragment shader.
                            </p>
                        </div>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.1}>
                <CodeBlock lang="glsl" highlight={['yDisplacement', 'uScrollSpeed', 'sin', 'PI']}>{`// Vertical vertex shader — scroll wave portion
// (horizontal shader mirrors: uses uv.y and displaces X instead)

// uScrollSpeed is updated every frame from useLenis({ velocity })
// velocity * 0.005 * wheelFactor * wheelDirection  ← scaling + per-carousel modifiers

float yDisplacement = -sin(uv.x * PI) * uScrollSpeed;
//                     ↑                ↑
//                     window fn        velocity-driven amplitude
//                     peaks at 0.5,    positive = bow down
//                     zero at edges    negative = bow up

pos.y += yDisplacement;`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 7. Fragment Shader / UV Cover ───────────────────────────────────────────
function FragmentShaderSection() {
    return (
        <section id="fragment" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="06" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Technique 3 — Aspect-Ratio Preservation</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    WebGL textures don&apos;t auto-fit like <code className="text-indigo-400 font-mono text-sm">object-fit: cover</code>. The fragment shader manually computes UV coordinates to crop
                    and center the image — the same math as CSS cover, in GLSL.
                </p>
            </FadeIn>

            <FadeIn delay={0.05} className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <UVViz />
                    <div className="space-y-5 flex flex-col justify-center">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="sky">Two uniforms</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                <code className="text-sky-400 font-mono text-xs">uPlaneSizes</code> = the mesh&apos;s <code className="text-sky-400 font-mono text-xs">scale.xy</code> (e.g.{' '}
                                <code className="text-sky-400 font-mono text-xs">vec2(1.8, 0.6)</code>). <code className="text-sky-400 font-mono text-xs">uImageSizes</code> = the actual pixel
                                dimensions of the texture (e.g. <code className="text-sky-400 font-mono text-xs">vec2(1024, 683)</code>). Both passed at mount, never updated.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="indigo">The ratio math</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                Compare plane AR vs image AR. The axis where the plane is proportionally <em>wider</em> fills to 1.0; the other axis shrinks to fit. The{' '}
                                <code className="text-indigo-400 font-mono text-xs">min(..., 1.0)</code> clamp prevents any axis from going above 1 (no stretching).
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="green">Centering</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                <code className="text-emerald-400 font-mono text-xs">(1.0 - ratio) * 0.5</code> offsets the start of the crop to center it. Without this, the crop region would align to
                                the top-left corner.
                            </p>
                        </div>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.1}>
                <CodeBlock lang="glsl" highlight={['ratio', 'uPlaneSizes', 'uImageSizes', 'min']}>{`precision highp float;
uniform sampler2D uTexture;
uniform vec2 uPlaneSizes;  // mesh scale: e.g. vec2(1.8, 0.6)
uniform vec2 uImageSizes;  // texture pixels: e.g. vec2(1024.0, 683.0)
varying vec2 vUv;

void main() {
  // Compare the two aspect ratios
  // If plane is wider than image → scale X down to fit, Y fills fully (ratio.x < 1, ratio.y = 1)
  // If plane is taller than image → scale Y down, X fills fully (ratio.y < 1, ratio.x = 1)
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );

  // Remap UV to the centered crop region
  // ratio=1.0 → no change; ratio<1.0 → shrink and center
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );

  gl_FragColor = texture2D(uTexture, uv);
}`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 8. Infinite Loop ────────────────────────────────────────────────────────
function InfiniteLoopSection() {
    return (
        <section id="infinite" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="07" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Technique 4 — Infinite Modulo Loop</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The carousel appears infinite but only holds 24 images. One modulo operation per frame teleports each image from one end of the strip to the other — invisibly.
                </p>
            </FadeIn>

            <FadeIn delay={0.05} className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-5">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="indigo">Step 1 — Initial layout</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                24 images are placed at <code className="text-indigo-400 font-mono text-xs">y = index * (height + gap)</code> — a strip much taller than the viewport. The total height
                                is <code className="text-indigo-400 font-mono text-xs">24 * (height + gap)</code>.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="green">Step 2 — Scroll moves positions</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                Every <code className="text-emerald-400 font-mono text-xs">useLenis</code> callback adds <code className="text-emerald-400 font-mono text-xs">velocity * scale</code> to
                                each mesh&apos;s <code className="text-emerald-400 font-mono text-xs">position.y</code>. Positions grow without bound.
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant="amber">Step 3 — useFrame wraps positions</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '14px' }}>
                                Every frame, <code className="text-amber-400 font-mono text-xs">mod()</code> clamps each position into{' '}
                                <code className="text-amber-400 font-mono text-xs">[−totalH/2, +totalH/2]</code>. An image exiting the bottom silently reappears at the top.
                            </p>
                        </div>
                        <Callout variant="green">
                            <strong>Why not JS %?</strong> In JS, <code className="font-mono text-emerald-300">-1 % 5 = -1</code>. The custom{' '}
                            <code className="font-mono text-emerald-300">mod(n, m) = ((n % m) + m) % m</code> returns <code className="font-mono text-emerald-300">4</code>. Without this, scrolling
                            backward breaks the loop — positions wrap to the wrong side.
                        </Callout>
                    </div>
                    <ModWrapViz />
                </div>
            </FadeIn>

            <FadeIn delay={0.1}>
                <CodeBlock lang="tsx" highlight={['mod(', 'totalHeight', 'useFrame', 'useLenis']}>{`// utils.ts — handles negative numbers correctly
export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

// Carousel.tsx
const totalHeight = IMAGE_LIST.length * (gap + imageSize[1]);

// useLenis: called every scroll frame — moves positions
useLenis(({ velocity }) => {
    const delta = velocity * 0.005 * wheelFactor * wheelDirection;
    imageRefs.current.forEach((ref) => {
        if (!ref) return;
        ref.position.y -= delta;                              // ← structural: drives the loop
        ref.material.uniforms.uScrollSpeed.value = delta;    // ← visual: drives the wave
    });
});

// useFrame: called every render frame — wraps positions
useFrame(() => {
    imageRefs.current.forEach((ref) => {
        if (!ref) return;
        ref.position.y = mod(ref.position.y + totalHeight / 2, totalHeight) - totalHeight / 2;
        //                ↑ shift to 0→total range, wrap, shift back to -half→+half
    });
});`}</CodeBlock>
            </FadeIn>
        </section>
    );
}

// ─── 9. Scroll Integration ───────────────────────────────────────────────────
function ScrollIntegrationSection() {
    return (
        <section id="scroll" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="08" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Lenis Scroll Integration</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Lenis provides smooth scroll with momentum. <code className="text-indigo-400 font-mono text-sm">useLenis</code> bridges the DOM scroll world and the WebGL render loop — one
                    callback drives both the structural position updates and the visual shader effect.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <CodeBlock lang="tsx" highlight={['ReactLenis', 'useLenis', 'velocity', 'infinite', 'syncTouch']}>{`// LenisProvider.tsx — wraps the entire experiment layout
<ReactLenis root options={{ infinite: true, syncTouch: true }}>
    {children}
</ReactLenis>
// infinite: true    → scroll never hits a boundary, velocity never stops
// syncTouch: true   → mobile touch also produces continuous velocity

// Carousel.tsx — receives velocity every scroll frame
useLenis(({ velocity }) => {
    const scrollDelta = velocity * 0.005 * wheelFactor * wheelDirection;
    //                             ↑ DOM→WebGL unit scaling
    //                                        ↑ per-carousel speed multiplier
    //                                                    ↑ 1 or -1, reverses direction
    imageRefs.current.forEach((ref) => {
        if (!ref) return;
        ref.position.y -= scrollDelta;                         // moves the strip
        ref.material.uniforms.uScrollSpeed.value = scrollDelta; // drives wave distortion
    });
});`}</CodeBlock>
            </FadeIn>

            <FadeIn delay={0.15} className="mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'wheelFactor',
                            color: 'indigo',
                            desc: 'Scroll speed multiplier per carousel. 0.2 = sluggish, 0.6 = fast. Different values create parallax depth (Exp. 1) and speed gradients (Exp. 3).',
                        },
                        {
                            label: 'wheelDirection',
                            color: 'rose',
                            desc: '1 or −1. Flips scroll direction. Center-down + sides-up (Exp. 1) from a simple sign flip — visual complexity from a boolean.',
                        },
                        {
                            label: '0.005 scale',
                            color: 'amber',
                            desc: 'Maps Lenis velocity (px/frame) to WebGL units. Tuned by feel. Without it, a fast scroll would teleport images across the scene.',
                        },
                        { label: 'infinite: true', color: 'green', desc: 'Lenis never stops scrolling at a boundary. Combined with mod() wrapping, the carousel loops forever in both directions.' },
                    ].map(({ label, color, desc }) => (
                        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                            <Tag variant={color as 'indigo' | 'rose' | 'amber' | 'green'}>{label}</Tag>
                            <p className="text-zinc-400 mt-3 leading-relaxed" style={{ fontSize: '13px' }}>
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </FadeIn>

            <FadeIn delay={0.2} className="mt-8">
                <Callout>
                    <strong>One value, two effects:</strong> The same <code className="font-mono text-indigo-300">scrollDelta</code> drives both{' '}
                    <code className="font-mono text-indigo-300">position.y</code> (structural — keeps the loop running) and <code className="font-mono text-indigo-300">uScrollSpeed</code> (visual —
                    the wave bow). Different purposes, same source.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 10. Composition Patterns ─────────────────────────────────────────────────
function CompositionSection() {
    return (
        <section id="composition" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="09" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Composition Patterns</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    The experiments demonstrate four reusable composition techniques. Learn them and you can describe any of the six experiments — or design new ones.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold tracking-tight mb-3 text-white flex items-center gap-3">
                            <Tag variant="indigo">Pattern A</Tag> Parallax via Speed Differential
                        </h3>
                        <CodeBlock lang="tsx" highlight={['wheelFactor', 'wheelDirection']}>{`// Experiment 1: same curve params, different speeds and directions
<Carousel wheelFactor={0.4} wheelDirection={1}  curveStrength={1} ... />  // center
<Carousel wheelFactor={0.5} wheelDirection={-1} curveStrength={1} ... />  // right — faster, reversed
<Carousel wheelFactor={0.3} wheelDirection={-1} curveStrength={1} ... />  // left  — slower, reversed`}</CodeBlock>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold tracking-tight mb-3 text-white flex items-center gap-3">
                            <Tag variant="green">Pattern B</Tag> Symmetry via Mirrored Curves
                        </h3>
                        <CodeBlock lang="tsx" highlight={['curveStrength']}>{`// Experiment 2: opposing curveStrength creates mirror symmetry
<Carousel position={[2.5, 0, 0]}  curveStrength={-1.2} ... />  // curves left
<Carousel position={[-2.5, 0, 0]} curveStrength={1.2}  ... />  // curves right (mirror)
<Carousel position={[0, 0, 0]}    curveStrength={0}    ... />  // center — flat

// Experiment 3: gradient from +0.9 to −0.9 across 5 columns
// Each step reduces by 0.3 — curveStrengths: 0.9, 0.6, 0, −0.6, −0.9`}</CodeBlock>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold tracking-tight mb-3 text-white flex items-center gap-3">
                            <Tag variant="amber">Pattern C</Tag> Layering via Rotation
                        </h3>
                        <CodeBlock lang="tsx" highlight={['rotation', 'rotation-z', 'Math.PI']}>{`// Experiment 4: per-carousel Z-rotation at the SAME position — interference
<Carousel position={[0, 0, 0]} rotation={[0, 0, 0]}           ... />  // vertical
<Carousel position={[0, 0, 0]} rotation={[0, 0, Math.PI / 5]} ... />  // 36° — overlaps

// Experiment 6: group-level rotation — whole cluster tilts together
<group rotation-z={Math.PI / 4}>
    <Carousel position={[-1.3, 0, 0]} curveStrength={1.2}  ... />  // large, gentle curve
    <Carousel position={[-2.3, 0, 0]} curveStrength={7.5}  ... />  // small, extreme curve
    <Carousel position={[-0.4, 0, 0]} curveStrength={7.5}  ... />  // small, extreme curve
</group>`}</CodeBlock>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold tracking-tight mb-3 text-white flex items-center gap-3">
                            <Tag variant="sky">Pattern D</Tag> Axis Swap via Direction Prop
                        </h3>
                        <CodeBlock lang="tsx" highlight={['direction', 'horizontal']}>{`// Experiment 5: identical component, different axis
// Switching direction="horizontal" activates the horizontal shader pair
// The shader displaces Y from world-X (instead of X from world-Y)
// Position wrapping uses position.x instead of position.y
<group position-y={0.4}>
    <Carousel direction="horizontal" curveFrequency={0.9} wheelFactor={0.4} position={[0, -0.8, 0]} ... />
    <Carousel direction="horizontal" curveFrequency={1.0} wheelFactor={0.3} position={[0,  0.0, 0]} ... />
    <Carousel direction="horizontal" curveFrequency={1.1} wheelFactor={0.2} position={[0,  0.8, 0]} ... />
</group>`}</CodeBlock>
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.25} className="mt-8">
                <Callout variant="green">
                    <strong>The composability principle:</strong> Every experiment is a different JSX arrangement of the same <code className="font-mono text-emerald-300">{'<Carousel />'}</code>{' '}
                    component — no experiment-specific code. If you can describe a visual in terms of position, rotation, speed, direction, and curve parameters, you can build it without touching a
                    single component.
                </Callout>
            </FadeIn>
        </section>
    );
}

// ─── 11. Performance ──────────────────────────────────────────────────────────
function PerformanceSection() {
    return (
        <section id="performance" className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="10" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Performance Best Practices</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Experiment 6 renders 72 textured meshes simultaneously at 60fps. Every technique below has a measurable impact.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="space-y-4">
                    <PerfCard
                        n="01"
                        title="Share geometry via useMemo + prop"
                        bad="new PlaneGeometry() inside GLImage — 24 GPU buffer uploads per carousel"
                        good="useMemo(() => new PlaneGeometry(1,1,16,16), []) in Carousel, passed as prop to all children"
                        why="GPU buffer creation is expensive. One geometry = one VRAM allocation. Without sharing, a 6-carousel scene creates 144 separate buffers instead of 6."
                    />
                    <PerfCard
                        n="02"
                        title="Mutate refs directly — never setState in animation loops"
                        bad="useState({ position }) inside useFrame — triggers full React reconciliation every frame"
                        good="ref.position.y -= delta — mutates Three.js object directly in useFrame / useLenis"
                        why="React's reconciler runs synchronously before paint. At 60fps, 1 re-render per mesh per frame = 1440 re-renders/sec for a 6-carousel scene. Ref mutation has zero React overhead."
                    />
                    <PerfCard
                        n="03"
                        title="Update uniform values, not material instances"
                        bad="new ShaderMaterial({ uniforms: { uScrollSpeed: newValue } }) per frame"
                        good="ref.material.uniforms.uScrollSpeed.value = newValue"
                        why="Updating a uniform is a single GPU call. Recreating the ShaderMaterial triggers a full shader program recompile — a GPU stall measured in milliseconds."
                    />
                    <PerfCard
                        n="04"
                        title="GPU vertex displacement over CPU position updates"
                        bad="Calculate cosine curve in JS, call ref.position.set() for each vertex manually"
                        good="Pass curveStrength + curveFrequency as static uniforms, let GLSL compute per vertex"
                        why="The 16×16 plane has 289 vertices. Running cosine on 289 vertices serially in JS would take 10-50µs per mesh per frame. The GPU processes all vertices in parallel — effectively free."
                    />
                    <PerfCard
                        n="05"
                        title="Memoize shader args to prevent material recompile"
                        bad="Create new { uniforms, vertexShader, fragmentShader } object on every React render"
                        good="useMemo(() => ({ uniforms, vertexShader, fragmentShader }), [texture, direction, ...])"
                        why="React re-renders don't cause frame drops on their own, but passing a 'new' object to shaderMaterial signals Three.js that the material changed — potentially triggering shader recompilation."
                    />
                    <PerfCard
                        n="06"
                        title="Suspense + Loader for texture loading"
                        bad="Canvas renders partial scene with missing textures, images pop in asynchronously"
                        good={'<Suspense fallback={null}> around scene + <Loader /> from @react-three/drei'}
                        why="useTexture suspends the component tree while textures load. Suspense catches it and waits. The Loader component shows a progress bar automatically."
                    />
                    <PerfCard
                        n="07"
                        title="Lenis infinite mode for uninterrupted velocity"
                        bad="Standard scroll: hits top/bottom boundary → velocity drops to zero → loop stalls"
                        good="infinite: true — scroll position grows without bound in both directions"
                        why="The modulo wrapping only works while there's a continuous velocity signal. Scroll boundaries interrupt momentum — infinite mode removes the edge case entirely."
                    />
                </div>
            </FadeIn>
        </section>
    );
}

// ─── 12. Checklist ────────────────────────────────────────────────────────────
function ChecklistSection() {
    const items = [
        { label: 'Set up Lenis with infinite: true and syncTouch: true', detail: 'Continuous velocity for desktop scroll and mobile touch. No boundary stalls.' },
        { label: 'Create one shared PlaneGeometry per Carousel via useMemo', detail: '16×16 segments for smooth curves. Pass as prop to all GLImage children.' },
        { label: 'Use world position (not local) in the vertex shader', detail: '(modelMatrix * vec4(position, 1.0)).xyz — makes the curve flow continuously across all cards.' },
        { label: 'Re-center the cosine curve with pos.x -= uCurveStrength', detail: 'Without this, increasing strength shifts the carousel sideways instead of creating a symmetric wave.' },
        { label: 'Use sin(uv.x * PI) for the scroll wave window', detail: 'Pins both edges at 0, peaks at the center. Gives physical momentum feel.' },
        { label: 'Write aspect-ratio UV correction in the fragment shader', detail: 'Compare plane vs image aspect ratios with min(..., 1.0). Center with (1 - ratio) * 0.5.' },
        { label: 'Implement mod((n % m + m) % m) for wrapping', detail: 'JS % returns negative for negative inputs. The custom mod handles both scroll directions.' },
        { label: 'Update position.y AND uScrollSpeed in the same useLenis callback', detail: 'Same delta, two purposes: structural loop and visual wave distortion.' },
        { label: 'Wrap scene in Suspense fallback={null} + add drei Loader', detail: 'useTexture suspends — Suspense catches it gracefully, Loader provides visual feedback.' },
        { label: 'Design via props only — never branch inside components per experiment', detail: "One component, many configurations. If you're writing 'if experiment === 4' — refactor to a prop." },
    ];

    return (
        <section className="relative px-6 md:px-12 xl:px-24 py-20 border-t border-zinc-800/60">
            <SectionNum n="11" />
            <FadeIn>
                <h2 className="text-3xl font-black tracking-tight mb-3">Build Checklist</h2>
                <p className="text-zinc-400 max-w-2xl mb-8 leading-relaxed" style={{ fontSize: '16px' }}>
                    Building your own scroll-driven R3F experiment? Every item below has a reason behind it.
                </p>
            </FadeIn>

            <FadeIn delay={0.1}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8">
                    <div className="space-y-5">
                        {items.map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="mt-0.5 size-5 shrink-0 rounded border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center">
                                    <span className="text-indigo-400 font-mono font-bold" style={{ fontSize: '10px' }}>
                                        {i + 1}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white font-medium" style={{ fontSize: '15px' }}>
                                        {item.label}
                                    </p>
                                    <p className="text-zinc-500 mt-0.5" style={{ fontSize: '13px' }}>
                                        {item.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>

            <FadeIn delay={0.15} className="mt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'View all experiments', href: '/r3f-experimental/1', tag: 'live', color: 'indigo' },
                        { label: 'R3F Bulge Effect', href: '/r3f-bulge', tag: 'explore', color: 'violet' },
                        { label: 'Scroll Techniques', href: '/scroll/learn', tag: 'learn', color: 'sky' },
                    ].map(({ label, href, tag, color }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-indigo-500/40 hover:bg-indigo-500/5 flex flex-col gap-3"
                        >
                            <Tag variant={color as 'indigo' | 'violet' | 'sky'}>{tag}</Tag>
                            <span className="text-white font-bold group-hover:text-indigo-300 transition-colors" style={{ fontSize: '16px' }}>
                                {label} →
                            </span>
                        </Link>
                    ))}
                </div>
            </FadeIn>
        </section>
    );
}
