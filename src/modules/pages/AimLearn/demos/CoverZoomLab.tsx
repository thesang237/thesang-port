'use client';

import { useRef } from 'react';

import { Btn, Demo, Readout, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { FEATURED } from '../kit/source';

const DEFAULTS = { progress: 0, zoom: true, fade: true };

/** Two slides, one progress: the next slide rises over the current one while the current photo keeps pushing in. */
export default function CoverZoomLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const proxy = useRef({ v: 0 });
    const a = FEATURED[0];
    const b = FEATURED[1];

    const play = () => {
        proxy.current.v = 0;
        set('progress', 0);
        gsap.to(proxy.current, { v: 1, duration: 3, ease: 'none', onUpdate: () => set('progress', proxy.current.v) });
    };

    const t = p.progress;
    return (
        <Demo
            title="Cover and zoom: the photo underneath never stops moving"
            hint="Drag progress (or Play). One progress number moves the next slide up, fades its photo in and pushes the previous photo in by 20%: three tracks, one gesture."
            onReset={() => {
                gsap.killTweensOf(proxy.current);
                reset();
            }}
            controls={
                <>
                    <Slider label="progress (one 10% window)" value={t} min={0} max={1} step={0.005} onChange={(v) => set('progress', v)} format={(v) => `${Math.round(v * 100)}%`} />
                    <Toggle label="push-in under the cover" checked={p.zoom} onChange={(v) => set('zoom', v)} help="Photo A scales 1 → 1.2 while B covers it." />
                    <Toggle label="fade B’s photo in" checked={p.fade} onChange={(v) => set('fade', v)} help="Off: B’s photo is already there; you see a hard edge and a dull colour block." />
                    <Btn primary onClick={play}>
                        ▶ Play
                    </Btn>
                    <Readout
                        items={[
                            { label: 'B moves up', value: `${((1 - t) * 100).toFixed(0)}% left` },
                            { label: 'A scale', value: `×${(1 + (p.zoom ? 0.2 * t : 0)).toFixed(2)}` },
                            { label: 'B photo', value: p.fade ? t.toFixed(2) : '1.00' },
                        ]}
                    />
                </>
            }
        >
            <div className="grid place-items-center bg-[var(--al-bg-2)] p-6">
                <div className="relative aspect-[3/4] w-[min(280px,70%)] overflow-hidden border border-[var(--al-ink)] bg-[#141414]">
                    {/* slide A */}
                    <div className="absolute inset-0 overflow-hidden" style={{ background: a.bg }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.img} alt={a.name} className="h-full w-full object-cover" style={{ transform: `scale(${1 + (p.zoom ? 0.2 * t : 0)})` }} />
                    </div>
                    {/* slide B rises over A */}
                    <div className="absolute inset-0 overflow-hidden" style={{ transform: `translateY(${(1 - t) * 100}%)`, background: b.bg }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.img} alt={b.name} className="h-full w-full object-cover" style={{ opacity: p.fade ? t : 1 }} />
                    </div>
                </div>
            </div>
        </Demo>
    );
}
