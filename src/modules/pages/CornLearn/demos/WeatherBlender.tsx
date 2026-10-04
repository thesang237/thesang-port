'use client';

import { useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo } from '../kit/controls';
import { useTicker } from '../kit/loop';

/**
 * Teaching copy of StalkWorld's condition blending. Each condition is a preset of numbers (its
 * `sceneProps`); picking one eases six weights to the new preset over 2.5 s (sine in-out) and every
 * value is the weighted sum. Slow states (wet, sick, dead) creep at most 0.002 per 60 Hz step, so a
 * drought takes seconds to set in. The little field is drawn from those numbers.
 */
const NAMES = ['normal', 'storm', 'drought', 'disease', 'soil', 'density'] as const;
const PROPS = [
    { minBlur: 10, sunBrightness: 4.6, windPower: 0.1, plantSpacing: 50, zoom: 1, sunColor: [255, 192, 111] },
    { minBlur: 6, sunBrightness: 1, windPower: 3, plantSpacing: 50, zoom: 1, sunColor: [209, 208, 227] },
    { minBlur: 6, sunBrightness: 6.6, windPower: 0.06, plantSpacing: 50, zoom: 1, sunColor: [255, 192, 111] },
    { minBlur: 6, sunBrightness: 3.6, windPower: 0.04, plantSpacing: 50, zoom: 1, sunColor: [255, 192, 111] },
    { minBlur: 6, sunBrightness: 4.6, windPower: 0.1, plantSpacing: 50, zoom: 1, sunColor: [255, 192, 111] },
    { minBlur: 6, sunBrightness: 5.6, windPower: 0.06, plantSpacing: 30, zoom: 0.8, sunColor: [255, 192, 111] },
];
const KEYS = ['minBlur', 'sunBrightness', 'windPower', 'plantSpacing', 'zoom'] as const;
const MAX = { minBlur: 10, sunBrightness: 6.6, windPower: 3, plantSpacing: 50, zoom: 1 };
const STEP = 1 / 60;

type View = { amounts: number[]; p: Record<(typeof KEYS)[number], number>; sun: number[]; wet: number; sick: number; death: number; t: number };

