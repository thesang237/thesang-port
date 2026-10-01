'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Demo, Segmented, Slider } from '../kit/controls';
import { smoothstep } from '../kit/math';

import { sampleDrawing, SHAPES } from './particleShapes';

const SIDE = 32; // 32 × 32 texture = 1,024 particles (Igloo: 256 × 256 = 65,536)
const N = SIDE * SIDE;

/**
 * GPGPU in one picture: each pixel of a texture IS one particle. Its red,
 * green and blue channels store x, y and z. Change the shape and watch the
 * “image” change — that image is what the simulation shader reads and writes.
 */
type ShapeName = 'penguin' | 'x' | 'snowflake' | 'ring';
const NAMES: readonly ShapeName[] = ['penguin', 'x', 'snowflake', 'ring'];

export default function DataTexture() {
    const [a, setA] = useState<ShapeName>('penguin');
    const [b, setB] = useState<ShapeName>('ring');
    const [morph, setMorph] = useState(0);
    const [hover, setHover] = useState(137);
    const tex = useRef<HTMLCanvasElement>(null);
    const plot = useRef<HTMLCanvasElement>(null);

    const shapeA = useMemo(() => sampleDrawing(SHAPES[a], N, 3, 0.6), [a]);
    const shapeB = useMemo(() => sampleDrawing(SHAPES[b], N, 3, 0.6), [b]);
    const rnd = useMemo(() => Float32Array.from({ length: N }, (_, i) => ((i * 2654435761) % 1000) / 1000), []);

    const posAt = (i: number) => {
        const m = smoothstep(rnd[i] * 0.45, rnd[i] * 0.45 + 0.55, morph);
        return [0, 1, 2].map((k) => shapeA[i * 3 + k] + (shapeB[i * 3 + k] - shapeA[i * 3 + k]) * m);
    };
    // position (-1.3..1.3) → colour channel (0..1), like a float texture viewed as an image
    const toCol = (v: number[]) => [v[0] / 2.6 + 0.5, v[1] / 2.6 + 0.5, v[2] / 0.6 + 0.5].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255));

    useEffect(() => {
        const tc = tex.current?.getContext('2d');
        const pc = plot.current;
        const pctx = pc?.getContext('2d');
        if (!tc || !pc || !pctx) return;
        const img = tc.createImageData(SIDE, SIDE);
        const w = pc.width;
        const h = pc.height;
        pctx.clearRect(0, 0, w, h);
        for (let i = 0; i < N; i++) {
            const v = posAt(i);
            const c = toCol(v);
            img.data.set([c[0], c[1], c[2], 255], i * 4);
            pctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            pctx.fillRect(w / 2 + (v[0] / 2.9) * w - 1.5, h / 2 - (v[1] / 2.9) * h - 1.5, 3, 3);
        }
        tc.putImageData(img, 0, 0);
        const v = posAt(hover);
        pctx.strokeStyle = '#ffffff';
        pctx.lineWidth = 2;
        pctx.beginPath();
        pctx.arc(w / 2 + (v[0] / 2.9) * w, h / 2 - (v[1] / 2.9) * h, 9, 0, Math.PI * 2);
        pctx.stroke();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shapeA, shapeB, morph, hover]);

    const hv = posAt(hover);
    const hc = toCol(hv);

    return (
        <Demo
            title="Data texture — particles stored as pixels"
            hint="Hover the pixel grid: each pixel is one particle, its colour is its position. Drag morph and watch the image itself change."
            stacked
            controls={
                <>
                    <Segmented<ShapeName> label="shape A" options={NAMES} value={a} onChange={setA} />
                    <Segmented<ShapeName> label="shape B" options={NAMES} value={b} onChange={setB} />
                    <Slider label="morph A → B (per-pixel stagger)" value={morph} min={0} max={1} step={0.005} onChange={setMorph} />
                </>
            }
        >
            <div className="grid items-center gap-6 p-5 sm:grid-cols-2">
                <div>
                    <div className="il-mono mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--il-faint)]">{`the texture · ${SIDE} × ${SIDE} pixels`}</div>
                    <canvas
                        ref={tex}
                        width={SIDE}
                        height={SIDE}
                        className="aspect-square w-full max-w-[320px] cursor-crosshair rounded-md border border-[var(--il-line-2)]"
                        style={{ imageRendering: 'pixelated' }}
                        onMouseMove={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            const x = Math.floor(((e.clientX - r.left) / r.width) * SIDE);
                            const y = Math.floor(((e.clientY - r.top) / r.height) * SIDE);
                            setHover(Math.min(N - 1, Math.max(0, y * SIDE + x)));
                        }}
                    />
                    <div className="il-mono mt-3 space-y-0.5 text-[11px] leading-relaxed">
                        <div className="text-[var(--il-dim)]">
                            pixel{' '}
                            <span className="text-[var(--il-ink)]">
                                ({hover % SIDE}, {Math.floor(hover / SIDE)})
                            </span>{' '}
                            = particle #{hover}
                        </div>
                        <div>
                            <span style={{ color: '#ff7a8a' }}>R = x {hv[0].toFixed(2)}</span> · <span style={{ color: '#7ee2a8' }}>G = y {hv[1].toFixed(2)}</span> ·{' '}
                            <span style={{ color: '#6bb6ff' }}>B = z {hv[2].toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--il-faint)]">
                            colour <span className="inline-block size-3 rounded-sm" style={{ background: `rgb(${hc.join(',')})` }} /> · A = energy (glow)
                        </div>
                    </div>
                </div>
                <div>
                    <div className="il-mono mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--il-faint)]">the same data, drawn as points</div>
                    <canvas ref={plot} width={420} height={420} className="aspect-square w-full max-w-[360px] rounded-md bg-black/25" />
                </div>
            </div>
        </Demo>
    );
}
