'use client';

import { useEffect, useRef, useState } from 'react';

import { Demo, Readout, Segmented, Slider } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';

import { outline } from './xray';

type Mode = 'on resize (page)' | 'every frame';
const DEFAULTS = { width: 100, mode: 'on resize (page)' as Mode };
type Rect = { x: number; y: number; w: number; h: number };

/** the three intro anchors (ProjectIntro.tsx), with the shapes the choreography gives them */
const ANCHORS = [
    { id: 'intro-small', label: 'small', cls: 'col-start-1 row-start-2 aspect-[546/306]', notch: [1, 0, 0.55, 12], chamfer: [3, 16] },
    { id: 'intro-char', label: 'character', cls: 'col-start-2 row-span-2 row-start-2 self-end aspect-[308/346]', notch: [0, 1, 0.52, 21], chamfer: [2, 23] },
    { id: 'intro-tall', label: 'trailer', cls: 'col-start-3 row-span-3 row-start-1 aspect-[425/712]', notch: [1, 0, 0.41, 31], chamfer: [2, 50] },
] as const;

/**
 * Chapter 10: teaching copy of gl/layout.ts. Empty HTML boxes (data-gl-anchor) are laid out by CSS; the
 * "GL layer" (a 2D canvas here) draws a card wherever each box is. The page measures the boxes only when
 * the layout can change, never inside the frame loop.
 */
export default function AnchorLab() {
    const host = useRef<HTMLDivElement>(null);
    const frame = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const rects = useRef<Record<string, Rect>>({});
    const reads = useRef(0);
    const [rate, setRate] = useState(0);

    const measure = () => {
        const root = frame.current;
        if (!root) return;
        const base = root.getBoundingClientRect();
        root.querySelectorAll<HTMLElement>('[data-gl-anchor]').forEach((el) => {
            const r = el.getBoundingClientRect();
            reads.current++;
            rects.current[el.dataset.glAnchor!] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
        });
    };

    // the page: measure on resize and when fonts load
    useEffect(() => {
        const root = frame.current;
        if (!root) return;
        const ro = new ResizeObserver(() => {
            if (ref.current.mode === 'on resize (page)') measure();
        });
        ro.observe(root);
        root.querySelectorAll('[data-gl-anchor]').forEach((el) => ro.observe(el));
        void document.fonts.ready.then(measure);
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const acc = useRef({ t: 0, reads: 0 });
    useTicker(host, (_t, dt) => {
        if (ref.current.mode === 'every frame') measure();
        const c = canvas.current;
        const root = frame.current;
        if (!c || !root) return;
        const W = root.clientWidth;
        const H = root.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (c.width !== Math.round(W * dpr)) {
            c.width = Math.round(W * dpr);
            c.height = Math.round(H * dpr);
        }
        const g = c.getContext('2d')!;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, W, H);
        ANCHORS.forEach((a, i) => {
            const r = rects.current[a.id];
            if (!r) return;
            const pts = outline({ w: r.w, h: r.h, notch: [a.notch[0], a.notch[1], a.notch[2] * (a.notch[1] ? r.h : r.w), a.notch[3]], notch2: [0, 0, 0, 0], chamfer: [a.chamfer[0], a.chamfer[1]] });
            g.save();
            g.translate(r.x + r.w / 2, r.y + r.h / 2);
            g.beginPath();
            pts.forEach(([x, y], j) => (j ? g.lineTo(x, -y) : g.moveTo(x, -y)));
            g.closePath();
            g.fillStyle = ['#b7a3b0', '#8b7ed9', '#9aa0c8'][i];
            g.fill();
            g.restore();
        });
        const a = acc.current;
        a.t += dt;
        if (a.t > 0.5) {
            setRate(Math.round((reads.current - a.reads) / a.t));
            a.reads = reads.current;
            a.t = 0;
        }
    });

    return (
        <Demo
            title="HTML boxes place the WebGL cards"
            hint="Drag the viewport width: CSS reflows the empty boxes (dashed) and the cards follow. Watch how many layout reads each mode costs."
            onReset={reset}
            controls={
                <>
                    <Slider label="viewport width" value={p.width} min={45} max={100} step={1} onChange={(v) => set('width', v)} format={(v) => `${v} %`} help="Simulates resizing the window." />
                    <Segmented label="measure" options={['on resize (page)', 'every frame']} value={p.mode} onChange={(v) => set('mode', v)} />
                    <Readout items={[{ label: 'layout reads / s', value: rate, color: rate > 20 ? '#ff8a5c' : '#c0fb50' }]} />
                    <p className="text-[11.5px] leading-snug text-[var(--kl-dim)]">
                        Reading a box’s size forces the browser to finish layout. Once per resize is free; 60 times a second, for every anchor, is a classic jank source.
                    </p>
                </>
            }
        >
            <div ref={host} className="flex justify-center bg-[var(--kl-bg-2)] p-4 sm:p-6">
                <div ref={frame} className="relative bg-white" style={{ width: `${p.width}%` }}>
                    <div className="grid grid-cols-[1fr_1.1fr_1fr] grid-rows-[auto_auto_auto] items-start gap-[4%] p-[5%]">
                        <div className="kl-head col-span-2 col-start-1 row-start-1 text-[clamp(14px,2.4vw,26px)] leading-[1]">
                            A FAMILIAR WORLD,
                            <br />
                            ON A DIFFERENT PATH.
                        </div>
                        {ANCHORS.map((a) => (
                            <div key={a.id} data-gl-anchor={a.id} className={`${a.cls} relative w-full border border-dashed border-[var(--kl-ink)]/40`}>
                                <span className="kl-mono absolute -top-4 left-0 text-[9px] uppercase text-[var(--kl-dim)]">{a.label}</span>
                            </div>
                        ))}
                    </div>
                    <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
                </div>
            </div>
        </Demo>
    );
}
