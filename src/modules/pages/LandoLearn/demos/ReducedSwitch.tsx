'use client';

import { useId, useRef, useState } from 'react';

import { Btn, Demo } from '../kit/controls';
import { gsap, useGSAP } from '../kit/gsap';
import { FOUR_BOX, FOUR_PATH, IMG, LN, PartnerLogo, PARTNERS } from '../kit/source';

const W = 320;
const H = 180;
const S1 = 12;

function Loader({ reduced, run }: { reduced: boolean; run: number }) {
    const id = useId().replace(/:/g, '');
    const root = useRef<HTMLDivElement>(null);
    const hole = useRef<SVGPathElement>(null);
    const tf = (s: number) => `translate(${W / 2} ${H / 2}) scale(${s}) skewX(${FOUR_BOX.skew}) translate(${-FOUR_BOX.origin[0]} ${-FOUR_BOX.origin[1]})`;
    useGSAP(
        () => {
            const lime = root.current!.querySelector('.rs-lime');
            gsap.set(lime, { autoAlpha: 1 });
            hole.current?.setAttribute('transform', tf(S1 / 1024));
            if (reduced) gsap.to(lime, { autoAlpha: 0, duration: 0.35, ease: 'power1.out', delay: 0.6 });
            else {
                const st = { s: S1 / 1024 };
                gsap.to(st, {
                    s: S1,
                    duration: 0.51,
                    ease: 'expo.in',
                    delay: 0.6,
                    onUpdate: () => hole.current?.setAttribute('transform', tf(st.s)),
                    onComplete: () => void gsap.set(lime, { autoAlpha: 0 }),
                });
            }
        },
        { scope: root, dependencies: [run], revertOnUpdate: true },
    );
    return (
        <div ref={root} className="relative aspect-[16/9] overflow-hidden rounded-lg" style={{ background: LN.hero }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- mini page */}
            <img src={IMG.portrait} alt="" className="absolute inset-0 size-full object-cover object-bottom" />
            <svg className="rs-lime absolute inset-0 size-full" viewBox={`0 0 ${W} ${H}`} aria-hidden>
                <defs>
                    <mask id={`rs-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                        <rect width={W} height={H} fill="white" />
                        <path ref={hole} d={FOUR_PATH} fill="black" />
                    </mask>
                </defs>
                <rect width={W} height={H} fill={LN.lime} mask={`url(#rs-${id})`} />
            </svg>
        </div>
    );
}

function Strip({ reduced }: { reduced: boolean }) {
    return (
        <div className="overflow-hidden rounded-lg bg-[#f1f3e8] py-3">
            <div className="flex w-max gap-8 pr-8 text-[#1b1c17]" style={{ animation: reduced ? 'none' : 'll-marquee 14s linear infinite' }}>
                {[...PARTNERS, ...PARTNERS].map((p, i) => (
                    <span key={i} className="scale-75">
                        <PartnerLogo name={p} />
                    </span>
                ))}
            </div>
        </div>
    );
}

/** The same two moments, full motion vs reduced motion, as the source handles them. */
export default function ReducedSwitch() {
    const [run, setRun] = useState(0);
    return (
        <Demo
            title="Full motion vs reduced motion"
            hint="Press Replay. Left: what most people see. Right: what the source does when the system asks for reduced motion."
            controls={
                <Btn primary onClick={() => setRun((r) => r + 1)}>
                    ↻ Replay
                </Btn>
            }
        >
            <div className="grid gap-4 p-4 sm:grid-cols-2">
                {[false, true].map((reduced) => (
                    <div key={String(reduced)} className="min-w-0 space-y-3">
                        <div className="ll-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: reduced ? 'var(--ll-mint)' : 'var(--ll-lime)' }}>
                            {reduced ? 'prefers-reduced-motion: reduce' : 'no preference'}
                        </div>
                        <Loader reduced={reduced} run={run} />
                        <p className="text-[12.5px] text-[var(--ll-dim)]">{reduced ? 'Loader: the lime simply fades (0.35 s).' : 'Loader: the “4” window zooms (0.51 s, expo.in).'}</p>
                        <Strip reduced={reduced} />
                        <p className="text-[12.5px] text-[var(--ll-dim)]">{reduced ? 'Marquee: never starts.' : 'Marquee: drifts forever.'}</p>
                    </div>
                ))}
            </div>
        </Demo>
    );
}
