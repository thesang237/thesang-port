'use client';

import { type CSSProperties, useRef, useState } from 'react';

import { Btn, Demo, Segmented, Slider } from '../kit/controls';
import { gsap, ScrollTrigger, useGSAP } from '../kit/gsap';
import { useParams } from '../kit/loop';
import { blockReset, blockReveal } from '../kit/reveal';
import { LN } from '../kit/source';

type Mode = 'whole' | 'perLine';
const DEFAULTS = { mode: 'whole' as Mode, start: 92 };

// a few paragraphs, pre-broken into lines (the source lets SplitText find the lines)
const PARAS = [
    ['FROM BOLD SIGNATURE', 'PATTERNS TO ONE-OFF', 'SPECIALS, EVERY HELMET', 'IS A CANVAS WORTH', 'REMEMBERING.'],
    ['RETHINKING LIMITS,', 'CHASING EVERY WIN,', 'GIVING IT EVERYTHING', 'ALL WAYS. BUILDING A', 'LEGACY IN RACING', 'ON AND OFF THE', 'TRACK.'],
    ['CELEBRATE THIS MOMENT', 'WITH A COLLECTION MADE', 'FOR THE FANS WHO NEVER', 'STOPPED BELIEVING.'],
];

/** Where and how often a reveal fires: one trigger per block, or one per line (the manifesto). */
export default function TriggerModes() {
    const { p, set, reset } = useParams(DEFAULTS);
    const box = useRef<HTMLDivElement>(null);
    const [run, setRun] = useState(0);
    const [fired, setFired] = useState(0);

    useGSAP(
        () => {
            const scroller = box.current!;
            scroller.scrollTop = 0;
            const q = gsap.utils.selector(scroller);
            const start = `top ${p.start}%`;
            let count = 0;
            const bump = () => setFired(++count);
            (q('.tm-para') as HTMLElement[]).forEach((para) => {
                const lines = Array.from(para.querySelectorAll<HTMLElement>('.tm-line'));
                const blocks = lines.map((l) => l.querySelector<HTMLElement>('.ll-br-block')!);
                blockReset(lines, blocks);
                if (p.mode === 'whole') {
                    ScrollTrigger.create({
                        trigger: para,
                        scroller,
                        start,
                        once: true,
                        onEnter: () => {
                            bump();
                            blockReveal(lines, blocks);
                        },
                    });
                } else {
                    lines.forEach((line, i) => {
                        ScrollTrigger.create({
                            trigger: line,
                            scroller,
                            start,
                            once: true,
                            onEnter: () => {
                                bump();
                                blockReveal([line], [blocks[i]]);
                            },
                        });
                    });
                }
            });
            return () => setFired(0);
        },
        { scope: box, dependencies: [p.mode, p.start, run], revertOnUpdate: true },
    );

    return (
        <Demo
            title="Trigger modes — whole block vs per line"
            hint="Scroll inside the box. The dashed line is the trigger’s start position: a reveal fires when a block’s (or a line’s) top crosses it."
            onReset={() => {
                reset();
                setRun((r) => r + 1);
            }}
            controls={
                <>
                    <Segmented
                        label="trigger"
                        options={[
                            { value: 'whole', label: 'one per block' },
                            { value: 'perLine', label: 'perLine' },
                        ]}
                        value={p.mode}
                        onChange={(v) => set('mode', v)}
                    />
                    <Slider
                        label="start"
                        value={p.start}
                        min={40}
                        max={100}
                        step={1}
                        onChange={(v) => set('start', v)}
                        format={(v) => `top ${v}%`}
                        help="How far down the box the top must reach. Source default: 92% (manifesto 96%)."
                    />
                    <Btn onClick={() => setRun((r) => r + 1)}>↻ Rewind & re-arm</Btn>
                    <div className="ll-mono text-[11px] text-[var(--ll-dim)]">
                        triggers fired: <span className="text-[var(--ll-lime)]">{fired}</span>
                    </div>
                </>
            }
        >
            <div className="relative" style={{ background: LN.dark }}>
                <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-[var(--ll-warn)]" style={{ top: `${p.start}%` } as CSSProperties}>
                    <span className="ll-mono absolute right-2 top-1 text-[9.5px] text-[var(--ll-warn)]">{`start: top ${p.start}%`}</span>
                </div>
                <div ref={box} data-lenis-prevent className="ll-scrollbox relative h-[380px] overflow-y-auto">
                    <div className="space-y-24 px-5 pb-[300px] pt-[400px] sm:px-10">
                        {PARAS.map((para, k) => (
                            <div key={k} className="tm-para text-[clamp(22px,3.4vw,36px)] font-semibold leading-[1.02] tracking-[-0.02em] text-[#dde2d2]">
                                {para.map((line, i) => (
                                    <div key={i} className="tm-line" style={{ '--br-text': 0 } as CSSProperties}>
                                        <span className="ll-br-inner">
                                            <span className="ll-br-text">{line}</span>
                                            <span className="ll-br-block" style={{ background: LN.lime }} aria-hidden />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Demo>
    );
}
