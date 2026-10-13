'use client';
import { useState } from 'react';

import { useParams } from '../kit/runtime';
import ThreeStage from '../kit/ThreeStage';
import { Demo, Readout, Slider, Toggle } from '../kit/ui';
const defaults = { count: 22, instanced: false, dpr: 1.5 };
export default function PerformanceDemo() {
    const { p, ref, set, reset } = useParams(defaults);
    const [playing, play] = useState(false);
    const [version, bump] = useState(0);
    return (
        <Demo
            title="Measure the work, then remove it"
            hint="Run the scene. Compare separate objects with one instanced batch."
            reset={() => {
                reset();
                play(false);
                bump((v) => v + 1);
            }}
            tryThis="Raise the object count and DPR together. Then batch the objects: draw calls drop, but the higher pixel cost remains."
            controls={
                <>
                    <Slider label="Object count" value={p.count} min={1} max={300} onChange={(v) => set('count', v)} help="Identical objects in this teaching benchmark, not source assets." />
                    <Slider label="Pixel ratio" value={p.dpr} min={0.75} max={2.5} step={0.25} onChange={(v) => set('dpr', v)} help="The source caps this at 1.5. Higher values cost more pixels." />
                    <Toggle label="Use one instanced batch" checked={p.instanced} onChange={(v) => set('instanced', v)} help="Draws identical geometry and material in one GPU call." />
                    <Readout>
                        Estimated pixel cost
                        <br />
                        <strong>{(p.dpr * p.dpr).toFixed(2)}×</strong> vs DPR 1<br />
                        Expected calls: {p.instanced ? 1 : p.count}
                    </Readout>
                    <button className="f2l-button" aria-pressed={playing} onClick={() => play((v) => !v)}>
                        {playing ? 'Pause benchmark Ⅱ' : 'Run benchmark →'}
                    </button>
                </>
            }
        >
            <ThreeStage key={version} mode="budget" params={ref} playing={playing} />
            <span className="f2l-gpu-readout" data-gpu-readout>
                Live frame timing appears while running
            </span>
        </Demo>
    );
}
