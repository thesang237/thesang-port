'use client';

import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap, useGSAP } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { BLOCK, blockReveal } from '../kit/reveal';
import { Emblem, IMG, LN, NAV, SOCIALS, TEAM_LINE } from '../kit/source';

// photo slots measured at 1920×1030 (same numbers as shell/Menu.tsx MENU_PHOTOS)
const PHOTOS = [
    { src: IMG.portraitHelmet, x: 62, y: 130, w: 409, h: 444, pos: '50% 18%', zoom: 1.35 },
    { src: IMG.portrait, x: 537, y: -45, w: 409, h: 444, pos: '50% 22%', zoom: 1.5 },
    { src: IMG.profile, x: 62, y: 642, w: 409, h: 444, pos: '62% 25%', zoom: 1.15 },
    { src: IMG.scene, x: 537, y: 467, w: 409, h: 444, pos: '35% 60%', zoom: 1.2 },
];
const DUO = 'grayscale(1) sepia(0.35) hue-rotate(35deg) saturate(0.55) brightness(0.95) contrast(0.95)';

type Mode = 'open' | 'close';
const DEFAULTS = { mode: 'open' as Mode, open: 0.41, close: 0.25, itemStagger: 0.075, depth: 82, slow: false };

type Bar = { label: string; start: number; dur: number; color: string; sub?: number; each?: number; offs?: number[] };

function bars(p: typeof DEFAULTS): Bar[] {
    const reveal = BLOCK.grow + BLOCK.hold + BLOCK.retract;
    if (p.mode === 'open')
        return [
            { label: 'panel scaleY 0→1', start: 0, dur: p.open, color: '#d6ad5a' },
            { label: 'photos --clip', start: 0.16, dur: 0.34, color: '#a8d8b0', sub: 4, each: 0.06 },
            { label: 'contours fade', start: 0.2, dur: 0.4, color: '#7f8375' },
            { label: 'nav items rise', start: 0.38, dur: 0.26, color: '#cdff0b', sub: 4, each: p.itemStagger },
            { label: 'strike + emblem', start: 0.55, dur: 0.4, color: '#f1f3e8' },
            { label: 'block reveals ×6', start: 0.57, dur: reveal, color: '#cdff0b', sub: 6, offs: [0, 0.09, 0.14, 0.19, 0.24, 0.29] },
        ];
    return [
        { label: 'block reveals hide', start: 0, dur: BLOCK.grow * 0.8 + BLOCK.retract * 0.7, color: '#cdff0b', sub: 6, each: 0.03 },
        { label: 'emblem fade', start: 0.1, dur: 0.2, color: '#f1f3e8' },
        { label: 'nav items drop', start: 0.25, dur: 0.22, color: '#cdff0b', sub: 4, each: 0.04 },
        { label: 'photos --clip', start: 0.35, dur: 0.3, color: '#a8d8b0', sub: 4, each: 0.04 },
        { label: 'contours fade', start: 0.5, dur: 0.25, color: '#7f8375' },
        { label: 'panel scaleY 1→0', start: 0.57, dur: p.close, color: '#d6ad5a' },
    ];
}