export default function WeatherBlender() {
    const host = useRef<HTMLDivElement>(null);
    const st = useRef({ from: [1, 0, 0, 0, 0, 0], to: [1, 0, 0, 0, 0, 0], amounts: [1, 0, 0, 0, 0, 0], blendT: 1, wet: 0, sick: 0.3, death: 0, acc: 0, t: 0, frame: 0 });
    const [pick, setPick] = useState(0);
    const [view, setView] = useState<View>(() => ({ amounts: [1, 0, 0, 0, 0, 0], p: { ...PROPS[0] }, sun: PROPS[0].sunColor, wet: 0, sick: 0.3, death: 0, t: 0 }));

    const choose = (i: number) => {
        const s = st.current;
        s.from = [...s.amounts];
        s.to = NAMES.map((_, k) => (k === i ? 1 : 0));
        s.blendT = 0;
        setPick(i);
    };

    useTicker(host, (_time, dt) => {
        const s = st.current;
        s.t += dt;
        if (s.blendT < 1) {
            s.blendT = Math.min(1, s.blendT + dt / 2.5);
            const e = 0.5 - 0.5 * Math.cos(Math.PI * s.blendT); // Sine.easeInOut
            for (let k = 0; k < 6; k++) s.amounts[k] = s.from[k] + (s.to[k] - s.from[k]) * e;
        }
        const am = s.amounts;
        s.acc = Math.min(s.acc + dt, STEP * 4);
        while (s.acc >= STEP) {
            s.acc -= STEP;
            const tween = (v: number, to: number) => v + Math.max(-0.002, Math.min(0.002, 0.1 * (to - v)));
            s.wet = tween(s.wet, am[1]);
            s.sick = tween(s.sick, 0.3 + 0.3 * am[3]);
            s.death = tween(s.death, am[2] + 0.3 * am[3] + 0.3 * am[5]);
        }
        if (++s.frame % 2) return;
        const p = { minBlur: 0, sunBrightness: 0, windPower: 0, plantSpacing: 0, zoom: 0 };
        const sun = [0, 0, 0];
        am.forEach((w, k) => {
            KEYS.forEach((key) => (p[key] += PROPS[k][key] * w));
            PROPS[k].sunColor.forEach((c, j) => (sun[j] += c * w));
        });
        setView({ amounts: [...am], p, sun, wet: s.wet, sick: s.sick, death: s.death, t: s.t });
    });

    const { p, sun, wet, sick, death, t } = view;
    const sunCss = `rgb(${sun.map((c) => Math.round(c)).join(',')})`;
    const sky = 0.04 + 0.025 * p.sunBrightness;
    const plantCol = (k: number) => {
        const d = Math.min(1, Math.max(0, 2 * (death - ((0.25 * k) % 1))));
        const g = [86, 150, 70];
        const dead = [150, 128, 80];
        return `rgb(${g.map((c, j) => Math.round(c + (dead[j] - c) * d)).join(',')})`;
    };
    const spacing = p.plantSpacing * 1.6;
    const count = Math.ceil(620 / spacing) + 2;
    const sway = (k: number) => Math.sin(t * (1.2 + p.windPower * 0.8) + k * 0.7) * (3 + p.windPower * 9);

    return (
        <Demo
            title="Weather: presets, blended"
            hint="Pick a condition. The six weights glide over 2.5 s; every number below is their weighted sum. Notice the slower drift of wetness and dead leaves."
        >
            <div ref={host} className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="p-4">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {NAMES.map((n, i) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => choose(i)}
                                aria-pressed={pick === i}
                                className={cn(
                                    'cl-btn cl-mono rounded-full border px-3 py-1 text-[10.5px] uppercase',
                                    pick === i
                                        ? 'border-[var(--cl-mint)] bg-[rgba(85,255,194,0.14)] text-[var(--cl-mint)]'
                                        : 'border-[var(--cl-line-2)] text-[var(--cl-dim)] hover:text-[var(--cl-ink)]',
                                )}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                    <svg viewBox="0 0 600 300" className="block w-full overflow-hidden rounded-lg border border-[var(--cl-line)]" aria-label={`Field under ${NAMES[pick]} conditions`}>
                        <rect width="600" height="300" fill={`rgb(${Math.round(sky * 255 * 0.7)},${Math.round(sky * 255)},${Math.round(sky * 255 * 0.75)})`} />
                        <g style={{ filter: `blur(${(p.minBlur * 0.25).toFixed(2)}px)` }}>
                            <circle cx="470" cy="70" r={18 + p.sunBrightness * 3} fill={sunCss} opacity={Math.min(1, 0.15 + p.sunBrightness / 8)} />
                            <circle cx="470" cy="70" r={60 + p.sunBrightness * 8} fill={sunCss} opacity={0.06 + p.sunBrightness * 0.015} />
                        </g>
                        <rect y="235" width="600" height="65" fill={`rgb(${Math.round(55 - 20 * wet)},${Math.round(42 - 10 * wet)},${Math.round(28 + 10 * wet)})`} />
                        <g transform={`translate(300 235) scale(${(1 / p.zoom).toFixed(3)}) translate(-300 -235)`}>
                            {Array.from({ length: count }, (_, k) => {
                                const x = -spacing + k * spacing + 10;
                                const s = sway(k);
                                return (
                                    <g key={k} stroke={plantCol(k)} strokeLinecap="round" fill="none">
                                        <path d={`M${x} 236 Q ${x + s * 0.3} 170 ${x + s} 110`} strokeWidth="4" />
                                        <path d={`M${x + s * 0.25} 190 q ${-26 - s} ${-10 + death * 30} ${-40 - s * 0.5} ${8 + death * 40}`} strokeWidth="3" />
                                        <path d={`M${x + s * 0.5} 160 q ${26 + s} ${-14 + death * 30} ${42 + s * 0.4} ${4 + death * 40}`} strokeWidth="3" />
                                        <path d={`M${x + s * 0.8} 130 q ${-20 - s} ${-16 + death * 24} ${-30} ${2 + death * 30}`} strokeWidth="2.5" />
                                        {sick > 0.35
                                            ? [0, 1, 2].map((j) => (
                                                  <circle key={j} cx={x + s * 0.4 + (j - 1) * 12} cy={175 - j * 18} r="2.2" fill="rgb(70,60,35)" stroke="none" opacity={(sick - 0.3) * 3} />
                                              ))
                                            : null}
                                    </g>
                                );
                            })}
                        </g>
                        {wet > 0.02
                            ? Array.from({ length: 70 }, (_, k) => {
                                  const x = (k * 97 + ((t * 300) % 600)) % 640;
                                  const y = (k * 53 + t * 900) % 320;
                                  return <line key={k} x1={x} y1={y} x2={x - 6} y2={y + 18} stroke="rgba(210,225,240,0.5)" strokeWidth="1" opacity={wet} />;
                              })
                            : null}
                    </svg>
                </div>
                <div className="space-y-3 border-t border-[var(--cl-line)] p-4 lg:border-l lg:border-t-0">
                    <div className="cl-mono text-[10px] uppercase text-[var(--cl-faint)]">Weights (ease over 2.5 s)</div>
                    {NAMES.map((n, k) => (
                        <div key={n} className="flex items-center gap-2">
                            <span className="cl-mono w-[58px] text-[10.5px] text-[var(--cl-dim)]">{n}</span>
                            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(214,255,232,0.08)]">
                                <span className="absolute inset-y-0 left-0 bg-[var(--cl-mint)]" style={{ width: `${view.amounts[k] * 100}%` }} />
                            </span>
                            <span className="cl-mono w-9 text-right text-[10.5px] tabular-nums text-[var(--cl-ink)]">{view.amounts[k].toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="cl-mono pt-2 text-[10px] uppercase text-[var(--cl-faint)]">Blended values</div>
                    {KEYS.map((key) => (
                        <div key={key} className="flex items-center gap-2">
                            <span className="cl-mono w-[92px] text-[10.5px] text-[var(--cl-dim)]">{key}</span>
                            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(214,255,232,0.08)]">
                                <span className="absolute inset-y-0 left-0 bg-[var(--cl-gold)]" style={{ width: `${Math.min(1, p[key] / MAX[key]) * 100}%` }} />
                            </span>
                            <span className="cl-mono w-9 text-right text-[10.5px] tabular-nums text-[var(--cl-ink)]">{p[key].toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="cl-mono pt-2 text-[10px] uppercase text-[var(--cl-faint)]">Slow states (max 0.002 a step)</div>
                    {[
                        ['wet', wet],
                        ['sick', sick],
                        ['dead leaves', death],
                    ].map(([l, v]) => (
                        <div key={l as string} className="flex items-center gap-2">
                            <span className="cl-mono w-[92px] text-[10.5px] text-[var(--cl-dim)]">{l as string}</span>
                            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(214,255,232,0.08)]">
                                <span className="absolute inset-y-0 left-0 bg-[var(--cl-amber)]" style={{ width: `${Math.min(1, v as number) * 100}%` }} />
                            </span>
                            <span className="cl-mono w-9 text-right text-[10.5px] tabular-nums text-[var(--cl-ink)]">{(v as number).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <span className="cl-mono text-[10.5px] text-[var(--cl-dim)]">sun colour</span>
                        <span className="size-5 rounded-full border border-[var(--cl-line-2)]" style={{ background: sunCss }} />
                    </div>
                </div>
            </div>
        </Demo>
    );
}
