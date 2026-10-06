'use client';

import { useMemo, useRef, useState } from 'react';

import { paintZones } from '../kit/art';
import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { useCanvas2D } from '../kit/loop';
import { buildScene, type Scene } from '../kit/source';

import { SeedPicker } from './SeedPicker';

type Dials = { vc: number; amp: number; freq: number; phase: number; flip: boolean };
const fromScene = (s: Scene): Dials => ({ vc: s.params.verticalCompression, amp: s.params.warpAmplY, freq: s.params.warpFreqY, phase: s.params.warpPhaseY, flip: s.params.flipX });

/** The art's warp() bending a model-space grid, with the scene's zones underneath. */
export default function WarpGrid() {
    const host = useRef<HTMLDivElement>(null);
    const [seed, setSeed] = useState('r10');
    const seeded = useMemo(() => fromScene(buildScene(seed, 10)), [seed]);
    const [dials, setDials] = useState<Dials>(seeded);
    const [zones, setZones] = useState(true);
    const [shownFor, setShownFor] = useState(seeded);
    if (shownFor !== seeded) {
        setShownFor(seeded);
        setDials(seeded);
    }
    const set = <K extends keyof Dials>(k: K, v: Dials[K]) => setDials((d) => ({ ...d, [k]: v }));

    useCanvas2D(
        host,
        (ctx, w) => {
            const scene = buildScene(seed, w, { params: { verticalCompression: dials.vc, warpAmplY: dials.amp, warpFreqY: dials.freq, warpPhaseY: dials.phase, flipX: dials.flip } });
            if (zones) paintZones(ctx, scene, w, 3, { 0: '#cdbbae', 1: '#ead6c8', 2: '#fbf5ef' });
            else {
                ctx.fillStyle = '#fbf5ef';
                ctx.fillRect(0, 0, w, w);
            }
            // model-space grid lines, pushed through warp()
            const path = (pts: [number, number][]) => {
                ctx.beginPath();
                pts.forEach(([x, y], i) => {
                    const [cx, cy] = scene.warp(x, y);
                    if (i) ctx.lineTo(cx * w, cy * w);
                    else ctx.moveTo(cx * w, cy * w);
                });
                ctx.stroke();
            };
            ctx.lineWidth = 1.2;
            for (let i = 0; i <= 10; i++) {
                ctx.strokeStyle = i === 5 ? 'rgba(168,69,42,0.9)' : 'rgba(30,28,33,0.4)';
                path(Array.from({ length: 101 }, (_, k) => [i / 10, -0.05 + (k / 100) * 1.1]));
                ctx.strokeStyle = i === 5 ? 'rgba(168,69,42,0.9)' : 'rgba(30,28,33,0.4)';
                path(Array.from({ length: 101 }, (_, k) => [k / 100, i / 10]));
            }
        },
        [seed, dials, zones],
    );

    return (
        <Demo
            title="Warp: bending model space onto the canvas"
            hint="The grid is the flat model space; the art bends it with two formulas. The rust lines are its centre lines."
            onReset={() => setDials(seeded)}
            controls={
                <>
                    <SeedPicker seed={seed} onChange={setSeed} />
                    <Group title="Depth squeeze (power curve)">
                        <Slider label="verticalCompression" value={dials.vc} min={0.2} max={2.5} onChange={(v) => set('vc', v)} help="1 = no squeeze. Under 1: rows bunch at the bottom." />
                    </Group>
                    <Group title="Wavy horizon (sine)">
                        <Slider label="warpAmplY" value={dials.amp} min={0} max={0.12} step={0.001} onChange={(v) => set('amp', v)} help="How far each column is lifted." />
                        <Slider label="warpFreqY" value={dials.freq} min={0} max={24} step={0.1} onChange={(v) => set('freq', v)} help="Waves across the width." />
                        <Slider label="warpPhaseY" value={dials.phase} min={0} max={Math.PI * 2} onChange={(v) => set('phase', v)} help="Slides the waves sideways." />
                    </Group>
                    <Toggle label="flipX" checked={dials.flip} onChange={(v) => set('flip', v)} help="Mirror left ↔ right (20 % of seeds)." />
                    <Toggle label="show the zones" checked={zones} onChange={setZones} />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="mx-auto aspect-square w-full max-w-[520px]" role="img" aria-label="A grid bent by the warp" />
            </div>
        </Demo>
    );
}
