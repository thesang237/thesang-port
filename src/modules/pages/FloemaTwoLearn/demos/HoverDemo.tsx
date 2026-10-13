'use client';
import { useEffect, useRef, useState } from 'react';

import { gsap, motion, useFloema, useParams, useTicker } from '../kit/runtime';
import { Demo, Landscape, Slider } from '../kit/ui';
const defaults = { gap: 0.58, duration: motion.pillStretch };
const previewDefaults = { width: 250, cycle: motion.collectionCycle };
function PillLab() {
    const { p, set, reset } = useParams(defaults);
    const [selected, select] = useState(-1);
    const [clicked, setClicked] = useState('Hover or focus any label');
    const root = useRef<HTMLDivElement>(null);
    const travel = useRef({ a: 0, b: 0 });
    const { reduced } = useFloema();
    useEffect(() => {
        const node = root.current;
        if (!node) return;
        const buttons = [...node.querySelectorAll<HTMLElement>('button')];
        const path = node.querySelector('path')!;
        const state = travel.current;
        const draw = () => {
            const shifts = [0, state.a, state.a + state.b];
            let d = '';
            shifts.forEach((shift, i) => {
                const x = i * 92 + shift,
                    w = 92,
                    h = 44,
                    r = 16;
                buttons[i].style.transform = `translateX(${shift}px)`;
                d += `M${x + r},0H${x + w - r}Q${x + w},0 ${x + w},${r}V${h - r}Q${x + w},${h} ${x + w - r},${h}H${x + r}Q${x},${h} ${x},${h - r}V${r}Q${x},0 ${x + r},0Z`;
                if (i) {
                    const left = (i - 1) * 92 + shifts[i - 1] + 92 - r,
                        right = x + r,
                        mid = (left + right) / 2,
                        s = (right - left) / 4;
                    d += `M${left},0C${left + s},0 ${mid - s},14 ${mid},14C${mid + s},14 ${right - s},0 ${right},0V44C${right - s},44 ${mid + s},30 ${mid},30C${mid - s},30 ${left + s},44 ${left},44Z`;
                }
            });
            path.setAttribute('d', d);
        };
        draw();
        const tween = gsap.to(state, {
            a: !reduced && (selected === 0 || selected === 1) ? 44 * p.gap : 0,
            b: !reduced && selected >= 1 ? 44 * p.gap : 0,
            duration: p.duration,
            ease: motion.ease,
            onUpdate: draw,
        });
        return () => {
            tween.kill();
        };
    }, [selected, p.gap, p.duration, reduced]);
    return (
        <Demo
            title="A connected rightward push"
            hint="The first pill stays anchored; the following labels make room."
            reset={() => {
                reset();
                select(-1);
                setClicked('Hover or focus any label');
            }}
            tryThis="Increase the gap ratio to 1.2. The neck becomes a long bridge and the group needs much more breathing room."
            controls={
                <>
                    <Slider label="Gap / height" value={p.gap} min={0} max={1.2} step={0.02} onChange={(v) => set('gap', v)} help="The source’s opened gap is 58% of the pill height." />
                    <Slider label="Stretch duration" value={p.duration} min={0.1} max={1} step={0.02} onChange={(v) => set('duration', v)} help="How long the connection takes to settle." suffix="s" />
                    <p className="f2l-live-status" aria-live="polite">
                        {clicked}
                    </p>
                </>
            }
        >
            <div className="f2l-hover-stage">
                <div className="f2l-pill-demo" ref={root} onMouseLeave={() => select(-1)}>
                    <svg aria-hidden="true">
                        <path />
                    </svg>
                    {['Explore', 'Objects', 'Stories'].map((text, i) => (
                        <button key={text} onMouseEnter={() => select(i)} onFocus={() => select(i)} onBlur={() => select(-1)} onClick={() => setClicked(`${text} selected — native button behavior`)}>
                            {text}
                        </button>
                    ))}
                </div>
                <span className="f2l-anchor-label">↑ FIXED START · EXPANSION →</span>
            </div>
        </Demo>
    );
}
function PreviewLab() {
    const { p, ref, set, reset } = useParams(previewDefaults);
    const [hover, setHover] = useState(false);
    const host = useRef<HTMLDivElement>(null);
    const frames = useRef<HTMLDivElement>(null);
    const tick = useRef({ elapsed: 0, frame: 0 });
    const { reduced } = useFloema();
    useTicker(host, (_, dt) => {
        if (!hover || reduced) return;
        tick.current.elapsed += dt * 1000;
        if (tick.current.elapsed >= ref.current.cycle) {
            tick.current.elapsed = 0;
            tick.current.frame = (tick.current.frame + 1) % 6;
            if (frames.current)
                [...frames.current.children].forEach((el, i) => {
                    (el as HTMLElement).style.opacity = i === tick.current.frame ? '1' : '0';
                });
        }
    });
    return (
        <Demo
            title="Grow the window, cycle the scene"
            hint="Hover or focus the preview. Its height stays fixed while its width expands."
            reset={() => {
                reset();
                setHover(false);
                tick.current = { elapsed: 0, frame: 0 };
                if (frames.current)
                    [...frames.current.children].forEach((el, i) => {
                        (el as HTMLElement).style.opacity = i === 0 ? '1' : '0';
                    });
            }}
            tryThis="Set the cycle to 150ms. Fast switching competes with reading; return to 850ms and notice the calmer rhythm."
            controls={
                <>
                    <Slider label="Expanded width" value={p.width} min={100} max={300} onChange={(v) => set('width', v)} help="Teaching scale: 250 represents the source’s 25vw." suffix="px" />
                    <Slider
                        label="Image cycle"
                        value={p.cycle}
                        min={150}
                        max={2000}
                        step={50}
                        onChange={(v) => set('cycle', v)}
                        help="Time each image remains visible while the row is active."
                        suffix="ms"
                    />
                </>
            }
        >
            <div ref={host} className="f2l-preview-stage">
                <button
                    aria-label="Expand cycling preview"
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    onFocus={() => setHover(true)}
                    onBlur={() => setHover(false)}
                    onClick={() => setHover((v) => !v)}
                >
                    <strong>Places</strong>
                    <div className="f2l-preview-window" ref={frames} style={{ width: hover ? p.width : 50 }}>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} style={{ opacity: i === 0 ? 1 : 0 }}>
                                <Landscape variant={i} />
                            </div>
                        ))}
                    </div>
                    <span>(06)</span>
                </button>
            </div>
        </Demo>
    );
}
export default function HoverDemo() {
    return (
        <div className="f2l-lab-pair">
            <PillLab />
            <PreviewLab />
        </div>
    );
}
