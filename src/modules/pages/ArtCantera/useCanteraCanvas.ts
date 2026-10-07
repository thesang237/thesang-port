'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

import type { RenderReply, RenderRequest } from './art/render.worker';

/** Owns one worker per canvas. Unmount terminates computation and releases its terrain and canvases. */
export function useCanteraCanvas(canvas: RefObject<HTMLCanvasElement | null>, hash: string, width: number, height: number, animate: boolean, releaseAfterPrint = false) {
    const [report, setReport] = useState({ progress: 0, error: '', buildMs: 0, frameMs: 0 });
    const worker = useRef<Worker | null>(null);
    const requestedMotion = useRef(animate);
    useEffect(() => {
        requestedMotion.current = animate;
    });
    useEffect(() => {
        const element = canvas.current;
        const context = element?.getContext('2d');
        if (!element || !context) return;
        element.width = width;
        element.height = height;
        const renderer = new Worker(new URL('./art/render.worker.ts', import.meta.url));
        worker.current = renderer;
        let visible = true;
        const send = (request: RenderRequest) => renderer.postMessage(request);
        renderer.onmessage = ({ data }: MessageEvent<RenderReply>) => {
            if (data.type === 'error') {
                setReport((current) => ({ ...current, error: data.message }));
                return;
            }
            context.drawImage(data.bitmap, 0, 0);
            data.bitmap.close();
            if (data.progress === 1 && releaseAfterPrint) {
                renderer.terminate();
                worker.current = null;
            }
            element.dataset.progress = String(data.progress);
            element.dataset.buildMs = String(Math.round(data.buildMs));
            element.dataset.frameMs = String(Math.round(data.frameMs));
            setReport((current) => (current.progress === data.progress && !current.error ? current : { progress: data.progress, error: '', buildMs: data.buildMs, frameMs: data.frameMs }));
        };
        renderer.onerror = () => setReport((current) => ({ ...current, error: 'Rendering stopped. Reload or choose another seed.' }));
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            send({ type: 'visibility', visible: visible && !document.hidden });
        });
        const onVisibility = () => send({ type: 'visibility', visible: visible && !document.hidden });
        const onMotion = (event: MediaQueryListEvent) => send({ type: 'motion', animate: !event.matches && requestedMotion.current });
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        media.addEventListener('change', onMotion);
        document.addEventListener('visibilitychange', onVisibility);
        observer.observe(element);
        send({ type: 'init', hash, width, height, animate });

        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            media.removeEventListener('change', onMotion);
            renderer.terminate();
            if (worker.current === renderer) worker.current = null;
            element.width = 0;
            element.height = 0;
        };
        // Motion is updated separately without regenerating the seeded scene.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvas, hash, width, height, releaseAfterPrint]);
    useEffect(() => {
        worker.current?.postMessage({ type: 'motion', animate } satisfies RenderRequest);
    }, [animate]);
    return report;
}
