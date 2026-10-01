'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { Btn, Demo, Group, Readout, Slider } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams, useTicker } from '../kit/loop';
import { IMG, LN, MARQUEE, Monogram, SIGNATURE_BIG } from '../kit/source';

const DEFAULTS = { pin: 780, scrub: 0.35, exp: 1.3, max: 0.87, endW: 630 };
// signature stroke windows inside the pinned timeline (HeroSequence.tsx)
const SIG = [
    [0.3, 0.3],
    [0.72, 0.16],
    [0.9, 0.08],
    [0.97, 0.03],
] as const;
const lerp = gsap.utils.interpolate;
const clamp01 = gsap.utils.clamp(0, 1);

/**
 * The hero → card scene rebuilt at 1920×1030 and scaled down. Scroll inside the frame: a sticky stage
 * stands in for ScrollTrigger’s pin, and a damped follower stands in for `scrub: 0.35`.
 */
export default function HeroPinLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const frame = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const scene = useRef<HTMLDivElement>(null);
    const out = useRef<Record<string, HTMLElement | null>>({});
    const head = useRef<HTMLSpanElement>(null);
    const [scale, setScale] = useState(0.4);
    const st = useRef({ p: 0 });

    useEffect(() => {
        const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1920));
        ro.observe(frame.current!);
        return () => ro.disconnect();
    }, []);

    useTicker(frame, (_t, dt) => {
        const el = box.current;
        const sc = scene.current;
        if (!el || !sc) return;
        const { pin, scrub, exp, max, endW } = ref.current;
        const s = el.clientWidth / 1920;
        const target = clamp01(el.scrollTop / (pin * s));
        // scrub: 0.35 ≈ catch up over ~0.35 s (exponential follower); 0 = locked to the scroll bar
        const k = scrub <= 0 ? 1 : 1 - Math.exp((-3 * dt) / scrub);
        st.current.p += (target - st.current.p) * k;
        if (Math.abs(target - st.current.p) < 1e-4) st.current.p = target;
        const v = st.current.p;

        const w = lerp(1920, endW, v);
        const h = lerp(1030, (endW * 405) / 630, v);
        const card = sc.querySelector<HTMLElement>('.hp-card')!;
        card.style.width = `${w}px`;
        card.style.height = `${h}px`;
        card.style.left = `${(1920 - w) / 2}px`;
        card.style.top = `${(1030 - h) / 2}px`;
        const dark = Math.pow(v, exp) * max;
        sc.style.setProperty('--hp', String(v));
        sc.style.setProperty('--hpd', String(dark));
        sc.querySelectorAll<SVGPathElement>('.hp-sig path').forEach((path, i) => {
            const [a, d] = SIG[i];
            path.style.strokeDashoffset = String(1 - clamp01((v - a) / d));
        });
        sc.querySelector<HTMLElement>('.hp-mq-a')!.style.transform = `translateX(${lerp(-8, 4, v)}%)`;
        sc.querySelector<HTMLElement>('.hp-mq-b')!.style.transform = `translateX(${lerp(2, -10, v)}%)`;
        const race = clamp01(v / 0.08);
        const raceEl = sc.querySelector<HTMLElement>('.hp-race')!;
        raceEl.style.opacity = String(1 - race);
        raceEl.style.transform = `translateY(${race * 20}px)`;

        if (head.current) head.current.style.left = `${v * 100}%`;
        const o = out.current;
        if (o.target) o.target.textContent = target.toFixed(3);
        if (o.p) o.p.textContent = v.toFixed(3);
        if (o.size) o.size.textContent = `${Math.round(w)}×${Math.round(h)}`;
        if (o.img) o.img.textContent = (1 - 0.32 * v).toFixed(3);
        if (o.dark) o.dark.textContent = `${Math.round(dark * 100)}%`;
    });

    const autoplay = () => {
        const el = box.current;
        if (!el) return;
        const to = el.scrollTop > 10 ? 0 : p.pin * (el.clientWidth / 1920);
        gsap.to(el, { scrollTop: to, duration: 2.4, ease: 'power1.inOut' });
    };

    const stageH = 1030 * scale;
    const pct = (v: number) => `${v * 100}%`;
    const rd = (k: string) => (
        <span
            ref={(el) => {
                out.current[k] = el;
            }}
        />
    );

    return (
        <Demo
            title="Hero → card, pinned and scrubbed"
            hint="Scroll inside the frame (or press “Auto-scroll”). The stage holds still for 780 px of scroll while the card shrinks, darkens and gets signed."
            onReset={() => {
                reset();
                box.current?.scrollTo({ top: 0 });
            }}
            controls={
                <>
                    <Btn primary onClick={autoplay}>
                        ⇵ Auto-scroll
                    </Btn>
                    <Group title="Pin">
                        <Slider
                            label="pin length"
                            value={p.pin}
                            min={200}
                            max={2000}
                            step={10}
                            onChange={(v) => set('pin', v)}
                            format={(v) => `${v} px`}
                            help="Scroll consumed while the hero holds still. Source: 780 (measured ≈770)."
                        />
                        <Slider
                            label="scrub"
                            value={p.scrub}
                            min={0}
                            max={2}
                            onChange={(v) => set('scrub', v)}
                            format={(v) => (v === 0 ? 'true (locked)' : `${v.toFixed(2)} s`)}
                            help="Catch-up time behind the scroll bar. Source: 0.35 s."
                        />
                    </Group>
                    <Group title="Card">
                        <Slider
                            label="end width"
                            value={p.endW}
                            min={300}
                            max={1400}
                            step={10}
                            onChange={(v) => set('endW', v)}
                            format={(v) => `${v} px`}
                            help="Final card size (height keeps 630:405). Source: 630 × 405."
                        />
                        <Slider
                            label="darken curve"
                            value={p.exp}
                            min={0.4}
                            max={4}
                            onChange={(v) => set('exp', v)}
                            format={(v) => `p^${v.toFixed(1)}`}
                            help="1 = linear. Higher = stays bright longer, darkens late. Source: 1.3."
                        />
                        <Slider label="darken max" value={p.max} min={0} max={1} onChange={(v) => set('max', v)} help="How far toward #22281C it goes. Source: 0.87 — the photo never disappears." />
                    </Group>
                    <Readout
                        items={[
                            { label: 'scroll p', value: rd('target') },
                            { label: 'scene p', value: rd('p'), color: 'var(--ll-lime)' },
                            { label: 'card', value: rd('size') },
                            { label: 'image', value: rd('img') },
                            { label: 'darken', value: rd('dark') },
                        ]}
                    />
                </>
            }
            footer={
                <div className="relative space-y-1">
                    {[
                        { label: 'card size + image scale', a: 0, d: 1, c: '#d6ad5a' },
                        { label: 'race card fades', a: 0, d: 0.08, c: '#b5b7ae' },
                        ...SIG.map(([a, d], i) => ({ label: `signature stroke ${i + 1}`, a, d, c: LN.lime })),
                        { label: 'message fades in', a: 0.92, d: 0.08, c: '#a8d8b0' },
                    ].map((b) => (
                        <div key={b.label} className="flex h-3.5 items-center">
                            <span className="ll-mono w-[150px] shrink-0 truncate text-[9.5px] text-[var(--ll-dim)]">{b.label}</span>
                            <div className="relative h-full flex-1">
                                <span className="absolute inset-y-[20%] rounded-sm" style={{ left: pct(b.a), width: pct(b.d), background: b.c }} />
                            </div>
                        </div>
                    ))}
                    <div className="pointer-events-none absolute inset-y-0 left-[150px] right-0">
                        <span ref={head} className="absolute inset-y-0 w-px bg-[#f1f3e8]" style={{ left: 0 }} />
                    </div>
                </div>
            }
        >
            <div ref={frame} className="relative overflow-hidden" style={{ height: stageH }}>
                <div ref={box} data-lenis-prevent className="ll-scrollbox absolute inset-0 overflow-y-auto">
                    <div style={{ height: stageH + p.pin * scale + stageH * 0.6 }}>
                        <div className="sticky top-0 overflow-hidden" style={{ height: stageH }}>
                            <div ref={scene} className="absolute left-0 top-0 origin-top-left overflow-hidden" style={{ width: 1920, height: 1030, transform: `scale(${scale})`, background: LN.dark }}>
                                <div className="ll-contours" style={{ '--ll-contour': 'rgba(255,255,255,0.05)' } as CSSProperties} />
                                <div className="pointer-events-none absolute inset-x-0 top-[398px] whitespace-nowrap">
                                    <div className="hp-mq-a ll-serif text-[132px] leading-[112px] tracking-[-0.01em]" style={{ color: LN.limeSerif }}>
                                        {MARQUEE.serif.repeat(4)}
                                    </div>
                                    <div className="hp-mq-b text-[126px] font-semibold leading-[108px] tracking-[-0.02em] text-[#dde2d2]" style={{ fontVariationSettings: "'wdth' 90" }}>
                                        {MARQUEE.sans.repeat(4)}
                                    </div>
                                </div>
                                <div className="hp-card absolute left-0 top-0 z-[2] overflow-hidden" style={{ width: 1920, height: 1030 }}>
                                    <div
                                        className="absolute left-1/2 top-1/2"
                                        style={{ width: 1920, height: 1030, transform: 'translate(-50%, -50%) scale(calc(1 - var(--hp, 0) * 0.32))', background: LN.hero }}
                                    >
                                        <div className="ll-contours" style={{ '--ll-contour': '#e6e7df' } as CSSProperties} />
                                        {/* eslint-disable-next-line @next/next/no-img-element -- teaching copy of the DOM fallback layer */}
                                        <img src={IMG.portrait} alt="" className="absolute inset-0 size-full object-cover object-bottom" />
                                        <div className="absolute inset-0" style={{ background: LN.dark, opacity: 'var(--hpd, 0)' }} />
                                    </div>
                                </div>
                                <svg
                                    className="hp-sig absolute left-1/2 top-1/2 z-[30] overflow-visible"
                                    style={{ width: 900, height: 800, margin: '-410px 0 0 -470px' }}
                                    viewBox="0 0 900 800"
                                    fill="none"
                                    aria-hidden
                                >
                                    {SIGNATURE_BIG.map((d, i) => (
                                        <path
                                            key={i}
                                            d={d}
                                            pathLength={1}
                                            stroke={LN.lime}
                                            strokeWidth={14}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                                        />
                                    ))}
                                </svg>
                                <div className="absolute inset-x-0 top-[104px] z-[30] flex flex-col items-center gap-2 text-[#f1f3e8]" style={{ opacity: 'calc((var(--hp, 0) - 0.92) * 12.5)' }}>
                                    <Monogram className="size-[30px]" />
                                    <span className="text-[9px] font-bold tracking-[0.02em]">MESSAGE FROM ELLIS</span>
                                </div>
                                <div className="hp-race absolute left-[22px] top-[738px] z-[30] w-[133px] text-[#2a2b25]">
                                    <p className="text-[10.5px] font-bold">NEXT RACE</p>
                                    <div className="mt-2 flex h-[250px] flex-col items-center justify-center rounded-lg border-[1.3px] border-[#3c3d36] text-[11.5px] font-bold">SINGAPORE GP</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Demo>
    );
}
