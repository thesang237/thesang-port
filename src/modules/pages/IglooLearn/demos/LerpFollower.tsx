'use client';

import { useRef } from 'react';

import { Demo, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { damp, lerp } from '../kit/math';

const DEFAULTS = { factor: 0.085, fps: '60' as '30' | '60' | '144', auto: true };
const TRAIL = 240;

/**
 * Two followers chase the same target. "lerp" moves a fixed share per frame
 * (so it depends on the frame rate). "damp" converts that share into a
 * time-based rate and feels the same at any frame rate.
 */
export default function LerpFollower() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const readout = useRef<HTMLSpanElement>(null);
    const s = useRef({ target: 0.8, naive: 0.2, time: 0.2, acc: 0, lastJump: 0, trail: [] as [number, number, number][] });

    useTicker(host, (t, dt) => {
        const P = ref.current;
        const st = s.current;
        if (P.auto && t - st.lastJump > 1.6) {
            st.lastJump = t;
            st.target = st.target > 0.5 ? 0.08 + Math.random() * 0.25 : 0.67 + Math.random() * 0.25;
        }
        // naive lerp: runs once per *simulated* frame, so more frames = faster
        const step = 1 / Number(P.fps);
        st.acc += dt;
        while (st.acc >= step) {
            st.naive = lerp(st.naive, st.target, P.factor);
            st.acc -= step;
        }
        // damp: λ chosen so that at 60fps it equals the lerp factor
        const lambda = -Math.log(1 - P.factor) * 60;
        st.time = damp(st.time, st.target, lambda, dt);
        st.trail.push([st.target, st.naive, st.time]);
        if (st.trail.length > TRAIL) st.trail.shift();

        const c = canvas.current;
        const ctx = c?.getContext('2d');
        if (!c || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const w = c.clientWidth;
        const h = c.clientHeight;
        if (c.width !== Math.round(w * dpr)) {
            c.width = Math.round(w * dpr);
            c.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const pad = 28;
        const X = (v: number) => pad + v * (w - pad * 2);

        // track + dots
        const ty = 44;
        ctx.strokeStyle = 'rgba(196,212,235,0.14)';
        ctx.beginPath();
        ctx.moveTo(pad, ty);
        ctx.lineTo(w - pad, ty);
        ctx.stroke();
        ctx.save();
        ctx.translate(X(st.target), ty);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = '#e8edf4';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-7, -7, 14, 14);
        ctx.restore();
        const dot = (x: number, y: number, color: string) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(X(x), y, 6, 0, Math.PI * 2);
            ctx.fill();
        };
        dot(st.naive, ty - 12, '#d4c2ff');
        dot(st.time, ty + 12, '#94dbff');

        // position-over-time graph
        const g0 = 90;
        const g1 = h - 14;
        ctx.strokeStyle = 'rgba(196,212,235,0.08)';
        ctx.strokeRect(pad + 0.5, g0 + 0.5, w - pad * 2 - 1, g1 - g0);
        const line = (k: 0 | 1 | 2, color: string, width: number) => {
            ctx.beginPath();
            st.trail.forEach((row, i) => {
                const x = pad + (i / (TRAIL - 1)) * (w - pad * 2);
                const y = g1 - row[k] * (g1 - g0);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
        };
        line(0, 'rgba(232,237,244,0.35)', 1);
        line(1, '#d4c2ff', 1.6);
        line(2, '#94dbff', 1.6);
        if (readout.current) readout.current.textContent = `λ = ${lambda.toFixed(2)} /s`;
    });

    const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        s.current.target = Math.min(1, Math.max(0, (e.clientX - r.left - 28) / (r.width - 56)));
        s.current.lastJump = 0;
        set('auto', false);
    };

    return (
        <Demo
            title="Lerp vs damp — the one-line animation"
            hint="Click the canvas to move the target (◇). Then switch the simulated frame rate: the lilac lerp changes speed, the blue damp does not."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="factor (per frame @60fps)"
                        value={p.factor}
                        min={0.01}
                        max={0.5}
                        step={0.005}
                        onChange={(v) => set('factor', v)}
                        help="0.085 = Lenis on Igloo. Small = heavy and floaty, large = snappy."
                    />
                    <Segmented label="simulated frame rate" options={['30', '60', '144'] as const} value={p.fps} onChange={(v) => set('fps', v)} />
                    <Toggle label="auto-jump target" checked={p.auto} onChange={(v) => set('auto', v)} />
                    <Readout
                        items={[
                            { label: 'lerp', value: 'per frame', color: '#d4c2ff' },
                            { label: 'damp', value: <span ref={readout}>λ</span>, color: '#94dbff' },
                        ]}
                    />
                </>
            }
        >
            <div ref={host} className="p-3">
                <canvas ref={canvas} onClick={onClick} className="block h-[300px] w-full cursor-crosshair" />
                <div className="il-mono flex flex-wrap gap-4 px-4 pb-2 text-[10.5px]">
                    <span className="text-[var(--il-ink)]">◇ target</span>
                    <span className="text-[var(--il-lilac)]">● lerp(a, b, factor) — every frame</span>
                    <span className="text-[var(--il-ice)]">● damp(a, b, λ, dt) — every second</span>
                </div>
            </div>
        </Demo>
    );
}
