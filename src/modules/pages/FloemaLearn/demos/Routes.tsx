import { useRef } from 'react';

import { Demo, Slider } from '../kit/controls';
import { useDemoTimeline, useParams, useReducedMotion, useTicker } from '../kit/loop';
import { gsap, motion, useGSAP } from '../kit/motion';

const DEFAULTS = { progress: 0, bow: 125, duration: motion.wipe };
export default function Routes() {
    const host = useRef<HTMLDivElement>(null),
        viewport = useRef<HTMLDivElement>(null),
        path = useRef<SVGPathElement>(null),
        svg = useRef<SVGSVGElement>(null),
        page = useRef<HTMLDivElement>(null),
        readout = useRef<HTMLOutputElement>(null),
        runtime = useRef({ progress: 0 });
    const { values, live, set, reset } = useParams(DEFAULTS),
        timelineRef = useDemoTimeline(host),
        reduced = useReducedMotion();
    const { contextSafe } = useGSAP({ scope: host });
    useTicker(host, () => {
        const element = viewport.current;
        if (!element) return;
        const whole = runtime.current.progress,
            covering = whole <= 0.5,
            p = covering ? whole * 2 : 2 - whole * 2;
        const width = element.clientWidth,
            height = element.clientHeight,
            y = (1 - p) * height,
            amplitude = live.current.bow * Math.sin(p * Math.PI);
        const points = Array.from({ length: 41 }, (_, i) => `${(i * width) / 40},${y - Math.sin((i / 40) * Math.PI) * amplitude}`);
        path.current?.setAttribute('d', `M${width},${height} L0,${height} L${points.join(' L')} Z`);
        if (svg.current) svg.current.style.transform = covering ? '' : 'rotate(180deg)';
        if (page.current) {
            page.current.textContent = covering ? '01 / ARCHIVE' : '02 / STUDIO';
            page.current.dataset.destination = String(!covering);
        }
        if (readout.current) readout.current.textContent = whole === 0 ? 'idle' : whole >= 1 ? 'finished' : covering ? 'covering · old page stays' : 'uncovering · new page mounted';
    });
    const replay = () => {
        contextSafe(() => {
            timelineRef.current?.kill();
            runtime.current.progress = 0;
            timelineRef.current = gsap
                .timeline()
                .to(runtime.current, { progress: 0.5, duration: reduced ? 0.12 : live.current.duration, ease: 'expo.inOut' })
                .to(runtime.current, { progress: 1, duration: reduced ? 0.12 : live.current.duration, ease: 'expo.inOut', onComplete: () => set('progress', 1) });
        })();
    };
    return (
        <Demo
            stageRef={host}
            title="Hide the cut with a moving sheet"
            hint="Play the full handoff, or inspect it with the progress dial."
            onReset={() => {
                reset();
                timelineRef.current?.kill();
                runtime.current.progress = 0;
            }}
            controls={
                <>
                    <Slider
                        label="Whole transition"
                        value={values.progress}
                        min={0}
                        max={1}
                        step={0.01}
                        help="0→0.5 covers the old page; 0.5→1 uncovers the new one."
                        onChange={(v) => {
                            timelineRef.current?.kill();
                            runtime.current.progress = v;
                            set('progress', v);
                        }}
                    />
                    <Slider label="Edge bow" value={values.bow} min={0} max={220} unit="px" help="125px is source amplitude at DPR 2; zero gives a straight wipe." onChange={(v) => set('bow', v)} />
                    <Slider
                        label="Each half"
                        value={values.duration}
                        min={0.2}
                        max={2}
                        step={0.1}
                        unit="s"
                        help="Source cover and uncover each last 1.5 seconds."
                        onChange={(v) => set('duration', v)}
                    />
                    <button className="fl-button fl-primary" onClick={replay}>
                        Play transition
                    </button>
                    <output className="fl-readout" ref={readout}>
                        idle
                    </output>
                </>
            }
        >
            <div ref={viewport} className="fl-wipe-viewport">
                <div ref={page} className="fl-wipe-page">
                    01 / ARCHIVE
                </div>
                <svg ref={svg} className="fl-wipe-svg" aria-hidden="true">
                    <path ref={path} />
                </svg>
                <span className="fl-wipe-nav">
                    LOGO <i>ABOUT</i>
                </span>
            </div>
            <p className="fl-stage-caption">The curtain covers navigation and content together.</p>
        </Demo>
    );
}
