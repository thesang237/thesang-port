'use client';

import { type RefObject, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export type Draw = (context: CanvasRenderingContext2D, width: number, height: number) => void;

/** Static studies redraw on dial changes and resize; no perpetual clock. */
export function useStudyCanvas(draw: Draw) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const latest = useRef(draw);
    useEffect(() => {
        latest.current = draw;
    });
    useEffect(() => {
        const element = canvas.current;
        const host = element?.parentElement;
        if (!element || !host) return;
        const render = () => {
            const width = host.clientWidth;
            const height = host.clientHeight;
            if (!width || !height) return;
            const ratio = Math.min(devicePixelRatio, 2);
            element.width = Math.round(width * ratio);
            element.height = Math.round(height * ratio);
            const context = element.getContext('2d');
            if (!context) return;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            latest.current(context, width, height);
        };
        const observer = new ResizeObserver(render);
        observer.observe(host);
        render();
        return () => {
            observer.disconnect();
            element.width = 0;
            element.height = 0;
        };
    }, []);
    useEffect(() => {
        const element = canvas.current;
        const context = element?.getContext('2d');
        const host = element?.parentElement;
        if (context && host) draw(context, host.clientWidth, host.clientHeight);
    }, [draw]);
    return canvas;
}

/** Living studies and Lenis share GSAP's single clock. No work while hidden. */
export function useStudyClock(host: RefObject<HTMLElement | null>, frame: (dt: number) => void) {
    const latest = useRef(frame);
    useEffect(() => {
        latest.current = frame;
    });
    useEffect(() => {
        const element = host.current;
        if (!element) return;
        let visible = false;
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        observer.observe(element);
        const tick = (_time: number, delta: number) => {
            if (visible && !document.hidden) latest.current(Math.min(delta / 1000, 0.05));
        };
        gsap.ticker.add(tick);
        return () => {
            observer.disconnect();
            gsap.ticker.remove(tick);
        };
    }, [host]);
}
