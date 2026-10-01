import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { gsap } from './gsap';

/**
 * Demo parameters: React state for the sliders (so labels re-render) plus a ref
 * that animation loops read every frame without re-rendering.
 */
export function useParams<T extends Record<string, unknown>>(defaults: T) {
    const [p, setP] = useState<T>(defaults);
    const ref = useRef<T>(defaults);
    const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        ref.current = { ...ref.current, [key]: value };
        setP(ref.current);
    }, []);
    const reset = useCallback(() => {
        ref.current = defaults;
        setP(defaults);
    }, [defaults]);
    return { p, set, ref, reset };
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

/** Runs `cb(time, dt)` on GSAP's ticker (the one clock) only while `host` is visible. */
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

/** Scroll progress 0..1 of an inner scroll box (a demo's own scroller), delivered on the shared ticker. */
export function useBoxProgress(box: RefObject<HTMLElement | null>, cb: (progress: number, dt: number) => void) {
    useTicker(box, (_t, dt) => {
        const el = box.current;
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        cb(max > 0 ? el.scrollTop / max : 0, dt);
    });
}

/** Reduced-motion preference, read live. */
export function useReducedMotion() {
    const [r, setR] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setR(mq.matches);
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);
    return r;
}
