import { type RefObject, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import { gsap } from './motion';

export function useParams<T extends Record<string, number | boolean | string>>(defaults: T) {
    const [values, setValues] = useState(defaults);
    const live = useRef(defaults);
    const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        live.current = { ...live.current, [key]: value };
        setValues(live.current);
    }, []);
    const reset = useCallback(() => {
        live.current = { ...defaults };
        setValues(live.current);
    }, [defaults]);
    return { values, live, set, reset };
}

/** All continuous demos share GSAP's clock and stop outside the viewport. */
export function useTicker(host: RefObject<HTMLElement | null>, frame: (time: number, dt: number) => void) {
    const onFrame = useEffectEvent(frame);
    useEffect(() => {
        const element = host.current;
        if (!element) return;
        let visible = false;
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        observer.observe(element);
        const tick = (time: number, delta: number) => {
            if (visible && !document.hidden) onFrame(time, Math.min(delta / 1000, 0.05));
        };
        gsap.ticker.add(tick);
        return () => {
            observer.disconnect();
            gsap.ticker.remove(tick);
        };
    }, [host]);
}

/** Explicit playback, no moving demo starts automatically. */
export function useReducedMotion() {
    const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const changed = () => setReduced(query.matches);
        query.addEventListener('change', changed);
        return () => query.removeEventListener('change', changed);
    }, []);
    return reduced;
}

export function useDemoTimeline(host: RefObject<HTMLElement | null>) {
    const timeline = useRef<gsap.core.Timeline | null>(null);
    useEffect(() => {
        const element = host.current;
        if (!element) return;
        let resume = false;
        let visible = false;
        const sync = () => {
            if (!visible || document.hidden) {
                if (timeline.current?.isActive()) resume = true;
                timeline.current?.pause();
            } else if (resume) {
                timeline.current?.resume();
                resume = false;
            }
        };
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
        });
        document.addEventListener('visibilitychange', sync);
        observer.observe(element);
        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', sync);
            // The current animation may be replaced by an interaction; dispose that latest instance.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            timeline.current?.kill();
        };
    }, [host]);
    return timeline;
}
