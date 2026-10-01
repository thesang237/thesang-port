'use client';

import { useRef, useState } from 'react';

import { Btn, Demo, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap, useGSAP } from '../kit/gsap';
import { useParams } from '../kit/loop';

const DEFAULTS = { duration: 1.4, stagger: 0.08, ease: 'expo.inOut', scrub: false, progress: 0.5 };

/**
 * Lines that draw themselves: SVG strokes with pathLength="1", plus plain
 * divs scaled from 0 → 1 with a chosen transform-origin.
 */
export default function DrawLines() {
    const { p, set, reset } = useParams(DEFAULTS);
    const [run, setRun] = useState(0);
    const root = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const tl = gsap.timeline({ paused: p.scrub });
            tl.fromTo('.dl-stroke', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: p.duration, ease: p.ease, stagger: p.stagger }, 0)
                .fromTo('.dl-rule', { scaleX: 0 }, { scaleX: 1, duration: p.duration * 0.7, ease: p.ease, stagger: p.stagger }, 0.1)
                .fromTo('.dl-ring', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: p.duration, ease: p.ease }, 0.2)
                .fromTo('.dl-label', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.06 }, p.duration * 0.5);
            if (p.scrub) tl.progress(p.progress);
        },
        { scope: root, dependencies: [run, p.duration, p.stagger, p.ease, p.scrub, p.progress], revertOnUpdate: true },
    );

    return (
        <Demo
            title="Draw-on lines — strokes, rules and leaders"
            hint="Replay, or switch on “scrub by hand” and drag progress: the same timeline, driven by a slider instead of time — exactly what scroll does."
            onReset={reset}
            controls={
                <>
                    <Btn primary onClick={() => setRun((r) => r + 1)}>
                        ↻ Replay
                    </Btn>
                    <Slider label="duration" value={p.duration} min={0.3} max={3} step={0.05} onChange={(v) => set('duration', v)} help="Igloo logo: 1.4s. Rules: 0.8–1.2s." />
                    <Slider label="stagger" value={p.stagger} min={0} max={0.4} step={0.01} onChange={(v) => set('stagger', v)} />
                    <Segmented label="ease" options={['expo.inOut', 'expo.out', 'power2.inOut', 'none'] as const} value={p.ease} onChange={(v) => set('ease', v)} />
                    <Toggle label="scrub by hand" checked={p.scrub} onChange={(v) => set('scrub', v)} />
                    {p.scrub && <Slider label="progress" value={p.progress} min={0} max={1} step={0.001} onChange={(v) => set('progress', v)} />}
                </>
            }
        >
            <div ref={root} className="relative flex min-h-[400px] items-center justify-center p-6">
                {/* wordmark drawn with round strokes, like the Igloo logo */}
                <svg
                    viewBox="0 0 220 60"
                    className="w-[min(78%,420px)] overflow-visible"
                    fill="none"
                    stroke="#e8edf4"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="ICE wordmark"
                >
                    <path className="dl-stroke" pathLength={1} strokeDasharray="1" d="M10 12 V48" />
                    <path className="dl-stroke" pathLength={1} strokeDasharray="1" d="M70 18 A18 18 0 1 0 70 42" />
                    <path className="dl-stroke" pathLength={1} strokeDasharray="1" d="M120 12 H96 V48 H120 M96 30 H116" />
                    <circle className="dl-stroke" pathLength={1} strokeDasharray="1" cx="160" cy="30" r="18" />
                    <path className="dl-stroke" pathLength={1} strokeDasharray="1" d="M200 12 V48" />
                </svg>

                {/* HUD leader + rules */}
                <div className="il-mono absolute left-6 top-6 w-[180px] text-[11px] font-bold leading-tight sm:left-10 sm:top-10">
                    <p className="dl-label">PORTFOLIO_CO_02</p>
                    <p className="dl-label">OVERPASS</p>
                    <span className="dl-rule mt-1.5 block h-px w-full origin-left bg-current" />
                </div>
                <div className="il-mono absolute bottom-6 right-6 w-[170px] text-right text-[11px] font-bold leading-tight sm:bottom-10 sm:right-10">
                    <p className="dl-label">D 06.01.2023</p>
                    <p className="dl-label">CLICK TO EXPLORE</p>
                    <span className="dl-rule mt-1.5 block h-px w-full origin-right bg-current" />
                </div>
                <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
                    <line className="dl-stroke" pathLength={1} strokeDasharray="1" x1="26%" y1="24%" x2="34%" y2="36%" stroke="#94dbff" strokeWidth="1.3" />
                    <line className="dl-stroke" pathLength={1} strokeDasharray="1" x1="72%" y1="76%" x2="64%" y2="64%" stroke="#94dbff" strokeWidth="1.3" />
                </svg>
                <svg viewBox="0 0 48 48" className="absolute right-[18%] top-[16%] size-12" aria-hidden>
                    <circle
                        className="dl-ring"
                        cx="24"
                        cy="24"
                        r="22"
                        pathLength={1}
                        strokeDasharray="1"
                        fill="rgba(255,255,255,0.04)"
                        stroke="#e8edf4"
                        strokeWidth="1"
                        transform="rotate(-90 24 24)"
                    />
                </svg>
            </div>
        </Demo>
    );
}
