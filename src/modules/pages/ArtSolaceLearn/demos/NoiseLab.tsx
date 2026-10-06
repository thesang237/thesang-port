'use client';

import { useMemo, useRef } from 'react';

import { Demo, Segmented, Slider } from '../kit/controls';
import { useCanvas2D, useParams } from '../kit/loop';
import { curvePath } from '../kit/plot';
import { createNoise, createRandom } from '../kit/source';

const DEFAULTS = { mode: 'perlin' as 'white' | 'perlin', scale: 6, octaves: 1, seed: 7 };
const RES = 160;

/** The art's createNoise() (seeded Perlin) next to white noise, with octaves stacked on top. */
export default function NoiseLab() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);

    // value at (x, y) in 0..1 (octaves: each twice as fine, half as strong)
    const sample = useMemo(() => {
        if (p.mode === 'white') {
            const rand = createRandom(`white-${p.seed}`);
            const grid = Float32Array.from({ length: RES * RES }, () => rand.next());
            return (x: number, y: number) => grid[Math.min(RES - 1, Math.floor(y * RES)) * RES + Math.min(RES - 1, Math.floor(x * RES))];
        }
        const noise = createNoise(p.seed);
        return (x: number, y: number) => {
            let sum = 0,
                amp = 1,
                freq = 1,
                norm = 0;
            for (let o = 0; o < p.octaves; o++) {
                sum += amp * noise(x * p.scale * freq, y * p.scale * freq);
                norm += amp;
                amp *= 0.5;
                freq *= 2;
            }
            return sum / norm;
        };
    }, [p.mode, p.scale, p.octaves, p.seed]);

    useCanvas2D(
        host,
        (ctx, w, h) => {
            const img = new ImageData(RES, RES);
            for (let j = 0; j < RES; j++) {
                for (let i = 0; i < RES; i++) {
                    const v = sample(i / RES, j / RES);
                    // shade between the guide's paper and ink
                    const k = (j * RES + i) * 4;
                    img.data[k] = 242 + (30 - 242) * v;
                    img.data[k + 1] = 230 + (28 - 230) * v;
                    img.data[k + 2] = 218 + (33 - 218) * v;
                    img.data[k + 3] = 255;
                }
            }
            const off = new OffscreenCanvas(RES, RES);
            off.getContext('2d')!.putImageData(img, 0, 0);
            ctx.imageSmoothingEnabled = p.mode === 'perlin';
            ctx.drawImage(off, 0, 0, w, h);
            // the row the graph below is cut from
            ctx.strokeStyle = '#de8471';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();
        },
        [sample, p.mode],
    );

    const slice = curvePath((x) => sample(x, 0.5), 100, 30, 0, 1, 0, 1, 240);

    return (
        <Demo
            title="White noise vs Perlin noise"
            hint="Same seed, two kinds of randomness. The graph is the row under the rust line: jagged vs rolling."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="Kind"
                        options={[
                            { value: 'white', label: 'White noise' },
                            { value: 'perlin', label: 'Perlin (createNoise)' },
                        ]}
                        value={p.mode}
                        onChange={(v) => set('mode', v)}
                    />
                    <Slider
                        label="scale"
                        value={p.scale}
                        min={1}
                        max={30}
                        step={0.5}
                        onChange={(v) => set('scale', v)}
                        help="How many grid cells across: bigger = smaller hills."
                        disabled={p.mode === 'white'}
                    />
                    <Slider
                        label="octaves"
                        value={p.octaves}
                        min={1}
                        max={6}
                        step={1}
                        onChange={(v) => set('octaves', v)}
                        help="Layers of finer noise added on top (fBm)."
                        disabled={p.mode === 'white'}
                    />
                    <Slider label="seed" value={p.seed} min={1} max={99} step={1} onChange={(v) => set('seed', v)} help="Reshuffles the grid’s slopes." />
                    <svg viewBox="0 0 100 30" className="h-16 w-full overflow-visible" preserveAspectRatio="none" aria-label="One row of the noise">
                        <path d={slice} fill="none" stroke="var(--sl-ink)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                    </svg>
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="mx-auto aspect-square w-full max-w-[460px]" role="img" aria-label={`${p.mode} noise field`} />
            </div>
        </Demo>
    );
}
