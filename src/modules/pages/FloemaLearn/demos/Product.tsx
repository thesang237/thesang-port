import { useEffect, useRef } from 'react';

import { Demo, Select, Slider } from '../kit/controls';
import { useDemoTimeline, useParams, useReducedMotion, useTicker } from '../kit/loop';
import { gsap, mix, motion, useGSAP } from '../kit/motion';
import { Artwork } from '../kit/ui';

const DEFAULTS = { progress: 0, duration: motion.flip, turn: 1 };
export default function Product() {
    const host = useRef<HTMLDivElement>(null),
        scene = useRef<HTMLDivElement>(null),
        card = useRef<HTMLDivElement>(null),
        detail = useRef<HTMLDivElement>(null),
        readout = useRef<HTMLOutputElement>(null),
        neighbors = useRef<HTMLDivElement>(null),
        destination = useRef<HTMLDivElement>(null),
        runtime = useRef({ progress: 0, width: 0 });
    const { values, live, set, reset } = useParams(DEFAULTS),
        timelineRef = useDemoTimeline(host),
        reduced = useReducedMotion();
    const { contextSafe } = useGSAP({ scope: host });
    useEffect(() => {
        const element = scene.current,
            photo = card.current,
            target = destination.current;
        if (!element || !photo || !target) return;
        const state = runtime.current;
        const measure = () => {
            state.width = element.clientWidth;
            const startW = Math.min(100, state.width * 0.24),
                endW = Math.min(164, state.width * 0.32);
            photo.style.width = `${startW}px`;
            photo.style.height = `${(startW * 4) / 3}px`;
            target.style.width = `${endW}px`;
            target.style.height = `${(endW * 4) / 3}px`;
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        measure();
        return () => observer.disconnect();
    }, []);
    useTicker(host, () => {
        const element = scene.current,
            photo = card.current;
        if (!element || !photo || !runtime.current.width) return;
        const p = runtime.current.progress,
            width = runtime.current.width;
        const startW = Math.min(100, width * 0.24),
            endW = Math.min(164, width * 0.32);
        const w = mix(startW, endW, p),
            expansion = w / startW;
        const x = mix(width * 0.1, width * 0.08, p) + (w - startW) / 2;
        const y = mix(96, 54, p) + ((w - startW) * 2) / 3;
        photo.style.transform = `translate3d(${x}px,${y}px,0) rotateY(${reduced ? 0 : p * 360 * live.current.turn}deg) rotateZ(${mix(-4, 1.8, p)}deg) scale(${expansion})`;
        if (detail.current) {
            detail.current.style.opacity = String(Math.max(0, (p - 0.25) / 0.75));
            detail.current.style.transform = `translateY(${(1 - p) * 24}px)`;
        }
        if (neighbors.current) neighbors.current.style.opacity = String((1 - p) * 0.4);
        if (readout.current) readout.current.textContent = `p ${p.toFixed(2)} · rotation ${(p * 360 * live.current.turn).toFixed(0)}°`;
    });
    const animate = (open: boolean) => {
        contextSafe(() => {
            timelineRef.current?.kill();
            timelineRef.current = gsap.timeline().to(runtime.current, {
                progress: open ? 1 : 0,
                duration: reduced ? 0.16 : live.current.duration,
                ease: 'expo.inOut',
                overwrite: true,
                onComplete: () => set('progress', open ? 1 : 0),
            });
        })();
    };
    return (
        <Demo
            stageRef={host}
            title="A layout change with one playhead"
            hint="Open, close midway, or scrub the exact in-between state."
            onReset={() => {
                reset();
                timelineRef.current?.kill();
                runtime.current.progress = 0;
            }}
            controls={
                <>
                    <Slider
                        label="Manual progress"
                        value={values.progress}
                        min={0}
                        max={1}
                        step={0.01}
                        help="Drives position, size, angle, and detail emphasis together."
                        onChange={(v) => {
                            timelineRef.current?.kill();
                            set('progress', v);
                            runtime.current.progress = v;
                        }}
                    />
                    <Slider
                        label="Opening duration"
                        value={values.duration}
                        min={0.3}
                        max={3}
                        step={0.1}
                        unit="s"
                        help="Floema’s full turn takes 2s with expo.inOut."
                        onChange={(v) => set('duration', v)}
                    />
                    <Select
                        label="Creative variation"
                        value={String(values.turn)}
                        choices={[
                            ['1', 'Source: full turn'],
                            ['0.5', 'Postcard: half turn'],
                            ['0', 'Artwork: no flip'],
                        ]}
                        help="Keep the shared progress; change the visual idea."
                        onChange={(v) => set('turn', Number(v))}
                    />
                    <div className="fl-action-row">
                        <button className="fl-button fl-primary" onClick={() => animate(true)}>
                            Open
                        </button>
                        <button className="fl-button" onClick={() => animate(false)}>
                            Close
                        </button>
                    </div>
                    <output className="fl-readout" ref={readout} />
                </>
            }
        >
            <div ref={scene} className="fl-product-scene">
                <div ref={destination} className="fl-product-destination">
                    DESTINATION
                </div>
                <div ref={neighbors} className="fl-product-neighbors">
                    <Artwork index={2} />
                    <Artwork index={3} />
                </div>
                <div ref={card} className="fl-product-card">
                    <div className="fl-product-front">
                        <Artwork index={0} />
                    </div>
                    <div className="fl-product-back">
                        <Artwork index={1} />
                    </div>
                </div>
                <div ref={detail} className="fl-product-copy">
                    <span className="fl-label">FORM STUDY</span>
                    <h4>
                        Orbit
                        <br />
                        No. 01
                    </h4>
                    <p>A small object becomes the focus of the layout.</p>
                    <span className="fl-mini-icon">✳</span>
                    <span>
                        Same progress.
                        <br />
                        Different properties.
                    </span>
                </div>
            </div>
            <p className="fl-stage-caption">CSS 3D teaching copy. Floema renders the same pose with two WebGL planes.</p>
        </Demo>
    );
}
