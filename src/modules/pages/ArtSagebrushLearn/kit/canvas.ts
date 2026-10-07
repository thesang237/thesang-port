import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export type Drawing = { step: () => boolean; dispose?: () => void };
/** All progressive studies share GSAP's clock. Static field studies use no clock.
 * Each job has its own work budget and exists only while its chapter is mounted. */
export function useDrawing(setup: (ctx: CanvasRenderingContext2D) => Drawing, playing: boolean, onComplete: () => void) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const playingRef = useRef(playing);
    useEffect(() => {
        playingRef.current = playing;
    }, [playing]);
    useEffect(() => {
        const element = canvas.current;
        const ctx = element?.getContext('2d');
        if (!element || !ctx) return;
        const job = setup(ctx);
        let visible = false;
        let complete = false;
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        observer.observe(element);
        const tick = () => {
            if (playingRef.current && visible && !document.hidden && !complete) {
                complete = job.step();
                if (complete) onComplete();
            }
        };
        gsap.ticker.add(tick);
        return () => {
            observer.disconnect();
            gsap.ticker.remove(tick);
            job.dispose?.();
        };
    }, [setup, onComplete]);
    return canvas;
}
