'use client';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { gsap } from '../../FloemaTwo/motion';
export { clamp, gsap, motion, ScrollTrigger } from '../../FloemaTwo/motion';
export { useFloema } from '../../FloemaTwo/Shell';
export function useParams<T extends Record<string, number | boolean | string>>(defaults: T) {
    const [p, setP] = useState<T>({ ...defaults });
    const ref = useRef<T>({ ...defaults });
    const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        ref.current = { ...ref.current, [key]: value };
        setP(ref.current);
    }, []);
    const reset = useCallback(() => {
        ref.current = { ...defaults };
        setP(ref.current);
    }, [defaults]);
    return { p, ref, set, reset };
}
export function useTicker(host: RefObject<HTMLElement | null>, callback: (time: number, dt: number) => void) {
    const fn = useRef(callback);
    useEffect(() => {
        fn.current = callback;
    }, [callback]);
    useEffect(() => {
        const el = host.current;
        if (!el) return;
        let visible = false;
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        observer.observe(el);
        const tick = (time: number, ms: number) => {
            if (visible && !document.hidden) fn.current(time, Math.min(ms / 1000, 0.05));
        };
        gsap.ticker.add(tick);
        return () => {
            observer.disconnect();
            gsap.ticker.remove(tick);
        };
    }, [host]);
}
