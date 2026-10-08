import { useRef } from 'react';

import { Demo, Readout, Select, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { damp, gsap, mix } from '../kit/motion';

const DEFAULTS = { response: 0.1, rate: 60, corrected: true, target: 35, ease: 'floema' };
export default function Motion() {
    const host = useRef<HTMLDivElement>(null);
    const dot = useRef<HTMLSpanElement>(null);
    const output = useRef<HTMLOutputElement>(null);
    const runtime = useRef({ current: 35, accumulated: 0 });
    const { values, live, set, reset } = useParams(DEFAULTS);
    useTicker(host, (_time, dt) => {
        const p = live.current,
            r = runtime.current;
        r.accumulated += dt;
        const step = 1 / p.rate;
        while (r.accumulated >= step) {
            r.current = p.corrected ? damp(r.current, p.target, p.response, step) : mix(r.current, p.target, p.response);
            r.accumulated -= step;
        }
        if (dot.current) dot.current.style.left = `${r.current}%`;
        if (output.current) output.current.textContent = `current ${r.current.toFixed(1)} → target ${p.target}`;
    });
    const curve = gsap.parseEase(values.ease);
    const path = Array.from({ length: 61 }, (_, i) => `${i ? 'L' : 'M'}${(i / 60) * 240},${100 - curve(i / 60) * 100}`).join(' ');
    return (
        <Demo
            stageRef={host}
            title="Catch up vs. follow a curve"
            hint="Change the target. Then compare refresh rates and curves."
            onReset={() => {
                reset();
                runtime.current = { current: 35, accumulated: 0 };
            }}
            controls={
                <>
                    <Slider label="Target" value={values.target} min={5} max={95} help="Where the moving dot wants to be." onChange={(v) => set('target', v)} />
                    <Slider
                        label="Response"
                        value={values.response}
                        min={0.01}
                        max={1}
                        step={0.01}
                        help="0.1 is Floema’s home/collection response; lower feels heavier."
                        onChange={(v) => set('response', v)}
                    />
                    <Select
                        label="Simulated display"
                        value={String(values.rate)}
                        choices={[
                            ['30', '30 Hz'],
                            ['60', '60 Hz'],
                            ['120', '120 Hz'],
                        ]}
                        help="The follower is calculated at this many steps per second."
                        onChange={(v) => set('rate', Number(v))}
                    />
                    <Toggle label="Correct for frame time" checked={values.corrected} onChange={(v) => set('corrected', v)} help="Keeps catch-up time consistent across display rates." />
                    <Select
                        label="Timed curve"
                        value={values.ease}
                        choices={[
                            ['floema', 'Floema custom'],
                            ['expo.inOut', 'Flip / wipe'],
                            ['none', 'Linear'],
                        ]}
                        onChange={(v) => set('ease', v)}
                        help="The curve below shows a timed trip, not the damping follower."
                    />
                </>
            }
        >
            <div className="fl-motion-study">
                <span className="fl-label">DAMPING · MOVING TARGET</span>
                <div className="fl-motion-track">
                    <span className="fl-target" style={{ left: `${values.target}%` }} />
                    <span ref={dot} className="fl-follower" style={{ left: '35%' }} />
                </div>
                <output ref={output} className="fl-readout" />
                <span className="fl-label">EASING · FIXED TRIP</span>
                <svg viewBox="0 0 240 100" className="fl-curve-graph" aria-label={`${values.ease} easing graph`}>
                    <path d="M0 100 240 0" className="fl-graph-guide" />
                    <path d={path} className="fl-graph-line" />
                </svg>
                <Readout>horizontal = time · vertical = progress</Readout>
            </div>
        </Demo>
    );
}
