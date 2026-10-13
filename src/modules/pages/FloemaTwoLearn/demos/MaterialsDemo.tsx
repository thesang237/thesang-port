'use client';
import { useState } from 'react';

import { useParams } from '../kit/runtime';
import ThreeStage from '../kit/ThreeStage';
import { Demo, Slider } from '../kit/ui';
const defaults = { roughness: 0.85, metalness: 0.08, normal: 0.55, color: '#827a6a', dpr: 1.5 };
const presets = [
    { label: 'Plastic', roughness: 0.85, metalness: 0.08, color: '#827a6a' },
    { label: 'Laminate', roughness: 0.85, metalness: 0.08, color: '#b28d66' },
    { label: 'Steel', roughness: 0.5, metalness: 0.62, color: '#707677' },
];
export default function MaterialsDemo() {
    const { p, ref, set, reset } = useParams(defaults);
    const [playing, play] = useState(false);
    const [version, bump] = useState(0);
    return (
        <Demo
            title="One object, different finishes"
            hint="Choose a source preset. Drag the object or focus it and use arrow keys."
            reset={() => {
                reset();
                play(false);
                bump((v) => v + 1);
            }}
            tryThis="Set roughness to zero and metalness to one. The tight reflections are useful for chrome, but wrong for the recycled-plastic finish."
            controls={
                <>
                    <div className="f2l-presets" aria-label="Material presets">
                        {presets.map((item) => (
                            <button
                                key={item.label}
                                aria-pressed={p.color === item.color}
                                onClick={() => {
                                    set('roughness', item.roughness);
                                    set('metalness', item.metalness);
                                    set('color', item.color);
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <Slider label="Roughness" value={p.roughness} min={0} max={1} step={0.01} onChange={(v) => set('roughness', v)} help="Spreads highlights across the surface as it increases." />
                    <Slider label="Metalness" value={p.metalness} min={0} max={1} step={0.01} onChange={(v) => set('metalness', v)} help="Changes the surface from dielectric to metallic response." />
                    <Slider
                        label="Normal detail"
                        value={p.normal}
                        min={0}
                        max={2}
                        step={0.05}
                        onChange={(v) => set('normal', v)}
                        help="Adds lighting detail without changing the cube’s outline. Source strength: 0.55."
                    />
                    <button className="f2l-button" aria-pressed={playing} onClick={() => play((v) => !v)}>
                        {playing ? 'Pause rotation Ⅱ' : 'Play rotation →'}
                    </button>
                    <small>Neutral teaching geometry. Source texture maps are explained below.</small>
                </>
            }
        >
            <ThreeStage key={version} mode="material" params={ref} playing={playing} />
            <span className="f2l-gpu-readout" data-gpu-readout>
                Drag / arrow keys to rotate
            </span>
        </Demo>
    );
}
