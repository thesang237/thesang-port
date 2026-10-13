'use client';
import { useRef } from 'react';

import { useFloema, useParams, useTicker } from '../kit/runtime';
import { Demo, Slider, Toggle } from '../kit/ui';
const defaults = { target: 50, lerp: 0.085, fps: 60, broken: false };
export default function ClockDemo() {
    const { p, ref, set, reset } = useParams(defaults);
    const host = useRef<HTMLDivElement>(null);
    const marker = useRef<HTMLSpanElement>(null);
    const value = useRef<HTMLOutputElement>(null);
    const state = useRef({ x: 50, elapsed: 0 });
    const { reduced } = useFloema();
    useTicker(host, (_, dt) => {
        const d = ref.current;
        const s = state.current;
        s.elapsed += dt;
        if (s.elapsed < 1 / d.fps) return;
        const alpha = d.broken ? d.lerp : 1 - Math.exp(-d.lerp * 60 * s.elapsed);
        s.x = reduced ? d.target : s.x + (d.target - s.x) * alpha;
        s.elapsed = 0;
        if (marker.current) marker.current.style.left = `${s.x}%`;
        if (value.current) value.current.textContent = s.x.toFixed(1);
    });
    return (
        <Demo
            title="Same destination, different feel"
            hint="Jump the target from one side to the other. Watch the follower settle."
            reset={() => {
                reset();
                state.current.x = 50;
            }}
            tryThis="Turn on fixed-per-frame smoothing, then change simulated FPS. Its feel changes with refresh rate; the time-based version stays consistent."
            controls={
                <>
                    <Slider label="Target" value={p.target} min={0} max={100} onChange={(v) => set('target', v)} help="The destination requested by the input." suffix="%" />
                    <Slider label="Smoothing" value={p.lerp} min={0.01} max={0.3} step={0.005} onChange={(v) => set('lerp', v)} help="Higher values close the gap faster. The source uses 0.085." />
                    <Slider label="Simulated FPS" value={p.fps} min={30} max={120} step={30} onChange={(v) => set('fps', v)} help="How often this teaching follower updates." />
                    <Toggle label="Fixed per frame (broken)" checked={p.broken} onChange={(v) => set('broken', v)} help="Ignores elapsed time, making refresh rate affect the motion." />
                </>
            }
        >
            <div ref={host} className="f2l-clock-stage">
                <div className="f2l-lane">
                    <span>INPUT / DIRECT</span>
                    <div>
                        <i style={{ left: `${p.target}%` }} />
                    </div>
                    <b>{p.target.toFixed(1)}%</b>
                </div>
                <div className="f2l-lane">
                    <span>OUTPUT / FOLLOWER</span>
                    <div>
                        <i ref={marker} />
                    </div>
                    <b>
                        <output ref={value}>50.0</output>%
                    </b>
                </div>
                <p>
                    target → <em>close the gap over time</em> → visible position
                </p>
            </div>
        </Demo>
    );
}
