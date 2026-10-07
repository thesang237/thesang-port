'use client';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';

import { createPrintPipeline } from '@/modules/pages/Dithering/pipeline';
import type { DitherSettings } from '@/modules/pages/Dithering/settings';

import { FIELD_FRAGMENT, FIELD_VERTEX } from './fields.glsl';

export type LabParams = { dither: DitherSettings; subject: number; phase: number; frequency: number; density: number; play: boolean; preGlow: boolean; postGlow: boolean };
const NO_GLOW = { enabled: false, intensity: 0.6, threshold: 0.65, smoothing: 0.2, radius: 0.65 };

/** One owner for context, resize, visibility, clock and disposal. No React updates per frame. */
export function usePrintCanvas(host: RefObject<HTMLDivElement | null>, params: LabParams) {
    const update = useRef<((p: LabParams) => void) | null>(null);
    useEffect(() => {
        const element = host.current;
        if (!element) return;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', { antialias: false, alpha: false });
        if (!context) {
            element.setAttribute('data-unavailable', 'true');
            return;
        }
        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({ canvas, context, antialias: false, alpha: false });
        } catch {
            element.setAttribute('data-unavailable', 'true');
            return;
        }
        canvas.setAttribute('aria-label', 'Live procedural image treated with the studio print shader');
        canvas.setAttribute('role', 'img');
        element.appendChild(canvas);
        const scene = new Scene();
        const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const material = new ShaderMaterial({
            vertexShader: FIELD_VERTEX,
            fragmentShader: FIELD_FRAGMENT,
            uniforms: { size: { value: new Vector2(1, 1) }, subject: { value: 0 }, phase: { value: 0 }, frequency: { value: 9 } },
            depthTest: false,
            depthWrite: false,
        });
        const geometry = new PlaneGeometry(2, 2);
        scene.add(new Mesh(geometry, material));
        const pipeline = createPrintPipeline(renderer, scene, camera);
        renderer.info.autoReset = false;
        let current: LabParams;
        let visible = false;
        let lost = false;
        let phase = 0;
        let frames = 0;
        let lastReport = 0;
        const render = (delta: number) => {
            if (lost) return;
            material.uniforms.phase.value = current.phase + phase;
            renderer.info.reset();
            pipeline.render(delta);
            frames++;
            canvas.dataset.frames = String(frames);
        };
        const resize = () => {
            if (!current || lost) return;
            const width = Math.max(element.clientWidth, 1);
            const height = Math.max(element.clientHeight, 1);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, current.density));
            renderer.setSize(width, height, false);
            material.uniforms.size.value.set(width, height);
            pipeline.resize(width, height);
            render(0);
        };
        update.current = (p) => {
            const densityChanged = !current || current.density !== p.density;
            current = p;
            material.uniforms.subject.value = p.subject;
            material.uniforms.frequency.value = p.frequency;
            pipeline.update(p.dither, { ...NO_GLOW, enabled: p.preGlow }, { ...NO_GLOW, enabled: p.postGlow });
            if (densityChanged) resize();
            else render(0);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        const intersection = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
            },
            { rootMargin: '0px' },
        );
        intersection.observe(element);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const calm = () => {
            phase = 0;
            if (current) render(0);
        };
        reduced.addEventListener('change', calm);
        const contextLost = () => {
            lost = true;
            element.setAttribute('data-unavailable', 'true');
        };
        canvas.addEventListener('webglcontextlost', contextLost);
        const tick = (time: number, ms: number) => {
            if (!current || !visible || document.hidden || lost) {
                return;
            }
            const delta = Math.min(ms / 1000, 0.05);
            if (current.play && !reduced.matches) phase += delta * 0.4;
            // The runtime bench needs repeated frames to measure; other still labs render on edits only.
            if ((current.play && !reduced.matches) || element.dataset.bench === 'true') render(delta);
            if (time - lastReport > 0.5) {
                const fps = Math.round(1 / Math.max(ms / 1000, 0.001));
                const rate = current.play || element.dataset.bench === 'true' ? `${fps} ticker fps` : 'Still frame';
                const stats = element.parentElement?.querySelector<HTMLElement>('[data-stats]');
                if (stats)
                    stats.textContent = `${rate} · ${renderer.info.render.calls} draws · ${renderer.info.memory.geometries} geometries · ${renderer.info.memory.textures} textures · ${canvas.width} × ${canvas.height}`;
                canvas.dataset.drawCalls = String(renderer.info.render.calls);
                canvas.dataset.geometries = String(renderer.info.memory.geometries);
                canvas.dataset.textures = String(renderer.info.memory.textures);
                lastReport = time;
            }
        };
        gsap.ticker.add(tick);
        return () => {
            update.current = null;
            observer.disconnect();
            intersection.disconnect();
            gsap.ticker.remove(tick);
            reduced.removeEventListener('change', calm);
            canvas.removeEventListener('webglcontextlost', contextLost);
            pipeline.dispose();
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        };
    }, [host]);
    useEffect(() => {
        update.current?.(params);
    }, [params]);
}
