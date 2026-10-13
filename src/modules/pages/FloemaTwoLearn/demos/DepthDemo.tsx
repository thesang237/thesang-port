'use client';
import { useState } from 'react';

import { motion, useParams } from '../kit/runtime';
import ThreeStage from '../kit/ThreeStage';
import { Demo, Slider } from '../kit/ui';
const defaults = { speed: motion.heroCruise, velocity: 0, boost: motion.heroBoost, fov: 35, dpr: 1.5 };
export default function DepthDemo() {
    const { p, ref, set, reset } = useParams(defaults);
    const [playing, play] = useState(false);
    const [version, bump] = useState(0);
    return (
        <Demo
            title="Travel toward the lens"
            hint="Press Play, then add scroll velocity. The cards stay on fixed lanes."
            reset={() => {
                reset();
                play(false);
                bump((v) => v + 1);
            }}
            tryThis="Open the lens to 80°. Then push the boost to 12. Edge distortion and rapid recycling show why the source keeps both restrained."
            controls={
                <>
                    <Slider label="Cruise speed" value={p.speed} min={0} max={5} step={0.1} onChange={(v) => set('speed', v)} help="Distance traveled each second before scroll adds energy." />
                    <Slider
                        label="Scroll velocity"
                        value={p.velocity}
                        min={0}
                        max={4}
                        step={0.1}
                        onChange={(v) => set('velocity', v)}
                        help="Simulates continuous downward scrolling. Return to zero to settle."
                    />
                    <Slider label="Velocity boost" value={p.boost} min={0} max={12} step={0.5} onChange={(v) => set('boost', v)} help="How strongly scrolling increases forward speed." />
                    <Slider label="Field of view" value={p.fov} min={20} max={80} onChange={(v) => set('fov', v)} help="The camera lens. The source uses 35 degrees." suffix="°" />
                    <button className="f2l-button" aria-pressed={playing} onClick={() => play((v) => !v)}>
                        {playing ? 'Pause motion Ⅱ' : 'Play motion →'}
                    </button>
                </>
            }
        >
            <ThreeStage key={version} mode="hero" params={ref} playing={playing} />
            <span className="f2l-gpu-readout" data-gpu-readout>
                22 planes / still until played
            </span>
        </Demo>
    );
}
