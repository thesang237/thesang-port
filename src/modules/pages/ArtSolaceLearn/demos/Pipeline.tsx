'use client';

import { useMemo, useRef, useState } from 'react';

import { drawAll, paintZones } from '../kit/art';
import { Demo, Readout, Segmented } from '../kit/controls';
import { useCanvas2D } from '../kit/loop';
import { buildScene, type Scene } from '../kit/source';

import { SeedPicker } from './SeedPicker';

const STAGES = [
    { value: 'traits', label: '1 · Traits' },
    { value: 'ridges', label: '2 · Ridges' },
    { value: 'zones', label: '3 · Zones' },
    { value: 'sand', label: '4 · Sand' },
] as const;
type Stage = (typeof STAGES)[number]['value'];

const NOTES: Record<Stage, string> = {
    traits: 'The seed rolls the traits first: palette, dune count, sky, brush. Nothing is drawn yet; this is the label on the back of the canvas.',
    ridges: 'Each dune’s ridge is walked from its peak downward. The dots are the edges it recorded (its boundary maps), already bent by the warp.',
    zones: 'Every point asks the dunes: dark core, lit slope or sky? Shown here as flat colours. The real piece never draws these.',
    sand: 'The real thing: 400,000 dots, each kept with its zone’s chance. Same seed, same 4 steps, same picture, every time.',
};

/** Plot the recorded edges: each (stripe, height) pair is a point on the ridge. */
function drawRidges(ctx: CanvasRenderingContext2D, scene: Scene, size: number) {
    ctx.fillStyle = scene.paper;
    ctx.fillRect(0, 0, size, size);
    scene.peaks.forEach((peak, i) => {
        ctx.fillStyle = i === 0 ? scene.params.ink : `hsl(${(i * 47 + 12) % 360} 45% 38%)`;
        for (const [key, y] of peak.leftEdges) {
            // a \ stripe (left key) is the line y − slope·x = key / resolution → solve for x
            const x = (y - key / peak.keyResolution) / peak.diagonalSlope;
            const [cx, cy] = scene.warp(x, y);
            ctx.fillRect(cx * size - 1, cy * size - 1, 2, 2);
        }
    });
}

function drawTraits(ctx: CanvasRenderingContext2D, scene: Scene, size: number) {
    ctx.fillStyle = scene.paper;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = scene.params.ink;
    const t = scene.traits;
    const rows = [
        ['Palette', t.Palette],
        ['Dunes', String(t.Dunes)],
        ['Sky', t.Sky],
        ['Margin', t.Margin],
        ['Brush', t.Brush],
        ['Render', t.Render],
        ['Dusty', String(t.Dusty)],
        ['Misty', String(t.Misty)],
        ['Dancers', String(t.Dancers)],
        ['Sandstorm', String(t.Sandstorm)],
    ];
    const lh = size / 13;
    ctx.font = `${Math.round(lh * 0.42)}px ui-monospace, monospace`;
    rows.forEach(([k, v], i) => {
        ctx.globalAlpha = 0.55;
        ctx.fillText(k.toUpperCase(), size * 0.12, lh * (i + 2));
        ctx.globalAlpha = 1;
        ctx.fillText(v, size * 0.5, lh * (i + 2));
    });
}

export default function Pipeline() {
    const host = useRef<HTMLDivElement>(null);
    const [seed, setSeed] = useState('solace');
    const [stage, setStage] = useState<Stage>('sand');
    // the scene is rebuilt for every paint: drawing consumes its random stream
    const size = 440;
    const label = useMemo(() => buildScene(seed, size).traits, [seed]);

    useCanvas2D(
        host,
        (ctx, w) => {
            const scene = buildScene(seed, w);
            if (stage === 'traits') drawTraits(ctx, scene, w);
            else if (stage === 'ridges') drawRidges(ctx, scene, w);
            else if (stage === 'zones') paintZones(ctx, scene, w, 2);
            else drawAll(ctx, scene, w);
        },
        [seed, stage],
    );

    return (
        <Demo
            title="One seed, four stages"
            hint="Step through the stages for the same seed, then change the seed and step again."
            controls={
                <>
                    <SeedPicker seed={seed} onChange={setSeed} />
                    <Segmented<Stage> label="Stage" options={STAGES} value={stage} onChange={setStage} />
                    <p className="text-[13.5px] leading-relaxed text-[var(--sl-body)]">{NOTES[stage]}</p>
                    <Readout
                        items={[
                            { label: 'palette', value: label.Palette },
                            { label: 'dunes', value: label.Dunes },
                            { label: 'sky', value: label.Sky },
                            { label: 'brush', value: label.Brush },
                        ]}
                    />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="mx-auto aspect-square w-full max-w-[520px]" role="img" aria-label={`Stage ${stage} of seed ${seed}`} />
            </div>
        </Demo>
    );
}
