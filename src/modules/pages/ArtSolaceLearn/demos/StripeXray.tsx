'use client';

import { useMemo, useRef, useState } from 'react';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useCanvas2D, useParams } from '../kit/loop';
import { createNoise, createPeak, createRandom, type KeySpace, type Peak, Shade, shadeOfPeak, stripeKeys } from '../kit/source';

const DEFAULTS = { slope: 0.8, res: 22, stripes: true, fill: true };
const ZONE = { [Shade.Core]: '#3a3438', [Shade.Slope]: '#e9b3a3' } as Record<number, string>;

/** One real dune (createPeak), its stripes and boundary maps, and the shade test for the point under your pointer. */
export default function StripeXray() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);
    const [pt, setPt] = useState<[number, number]>([0.42, 0.62]);

    const { peak, keys } = useMemo(() => {
        const rand = createRandom('stripe-xray');
        const keys: KeySpace = { dancers: false, sandstorm: false, skew: 0, skewAmount: 1, noise: createNoise(1), gaussian: rand.gaussian };
        const peak: Peak = createPeak(rand, keys, {
            peakX: 0.56,
            peakY: 0.14,
            diagonalSlope: p.slope,
            keyResolution: p.res,
            isSpecial: false,
            numPeaks: 1,
            stopY: 1.1,
            wobble: 4,
            lean: 2e-4,
            step: 0.001,
        });
        return { peak, keys };
    }, [p.slope, p.res]);

    // the test, step by step, for the hovered point
    const [lk, rk] = stripeKeys(keys, pt[0], pt[1], peak.diagonalSlope, peak.keyResolution);
    const leftEdge = peak.leftEdges.get(lk) ?? 0;
    const rightEdge = peak.rightEdges.get(rk) ?? 0;
    const left = pt[1] <= leftEdge ? 0 : leftEdge;
    const right = pt[1] <= rightEdge ? 0 : rightEdge;
    const verdict = shadeOfPeak(peak, keys, pt[0], pt[1]);

    useCanvas2D(
        host,
        (ctx, w) => {
            const s = peak.diagonalSlope;
            const res = peak.keyResolution;
            ctx.fillStyle = '#fbf5ef';
            ctx.fillRect(0, 0, w, w);
            if (p.fill) {
                const step = 3;
                for (let py = 0; py < w; py += step) {
                    for (let px = 0; px < w; px += step) {
                        const z = shadeOfPeak(peak, keys, px / w, py / w);
                        if (z === null) continue;
                        ctx.fillStyle = ZONE[z];
                        ctx.fillRect(px, py, step, step);
                    }
                }
            }
            // the stripes (y points down): \ lines are y = s·x + k/res, / lines are y = k/res − s·x
            const line = (k: number, dir: 1 | -1, color: string, width: number) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(0, (k / res) * w);
                ctx.lineTo(w, (dir * s + k / res) * w);
                ctx.stroke();
            };
            if (p.stripes && res <= 80) {
                for (let k = Math.floor(-s * res) - 2; k < res * (1 + s) + 2; k++) {
                    line(k, 1, 'rgba(168,69,42,0.18)', 1);
                    line(k, -1, 'rgba(30,28,33,0.12)', 1);
                }
            }
            // the ridge: every recorded edge is a point on it
            ctx.fillStyle = '#1e1c21';
            for (const [k, y] of peak.leftEdges) ctx.fillRect(((y - k / res) / s) * w - 1, y * w - 1, 2, 2);
            // the hovered point's two stripes and their recorded edges
            line(lk, 1, '#a8452a', 2.5);
            line(rk, -1, '#1e1c21', 2.5);
            const dot = (x: number, y: number, color: string, r: number) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x * w, y * w, r, 0, Math.PI * 2);
                ctx.fill();
            };
            if (leftEdge) dot((leftEdge - lk / res) / s, leftEdge, '#a8452a', 6);
            if (rightEdge) dot((rk / res - rightEdge) / s, rightEdge, '#1e1c21', 6);
            dot(pt[0], pt[1], '#fff', 7);
            dot(pt[0], pt[1], '#de8471', 4.5);
        },
        [peak, keys, pt, p.stripes, p.fill],
    );

    const move = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPt([Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]);
    };

    return (
        <Demo
            title="Stripes x-ray"
            hint="Move over the picture. Rust stripe: the point’s \ stripe and where the ridge first crossed it. Ink stripe: its / stripe and edge. The verdict compares the two."
            onReset={() => {
                reset();
                setPt([0.42, 0.62]);
            }}
            controls={
                <>
                    <Slider label="diagonalSlope" value={p.slope} min={0.15} max={3} step={0.05} onChange={(v) => set('slope', v)} help="Steeper stripes = a wider V = a broader dune." />
                    <Slider label="keyResolution" value={p.res} min={6} max={300} step={1} onChange={(v) => set('res', v)} help="Stripes per unit. The art uses 100–600; low values show the steps." />
                    <Toggle label="show all stripes" checked={p.stripes} onChange={(v) => set('stripes', v)} help="Hidden above 80 (too dense to see)." />
                    <Toggle label="fill the zones" checked={p.fill} onChange={(v) => set('fill', v)} />
                    <Readout
                        items={[
                            { label: '\\ key', value: lk },
                            { label: '/ key', value: rk },
                            { label: '\\ edge', value: leftEdge ? leftEdge.toFixed(3) : '–', color: 'var(--sl-rust-ink)' },
                            { label: '/ edge', value: rightEdge ? rightEdge.toFixed(3) : '–' },
                            { label: 'point y', value: pt[1].toFixed(3) },
                            { label: 'counts', value: `${left ? '\\' : ''}${right ? '/' : ''}` || 'none' },
                        ]}
                    />
                    <p className="rounded-md bg-[var(--sl-ink)] px-3 py-2.5 text-[14px] leading-snug text-[#f6ede4]">
                        {verdict === Shade.Core
                            ? 'The / edge that counts sits further down than the \\ one → dark core (always drawn).'
                            : verdict === Shade.Slope
                              ? 'The \\ edge that counts sits further down → lit slope (drawn 1 in 10).'
                              : 'No edge above the point counts → not this dune: sky (or the next dune back).'}
                    </p>
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div
                    ref={host}
                    onPointerMove={move}
                    onPointerDown={move}
                    className="mx-auto aspect-square w-full max-w-[520px] cursor-crosshair touch-pan-y"
                    role="img"
                    aria-label="A dune with its stripes"
                />
            </div>
        </Demo>
    );
}
