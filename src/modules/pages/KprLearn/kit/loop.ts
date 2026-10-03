import { type DependencyList, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { gsap } from './gsap';

/**
 * Demo parameters: React state for the sliders (so labels re-render) plus a
 * ref that the animation loop reads every frame without re-rendering.
 * Same split as the source: React state for the UI, a plain object (`film`) for the frame loop.
 */
export function useParams<T extends Record<string, unknown>>(defaults: T) {
    const [p, setP] = useState<T>(defaults);
    const ref = useRef<T>(defaults);
    const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        ref.current = { ...ref.current, [key]: value };
        setP(ref.current);
    }, []);
    /** set several dials at once (presets) */
    const merge = useCallback((patch: Partial<T>) => {
        ref.current = { ...ref.current, ...patch };
        setP(ref.current);
    }, []);
    const reset = useCallback(() => {
        ref.current = defaults;
        setP(defaults);
    }, [defaults]);
    return { p, set, merge, ref, reset };
}

/** True while the element is on screen — demos pause when you scroll past them. */
export function useOnScreen(ref: RefObject<Element | null>, rootMargin = '120px') {
    const [on, setOn] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin });
        io.observe(el);
        return () => io.disconnect();
    }, [ref, rootMargin]);
    return on;
}

/**
 * Runs `cb(time, dt)` on GSAP's ticker — the single clock that also drives
 * Lenis and ScrollTrigger on this page — but only while `host` is visible.
 */
export function useTicker(host: RefObject<Element | null>, cb: (time: number, dt: number) => void) {
    const fn = useRef(cb);
    useEffect(() => {
        fn.current = cb;
    });
    useEffect(() => {
        const el = host.current;
        if (!el) return;
        let visible = false;
        const io = new IntersectionObserver(
            ([e]) => {
                visible = e.isIntersecting;
            },
            { rootMargin: '120px' },
        );
        io.observe(el);
        const tick = (time: number, deltaMs: number) => {
            if (!visible || document.hidden) return;
            fn.current(time, Math.min(deltaMs / 1000, 1 / 20));
        };
        gsap.ticker.add(tick);
        return () => {
            io.disconnect();
            gsap.ticker.remove(tick);
        };
    }, [host]);
}

export type Pointer = { x: number; y: number; px: number; py: number; over: boolean; down: boolean; moved: boolean };

export type ThreeCtx = {
    renderer: THREE.WebGLRenderer;
    canvas: HTMLCanvasElement;
    host: HTMLElement;
    size: { w: number; h: number; dpr: number };
    /** Pointer in NDC (-1..1, y up), plus pixel coords inside the host. */
    pointer: Pointer;
};

export type ThreeApp = {
    frame: (time: number, dt: number) => void;
    resize?: (w: number, h: number) => void;
    dispose?: () => void;
    onClick?: (pointer: Pointer) => void;
};

type Options = { antialias?: boolean; alpha?: boolean; maxDpr?: number; toneMapping?: THREE.ToneMapping };

/**
 * A tiny vanilla three.js harness: canvas + renderer + resize + pointer +
 * visibility-paused loop + full cleanup. `setup` builds the scene once and
 * returns a frame function; read live slider values from a ref inside it.
 */
export function useThreeCanvas(host: RefObject<HTMLElement | null>, setup: (ctx: ThreeCtx) => ThreeApp, deps: DependencyList = [], options: Options = {}) {
    const setupRef = useRef(setup);
    useEffect(() => {
        setupRef.current = setup;
    });

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
        el.appendChild(canvas);

        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas, antialias: options.antialias ?? true, alpha: options.alpha ?? false, powerPreference: 'high-performance' });
        } catch {
            canvas.remove();
            el.insertAdjacentHTML('beforeend', '<p style="padding:24px;font-size:13px;opacity:.6">WebGL is not available in this browser.</p>');
            return;
        }
        const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr ?? 1.75);
        renderer.setPixelRatio(dpr);
        renderer.toneMapping = options.toneMapping ?? THREE.NoToneMapping;

        const ctx: ThreeCtx = {
            renderer,
            canvas,
            host: el,
            size: { w: 1, h: 1, dpr },
            pointer: { x: 0, y: 0, px: 0, py: 0, over: false, down: false, moved: false },
        };
        const app = setupRef.current(ctx);

        const resize = () => {
            const r = el.getBoundingClientRect();
            const w = Math.max(1, Math.round(r.width));
            const h = Math.max(1, Math.round(r.height));
            ctx.size.w = w;
            ctx.size.h = h;
            renderer.setSize(w, h, false);
            app.resize?.(w, h);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        resize();

        const setPointer = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            ctx.pointer.px = e.clientX - r.left;
            ctx.pointer.py = e.clientY - r.top;
            ctx.pointer.x = (ctx.pointer.px / r.width) * 2 - 1;
            ctx.pointer.y = -(ctx.pointer.py / r.height) * 2 + 1;
        };
        let downAt = { x: 0, y: 0, t: 0 };
        const onMove = (e: PointerEvent) => {
            setPointer(e);
            ctx.pointer.over = true;
            if (ctx.pointer.down && Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) > 6) ctx.pointer.moved = true;
        };
        const onLeave = () => {
            ctx.pointer.over = false;
            ctx.pointer.down = false;
        };
        const onDown = (e: PointerEvent) => {
            setPointer(e);
            ctx.pointer.down = true;
            ctx.pointer.moved = false;
            downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
        };
        const onUp = (e: PointerEvent) => {
            setPointer(e);
            const wasClick = ctx.pointer.down && !ctx.pointer.moved && performance.now() - downAt.t < 350;
            ctx.pointer.down = false;
            if (wasClick) app.onClick?.(ctx.pointer);
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerleave', onLeave);
        el.addEventListener('pointerdown', onDown);
        window.addEventListener('pointerup', onUp);

        let visible = false;
        const io = new IntersectionObserver(
            ([e]) => {
                visible = e.isIntersecting;
            },
            { rootMargin: '120px' },
        );
        io.observe(el);
        const tick = (time: number, deltaMs: number) => {
            if (!visible || document.hidden) return;
            app.frame(time, Math.min(deltaMs / 1000, 1 / 20));
        };
        gsap.ticker.add(tick);

        return () => {
            gsap.ticker.remove(tick);
            io.disconnect();
            ro.disconnect();
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerleave', onLeave);
            el.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointerup', onUp);
            app.dispose?.();
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/** Dispose every geometry/material/texture under an object. */
export function disposeTree(root: THREE.Object3D) {
    root.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => {
            Object.values(mat as unknown as Record<string, unknown>).forEach((v) => (v as THREE.Texture)?.isTexture && (v as THREE.Texture).dispose());
            mat.dispose();
        });
    });
}
