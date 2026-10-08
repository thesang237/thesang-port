'use client';
import { type RefObject, useEffect } from 'react';

type Gesture = { wheel?: (x: number, y: number) => void; drag?: (x: number, y: number, start: boolean) => void; key?: (key: string) => void };
/** Pointer capture keeps drags continuous; listeners belong to this route only. */
export function useGesture(root: RefObject<HTMLElement | null>, handlers: Gesture) {
    useEffect(() => {
        const element = root.current;
        if (!element) return;
        let pointer: { x: number; y: number; id: number } | null = null;
        let moved = false;
        const wheel = (event: WheelEvent) => {
            if (event.ctrlKey) return;
            event.preventDefault();
            const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
            handlers.wheel?.(event.deltaX * multiplier, event.deltaY * multiplier);
        };
        const down = (event: PointerEvent) => {
            if (event.button !== 0 || (event.target as HTMLElement).closest('a')) return;
            pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
            moved = false;
            handlers.drag?.(0, 0, true);
        };
        const move = (event: PointerEvent) => {
            if (!pointer || pointer.id !== event.pointerId) return;
            const x = event.clientX - pointer.x;
            const y = event.clientY - pointer.y;
            if (Math.abs(x) + Math.abs(y) > 6) {
                moved = true;
                element.setPointerCapture(event.pointerId);
            }
            handlers.drag?.(x, y, false);
        };
        const up = () => {
            pointer = null;
        };
        const click = (event: MouseEvent) => {
            if (moved) {
                event.preventDefault();
                event.stopPropagation();
                moved = false;
            }
        };
        const key = (event: KeyboardEvent) => {
            if (event.defaultPrevented || element.inert || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable=true]')) return;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) {
                event.preventDefault();
                handlers.key?.(event.key);
            }
        };
        element.addEventListener('wheel', wheel, { passive: false });
        element.addEventListener('pointerdown', down);
        element.addEventListener('pointermove', move);
        element.addEventListener('pointerup', up);
        element.addEventListener('pointercancel', up);
        element.addEventListener('click', click, true);
        window.addEventListener('keydown', key);
        return () => {
            element.removeEventListener('wheel', wheel);
            element.removeEventListener('pointerdown', down);
            element.removeEventListener('pointermove', move);
            element.removeEventListener('pointerup', up);
            element.removeEventListener('pointercancel', up);
            element.removeEventListener('click', click, true);
            window.removeEventListener('keydown', key);
        };
    }, [root, handlers]);
}
