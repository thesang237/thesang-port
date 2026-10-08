import { useRef } from 'react';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { wrap } from '../kit/motion';
import { Artwork } from '../kit/ui';

const DEFAULTS = { offset: 0, speed: 120, wrapping: true, playing: false };
export default function Loops() {
    const host = useRef<HTMLDivElement>(null),
        runtime = useRef({ drift: 0 });
    const { values, live, set, reset } = useParams(DEFAULTS);
    useTicker(host, (_t, dt) => {
        const element = host.current;
        if (!element) return;
        const p = live.current;
        if (p.playing) runtime.current.drift += p.speed * dt;
        const cycle = 660;
        element.querySelectorAll<HTMLElement>('[data-loop-card]').forEach((card, i) => {
            const position = i * 132 + p.offset + runtime.current.drift;
            card.style.transform = `translateX(${p.wrapping ? wrap(position, -132, cycle - 132) : position}px) rotate(${(i % 2 ? 1 : -1) * 4}deg)`;
        });
        const title = element.querySelector<HTMLElement>('.fl-loop-title');
        if (title) title.style.transform = `translateX(${-wrap((p.offset + runtime.current.drift) * 0.5, 0, 280)}px)`;
    });
    return (
        <Demo
            stageRef={host}
            title="Recycle positions, keep the list"
            hint="Scrub beyond a full cycle. Play drift to see it continue."
            onReset={() => {
                reset();
                runtime.current.drift = 0;
            }}
            controls={
                <>
                    <Slider label="Position" value={values.offset} min={-660} max={1320} unit="px" help="A finite 660px cycle, moved in either direction." onChange={(v) => set('offset', v)} />
                    <Slider label="Drift speed" value={values.speed} min={0} max={240} unit="px/s" help="Source home drift is 120px per second." onChange={(v) => set('speed', v)} />
                    <Toggle label="Wrap positions" checked={values.wrapping} onChange={(v) => set('wrapping', v)} help="Turn off to see the finite list leave the frame." />
                    <Toggle label="Play drift" checked={values.playing} onChange={(v) => set('playing', v)} help="Explicit playback; pauses when this demo leaves the screen." />
                    <Readout>wrap(position, −132, 528)</Readout>
                </>
            }
        >
            <div className="fl-loop-window">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} data-loop-card style={{ transform: `translateX(${i * 132}px)` }}>
                        <Artwork index={i} />
                    </div>
                ))}
            </div>
            <div className="fl-loop-title-mask">
                <div className="fl-loop-title">FORM &nbsp; FORM &nbsp; FORM &nbsp; FORM</div>
            </div>
            <p className="fl-stage-caption">Same rule as the vertical home gallery, shown sideways for clarity.</p>
        </Demo>
    );
}
