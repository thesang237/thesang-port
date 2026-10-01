'use client';

import { type MouseEvent, useRef } from 'react';

import { Demo, Slider } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { LoopArrow, ReturnArrow } from '../kit/source';

const DEFAULTS = { duration: 0.25, dx: 14, dy: 12 };

/** The On/Off track buttons: a label that trails the cursor with a short tween instead of snapping to it. */
export default function TooltipFollow() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const stage = useRef<HTMLDivElement>(null);
    const tip = useRef<HTMLSpanElement>(null);

    const move = (e: MouseEvent<HTMLElement>, label: string) => {
        const t = tip.current;
        const box = stage.current?.getBoundingClientRect();
        if (!t || !box) return;
        t.textContent = label;
        const { duration, dx, dy } = ref.current;
        gsap.to(t, { x: e.clientX - box.left + dx, y: e.clientY - box.top + dy, autoAlpha: 1, duration, ease: 'power3.out' });
    };
    const hide = () => gsap.to(tip.current, { autoAlpha: 0, duration: 0.2 });

    return (
        <Demo
            title="Cursor tooltip"
            hint="Move over the two lime buttons. The label chases the cursor — every mouse move starts a new 0.25 s tween that replaces the old one."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="duration"
                        value={p.duration}
                        min={0}
                        max={1.2}
                        onChange={(v) => set('duration', v)}
                        format={(v) => `${v.toFixed(2)} s`}
                        help="0 = glued to the cursor. Source: 0.25 s power3.out."
                    />
                    <Slider label="offset x" value={p.dx} min={-40} max={60} step={1} onChange={(v) => set('dx', v)} format={(v) => `${v} px`} />
                    <Slider
                        label="offset y"
                        value={p.dy}
                        min={-40}
                        max={60}
                        step={1}
                        onChange={(v) => set('dy', v)}
                        format={(v) => `${v} px`}
                        help="Keep the label off the pointer so it never covers what you’re aiming at."
                    />
                </>
            }
        >
            <div ref={stage} className="relative flex min-h-[240px] items-center justify-center gap-16 overflow-hidden bg-[#eff0e8]">
                {[
                    ['On Track Page', <ReturnArrow key="r" className="size-7" />],
                    ['Off Track Page', <LoopArrow key="l" className="size-7" />],
                ].map(([label, icon]) => (
                    <button
                        key={label as string}
                        type="button"
                        aria-label={label as string}
                        onMouseMove={(e) => move(e, label as string)}
                        onMouseLeave={hide}
                        className="flex size-[66px] items-center justify-center rounded-lg bg-[#cdff0b] text-[#1b1c17] transition-transform active:scale-95"
                    >
                        {icon}
                    </button>
                ))}
                <span
                    ref={tip}
                    className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap rounded-[3px] bg-[rgba(240,241,234,0.95)] px-2 py-[3px] text-[12px] font-semibold text-[#8a8c83] opacity-0 shadow-sm"
                    aria-hidden
                />
            </div>
        </Demo>
    );
}
