'use client';

import { useRef } from 'react';

import { Demo, Segmented, Slider } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';

type Pal = { a: number; b: number; c: number; dr: number; dg: number; db: number };

const PRESETS: Record<string, Pal> = {
    'Igloo rainbow': { a: 0.5, b: 0.5, c: 1, dr: 0, dg: 0.33, db: 0.67 },
    'Ice film': { a: 0.75, b: 0.25, c: 1, dr: 0.55, dg: 0.62, db: 0.72 },
    Aurora: { a: 0.5, b: 0.5, c: 1, dr: 0.3, dg: 0.2, db: 0.2 },
    Sunset: { a: 0.5, b: 0.5, c: 1, dr: 0, dg: 0.1, db: 0.2 },
};

const col = (t: number, p: Pal) => [p.dr, p.dg, p.db].map((d) => Math.min(1, Math.max(0, p.a + p.b * Math.cos(6.28318 * (p.c * t + d)))));
const css = (rgb: number[]) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(',')})`;

/** Inigo Quilez's cosine palette: four numbers → an endless smooth gradient. */
export default function PaletteLab() {
    const { p, set, ref } = useParams<Pal & { preset: string }>({ ...PRESETS['Igloo rainbow'], preset: 'Igloo rainbow' });
    const host = useRef<HTMLDivElement>(null);
    const strip = useRef<HTMLCanvasElement>(null);
    const graph = useRef<HTMLCanvasElement>(null);

    useTicker(host, (t) => {
        const P = ref.current;
        const draw = (cv: HTMLCanvasElement | null, fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
            const ctx = cv?.getContext('2d');
            if (!cv || !ctx) return;
            const dpr = Math.min(window.devicePixelRatio, 2);
            const w = cv.clientWidth;
            const h = cv.clientHeight;
            if (cv.width !== Math.round(w * dpr)) {
                cv.width = Math.round(w * dpr);
                cv.height = Math.round(h * dpr);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            fn(ctx, w, h);
        };
        draw(strip.current, (ctx, w, h) => {
            for (let x = 0; x < w; x += 2) {
                ctx.fillStyle = css(col(x / w, P));
                ctx.fillRect(x, 0, 2, h / 2);
                ctx.fillStyle = css(col(x / w + t * 0.1, P));
                ctx.fillRect(x, h / 2 + 4, 2, h / 2 - 4);
            }
        });
        draw(graph.current, (ctx, w, h) => {
            ['#ff6b81', '#7ee2a8', '#6bb6ff'].forEach((c, k) => {
                ctx.beginPath();
                for (let x = 0; x <= w; x += 2) {
                    const v = col(x / w, P)[k];
                    const y = h - 4 - v * (h - 8);
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = c;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });
        });
    });

    const apply = (name: string) => {
        const pr = PRESETS[name];
        set('preset', name);
        (Object.keys(pr) as (keyof Pal)[]).forEach((k) => set(k, pr[k]));
    };

    return (
        <Demo
            title="Cosine palette — colour(t) = a + b · cos(2π(c·t + d))"
            hint="The phase sliders (d) rotate each colour channel. Igloo uses 0, 0.33, 0.67 — the channels a third apart make a full rainbow."
            onReset={() => apply('Igloo rainbow')}
            controls={
                <>
                    <Segmented label="preset" options={Object.keys(PRESETS)} value={p.preset} onChange={apply} />
                    <Slider label="a · brightness" value={p.a} min={0} max={1} onChange={(v) => set('a', v)} />
                    <Slider label="b · contrast" value={p.b} min={0} max={1} onChange={(v) => set('b', v)} />
                    <Slider label="c · frequency" value={p.c} min={0.1} max={3} onChange={(v) => set('c', v)} help="How many colour cycles fit in 0..1." />
                    <Slider label="d · red phase" value={p.dr} min={0} max={1} onChange={(v) => set('dr', v)} />
                    <Slider label="d · green phase" value={p.dg} min={0} max={1} onChange={(v) => set('dg', v)} />
                    <Slider label="d · blue phase" value={p.db} min={0} max={1} onChange={(v) => set('db', v)} />
                </>
            }
        >
            <div ref={host} className="space-y-4 p-5">
                <canvas ref={strip} className="block h-[120px] w-full rounded-lg" />
                <div className="il-mono flex justify-between text-[10px] text-[var(--il-faint)]">
                    <span>top: t = 0 → 1 · bottom: same palette scrolling with time</span>
                </div>
                <canvas ref={graph} className="block h-[120px] w-full rounded-lg bg-black/25" />
                <pre className="il-mono rounded-lg border border-[var(--il-line)] bg-black/30 p-3 text-[11.5px] text-[#cfeeff]">{`vec3 palette(float t) {
    return ${p.a.toFixed(2)} + ${p.b.toFixed(2)} * cos(6.28318 * (${p.c.toFixed(2)} * t + vec3(${p.dr.toFixed(2)}, ${p.dg.toFixed(2)}, ${p.db.toFixed(2)})));
}
// Compositor.tsx: rainbow(uv.x * 1.8 + uv.y * 0.6 + uTime * 0.25)`}</pre>
            </div>
        </Demo>
    );
}
