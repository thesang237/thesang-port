'use client';

import { Demo, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';
import { damp, lerp } from '../kit/source';

const RATES = [
    { fps: 30, color: '#d9572b' },
    { fps: 60, color: '#5b4daa' },
    { fps: 120, color: '#3d8f00' },
] as const;
const DEFAULTS = { method: 'damp (page)' as 'damp (page)' | 'lerp per frame', lambda: 3.2, k: 0.1 };
const SECONDS = 1.6;

/** simulate a follower jumping from 0 to 1 at a given frame rate */
function run(fps: number, method: string, lambda: number, k: number) {
    const dt = 1 / fps;
    const pts: [number, number][] = [[0, 0]];
    let v = 0;
    for (let t = dt; t <= SECONDS + 1e-6; t += dt) {
        v = method === 'lerp per frame' ? lerp(v, 1, k) : damp(v, 1, lambda, dt);
        pts.push([t, v]);
    }
    return pts;
}

/**
 * Chapter 07: why the page smooths with `damp` (1 − e^(−λ·dt)) instead of a fixed lerp per frame.
 * The same follower on a 30, 60 and 120 Hz screen.
 */
export default function DampVsLerp() {
    const { p, set, reset } = useParams(DEFAULTS);
    const G = { w: 600, h: 200 };
    return (
        <Demo
            title="damp vs lerp — the same follow on three screens"
            hint="A follower jumps from 0 to 1. With damp the three screens agree; with a per-frame lerp the 120 Hz one is twice as fast as 60 Hz."
            onReset={reset}
            controls={
                <>
                    <Segmented label="smoothing" options={['damp (page)', 'lerp per frame']} value={p.method} onChange={(v) => set('method', v)} />
                    {p.method === 'damp (page)' ? (
                        <Slider label="λ (per second)" value={p.lambda} min={0.5} max={15} step={0.1} onChange={(v) => set('lambda', v)} help="3.2 = card frame, 5.5 = picture, 10 = scroll speed." />
                    ) : (
                        <Slider
                            label="lerp per frame"
                            value={p.k}
                            min={0.01}
                            max={0.5}
                            step={0.01}
                            onChange={(v) => set('k', v)}
                            help="Closes this share of the gap every frame, however long the frame was."
                        />
                    )}
                    <div className="space-y-1">
                        {RATES.map((r) => (
                            <div key={r.fps} className="kl-mono flex items-center gap-2 text-[11px]">
                                <span className="h-0.5 w-5" style={{ background: r.color }} />
                                {r.fps} Hz screen
                            </div>
                        ))}
                    </div>
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <svg viewBox={`-30 -10 ${G.w + 40} ${G.h + 34}`} className="w-full" role="img" aria-label="Follower position over time at three frame rates">
                    {[0, 0.5, 1].map((v) => (
                        <g key={v}>
                            <line x1={0} x2={G.w} y1={G.h - v * G.h} y2={G.h - v * G.h} stroke="rgba(0,0,0,0.08)" />
                            <text x={-8} y={G.h - v * G.h + 4} fontSize={10} textAnchor="end" fontFamily="ui-monospace" fill="#8a8a94">
                                {v}
                            </text>
                        </g>
                    ))}
                    {[0, 0.4, 0.8, 1.2, 1.6].map((s) => (
                        <text key={s} x={(s / SECONDS) * G.w} y={G.h + 16} fontSize={10} textAnchor="middle" fontFamily="ui-monospace" fill="#8a8a94">
                            {`${s}s`}
                        </text>
                    ))}
                    {RATES.map((r) => (
                        <path
                            key={r.fps}
                            d={run(r.fps, p.method, p.lambda, p.k)
                                .map(([t, v], i) => `${i ? 'L' : 'M'}${((t / SECONDS) * G.w).toFixed(1)},${(G.h - v * G.h).toFixed(1)}`)
                                .join('')}
                            fill="none"
                            stroke={r.color}
                            strokeWidth={2}
                        />
                    ))}
                </svg>
            </div>
        </Demo>
    );
}
