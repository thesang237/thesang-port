'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Btn, Demo, Group, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { CHAPTERS, ENGINE, Timeline } from '../kit/source';

/**
 * Teaching copy of engine/Scroller.ts with every constant on a dial (defaults = the source). Your wheel,
 * swipe or arrow keys inside the pad move a target in steps; the view follows on a critically damped
 * spring and settles on a whole step. The graph shows target (dashed) and view (solid) over time.
 */
const S = ENGINE.scroll;
const DEFAULTS: { perStep: number; maxEvent: number; lead: number; idleMs: number; commit: number; wFollow: number; wSettle: number; snap: boolean } = {
    perStep: S.perStep,
    maxEvent: S.maxEvent,
    lead: S.lead,
    idleMs: S.idleMs,
    commit: S.commit,
    wFollow: S.wFollow,
    wSettle: S.wSettle,
    snap: true,
};
type P = typeof DEFAULTS;
const TOTAL = 8;

class StepSim {
    pos = 0;
    target = 0;
    vel = 0;
    dir = 0;
    lastInput = 0;
    touching = false;
    nudge(delta: number, p: P) {
        if (!delta) return;
        const lo = Math.max(0, this.pos - p.lead);
        const hi = Math.min(TOTAL, this.pos + p.lead);
        this.target = Math.min(hi, Math.max(lo, this.target + delta));
        this.dir = Math.sign(delta);
        this.lastInput = performance.now();
    }
    wheel(dy: number, mode: number, p: P) {
        const d = mode === 1 ? dy * 32 : dy;
        this.nudge(Math.max(-p.maxEvent, Math.min(p.maxEvent, d / p.perStep)), p);
    }
    goTo(step: number) {
        this.target = Math.min(TOTAL, Math.max(0, step));
        this.dir = Math.sign(this.target - this.pos);
        this.lastInput = 0;
    }
    update(dt: number, p: P) {
        if (p.snap && this.lastInput && performance.now() - this.lastInput > p.idleMs && !this.touching) {
            this.lastInput = 0;
            const base = Math.floor(this.target);
            const frac = this.target - base;
            const forward = this.dir > 0 ? frac > p.commit : frac > 1 - p.commit;
            this.target = Math.min(TOTAL, base + (forward ? 1 : 0));
        }
        if (!p.snap && this.lastInput && performance.now() - this.lastInput > p.idleMs) this.lastInput = 0;
        const w = this.lastInput ? p.wFollow : p.wSettle;
        const n = Math.max(1, Math.ceil(dt / (1 / 120)));
        const h = dt / n;
        for (let i = 0; i < n; i++) {
            const acc = w * w * (this.target - this.pos) - 2 * w * this.vel;
            this.vel += acc * h;
            this.pos += this.vel * h;
        }
    }
}

const HIST = 360; // samples (≈ 6 s at 60 fps)

