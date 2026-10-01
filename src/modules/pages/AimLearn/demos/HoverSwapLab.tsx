'use client';

import { useRef } from 'react';

import { Demo, Group, Segmented, Slider } from '../kit/controls';
import { EASE_LIST, type EaseName, EASES } from '../kit/eases';
import { gsap, useGSAP } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { ArrowRight } from '../kit/source';

type Mode = 'smooth' | 'snap';

// defaults = the page's: underline 0.5s in / 0.4s out (0.2s late), button 0.4s in / 0.3s out, in-out-cubic
const DEFAULTS = { dIn: 0.5, dOut: 0.4, delayOut: 0.2, ease: 'in-out-cubic' as EaseName, mode: 'smooth' as Mode };

/** The two hover swaps on the page, driven by GSAP. “Smooth” starts from wherever the line is; “snap” restarts from zero and visibly jumps. */
export default function HoverSwapLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const link = useRef<HTMLAnchorElement>(null);
    const btn = useRef<HTMLAnchorElement>(null);

    const q = (root: HTMLElement | null, s: string) => root?.querySelectorAll(s) ?? [];

    // GSAP owns both ends: the parked start states are set here, not in CSS, so the transforms never stack
    useGSAP(
        () => {
            gsap.set(btn.current?.querySelector('[data-a2]') ?? null, { xPercent: -150 });
            gsap.set(btn.current?.querySelector('[data-l2]') ?? null, { xPercent: -110 });
        },
        { scope: btn },
    );

    const linkIn = () => {
        const r = ref.current;
        const lines = q(link.current, '[data-line]');
        // both lines travel +140%: the visible one leaves right, the one parked off-left (left: −140%) slides in
        if (r.mode === 'snap') gsap.fromTo(lines, { xPercent: 0 }, { xPercent: 140, duration: r.dIn, ease: EASES[r.ease] });
        else gsap.to(lines, { xPercent: 140, duration: r.dIn, ease: EASES[r.ease], overwrite: true });
    };
    const linkOut = () => {
        const r = ref.current;
        gsap.to(q(link.current, '[data-line]'), { xPercent: 0, duration: r.dOut, delay: r.delayOut, ease: EASES[r.ease], overwrite: true });
    };

    const btnIn = () => {
        const r = ref.current;
        const e = EASES[r.ease];
        const a1 = q(btn.current, '[data-a1]');
        const a2 = q(btn.current, '[data-a2]');
        const l1 = q(btn.current, '[data-l1]');
        const l2 = q(btn.current, '[data-l2]');
        const ow = r.mode === 'smooth';
        if (r.mode === 'snap') {
            gsap.fromTo(a1, { xPercent: 0 }, { xPercent: 150, duration: r.dIn * 0.8, ease: e });
            gsap.fromTo(a2, { xPercent: -150 }, { xPercent: 0, duration: r.dIn * 0.8, ease: e });
            gsap.fromTo(l1, { xPercent: 0 }, { xPercent: 110, duration: r.dIn * 1.6, ease: 'alOutCubic' });
            gsap.fromTo(l2, { xPercent: -100 }, { xPercent: 0, duration: r.dIn * 1.6, delay: 0.1, ease: 'alOutCubic' });
            return;
        }
        gsap.to(a1, { xPercent: 150, duration: r.dIn * 0.8, ease: e, overwrite: ow });
        gsap.to(a2, { xPercent: 0, duration: r.dIn * 0.8, ease: e, overwrite: ow });
        gsap.to(l1, { xPercent: 110, duration: r.dIn * 1.6, ease: 'alOutCubic', overwrite: ow });
        gsap.to(l2, { xPercent: 0, duration: r.dIn * 1.6, delay: 0.1, ease: 'alOutCubic', overwrite: ow });
    };
    const btnOut = () => {
        const r = ref.current;
        gsap.to(q(btn.current, '[data-a1]'), { xPercent: 0, duration: r.dOut * 0.75, ease: 'power1.out', overwrite: true });
        gsap.to(q(btn.current, '[data-a2]'), { xPercent: -150, duration: r.dOut * 0.75, ease: 'power1.out', overwrite: true });
        gsap.to(q(btn.current, '[data-l2]'), { xPercent: -110, duration: r.dOut * 1.25, ease: EASES[r.ease], overwrite: true });
        gsap.to(q(btn.current, '[data-l1]'), { xPercent: 0, duration: r.dOut * 1.25, delay: 0.1, ease: EASES[r.ease], overwrite: true });
    };

    return (
        <Demo
            title="Hover swap lab: a line leaves, another arrives"
            hint="Hover each item, then flick the mouse in and out quickly. In “smooth” mode the motion reverses from where it is; in “snap” mode it restarts and jumps."
            onReset={reset}
            controls={
                <>
                    <Group title="Timing">
                        <Slider
                            label="in"
                            value={p.dIn}
                            min={0.1}
                            max={1.2}
                            step={0.05}
                            onChange={(v) => set('dIn', v)}
                            format={(v) => `${v.toFixed(2)}s`}
                            help="The page: 0.5s (link), 0.4s (arrow)."
                        />
                        <Slider
                            label="out"
                            value={p.dOut}
                            min={0.1}
                            max={1.2}
                            step={0.05}
                            onChange={(v) => set('dOut', v)}
                            format={(v) => `${v.toFixed(2)}s`}
                            help="Leaving is quicker on the arrow (0.3s)."
                        />
                        <Slider
                            label="out starts after"
                            value={p.delayOut}
                            min={0}
                            max={0.6}
                            step={0.05}
                            onChange={(v) => set('delayOut', v)}
                            format={(v) => `${v.toFixed(2)}s`}
                            help="The link waits 0.2s so a mouse that grazes it doesn’t flicker."
                        />
                        <Segmented label="curve" options={EASE_LIST} value={p.ease} onChange={(v) => set('ease', v)} />
                    </Group>
                    <Segmented
                        label="when interrupted"
                        options={[
                            { value: 'smooth', label: 'smooth (from current)' },
                            { value: 'snap', label: 'snap (restart)' },
                        ]}
                        value={p.mode}
                        onChange={(v) => set('mode', v)}
                    />
                </>
            }
        >
            <div className="grid gap-10 bg-[#e7e4df] p-8 text-[#141414] sm:p-10">
                <div>
                    <div className="al-mono mb-3 text-[10px] uppercase tracking-[0.14em] text-[#6b6862]">1 · underline swap (a text link)</div>
                    <a
                        ref={link}
                        href="#hover"
                        onClick={(e) => e.preventDefault()}
                        onMouseEnter={linkIn}
                        onMouseLeave={linkOut}
                        onFocus={linkIn}
                        onBlur={linkOut}
                        className="relative inline-block overflow-hidden text-[22px]"
                        style={{ fontFamily: 'var(--al-display)', lineHeight: 1.2 }}
                    >
                        Midjourney
                        <span data-line className="absolute bottom-0 right-0 h-[1.5px] w-full bg-[#141414]" />
                        <span data-line className="absolute bottom-0 h-[1.5px] w-full bg-[#141414]" style={{ left: '-140%' }} />
                    </a>
                </div>
                <div>
                    <div className="al-mono mb-3 text-[10px] uppercase tracking-[0.14em] text-[#6b6862]">2 · arrow swap + rule wipe (a button)</div>
                    <a
                        ref={btn}
                        href="#hover"
                        onClick={(e) => e.preventDefault()}
                        onMouseEnter={btnIn}
                        onMouseLeave={btnOut}
                        onFocus={btnIn}
                        onBlur={btnOut}
                        className="relative block w-[min(320px,100%)] overflow-hidden py-3 text-[15px]"
                        style={{ fontFamily: 'var(--al-display)' }}
                    >
                        <span className="relative flex items-center justify-between">
                            <span>Learn More</span>
                            <span className="relative block size-[14px] overflow-hidden">
                                <span data-a1 className="absolute inset-0">
                                    <ArrowRight />
                                </span>
                                <span data-a2 className="absolute inset-0">
                                    <ArrowRight />
                                </span>
                            </span>
                        </span>
                        <span className="absolute inset-x-0 top-0 block h-px overflow-hidden">
                            <span data-l1 className="absolute inset-0 bg-[#141414]" />
                            <span data-l2 className="absolute inset-0 bg-[#141414]" />
                        </span>
                    </a>
                </div>
            </div>
        </Demo>
    );
}
