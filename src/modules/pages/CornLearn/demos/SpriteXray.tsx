'use client';

import { useEffect, useRef } from 'react';

import { Demo, Group, Readout, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';

/**
 * One bokeh sprite, computed exactly like polyMaterial's fragment shader but on the CPU, so you can
 * watch a single dot defocus: vSize 0 (on the focus point) → 1 (far from it). Size, edge softness
 * and brightness all come from that one number.
 */
const DEFAULTS = { v: 0, sides: '5' as '0' | '3' | '4' | '5' | '6', min: 10, max: 200 };
const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};
function polygonDf(x: number, y: number, n: number) {
    if (n === 0) return Math.hypot(x - 0.5, y - 0.5) * 2;
    const sx = x * 2 - 1;
    const sy = y * 2 - 1;
    const a = Math.atan2(sx, sy) + Math.PI * 0.5;
    const r = (Math.PI * 2) / n;
    return Math.cos(Math.floor(0.5 + a / r) * r - a) * Math.hypot(sx, sy);
}

export default function SpriteXray() {
    const { p, set, reset } = useParams(DEFAULTS);
    const big = useRef<HTMLCanvasElement>(null);
    const real = useRef<HTMLCanvasElement>(null);
    const vSize = p.v;
    const px = p.min + (p.max - p.min) * vSize;
    const soft = 0.05 + (0.3 - 0.05) * vSize;
    const distanceAlpha = 1 + (0.4 - 1) * smooth(0, 0.2, vSize);

    useEffect(() => {
        const n = Number(p.sides);
        const draw = (c: HTMLCanvasElement | null, box: number, scale: number) => {
            if (!c) return;
            c.width = box;
            c.height = box;
            const g = c.getContext('2d');
            if (!g) return;
            const img = g.createImageData(box, box);
            const s = Math.max(1, Math.round(scale));
            const off = (box - s) / 2;
            for (let y = 0; y < box; y++) {
                for (let x = 0; x < box; x++) {
                    const u = (x - off) / s;
                    const v = (y - off) / s;
                    let a = 0;
                    if (u >= 0 && u <= 1 && v >= 0 && v <= 1) a = smooth(0.5, 0.5 - soft, polygonDf(u, v, n)) * distanceAlpha; // gl_PointCoord: y runs down
                    const i = (y * box + x) * 4;
                    // additive on black, display-space weight as on the page (alpha^2.2 in linear ≈ alpha here)
                    img.data[i] = 85 * a + 16;
                    img.data[i + 1] = 255 * a + 22;
                    img.data[i + 2] = 194 * a + 18;
                    img.data[i + 3] = 255;
                }
            }
            g.putImageData(img, 0, 0);
        };
        draw(big.current, 220, 200);
        draw(real.current, 220, px);
    }, [p.sides, soft, distanceAlpha, px]);

    return (
        <Demo
            title="One sprite, defocusing"
            hint="Drag “distance from focus” from 0 to 1. Left: the sprite magnified to fill its square. Right: the same sprite at its real size on a 800 px-tall screen."
            onReset={reset}
            controls={
                <>
                    <Slider label="distance from focus (vSize)" value={p.v} min={0} max={1} step={0.005} onChange={(v) => set('v', v)} help="smoothstep(near, far, distance to the focus point)." />
                    <Segmented
                        label="sides"
                        options={[
                            { value: '0', label: 'circle' },
                            { value: '3', label: '3' },
                            { value: '4', label: '4' },
                            { value: '5', label: '5' },
                            { value: '6', label: '6' },
                        ]}
                        value={p.sides}
                        onChange={(v) => set('sides', v)}
                    />
                    <Group title="Field preset (px)">
                        <Slider label="size in focus" value={p.min} min={1} max={60} step={1} onChange={(v) => set('min', v)} help="Hero back field: 10." />
                        <Slider label="size out of focus" value={p.max} min={20} max={220} step={1} onChange={(v) => set('max', v)} help="Hero back field: 200." />
                    </Group>
                    <Readout
                        items={[
                            { label: 'point size', value: `${px.toFixed(0)} px` },
                            { label: 'edge softness', value: soft.toFixed(3) },
                            { label: 'brightness', value: distanceAlpha.toFixed(2) },
                            { label: 'shape', value: p.sides === '0' ? 'circle' : `${p.sides}-gon` },
                        ]}
                    />
                </>
            }
        >
            <div className="grid grid-cols-2 gap-4 p-5">
                {[
                    [big, 'magnified'],
                    [real, 'real size'],
                ].map(([r, l]) => (
                    <figure key={l as string} className="flex flex-col items-center gap-2">
                        <canvas ref={r as React.RefObject<HTMLCanvasElement>} className="aspect-square w-full max-w-[260px] rounded-md border border-[var(--cl-line)] [image-rendering:auto]" />
                        <figcaption className="cl-mono text-[10.5px] uppercase text-[var(--cl-dim)]">{l as string}</figcaption>
                    </figure>
                ))}
            </div>
        </Demo>
    );
}
