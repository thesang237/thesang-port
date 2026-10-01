'use client';

import { useRef } from 'react';

import { cn } from '@/utils/cn';

import { Btn, Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { PartnerLogo, PARTNERS } from '../kit/source';

const DEFAULTS = { speed: 40, boost: 0, xray: false, paused: false };

/**
 * Teaching copy of motion-kit/Marquee: the content twice in a row, moved left on the ticker,
 * wrapped at exactly half the track width. "Kick" fakes a burst of scroll velocity.
 */
export default function MarqueeLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const track = useRef<HTMLDivElement>(null);
    const out = useRef<HTMLSpanElement>(null);
    const s = useRef({ x: 0, v: 0 });

    useTicker(host, (_t, dt) => {
        const tr = track.current;
        if (!tr || ref.current.paused) return;
        const half = tr.scrollWidth / 2;
        s.current.v *= Math.exp(-3 * dt); // the fake scroll velocity dies down
        const speed = ref.current.speed + Math.abs(s.current.v) * ref.current.boost;
        s.current.x -= speed * dt;
        if (half > 0) s.current.x = ((s.current.x % half) - half) % half; // wrap into (−half, 0]
        tr.style.transform = `translate3d(${s.current.x}px,0,0)`;
        if (out.current) out.current.textContent = `${Math.round(speed)} px/s · x ${Math.round(s.current.x)} / −${Math.round(half)}`;
    });

    return (
        <Demo
            title="Marquee lab"
            hint="Turn on x-ray: the row is drawn twice. When the first copy has fully left, the whole track snaps back by exactly one copy’s width — you can’t see the jump."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="speed"
                        value={p.speed}
                        min={0}
                        max={400}
                        step={1}
                        onChange={(v) => set('speed', v)}
                        format={(v) => `${v} px/s`}
                        help="Source: 40 (partners) and 45 (footer) px per second."
                    />
                    <Slider
                        label="velocity boost"
                        value={p.boost}
                        min={0}
                        max={1}
                        onChange={(v) => set('boost', v)}
                        help="Extra speed per unit of scroll velocity. Available in the source component, set to 0 on this page."
                    />
                    <Btn onClick={() => (s.current.v = 2000)}>⚡ Kick (fake a fast scroll)</Btn>
                    <Toggle label="x-ray" checked={p.xray} onChange={(v) => set('xray', v)} help="Outline copy A and copy B." />
                    <Toggle label="pause" checked={p.paused} onChange={(v) => set('paused', v)} help="Reduced motion: the source doesn’t start the ticker at all." />
                    <Readout items={[{ label: 'live', value: <span ref={out} /> }]} />
                </>
            }
        >
            <div ref={host} className="flex min-h-[220px] flex-col justify-center gap-6 overflow-hidden bg-[#f1f3e8] py-10">
                <div className={cn('relative', p.xray ? 'overflow-visible' : 'overflow-hidden')}>
                    <div ref={track} className="flex w-max will-change-transform">
                        {['A', 'B'].map((copy) => (
                            <div
                                key={copy}
                                className={cn(
                                    'relative flex items-center gap-12 pr-12 text-[#1b1c17]',
                                    p.xray && 'outline outline-1 outline-dashed',
                                    copy === 'A' ? 'outline-[#c07a2a]' : 'outline-[#4f8a5b]',
                                )}
                                aria-hidden={copy === 'B'}
                            >
                                {p.xray && <span className="ll-mono absolute -top-5 left-0 text-[10px] text-[#6d6f66]">{`copy ${copy}`}</span>}
                                {PARTNERS.map((name) => (
                                    <PartnerLogo key={name} name={name} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Demo>
    );
}
