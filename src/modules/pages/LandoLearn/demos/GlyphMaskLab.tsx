'use client';

import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react';

import { Btn, Demo, Group, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { FOUR_BOX, FOUR_PATH, IMG, LN } from '../kit/source';

const EASES = ['expo.in', 'power2.in', 'power4.in', 'none'] as const;
type Mode = 'window' | 'cover';
const DEFAULTS = { mode: 'window' as Mode, ease: 'expo.in' as (typeof EASES)[number], duration: 0.51, p: 0.62, outline: true };

/** The “4” mask: a black glyph inside a white rectangle, scaled from 1/1024 of full size to full size. */
export default function GlyphMaskLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const id = useId().replace(/:/g, '');
    const stage = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 800, h: 420 });

    useEffect(() => {
        const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
        ro.observe(stage.current!);
        return () => ro.disconnect();
    }, []);

    // S1 = 60 covers a 1920×1030 screen; scale it to this stage
    const S1 = 60 * Math.max(size.w / 1920, size.h / 1030);
    const S0 = S1 / 1024;
    const e = gsap.parseEase(p.ease);
    const s = S0 + (S1 - S0) * e(p.p);
    const [ox, oy] = FOUR_BOX.origin;
    const transform = (v: number) => `translate(${size.w / 2} ${size.h / 2}) scale(${v}) skewX(${FOUR_BOX.skew}) translate(${-ox} ${-oy})`;

    // log2(size) against progress: a straight line means “doubles at a steady rate”
    const curve = useMemo(
        () =>
            Array.from({ length: 81 }, (_, i) => {
                const t = i / 80;
                const v = S0 + (S1 - S0) * e(t);
                return `${(t * 200).toFixed(1)},${(100 - (Math.log2(v / S0) / 10) * 96).toFixed(1)}`;
            }).join(' '),
        [e, S0, S1],
    );

    const play = () => {
        const o = { v: 0 };
        gsap.to(o, { v: 1, duration: p.duration, ease: 'none', onUpdate: () => set('p', o.v) });
    };

    return (
        <Demo
            title="The “4” mask"
            hint="Press Play (0.51 s, like the preloader), then scrub “progress” slowly. Compare expo.in with power2.in — watch how the zoom speed feels, not just the size."
            onReset={reset}
            controls={
                <>
                    <Btn primary onClick={play}>
                        ▶ Play
                    </Btn>
                    <Slider label="progress" value={p.p} min={0} max={1} step={0.001} onChange={(v) => set('p', v)} />
                    <Group title="Tween">
                        <Segmented label="ease" options={EASES} value={p.ease} onChange={(v) => set('ease', v)} />
                        <Slider
                            label="duration"
                            value={p.duration}
                            min={0.2}
                            max={3}
                            onChange={(v) => set('duration', v)}
                            format={(v) => `${v.toFixed(2)} s`}
                            help="Load reveal 0.51 s · route reveal 0.60 s."
                        />
                    </Group>
                    <Group title="View">
                        <Segmented
                            label="mode"
                            options={[
                                { value: 'window', label: 'window (reveal)' },
                                { value: 'cover', label: 'cover (exit)' },
                            ]}
                            value={p.mode}
                            onChange={(v) => set('mode', v)}
                        />
                        <Toggle label="glyph outline + origin" checked={p.outline} onChange={(v) => set('outline', v)} />
                    </Group>
                    <Readout
                        items={[
                            { label: 'scale', value: s.toFixed(3), color: 'var(--ll-lime)' },
                            { label: 'doublings', value: `${Math.log2(s / S0).toFixed(1)} / 10` },
                        ]}
                    />
                    <div>
                        <div className="ll-mono mb-1 text-[10px] text-[var(--ll-faint)]">log₂(scale) over progress</div>
                        <svg viewBox="0 0 200 100" className="w-full rounded border border-[var(--ll-line)] bg-black/20">
                            <line x1="0" y1="100" x2="200" y2="4" stroke="rgba(241,243,232,0.15)" strokeDasharray="3 3" />
                            <polyline points={curve} fill="none" stroke="#cdff0b" strokeWidth="1.6" />
                            <circle cx={p.p * 200} cy={100 - (Math.log2(s / S0) / 10) * 96} r="3" fill="#f1f3e8" />
                        </svg>
                    </div>
                </>
            }
        >
            <div ref={stage} className="relative h-[420px] overflow-hidden" style={{ background: LN.hero }}>
                {/* the page underneath */}
                <div className="ll-contours" style={{ '--ll-contour': '#e3e4dc' } as CSSProperties} />
                {/* eslint-disable-next-line @next/next/no-img-element -- the page being revealed */}
                <img src={IMG.portrait} alt="" className="absolute inset-0 size-full object-cover object-bottom" />
                <div className="absolute left-4 top-3 leading-[0.9] text-[#1b1c17]">
                    <div className="ll-serif text-[22px]">ELLIS</div>
                    <div className="text-[22px] font-extrabold">MORROW</div>
                </div>
                <svg className="absolute inset-0 size-full" aria-hidden>
                    <defs>
                        <mask id={`gm-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={size.w} height={size.h}>
                            <rect width={size.w} height={size.h} fill="white" />
                            <path d={FOUR_PATH} fill="black" transform={transform(s)} />
                        </mask>
                    </defs>
                    {p.mode === 'window' ? <rect width={size.w} height={size.h} fill={LN.lime} mask={`url(#gm-${id})`} /> : <path d={FOUR_PATH} fill={LN.lime} transform={transform(s)} />}
                    {p.outline && (
                        <>
                            <path d={FOUR_PATH} fill="none" stroke="#ffb36b" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" transform={transform(Math.max(s, S1 / 60))} />
                            <circle cx={size.w / 2} cy={size.h / 2} r={4} fill="#ffb36b" />
                        </>
                    )}
                </svg>
            </div>
        </Demo>
    );
}
