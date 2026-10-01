'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

import { Demo, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';

const DEFAULTS = { lerp: 0.085, wheel: 0.85, smooth: true };
const HISTORY = 150;

function Frames({ label }: { label: string }) {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 14 }, (_, i) => (
                <div key={i} className="flex h-[74px] items-end justify-between rounded-xl border border-[var(--il-line)] bg-[linear-gradient(135deg,rgba(148,219,255,0.08),transparent)] p-3">
                    <span className="il-mono text-[10px] text-[var(--il-faint)]">{label}</span>
                    <span className="text-[22px] font-semibold tabular-nums tracking-[-0.03em] text-[var(--il-dim)]">{String(i + 1).padStart(2, '0')}</span>
                </div>
            ))}
        </div>
    );
}

/** Same content, two scroll engines — plus a live graph of the scroll position. */
export default function ScrollFeel() {
    const { p, set, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const nativeBox = useRef<HTMLDivElement>(null);
    const smoothBox = useRef<HTMLDivElement>(null);
    const smoothContent = useRef<HTMLDivElement>(null);
    const graph = useRef<HTMLCanvasElement>(null);
    const lenis = useRef<Lenis | null>(null);
    const hist = useRef({ a: [] as number[], b: [] as number[] });

    // a Lenis instance scoped to the right-hand box (wrapper + content)
    useEffect(() => {
        if (!smoothBox.current || !smoothContent.current) return;
        const l = new Lenis({ wrapper: smoothBox.current, content: smoothContent.current, lerp: p.lerp, wheelMultiplier: p.wheel, smoothWheel: p.smooth, autoRaf: false });
        lenis.current = l;
        return () => {
            l.destroy();
            lenis.current = null;
        };
    }, [p.lerp, p.wheel, p.smooth]);

    useTicker(host, (time) => {
        lenis.current?.raf(time * 1000);
        const h = hist.current;
        h.a.push(nativeBox.current?.scrollTop ?? 0);
        h.b.push(smoothBox.current?.scrollTop ?? 0);
        if (h.a.length > HISTORY) h.a.shift();
        if (h.b.length > HISTORY) h.b.shift();

        const c = graph.current;
        const ctx = c?.getContext('2d');
        if (!c || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const w = c.clientWidth;
        const hgt = c.clientHeight;
        if (c.width !== w * dpr) {
            c.width = w * dpr;
            c.height = hgt * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, hgt);
        const max = Math.max(1, (nativeBox.current?.scrollHeight ?? 1) - (nativeBox.current?.clientHeight ?? 0));
        const draw = (arr: number[], color: string, x0: number, x1: number) => {
            ctx.strokeStyle = 'rgba(196,212,235,0.1)';
            ctx.strokeRect(x0 + 0.5, 0.5, x1 - x0 - 1, hgt - 1);
            ctx.beginPath();
            arr.forEach((v, i) => {
                const x = x0 + 6 + (i / (HISTORY - 1)) * (x1 - x0 - 12);
                const y = hgt - 6 - (v / max) * (hgt - 12);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.6;
            ctx.stroke();
        };
        draw(h.a, '#9aa6b7', 0, w / 2 - 6);
        draw(h.b, '#94dbff', w / 2 + 6, w);
    });

    return (
        <Demo
            title="Scroll feel — native vs Lenis"
            hint="Scroll with a mouse wheel inside each box. Watch the graphs: native jumps in steps, Lenis draws a smooth curve."
            onReset={reset}
            controls={
                <>
                    <Toggle label="smoothWheel" checked={p.smooth} onChange={(v) => set('smooth', v)} help="Off = Lenis passes the wheel straight through." />
                    <Slider
                        label="lerp"
                        value={p.lerp}
                        min={0.01}
                        max={1}
                        step={0.005}
                        onChange={(v) => set('lerp', v)}
                        help="Share of the remaining distance covered per frame. Igloo: 0.085 (heavy, cinematic). 1 = no smoothing."
                    />
                    <Slider
                        label="wheelMultiplier"
                        value={p.wheel}
                        min={0.2}
                        max={3}
                        step={0.05}
                        onChange={(v) => set('wheel', v)}
                        help="How far one wheel notch travels. Igloo: 0.85 — slightly slower than normal, so each scene gets time."
                    />
                    <p className="text-[12px] leading-snug text-[var(--il-faint)]">Try lerp 1 vs 0.03: the same wheel, two completely different personalities.</p>
                </>
            }
        >
            <div ref={host} className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        ['Native', nativeBox, null],
                        ['Lenis', smoothBox, smoothContent],
                    ].map(([label, box, content]) => (
                        <div key={label as string}>
                            <div className="il-mono mb-2 text-[10.5px] uppercase tracking-[0.14em]" style={{ color: label === 'Lenis' ? 'var(--il-ice)' : 'var(--il-dim)' }}>
                                {label as string}
                            </div>
                            <div
                                ref={box as React.RefObject<HTMLDivElement>}
                                data-lenis-prevent
                                className="il-scrollbox h-[300px] overflow-y-auto rounded-xl border border-[var(--il-line)] bg-black/20"
                            >
                                {content ? (
                                    <div ref={content as React.RefObject<HTMLDivElement>}>
                                        <Frames label="lenis" />
                                    </div>
                                ) : (
                                    <Frames label="native" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="il-mono mb-1.5 mt-4 flex justify-between text-[10px] text-[var(--il-faint)]">
                    <span>scrollTop over the last 2.5s</span>
                    <span>↑ further down the list</span>
                </div>
                <canvas ref={graph} className="block h-[110px] w-full" />
            </div>
        </Demo>
    );
}
