'use client';

import { useRef } from 'react';

import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { useCanvas2D, useParams } from '../kit/loop';
import { mapRange } from '../kit/source';

// teaching copy of the walk in dunes.ts › createPeak, with every random value turned into a dial
// (amplitudes and steps in ‰, thousandths of the canvas)
const DEFAULTS = {
    f1: 7,
    a1: 0.25,
    f2: 20,
    a2: 1.25,
    wiggle: true,
    lean: 0.2,
    step: 1,
    special: false,
    dunes: 6,
    ghosts: true,
};
type P = typeof DEFAULTS;

const PEAK = { x: 0.62, y: 0.12 };
const PHASE1 = 1.3;
const PHASE2 = 4.1;

function walk(p: P, which: 'both' | 'one' | 'two') {
    const pts: [number, number][] = [];
    let x = PEAK.x;
    let y = PEAK.y;
    const a1 = which === 'two' ? 0 : p.a1 / 1000;
    const a2 = which === 'one' || !p.wiggle ? 0 : p.a2 / 1000;
    while (y < 1.08) {
        x -= p.lean / 1000;
        y += p.step / 1000;
        const depth = y - PEAK.y;
        const sway = p.special ? mapRange(depth * depth * p.dunes, 0, 1, 0.5, 10) : mapRange(depth, 0, 1, 0.5, 1);
        x += a1 * sway * Math.sin(PHASE1 + p.f1 * Math.pow(y, 0.5));
        x += a2 * sway * Math.sin(PHASE2 + p.f2 * Math.pow(y, 0.5));
        pts.push([x, y]);
    }
    return pts;
}

function stroke(ctx: CanvasRenderingContext2D, pts: [number, number][], w: number, color: string, width: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * w) : ctx.moveTo(x * w, y * w)));
    ctx.stroke();
}

export default function RidgeLab() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);

    useCanvas2D(
        host,
        (ctx, w) => {
            ctx.fillStyle = '#fbf5ef';
            ctx.fillRect(0, 0, w, w);
            // faint grid: model space 0..1
            ctx.strokeStyle = 'rgba(30,28,33,0.07)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 10; i++) {
                ctx.beginPath();
                ctx.moveTo((i / 10) * w, 0);
                ctx.lineTo((i / 10) * w, w);
                ctx.moveTo(0, (i / 10) * w);
                ctx.lineTo(w, (i / 10) * w);
                ctx.stroke();
            }
            if (p.ghosts) {
                stroke(ctx, walk(p, 'one'), w, 'rgba(222,132,113,0.75)', 1.5);
                if (p.wiggle) stroke(ctx, walk(p, 'two'), w, 'rgba(30,28,33,0.25)', 1.5);
            }
            const pts = walk(p, 'both');
            stroke(ctx, pts, w, '#1e1c21', 2.5);
            // big steps: show each footstep
            if (p.step >= 3) {
                ctx.fillStyle = '#1e1c21';
                pts.forEach(([x, y]) => ctx.fillRect(x * w - 2, y * w - 2, 4, 4));
            }
            // the peak
            ctx.fillStyle = '#de8471';
            ctx.beginPath();
            ctx.arc(PEAK.x * w, PEAK.y * w, 6, 0, Math.PI * 2);
            ctx.fill();
        },
        [p],
    );

    return (
        <Demo
            title="Ridge walk"
            hint="The walker starts at the rust dot and steps down. Ink: the real path. Rust: the slow sway alone. Grey: the fast wiggle alone."
            onReset={reset}
            controls={
                <>
                    <Group title="Wave 1 · the sway">
                        <Slider label="frequency" value={p.f1} min={0} max={20} step={0.5} onChange={(v) => set('f1', v)} help="Waves along the ridge (seeded 5–10)." />
                        <Slider label="amplitude ‰" value={p.a1} min={0} max={3} step={0.05} onChange={(v) => set('a1', v)} help="Sideways push per step (seeded 0.2–0.3 ‰)." />
                    </Group>
                    <Group title="Wave 2 · the wiggle">
                        <Toggle label="wiggle on" checked={p.wiggle} onChange={(v) => set('wiggle', v)} help="15 % of dunes switch it off: a smooth ridge." />
                        <Slider label="frequency" value={p.f2} min={0} max={60} step={0.5} onChange={(v) => set('f2', v)} help="Seeded 10–30, sometimes +15." />
                        <Slider label="amplitude ‰" value={p.a2} min={0} max={4} step={0.05} onChange={(v) => set('a2', v)} help="Seeded 1–1.5 ‰." />
                    </Group>
                    <Group title="The walk">
                        <Slider label="lean ‰" value={p.lean} min={-2} max={2} step={0.05} onChange={(v) => set('lean', v)} help="Drift left per step: the dune leans." />
                        <Slider label="step ‰" value={p.step} min={0.5} max={20} step={0.5} onChange={(v) => set('step', v)} help="How far down each step goes (1 ‰ = 1,000 steps)." />
                        <Toggle label="special (flaring) peak" checked={p.special} onChange={(v) => set('special', v)} help="Sway grows with distance² × dune count." />
                        <Slider label="dunes in scene" value={p.dunes} min={1} max={24} step={1} onChange={(v) => set('dunes', v)} help="Only matters for special peaks." disabled={!p.special} />
                        <Toggle label="show each wave alone" checked={p.ghosts} onChange={(v) => set('ghosts', v)} />
                    </Group>
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <div ref={host} className="mx-auto aspect-square w-full max-w-[520px]" role="img" aria-label="A ridge path walked down from a peak" />
            </div>
        </Demo>
    );
}
