import { useRef } from 'react';

import { Demo, Slider } from '../kit/controls';
import { useDemoTimeline, useParams, useReducedMotion } from '../kit/loop';
import { gsap, motion, useGSAP } from '../kit/motion';

const DEFAULTS = { duration: motion.hover, stagger: motion.buttonStagger, outline: motion.outline };
const TEXT = 'EXPLORE THE FORMS';
export default function Hover() {
    const host = useRef<HTMLDivElement>(null),
        button = useRef<HTMLButtonElement>(null);
    const { values, live, set, reset } = useParams(DEFAULTS);
    const timelineRef = useDemoTimeline(host);
    const outlineRef = useDemoTimeline(host);
    const reduced = useReducedMotion();
    useGSAP(
        () => {
            const element = button.current;
            if (!element) return;
            const front = element.querySelectorAll('[data-roll-front] span'),
                back = element.querySelectorAll('[data-roll-back] span');
            const line = element.querySelector<SVGEllipseElement>('[data-draw]')!,
                length = line.getTotalLength();
            gsap.set(back, { rotationX: 90, rotationY: 9 });
            gsap.set(line, { attr: { 'stroke-dasharray': `${length} ${length}`, 'stroke-dashoffset': length } });
            timelineRef.current = gsap
                .timeline({ paused: true })
                .to(front, { rotationX: -90, rotationY: -9, duration: reduced ? 0 : live.current.duration, ease: 'floema', stagger: reduced ? 0 : live.current.stagger }, 0)
                .to(back, { rotationX: 0, rotationY: 0, duration: reduced ? 0 : live.current.duration, ease: 'floema', stagger: reduced ? 0 : live.current.stagger }, 0.05);
            outlineRef.current = gsap.timeline({ paused: true }).to(line, { attr: { 'stroke-dashoffset': 0 }, duration: reduced ? 0.16 : live.current.outline, ease: 'floema' });
        },
        { scope: host, dependencies: [values.duration, values.stagger, values.outline, reduced], revertOnUpdate: true },
    );
    const enter = () => {
        timelineRef.current?.play();
        outlineRef.current?.restart();
    };
    const leave = () => {
        timelineRef.current?.reverse();
        outlineRef.current?.reverse();
    };
    return (
        <Demo
            stageRef={host}
            title="A letter roll and a path draw"
            hint="Hover, focus, or press the button. Leave halfway through."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="Letter duration"
                        value={values.duration}
                        min={0.1}
                        max={1.5}
                        step={0.05}
                        unit="s"
                        help="Each letter takes 0.5s in the source."
                        onChange={(v) => set('duration', v)}
                    />
                    <Slider
                        label="Letter offset"
                        value={values.stagger}
                        min={0}
                        max={0.1}
                        step={0.005}
                        unit="s"
                        help="Oval button uses 0.01s per letter; links use 0.02s."
                        onChange={(v) => set('stagger', v)}
                    />
                    <Slider
                        label="Outline duration"
                        value={values.outline}
                        min={0.1}
                        max={2}
                        step={0.1}
                        unit="s"
                        help="Measured path length → zero offset. Source uses 1s."
                        onChange={(v) => set('outline', v)}
                    />
                    <button
                        className="fl-button"
                        onClick={() => {
                            timelineRef.current?.restart();
                            outlineRef.current?.restart();
                        }}
                    >
                        Replay
                    </button>
                </>
            }
        >
            <button
                ref={button}
                className="fl-roll-button"
                aria-label={TEXT}
                onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') enter();
                }}
                onPointerLeave={leave}
                onFocus={enter}
                onBlur={leave}
                onClick={() => {
                    timelineRef.current?.restart();
                    outlineRef.current?.restart();
                }}
            >
                <svg viewBox="0 0 288 60" aria-hidden="true">
                    <ellipse cx="144" cy="30" rx="143" ry="29" opacity=".25" />
                    <ellipse data-draw cx="144" cy="30" rx="143" ry="29" />
                </svg>
                <span className="fl-roll-label" aria-hidden="true">
                    {[false, true].map((back) => (
                        <span key={String(back)} {...(back ? { 'data-roll-back': '' } : { 'data-roll-front': '' })}>
                            {Array.from(TEXT).map((letter, index) => (
                                <span key={index}>{letter === ' ' ? '\u00a0' : letter}</span>
                            ))}
                        </span>
                    ))}
                </span>
            </button>
            <p className="fl-stage-caption">
                Two letter copies. One measured ellipse.
                <br />
                No accumulating offset between visits.
            </p>
        </Demo>
    );
}
