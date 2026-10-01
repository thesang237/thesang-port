'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Draws its children at a virtual width (e.g. a 1440px-wide window) and scales the whole thing down to fit the
 * available space. The outer box takes the scaled height, so the layout around it stays correct.
 */
export default function ScaledBox({ width, children, onScale, className }: { width: number; children: ReactNode; onScale?: (s: number) => void; className?: string }) {
    const outer = useRef<HTMLDivElement>(null);
    const inner = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [h, setH] = useState(0);
    const cb = useRef(onScale);
    useEffect(() => {
        cb.current = onScale;
    });

    useEffect(() => {
        const o = outer.current;
        const i = inner.current;
        if (!o || !i) return;
        const measure = () => {
            const s = Math.min(1, o.clientWidth / width);
            setScale(s);
            setH(i.offsetHeight * s);
            cb.current?.(s);
        };
        const ro = new ResizeObserver(measure);
        ro.observe(o);
        ro.observe(i);
        measure();
        return () => ro.disconnect();
    }, [width]);

    return (
        <div ref={outer} className={className} style={{ height: h || undefined, overflow: 'hidden' }}>
            <div ref={inner} style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                {children}
            </div>
        </div>
    );
}
