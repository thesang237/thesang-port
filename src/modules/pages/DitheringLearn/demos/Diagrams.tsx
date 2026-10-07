'use client';
import { useState } from 'react';

import { RangeControl, SelectControl } from '@/modules/pages/Dithering/Controls';
import { bayerThreshold } from '@/modules/pages/Dithering/math';
const STAGES = [
    ['Scene', 'The subject, camera and lights draw a continuous image. The shader does not need to know which 3D object made it.'],
    ['Sample', 'A block of source pixels becomes one sample. This is independent of how large the printed mark will be.'],
    ['Tone', 'Exposure, contrast and midtone lift shape RGB. Weighted brightness becomes the amount of ink to use.'],
    ['Screen', 'A repeating matrix, a seed or a distance function decides where to place that ink.'],
    ['Palette', 'The coverage selects black/white, a blend of ink/paper, or separately quantized RGB channels.'],
    ['Surface', 'Paper grain, scanlines and edge falloff modify the finished colours. Bloom can wrap the print pass.'],
];
export function PipelineMap() {
    const [active, setActive] = useState(0);
    return (
        <div className="dl-pipeline">
            <span className="dl-kicker">Select a stage to inspect its job</span>
            <div>
                {STAGES.map(([name], i) => (
                    <button type="button" key={name} aria-pressed={i === active} onClick={() => setActive(i)}>
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        {name}
                    </button>
                ))}
            </div>
            <p aria-live="polite">{STAGES[active][1]}</p>
        </div>
    );
}
export function ToneComparison() {
    return (
        <div className="dl-swatches">
            {[
                ['Red', [1, 0, 0]],
                ['Green', [0, 1, 0]],
                ['Blue', [0, 0, 1]],
                ['Midgray', [0.5, 0.5, 0.5]],
            ].map(([name, rgb]) => {
                const values = rgb as number[];
                return (
                    <div key={String(name)}>
                        <span style={{ background: `rgb(${values.map((n) => n * 255).join(',')})` }} />
                        <strong>{name}</strong>
                        <small>RGB sum: {values.reduce((a, b) => a + b, 0).toFixed(2)}</small>
                        <small>Weighted: {(values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722).toFixed(2)}</small>
                    </div>
                );
            })}
            <p>These are linear RGB inputs. A sum cannot distinguish red, green and blue; the weights can.</p>
        </div>
    );
}
export function MatrixLab() {
    const [size, setSize] = useState<2 | 4 | 8>(4);
    const [brightness, setBrightness] = useState(0.5);
    return (
        <div className="dl-matrix-lab">
            <header>
                <div>
                    <span className="dl-kicker">Threshold inspector</span>
                    <h4>The numbers beneath the image</h4>
                    <p>Raise brightness. Watch cells turn into paper as their threshold is crossed.</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setSize(4);
                        setBrightness(0.5);
                    }}
                >
                    Reset matrix
                </button>
            </header>
            <div className="dl-matrix-layout">
                <div className="dl-matrix" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                    {Array.from({ length: size * size }, (_, i) => {
                        const t = bayerThreshold(i % size, Math.floor(i / size), size);
                        return (
                            <div
                                key={i}
                                style={{ background: brightness >= t ? 'var(--print-surface)' : 'var(--print-ink)', color: brightness >= t ? 'var(--print-ink)' : 'var(--print-surface)' }}
                                title={`Threshold ${t.toFixed(3)}`}
                            >
                                {t.toFixed(2)}
                            </div>
                        );
                    })}
                </div>
                <div className="print-group">
                    <SelectControl
                        label="Matrix size"
                        value={size}
                        options={[
                            { value: 2, label: '2 × 2' },
                            { value: 4, label: '4 × 4' },
                            { value: 8, label: '8 × 8' },
                        ]}
                        onChange={(v) => setSize(Number(v) as 2 | 4 | 8)}
                        help="Larger matrices give more distinct coverage steps."
                    />
                    <RangeControl
                        dial={{ label: 'Brightness', min: 0, max: 1, step: 0.01, help: 'Uniform input brightness, compared to every threshold.' }}
                        value={brightness}
                        onChange={setBrightness}
                    />
                    <p className="dl-mini">Try 0, then 1. All cells must become ink, then paper. At 0.5, exactly half are paper.</p>
                </div>
            </div>
        </div>
    );
}
