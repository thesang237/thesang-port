'use client';
import { useState } from 'react';

import { useParams } from '../kit/runtime';
import { Demo, Readout, Slider } from '../kit/ui';
const defaults = { separation: 0, gutter: 42 };
const nodes = ['Input', 'Dials', 'Timeline', 'DOM + GPU'];
const notes = [
    'Wheel, scroll position, pointer, and keyboard supply intent.',
    'A small set of numbers describes progress, velocity, material, and drag.',
    'GSAP maps those numbers to masks, opacity, and scene changes.',
    'HTML draws the interface. Three.js draws the objects. Each has one job.',
];
export default function MapDemo() {
    const { p, set, reset } = useParams(defaults);
    const [selected, select] = useState(0);
    return (
        <Demo
            title="Pull the composition apart"
            hint="Separate the layers, then follow the signal from input to pixels."
            reset={() => {
                reset();
                select(0);
            }}
            tryThis="Set the gutter to zero. Notice how the interface loses its alignment even though the motion system has not changed."
            controls={
                <>
                    <Slider
                        label="Exploded separation"
                        value={p.separation}
                        min={0}
                        max={48}
                        onChange={(v) => set('separation', v)}
                        help="Teaching view only: separates layers that overlap in the real page."
                        suffix="px"
                    />
                    <Slider
                        label="Reference gutter"
                        value={p.gutter}
                        min={0}
                        max={96}
                        onChange={(v) => set('gutter', v)}
                        help="The source’s outer grid margin at its 1920px reference viewport."
                        suffix="px"
                    />
                    <Readout>
                        3 visual layers
                        <br />1 shared set of dials
                    </Readout>
                </>
            }
        >
            <div className="f2l-map-stage">
                <div className="f2l-stack">
                    {['SCENE / GEOMETRY', 'MOTION / MASK', 'INTERFACE / DOM'].map((label, i) => (
                        <div
                            key={label}
                            className={`f2l-stack-layer f2l-layer-${i}`}
                            style={{ transform: `translate(${i * p.separation * 0.45}px, ${-i * p.separation}px)`, paddingInline: p.gutter * 0.5 + 8 }}
                        >
                            <span>{label}</span>
                            {i === 0 ? (
                                <div className="f2l-object-outline" />
                            ) : i === 1 ? (
                                <div className="f2l-mask-rule" />
                            ) : (
                                <strong>
                                    Spaces
                                    <br />
                                    for people.
                                </strong>
                            )}
                        </div>
                    ))}
                </div>
                <div className="f2l-pipeline">
                    {nodes.map((n, i) => (
                        <button aria-pressed={selected === i} onClick={() => select(i)} key={n}>
                            {n}
                            {i < 3 && <span>→</span>}
                        </button>
                    ))}
                </div>
                <p className="f2l-pipeline-note" aria-live="polite">
                    {notes[selected]}
                </p>
            </div>
        </Demo>
    );
}
