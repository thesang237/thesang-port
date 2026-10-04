'use client';

import { useRef } from 'react';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';

/**
 * Teaching copy of StalkWorld's per-step plant simulation, in 2D: every bone is a spring
 * (speed = (target − rot) · DRAG + speed · ELASTIC) that also inherits part of its parent's speed,
 * pushed by wind that comes from noise through a chain of leaky integrators. Run it at a fixed 60 Hz
 * (the page) or once per frame at a simulated screen rate to see why the fixed step matters.
 */
const DEFAULTS = { drag: 0.05, elastic: 0.5, carry: 0.6, wind: 0.1, stages: 5, fixed: true, hz: '60' as '30' | '60' | '144' };
const STEP = 1 / 60;
const STEM = 9;
const LEAVES = [
    { at: 2, side: 1, n: 6 },
    { at: 3, side: -1, n: 6 },
    { at: 5, side: 1, n: 5 },
    { at: 6, side: -1, n: 5 },
    { at: 8, side: 1, n: 4 },
];
type Joint = { rot: number; target: number; speed: number };
const joint = (target: number): Joint => ({ rot: target, target, speed: 0 });
const HIST = 240;
const GAIN = 0.76 / 0.05; // steady-state gain of one leaky stage: x = (x + 0.8 y) · 0.95

