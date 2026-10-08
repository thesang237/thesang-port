import { useEffect, useRef, useState } from 'react';

import { Demo, Slider } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { clamp, damp } from '../kit/motion';
import { Artwork } from '../kit/ui';

const DEFAULTS = { threshold: 6 };
export default function Gestures() {
    const host = useRef<HTMLDivElement>(null),
        card = useRef<HTMLButtonElement>(null),
        readout = useRef<HTMLOutputElement>(null);
    const runtime = useRef({ target: 0, current: 0 });
    const { values, live, set, reset } = useParams(DEFAULTS);
    const [message, setMessage] = useState('Drag, wheel, or use ← → after focusing the card.');
    useEffect(() => {
        const element = host.current;
        if (!element) return;
        const r = runtime.current;
        let pointer: { x: number; target: number; id: number } | null = null,
            moved = false;
        const down = (event: PointerEvent) => {
            if (event.button !== 0) return;
            pointer = { x: event.clientX, target: r.target, id: event.pointerId };
            moved = false;
        };
        const move = (event: PointerEvent) => {
            if (!pointer) return;
            const dx = event.clientX - pointer.x;
            if (Math.abs(dx) > live.current.threshold) {
                moved = true;
                element.setPointerCapture(event.pointerId);
            }
            r.target = clamp(pointer.target + dx, -100, 100);
        };
        const up = () => {
            if (moved) setMessage('Drag recognized. The following click is suppressed.');
            pointer = null;
        };
        const click = (event: MouseEvent) => {
            if (moved) {
                event.preventDefault();
                event.stopPropagation();
                moved = false;
            }
        };
        const wheel = (event: WheelEvent) => {
            if (event.ctrlKey) return;
            event.preventDefault();
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
            r.target = clamp(r.target - (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit, -100, 100);
            setMessage('Wheel normalized → the same target number.');
        };
        element.addEventListener('pointerdown', down);
        element.addEventListener('pointermove', move);
        element.addEventListener('pointerup', up);
        element.addEventListener('pointercancel', up);
        element.addEventListener('click', click, true);
        element.addEventListener('wheel', wheel, { passive: false });
        return () => {
            element.removeEventListener('pointerdown', down);
            element.removeEventListener('pointermove', move);
            element.removeEventListener('pointerup', up);
            element.removeEventListener('pointercancel', up);
            element.removeEventListener('click', click, true);
            element.removeEventListener('wheel', wheel);
        };
    }, [live]);
    useTicker(host, (_t, dt) => {
        const r = runtime.current;
        r.current = damp(r.current, r.target, 0.1, dt);
        if (card.current) card.current.style.transform = `translateX(${r.current}px)`;
        if (readout.current) readout.current.textContent = `target ${r.target.toFixed(0)}px / current ${r.current.toFixed(0)}px`;
    });
    return (
        <Demo
            stageRef={host}
            className="fl-gesture-demo"
            title="One card, three inputs"
            hint="Drag the card. A still click selects it; a drag does not."
            onReset={() => {
                reset();
                runtime.current.target = 0;
                setMessage('Ready for another gesture.');
            }}
            controls={
                <>
                    <Slider
                        label="Drag threshold"
                        value={values.threshold}
                        min={0}
                        max={30}
                        unit="px"
                        help="Movement beyond this becomes a drag; source uses 6px."
                        onChange={(v) => set('threshold', v)}
                    />
                    <output className="fl-readout" ref={readout} />
                    <p className="fl-event-message" role="status">
                        {message}
                    </p>
                </>
            }
        >
            <button
                ref={card}
                className="fl-gesture-card"
                onClick={() => setMessage('Still click recognized. This could open the product.')}
                onKeyDown={(event) => {
                    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                        event.preventDefault();
                        runtime.current.target = event.key === 'Home' ? -100 : event.key === 'End' ? 100 : clamp(runtime.current.target + (event.key === 'ArrowRight' ? 50 : -50), -100, 100);
                        setMessage('Keyboard → the same target number.');
                    }
                }}
                aria-label="Interactive card. Drag, click, or use arrow keys."
            >
                <Artwork index={2} />
            </button>
            <p className="fl-stage-caption">← drag / wheel / keyboard →</p>
        </Demo>
    );
}
