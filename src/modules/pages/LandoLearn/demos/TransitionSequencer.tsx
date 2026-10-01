'use client';

import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Group, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { blockReveal } from '../kit/reveal';
import { FOUR_BOX, FOUR_PATH, IMG, LN, Monogram } from '../kit/source';

type Route = 'home' | 'track';
const DEFAULTS = { waitPaint: true, resetScroll: true, slow: true };
const GROW = 0.51; // exit cover (expo.in)
const ENTER_GROW = 0.6; // route reveal

// a clock read only inside event handlers
const now = () => performance.now();

const STEPS = [
    'exit: lime “4” covers the page',
    'hold: monogram loop',
    'router.push(href)',
    'wait: new page rendered + 2 frames',
    'reset scroll + ScrollTrigger.refresh()',
    'enter: “4” window opens',
    'intro plays (ln:enter)',
];

/**
 * A mini site inside the demo, with the same exit → swap → enter orchestration as motion-kit/PageTransition
 * and shell/Overlay. Break the “wait” and “reset scroll” steps to see why they exist.
 */
export default function TransitionSequencer() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const id = useId().replace(/:/g, '');
    const stage = useRef<HTMLDivElement>(null);
    const scroller = useRef<HTMLDivElement>(null);
    const hole = useRef<SVGPathElement>(null);
    const cover = useRef<SVGPathElement>(null);
    const lime = useRef<SVGRectElement>(null);
    const mono = useRef<HTMLDivElement>(null);
    const busy = useRef(false);
    const pending = useRef<{ to: Route; resolve: () => void } | null>(null);
    const [route, setRoute] = useState<Route>('home'); // the "pathname"
    const [mounted, setMounted] = useState<Route>('home'); // what is actually on screen
    const [log, setLog] = useState<{ step: number; ms: number }[]>([]);
    const [size, setSize] = useState({ w: 800, h: 400 });

    useEffect(() => {
        const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
        ro.observe(stage.current!);
        return () => ro.disconnect();
    }, []);

    // the new route takes a moment to render (data, images, a heavy component…)
    useEffect(() => {
        if (route === mounted) return;
        const t = window.setTimeout(() => setMounted(route), ref.current.slow ? 450 : 16);
        return () => window.clearTimeout(t);
    }, [route, mounted, ref]);

    // PageTransition: resolve once the new page is really there, plus two frames for layout
    useEffect(() => {
        const pend = pending.current;
        if (pend && mounted === pend.to) {
            pending.current = null;
            requestAnimationFrame(() => requestAnimationFrame(pend.resolve));
        }
    }, [mounted]);

    const S1 = 60 * Math.max(size.w / 1920, size.h / 1030);
    const S0 = S1 / 1024;
    const tf = (s: number) => `translate(${size.w / 2} ${size.h / 2}) scale(${s}) skewX(${FOUR_BOX.skew}) translate(${-FOUR_BOX.origin[0]} ${-FOUR_BOX.origin[1]})`;
    const grow = (el: SVGPathElement | null, duration: number, onUpdate?: (s: number) => void) => {
        const st = { s: S0 };
        return gsap.to(st, {
            s: S1,
            duration,
            ease: 'expo.in',
            onUpdate: () => {
                el?.setAttribute('transform', tf(st.s));
                onUpdate?.(st.s);
            },
        });
    };

    const playIntro = () => {
        const q = gsap.utils.selector(stage);
        const chars = q('.ts-char');
        if (chars.length) gsap.fromTo(chars, { yPercent: 105 }, { yPercent: 0, duration: 0.75, ease: 'power3.out', stagger: { each: 0.05, from: 'center' } });
        const lines = q('.ts-line') as HTMLElement[];
        if (lines.length)
            blockReveal(
                lines,
                lines.map((l) => l.querySelector<HTMLElement>('.ll-br-block')!),
                { stagger: 0.08 },
            );
    };

    const go = async (to: Route) => {
        if (busy.current || to === route) return;
        busy.current = true;
        const t0 = now();
        const mark = (step: number) => setLog((l) => [...l, { step, ms: Math.round(now() - t0) }]);
        setLog([]);
        const opts = ref.current;

        // 1. exit: the lime glyph grows over the page, then the monogram holds the screen
        mark(0);
        cover.current?.setAttribute('transform', tf(S0));
        await new Promise<void>((resolve) => {
            gsap.timeline({ onComplete: resolve })
                .set(cover.current, { autoAlpha: 1 })
                .set(lime.current, { autoAlpha: 0, attr: { mask: '' } })
                .add(grow(cover.current, GROW), 0)
                .set(lime.current, { autoAlpha: 1 }, GROW)
                .set(cover.current, { autoAlpha: 0 }, GROW)
                .call(() => mark(1), [], GROW)
                .fromTo(mono.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, GROW)
                .fromTo(mono.current, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 100%)', duration: 0.1, ease: 'power2.in' }, 0.55 + 0.1)
                .fromTo(mono.current, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.34, ease: 'power2.inOut', immediateRender: false }, 0.9);
        });

        // 2. swap the route under the lime
        mark(2);
        const rendered = new Promise<void>((resolve) => {
            pending.current = { to, resolve };
        });
        setRoute(to);
        if (opts.waitPaint) {
            mark(3);
            await rendered;
        }
        if (opts.resetScroll && scroller.current) {
            scroller.current.scrollTop = 0;
            mark(4);
        }

        // 3. enter: the “4” window opens; the page intro starts once the glyph is big enough to see through
        mark(5);
        hole.current?.setAttribute('transform', tf(S0));
        await new Promise<void>((resolve) => {
            let entered = false;
            gsap.timeline({ onComplete: resolve })
                .set(lime.current, { autoAlpha: 1, attr: { mask: `url(#ts-${id})` } })
                .add(
                    grow(hole.current, ENTER_GROW, (s) => {
                        if (!entered && s > 1.3 * (S1 / 60)) {
                            entered = true;
                            mark(6);
                            playIntro();
                        }
                    }),
                    0,
                )
                .to(mono.current, { clipPath: 'inset(0% 0% 100% 100%)', duration: 0.05 }, 0.24)
                .set(mono.current, { autoAlpha: 0 })
                .set(lime.current, { autoAlpha: 0, attr: { mask: '' } });
        });
        busy.current = false;
    };

    const link = (to: Route, label: string) => (
        <button
            key={to}
            type="button"
            onClick={() => void go(to)}
            className={cn('ll-mono rounded px-2 py-1 text-[10px] uppercase tracking-[0.14em]', route === to ? 'bg-[#cdff0b] text-[#1b1c17]' : 'bg-black/40 text-[#f1f3e8] hover:bg-black/60')}
        >
            {label}
        </button>
    );

    return (
        <Demo
            title="Transition sequencer — exit, swap, enter"
            hint="Scroll the mini page down a bit, then click “On Track”. Each step lights up with its time. Then switch off “wait for the new page” and try again."
            onReset={reset}
            controls={
                <>
                    <Group title="Orchestration">
                        <Toggle
                            label="wait for the new page (+2 frames)"
                            checked={p.waitPaint}
                            onChange={(v) => set('waitPaint', v)}
                            help="Off: the window opens on whatever is there — the old page, or half a new one."
                        />
                        <Toggle label="reset scroll" checked={p.resetScroll} onChange={(v) => set('resetScroll', v)} help="Off: the new page opens at the old page’s scroll position." />
                        <Toggle label="slow page (450 ms render)" checked={p.slow} onChange={(v) => set('slow', v)} help="Real pages take time: data, images, heavy components." />
                    </Group>
                    <ol className="space-y-1">
                        {STEPS.map((s, i) => {
                            const hit = log.find((l) => l.step === i);
                            return (
                                <li key={s} className={cn('ll-mono flex justify-between gap-2 text-[10.5px]', hit ? 'text-[var(--ll-ink)]' : 'text-[var(--ll-faint)]')}>
                                    <span>{`${i + 1}. ${s}`}</span>
                                    <span className="tabular-nums text-[var(--ll-lime)]">{hit ? `${hit.ms} ms` : ''}</span>
                                </li>
                            );
                        })}
                    </ol>
                </>
            }
        >
            <div ref={stage} className="relative h-[420px] overflow-hidden bg-[#111]">
                <div ref={scroller} data-lenis-prevent className="ll-scrollbox absolute inset-0 overflow-y-auto">
                    {mounted === 'home' ? (
                        <div className="relative" style={{ background: LN.hero }}>
                            <div className="relative h-[420px] overflow-hidden">
                                <div className="ll-contours" style={{ '--ll-contour': '#e3e4dc' } as CSSProperties} />
                                {/* eslint-disable-next-line @next/next/no-img-element -- mini page */}
                                <img src={IMG.portrait} alt="" className="absolute inset-0 size-full object-cover object-bottom" />
                                <div className="absolute bottom-6 left-5 text-[28px] font-extrabold uppercase leading-none text-[#1b1c17]">
                                    <div className="ts-line" style={{ '--br-text': 1 } as CSSProperties}>
                                        <span className="ll-br-inner">
                                            <span className="ll-br-text">Home</span>
                                            <span className="ll-br-block" style={{ background: '#1e1f1a' }} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {['MANIFESTO', 'GALLERY', 'HELMETS', 'STORE'].map((s, i) => (
                                <div key={s} className="flex h-[240px] items-end p-5 text-[40px] font-bold" style={{ background: i % 2 ? '#eff0e8' : LN.dark, color: i % 2 ? '#1b1c17' : '#dde2d2' }}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="relative min-h-[900px] bg-[#111] text-[#f1f3e8]">
                            {/* eslint-disable-next-line @next/next/no-img-element -- mini page */}
                            <img src={IMG.helmet} alt="" className="absolute bottom-[480px] left-0 w-[60%] opacity-90" style={{ filter: 'sepia(0.6) saturate(1.4)' }} />
                            <h3 className="relative flex justify-end overflow-hidden pr-5 pt-16 text-[clamp(64px,16vw,150px)] font-bold leading-[0.9]" aria-label="Track">
                                {Array.from('TRACK').map((c, i) => (
                                    <span key={i} className="ts-char inline-block">
                                        {c}
                                    </span>
                                ))}
                            </h3>
                            <p className="relative mt-[560px] max-w-[36ch] px-5 text-[18px] leading-snug text-[#b5b7ae]">
                                Scroll position here should start at the top. If you see this line first, the scroll wasn’t reset.
                            </p>
                        </div>
                    )}
                </div>
                <div className="absolute right-3 top-3 z-10 flex gap-1.5">
                    {link('home', 'Home')}
                    {link('track', 'On Track')}
                </div>
                <svg className="pointer-events-none absolute inset-0 z-20 size-full" aria-hidden>
                    <defs>
                        <mask id={`ts-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={size.w} height={size.h}>
                            <rect width={size.w} height={size.h} fill="white" />
                            <path ref={hole} d={FOUR_PATH} fill="black" transform={tf(0)} />
                        </mask>
                    </defs>
                    <rect ref={lime} width={size.w} height={size.h} fill={LN.lime} style={{ visibility: 'hidden' }} />
                    <path ref={cover} d={FOUR_PATH} fill={LN.lime} transform={tf(0)} style={{ visibility: 'hidden' }} />
                </svg>
                <div ref={mono} className="pointer-events-none invisible absolute left-1/2 top-1/2 z-30 size-10 -translate-x-1/2 -translate-y-1/2 text-[#1b1c17]">
                    <Monogram />
                </div>
            </div>
        </Demo>
    );
}
