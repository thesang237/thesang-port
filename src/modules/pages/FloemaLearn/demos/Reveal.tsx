import { useEffect, useEffectEvent, useRef } from 'react';

import { Demo, Select, Slider, Toggle } from '../kit/controls';
import { useDemoTimeline, useParams, useReducedMotion } from '../kit/loop';
import { gsap, motion, useGSAP } from '../kit/motion';

const DEFAULTS = { duration: motion.reveal, stagger: motion.lineStagger, once: true, kind: 'lines' };
export default function Reveal() {
    const host = useRef<HTMLDivElement>(null),
        box = useRef<HTMLDivElement>(null),
        target = useRef<HTMLDivElement>(null),
        played = useRef(false),
        count = useRef(0),
        readout = useRef<HTMLOutputElement>(null);
    const { values, set, reset } = useParams(DEFAULTS);
    const reduced = useReducedMotion();
    const timelineRef = useDemoTimeline(host);
    const { contextSafe } = useGSAP(
        () => {
            const block = target.current;
            if (!block) return;
            const lines = block.querySelectorAll('[data-reveal-line]');
            timelineRef.current = gsap.timeline({ paused: true });
            if (values.kind === 'highlight')
                timelineRef.current.fromTo(block, { opacity: 0, scale: reduced ? 1 : 1.2 }, { opacity: 1, scale: 1, duration: reduced ? 0.16 : values.duration, ease: 'expo.out' });
            else {
                gsap.set(block, { opacity: 1, scale: 1 });
                timelineRef.current.fromTo(
                    lines,
                    { yPercent: reduced ? 0 : 100, opacity: reduced ? 0 : 1 },
                    { yPercent: 0, opacity: 1, duration: reduced ? 0.16 : values.duration, ease: 'floema', stagger: reduced ? 0 : values.stagger },
                );
                if (values.kind === 'intro')
                    timelineRef.current.fromTo(
                        block.querySelectorAll('[data-reveal-word]'),
                        { yPercent: reduced ? 0 : 100, opacity: 0 },
                        { yPercent: 0, opacity: 1, duration: reduced ? 0.16 : 1, ease: 'back.inOut', stagger: reduced ? 0 : 0.015 },
                        0.2,
                    );
            }
            if (played.current) timelineRef.current.progress(1).pause();
        },
        { scope: host, dependencies: [values.duration, values.stagger, values.kind, reduced], revertOnUpdate: true },
    );
    const play = () => {
        contextSafe(() => {
            if (values.once && played.current) return;
            played.current = true;
            count.current++;
            if (readout.current) readout.current.textContent = `played ${count.current} time${count.current === 1 ? '' : 's'}`;
            timelineRef.current?.restart();
        })();
    };
    const onVisible = useEffectEvent(play);
    useEffect(() => {
        const element = target.current,
            root = box.current;
        if (!element || !root) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) onVisible();
                else if (!values.once) {
                    played.current = false;
                    timelineRef.current?.pause(0);
                }
            },
            { root, threshold: 0.25 },
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [values.once, timelineRef]);
    return (
        <Demo
            stageRef={host}
            title="A reveal that remembers"
            hint="Scroll inside this small story. Return upward and try again."
            onReset={() => {
                reset();
                played.current = false;
                count.current = 0;
                timelineRef.current?.pause(0);
                if (box.current) box.current.scrollTop = 0;
                if (readout.current) readout.current.textContent = 'not played';
            }}
            controls={
                <>
                    <Select
                        label="Reveal recipe"
                        value={values.kind}
                        choices={[
                            ['lines', 'About: masked lines'],
                            ['intro', 'Intro: lines + words'],
                            ['highlight', 'Highlight: scale + fade'],
                        ]}
                        help="Choose a recipe, then replay it or scroll the block into view."
                        onChange={(v) => {
                            played.current = false;
                            set('kind', v);
                        }}
                    />
                    <Slider label="Duration" value={values.duration} min={0.2} max={2.5} step={0.1} unit="s" help="About lines take 1.5s in the source." onChange={(v) => set('duration', v)} />
                    <Slider
                        label="Line offset"
                        value={values.stagger}
                        min={0}
                        max={0.4}
                        step={0.02}
                        unit="s"
                        help="Source About lines start 0.1s apart; intro uses 0.2s."
                        onChange={(v) => set('stagger', v)}
                    />
                    <Toggle label="Once" checked={values.once} onChange={(v) => set('once', v)} help="Keep the finished state when you scroll back." />
                    <button
                        className="fl-button"
                        onClick={() => {
                            played.current = false;
                            play();
                        }}
                    >
                        Replay explicitly
                    </button>
                    <output className="fl-readout" ref={readout}>
                        not played
                    </output>
                </>
            }
        >
            <div ref={box} className="fl-reveal-scroll" data-lenis-prevent>
                <div className="fl-scroll-instruction">
                    SCROLL THIS STORY ↓<span>Keep the mask still.</span>
                </div>
                <div ref={target} className="fl-reveal-target" aria-label="Let the words find their place.">
                    {['Let the words', 'find their place.'].map((line) => (
                        <span className="fl-line-mask" key={line} aria-hidden="true">
                            <span data-reveal-line>
                                {line.split(' ').map((word, i) => (
                                    <span key={i} data-reveal-word>
                                        {word}&nbsp;
                                    </span>
                                ))}
                            </span>
                        </span>
                    ))}
                </div>
                <div className="fl-scroll-tail">
                    ↑ Go back and repeat.
                    <br />A played block stays revealed.
                </div>
            </div>
        </Demo>
    );
}
