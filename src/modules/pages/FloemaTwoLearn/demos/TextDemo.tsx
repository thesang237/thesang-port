'use client';
import { useEffect, useRef, useState } from 'react';

import { gsap, motion, useFloema, useParams } from '../kit/runtime';
import { Demo, Slider } from '../kit/ui';
const defaults = { duration: motion.reveal, travel: 18, stagger: motion.stagger };
export default function TextDemo() {
    const { p, set, reset } = useParams(defaults);
    const [replay, setReplay] = useState(0);
    const host = useRef<HTMLDivElement>(null);
    const { reduced } = useFloema();
    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const items = el.querySelectorAll('.f2l-reveal-item');
        const timeline = gsap.timeline({ paused: true });
        items.forEach((item, i) => {
            timeline.fromTo(
                item,
                { y: reduced ? 0 : p.travel, opacity: 0 },
                { y: 0, opacity: 1, duration: reduced ? 0.16 : p.duration, ease: motion.ease },
                reduced ? 0 : ([0.06, 0.14, 0.24][i] * p.stagger) / 0.07,
            );
        });
        let visible = false;
        const visibility = () => {
            if (visible && !document.hidden) timeline.play();
            else timeline.pause();
        };
        const observer = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            visibility();
        });
        observer.observe(el);
        document.addEventListener('visibilitychange', visibility);
        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', visibility);
            timeline.kill();
        };
    }, [p.duration, p.travel, p.stagger, replay, reduced]);
    return (
        <Demo
            title="Choreograph the reading order"
            hint="Replay the entrance, then exaggerate its spacing in time."
            reset={() => {
                reset();
                setReplay((v) => v + 1);
            }}
            tryThis="Set the stagger to 0.35s and travel to 80px. The pieces stop feeling like one thought. Return to the source values and compare."
            controls={
                <>
                    <Slider label="Duration" value={p.duration} min={0.1} max={1.4} step={0.05} onChange={(v) => set('duration', v)} help="How long each item takes to settle." suffix="s" />
                    <Slider label="Travel" value={p.travel} min={0} max={80} onChange={(v) => set('travel', v)} help="Vertical distance before the final baseline." suffix="px" />
                    <Slider
                        label="Stagger scale"
                        value={p.stagger}
                        min={0}
                        max={0.35}
                        step={0.01}
                        onChange={(v) => set('stagger', v)}
                        help="At 0.07 the starts are the source’s 60 / 140 / 240ms."
                        suffix="s"
                    />
                    <button className="f2l-button" onClick={() => setReplay((v) => v + 1)}>
                        Replay entrance ↻
                    </button>
                </>
            }
        >
            <div ref={host} className="f2l-text-stage">
                <span className="f2l-reveal-item f2l-demo-tag">01 / A PLACE TO PAUSE</span>
                <h4 className="f2l-reveal-item">
                    A little space.
                    <br />A different pace.
                </h4>
                <span className="f2l-reveal-item f2l-demo-cta">Explore the collection ↗</span>
            </div>
        </Demo>
    );
}
