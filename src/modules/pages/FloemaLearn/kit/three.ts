import { type RefObject, useEffect, useEffectEvent } from 'react';
import { NoToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';

import { gsap } from './motion';

export type ThreeStudy = { frame: (time: number, dt: number, frameMs: number) => void; resize: (width: number, height: number) => void; dispose: () => void };
/** Small teaching harness: one GPU context, shared GSAP clock, explicit ownership. */
export function useThreeStudy(host: RefObject<HTMLDivElement | null>, setup: (renderer: WebGLRenderer, element: HTMLDivElement) => ThreeStudy) {
    const create = useEffectEvent(setup);
    useEffect(() => {
        const element = host.current;
        if (!element) return;
        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({ alpha: true, antialias: true });
        } catch {
            const fallback = document.createElement('p');
            fallback.textContent = 'WebGL is unavailable. The formula and source excerpt below still explain the effect.';
            fallback.className = 'fl-gpu-fallback';
            element.appendChild(fallback);
            return () => fallback.remove();
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = NoToneMapping;
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        element.appendChild(canvas);
        const app = create(renderer, element);
        const resize = () => {
            const width = element.clientWidth,
                height = element.clientHeight;
            renderer.setSize(width, height, false);
            app.resize(width, height);
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(element);
        resize();
        let visible = false,
            lost = false;
        const intersection = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        intersection.observe(element);
        const contextLost = (event: Event) => {
            event.preventDefault();
            lost = true;
            canvas.style.opacity = '0';
            element.dataset.failed = 'true';
        };
        const contextRestored = () => {
            lost = false;
            canvas.style.opacity = '1';
            delete element.dataset.failed;
        };
        canvas.addEventListener('webglcontextlost', contextLost);
        canvas.addEventListener('webglcontextrestored', contextRestored);
        const tick = (time: number, ms: number) => {
            if (visible && !document.hidden && !lost) app.frame(time, Math.min(ms / 1000, 0.05), ms);
        };
        gsap.ticker.add(tick);
        return () => {
            gsap.ticker.remove(tick);
            intersection.disconnect();
            resizeObserver.disconnect();
            canvas.removeEventListener('webglcontextlost', contextLost);
            canvas.removeEventListener('webglcontextrestored', contextRestored);
            app.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        };
    }, [host]);
}
