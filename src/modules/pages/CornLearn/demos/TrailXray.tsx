'use client';

import { useEffect, useRef } from 'react';

import { Btn, Demo, Group, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { rng, TRAIL_SIZE } from '../kit/source';

/**
 * Teaching copy of engine/text/Trail.ts + the shader's disturb(), drawn in 2D so you can see the field.
 * A word is sampled into dots; inside the field the dots let go and fly out, like the title's nodes.
 * Circles are the 16 trail points (alpha = strength), the dashed ring is the resting field, the big
 * ring is the press-and-hold disc. Bars underneath: the ring buffer, newest at the marker.
 */
const DEFAULTS = { life: 1.0, spacing: 12, radius: 1.15, rest: true, restR: 1.6, holdIn: 0.55, holdOut: 1.1, holdR: 3 };
const smooth = (a: number, b: number, v: number) => {
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

type Dot = { x: number; y: number; ox: number; oy: number };

export default function TrailXray() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const bars = useRef<HTMLDivElement>(null);
    const st = useRef({
        pts: Array.from({ length: TRAIL_SIZE }, () => ({ x: -1e4, y: -1e4, s: 0, age: 9 })),
        head: 0,
        last: { x: -1e4, y: -1e4 },
        ptr: { x: -1e4, y: -1e4, over: false },
        hover: { x: -1e4, y: -1e4, z: 0 },
        hold: { x: -1e4, y: -1e4, z: 0, t: 0, pressed: false },
        dots: [] as Dot[],
        cap: 60,
        w: 0,
        h: 0,
        auto: -1,
    });

    // sample the word into dots once the face is ready (and on resize)
    const sample = () => {
        const s = st.current;
        const c = canvas.current;
        if (!c) return;
        const w = c.clientWidth;
        const h = c.clientHeight;
        s.w = w;
        s.h = h;
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.round(w));
        off.height = Math.max(1, Math.round(h));
        const g = off.getContext('2d', { willReadFrequently: true });
        if (!g) return;
        const family = getComputedStyle(c).fontFamily;
        const cap = Math.min(h * 0.32, w / 6.2);
        s.cap = cap;
        g.fillStyle = '#fff';
        g.font = `700 ${cap / 0.7}px ${family}`;
        g.textBaseline = 'alphabetic';
        const text = 'SCATTER';
        const tw = g.measureText(text).width;
        g.fillText(text, (w - tw) / 2, h / 2 + cap / 2);
        const data = g.getImageData(0, 0, off.width, off.height).data;
        const r = rng(4);
        const step = Math.max(4, cap / 11);
        const dots: Dot[] = [];
        for (let y = 0; y < off.height; y += step) {
            for (let x = 0; x < off.width; x += step) {
                const jx = Math.round(x + (r() - 0.5) * step * 0.6);
                const jy = Math.round(y + (r() - 0.5) * step * 0.6);
                if (data[(jy * off.width + jx) * 4] < 128) continue;
                const a = r() * Math.PI * 2;
                const len = (0.12 + 0.95 * Math.pow(r(), 1.6)) * cap;
                dots.push({ x: jx, y: jy, ox: Math.cos(a) * len, oy: Math.sin(a) * len * 0.85 });
            }
        }
        s.dots = dots;
    };

    useEffect(() => {
        let alive = true;
        void document.fonts?.ready.then(() => alive && sample());
        sample();
        const ro = new ResizeObserver(() => sample());
        if (canvas.current) ro.observe(canvas.current);
        return () => {
            alive = false;
            ro.disconnect();
        };
    }, []);

    const local = (e: React.PointerEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    useTicker(host, (_t, dt) => {
        const s = st.current;
        const prm = ref.current;
        // optional auto-sweep (for touch screens): a virtual pointer crosses the word
        if (s.auto >= 0) {
            s.auto += dt / 2.4;
            const k = s.auto;
            s.ptr.x = s.w * (0.12 + 0.76 * k);
            s.ptr.y = s.h / 2 + Math.sin(k * 9) * s.cap * 0.35;
            s.ptr.over = true;
            if (k >= 1) {
                s.auto = -1;
                s.ptr.over = false;
                s.ptr.x = s.ptr.y = -1e4;
            }
        }
        // Trail.push: one point per `spacing` px of travel while over the word
        if (s.ptr.over && Math.hypot(s.ptr.x - s.last.x, s.ptr.y - s.last.y) >= prm.spacing) {
            s.last = { x: s.ptr.x, y: s.ptr.y };
            s.head = (s.head + 1) % TRAIL_SIZE;
            s.pts[s.head] = { x: s.ptr.x, y: s.ptr.y, s: 1, age: 0 };
        }
        if (s.hold.pressed) {
            s.hold.x = s.ptr.x;
            s.hold.y = s.ptr.y;
        }
        // Trail.update
        const on = prm.rest && s.ptr.over;
        if (on) {
            if (s.hover.z < 0.01) {
                s.hover.x = s.ptr.x;
                s.hover.y = s.ptr.y;
            }
            s.hover.x = s.ptr.x;
            s.hover.y = s.ptr.y;
        }
        s.hover.z += ((on ? 1 : 0) - s.hover.z) * (1 - Math.exp(-(on ? 7 : 3.5) * dt));
        for (let i = 0; i < TRAIL_SIZE; i++) {
            const age = s.pts[i].age;
            if (age >= prm.life) {
                s.pts[i].s = 0;
                continue;
            }
            s.pts[i].age = age + dt;
            const k = Math.min(1, (age + dt) / prm.life);
            s.pts[i].s = Math.min(1, (1 - k) * (1 - k) * 1.5);
        }
        const hd = s.hold;
        hd.t = Math.min(1, Math.max(0, hd.t + (hd.pressed ? dt / prm.holdIn : -dt / prm.holdOut)));
        hd.z = hd.pressed ? 1 - Math.pow(1 - hd.t, 3) : hd.t * hd.t * (3 - 2 * hd.t);

        // draw
        const c = canvas.current;
        if (!c) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (c.width !== Math.round(s.w * dpr)) {
            c.width = Math.round(s.w * dpr);
            c.height = Math.round(s.h * dpr);
        }
        const g = c.getContext('2d');
        if (!g) return;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, s.w, s.h);
        const R = s.cap * prm.radius;
        const holdR = s.cap * prm.holdR * (0.35 + 0.65 * hd.z);
        const disturb = (x: number, y: number) => {
            let d = 0;
            for (const q of s.pts) d = Math.max(d, (1 - smooth(R * 0.35, R, Math.hypot(x - q.x, y - q.y))) * q.s);
            d = Math.max(d, (1 - smooth(R * 0.7, R * prm.restR, Math.hypot(x - s.hover.x, y - s.hover.y))) * s.hover.z);
            d = Math.max(d, (1 - smooth(holdR * 0.55, holdR, Math.hypot(x - hd.x, y - hd.y))) * hd.z);
            return d;
        };
        for (const d of s.dots) {
            const f = disturb(d.x, d.y);
            const open = smooth(0.32, 0.48, f);
            const e = f * f * (3 - 2 * f);
            const spread = 1 + 0.9 * hd.z;
            // the letter's fill (fades where open) and the node (flies out where disturbed)
            g.fillStyle = `rgba(242,245,241,${(0.85 * (1 - open)).toFixed(3)})`;
            g.fillRect(d.x - 1.6, d.y - 1.6, 3.2, 3.2);
            if (f > 0.18) {
                g.fillStyle = `rgba(85,255,194,${Math.min(1, smooth(0.18, 0.55, f)).toFixed(3)})`;
                g.beginPath();
                g.arc(d.x + d.ox * spread * e, d.y + d.oy * spread * e, 1.8, 0, Math.PI * 2);
                g.fill();
            }
        }
        // the field itself
        for (const q of s.pts) {
            if (q.s <= 0.01) continue;
            g.strokeStyle = `rgba(233,196,106,${(q.s * 0.7).toFixed(3)})`;
            g.beginPath();
            g.arc(q.x, q.y, R, 0, Math.PI * 2);
            g.stroke();
        }
        if (s.hover.z > 0.01) {
            g.setLineDash([4, 5]);
            g.strokeStyle = `rgba(233,196,106,${(s.hover.z * 0.6).toFixed(3)})`;
            g.beginPath();
            g.arc(s.hover.x, s.hover.y, R * prm.restR, 0, Math.PI * 2);
            g.stroke();
            g.setLineDash([]);
        }
        if (hd.z > 0.01) {
            g.strokeStyle = `rgba(255,122,89,${(hd.z * 0.8).toFixed(3)})`;
            g.lineWidth = 1.5;
            g.beginPath();
            g.arc(hd.x, hd.y, holdR, 0, Math.PI * 2);
            g.stroke();
            g.lineWidth = 1;
        }
        // ring buffer bars
        const b = bars.current;
        if (b) {
            for (let i = 0; i < TRAIL_SIZE; i++) {
                const el = b.children[i] as HTMLElement | undefined;
                if (!el) continue;
                el.style.transform = `scaleY(${Math.max(0.02, s.pts[i].s).toFixed(3)})`;
                el.style.background = i === s.head ? '#ff7a59' : '#e9c46a';
            }
        }
    });

    return (
        <Demo
            title="Trail x-ray: the pointer field, drawn"
            stacked
            hint="Sweep across the word. Rest on it. Then press and hold. (No mouse? Press “auto sweep”.)"
            onReset={reset}
            controls={
                <>
                    <Group title="Trail (hover)">
                        <Slider
                            label="life"
                            value={p.life}
                            min={0.2}
                            max={4}
                            step={0.05}
                            onChange={(v) => set('life', v)}
                            format={(v) => `${v.toFixed(2)} s`}
                            help="How long a point takes to heal (1.0 s)."
                        />
                        <Slider
                            label="spacing"
                            value={p.spacing}
                            min={2}
                            max={60}
                            step={1}
                            onChange={(v) => set('spacing', v)}
                            format={(v) => `${v} px`}
                            help="Pointer travel between recorded points (12 px). Only 16 are kept."
                        />
                        <Slider
                            label="radius"
                            value={p.radius}
                            min={0.3}
                            max={3}
                            step={0.05}
                            onChange={(v) => set('radius', v)}
                            format={(v) => `${v.toFixed(2)} cap`}
                            help="Size of each point’s field, in cap heights (1.15 ≈ three letters)."
                        />
                    </Group>
                    <Group title="Resting field">
                        <Toggle label="field while resting" checked={p.rest} onChange={(v) => set('rest', v)} help="Stays open while the pointer is on the title, moving or not." />
                        <Slider
                            label="resting size"
                            value={p.restR}
                            min={0.8}
                            max={3}
                            step={0.05}
                            onChange={(v) => set('restR', v)}
                            format={(v) => `${v.toFixed(2)}×`}
                            help="1.6 × the hover radius."
                        />
                    </Group>
                    <Group title="Press and hold">
                        <Slider
                            label="opens in"
                            value={p.holdIn}
                            min={0.1}
                            max={2}
                            step={0.05}
                            onChange={(v) => set('holdIn', v)}
                            format={(v) => `${v.toFixed(2)} s`}
                            help="Ease-out cubic (0.55 s)."
                        />
                        <Slider label="closes in" value={p.holdOut} min={0.1} max={3} step={0.05} onChange={(v) => set('holdOut', v)} format={(v) => `${v.toFixed(2)} s`} help="Smoothstep (1.1 s)." />
                        <Slider label="disc size" value={p.holdR} min={1} max={6} step={0.1} onChange={(v) => set('holdR', v)} format={(v) => `${v.toFixed(1)} cap`} help="Most of a line (3 cap)." />
                    </Group>
                    <Btn
                        onClick={() => {
                            st.current.auto = 0;
                        }}
                    >
                        Auto sweep
                    </Btn>
                </>
            }
        >
            <div ref={host}>
                <canvas
                    ref={canvas}
                    className="cl-display block h-[260px] w-full touch-none sm:h-[320px]"
                    onPointerMove={(e) => {
                        const q = local(e);
                        st.current.ptr = { x: q.x, y: q.y, over: true };
                    }}
                    onPointerLeave={() => {
                        st.current.ptr = { x: -1e4, y: -1e4, over: false };
                        st.current.hold.pressed = false;
                    }}
                    onPointerDown={(e) => {
                        const q = local(e);
                        const s = st.current;
                        s.ptr = { x: q.x, y: q.y, over: true };
                        s.hold.pressed = true;
                        s.hold.x = q.x;
                        s.hold.y = q.y;
                    }}
                    onPointerUp={() => {
                        st.current.hold.pressed = false;
                    }}
                    aria-label="Interactive field: move the pointer over the word"
                />
                <div className="flex items-end gap-3 border-t border-[var(--cl-line)] px-4 py-3">
                    <span className="cl-mono shrink-0 text-[10px] uppercase text-[var(--cl-faint)]">16 trail slots</span>
                    <div ref={bars} className="flex h-8 flex-1 items-end gap-1">
                        {Array.from({ length: TRAIL_SIZE }, (_, i) => (
                            <span key={i} className="block h-full flex-1 origin-bottom rounded-sm bg-[var(--cl-gold)]" style={{ transform: 'scaleY(0.02)' }} />
                        ))}
                    </div>
                </div>
            </div>
        </Demo>
    );
}
