'use client';

import { useRef, useState } from 'react';

import { Btn, Demo, Group, Readout, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { KERNEL_FACTS } from '../kit/source';

/**
 * Teaching copy of KernelWorld's dial: drag sideways to spin, let go to throw. A spring pulls the spin
 * toward its target with different stiffness / friction while idle, dragging and released; on release
 * the speed is projected forward (as if friction 0.95 ran it out) and the target snaps to a third.
 * One third = one fact. Steps at a fixed 60 Hz, like the page.
 */
const DEFAULTS = { project: 0.95, relSpring: 0.05, relFriction: 0.68, dragSpring: 0.04, dragFriction: 0.52, snap: true };
const STEP = 1 / 60;
const FACTS = KERNEL_FACTS.facts;

export default function DialLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const disc = useRef<SVGGElement>(null);
    const vel = useRef<HTMLCanvasElement>(null);
    const [fact, setFact] = useState(0);
    const [stats, setStats] = useState({ spin: 0, v: 0, target: 0 });
    const st = useRef({ spin: 0, v: 0, tg: 0, delta: 0, down: false, downX: 0, spring: 0.02, friction: 0.78, acc: 0, hist: new Float32Array(180), head: 0, step: 240, fact: 0, frame: 0 });

    const factOf = (x: number) => ((Math.round(-x / st.current.step) % 3) + 3) % 3;

    useTicker(host, (_t, dt) => {
        const s = st.current;
        if (!s.down) s.step = Math.max(120, (host.current?.clientWidth ?? 960) * 0.25); // one fact per quarter width (the page: a quarter screen)
        s.acc = Math.min(s.acc + dt, STEP * 4);
        while (s.acc >= STEP) {
            s.acc -= STEP;
            const target = s.tg + s.delta;
            s.v += (target - s.spin) * s.spring;
            s.v *= s.friction;
            s.spin += s.v;
            s.hist[s.head] = s.v;
            s.head = (s.head + 1) % s.hist.length;
        }
        const idx = factOf(s.down ? s.tg + s.delta : s.tg);
        if (Math.abs(s.v) < 8 && idx !== s.fact) {
            s.fact = idx;
            setFact(idx);
        }
        if (disc.current) disc.current.setAttribute('transform', `rotate(${((-s.spin / s.step) * 120).toFixed(2)} 160 160)`);
        if (++s.frame % 6 === 0) setStats({ spin: s.spin, v: s.v, target: s.tg + s.delta });
        // velocity trace
        const c = vel.current;
        if (c) {
            const w = c.clientWidth;
            const h = c.clientHeight;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            if (c.width !== Math.round(w * dpr)) {
                c.width = Math.round(w * dpr);
                c.height = Math.round(h * dpr);
            }
            const g = c.getContext('2d');
            if (g) {
                g.setTransform(dpr, 0, 0, dpr, 0, 0);
                g.clearRect(0, 0, w, h);
                g.strokeStyle = 'rgba(214,255,232,0.12)';
                g.beginPath();
                g.moveTo(0, h / 2);
                g.lineTo(w, h / 2);
                g.stroke();
                g.strokeStyle = '#e9c46a';
                g.beginPath();
                const n = s.hist.length;
                for (let i = 0; i < n; i++) {
                    const v = s.hist[(s.head + i) % n];
                    const y = h / 2 - Math.max(-1, Math.min(1, v / 60)) * (h / 2 - 3);
                    if (i) g.lineTo((i / (n - 1)) * w, y);
                    else g.moveTo(0, y);
                }
                g.stroke();
            }
        }
    });

    const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const s = st.current;
        const prm = ref.current;
        s.down = true;
        s.downX = e.clientX;
        s.spring = prm.dragSpring;
        s.friction = prm.dragFriction;
        s.tg = s.spin;
        s.delta = 0;
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const s = st.current;
        if (s.down) s.delta = e.clientX - s.downX;
    };
    const onUp = () => {
        const s = st.current;
        const prm = ref.current;
        if (!s.down) return;
        s.down = false;
        s.spring = prm.relSpring;
        s.friction = prm.relFriction;
        if (!prm.snap) {
            s.tg = s.tg + s.delta + (2 * s.v * prm.project) / (1 - prm.project);
            s.delta = 0;
            return;
        }
        // throw: project the release speed forward and snap to a third
        const proj = (2 * s.v * prm.project) / (1 - prm.project);
        const t = Math.round(proj / s.step);
        s.tg = t === 0 ? Math.floor((s.tg + s.delta + 0.5 * s.step) / s.step) * s.step : Math.floor((s.tg + 0.5 * s.step) / s.step + t) * s.step;
        s.delta = 0;
    };
    const goTo = (k: number) => {
        const s = st.current;
        const cur = factOf(s.tg);
        let d = k - cur;
        if (d > 1) d -= 3;
        if (d < -1) d += 3;
        s.spring = ref.current.relSpring;
        s.friction = ref.current.relFriction;
        s.tg -= d * s.step;
    };

    return (
        <Demo
            title="Kernel dial: drag, throw, snap"
            hint="Drag sideways across the stage and let go. A slow drag snaps to the nearest third; a quick flick can carry it a third or two further."
            onReset={reset}
            controls={
                <>
                    <Group title="While dragging">
                        <Slider label="spring" value={p.dragSpring} min={0.005} max={0.3} step={0.005} onChange={(v) => set('dragSpring', v)} help="How tightly the kernel follows your hand (0.04)." />
                        <Slider
                            label="friction"
                            value={p.dragFriction}
                            min={0.1}
                            max={0.98}
                            step={0.01}
                            onChange={(v) => set('dragFriction', v)}
                            help="Speed kept per step (0.52: heavy, no wobble)."
                        />
                    </Group>
                    <Group title="After release">
                        <Slider label="spring" value={p.relSpring} min={0.005} max={0.3} step={0.005} onChange={(v) => set('relSpring', v)} help="Pull toward the snapped third (0.05)." />
                        <Slider label="friction" value={p.relFriction} min={0.1} max={0.98} step={0.01} onChange={(v) => set('relFriction', v)} help="0.68: one soft overshoot, then still." />
                        <Slider
                            label="throw projection"
                            value={p.project}
                            min={0.5}
                            max={0.99}
                            step={0.005}
                            onChange={(v) => set('project', v)}
                            help="Where a flick would coast to (0.95). Higher = flicks travel further."
                        />
                        <Toggle label="snap to thirds" checked={p.snap} onChange={(v) => set('snap', v)} help="Off: it coasts and stops anywhere, between facts." />
                    </Group>
                    <div className="flex flex-wrap gap-2">
                        {FACTS.map((f, k) => (
                            <Btn key={f.label} onClick={() => goTo(k)} primary={fact === k}>
                                {f.label}
                            </Btn>
                        ))}
                    </div>
                    <Readout
                        items={[
                            { label: 'spin (px)', value: stats.spin.toFixed(0) },
                            { label: 'speed', value: stats.v.toFixed(1), color: '#e9c46a' },
                            { label: 'target', value: stats.target.toFixed(0) },
                            { label: 'fact', value: FACTS[fact].label, color: '#55ffc2' },
                        ]}
                    />
                </>
            }
        >
            <div ref={host}>
                <div
                    className="relative h-[340px] cursor-grab touch-none select-none active:cursor-grabbing"
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    aria-label="Drag sideways to spin the dial"
                >
                    <svg viewBox="0 0 320 320" className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2" aria-hidden>
                        <defs>
                            <radialGradient id="cl-kernel" cx="40%" cy="35%" r="70%">
                                <stop offset="0" stopColor="#f7e3a0" />
                                <stop offset="0.55" stopColor="#d2a743" />
                                <stop offset="1" stopColor="#6e4d12" />
                            </radialGradient>
                        </defs>
                        <path d="M160 20 C 230 20 262 95 255 170 C 248 245 205 300 160 300 C 115 300 72 245 65 170 C 58 95 90 20 160 20 Z" fill="url(#cl-kernel)" opacity="0.92" />
                        <g ref={disc}>
                            {FACTS.map((f, k) => {
                                const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
                                const x = 160 + Math.cos(a) * 92;
                                const y = 160 + Math.sin(a) * 110;
                                return (
                                    <g key={f.label}>
                                        <circle cx={x} cy={y} r="16" fill="none" stroke="#fff" strokeOpacity={fact === k ? 0.9 : 0.35} strokeWidth="1.5" />
                                        <circle cx={x} cy={y} r="4" fill="#fff" />
                                    </g>
                                );
                            })}
                        </g>
                        <path d="M160 4 l7 10 h-14 z" fill="#55ffc2" />
                    </svg>
                    <div className="cl-display pointer-events-none absolute left-4 top-4 text-[clamp(20px,3vw,30px)] text-[var(--cl-ink)]">{FACTS[fact].label}</div>
                    <p className="pointer-events-none absolute bottom-4 left-4 max-w-[40ch] text-[12.5px] leading-snug text-[var(--cl-dim)]">{FACTS[fact].body}</p>
                </div>
                <div className="flex items-center gap-3 border-t border-[var(--cl-line)] px-4 py-2">
                    <span className="cl-mono shrink-0 text-[10px] uppercase text-[var(--cl-faint)]">speed, last 3 s</span>
                    <canvas ref={vel} className="block h-10 flex-1" />
                </div>
            </div>
        </Demo>
    );
}
