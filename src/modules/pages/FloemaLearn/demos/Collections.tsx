import { useRef, useState } from 'react';

import { Demo, Readout, Slider } from '../kit/controls';
import { useDemoTimeline, useParams, useReducedMotion } from '../kit/loop';
import { gsap, useGSAP } from '../kit/motion';
import { Artwork } from '../kit/ui';

const DEFAULTS = { stagger: 0.06 };
const GROUPS = [
    ['Orbit', 'Circles, held in balance.', 'A study in repeating forms.'],
    ['Fold', 'One plane, another direction.', 'An archive of paper shapes.'],
    ['Trace', 'A line remembers its path.', 'Small marks with a quiet rhythm.'],
];
export default function Collections() {
    const host = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const { values, live, set, reset } = useParams(DEFAULTS);
    const timelineRef = useDemoTimeline(host),
        reduced = useReducedMotion();
    const { contextSafe } = useGSAP(
        () => {
            const groups = [...(host.current?.querySelectorAll<HTMLElement>('[data-copy]') ?? [])];
            gsap.set(groups, { autoAlpha: 0 });
            gsap.set(groups[0], { autoAlpha: 1 });
            groups.forEach((group, i) => {
                gsap.set(group.querySelectorAll('[data-copy-line]'), { yPercent: i === 0 ? 0 : 110, y: 0 });
            });
        },
        { scope: host },
    );
    const select = (index: number) => {
        contextSafe(() => {
            setActive(index);
            timelineRef.current?.kill();
            const groups = [...(host.current?.querySelectorAll<HTMLElement>('[data-copy]') ?? [])];
            const lines = groups.map((group) => [...group.querySelectorAll('[data-copy-line]')]);
            timelineRef.current = gsap.timeline();
            lines.forEach((group, i) => {
                if (i !== index)
                    timelineRef.current!.to(group, { y: 0, yPercent: reduced ? 0 : -110, duration: reduced ? 0.1 : 0.35, stagger: reduced ? 0 : 0.04, ease: 'power2.in', overwrite: true }, 0);
            });
            const exit = reduced ? 0.1 : 0.43;
            timelineRef.current
                .set(
                    groups.filter((_, i) => i !== index),
                    { autoAlpha: 0 },
                    exit,
                )
                .set(groups[index], { autoAlpha: 1 }, exit)
                .fromTo(
                    lines[index],
                    { y: 0, yPercent: reduced ? 0 : 110 },
                    { y: 0, yPercent: 0, duration: reduced ? 0.16 : 1, stagger: reduced ? 0 : live.current.stagger, ease: 'floema', overwrite: true },
                    exit,
                );
        })();
    };
    return (
        <Demo
            stageRef={host}
            title="One caption timeline"
            hint="Choose a collection. Switch again before it finishes."
            onReset={() => {
                reset();
                select(0);
            }}
            controls={
                <>
                    <Slider
                        label="Incoming line offset"
                        value={values.stagger}
                        min={0}
                        max={0.3}
                        step={0.01}
                        unit="s"
                        help="Source uses 60ms between all title and description lines."
                        onChange={(v) => set('stagger', v)}
                    />
                    <div className="fl-preset-buttons">
                        {GROUPS.map((group, i) => (
                            <button className={`fl-button ${i === active ? 'fl-primary' : ''}`} key={group[0]} onClick={() => select(i)}>
                                {group[0]}
                            </button>
                        ))}
                    </div>
                    <Readout>old group exits → hide → new group arrives</Readout>
                </>
            }
        >
            <div className="fl-caption-gallery">
                {GROUPS.map((group, i) => (
                    <button
                        key={group[0]}
                        aria-label={`Choose ${group[0]} collection`}
                        onClick={() => select(i)}
                        style={{ opacity: active === i ? 1 : 0.4, transform: `translateY(${i === active ? -8 : 4}px) rotate(${(i - 1) * 4}deg)` }}
                    >
                        <Artwork index={i} />
                    </button>
                ))}
            </div>
            <div className="fl-caption-stack">
                {GROUPS.map((lines, i) => (
                    <article key={lines[0]} data-copy aria-hidden={active !== i}>
                        {lines.map((line, j) => (
                            <span key={line} className={`fl-line-mask ${j === 0 ? 'fl-caption-name' : ''}`}>
                                <span data-copy-line>{line}</span>
                            </span>
                        ))}
                    </article>
                ))}
            </div>
            <p className="fl-stage-caption">The name and both description lines share one handoff.</p>
        </Demo>
    );
}
