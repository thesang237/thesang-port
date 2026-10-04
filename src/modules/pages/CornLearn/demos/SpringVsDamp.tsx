'use client';

import { useRef } from 'react';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { prefersReducedMotion, useParams, useTicker } from '../kit/loop';
import { ENGINE } from '../kit/source';

/**
 * Three followers chase the same target: the page's critically damped spring, an exponential damp,
 * and a naive "move 10 % closer every frame". The graph plots each one's first 4 s after the target
 * jumps. A simulated frame rate shows which ones stay the same on any screen.
 */
const DEFAULTS = { omega: ENGINE.scroll.wSettle as number, lambda: 3.4, k: 0.1, fps: '60' as '30' | '60' | '120' | '144', auto: true };
const SPAN = 4; // seconds plotted
const N = SPAN * 144 + 8; // one sample per simulated frame
const COLS = { spring: '#55ffc2', damp: '#e9c46a', lerp: '#ff7a59' };

export default function SpringVsDamp() {
    const { p, set, ref, reset } = useParams({ ...DEFAULTS, auto: !prefersReducedMotion() });
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const dots = useRef<(HTMLSpanElement | null)[]>([]);
    const stRef = useRef({
        target: 1,
        from: 0,
        s: 0,
        v: 0,
        d: 0,
        l: 0,
        t: 0,
        acc: 0,
        idle: 0,
        trace: { t: new Float32Array(N), s: new Float32Array(N), d: new Float32Array(N), l: new Float32Array(N), n: 0 },
    });

    const jump = () => {
        const st = stRef.current;
        st.from = st.target;
        st.target = st.target > 0.5 ? 0 : 1;
        st.t = 0;
        st.idle = 0;
        st.trace.n = 0;
    };

    const draw = () => {
        const st = stRef.current;
        const c = canvas.current;
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
        const L = 30;
        const X = (t: number) => L + (t / SPAN) * (w - L - 8);
        const Y = (v: number) => h - 20 - v * (h - 34);
        g.font = '10px ui-monospace, monospace';
        g.fillStyle = 'rgba(214,255,232,0.4)';
        g.strokeStyle = 'rgba(214,255,232,0.1)';
        for (let s = 0; s <= SPAN; s++) {
            const x = X(s);
            g.beginPath();
            g.moveTo(x, 8);
            g.lineTo(x, h - 20);
            g.stroke();
            g.fillText(`${s}s`, x - 6, h - 6);
        }
        [0, 1].forEach((v) => {
            g.beginPath();
            g.moveTo(L, Y(v));
            g.lineTo(w, Y(v));
            g.stroke();
            g.fillText(v ? 'to' : 'from', 0, Y(v) + 3);
        });
        const tr = st.trace;
        (['l', 'd', 's'] as const).forEach((key) => {
            g.strokeStyle = COLS[key === 's' ? 'spring' : key === 'd' ? 'damp' : 'lerp'];
            g.lineWidth = key === 's' ? 2.2 : 1.5;
            g.beginPath();
            for (let i = 0; i < tr.n; i++) {
                if (i) g.lineTo(X(tr.t[i]), Y(tr[key][i]));
                else g.moveTo(X(tr.t[i]), Y(tr[key][i]));
            }
            g.stroke();
        });
    };

    useTicker(host, (_time, dt) => {
        const st = stRef.current;
        const prm = ref.current;
        const h = 1 / Number(prm.fps);
        st.acc += dt;
        // run the followers at the simulated frame rate, whatever this screen does
        while (st.acc >= h) {
            st.acc -= h;
            // spring: sub-stepped exactly like Scroller.update
            const n = Math.max(1, Math.ceil(h / (1 / 120)));
            const hh = h / n;
            for (let i = 0; i < n; i++) {
                const a = prm.omega * prm.omega * (st.target - st.s) - 2 * prm.omega * st.v;
                st.v += a * hh;
                st.s += st.v * hh;
            }
            st.d += (st.target - st.d) * (1 - Math.exp(-prm.lambda * h));
            st.l += (st.target - st.l) * prm.k;
            st.t += h;
            const tr = st.trace;
            if (st.t <= SPAN && tr.n < N) {
                const norm = (x: number) => (st.target > st.from ? x : 1 - x);
                tr.t[tr.n] = st.t;
                tr.s[tr.n] = norm(st.s);
                tr.d[tr.n] = norm(st.d);
                tr.l[tr.n] = norm(st.l);
                tr.n++;
            }
        }
        const done = Math.abs(st.s - st.target) < 0.002 && Math.abs(st.l - st.target) < 0.01;
        if (done) st.idle += dt;
        if (prm.auto && st.idle > 1.1) jump();
        // dots on their tracks
        [st.s, st.d, st.l].forEach((x, k) => {
            const el = dots.current[k];
            if (el) el.style.left = `calc(${(x * 100).toFixed(2)}% - 7px)`;
        });
        draw();
    });

    const rows = [
        { k: 'spring', label: `Spring ω ${p.omega.toFixed(1)} (the page)`, c: COLS.spring },
        { k: 'damp', label: `Damp λ ${p.lambda.toFixed(1)}`, c: COLS.damp },
        { k: 'lerp', label: `Lerp ${Math.round(p.k * 100)} % per frame`, c: COLS.lerp },
    ];

    return (
        <Demo
            title="Spring vs damp vs lerp"
            hint="Watch the first half second of each curve: the spring eases in, the other two leave at full speed. Then switch the frame rate."
            onReset={reset}
            controls={
                <>
                    <Group title="Followers">
                        <Slider label="spring ω" value={p.omega} min={0.5} max={10} step={0.1} onChange={(v) => set('omega', v)} help="Stiffness of the page’s spring. 2.5 = the landing (≈ 1.6 s)." />
                        <Slider
                            label="damp λ"
                            value={p.lambda}
                            min={0.5}
                            max={15}
                            step={0.1}
                            onChange={(v) => set('lambda', v)}
                            help="Share of the gap closed per second (the engine uses damp for the pointer, λ 3)."
                        />
                        <Slider
                            label="lerp per frame"
                            value={p.k}
                            min={0.01}
                            max={0.5}
                            step={0.01}
                            onChange={(v) => set('k', v)}
                            help="Naive: close this share of the gap every frame, whatever the frame time."
                        />
                    </Group>
                    <Group title="Screen">
                        <Segmented label="simulated frame rate" options={['30', '60', '120', '144'] as const} value={p.fps} onChange={(v) => set('fps', v)} />
                        <Toggle label="auto replay" checked={p.auto} onChange={(v) => set('auto', v)} help="Jumps the target back and forth on its own." />
                    </Group>
                    <Btn primary onClick={jump}>
                        Jump target
                    </Btn>
                </>
            }
        >
            <div ref={host} className="p-4 sm:p-5">
                <div className="mb-4 space-y-3">
                    {rows.map((r, k) => (
                        <div key={r.k}>
                            <div className="cl-mono mb-1 text-[10.5px] uppercase" style={{ color: r.c }}>
                                {r.label}
                            </div>
                            <div className="relative h-[14px] rounded-full bg-[rgba(214,255,232,0.06)]">
                                <span
                                    ref={(el) => {
                                        dots.current[k] = el;
                                    }}
                                    className="absolute top-0 size-[14px] rounded-full"
                                    style={{ background: r.c, boxShadow: `0 0 14px ${r.c}` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <canvas ref={canvas} className="block h-[220px] w-full" aria-label="Position over the first four seconds after the target jumps" />
            </div>
        </Demo>
    );
}
