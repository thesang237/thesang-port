'use client';

import { useEffect, useRef } from 'react';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { EASE_LIST, type EaseName, EASES } from '../kit/eases';
import { gsap, ScrollTrigger } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { ABOUT_PART_1 } from '../kit/source';

type Driver = 'trigger' | 'scrub';

// defaults = the page's about lines: 0.9s, in-out-cubic, rising from 100%, triggered at the 15% line
const DEFAULTS = { driver: 'trigger' as Driver, duration: 0.9, ease: 'in-out-cubic' as EaseName, stagger: 0, rise: 100, trigger: 85, again: false, xray: false, pad: true };

const LINES = ABOUT_PART_1.slice(0, 6).map(([t, s]) => `${t}${s ? ' ' : ''}`.trim());

/** Lines rising out of masks, driven by a scroll trigger (plays on its own clock) or scrubbed by scroll. Scroll the little page. */
export default function LineRevealLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const box = useRef<HTMLDivElement>(null);
    const lines = useRef<HTMLDivElement>(null);

    // rebuild the triggers whenever a dial changes (the page itself builds them once)
    useEffect(() => {
        const scroller = box.current;
        const root = lines.current;
        if (!scroller || !root) return;
        const inners = Array.from(root.querySelectorAll<HTMLElement>('[data-inner]'));
        const masks = Array.from(root.querySelectorAll<HTMLElement>('[data-mask]'));
        const ctx = gsap.context(() => {
            gsap.set(inners, { yPercent: p.rise });
            if (p.driver === 'scrub') {
                // one timeline over a scroll range: scroll is the playhead, so the ease is forced linear (the page does the same)
                const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { scroller, trigger: root, start: `top ${p.trigger}%`, end: 'bottom 40%', scrub: true } });
                tl.fromTo(inners, { yPercent: p.rise }, { yPercent: 0, duration: 1, stagger: { each: p.stagger || 0.12, from: 'start' } }, 0);
            } else {
                masks.forEach((mask, i) => {
                    const tween = gsap.to(inners[i], { yPercent: 0, duration: p.duration, ease: EASES[p.ease], delay: i * p.stagger, paused: true });
                    ScrollTrigger.create({
                        scroller,
                        trigger: mask,
                        start: `top ${p.trigger}%`,
                        onEnter: () => tween.play(),
                        // "once" (the page) keeps the line up; “again” rewinds it when you scroll back above the trigger line
                        onLeaveBack: () => p.again && tween.reverse(),
                    });
                });
            }
        }, root);
        return () => ctx.revert();
    }, [p.driver, p.duration, p.ease, p.stagger, p.rise, p.trigger, p.again]);

    const play = () => {
        const el = box.current;
        if (!el) return;
        gsap.killTweensOf(el);
        el.scrollTop = 0;
        gsap.to(el, { scrollTop: el.scrollHeight - el.clientHeight, duration: 4, ease: 'power1.inOut', delay: 0.25 });
    };

    return (
        <Demo
            title="Mask reveal lab"
            hint="Scroll the small page below (or press Play). In “trigger” mode each line plays once when it crosses the trigger line; in “scrub” mode scroll position is the playhead."
            onReset={reset}
            controls={
                <>
                    <Group title="Driver">
                        <Segmented
                            label="what moves the lines"
                            options={[
                                { value: 'trigger', label: 'trigger (timed)' },
                                { value: 'scrub', label: 'scrub (scroll)' },
                            ]}
                            value={p.driver}
                            onChange={(v) => set('driver', v)}
                        />
                        <Slider
                            label="trigger line (from top)"
                            value={p.trigger}
                            min={40}
                            max={100}
                            step={1}
                            onChange={(v) => set('trigger', v)}
                            format={(v) => `${v}%`}
                            help="The page uses 85%: a line starts when its top is 15% up from the bottom of the window."
                        />
                    </Group>
                    <Group title="Motion">
                        <Slider
                            label="rise"
                            value={p.rise}
                            min={20}
                            max={160}
                            step={5}
                            onChange={(v) => set('rise', v)}
                            format={(v) => `${v}%`}
                            help="How far below its mask each line starts. 100% = exactly one line down."
                        />
                        <Slider label="duration" value={p.duration} min={0.2} max={2} step={0.05} onChange={(v) => set('duration', v)} format={(v) => `${v.toFixed(2)}s`} help="Trigger mode only." />
                        <Segmented label="ease" options={EASE_LIST} value={p.ease} onChange={(v) => set('ease', v)} />
                        <Slider
                            label="stagger"
                            value={p.stagger}
                            min={0}
                            max={0.3}
                            step={0.01}
                            onChange={(v) => set('stagger', v)}
                            format={(v) => `${v.toFixed(2)}s`}
                            help="Extra delay per line. The page has none: each line has its own trigger."
                        />
                    </Group>
                    <Group title="Look">
                        <Toggle label="replay when scrolling back up" checked={p.again} onChange={(v) => set('again', v)} />
                        <Toggle label="x-ray the masks" checked={p.xray} onChange={(v) => set('xray', v)} help="Dashed outlines show the invisible windows." />
                        <Toggle label="descender padding" checked={p.pad} onChange={(v) => set('pad', v)} help="Off: the tails of g, p and y get clipped by the mask." />
                    </Group>
                    <Btn primary onClick={play}>
                        ▶ Play (scrolls for you)
                    </Btn>
                </>
            }
        >
            <div ref={box} data-lenis-prevent className="al-scrollbox relative h-[380px] overflow-y-auto bg-[#e7e4df]" style={{ containerType: 'inline-size' }}>
                <div className="al-mono sticky top-0 z-10 bg-[#e7e4df] px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[#6b6862]">↓ scroll this window ↓</div>
                <div className="h-[320px]" />
                <div ref={lines} className={`px-6 pb-4 ${p.xray ? 'al-xray' : ''}`}>
                    {LINES.map((l, i) => (
                        <div
                            key={i}
                            data-mask
                            className="overflow-hidden"
                            style={{ height: '1.05em', fontSize: 'min(30px, 4.3cqw)', paddingBottom: p.pad ? '0.14em' : 0, marginBottom: p.pad ? '-0.14em' : 0 }}
                        >
                            <div data-inner className="al-display whitespace-nowrap tracking-[-0.03em] text-[#202020]" style={{ lineHeight: 0.915 }}>
                                {l}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="h-[460px]" />
            </div>
        </Demo>
    );
}
