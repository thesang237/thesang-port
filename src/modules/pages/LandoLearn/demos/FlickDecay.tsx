'use client';

import { useMemo, useRef } from 'react';

import { Btn, Demo, Group, Readout, Segmented, Slider } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';

/**
 * One wheel flick = the target jumps; the visible scroll glides after it. Measured in the reference video:
 * the remaining distance shrinks ×0.55 every 0.1 s. Lenis does `damp(x, target, lerp × 60, dt)`, so
 * remaining(t) = e^(−lerp·60·t) → e^(−6·lerp) per 0.1 s → lerp ≈ 0.1.
 */
const DEFAULTS = { lerp: 0.1, method: 'damp' as 'damp' | 'naive' };
const SPAN = 1; // seconds on the graph
const FPS = [30, 60, 120] as const;
const COLORS: Record<number, string> = { 30: '#ffb36b', 60: '#cdff0b', 120: '#a8d8b0' };

function simulate(lerp: number, fps: number, method: 'damp' | 'naive') {
    const dt = 1 / fps;
    let x = 0;
    const pts: [number, number][] = [[0, 0]];
    for (let t = dt; t <= SPAN + 1e-9; t += dt) {
        const k = method === 'damp' ? 1 - Math.exp(-lerp * 60 * dt) : lerp;
        x += (1 - x) * k;
        pts.push([t, x]);
    }
    return pts;
}

const GW = 620;
const GH = 260;
const P = 34;
const gx = (t: number) => P + (t / SPAN) * (GW - P * 2);
const gy = (v: number) => GH - P - v * (GH - P * 2);

export default function FlickDecay() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const dots = useRef<HTMLSpanElement[]>([]);
    const sim = useRef({ x: [0, 0, 0], target: 0 });

    const curves = useMemo(() => FPS.map((f) => ({ f, pts: simulate(p.lerp, f, p.method) })), [p.lerp, p.method]);
    const remain = Math.exp(-p.lerp * 60 * 0.1);
    const to99 = Math.log(100) / (p.lerp * 60);

    // live followers: same maths, one dot per frame rate, stepped at that rate
    const acc = useRef([0, 0, 0]);
    useTicker(host, (_t, dt) => {
        const s = sim.current;
        FPS.forEach((f, i) => {
            acc.current[i] += dt;
            const step = 1 / f;
            while (acc.current[i] >= step) {
                acc.current[i] -= step;
                const k = ref.current.method === 'damp' ? 1 - Math.exp(-ref.current.lerp * 60 * step) : ref.current.lerp;
                s.x[i] += (s.target - s.x[i]) * k;
            }
            const d = dots.current[i];
            if (d) d.style.left = `${s.x[i] * 100}%`;
        });
    });

    const flick = () => {
        sim.current.target = sim.current.target > 0.5 ? 0 : 1;
    };

    return (
        <Demo
            title="Flick decay — what lerp 0.1 means"
            hint="Press “Flick” to send the target to the other end; three dots chase it at 30, 60 and 120 fps. The graph shows the same chase over one second."
            onReset={reset}
            controls={
                <>
                    <Group title="Smoothing">
                        <Slider label="lerp" value={p.lerp} min={0.02} max={0.5} onChange={(v) => set('lerp', v)} help="Share of the remaining distance covered each 60 fps frame. The source: 0.1." />
                        <Segmented
                            label="method"
                            options={[
                                { value: 'damp', label: 'Lenis (frame-rate safe)' },
                                { value: 'naive', label: 'naive per-frame lerp' },
                            ]}
                            value={p.method}
                            onChange={(v) => set('method', v)}
                        />
                    </Group>
                    <Btn primary onClick={flick}>
                        ↔ Flick
                    </Btn>
                    <Readout
                        items={[
                            { label: 'left after 0.1 s', value: `×${remain.toFixed(2)}`, color: Math.abs(remain - 0.55) < 0.03 ? 'var(--ll-lime)' : undefined },
                            { label: 'video', value: '×0.55' },
                            { label: '99% there', value: `${to99.toFixed(2)} s` },
                            { label: 'λ = lerp·60', value: `${(p.lerp * 60).toFixed(1)} /s` },
                        ]}
                    />
                </>
            }
        >
            <div ref={host} className="space-y-3 p-4">
                <div className="space-y-2 rounded-xl border border-[var(--ll-line)] bg-[var(--ll-bg-2)] px-4 py-3">
                    {FPS.map((f, i) => (
                        <div key={f} className="flex items-center gap-3">
                            <span className="ll-mono w-14 shrink-0 text-[10.5px]" style={{ color: COLORS[f] }}>{`${f} fps`}</span>
                            <div className="relative h-4 flex-1">
                                <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--ll-line-2)]" />
                                <span
                                    ref={(el) => {
                                        if (el) dots.current[i] = el;
                                    }}
                                    className="absolute top-1/2 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-sm"
                                    style={{ left: 0, background: COLORS[f] }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="ll-scrollbox overflow-x-auto">
                    <svg viewBox={`0 0 ${GW} ${GH}`} className="min-w-[480px]" role="img" aria-label="Scroll position after a flick, over one second">
                        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                            <g key={v}>
                                <line x1={P} x2={GW - P} y1={gy(v)} y2={gy(v)} stroke="rgba(241,243,232,0.06)" />
                                <text x={P - 6} y={gy(v) + 3} fontSize="9" fill="#7f8375" textAnchor="end" fontFamily="var(--font-ll-mono)">{`${v * 100}%`}</text>
                            </g>
                        ))}
                        {Array.from({ length: 11 }, (_, k) => k / 10).map((t) => (
                            <text key={t} x={gx(t)} y={GH - P + 15} fontSize="9" fill="#7f8375" textAnchor="middle" fontFamily="var(--font-ll-mono)">
                                {t.toFixed(1)}
                            </text>
                        ))}
                        {curves.map(({ f, pts }) => (
                            <polyline
                                key={f}
                                points={pts.map(([t, v]) => `${gx(t).toFixed(1)},${gy(v).toFixed(1)}`).join(' ')}
                                fill="none"
                                stroke={COLORS[f]}
                                strokeWidth={f === 60 ? 2 : 1.3}
                                opacity={f === 60 ? 1 : 0.8}
                            />
                        ))}
                        {/* the measurement from the video: remaining distance ×0.55 per 0.1 s */}
                        {Array.from({ length: 10 }, (_, k) => k + 1).map((k) => (
                            <circle key={k} cx={gx(k / 10)} cy={gy(1 - 0.55 ** k)} r="3.5" fill="none" stroke="#f1f3e8" strokeWidth="1.2" />
                        ))}
                        <text x={GW - P} y={P - 10} fontSize="9.5" fill="#b5b7ae" textAnchor="end" fontFamily="var(--font-ll-mono)">
                            ○ measured in the video · lines = simulation
                        </text>
                    </svg>
                </div>
            </div>
        </Demo>
    );
}
