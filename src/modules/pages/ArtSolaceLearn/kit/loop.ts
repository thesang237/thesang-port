import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { gsap } from './gsap';

/**
 * Demo parameters: React state for the sliders (so labels re-render) plus a ref that the animation
 * loop reads every frame without re-rendering.
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

/** True while the element is on screen: demos pause when you scroll past them. */
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
 * Runs `cb(time, dt)` on GSAP's ticker (the single clock that also drives Lenis on this guide),
 * but only while `host` is visible and the tab is in front.
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
            if (!visible) return; // (hidden tabs get no frames at all: the ticker runs on requestAnimationFrame)
            fn.current(time, Math.min(deltaMs / 1000, 1 / 20));
        };
        gsap.ticker.add(tick);
        return () => {
            io.disconnect();
            gsap.ticker.remove(tick);
        };
    }, [host]);
}

/** The reader asked for less motion (OS setting): demos then wait for a click before moving. */
export function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A 2D canvas that fills its host at a fixed pixel density. Calls `draw(ctx, w, h)` whenever the host
 * resizes or `deps` change. `w`, `h` are CSS pixels; the context is already scaled.
 */
export function useCanvas2D(host: RefObject<HTMLElement | null>, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[], dpr = 2) {
    const drawRef = useRef(draw);
    useEffect(() => {
        drawRef.current = draw;
    });
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const size = useRef({ w: 0, h: 0 });

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const c = document.createElement('canvas');
        c.style.cssText = 'display:block;width:100%;height:100%;';
        el.appendChild(c);
        canvas.current = c;
        const ro = new ResizeObserver(() => {
            const r = el.getBoundingClientRect();
            const w = Math.max(1, Math.round(r.width));
            const h = Math.max(1, Math.round(r.height));
            if (w === size.current.w && h === size.current.h) return;
            size.current = { w, h };
            c.width = w * dpr;
            c.height = h * dpr;
            const ctx = c.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawRef.current(ctx, w, h);
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            c.remove();
            canvas.current = null;
            size.current = { w: 0, h: 0 };
        };
    }, [host, dpr]);

    useEffect(() => {
        const c = canvas.current;
        const ctx = c?.getContext('2d');
        if (!ctx || !size.current.w) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawRef.current(ctx, size.current.w, size.current.h);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return canvas;
}

/** The value, but only after it stopped changing for `ms` (typing into a seed box shouldn't redraw on every key). */
export function useDebounced<T>(value: T, ms = 200) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setV(value), ms);
        return () => window.clearTimeout(t);
    }, [value, ms]);
    return v;
}
