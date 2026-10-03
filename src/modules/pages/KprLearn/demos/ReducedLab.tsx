'use client';

import { useEffect, useRef, useState } from 'react';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { RESTS, TOTAL } from '../kit/source';

import { actAt, drawCards, sampleAt } from './xray';

/** KprPage.tsx: under reduced motion the film shows the nearest rest still */
const nearestRest = (t: number) => RESTS.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a), RESTS[0]);

/** Chapter 11: the same scroll, with and without reduced motion. */
export default function ReducedLab() {
    const [t, setT] = useState(4.6);
    const [reduced, setReduced] = useState(true);
    const canvas = useRef<HTMLCanvasElement>(null);
    const cut = useRef<HTMLDivElement>(null);
    const view = reduced ? nearestRest(Math.min(t, TOTAL)) : t;
    const lastView = useRef(view);

    useEffect(() => {
        const c = canvas.current;
        if (!c) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const r = c.getBoundingClientRect();
        c.width = Math.round(r.width * dpr);
        c.height = Math.round(r.height * dpr);
        const g = c.getContext('2d')!;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = '#fff';
        g.fillRect(0, 0, r.width, r.height);
        drawCards(g, sampleAt(view), r.width, r.height, { labels: true });
        // the 160 ms white flash between stills (the page's .kpr-cut layer)
        if (reduced && view !== lastView.current && cut.current) gsap.fromTo(cut.current, { opacity: 1 }, { opacity: 0, duration: 0.16, ease: 'none' });
        lastView.current = view;
    }, [view, reduced]);

    return (
        <Demo
            title="Reduced motion — stills instead of a film"
            hint="Drag the scroll. With reduced motion on, the picture only changes at the 11 rest points, with a short flash instead of movement."
            onReset={() => {
                setT(4.6);
                setReduced(true);
            }}
            controls={
                <>
                    <Slider label="scroll (film t)" value={t} min={0} max={TOTAL} step={0.01} onChange={setT} />
                    <Toggle
                        label="prefers reduced motion"
                        checked={reduced}
                        onChange={setReduced}
                        help="The operating-system setting. The page reads it live (it can change while the page is open)."
                    />
                    <Readout
                        items={[
                            { label: 'scroll', value: t.toFixed(2) },
                            { label: 'shown', value: view.toFixed(2), color: '#c0fb50' },
                            { label: 'act', value: actAt(view) },
                        ]}
                    />
                    <div className="kl-mono flex flex-wrap gap-1 text-[10px]">
                        {RESTS.map((r) => (
                            <span key={r} className={`border px-1.5 py-0.5 ${r === view ? 'border-[var(--kl-black)] bg-[var(--kl-lime)]' : 'border-[var(--kl-line-2)]'}`}>
                                {r}
                            </span>
                        ))}
                    </div>
                </>
            }
        >
            <div className="relative">
                <canvas ref={canvas} className="block aspect-[16/10] w-full bg-white" aria-label={`Still shown at film ${view.toFixed(2)}`} role="img" />
                <div ref={cut} className="pointer-events-none absolute inset-0 bg-white opacity-0" />
            </div>
        </Demo>
    );
}