export default function StepLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const simRef = useRef(new StepSim());
    const tl = useMemo(() => new Timeline(), []);
    const host = useRef<HTMLDivElement>(null);
    const pad = useRef<HTMLDivElement>(null);
    const strip = useRef<HTMLDivElement>(null);
    const graph = useRef<HTMLCanvasElement>(null);
    const read = useRef<HTMLDivElement>(null);
    const histRef = useRef({ pos: new Float32Array(HIST), tgt: new Float32Array(HIST), head: 0 });

    // native listeners: wheel must be non-passive to stop the page from scrolling
    useEffect(() => {
        const el = pad.current;
        const sim = simRef.current;
        if (!el) return;
        let ty: number | null = null;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            sim.wheel(e.deltaY, e.deltaMode, ref.current);
        };
        const onStart = (e: TouchEvent) => {
            ty = e.touches[0]?.clientY ?? null;
            sim.touching = true;
        };
        const onMove = (e: TouchEvent) => {
            const y = e.touches[0]?.clientY;
            if (ty === null || y === undefined) return;
            e.preventDefault();
            sim.nudge((ty - y) / (el.clientHeight * 0.45), ref.current);
            ty = y;
        };
        const onEnd = () => {
            ty = null;
            sim.touching = false;
        };
        const onKey = (e: KeyboardEvent) => {
            const base = Math.round(sim.target);
            if (['ArrowDown', 'PageDown', ' '].includes(e.key)) sim.goTo(base + 1);
            else if (['ArrowUp', 'PageUp'].includes(e.key)) sim.goTo(base - 1);
            else return;
            e.preventDefault();
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd);
        el.addEventListener('keydown', onKey);
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onEnd);
            el.removeEventListener('keydown', onKey);
        };
    }, [ref]);

    const drawGraph = () => {
        const hist = histRef.current;
        const c = graph.current;
        if (!c) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = c.clientWidth;
        const h = c.clientHeight;
        if (c.width !== Math.round(w * dpr)) {
            c.width = Math.round(w * dpr);
            c.height = Math.round(h * dpr);
        }
        const g = c.getContext('2d');
        if (!g) return;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, w, h);
        // visible window of steps around the view
        const now = hist.pos[(hist.head + HIST - 1) % HIST];
        const lo = Math.max(0, Math.floor(now) - 2);
        const hi = lo + 5;
        const Y = (v: number) => h - 16 - ((v - lo) / (hi - lo)) * (h - 30);
        g.font = '10px ui-monospace, monospace';
        for (let s = lo; s <= hi; s++) {
            g.strokeStyle = 'rgba(214,255,232,0.1)';
            g.beginPath();
            g.moveTo(34, Y(s));
            g.lineTo(w, Y(s));
            g.stroke();
            g.fillStyle = 'rgba(214,255,232,0.4)';
            g.fillText(`step ${s}`, 0, Y(s) + 3);
        }
        const line = (arr: Float32Array, color: string, dash: number[]) => {
            g.strokeStyle = color;
            g.setLineDash(dash);
            g.lineWidth = 1.6;
            g.beginPath();
            for (let i = 0; i < HIST; i++) {
                const v = arr[(hist.head + i) % HIST];
                const x = 34 + (i / (HIST - 1)) * (w - 34);
                if (i) g.lineTo(x, Y(v));
                else g.moveTo(x, Y(v));
            }
            g.stroke();
            g.setLineDash([]);
        };
        line(hist.tgt, 'rgba(233,196,106,0.9)', [4, 4]);
        line(hist.pos, '#55ffc2', []);
    };

    useTicker(host, (_t, dt) => {
        const sim = simRef.current;
        const hist = histRef.current;
        const prm = ref.current;
        sim.update(dt, prm);
        // film strip: one frame per step, slid by the view position
        const H = pad.current?.clientHeight ?? 1;
        if (strip.current) strip.current.style.transform = `translate3d(0, ${(-sim.pos * H).toFixed(2)}px, 0)`;
        // history
        hist.pos[hist.head] = sim.pos;
        hist.tgt[hist.head] = sim.target;
        hist.head = (hist.head + 1) % HIST;
        drawGraph();
        if (read.current) {
            const state = sim.lastInput ? 'following your hand' : Math.abs(sim.target - sim.pos) > 0.0006 ? 'settling' : 'settled';
            read.current.textContent = `target ${sim.target.toFixed(2)} · view ${sim.pos.toFixed(2)} · speed ${sim.vel.toFixed(2)} steps/s · ${state}`;
        }
    });

    const frames = Array.from({ length: TOTAL + 1 }, (_, i) => {
        const st = tl.toStory(i);
        const ch = Math.min(CHAPTERS.length - 1, Math.floor(st.pos));
        return { i, ch, dwell: st.dwell, id: CHAPTERS[ch].id, dwells: tl.dwells[ch] };
    });

    return (
        <Demo
            title="Step lab: wheel → target → spring"
            stacked
            hint="Click the pad, then scroll, swipe or press ↓ / ↑. One notch = one step. Try a hard flick, and a tiny nudge that springs back."
            onReset={() => {
                reset();
                simRef.current.goTo(0);
            }}
            controls={
                <>
                    <Group title="Input">
                        <Slider
                            label="wheel px per step"
                            value={p.perStep}
                            min={80}
                            max={1200}
                            step={10}
                            onChange={(v) => set('perStep', v)}
                            help="How far the wheel travels for one step (source 420)."
                        />
                        <Slider
                            label="max per event"
                            value={p.maxEvent}
                            min={0.05}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('maxEvent', v)}
                            help="Cap for one wheel event, so a huge delta can’t skip chapters (0.32)."
                        />
                        <Slider label="lead" value={p.lead} min={0.3} max={4} step={0.1} onChange={(v) => set('lead', v)} help="How far the target may run ahead of the view (2.1 steps)." />
                    </Group>
                    <Group title="Settle">
                        <Toggle label="settle on whole steps" checked={p.snap} onChange={(v) => set('snap', v)} help="Off = a free smooth scroll that can stop anywhere." />
                        <Slider
                            label="idle before settling"
                            value={p.idleMs}
                            min={40}
                            max={800}
                            step={10}
                            onChange={(v) => set('idleMs', v)}
                            format={(v) => `${v} ms`}
                            help="Silence that counts as “let go” (170 ms)."
                        />
                        <Slider
                            label="commit at"
                            value={p.commit}
                            min={0.02}
                            max={0.9}
                            step={0.01}
                            onChange={(v) => set('commit', v)}
                            format={(v) => `${Math.round(v * 100)} %`}
                            help="Past this share of a step, it moves on; below, it springs back (10 %)."
                        />
                    </Group>
                    <Group title="Spring">
                        <Slider
                            label="ω while scrolling"
                            value={p.wFollow}
                            min={0.5}
                            max={12}
                            step={0.1}
                            onChange={(v) => set('wFollow', v)}
                            help="Spring speed while your hand is on the wheel (3.4)."
                        />
                        <Slider
                            label="ω while landing"
                            value={p.wSettle}
                            min={0.5}
                            max={12}
                            step={0.1}
                            onChange={(v) => set('wSettle', v)}
                            help="Spring speed for the landing: 2.5 ≈ 1.6 s, soft and premium."
                        />
                    </Group>
                    <div className="flex flex-wrap gap-2">
                        <Btn onClick={() => simRef.current.goTo(Math.round(simRef.current.target) + 1)}>Next step</Btn>
                        <Btn onClick={() => simRef.current.goTo(Math.round(simRef.current.target) - 1)}>Previous</Btn>
                        <Btn
                            onClick={() => {
                                for (let k = 0; k < 8; k++) simRef.current.wheel(240, 0, ref.current);
                            }}
                        >
                            Hard flick
                        </Btn>
                    </div>
                </>
            }
        >
            <div ref={host} className="grid gap-0 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div
                    ref={pad}
                    tabIndex={0}
                    data-lenis-prevent
                    aria-label="Scroll pad: scroll, swipe or use the arrow keys"
                    className="relative h-[300px] cursor-ns-resize touch-none overflow-hidden border-b border-[var(--cl-line)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-mint)] sm:h-[440px] sm:border-b-0 sm:border-r"
                >
                    <div ref={strip} className="absolute inset-x-0 top-0 will-change-transform">
                        {frames.map((f) => (
                            <div key={f.i} className="relative h-[300px] sm:h-[440px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/corn-learn/stops/stop${f.ch}.webp`} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                    <div className="cl-display text-[30px] leading-none">{`STEP ${f.i}`}</div>
                                    <div className="cl-mono mt-1 text-[10.5px] uppercase text-[var(--cl-mint)]">{`${f.id} · dwell ${f.dwells ? `${Math.round(f.dwell * f.dwells)}/${f.dwells}` : '—'}`}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex min-w-0 flex-col">
                    <canvas ref={graph} className="block h-[250px] w-full sm:h-[396px]" aria-label="Graph of target and view position over time" />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--cl-line)] px-3 py-2">
                        <span className="cl-mono flex items-center gap-1.5 text-[10.5px] text-[var(--cl-gold)]">
                            <span className="inline-block w-4 border-t border-dashed border-[var(--cl-gold)]" />
                            target
                        </span>
                        <span className="cl-mono flex items-center gap-1.5 text-[10.5px] text-[var(--cl-mint)]">
                            <span className="inline-block w-4 border-t border-[var(--cl-mint)]" />
                            view (spring)
                        </span>
                        <div ref={read} className="cl-mono ml-auto text-[10.5px] tabular-nums text-[var(--cl-dim)]" />
                    </div>
                </div>
            </div>
        </Demo>
    );
}
