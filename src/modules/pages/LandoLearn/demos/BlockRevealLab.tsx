'use client';

import { type CSSProperties, useEffect, useEffectEvent, useRef } from 'react';

import { cn } from '@/utils/cn';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { blockReset, blockReveal } from '../kit/reveal';
import { LN, MANIFESTO } from '../kit/source';

const EASES = ['power2.inOut', 'power3.out', 'expo.inOut', 'none'] as const;
const DEFAULTS = {
    grow: 0.24,
    hold: 0.05,
    retract: 0.3,
    stagger: 0.06,
    ease: 'power2.inOut' as (typeof EASES)[number],
    flip: true,
    light: false,
    slow: false,
    xray: false,
};

const LINES = MANIFESTO.slice(0, 5);

/** The site’s signature text reveal, with every number on a dial. */
export default function BlockRevealLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const root = useRef<HTMLDivElement>(null);
    const head = useRef<HTMLSpanElement>(null);
    const tl = useRef<gsap.core.Timeline | null>(null);
    const seen = useRef(false);

    const parts = () => {
        const q = gsap.utils.selector(root);
        return { lines: q('.lab-line') as HTMLElement[], blocks: q('.ll-br-block') as HTMLElement[] };
    };

    const total = (LINES.length - 1) * p.stagger + p.grow + p.hold + p.retract;

    const play = () => {
        const { lines, blocks } = parts();
        tl.current?.kill();
        blockReset(lines, blocks);
        const t = blockReveal(lines, blocks, { grow: p.grow, hold: p.hold, retract: p.retract, stagger: p.stagger, ease: p.ease, flipOrigin: p.flip }, gsap.timeline({ paused: true }));
        t.eventCallback('onUpdate', () => {
            if (head.current) head.current.style.left = `${(t.time() / total) * 100}%`;
        });
        t.timeScale(p.slow ? 0.25 : 1).play(0);
        tl.current = t;
    };

    // teaching copy of BlockReveal.reverse(): block comes back from the right, text off, block leaves left
    const hide = () => {
        const { lines, blocks } = parts();
        tl.current?.kill();
        const t = gsap.timeline();
        lines.forEach((line, i) => {
            const at = i * p.stagger * 0.5;
            t.set(blocks[i], { transformOrigin: '100% 50%' }, at)
                .to(blocks[i], { scaleX: 1, duration: p.grow * 0.8, ease: p.ease }, at)
                .set(line, { '--br-text': 0 }, at + p.grow * 0.8)
                .set(blocks[i], { transformOrigin: '0% 50%' }, at + p.grow * 0.8)
                .to(blocks[i], { scaleX: 0, duration: p.retract * 0.7, ease: p.ease }, at + p.grow * 0.8);
        });
        t.timeScale(p.slow ? 0.25 : 1);
        tl.current = t;
    };

    // play once the first time the lab scrolls into view; kill the timeline on unmount
    const onFirstView = useEffectEvent(() => play());
    useEffect(() => () => void tl.current?.kill(), []);
    useEffect(() => {
        const el = root.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen.current) {
                    seen.current = true;
                    onFirstView();
                }
            },
            { threshold: 0.4 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const block = p.light ? LN.blockLight : LN.lime;
    const stageStyle = { background: p.light ? LN.light : LN.dark, color: p.light ? '#1b1c17' : '#dde2d2' } as CSSProperties;

    return (
        <Demo
            title="Block reveal lab"
            hint="Press Play. Then slow it down ×4 and turn on x-ray to see each block’s outline. Change one dial at a time and replay."
            onReset={reset}
            controls={
                <>
                    <div className="flex flex-wrap gap-2">
                        <Btn primary onClick={play}>
                            ▶ Play
                        </Btn>
                        <Btn onClick={hide}>◀ Hide (reverse)</Btn>
                    </div>
                    <Group title="Timing (seconds)">
                        <Slider label="grow" value={p.grow} min={0.04} max={1} onChange={(v) => set('grow', v)} help="Block wipes across the line. Source: 0.24 (7 frames)." />
                        <Slider label="hold" value={p.hold} min={0} max={0.5} onChange={(v) => set('hold', v)} help="Line fully covered, text already on underneath. Source: 0.05." />
                        <Slider label="retract" value={p.retract} min={0.04} max={1} onChange={(v) => set('retract', v)} help="Block leaves and uncovers the text. Source: 0.30." />
                        <Slider label="stagger" value={p.stagger} min={0} max={0.4} onChange={(v) => set('stagger', v)} help="Delay between lines. Source: 0.06 (0.08 on titles)." />
                    </Group>
                    <Group title="Shape">
                        <Segmented label="ease" options={EASES} value={p.ease} onChange={(v) => set('ease', v)} />
                        <Toggle
                            label="flip origin before retract"
                            checked={p.flip}
                            onChange={(v) => set('flip', v)}
                            help="Off: the block shrinks back to where it came from — a ‘blink’ instead of a wipe."
                        />
                    </Group>
                    <Group title="View">
                        <Toggle label="light section" checked={p.light} onChange={(v) => set('light', v)} help="On light sections the source uses a near-black block (#1E1F1A)." />
                        <Toggle label="slow motion ×4" checked={p.slow} onChange={(v) => set('slow', v)} />
                        <Toggle label="x-ray" checked={p.xray} onChange={(v) => set('xray', v)} help="Outline every block — even when scaleX is 0." />
                    </Group>
                </>
            }
            footer={
                <div>
                    <div className="ll-mono mb-2 flex justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--ll-faint)]">
                        <span>timeline</span>
                        <span>{`${total.toFixed(2)} s${p.slow ? ' (×4 slower)' : ''}`}</span>
                    </div>
                    <div className="relative space-y-1">
                        {LINES.map((_, i) => {
                            const at = i * p.stagger;
                            const pct = (v: number) => `${(v / total) * 100}%`;
                            return (
                                <div key={i} className="relative h-2.5">
                                    <span className="absolute top-0 h-full rounded-l-sm bg-[var(--ll-lime)]" style={{ left: pct(at), width: pct(p.grow) }} title="grow" />
                                    <span className="absolute top-0 h-full bg-[var(--ll-gold)]" style={{ left: pct(at + p.grow), width: pct(p.hold) }} title="hold" />
                                    <span
                                        className="absolute top-0 h-full rounded-r-sm bg-[var(--ll-mint)] opacity-80"
                                        style={{ left: pct(at + p.grow + p.hold), width: pct(p.retract) }}
                                        title="retract"
                                    />
                                </div>
                            );
                        })}
                        <span ref={head} className="absolute -top-1 bottom-[-4px] w-px bg-[#f1f3e8]" style={{ left: 0 }} />
                    </div>
                    <div className="ll-mono mt-2 flex gap-4 text-[10px] text-[var(--ll-faint)]">
                        <span>
                            <i className="mr-1 inline-block size-2 bg-[var(--ll-lime)]" />
                            grow
                        </span>
                        <span>
                            <i className="mr-1 inline-block size-2 bg-[var(--ll-gold)]" />
                            hold (text switches on)
                        </span>
                        <span>
                            <i className="mr-1 inline-block size-2 bg-[var(--ll-mint)]" />
                            retract
                        </span>
                    </div>
                </div>
            }
        >
            <div ref={root} className={cn('relative flex h-full min-h-[380px] items-center justify-center overflow-hidden px-5 py-10 sm:px-10 sm:py-14', p.xray && 'll-xray')} style={stageStyle}>
                <div className="ll-contours" style={{ '--ll-contour': p.light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)' } as CSSProperties} />
                <div className="relative w-full text-center text-[clamp(26px,5vw,58px)] font-semibold uppercase leading-[0.98] tracking-[-0.02em]">
                    {LINES.map((line, i) => (
                        <div key={i} className="lab-line" style={{ '--br-text': 1 } as CSSProperties}>
                            <span className="ll-br-inner">
                                <span className="ll-br-text">
                                    {line.map(([t, serif], k) =>
                                        serif ? (
                                            <em key={k} className="ll-serif font-normal not-italic" style={{ color: p.light ? '#1b1c17' : LN.limeSerif }}>
                                                {t}
                                            </em>
                                        ) : (
                                            <span key={k}>{t}</span>
                                        ),
                                    )}
                                </span>
                                <span className="ll-br-block" style={{ background: block }} aria-hidden />
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Demo>
    );
}
