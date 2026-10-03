'use client';

import { useRef } from 'react';

import { Demo, Group, Readout, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { clamp01, damp, ease, IMAGES, lerp } from '../kit/source';

/** NotchedCard.ts: FRAME_LAMBDA, INNER_LAMBDA, base tilt, IMAGE_SHIFT (uv at full pointer) */
const DEFAULTS = { frame: 3.2, inner: 5.5, tiltY: 0.16, tiltX: 0.1, shift: 0.018, same: false, cover: 0.3, auto: true };
const HISTORY = 180;
const SPOTS: [number, number][] = [
    [-0.8, 0.3],
    [0.7, -0.4],
    [-0.1, 0.6],
    [0.9, 0.2],
    [-0.5, -0.5],
];

/** choreo.ts settleTilt: cards covering 40 % → 85 % of the screen stop leaning */
const settle = (cover: number) => 1 - clamp01((cover - 0.4) / 0.45);

/**
 * Chapter 07: one pointer, two followers. The frame leans toward the pointer slowly, the picture inside
 * shifts against it faster. The graph shows the last 3 seconds of all three.
 */
export default function LagLab() {
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const cardEl = useRef<HTMLDivElement>(null);
    const picEl = useRef<HTMLImageElement>(null);
    const { p, set, ref, reset } = useParams({ ...DEFAULTS, auto: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
    const sim = useRef({ raw: 0, fx: 0, ix: 0, rawY: 0, fy: 0, iy: 0, over: false, t: 0, hist: new Float32Array(HISTORY * 3), head: 0 });

    useTicker(host, (_time, dt) => {
        const s = sim.current;
        const d = ref.current;
        s.t += dt;
        if (!s.over && d.auto) {
            // when nobody is pointing: a quick hand move to a new spot every 1.4 s
            const i = Math.floor(s.t / 1.4);
            const k = ease.smooth(Math.min(1, ((s.t / 1.4) % 1) / 0.18));
            s.raw = lerp(SPOTS[i % SPOTS.length][0], SPOTS[(i + 1) % SPOTS.length][0], k);
            s.rawY = lerp(SPOTS[i % SPOTS.length][1], SPOTS[(i + 1) % SPOTS.length][1], k);
        }
        const fl = d.same ? d.inner : d.frame;
        s.fx = damp(s.fx, s.raw, fl, dt);
        s.fy = damp(s.fy, s.rawY, fl, dt);
        s.ix = damp(s.ix, s.raw, d.inner, dt);
        s.iy = damp(s.iy, s.rawY, d.inner, dt);
        const k = settle(d.cover);
        if (cardEl.current) cardEl.current.style.transform = `rotateY(${s.fx * d.tiltY * k}rad) rotateX(${s.fy * d.tiltX * k}rad)`;
        // flat images slide by IMAGE_SHIFT (uv) against the pointer: here as % of the picture
        if (picEl.current) picEl.current.style.transform = `translate(${-s.ix * d.shift * 100}%, ${s.iy * d.shift * 100}%)`;
        // history for the graph
        s.hist[s.head * 3] = s.raw;
        s.hist[s.head * 3 + 1] = s.fx;
        s.hist[s.head * 3 + 2] = s.ix;
        s.head = (s.head + 1) % HISTORY;
        const c = canvas.current;
        if (!c) return;
        const g = c.getContext('2d')!;
        const W = c.width;
        const H = c.height;
        g.clearRect(0, 0, W, H);
        g.strokeStyle = 'rgba(0,0,0,0.08)';
        g.beginPath();
        g.moveTo(0, H / 2);
        g.lineTo(W, H / 2);
        g.stroke();
        const colors = ['#8a8a94', '#5b4daa', '#3d8f00'];
        for (let j = 0; j < 3; j++) {
            g.strokeStyle = colors[j];
            g.lineWidth = j === 0 ? 1.5 : 2.5;
            g.setLineDash(j === 0 ? [4, 4] : []);
            g.beginPath();
            for (let i = 0; i < HISTORY; i++) {
                const v = s.hist[((s.head + i) % HISTORY) * 3 + j];
                const x = (i / (HISTORY - 1)) * W;
                const y = H / 2 - v * H * 0.42;
                if (i) g.lineTo(x, y);
                else g.moveTo(x, y);
            }
            g.stroke();
        }
        g.setLineDash([]);
    });

    const k = settle(p.cover);
    const scale = 0.55 + p.cover * 0.6;

    return (
        <Demo
            title="Two follow speeds — the frame and the picture"
            hint="Move the pointer over the stage (or let it drift). Purple = the frame’s lean (slow), green = the picture inside (fast), dashed = your pointer."
            onReset={reset}
            controls={
                <>
                    <Group title="Follow speed (λ per second)">
                        <Slider label="frame λ" value={p.frame} min={0.5} max={15} step={0.1} onChange={(v) => set('frame', v)} help="Source 3.2 (±15 % per card). Lower = heavier." />
                        <Slider label="picture λ" value={p.inner} min={0.5} max={15} step={0.1} onChange={(v) => set('inner', v)} help="Source 5.5. It must be quicker than the frame." />
                        <Toggle label="same speed (break it)" checked={p.same} onChange={(v) => set('same', v)} help="Both layers follow together: the depth flattens." />
                    </Group>
                    <Group title="Amounts">
                        <Slider
                            label="lean (yaw)"
                            value={p.tiltY}
                            min={0}
                            max={0.6}
                            step={0.01}
                            onChange={(v) => set('tiltY', v)}
                            format={(v) => `${v.toFixed(2)} rad`}
                            help="At the screen edge. Source 0.16."
                        />
                        <Slider label="lean (pitch)" value={p.tiltX} min={0} max={0.6} step={0.01} onChange={(v) => set('tiltX', v)} format={(v) => `${v.toFixed(2)} rad`} help="Source 0.10." />
                        <Slider label="picture shift" value={p.shift} min={0} max={0.12} step={0.002} onChange={(v) => set('shift', v)} help="uv units at full pointer. Source 0.018 (flat images)." />
                        <Slider
                            label="card covers"
                            value={p.cover}
                            min={0.05}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('cover', v)}
                            format={(v) => `${(v * 100).toFixed(0)} %`}
                            help="settleTilt: past 40 % of the screen the lean fades out, gone at 85 %."
                        />
                    </Group>
                    <Toggle label="drift when idle" checked={p.auto} onChange={(v) => set('auto', v)} />
                    <Readout items={[{ label: 'lean kept', value: `${(k * 100).toFixed(0)} %`, color: '#c0fb50' }]} />
                </>
            }
        >
            <div
                ref={host}
                className="relative"
                onPointerMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    sim.current.over = true;
                    sim.current.raw = ((e.clientX - r.left) / r.width) * 2 - 1;
                    sim.current.rawY = -(((e.clientY - r.top) / r.height) * 2 - 1);
                }}
                onPointerLeave={() => {
                    sim.current.over = false;
                }}
            >
                <div className="flex aspect-[16/9] items-center justify-center bg-[var(--kl-panel-2)] [perspective:1100px]">
                    <div ref={cardEl} className="relative aspect-[4/5] w-[34%] [transform-style:preserve-3d]" style={{ scale: String(scale) }}>
                        <div className="kl-notch absolute inset-0 overflow-hidden bg-[var(--kl-lav)]" style={{ ['--n-w' as string]: '58%', ['--n-d' as string]: '18px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img ref={picEl} src={IMAGES.faceTraits} alt="" className="absolute inset-[-8%] h-[116%] w-[116%] max-w-none object-cover" draggable={false} />
                        </div>
                    </div>
                </div>
                <canvas ref={canvas} width={1200} height={300} className="block h-[150px] w-full border-t border-[var(--kl-line)] bg-white" aria-hidden />
            </div>
        </Demo>
    );
}
