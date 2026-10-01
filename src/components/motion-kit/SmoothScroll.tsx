'use client';

import { type ReactNode, useLayoutEffect, useSyncExternalStore } from 'react';
import Lenis, { type LenisOptions } from 'lenis';

import { gsap, ScrollTrigger } from './gsap';

// The page has one window-level Lenis at a time; components read it through a tiny external store.
let current: Lenis | null = null;
const listeners = new Set<() => void>();
const setCurrent = (next: Lenis | null) => {
    current = next;
    listeners.forEach((fn) => fn());
};
const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};

export const useSmoothScroll = () =>
    useSyncExternalStore(
        subscribe,
        () => current,
        () => null,
    );

type Props = {
    children: ReactNode;
    options?: LenisOptions;
};

/**
 * Lenis on the window, driven by gsap.ticker so ScrollTrigger and Lenis share one clock.
 * lerp 0.1 = the decay measured in the reference video (x0.55 per 100ms).
 */
export default function SmoothScroll({ children, options }: Props) {
    useLayoutEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // reduced motion: native-feeling scroll (no easing), ScrollTrigger still driven through Lenis
        const instance = new Lenis({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false, ...options, ...(reduce ? { smoothWheel: false } : null) });
        const onTick = (time: number) => instance.raf(time * 1000);

        instance.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(onTick);
        gsap.ticker.lagSmoothing(0);
        window.__lenis = instance;
        setCurrent(instance);

        return () => {
            gsap.ticker.remove(onTick);
            instance.destroy();
            if (window.__lenis === instance) delete window.__lenis;
            if (current === instance) setCurrent(null);
        };
    }, [options]);

    return children;
}
