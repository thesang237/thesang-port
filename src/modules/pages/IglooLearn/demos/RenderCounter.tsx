'use client';

import { useEffect, useRef, useState } from 'react';

import { Demo } from '../kit/controls';
import { useTicker } from '../kit/loop';

/** Animating through React state: re-renders every frame. */
function ViaState() {
    const [x, setX] = useState(0);
    const host = useRef<HTMLDivElement>(null);
    const count = useRef<HTMLSpanElement>(null);
    const renders = useRef(0);
    useTicker(host, (t) => setX(Math.sin(t * 2) * 0.5 + 0.5));
    useEffect(() => {
        renders.current += 1;
        if (count.current) count.current.textContent = renders.current.toLocaleString();
    });
    return (
        <div ref={host} className="rounded-xl border border-[rgba(255,208,138,0.3)] p-4">
            <div className="il-mono mb-3 flex justify-between text-[10.5px]">
                <span className="text-[var(--il-warn)]">setState every frame</span>
                <span className="text-[var(--il-dim)]">
                    React renders: <span ref={count} className="tabular-nums text-[var(--il-ink)]" />
                </span>
            </div>
            <div className="relative h-10 rounded-lg bg-white/5">
                <span className="absolute top-1 block size-8 rounded-md bg-[var(--il-warn)]" style={{ left: `calc(${x * 100}% - ${x * 32}px)` }} />
            </div>
        </div>
    );
}

/** Animating through a ref: one React render, then direct style writes. */
function ViaRef() {
    const host = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLSpanElement>(null);
    const count = useRef<HTMLSpanElement>(null);
    const renders = useRef(0);
    useTicker(host, (t) => {
        const x = Math.sin(t * 2) * 0.5 + 0.5;
        if (box.current) box.current.style.left = `calc(${x * 100}% - ${x * 32}px)`;
    });
    useEffect(() => {
        renders.current += 1;
        if (count.current) count.current.textContent = renders.current.toLocaleString();
    });
    return (
        <div ref={host} className="rounded-xl border border-[rgba(174,240,216,0.3)] p-4">
            <div className="il-mono mb-3 flex justify-between text-[10.5px]">
                <span className="text-[var(--il-mint)]">ref + style write</span>
                <span className="text-[var(--il-dim)]">
                    React renders: <span ref={count} className="tabular-nums text-[var(--il-ink)]" />
                </span>
            </div>
            <div className="relative h-10 rounded-lg bg-white/5">
                <span ref={box} className="absolute top-1 block size-8 rounded-md bg-[var(--il-mint)]" />
            </div>
        </div>
    );
}

/** Same motion, two plumbing choices. Count the React renders. */
export default function RenderCounter() {
    return (
        <Demo title="React renders vs direct writes" hint="Both boxes move identically. Watch the counters: one re-renders a component 60 times a second, the other rendered once.">
            <div className="grid gap-3 p-4 sm:grid-cols-2">
                <ViaState />
                <ViaRef />
            </div>
        </Demo>
    );
}
