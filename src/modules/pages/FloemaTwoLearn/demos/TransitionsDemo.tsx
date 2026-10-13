'use client';
import { useEffect, useRef, useState } from 'react';

import { gsap, motion, useFloema, useParams } from '../kit/runtime';
import { Demo, Slider } from '../kit/ui';
const defaults = { exit: motion.exit, enter: motion.enter };
export default function TransitionsDemo() {
    const { p, set, reset } = useParams(defaults);
    const [page, setPage] = useState(0);
    const [phase, setPhase] = useState('Ready');
    const frame = useRef<HTMLDivElement>(null);
    const bar = useRef<HTMLSpanElement>(null);
    const tween = useRef<gsap.core.Timeline | null>(null);
    const { reduced } = useFloema();
    useEffect(
        () => () => {
            tween.current?.kill();
        },
        [],
    );
    const play = () => {
        tween.current?.kill();
        gsap.set(frame.current, { opacity: 1 });
        gsap.set(bar.current, { scaleX: 0 });
        setPhase('1 / Exit');
        const duration = reduced ? 0.26 : p.exit + p.enter;
        tween.current = gsap
            .timeline()
            .to(frame.current, {
                opacity: 0,
                duration: reduced ? 0.1 : p.exit,
                ease: 'power1.in',
                onComplete: () => {
                    setPage((v) => 1 - v);
                    setPhase('2 / Route changed → 3 / Enter');
                },
            })
            .to(frame.current, { opacity: 1, duration: reduced ? 0.16 : p.enter, ease: motion.ease, onComplete: () => setPhase('Complete / scroll + focus restored') })
            .to(bar.current, { scaleX: 1, duration, ease: 'none' }, 0);
    };
    return (
        <Demo
            title="Put the route change at the seam"
            hint="Navigate inside this simulation. The surrounding frame never moves."
            reset={() => {
                tween.current?.kill();
                reset();
                setPage(0);
                setPhase('Ready');
                gsap.set(frame.current, { opacity: 1 });
                gsap.set(bar.current, { scaleX: 0 });
            }}
            tryThis="Make the exit 1.2s. The click feels slow even though the animation is smooth. A short departure keeps the action responsive."
            controls={
                <>
                    <Slider label="Exit duration" value={p.exit} min={0.1} max={1.2} step={0.02} onChange={(v) => set('exit', v)} help="Time before navigation is allowed to happen." suffix="s" />
                    <Slider
                        label="Enter duration"
                        value={p.enter}
                        min={0.1}
                        max={1.2}
                        step={0.02}
                        onChange={(v) => set('enter', v)}
                        help="Time for the incoming content to become visible."
                        suffix="s"
                    />
                    <button className="f2l-button" onClick={play}>
                        Navigate to {page ? 'Home' : 'Sustainability'} →
                    </button>
                    <p className="f2l-live-status" aria-live="polite">
                        {phase}
                    </p>
                </>
            }
        >
            <div className="f2l-transition-stage">
                <header>
                    <b>STUDIO / FIELD</b>
                    <span>Home / Sustainability</span>
                </header>
                <div ref={frame} className={`f2l-sim-page ${page ? 'is-green' : ''}`}>
                    <small>{page ? '02 / SUSTAINABILITY' : '01 / HOME'}</small>
                    <strong>{page ? 'Made for the long run.' : 'Room for everyday life.'}</strong>
                    <i />
                </div>
                <div className="f2l-transition-track">
                    <span ref={bar} />
                </div>
                <div className="f2l-phase-labels">
                    <span>EXIT</span>
                    <span>NAVIGATE</span>
                    <span>ENTER</span>
                </div>
            </div>
        </Demo>
    );
}
