'use client';

import { useState } from 'react';

import { Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { gentle } from '../kit/gl';
import { curvePath, mapX, mapY } from '../kit/plot';
import { clamp01, smooth } from '../kit/source';

/**
 * The page's little vocabulary of windows: smooth(a, b, v) (smoothstep) on the story position, and
 * gentle(a, b, t) (sine in-out) on time. Presets are the real windows from the engine and the worlds.
 */
type Preset = { id: string; label: string; a: number; b: number; invert?: boolean; ease: 'smooth' | 'gentle'; input: string; where: string; feel: string };

const PRESETS: Preset[] = [
    {
        id: 'wipe',
        label: 'Wipe progress',
        a: 0.12,
        b: 0.88,
        ease: 'smooth',
        input: 'move fraction f',
        where: 'Engine.tick',
        feel: 'The edge waits, then sweeps decisively, then is gone before the move lands.',
    },
    {
        id: 'title',
        label: 'Title fades out',
        a: 0.3,
        b: 0.6,
        invert: true,
        ease: 'smooth',
        input: 'distance from stop (chapters)',
        where: 'Engine TITLE_OUT',
        feel: 'Late enough that a wipe cuts the title instead of fading it first.',
    },
    {
        id: 'helix',
        label: 'DNA field fades',
        a: 0.45,
        b: 1.0,
        invert: true,
        ease: 'smooth',
        input: 'science local s',
        where: 'ScienceWorld.update',
        feel: 'The DNA gives way while the network card covers it.',
    },
    {
        id: 'pot',
        label: 'Pot rises in',
        a: 1.42,
        b: 2.0,
        ease: 'smooth',
        input: 'science local s',
        where: 'ScienceWorld.update',
        feel: 'Arrives during the move to the pot stop, not during the network’s own step.',
    },
    { id: 'trace', label: 'Title outline traces', a: 0, b: 2.4, ease: 'gentle', input: 'seconds since start', where: 'Engine DRAW', feel: 'Slow, soft start and end: 2.4 s for the outline.' },
    {
        id: 'fill',
        label: 'Title fills',
        a: 1.9,
        b: 3.5,
        ease: 'gentle',
        input: 'seconds since start',
        where: 'Engine DRAW',
        feel: 'Overlaps the trace’s last half second, so the two read as one gesture.',
    },
];

export default function WindowMapper() {
    const [pid, setPid] = useState('wipe');
    const preset = PRESETS.find((p) => p.id === pid)!;
    const [a, setA] = useState(preset.a);
    const [b, setB] = useState(preset.b);
    const [ease, setEase] = useState<'smooth' | 'gentle' | 'linear'>(preset.ease);
    const [invert, setInvert] = useState(!!preset.invert);
    const span = Math.max(0.1, preset.b - preset.a);
    const lo = Math.min(preset.a - span * 0.6, a);
    const hi = Math.max(preset.b + span * 0.6, b);
    const [v, setV] = useState((preset.a + preset.b) / 2);

    const choose = (id: string) => {
        const p = PRESETS.find((x) => x.id === id)!;
        setPid(id);
        setA(p.a);
        setB(p.b);
        setEase(p.ease);
        setInvert(!!p.invert);
        setV((p.a + p.b) / 2);
    };

    const fn = (x: number) => {
        const y = ease === 'smooth' ? smooth(a, b, x) : ease === 'gentle' ? gentle(a, b, x) : clamp01((x - a) / (b - a));
        return invert ? 1 - y : y;
    };
    const out = fn(v);
    const w = 600;
    const h = 220;
    const formula =
        ease === 'smooth'
            ? `t = clamp((v − ${a.toFixed(2)}) / ${(b - a).toFixed(2)});  y = t² · (3 − 2t)`
            : ease === 'gentle'
              ? `y = 0.5 − 0.5 · cos(π · clamp((v − ${a.toFixed(2)}) / ${(b - a).toFixed(2)}))`
              : `y = clamp((v − ${a.toFixed(2)}) / ${(b - a).toFixed(2)})`;

    return (
        <Demo
            title="Window mapper: turn any number into 0 → 1"
            hint="Pick one of the page’s real windows, then drag the input. The output is what that animation uses this frame."
            onReset={() => choose(pid)}
            controls={
                <>
                    <Segmented label="the page’s windows" options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} value={pid} onChange={choose} />
                    <Group title="Window">
                        <Slider label="a (starts)" value={a} min={lo} max={hi} step={0.01} onChange={(x) => setA(Math.min(x, b - 0.01))} help="Below a the output is 0 (or 1 if inverted)." />
                        <Slider label="b (ends)" value={b} min={lo} max={hi} step={0.01} onChange={(x) => setB(Math.max(x, a + 0.01))} help="Above b it is 1." />
                        <Segmented label="easing" options={['smooth', 'gentle', 'linear'] as const} value={ease} onChange={(e) => setEase(e)} />
                        <Toggle label="invert (1 − y)" checked={invert} onChange={setInvert} help="Fades out instead of in." />
                    </Group>
                </>
            }
        >
            <div className="p-4 sm:p-5">
                <svg viewBox={`0 0 ${w} ${h + 26}`} className="block w-full" aria-label="Window curve">
                    {[0, 0.5, 1].map((y) => (
                        <line key={y} x1="0" x2={w} y1={mapY(y, h, -0.05, 1.05)} y2={mapY(y, h, -0.05, 1.05)} stroke="rgba(214,255,232,0.1)" />
                    ))}
                    <rect x={mapX(a, w, lo, hi)} y="0" width={mapX(b, w, lo, hi) - mapX(a, w, lo, hi)} height={h} fill="rgba(85,255,194,0.06)" />
                    <path d={curvePath(fn, w, h, lo, hi, -0.05, 1.05, 200)} fill="none" stroke="#55ffc2" strokeWidth="2.2" />
                    <line x1={mapX(v, w, lo, hi)} x2={mapX(v, w, lo, hi)} y1="0" y2={h} stroke="#e9c46a" strokeDasharray="3 3" />
                    <circle cx={mapX(v, w, lo, hi)} cy={mapY(out, h, -0.05, 1.05)} r="6" fill="#e9c46a" />
                    {[a, b].map((x, i) => (
                        <text key={i} x={mapX(x, w, lo, hi)} y={h + 18} fontSize="11" textAnchor="middle" fill="rgba(214,255,232,0.6)" className="cl-mono">
                            {`${i ? 'b' : 'a'} ${x.toFixed(2)}`}
                        </text>
                    ))}
                </svg>
                <Slider label={`input v · ${preset.input}`} value={v} min={lo} max={hi} step={0.005} onChange={setV} />
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="cl-mono rounded-md border border-[var(--cl-line)] bg-[#030806] px-3 py-2 text-[11.5px] text-[#a8ffe0]">{formula}</div>
                    <div className="cl-mono flex items-center gap-2 text-[12px]">
                        <span className="text-[var(--cl-faint)]">output</span>
                        <span className="relative h-2 w-28 overflow-hidden rounded-full bg-[rgba(214,255,232,0.1)]">
                            <span className="absolute inset-y-0 left-0 bg-[var(--cl-gold)]" style={{ width: `${out * 100}%` }} />
                        </span>
                        <span className="tabular-nums text-[var(--cl-gold)]">{out.toFixed(3)}</span>
                    </div>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--cl-dim)]">
                    <span className="cl-mono text-[10.5px] uppercase text-[var(--cl-faint)]">{`${preset.where} · `}</span>
                    {preset.feel}
                </p>
            </div>
        </Demo>
    );
}
