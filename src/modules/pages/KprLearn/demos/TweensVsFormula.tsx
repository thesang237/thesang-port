'use client';

import { useEffect, useRef, useState } from 'react';

import { Btn, Demo, Readout, Slider } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { ease, lerp, seg } from '../kit/source';

/** the same tiny storyboard for both lanes: slide across in [0.15, 0.45], turn + shrink in [0.55, 0.85] */
const SLIDE: [number, number] = [0.15, 0.45];
const TURN: [number, number] = [0.55, 0.85];

const formula = (t: number) => {
    const a = ease.inOutStrong(seg(t, SLIDE));
    const b = ease.inOutStrong(seg(t, TURN));
    return { x: lerp(0, 1, a), ry: lerp(0, 180, b), s: lerp(1, 0.6, b) };
};

const DEFAULTS = { t: 0, dur: 0.8 };

function Lane({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="kl-mono mb-1.5 flex items-center gap-2 text-[10.5px] uppercase text-[var(--kl-dim)]">
                <span className="kl-dot" />
                {label}
            </div>
            <div className="relative h-[120px] bg-[var(--kl-panel-2)] [container-type:inline-size] [perspective:600px]">{children}</div>
        </div>
    );
}
const cardCls = 'kl-notch absolute left-0 top-1/2 -mt-[40px] h-[80px] w-[64px] [--n-d:9px] [--n-w:45%]';
const place = (x: number, ry: number, s: number) => `translateX(${x * 100}cqw) translateX(${-x * 100}%) rotateY(${ry}deg) scale(${s})`;

/**
 * Chapter 02: two ways to animate the same storyboard. Left: tweens fired when the playhead crosses a
 * point (a common approach). Right: a pure function of t, like choreo.ts.
 */
export default function TweensVsFormula() {
    const { p, set, reset } = useParams(DEFAULTS);
    const left = useRef<HTMLDivElement>(null);
    const ghost = useRef<HTMLDivElement>(null);
    const lastT = useRef(0);
    const state = useRef({ x: 0, ry: 0, s: 1 });
    const [fired, setFired] = useState(0);
    const [drift, setDrift] = useState(0);
    const tRef = useRef(0);
    const shaking = useRef<gsap.core.Tween | null>(null);

    // the trigger lane: when t crosses a window start, play a fixed-length tween (forward or back)
    const cross = (prev: number, next: number) => {
        const st = state.current;
        let n = 0;
        const go = (to: Partial<typeof st>) => {
            n++;
            gsap.to(st, {
                ...to,
                duration: p.dur,
                ease: 'power3.inOut',
                onUpdate: () => {
                    if (left.current) left.current.style.transform = place(st.x, st.ry, st.s);
                    const f = formula(tRef.current);
                    setDrift(Math.abs(st.x - f.x) + Math.abs(st.ry - f.ry) / 180);
                },
            });
        };
        if (prev < SLIDE[0] && next >= SLIDE[0]) go({ x: 1 });
        if (prev >= SLIDE[0] && next < SLIDE[0]) go({ x: 0 });
        if (prev < TURN[0] && next >= TURN[0]) go({ ry: 180, s: 0.6 });
        if (prev >= TURN[0] && next < TURN[0]) go({ ry: 0, s: 1 });
        if (n) setFired((f) => f + n);
    };

    const setT = (v: number) => {
        cross(lastT.current, v);
        lastT.current = v;
        tRef.current = v;
        const st = state.current;
        const f = formula(v);
        setDrift(Math.abs(st.x - f.x) + Math.abs(st.ry - f.ry) / 180);
        set('t', v);
    };

    // the ghost on the left lane shows where the formula says the card should be
    useEffect(() => {
        const f = formula(p.t);
        if (ghost.current) ghost.current.style.transform = place(f.x, f.ry, f.s);
    }, [p.t]);

    useEffect(
        () => () => {
            gsap.killTweensOf(state.current);
            shaking.current?.kill();
        },
        [],
    );

    const shake = () => {
        shaking.current?.kill();
        const proxy = { i: 0 };
        let last = -1;
        shaking.current = gsap.to(proxy, {
            i: 14,
            duration: 1.4,
            ease: 'none',
            onUpdate: () => {
                const i = Math.floor(proxy.i);
                if (i === last) return;
                last = i;
                setT(i % 2 ? 0.5 + Math.random() * 0.45 : Math.random() * 0.5);
            },
            onComplete: () => setT(0.5),
        });
    };

    const f = formula(p.t);

    return (
        <Demo
            title="Tweens fired at points vs a formula of t"
            hint="Scrub slowly, then press “shake” (fast random scrubbing). The formula is always right; the triggered tweens drift."
            onReset={() => {
                gsap.killTweensOf(state.current);
                state.current = { x: 0, ry: 0, s: 1 };
                if (left.current) left.current.style.transform = '';
                lastT.current = 0;
                tRef.current = 0;
                setFired(0);
                setDrift(0);
                reset();
            }}
            controls={
                <>
                    <Slider label="playhead t" value={p.t} min={0} max={1} step={0.001} onChange={setT} help="Both lanes read this. Windows: slide 0.15–0.45, turn 0.55–0.85." />
                    <Slider label="tween length (s)" value={p.dur} min={0.1} max={2} step={0.05} onChange={(v) => set('dur', v)} help="Left lane only: tweens take time no matter how you scroll." />
                    <Btn primary onClick={shake}>
                        ⚡ Shake the scroll
                    </Btn>
                    <Readout
                        items={[
                            { label: 'tweens fired', value: fired },
                            { label: 'left drift', value: drift.toFixed(2), color: drift > 0.05 ? '#ff8a5c' : '#c0fb50' },
                        ]}
                    />
                </>
            }
        >
            <div className="space-y-5 p-4 sm:p-6">
                <Lane label="Tweens fired when the playhead crosses a point (dashed = where it should be)">
                    <div ref={ghost} className={`${cardCls} border border-dashed border-[var(--kl-ink)]`} style={{ clipPath: 'none' }} />
                    <div ref={left} className={`${cardCls} bg-[#b7a3b0]`} />
                </Lane>
                <Lane label="A pure function of t (how /kpr does it)">
                    <div className={`${cardCls} bg-[var(--kl-lav)]`} style={{ transform: place(f.x, f.ry, f.s) }} />
                </Lane>
            </div>
        </Demo>
    );
}
