'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

import { Demo, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { MANIFESTO } from '../kit/source';

const DEFAULTS = { lerp: 0.1, locked: false };

function Column() {
    return (
        <div className="space-y-1 px-5 py-10">
            {[0, 1, 2].map((k) =>
                MANIFESTO.map((line, i) => (
                    <p key={`${k}-${i}`} className="text-[26px] font-semibold uppercase leading-[1.05] tracking-[-0.02em] text-[#dde2d2]">
                        {line.map(([t, serif], j) =>
                            serif ? (
                                <em key={j} className="ll-serif not-italic text-[var(--ll-lime-soft)]">
                                    {t}
                                </em>
                            ) : (
                                <span key={j}>{t}</span>
                            ),
                        )}
                    </p>
                )),
            )}
        </div>
    );
}

/** Same content, two scroll boxes: the browser’s own scroll vs. a Lenis instance on the same clock. */
export default function ScrollCompare() {
    const { p, set, reset } = useParams(DEFAULTS);
    const wrap = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const lenis = useRef<Lenis | null>(null);

    useEffect(() => {
        const l = new Lenis({ wrapper: wrap.current!, content: content.current!, lerp: DEFAULTS.lerp, autoRaf: false });
        const tick = (time: number) => l.raf(time * 1000);
        gsap.ticker.add(tick);
        lenis.current = l;
        return () => {
            gsap.ticker.remove(tick);
            l.destroy();
            lenis.current = null;
        };
    }, []);

    useEffect(() => {
        if (lenis.current) lenis.current.options.lerp = p.lerp;
    }, [p.lerp]);

    useEffect(() => {
        if (p.locked) lenis.current?.stop();
        else lenis.current?.start();
    }, [p.locked]);

    return (
        <Demo
            title="Native scroll vs Lenis"
            hint="Scroll inside each box with a mouse wheel (a trackpad already smooths itself). The left jumps per notch; the right glides."
            onReset={reset}
            controls={
                <>
                    <Slider label="lerp (right box)" value={p.lerp} min={0.02} max={1} onChange={(v) => set('lerp', v)} help="1 = no smoothing (same as the left). 0.1 = the source. 0.03 = syrupy." />
                    <Toggle label="lenis.stop()" checked={p.locked} onChange={(v) => set('locked', v)} help="What the menu does while it’s open: the page behind can’t scroll." />
                </>
            }
        >
            <div className="grid gap-px bg-[var(--ll-line)] sm:grid-cols-2">
                <div className="relative bg-[var(--ll-panel)]">
                    <span className="ll-mono absolute left-3 top-2 z-10 rounded bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--ll-dim)]">native</span>
                    <div data-lenis-prevent className="ll-scrollbox h-[340px] overflow-y-auto">
                        <Column />
                    </div>
                </div>
                <div className="relative bg-[var(--ll-panel)]">
                    <span className="ll-mono absolute left-3 top-2 z-10 rounded bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--ll-lime)]">{`lenis · lerp ${p.lerp.toFixed(2)}`}</span>
                    <div ref={wrap} data-lenis-prevent className="ll-scrollbox h-[340px] overflow-y-auto">
                        <div ref={content}>
                            <Column />
                        </div>
                    </div>
                </div>
            </div>
        </Demo>
    );
}
