/* eslint-disable react-hooks/refs */
'use client';

import { type ReactNode, useCallback, useState } from 'react';

import type { NoiseType, Params } from './types';

type SliderRowProps = {
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    onChange: (v: number) => void;
};

function SliderRow({ label, min, max, step, defaultValue, onChange }: SliderRowProps) {
    const [val, setVal] = useState(defaultValue);
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = parseFloat(e.target.value);
            setVal(v);
            onChange(v);
        },
        [onChange],
    );
    return (
        <div className="flex items-center gap-1 mb-[3px]">
            <span className="shrink-0 w-[52px] text-[10px] text-[#555]">{label}</span>
            <input type="range" min={min} max={max} step={step} defaultValue={defaultValue} onChange={handleChange} className="flex-1 h-[14px] min-w-0 accent-[#333]" />
            <span className="shrink-0 w-7 text-right text-[10px] text-[#888] tabular-nums">{step < 1 ? val.toFixed(2) : Math.round(val)}</span>
        </div>
    );
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <button
                className="w-full flex justify-between items-center py-1 border-t border-[#eee] font-semibold text-[11px] text-left cursor-pointer bg-transparent"
                onClick={() => setOpen((o) => !o)}
            >
                {title}
                <span className="text-[12px] text-[#aaa]">{open ? '−' : '+'}</span>
            </button>
            {open && <div className="py-1 pb-0.5">{children}</div>}
        </div>
    );
}

type Props = {
    paramsRef: { current: Params };
    isOrtho: boolean;
    onToggleCamera: () => void;
    onBgChange: (color: string) => void;
};

export function ControlPanel({ paramsRef, isOrtho, onToggleCamera, onBgChange }: Props) {
    const p = paramsRef.current;

    const set = useCallback(
        <K extends keyof Params>(key: K, value: Params[K]) => {
            paramsRef.current[key] = value;
        },
        [paramsRef],
    );

    return (
        <div className="fixed top-[10px] right-[10px] bg-white/95 border border-[#ddd] rounded-[8px] px-3 py-2.5 font-[Inter,sans-serif] text-[11px] text-[#333] w-[200px] z-[1000] select-none max-h-[calc(100vh-20px)] overflow-y-auto leading-[1.3]">
            <div className="font-semibold mb-1.5 text-[12px]">Parameters</div>

            <Section title="Noise" defaultOpen>
                <div className="flex items-center gap-1 mb-[3px]">
                    <span className="shrink-0 w-[52px] text-[10px] text-[#555]">Type</span>
                    <select
                        defaultValue={p.noiseType}
                        onChange={(e) => set('noiseType', e.target.value as NoiseType)}
                        className="w-full px-1 py-0.5 border border-[#ccc] rounded-[3px] font-[Inter,sans-serif] text-[10px] mt-0.5"
                    >
                        <option value="perlin">Perlin</option>
                        <option value="ridged">Ridged</option>
                        <option value="billow">Billow</option>
                        <option value="fbm">FBM</option>
                        <option value="waveRadial">Radial</option>
                        <option value="wavePlanar">Planar</option>
                        <option value="waveCross">Cross</option>
                        <option value="waveSpiral">Spiral</option>
                        <option value="waveDiamond">Diamond</option>
                    </select>
                </div>
                <SliderRow label="Speed" min={0} max={2} step={0.01} defaultValue={p.speed} onChange={(v) => set('speed', v)} />
                <SliderRow label="Freq" min={0.05} max={0.8} step={0.01} defaultValue={p.freq} onChange={(v) => set('freq', v)} />
                <SliderRow label="Exag" min={0.1} max={2.0} step={0.01} defaultValue={p.exag} onChange={(v) => set('exag', v)} />
                <SliderRow label="Scale" min={0.5} max={3.0} step={0.01} defaultValue={p.scaleMax} onChange={(v) => set('scaleMax', v)} />
            </Section>

            <Section title="Color">
                <div className="flex items-center gap-1 mb-[3px]">
                    <span className="shrink-0 w-[52px] text-[10px] text-[#555]">Bright</span>
                    <input
                        type="color"
                        defaultValue={p.brightColor}
                        onChange={(e) => set('brightColor', e.target.value)}
                        className="w-7 h-[18px] border border-[#ccc] rounded-[3px] cursor-pointer p-0"
                    />
                    <span className="shrink-0 ml-1 text-[10px] text-[#555]">Dark</span>
                    <input type="color" defaultValue={p.darkColor} onChange={(e) => set('darkColor', e.target.value)} className="w-7 h-[18px] border border-[#ccc] rounded-[3px] cursor-pointer p-0" />
                </div>
                <SliderRow label="Mix" min={0} max={3} step={0.01} defaultValue={p.colorMix} onChange={(v) => set('colorMix', v)} />
                <SliderRow label="Contrast" min={0.1} max={5.0} step={0.01} defaultValue={p.contrast} onChange={(v) => set('contrast', v)} />
                <div className="flex items-center gap-1 mb-[3px]">
                    <span className="shrink-0 w-[52px] text-[10px] text-[#555]">BG</span>
                    <input
                        type="color"
                        defaultValue={p.bgColor}
                        onChange={(e) => {
                            set('bgColor', e.target.value);
                            onBgChange(e.target.value);
                        }}
                        className="w-7 h-[18px] border border-[#ccc] rounded-[3px] cursor-pointer p-0"
                    />
                </div>
            </Section>

            <Section title="Scale Axis">
                <SliderRow label="X" min={0} max={3} step={0.01} defaultValue={p.scaleX} onChange={(v) => set('scaleX', v)} />
                <SliderRow label="Y" min={0} max={3} step={0.01} defaultValue={p.scaleY} onChange={(v) => set('scaleY', v)} />
                <SliderRow label="Z" min={0} max={3} step={0.01} defaultValue={p.scaleZ} onChange={(v) => set('scaleZ', v)} />
            </Section>

            <Section title="Grid Size">
                <SliderRow label="X" min={1} max={20} step={1} defaultValue={p.gridX} onChange={(v) => set('gridX', v)} />
                <SliderRow label="Y" min={1} max={20} step={1} defaultValue={p.gridY} onChange={(v) => set('gridY', v)} />
                <SliderRow label="Z" min={1} max={20} step={1} defaultValue={p.gridZ} onChange={(v) => set('gridZ', v)} />
            </Section>

            <div className="mt-1.5 border-t border-[#eee] pt-1.5">
                <button onClick={onToggleCamera} className="w-full py-1 border border-[#ccc] rounded-[4px] bg-[#f5f5f5] font-[Inter,sans-serif] text-[10px] font-semibold text-[#333] cursor-pointer">
                    Camera: {isOrtho ? 'Orthographic' : 'Perspective'}
                </button>
            </div>
        </div>
    );
}
