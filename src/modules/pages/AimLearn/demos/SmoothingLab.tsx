'use client';

import { useMemo } from 'react';

import { Demo, Readout, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';
import { smooth } from '../kit/source';

const DEFAULTS = { smoothing: 70, fps: 60 };
const T = 2.2; // seconds drawn
const W = 560;
const H = 180;

// the scroll input: a jump up at 0.2s and a smaller jump back at 1.2s (like two wheel flicks)
const input = (t: number) => (t < 0.2 ? 0 : t < 1.2 ? 1 : 0.35);

function simulate(fps: number, smoothing: number, mode: 'page' | 'naive') {
    const out: [number, number][] = [];
    let cur = 0;
    const k = Math.max(1 - smoothing / 100, 0.01);
    for (let i = 0; i <= T * fps; i++) {
        const t = i / fps;
        const target = input(t);
        cur = mode === 'page' ? smooth(cur, target, smoothing, 60 / fps) : cur + (target - cur) * k;
        out.push([t, cur]);
    }
    return out;
}

const timeTo90 = (pts: [number, number][]) => {
    const hit = pts.find(([t, v]) => t >= 0.2 && v >= 0.9);
    return hit ? hit[0] - 0.2 : null;
};

const toPath = (pts: [number, number][]) => pts.map(([t, v], i) => `${i ? 'L' : 'M'}${((t / T) * W).toFixed(1)},${(H - 10 - v * (H - 24)).toFixed(1)}`).join(' ');

/** Smoothing chases the scroll position. The page's version takes the same time at any frame rate; a naive version doesn't. */
export default function SmoothingLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const page = useMemo(() => simulate(p.fps, p.smoothing, 'page'), [p.fps, p.smoothing]);
    const naive = useMemo(() => simulate(p.fps, p.smoothing, 'naive'), [p.fps, p.smoothing]);
    const a = timeTo90(page);
    const b = timeTo90(naive);
    const inputPath = `M0,${H - 10} L${(0.2 / T) * W},${H - 10} L${(0.2 / T) * W},${H - 10 - (H - 24)} L${(1.2 / T) * W},${H - 10 - (H - 24)} L${(1.2 / T) * W},${H - 10 - 0.35 * (H - 24)} L${W},${H - 10 - 0.35 * (H - 24)}`;

    return (
        <Demo
            title="Smoothing lab: chase the scroll, same speed at any frame rate"
            hint="The black line is the raw scroll (two jumps). Orange is the page’s smoothing; blue dashed is a naive “move 30% per frame”. Change the frame rate and watch which one stays put."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="smoothing"
                        value={p.smoothing}
                        min={0}
                        max={95}
                        step={1}
                        onChange={(v) => set('smoothing', v)}
                        help="The page uses 70: each 60Hz frame closes 30% of the gap. 0 = no smoothing; 95 = very floaty."
                    />
                    <Segmented
                        label="screen frame rate"
                        options={[
                            { value: '30', label: '30 fps' },
                            { value: '60', label: '60 fps' },
                            { value: '120', label: '120 fps' },
                        ]}
                        value={String(p.fps)}
                        onChange={(v) => set('fps', Number(v))}
                    />
                    <Readout
                        items={[
                            { label: 'page → 90%', value: a === null ? '—' : `${(a * 1000).toFixed(0)} ms`, color: 'var(--al-accent-ink)' },
                            { label: 'naive → 90%', value: b === null ? '—' : `${(b * 1000).toFixed(0)} ms`, color: 'var(--al-blue)' },
                        ]}
                    />
                    <p className="text-[11.5px] leading-snug text-[var(--al-faint)]">
                        The page’s formula, per frame: <code className="al-code-inline !whitespace-normal">cur = target + (cur − target) × 0.7^(60/fps)</code>. The exponent turns “per frame” into “per
                        second”.
                    </p>
                </>
            }
        >
            <div className="bg-[var(--al-bg-2)] p-4">
                <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Raw scroll input and two smoothed versions over time">
                    {[0, 0.5, 1, 1.5, 2].map((t) => (
                        <g key={t}>
                            <line x1={(t / T) * W} x2={(t / T) * W} y1="0" y2={H - 10} stroke="var(--al-line-2)" strokeWidth="0.5" />
                            <text x={(t / T) * W + 3} y={H - 1} fontSize="9" fill="var(--al-faint)" style={{ fontFamily: 'var(--font-al-mono), monospace' }}>
                                {`${t}s`}
                            </text>
                        </g>
                    ))}
                    <path d={inputPath} fill="none" stroke="var(--al-ink)" strokeWidth="1.2" />
                    <path d={toPath(naive)} fill="none" stroke="var(--al-blue)" strokeWidth="1.6" strokeDasharray="4 3" />
                    <path d={toPath(page)} fill="none" stroke="var(--al-accent)" strokeWidth="2" />
                </svg>
                <div className="al-mono mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10.5px] text-[var(--al-dim)]">
                    <span>
                        <span className="mr-1 inline-block h-[2px] w-4 bg-[var(--al-ink)] align-middle" />
                        raw scroll
                    </span>
                    <span>
                        <span className="mr-1 inline-block h-[2px] w-4 bg-[var(--al-accent)] align-middle" />
                        the page (frame-rate independent)
                    </span>
                    <span>
                        <span className="mr-1 inline-block h-[2px] w-4 border-t-2 border-dashed border-[var(--al-blue)] align-middle" />
                        naive per-frame
                    </span>
                </div>
            </div>
        </Demo>
    );
}
