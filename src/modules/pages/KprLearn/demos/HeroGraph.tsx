'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Readout, Slider } from '../kit/controls';
import { mapX, mapY } from '../kit/plot';

import { heroFace, sampleAt, snapshot, STAGE } from './xray';

/** properties of the hero card, each normalised to 0…1 for the graph */
const PROPS = [
    { id: 'w', label: 'width', color: '#5b4daa', norm: (s: S) => s.w / STAGE.w, fmt: (s: S) => `${s.w.toFixed(0)} px` },
    { id: 'h', label: 'height', color: '#8b7ed9', norm: (s: S) => s.h / STAGE.h, fmt: (s: S) => `${s.h.toFixed(0)} px` },
    { id: 'x', label: 'x', color: '#d9572b', norm: (s: S) => 0.5 + s.x / STAGE.w, fmt: (s: S) => `${s.x.toFixed(0)} px` },
    { id: 'ry', label: 'turn (ry)', color: '#0c0c0e', norm: (s: S) => Math.abs(s.ry) / (2 * Math.PI), fmt: (s: S) => `${((Math.abs(s.ry) / Math.PI) * 180).toFixed(0)}°` },
    { id: 'notch', label: 'notch depth', color: '#3d8f00', norm: (s: S) => Math.min(1, s.notch[3] / 90), fmt: (s: S) => `${s.notch[3].toFixed(1)} px` },
    { id: 'zoom', label: 'painting zoom', color: '#c06cff', norm: (s: S) => (s.view.zoom - 1) / 2.2, fmt: (s: S) => `${s.view.zoom.toFixed(2)}×` },
    { id: 'op', label: 'opacity', color: '#8a8a94', norm: (s: S) => s.opacity, fmt: (s: S) => s.opacity.toFixed(2) },
] as const;
type S = ReturnType<typeof snapshot>;
type PropId = (typeof PROPS)[number]['id'];

const T0 = 0;
const T1 = 12.3;
const N = 360;

/**
 * Chapter 02: the hero card's properties over the whole film, sampled from the real choreograph() —
 * the After Effects graph editor view of one card.
 */
export default function HeroGraph() {
    const [t, setT] = useState(4.6);
    const [on, setOn] = useState<PropId[]>(['w', 'h', 'ry', 'notch']);
    const samples = useMemo(() => Array.from({ length: N + 1 }, (_, i) => snapshot(sampleAt(T0 + ((T1 - T0) * i) / N).find((c) => c.key === 'hero')!.s)), []);
    const now = snapshot(sampleAt(t).find((c) => c.key === 'hero')!.s);
    const G = { w: 640, h: 240 };

    return (
        <Demo
            title="Graph editor — the hero card over the whole film"
            hint="Each line is one property of the same card, sampled from the page’s real choreography. Toggle lines, drag the playhead."
            onReset={() => {
                setT(4.6);
                setOn(['w', 'h', 'ry', 'notch']);
            }}
            controls={
                <>
                    <Slider label="film t" value={t} min={T0} max={T1} step={0.01} onChange={setT} />
                    <div className="space-y-1">
                        {PROPS.map((pr) => (
                            <button
                                key={pr.id}
                                type="button"
                                aria-pressed={on.includes(pr.id)}
                                onClick={() => setOn((o) => (o.includes(pr.id) ? o.filter((x) => x !== pr.id) : [...o, pr.id]))}
                                className={cn(
                                    'kl-btn kl-mono flex w-full items-center justify-between gap-2 border px-2 py-1 text-[11px]',
                                    on.includes(pr.id) ? 'border-[var(--kl-black)]' : 'border-transparent opacity-50',
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="size-2.5" style={{ background: pr.color }} />
                                    {pr.label}
                                </span>
                                <span className="tabular-nums text-[var(--kl-dim)]">{pr.fmt(now)}</span>
                            </button>
                        ))}
                    </div>
                    <Readout
                        items={[
                            { label: 'face', value: heroFace(now.ry), color: '#c0fb50' },
                            { label: 'picture frame', value: now.frame ? 'fixed' : 'card' },
                        ]}
                    />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                <svg viewBox={`-6 -6 ${G.w + 12} ${G.h + 30}`} className="w-full" role="img" aria-label="Hero card properties over film time">
                    {[2, 4, 6, 8, 10, 12].map((v) => (
                        <g key={v}>
                            <line x1={mapX(v, G.w, T0, T1)} x2={mapX(v, G.w, T0, T1)} y1={0} y2={G.h} stroke="rgba(0,0,0,0.07)" />
                            <text x={mapX(v, G.w, T0, T1)} y={G.h + 16} fontSize={10} textAnchor="middle" fontFamily="ui-monospace" fill="#8a8a94">
                                {v}
                            </text>
                        </g>
                    ))}
                    {/* the two half turns, where the hidden face is swapped */}
                    {[
                        [4.2, 5.1],
                        [10.15, 10.9],
                    ].map(([a, b]) => (
                        <rect key={a} x={mapX(a, G.w, T0, T1)} y={0} width={mapX(b, G.w, T0, T1) - mapX(a, G.w, T0, T1)} height={G.h} fill="rgba(192,251,80,0.25)" />
                    ))}
                    {PROPS.filter((pr) => on.includes(pr.id)).map((pr) => (
                        <path
                            key={pr.id}
                            d={samples.map((s, i) => `${i ? 'L' : 'M'}${mapX(T0 + ((T1 - T0) * i) / N, G.w, T0, T1).toFixed(1)},${mapY(pr.norm(s), G.h, -0.02, 1.02).toFixed(1)}`).join('')}
                            fill="none"
                            stroke={pr.color}
                            strokeWidth={1.8}
                        />
                    ))}
                    <line x1={mapX(t, G.w, T0, T1)} x2={mapX(t, G.w, T0, T1)} y1={0} y2={G.h} stroke="#0c0c0e" strokeDasharray="3 3" />
                </svg>
                <p className="kl-mono mt-1 text-[10.5px] uppercase text-[var(--kl-dim)]">Lime bands = the two half turns (girl → story, story → portrait). Values normalised to the graph height.</p>
            </div>
        </Demo>
    );
}
