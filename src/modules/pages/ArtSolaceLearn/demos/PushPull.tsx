'use client';

import { useRef } from 'react';

import { Demo, Slider } from '../kit/controls';
import { useCanvas2D, useParams } from '../kit/loop';
import { createWarp } from '../kit/source';

const DEFAULTS = { vc: 0.45, amp: 0.05, freq: 7 };
const N = 64;

/** Push (move model points onto the canvas) vs pull (ask each canvas point where it came from). */
export default function PushPull() {
    const pushHost = useRef<HTMLDivElement>(null);
    const pullHost = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);
    const settings = { verticalCompression: p.vc, warpAmplY: p.amp, warpFreqY: p.freq, warpPhaseY: 1, warpAmplX: 0, warpFreqX: 0, warpPhaseX: 0, flipX: false };

    // PUSH: an even grid of model points, each moved with warp(): gaps where it stretches, clumps where it squeezes
    useCanvas2D(
        pushHost,
        (ctx, w) => {
            const { warp } = createWarp(settings);
            ctx.fillStyle = '#fbf5ef';
            ctx.fillRect(0, 0, w, w);
            const cell = w / N;
            for (let j = 0; j < N; j++) {
                for (let i = 0; i < N; i++) {
                    const mx = (i + 0.5) / N,
                        my = (j + 0.5) / N;
                    const [cx, cy] = warp(mx, my);
                    ctx.fillStyle = (Math.floor(mx * 8) + Math.floor(my * 8)) % 2 ? '#1e1c21' : '#de8471';
                    ctx.fillRect(cx * w - cell / 2, cy * w - cell / 2, cell * 0.9, cell * 0.9);
                }
            }
        },
        [p],
    );

    // PULL: every canvas cell asks unwarp() where it came from and takes that colour: no gaps, ever
    useCanvas2D(
        pullHost,
        (ctx, w) => {
            const { unwarp } = createWarp(settings);
            ctx.fillStyle = '#fbf5ef';
            ctx.fillRect(0, 0, w, w);
            const cell = w / N;
            for (let j = 0; j < N; j++) {
                for (let i = 0; i < N; i++) {
                    const [mx, my] = unwarp((i + 0.5) / N, (j + 0.5) / N);
                    if (mx < 0 || mx > 1 || my < 0 || my > 1) continue;
                    ctx.fillStyle = (Math.floor(mx * 8) + Math.floor(my * 8)) % 2 ? '#1e1c21' : '#de8471';
                    ctx.fillRect(i * cell, j * cell, cell * 0.9, cell * 0.9);
                }
            }
        },
        [p],
    );

    return (
        <Demo
            title="Push vs pull"
            hint="The same checkerboard and the same warp. Left: move each square. Right: ask each canvas cell where it came from."
            onReset={reset}
            stacked
            controls={
                <>
                    <Slider label="verticalCompression" value={p.vc} min={0.2} max={2.5} onChange={(v) => set('vc', v)} help="Push it to 0.2 to see the gaps and clumps grow." />
                    <Slider label="warpAmplY" value={p.amp} min={0} max={0.15} step={0.001} onChange={(v) => set('amp', v)} help="The wavy horizon." />
                    <Slider label="warpFreqY" value={p.freq} min={0} max={20} step={0.1} onChange={(v) => set('freq', v)} />
                </>
            }
        >
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                {[
                    { host: pushHost, label: 'Push · warp(model → canvas)', note: 'gaps at the top, overlaps at the bottom' },
                    { host: pullHost, label: 'Pull · unwarp(canvas → model)', note: 'every cell answered exactly once' },
                ].map((v) => (
                    <figure key={v.label}>
                        <div ref={v.host} className="aspect-square w-full" role="img" aria-label={v.label} />
                        <figcaption className="sl-mono mt-2 text-[10.5px] uppercase text-[var(--sl-dim)]">
                            <span className="text-[var(--sl-ink)]">{v.label}</span>
                            {` · ${v.note}`}
                        </figcaption>
                    </figure>
                ))}
            </div>
        </Demo>
    );
}
