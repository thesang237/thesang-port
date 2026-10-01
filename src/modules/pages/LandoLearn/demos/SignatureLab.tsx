'use client';

import { useMemo, useState } from 'react';

import { Btn, Demo, Group, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { LN, SIGNATURE_BIG } from '../kit/source';

type Preset = 'source' | 'equal' | 'length' | 'together';
const DEFAULTS = { progress: 1, preset: 'source' as Preset, width: 14, xray: false };

const clamp01 = gsap.utils.clamp(0, 1);

function measure() {
    const ns = 'http://www.w3.org/2000/svg';
    const tmp = document.createElementNS(ns, 'svg');
    tmp.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
    document.body.appendChild(tmp);
    const out = SIGNATURE_BIG.map((d) => {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        tmp.appendChild(path);
        return path.getTotalLength();
    });
    tmp.remove();
    return out;
}

/** How a “hand-drawn” signature is sequenced: each stroke gets its own window of the progress. */
export default function SignatureLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    // real path lengths (for the "by length" preset) — measured once in a throwaway SVG (client-only guide)
    const [lengths] = useState(measure);

    const windows = useMemo<[number, number][]>(() => {
        if (p.preset === 'source')
            return [
                [0.3, 0.3],
                [0.72, 0.16],
                [0.9, 0.08],
                [0.97, 0.03],
            ];
        if (p.preset === 'equal') return SIGNATURE_BIG.map((_, i) => [i / 4, 1 / 4]);
        if (p.preset === 'together') return SIGNATURE_BIG.map(() => [0, 1]);
        const total = lengths.reduce((a, b) => a + b, 0);
        let at = 0;
        return lengths.map((l) => {
            const w: [number, number] = [at / total, l / total];
            at += l;
            return w;
        });
    }, [p.preset, lengths]);

    const local = windows.map(([a, d]) => clamp01((p.progress - a) / d));

    const play = () => {
        const o = { v: 0 };
        gsap.to(o, { v: 1, duration: 1.8, ease: 'none', onUpdate: () => set('progress', o.v) });
    };

    return (
        <Demo
            title="Signature draw lab"
            hint="Drag “progress” like a scroll bar. Each stroke only draws inside its own window of that progress — switch presets to feel the difference."
            onReset={reset}
            controls={
                <>
                    <Btn primary onClick={play}>
                        ▶ Draw
                    </Btn>
                    <Slider label="progress" value={p.progress} min={0} max={1} step={0.001} onChange={(v) => set('progress', v)} help="Stands in for the pinned hero’s scroll progress." />
                    <Group title="Sequencing">
                        <Segmented
                            label="stroke windows"
                            options={[
                                { value: 'source', label: 'source' },
                                { value: 'equal', label: 'equal quarters' },
                                { value: 'length', label: 'by length' },
                                { value: 'together', label: 'all at once' },
                            ]}
                            value={p.preset}
                            onChange={(v) => set('preset', v)}
                        />
                        <Slider
                            label="pen width"
                            value={p.width}
                            min={2}
                            max={40}
                            step={1}
                            onChange={(v) => set('width', v)}
                            format={(v) => `${v}`}
                            help="Source: 14 (hero), 46 for the “Collabs” script."
                        />
                        <Toggle label="x-ray" checked={p.xray} onChange={(v) => set('xray', v)} help="Show each whole path faintly, and where it starts." />
                    </Group>
                    <Readout
                        items={windows.map(([a, d], i) => ({
                            label: `stroke ${i + 1}`,
                            value: `${a.toFixed(2)} → ${(a + d).toFixed(2)}`,
                            color: local[i] > 0 && local[i] < 1 ? 'var(--ll-lime)' : undefined,
                        }))}
                    />
                </>
            }
            footer={
                <div className="space-y-1">
                    {windows.map(([a, d], i) => (
                        <div key={i} className="flex h-3 items-center">
                            <span className="ll-mono w-[70px] shrink-0 text-[9.5px] text-[var(--ll-dim)]">{`stroke ${i + 1}`}</span>
                            <div className="relative h-full flex-1 rounded-sm bg-white/[0.03]">
                                <span className="absolute inset-y-0 rounded-sm bg-[var(--ll-lime)] opacity-30" style={{ left: `${a * 100}%`, width: `${d * 100}%` }} />
                                <span className="absolute inset-y-0 rounded-sm bg-[var(--ll-lime)]" style={{ left: `${a * 100}%`, width: `${d * local[i] * 100}%` }} />
                                <span className="absolute inset-y-[-2px] w-px bg-[#f1f3e8]" style={{ left: `${p.progress * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            }
        >
            <div className="flex min-h-[380px] items-center justify-center p-6" style={{ background: LN.dark }}>
                <svg viewBox="-40 -20 980 760" className="h-auto w-full max-w-[560px]" fill="none" aria-label="Signature being drawn">
                    {p.xray && SIGNATURE_BIG.map((d, i) => <path key={`x${i}`} d={d} stroke="rgba(241,243,232,0.25)" strokeWidth={2} strokeDasharray="6 6" />)}
                    {SIGNATURE_BIG.map((d, i) => (
                        <path
                            key={i}
                            d={d}
                            pathLength={1}
                            stroke={LN.lime}
                            strokeWidth={p.width}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ strokeDasharray: 1, strokeDashoffset: 1 - local[i] }}
                        />
                    ))}
                    {p.xray &&
                        SIGNATURE_BIG.map((d, i) => {
                            const m = /^M\s*([\d.]+)[ ,]([\d.]+)/.exec(d);
                            return m ? (
                                <g key={`s${i}`}>
                                    <circle cx={m[1]} cy={m[2]} r={9} fill="#ffb36b" />
                                    <text x={Number(m[1]) + 14} y={Number(m[2]) + 5} fill="#ffb36b" fontSize="22" fontFamily="var(--font-ll-mono)">
                                        {i + 1}
                                    </text>
                                </g>
                            ) : null;
                        })}
                </svg>
            </div>
        </Demo>
    );
}
