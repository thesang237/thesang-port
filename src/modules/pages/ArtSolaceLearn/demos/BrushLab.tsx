'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Btn, Demo, Group, Readout, Segmented, Slider } from '../kit/controls';
import { prefersReducedMotion, useParams } from '../kit/loop';
import { buildScene, type Scene } from '../kit/source';

import { SeedPicker } from './SeedPicker';

type Dials = { core: number; slope: number; sky: number; dots: number; frames: number; size: number; alpha: number };
const fromScene = (s: Scene): Dials => ({
    core: s.params.coreDensity,
    slope: s.params.slopeDensity,
    sky: s.params.skyDensity,
    dots: s.params.dotsPerFrame,
    frames: s.params.frames,
    size: s.params.dotSize * 1000,
    alpha: s.params.inkAlpha,
});
const BRUSHES = {
    Sand: { alpha: 80, frames: 50 },
    Soft: { alpha: 24, frames: 50 },
    Grainy: { alpha: 255, frames: 100 },
} as const;

/** The real scene with its brush numbers on dials, poured in frame by frame. */
export default function BrushLab() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [seed, setSeed] = useState('r10');
    const seeded = useMemo(() => fromScene(buildScene(seed, 10)), [seed]);
    const { p, merge, set, reset } = useParams<Dials>(seeded);
    const [shownFor, setShownFor] = useState(seeded);
    if (shownFor !== seeded) {
        setShownFor(seeded);
        merge(seeded);
    }
    const [replay, setReplay] = useState(0);
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const size = Math.round(canvas.getBoundingClientRect().width) || 400;
        canvas.width = size * 2;
        canvas.height = size * 2;
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        const scene = buildScene(seed, size, {
            params: { coreDensity: p.core, slopeDensity: p.slope, skyDensity: p.sky, dotsPerFrame: p.dots, frames: p.frames, dotSize: p.size / 1000, inkAlpha: p.alpha },
        });
        ctx.fillStyle = scene.paper;
        ctx.fillRect(0, 0, size, size);
        let f = 0;
        let raf = 0;
        const instant = prefersReducedMotion();
        const tick = () => {
            do {
                if (!scene.drawFrame(ctx, f)) break;
                f++;
            } while (instant);
            setFrame(f);
            if (f < scene.totalFrames) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [seed, p, replay]);

    return (
        <Demo
            title="The sand brush"
            hint="Every dial is a number from params.ts, starting at this seed’s value. The picture pours in again after each change."
            onReset={reset}
            controls={
                <>
                    <SeedPicker seed={seed} onChange={setSeed} />
                    <Segmented
                        label="Brush preset"
                        options={Object.keys(BRUSHES)}
                        value={Object.entries(BRUSHES).find(([, b]) => b.alpha === p.alpha && b.frames === p.frames)?.[0] ?? ''}
                        onChange={(k) => merge(BRUSHES[k as keyof typeof BRUSHES])}
                    />
                    <Group title="Draw chance per zone">
                        <Slider label="core" value={p.core} min={0} max={1} onChange={(v) => set('core', v)} help="Dark core (seeded 1)." />
                        <Slider label="slope" value={p.slope} min={0} max={1} onChange={(v) => set('slope', v)} help="Lit slope (seeded 0.1)." />
                        <Slider label="sky" value={p.sky} min={0} max={1} onChange={(v) => set('sky', v)} help="From the Sky trait (0.5–1)." />
                    </Group>
                    <Group title="Dots">
                        <Slider label="dots per frame" value={p.dots} min={500} max={30000} step={500} onChange={(v) => set('dots', v)} help="8,000 in the art." />
                        <Slider label="frames" value={p.frames} min={1} max={150} step={1} onChange={(v) => set('frames', v)} help="50 (100 for Grainy). Total dots = dots × frames." />
                        <Slider label="dot size ‰" value={p.size} min={0.3} max={8} step={0.1} onChange={(v) => set('size', v)} help="1.2 ‰ of the canvas." />
                        <Slider label="ink opacity" value={p.alpha} min={5} max={255} step={1} onChange={(v) => set('alpha', v)} help="0–255. Sand 80, Soft 24, Grainy 255." />
                    </Group>
                    <Btn onClick={() => setReplay((r) => r + 1)}>Pour again ↓</Btn>
                    <Readout
                        items={[
                            { label: 'frame', value: `${frame}/${p.frames}` },
                            { label: 'dots tried', value: `${((Math.min(frame, p.frames) * p.dots) / 1000).toFixed(0)}k` },
                        ]}
                    />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <canvas ref={canvasRef} className="mx-auto block aspect-square w-full max-w-[520px]" role="img" aria-label={`Seed ${seed} poured with the dialled brush`} />
            </div>
        </Demo>
    );
}
