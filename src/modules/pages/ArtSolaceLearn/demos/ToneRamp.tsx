'use client';

import { useRef } from 'react';

import { Demo, Slider } from '../kit/controls';
import { useCanvas2D, useParams } from '../kit/loop';
import { createRandom } from '../kit/source';

const DEFAULTS = { dots: 60, size: 1.5, alpha: 80 };

/** A gradient with no gradient in it: the draw chance rises from 0 to 1 left to right, nothing else. */
export default function ToneRamp() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);

    useCanvas2D(
        host,
        (ctx, w, h) => {
            ctx.fillStyle = '#fbf5ef';
            ctx.fillRect(0, 0, w, h);
            const rand = createRandom('tone-ramp');
            ctx.fillStyle = `rgba(30,28,33,${(p.alpha / 255).toFixed(3)})`;
            const tries = Math.round(p.dots * 1000);
            for (let i = 0; i < tries; i++) {
                const x = rand.next();
                const y = rand.next();
                // the art's rule, with the chance = how far across we are
                if (rand.next() <= x) ctx.fillRect(x * w, y * h, p.size, p.size);
            }
            // the three zone chances, marked on the ramp
            ctx.font = '11px ui-monospace, monospace';
            [
                [0.1, 'slope 0.1'],
                [0.8, 'sky 0.8'],
                [1, 'core 1'],
            ].forEach(([v, label]) => {
                const x = Number(v) * w;
                ctx.fillStyle = '#a8452a';
                ctx.fillRect(Math.min(x, w - 2), 0, 2, 10);
                ctx.fillText(String(label), Math.min(x + 4, w - 64), 22);
            });
        },
        [p],
    );

    return (
        <Demo
            title="A gradient made of dice"
            hint="Each dot is kept with a chance that grows from 0 (left) to 1 (right). That’s the only rule, and your eye reads a smooth tone."
            onReset={reset}
            stacked
            controls={
                <>
                    <Slider label="dots tried (thousands)" value={p.dots} min={2} max={200} step={1} onChange={(v) => set('dots', v)} help="Fewer: you see dots. More: you see tone." />
                    <Slider label="dot size (px)" value={p.size} min={0.5} max={5} step={0.1} onChange={(v) => set('size', v)} />
                    <Slider label="ink opacity" value={p.alpha} min={10} max={255} step={1} onChange={(v) => set('alpha', v)} help="Low opacity needs more dots to get dark: the Soft brush." />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="h-[160px] w-full sm:h-[200px]" role="img" aria-label="A tone ramp made only from probability" />
            </div>
        </Demo>
    );
}
