'use client';

import { useRef, useState } from 'react';

import { drawAll, paintZones } from '../kit/art';
import { Demo, Segmented } from '../kit/controls';
import { useCanvas2D } from '../kit/loop';
import { buildScene } from '../kit/source';

const VIEWS = [
    { value: 'contours', label: 'Kick lines' },
    { value: 'off', label: 'Zones, calm' },
    { value: 'on', label: 'Zones, sandstorm' },
    { value: 'sand', label: 'Sand, sandstorm' },
] as const;
type View = (typeof VIEWS)[number]['value'];

/** Where Sandstorm kicks: the thin contour lines of the scene's own noise field. */
export default function SandstormXray() {
    const host = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<View>('contours');
    const seed = 'r6';

    useCanvas2D(
        host,
        (ctx, w) => {
            const scene = buildScene(seed, w, { traits: { Sandstorm: view !== 'off' } });
            if (view === 'sand') return drawAll(ctx, scene, w);
            if (view !== 'contours') return paintZones(ctx, scene, w, 2);
            // the kick test from dunes.ts, painted: noise(30x, 30y) % 0.1 < 0.005, in model space
            paintZones(ctx, scene, w, 3, { 0: '#e2cfbd', 1: '#ecdccc', 2: '#f3e6d8' });
            ctx.fillStyle = '#a8452a';
            for (let py = 0; py < w; py += 1) {
                for (let px = 0; px < w; px += 1) {
                    const [mx, my] = scene.unwarp(px / w, py / w);
                    if (scene.keys.noise(30 * mx, 30 * my) % 0.1 < 0.005) ctx.fillRect(px, py, 1, 1);
                }
            }
        },
        [view],
    );

    return (
        <Demo
            title="Sandstorm x-ray"
            hint="The rust lines are where a point gets kicked: thin contour lines of a noise field. Compare the calm zones with the stormy ones."
            controls={
                <>
                    <Segmented<View> label="View" options={VIEWS} value={view} onChange={setView} />
                    <p className="text-[13.5px] leading-relaxed text-[var(--sl-body)]">
                        Seed <code className="sl-code-inline">r6</code> rolls Sandstorm. A point on a kick line moves up or down by <code className="sl-code-inline">0.18 × gaussian()</code> before its
                        stripe is looked up, so dune edges near those lines fray into streaks.
                    </p>
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="mx-auto aspect-square w-full max-w-[460px]" role="img" aria-label={`Sandstorm ${view}`} />
            </div>
        </Demo>
    );
}
