'use client';

/** DOM updaters that run once per frame on the shared gsap ticker (after the film clock updates). */
type Fn = () => void;
const fns = new Set<Fn>();

export function onFrame(fn: Fn) {
    fns.add(fn);
    return () => {
        fns.delete(fn);
    };
}

export function runFrame() {
    fns.forEach((fn) => fn());
}

export function clearFrame() {
    fns.clear();
}
