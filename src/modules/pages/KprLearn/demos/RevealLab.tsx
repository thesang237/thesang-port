'use client';

import { Fragment, useRef, useState } from 'react';

import { Btn, Demo, Readout, Slider } from '../kit/controls';
import { CustomEase, gsap, useGSAP } from '../kit/gsap';
import { buildReveal, registerEases, scrambleInto } from '../kit/source';

const WIN: [number, number] = [0.3, 0.7];
const CAPTION = 'A FIELD NOTE FROM THE KEEP';
const LINES = ['EVERY STORY HAS', 'A BLANK PAGE LEFT.'];

/**
 * Chapter 10: the source's real buildReveal() (dom/ui/reveal.ts) on a block written with the same
 * data attributes and class names as the page. The watcher is a teaching copy of actWatcher: play on
 * entering the window, reverse 2.2× faster on leaving.
 */
export default function RevealLab() {
    const root = useRef<HTMLDivElement>(null);
    const tl = useRef<gsap.core.Timeline | null>(null);
    const inside = useRef<boolean | null>(null);
    const [t, setT] = useState(0.1);
    const [state, setState] = useState('outside');

    useGSAP(
        () => {
            registerEases(CustomEase);
            const el = root.current!;
            tl.current = buildReveal(el, scrambleInto);
            gsap.set(el, { autoAlpha: 0 });
            return () => {
                tl.current?.kill();
            };
        },
        { scope: root },
    );

    const watch = (v: number) => {
        const el = root.current;
        const timeline = tl.current;
        if (!el || !timeline) return;
        const now = v >= WIN[0] && v <= WIN[1];
        if (now === inside.current) return;
        inside.current = now;
        if (now) {
            gsap.set(el, { autoAlpha: 1 });
            timeline.eventCallback('onReverseComplete', null);
            timeline.timeScale(1).play();
            setState('entered: playing forward (1×)');
        } else {
            timeline.eventCallback('onReverseComplete', () => {
                gsap.set(el, { autoAlpha: 0 });
            });
            timeline.timeScale(2.2).reverse();
            setState('left: reversing (2.2×), then hidden');
        }
    };

    const move = (v: number) => {
        setT(v);
        watch(v);
    };

    return (
        <Demo
            title="Enter plays, leave reverses — the page’s reveal system"
            hint="Drag the playhead into the window (0.30–0.70), then out again. Text arrives at normal speed and leaves 2.2× faster, in reverse."
            onReset={() => move(0.1)}
            controls={
                <>
                    <Slider label="playhead" value={t} min={0} max={1} step={0.005} onChange={move} help="Stands in for the film clock. The block’s window is 0.30–0.70." />
                    <div className="flex flex-wrap gap-2">
                        <Btn primary onClick={() => move(0.5)}>
                            Enter
                        </Btn>
                        <Btn onClick={() => move(0.9)}>Leave</Btn>
                    </div>
                    <Readout items={[{ label: 'state', value: state, color: '#c0fb50' }]} />
                    <ul className="kl-mono space-y-1 text-[10.5px] text-[var(--kl-dim)]">
                        <li>data-r=&quot;chars&quot; · caption types on, dot blinks</li>
                        <li>data-r=&quot;lines&quot; · masked rise, 0.95 s, 70 ms stagger</li>
                        <li>data-r=&quot;hline&quot; · hairline draws, 1.3 s</li>
                        <li>data-r=&quot;hacky&quot; · decodes in uppercase</li>
                        <li>data-r=&quot;fade&quot; · fade + 18 px rise</li>
                    </ul>
                </>
            }
        >
            <div className="relative bg-[var(--kl-black)] p-6 text-white sm:p-10">
                <div className="kl-mono mb-4 flex gap-1" aria-hidden>
                    <span className="h-1 flex-1 bg-white/15">
                        <span className="block h-full bg-[var(--kl-lime)]" style={{ marginLeft: `${WIN[0] * 100}%`, width: `${(WIN[1] - WIN[0]) * 100}%` }} />
                    </span>
                </div>
                <div ref={root} className="kl-reveal min-h-[260px] max-w-[640px]">
                    <div className="kl-mono mb-4 flex items-center text-[11px] uppercase" data-r="chars" data-d="0">
                        <i className="kpr-dot" aria-hidden />
                        <span className="kpr-sr">{CAPTION}</span>
                        <span aria-hidden>
                            {[...CAPTION].map((ch, i) => (
                                <span className="kpr-ch" key={i}>
                                    {ch}
                                </span>
                            ))}
                        </span>
                    </div>
                    <h3 className="kl-head mb-5 text-[clamp(28px,4.4vw,52px)] uppercase leading-[0.95]" data-r="lines" data-d="0.1">
                        <span className="kpr-sr">{LINES.join(' ')}</span>
                        <span aria-hidden>
                            {LINES.map((l) => (
                                <Fragment key={l}>
                                    <span className="kpr-line">
                                        <span>{l}</span>
                                    </span>
                                </Fragment>
                            ))}
                        </span>
                    </h3>
                    <i className="kpr-hair kpr-hair--h mb-5" data-r="hline" data-d="0.2" aria-hidden />
                    <div className="kl-mono mb-4 text-[12px]">
                        <span className="kpr-hacky" data-r="hacky" data-d="0.3">
                            <span className="kpr-hacky__spacer">Coordinates 47.12 N · 33.8°</span>
                            <span className="kpr-hacky__anim" aria-hidden>
                                Coordinates 47.12 N · 33.8°
                            </span>
                        </span>
                    </div>
                    <p className="max-w-[46ch] text-[15px] leading-relaxed text-white/75" data-r="fade" data-d="0.45">
                        Reveals are short timelines built from data attributes. They are the one part of the film that plays in time instead of following your scroll.
                    </p>
                </div>
            </div>
        </Demo>
    );
}
