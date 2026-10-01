'use client';

import { type CSSProperties, useRef } from 'react';

import { cn } from '@/utils/cn';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap, useGSAP } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { LN, NAV } from '../kit/source';

const EASES = ['power3.inOut', 'power2.out', 'expo.inOut', 'back.inOut(2)', 'none'] as const;
const FROM = ['start', 'center', 'end', 'random'] as const;
const DEFAULTS = {
    stagger: 0.018,
    duration: 0.42,
    ease: 'power3.inOut' as (typeof EASES)[number],
    from: 'start' as (typeof FROM)[number],
    lime: true,
    slow: false,
    xray: false,
};

/** Teaching copy of motion-kit/RollingText with every number on a dial. */
export default function RollingLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const root = useRef<HTMLDivElement>(null);
    const allOn = useRef(false);
    const { contextSafe } = useGSAP({ scope: root });

    const roll = contextSafe((el: Element | null, to: number) => {
        const cols = el?.querySelectorAll<HTMLElement>('.ll-rt-col');
        if (!cols?.length) return;
        gsap.to(cols, {
            yPercent: to,
            duration: p.duration * (p.slow ? 4 : 1),
            ease: p.ease,
            stagger: { each: p.stagger * (p.slow ? 4 : 1), from: p.from },
            overwrite: true,
        });
    });

    const toggleAll = () => {
        allOn.current = !allOn.current;
        root.current?.querySelectorAll('.ll-rt').forEach((el) => roll(el, allOn.current ? -100 : 0));
    };

    return (
        <Demo
            title="Rolling text lab"
            hint="Hover a menu item (or tap “Roll all”). Each letter is a tiny window; the letter slides up and its copy slides in from below."
            onReset={reset}
            controls={
                <>
                    <Btn primary onClick={toggleAll}>
                        ⇅ Roll all
                    </Btn>
                    <Group title="Timing">
                        <Slider label="stagger" value={p.stagger} min={0} max={0.12} step={0.001} onChange={(v) => set('stagger', v)} help="Delay between letters. Source: 0.018 s." />
                        <Slider label="duration" value={p.duration} min={0.1} max={1.2} onChange={(v) => set('duration', v)} help="Each letter’s roll. Source: 0.42 s." />
                        <Segmented label="ease" options={EASES} value={p.ease} onChange={(v) => set('ease', v)} />
                        <Segmented label="stagger from" options={FROM} value={p.from} onChange={(v) => set('from', v)} />
                    </Group>
                    <Group title="Look">
                        <Toggle label="lime copy" checked={p.lime} onChange={(v) => set('lime', v)} help="The incoming copy can have its own colour (--rt-hover). The menu and footer use lime." />
                        <Toggle label="slow motion ×4" checked={p.slow} onChange={(v) => set('slow', v)} />
                        <Toggle label="x-ray" checked={p.xray} onChange={(v) => set('xray', v)} help="Remove the letter windows: see each copy waiting below." />
                    </Group>
                </>
            }
        >
            <div ref={root} className={cn('flex min-h-[360px] flex-col justify-center gap-1 px-6 py-10 sm:px-12', p.xray && 'll-xray')} style={{ background: LN.dark }}>
                {NAV.map((n) => (
                    <span
                        key={n.label}
                        className="ll-rt w-fit cursor-pointer text-[clamp(34px,6vw,72px)] font-extrabold leading-none tracking-[-0.01em] text-[#f1f3e8]"
                        style={{ '--rt-hover': p.lime ? LN.lime : '#f1f3e8', fontVariationSettings: "'wdth' 80" } as CSSProperties}
                        aria-label={n.label}
                        onMouseEnter={(e) => roll(e.currentTarget, -100)}
                        onMouseLeave={(e) => roll(e.currentTarget, 0)}
                    >
                        {Array.from(n.label).map((ch, i) => (
                            <span key={i} className="ll-rt-char" aria-hidden>
                                <span className="ll-rt-col">
                                    <span className="ll-rt-a">{ch === ' ' ? ' ' : ch}</span>
                                    <span className="ll-rt-b">{ch === ' ' ? ' ' : ch}</span>
                                </span>
                            </span>
                        ))}
                    </span>
                ))}
            </div>
        </Demo>
    );
}
