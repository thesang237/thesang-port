'use client';

import { useRef } from 'react';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { damp } from '../kit/math';

const DEFAULTS = { lambda: 3.5, depth: 1, tilt: true, showDots: true };
const LAYERS = [
    { z: 0.2, label: 'far — fog / sky', cls: 'inset-[-6%] bg-[radial-gradient(ellipse_at_50%_20%,#dfe6ef,#9aa6b7_70%)]' },
    { z: 0.45, label: 'mountains', cls: 'inset-x-[-6%] bottom-[18%] h-[46%] bg-[#7c8796] [clip-path:polygon(0_100%,12%_40%,22%_62%,36%_18%,50%_58%,63%_28%,78%_60%,90%_34%,100%_58%,100%_100%)]' },
    { z: 0.75, label: 'snow field', cls: 'inset-x-[-6%] bottom-[-4%] h-[34%] rounded-[50%_50%_0_0] bg-[#c9d0da]' },
    { z: 1, label: 'igloo (subject)', cls: 'left-1/2 bottom-[16%] h-[26%] w-[26%] -translate-x-1/2 rounded-t-full bg-[#5c6470] shadow-[inset_0_-10px_30px_rgba(0,0,0,0.3)]' },
    { z: 1.6, label: 'near — snow flakes', cls: 'inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1.5px,transparent_2px)] [background-size:60px_70px]' },
];

/**
 * Raw vs smoothed pointer, and what smoothing feeds: layered parallax —
 * near layers move more than far ones, all driven by one smoothed value.
 */
export default function PointerParallax() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const layers = useRef<(HTMLDivElement | null)[]>([]);
    const raw = useRef<HTMLSpanElement>(null);
    const smooth = useRef<HTMLSpanElement>(null);
    const out = useRef<HTMLSpanElement>(null);
    const st = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

    useTicker(host, (_, dt) => {
        const P = ref.current;
        const s = st.current;
        // exactly IglooPage → Inputs: pointerSmooth = damp(pointerSmooth, pointer, 3.5, dt)
        s.sx = damp(s.sx, s.x, P.lambda, dt);
        s.sy = damp(s.sy, s.y, P.lambda, dt);
        layers.current.forEach((el, i) => {
            if (!el) return;
            const z = LAYERS[i].z * P.depth;
            el.style.transform = `translate3d(${(-s.sx * 22 * z).toFixed(2)}px, ${(s.sy * 14 * z).toFixed(2)}px, 0)`;
        });
        const stage = host.current?.querySelector<HTMLElement>('.pp-stage');
        if (stage) stage.style.transform = P.tilt ? `rotateX(${(s.sy * 4).toFixed(2)}deg) rotateY(${(s.sx * 6).toFixed(2)}deg)` : '';
        const r = host.current?.getBoundingClientRect();
        if (r && raw.current && smooth.current) {
            raw.current.style.transform = `translate(${((s.x * 0.5 + 0.5) * r.width).toFixed(1)}px, ${((-s.y * 0.5 + 0.5) * r.height).toFixed(1)}px)`;
            smooth.current.style.transform = `translate(${((s.sx * 0.5 + 0.5) * r.width).toFixed(1)}px, ${((-s.sy * 0.5 + 0.5) * r.height).toFixed(1)}px)`;
        }
        if (out.current) out.current.textContent = `${s.sx.toFixed(2)}, ${s.sy.toFixed(2)}`;
    });

    return (
        <Demo
            title="Pointer → smoothed pointer → parallax"
            hint="Move across the scene quickly. The hollow ring is the raw mouse; the solid dot is the smoothed value every layer actually uses."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="smoothing λ"
                        value={p.lambda}
                        min={0.5}
                        max={30}
                        step={0.1}
                        onChange={(v) => set('lambda', v)}
                        help="Igloo: 3.5 — heavy, like a camera on a fluid head. 20+ feels twitchy."
                    />
                    <Slider
                        label="depth strength"
                        value={p.depth}
                        min={0}
                        max={3}
                        step={0.05}
                        onChange={(v) => set('depth', v)}
                        help="Near layers move more than far ones. That difference is what the brain reads as depth."
                    />
                    <Toggle label="tilt the whole stage" checked={p.tilt} onChange={(v) => set('tilt', v)} />
                    <Toggle label="show pointer dots" checked={p.showDots} onChange={(v) => set('showDots', v)} />
                    <Readout items={[{ label: 'smoothed', value: <span ref={out}>0, 0</span>, color: 'var(--il-ice)' }]} />
                </>
            }
        >
            <div
                ref={host}
                className="relative h-[380px] overflow-hidden [perspective:900px] sm:h-[440px]"
                onPointerMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    st.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
                    st.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
                }}
                onPointerLeave={() => {
                    st.current.x = 0;
                    st.current.y = 0;
                }}
            >
                <div className="pp-stage absolute inset-0 [transform-style:preserve-3d]">
                    {LAYERS.map((l, i) => (
                        <div
                            key={l.label}
                            ref={(el) => {
                                layers.current[i] = el;
                            }}
                            className="absolute inset-0"
                        >
                            <div className={`absolute ${l.cls}`} />
                        </div>
                    ))}
                </div>
                {p.showDots && (
                    <>
                        <span ref={raw} className="pointer-events-none absolute left-0 top-0 -ml-3 -mt-3 block size-6 rounded-full border border-[#0a0d13]/70" />
                        <span ref={smooth} className="pointer-events-none absolute left-0 top-0 -ml-1.5 -mt-1.5 block size-3 rounded-full bg-[#2a7fb8] shadow-[0_0_12px_rgba(42,127,184,0.8)]" />
                    </>
                )}
                <div className="il-mono pointer-events-none absolute bottom-3 left-3 space-y-0.5 text-[10px] text-[#0a0d13]/70">
                    {LAYERS.map((l) => (
                        <div key={l.label}>{`${l.label} × ${l.z}`}</div>
                    ))}
                </div>
            </div>
        </Demo>
    );
}