/** The real menu choreography, rebuilt at 1/2–1/4 size with its timeline drawn underneath. */
export default function MenuXRay() {
    const { p, set, reset } = useParams(DEFAULTS);
    const frame = useRef<HTMLDivElement>(null);
    const root = useRef<HTMLDivElement>(null);
    const head = useRef<HTMLSpanElement>(null);
    const tl = useRef<gsap.core.Timeline | null>(null);
    const [scale, setScale] = useState(0.4);
    const [active, setActive] = useState(0);
    const list = bars(p);
    const off = (b: Bar, k: number) => b.offs?.[k] ?? k * (b.each ?? 0);
    const total = Math.max(...list.map((b) => b.start + b.dur + off(b, (b.sub ?? 1) - 1)));

    useEffect(() => {
        const el = frame.current!;
        const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1920));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            const panel = q('.mx-panel');
            const photos = q('.mx-photo');
            const items = q('.mx-item-in');
            const lines = q('.mx-br') as HTMLElement[];
            const blocks = q('.mx-br .ll-br-block') as HTMLElement[];

            // build OPEN (paused); CLOSE starts from its end state
            const open = gsap.timeline({ paused: true });
            open.fromTo(panel, { scaleY: 0 }, { scaleY: 1, duration: p.open, ease: 'power1.out' }, 0)
                .fromTo(q('.mx-contours'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.2)
                .fromTo(photos, { '--clip': 0 }, { '--clip': 1, duration: 0.34, ease: 'power2.out', stagger: 0.06 }, 0.16)
                .fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 0.26, ease: 'power3.out', stagger: p.itemStagger }, 0.38)
                .fromTo(q('.mx-strike'), { '--draw': 0 }, { '--draw': 1, duration: 0.4, ease: 'power2.out' }, 0.55)
                .fromTo(q('.mx-emblem'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.55);
            lines.forEach((line, i) => {
                open.add(blockReveal([line], [blocks[i]]), 0.57 + (i === 0 ? 0 : 0.04 + i * 0.05));
            });

            let t = open;
            if (p.mode === 'close') {
                open.progress(1);
                const close = gsap.timeline({ paused: true });
                lines.forEach((line, i) => {
                    const at = i * BLOCK.stagger * 0.5;
                    close
                        .set(blocks[i], { transformOrigin: '100% 50%' }, at)
                        .fromTo(blocks[i], { scaleX: 0 }, { scaleX: 1, duration: BLOCK.grow * 0.8, ease: BLOCK.ease, immediateRender: false }, at)
                        .set(line, { '--br-text': 0 }, at + BLOCK.grow * 0.8)
                        .set(blocks[i], { transformOrigin: '0% 50%' }, at + BLOCK.grow * 0.8)
                        .to(blocks[i], { scaleX: 0, duration: BLOCK.retract * 0.7, ease: BLOCK.ease }, at + BLOCK.grow * 0.8);
                });
                close
                    .to(q('.mx-emblem'), { autoAlpha: 0, duration: 0.2 }, 0.1)
                    .to(items, { yPercent: 110, duration: 0.22, ease: 'power2.in', stagger: 0.04 }, 0.25)
                    .to(photos, { '--clip': 0, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, 0.35)
                    .to(q('.mx-contours'), { autoAlpha: 0, duration: 0.25 }, 0.5)
                    .to(panel, { scaleY: 0, duration: p.close, ease: 'power1.in' }, 0.57);
                t = close;
            }
            t.eventCallback('onUpdate', () => {
                if (head.current) head.current.style.left = `${(t.time() / total) * 100}%`;
            });
            t.timeScale(p.slow ? 0.25 : 1);
            tl.current = t;
            // show the finished state of the chosen mode until played
            t.progress(p.mode === 'open' ? 1 : 0).pause();
            return () => {
                open.kill();
                t.kill();
            };
        },
        { scope: root, dependencies: [p.mode, p.open, p.close, p.itemStagger, p.slow, total], revertOnUpdate: true },
    );

    const play = () => tl.current?.play(0);
    const scrub = (e: PointerEvent<HTMLDivElement>) => {
        if (e.type === 'pointermove' && e.buttons !== 1) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = gsap.utils.clamp(0, 1, (e.clientX - r.left) / r.width);
        tl.current?.pause().time(x * total);
    };

    const vbH = 1030 + p.depth;
    const pct = (v: number) => `${(v / total) * 100}%`;

    return (
        <Demo
            title="Menu x-ray — the open and close choreography"
            hint="Press Play, then drag across the timeline to scrub it frame by frame. Switch to “Close” to see how the exit re-orders everything."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="sequence"
                        options={[
                            { value: 'open', label: 'Open' },
                            { value: 'close', label: 'Close' },
                        ]}
                        value={p.mode}
                        onChange={(v) => set('mode', v)}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Btn primary onClick={play}>
                            ▶ Play
                        </Btn>
                    </div>
                    <Toggle label="slow motion ×4" checked={p.slow} onChange={(v) => set('slow', v)} />
                    <Group title="Numbers">
                        <Slider label="panel open" value={p.open} min={0.1} max={1.5} onChange={(v) => set('open', v)} format={(v) => `${v.toFixed(2)} s`} help="power1.out. Source: 0.41 s." />
                        <Slider label="panel close" value={p.close} min={0.1} max={1.5} onChange={(v) => set('close', v)} format={(v) => `${v.toFixed(2)} s`} help="power1.in. Source: 0.25 s." />
                        <Slider label="nav stagger" value={p.itemStagger} min={0} max={0.3} step={0.005} onChange={(v) => set('itemStagger', v)} help="Gap between the four links. Source: 0.075 s." />
                        <Slider
                            label="curve depth"
                            value={p.depth}
                            min={0}
                            max={300}
                            step={1}
                            onChange={(v) => set('depth', v)}
                            format={(v) => `${v} px`}
                            help="How far the panel’s bottom bulges below the screen. Source: 82 px (7.4%)."
                        />
                    </Group>
                </>
            }
            footer={
                <div>
                    <div className="ll-mono mb-2 flex justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--ll-faint)]">
                        <span>{`${p.mode} timeline — drag to scrub`}</span>
                        <span>{`${total.toFixed(2)} s`}</span>
                    </div>
                    <div className="relative cursor-ew-resize touch-none select-none space-y-1.5 py-1" onPointerDown={scrub} onPointerMove={scrub}>
                        {list.map((b) => (
                            <div key={b.label} className="relative flex h-4 items-center">
                                <span className="ll-mono pointer-events-none absolute left-0 z-10 w-[130px] truncate text-[9.5px] text-[var(--ll-dim)] sm:w-[160px]">{b.label}</span>
                                <div className="relative ml-[136px] h-full flex-1 sm:ml-[166px]">
                                    {Array.from({ length: b.sub ?? 1 }, (_, k) => (
                                        <span
                                            key={k}
                                            className="absolute rounded-sm"
                                            style={{
                                                left: pct(b.start + off(b, k)),
                                                width: pct(b.dur),
                                                top: b.sub ? `${(k / b.sub) * 100}%` : '15%',
                                                height: b.sub ? `${100 / b.sub}%` : '70%',
                                                background: b.color,
                                                opacity: b.sub ? 0.55 + 0.45 * ((k + 1) / b.sub) : 0.9,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="pointer-events-none absolute inset-y-0 left-[136px] right-0 sm:left-[166px]">
                            <span ref={head} className="absolute inset-y-0 w-px bg-[#f1f3e8]" style={{ left: p.mode === 'open' ? '100%' : 0 }} />
                        </div>
                    </div>
                </div>
            }
        >
            <div ref={frame} className="relative w-full overflow-hidden bg-[#fafbf6]" style={{ height: 1030 * scale }}>
                <div ref={root} className="absolute left-0 top-0 origin-top-left" style={{ width: 1920, height: 1030, transform: `scale(${scale})` }}>
                    <svg className="mx-panel absolute left-0 top-0 block origin-top" style={{ width: 1920, height: vbH }} viewBox={`0 0 1920 ${vbH}`} preserveAspectRatio="none" aria-hidden>
                        <path d={`M0 0H1920V1030Q960 ${1030 + 2 * p.depth} 0 1030Z`} fill={LN.dark} />
                    </svg>
                    <div className="mx-contours ll-contours" style={{ '--ll-contour': 'rgba(255,255,255,0.045)' } as CSSProperties} />
                    {PHOTOS.map((ph, i) => (
                        <div
                            key={i}
                            className="mx-photo absolute overflow-hidden bg-[#dcddd4]"
                            style={{ left: ph.x, top: ph.y, width: ph.w, height: ph.h, '--clip': 1, clipPath: 'inset(0 0 calc((1 - var(--clip)) * 100%) 0)' } as CSSProperties}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- teaching copy, sized by the slot */}
                            <img
                                src={ph.src}
                                alt=""
                                className="absolute inset-0 size-full object-cover"
                                style={{ objectPosition: ph.pos, transform: `scale(${ph.zoom})`, filter: active === i ? 'none' : DUO, transition: 'filter 0.5s ease' }}
                            />
                        </div>
                    ))}
                    <nav className="absolute right-0 top-[250px] flex flex-col items-center text-center" style={{ left: 1104 }}>
                        {NAV.map((n, i) => (
                            <div
                                key={n.label}
                                className="overflow-hidden text-[93px] font-semibold leading-[89px] tracking-[-0.012em]"
                                style={{ height: 89, color: i === 0 ? '#9fa392' : '#e3e6d6', fontVariationSettings: "'wdth' 88" }}
                                onMouseEnter={() => setActive(i)}
                            >
                                <span className="mx-item-in relative block">
                                    {n.label}
                                    {i === 0 && (
                                        <svg className="mx-strike absolute left-[-2%] top-[34px] h-[24px] w-[104%] overflow-visible" viewBox="0 0 260 24" preserveAspectRatio="none" aria-hidden>
                                            <path
                                                d="M0 13H40C58 13 62 5 78 5H176C192 5 196 16 212 16H260"
                                                pathLength={1}
                                                fill="none"
                                                stroke={LN.lime}
                                                strokeWidth={3}
                                                vectorEffect="non-scaling-stroke"
                                                style={{ strokeDasharray: 1, strokeDashoffset: 'calc(1 - var(--draw, 1))' }}
                                            />
                                        </svg>
                                    )}
                                </span>
                            </div>
                        ))}
                    </nav>
                    <div className="mx-emblem absolute w-[100px] text-[#c9ccbd]" style={{ left: 1462, top: 648 }}>
                        <Emblem className="block h-auto w-full" />
                    </div>
                    {[
                        { text: TEAM_LINE, style: { top: 727, fontSize: 11.5, color: '#c9ccbd' } },
                        { text: 'BUSINESS ENQUIRIES', style: { top: 922, fontSize: 19, color: '#f1f3e8' } },
                    ].map((r) => (
                        <div key={r.text} className="absolute right-0 text-center font-bold" style={{ left: 1104, ...r.style, fontVariationSettings: "'wdth' 75" }}>
                            <span className="mx-br inline-block" style={{ '--br-text': 1 } as CSSProperties}>
                                <span className="ll-br-inner">
                                    <span className="ll-br-text">{r.text}</span>
                                    <span className="ll-br-block" style={{ background: LN.lime }} aria-hidden />
                                </span>
                            </span>
                        </div>
                    ))}
                    <div className="absolute right-0 flex justify-center gap-[33px] text-[19px] font-bold text-[#f1f3e8]" style={{ left: 1104, top: 975, fontVariationSettings: "'wdth' 75" }}>
                        {SOCIALS.map((s) => (
                            <span key={s} className="mx-br inline-block" style={{ '--br-text': 1 } as CSSProperties}>
                                <span className="ll-br-inner">
                                    <span className="ll-br-text">{s}</span>
                                    <span className="ll-br-block" style={{ background: LN.lime }} aria-hidden />
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Demo>
    );
}