export default function PlantSpring() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const st = useRef({
        stem: Array.from({ length: STEM }, (_, i) => joint(i === 0 ? 0 : i % 2 ? 0.03 : -0.03)),
        leaves: LEAVES.map((l) => Array.from({ length: l.n }, (_, i) => joint(i === 0 ? l.side * 0.9 : l.side * -0.12))),
        chain: [0, 0, 0, 0, 0],
        ms: 0,
        acc: 0,
        frameAcc: 0,
        raw: new Float32Array(HIST),
        smooth: new Float32Array(HIST),
        head: 0,
        brush: 0,
        lastX: -1,
    });

    const step = () => {
        const s = st.current;
        const prm = ref.current;
        s.ms += STEP * 1000;
        // wind: noise → chain of leaky integrators (StalkWorld windDirection[0..4])
        const r = (Math.random() - 0.3) * -prm.wind * 3e-6;
        s.chain[0] = r;
        for (let i = 1; i < 5; i++) s.chain[i] = (s.chain[i] + s.chain[i - 1] * 0.8) * 0.95;
        // compare shapes at equal size: rescale a shorter chain to the 5-stage amplitude
        const n = Math.max(1, Math.min(5, prm.stages));
        const W = (s.chain[n - 1] / Math.pow(GAIN, n - 1)) * Math.pow(GAIN, 4) + s.brush;
        s.brush *= 0.9;
        s.raw[s.head] = r * Math.pow(GAIN, 4);
        s.smooth[s.head] = W;
        s.head = (s.head + 1) % HIST;
        const t = s.ms;
        let prev: Joint | null = null;
        s.stem.forEach((j, y) => {
            const A = y / STEM;
            const M = y === 0 ? -1 : 1;
            const sw = 0.2 * (Math.sin(0.01 * t + 0.3 * A) + 1);
            j.speed += W * sw * M * 0.5 * (1 + A);
            if (prev) j.speed += prev.speed * prm.carry;
            j.speed = (j.target - j.rot) * prm.drag + j.speed * prm.elastic;
            j.rot += j.speed;
            prev = j;
        });
        s.leaves.forEach((leaf, O) => {
            let up: Joint | null = null;
            const F = O / s.leaves.length;
            leaf.forEach((j, y) => {
                const A = y / leaf.length;
                const M = y === 0 ? -1 : 1;
                const sw = 0.2 * (Math.sin(0.01 * t + (F + A) * 2.1) + 1);
                j.speed -= W * sw * M * (1 - F) * (1 + A);
                if (up) j.speed += up.speed * 0.9;
                j.speed = (j.target - j.rot) * prm.drag + j.speed * prm.elastic;
                j.rot += j.speed;
                up = j;
            });
        });
    };

    const draw = () => {
        const s = st.current;
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
        const graphH = 54;
        const groundY = h - graphH - 18;
        const seg = (groundY - 30) / STEM;
        // soil
        g.fillStyle = 'rgba(120,90,50,0.25)';
        g.fillRect(0, groundY, w, 6);
        // stem
        let x = w / 2;
        let y = groundY;
        let a = -Math.PI / 2;
        const joints: { x: number; y: number; a: number }[] = [];
        s.stem.forEach((j, i) => {
            a += j.rot;
            const nx = x + Math.cos(a) * seg;
            const ny = y + Math.sin(a) * seg;
            g.strokeStyle = '#8fbf5a';
            g.lineCap = 'round';
            g.lineWidth = 9 * (1 - i / STEM) + 2;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(nx, ny);
            g.stroke();
            joints.push({ x, y, a });
            x = nx;
            y = ny;
        });
        // leaves
        s.leaves.forEach((leaf, k) => {
            const base = joints[LEAVES[k].at];
            let lx = base.x;
            let ly = base.y;
            let la = base.a;
            const len = seg * 0.95;
            g.strokeStyle = k % 2 ? '#6fae4a' : '#a5d46a';
            leaf.forEach((j, i) => {
                la += j.rot;
                const nx = lx + Math.cos(la) * len;
                const ny = ly + Math.sin(la) * len;
                g.lineWidth = 7 * (1 - i / leaf.length) + 1.5;
                g.beginPath();
                g.moveTo(lx, ly);
                g.lineTo(nx, ny);
                g.stroke();
                lx = nx;
                ly = ny;
            });
        });
        // joints
        g.fillStyle = 'rgba(233,196,106,0.8)';
        joints.forEach((j) => {
            g.beginPath();
            g.arc(j.x, j.y, 2.2, 0, Math.PI * 2);
            g.fill();
        });
        // wind graph: raw noise vs the integrated wind
        const gy = h - graphH / 2 - 6;
        g.strokeStyle = 'rgba(214,255,232,0.1)';
        g.beginPath();
        g.moveTo(0, gy);
        g.lineTo(w, gy);
        g.stroke();
        const plot = (arr: Float32Array, color: string, scale: number) => {
            g.strokeStyle = color;
            g.lineWidth = 1.2;
            g.beginPath();
            for (let i = 0; i < HIST; i++) {
                const v = arr[(s.head + i) % HIST] * scale;
                const px = (i / (HIST - 1)) * w;
                const py = gy - Math.max(-1, Math.min(1, v)) * (graphH / 2 - 4);
                if (i) g.lineTo(px, py);
                else g.moveTo(px, py);
            }
            g.stroke();
        };
        const prm = ref.current;
        const sc = 1 / Math.max(0.02, prm.wind * 0.12);
        plot(s.raw, 'rgba(255,122,89,0.45)', sc);
        plot(s.smooth, '#55ffc2', sc);
        g.font = '10px ui-monospace, monospace';
        g.fillStyle = 'rgba(255,122,89,0.8)';
        g.fillText('noise in', 6, h - graphH - 4);
        g.fillStyle = '#55ffc2';
        g.fillText('wind out (leaky chain)', 70, h - graphH - 4);
    };

    useTicker(host, (_t, dt) => {
        const s = st.current;
        const prm = ref.current;
        // simulated display: frames arrive at `hz`; the sim runs either fixed 60 Hz steps or one per frame
        const frame = 1 / Number(prm.hz);
        s.frameAcc += dt;
        let frames = 0;
        while (s.frameAcc >= frame && frames < 8) {
            s.frameAcc -= frame;
            frames++;
            if (prm.fixed) {
                s.acc = Math.min(s.acc + frame, STEP * 4);
                while (s.acc >= STEP) {
                    s.acc -= STEP;
                    step();
                }
            } else step();
        }
        draw();
    });

    const kick = () => {
        const s = st.current;
        const dir = Math.random() < 0.5 ? -1 : 1;
        s.stem.forEach((j, n) => (j.speed += 0.012 * (n / STEM) * dir));
        s.leaves.forEach((l) => l.forEach((j) => (j.speed -= 0.02 * dir)));
    };

    return (
        <Demo
            title="Plant on springs"
            hint="Watch the green wind line: random noise in (red) becomes slow gusts. Brush the plant sideways with the pointer, or kick it. Then turn off the fixed step and change the screen rate."
            onReset={reset}
            stacked
            controls={
                <>
                    <Group title="Spring (every bone)">
                        <Slider
                            label="DRAG (pull home)"
                            value={p.drag}
                            min={0}
                            max={0.4}
                            step={0.005}
                            onChange={(v) => set('drag', v)}
                            help="How hard each bone is pulled back to its rest angle (0.05)."
                        />
                        <Slider
                            label="ELASTIC (keep speed)"
                            value={p.elastic}
                            min={0}
                            max={0.99}
                            step={0.01}
                            onChange={(v) => set('elastic', v)}
                            help="Share of speed kept each step (0.5). High = bouncy and long."
                        />
                        <Slider
                            label="carry from parent"
                            value={p.carry}
                            min={0}
                            max={1.2}
                            step={0.01}
                            onChange={(v) => set('carry', v)}
                            help="Share of the parent bone’s speed passed up the stem (0.6). It’s why motion ripples upward."
                        />
                    </Group>
                    <Group title="Wind">
                        <Segmented
                            label="preset"
                            options={[
                                { value: '0.1', label: 'calm (0.1)' },
                                { value: '3', label: 'storm (3)' },
                            ]}
                            value={p.wind >= 1 ? '3' : '0.1'}
                            onChange={(v) => set('wind', Number(v))}
                        />
                        <Slider label="wind power" value={p.wind} min={0} max={4} step={0.01} onChange={(v) => set('wind', v)} help="The condition presets: 0.1 normal, 3 storm." />
                        <Slider
                            label="leaky stages"
                            value={p.stages}
                            min={1}
                            max={5}
                            step={1}
                            onChange={(v) => set('stages', v)}
                            help="1 = raw jitter, 5 = the page’s slow gusts (size kept equal so you compare the shape)."
                        />
                    </Group>
                    <Group title="Clock">
                        <Toggle label="fixed 60 Hz steps" checked={p.fixed} onChange={(v) => set('fixed', v)} help="The page steps the sim in 1/60 s ticks, as many as real time needs." />
                        <Segmented label="simulated screen" options={['30', '60', '144'] as const} value={p.hz} onChange={(v) => set('hz', v)} />
                    </Group>
                    <Btn onClick={kick}>Kick (a condition switch)</Btn>
                </>
            }
        >
            <div ref={host}>
                <canvas
                    ref={canvas}
                    className="block h-[380px] w-full touch-none sm:h-[440px]"
                    onPointerMove={(e) => {
                        const s = st.current;
                        const r = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - r.left;
                        const near = Math.abs(x - r.width / 2) < r.width * 0.22;
                        if (s.lastX >= 0 && near) s.brush += (x - s.lastX) * 0.00012;
                        s.lastX = x;
                    }}
                    onPointerLeave={() => {
                        st.current.lastX = -1;
                    }}
                    aria-label="A plant made of spring bones; move the pointer across it to brush it"
                />
            </div>
        </Demo>
    );
}
