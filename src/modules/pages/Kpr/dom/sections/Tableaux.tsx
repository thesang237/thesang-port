'use client';

import { useRef, useState } from 'react';

import { gsap } from '@/components/motion-kit/gsap';

import { LAUNCH, TABLEAUX } from '../../data/copy';
import { launchLeave, W } from '../../scroll/timeline';
import { film } from '../../scroll/useScrollStore';
import BtnFrame from '../ui/BtnFrame';
import { Caption, Hacky, Hair, Lines } from '../ui/Text';
import { useAct } from '../ui/useAct';

type TabKey = 'keep' | 'factions' | 'world';

const WINDOWS: Record<TabKey, readonly [number, number]> = {
    keep: [W.keepIn[1] - 0.15, W.handoff1[0] + 0.12],
    factions: [W.handoff1[1] - 0.1, W.handoff2[0] + 0.12],
    world: [W.handoff2[1] - 0.1, W.launchIn[0] + 0.1],
};

/** "Click & hold" ring: fills while held, then decodes a short transmission line. */
function HoldRing() {
    const ring = useRef<SVGCircleElement>(null);
    const tween = useRef<gsap.core.Tween | null>(null);
    const [done, setDone] = useState(false);
    const start = () => {
        tween.current?.kill();
        tween.current = gsap.to(ring.current, { strokeDashoffset: 0, duration: 1.2, ease: 'none', onComplete: () => setDone(true) });
    };
    const stop = () => {
        tween.current?.kill();
        tween.current = gsap.to(ring.current, { strokeDashoffset: 126, duration: 0.3, ease: 'kpr.out' });
    };
    return (
        <button
            type="button"
            className="kpr-hold kpr-cap3"
            data-r="fade"
            data-d="0.6"
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && start()}
            onKeyUp={stop}
            aria-label={TABLEAUX.hold}
        >
            <svg viewBox="0 0 44 44" className="kpr-hold__svg" aria-hidden="true">
                <circle cx="22" cy="22" r="20" className="kpr-hold__track" />
                <circle ref={ring} cx="22" cy="22" r="20" className="kpr-hold__fill" strokeDasharray="126" strokeDashoffset="126" />
                <path d="M22 15 V29 M15 22 H29" className="kpr-hold__plus" />
            </svg>
            <span className="kpr-hold__label">{done ? <Hacky text="Transmission saved" reveal={false} /> : TABLEAUX.hold}</span>
        </button>
    );
}

function Tableau({ id }: { id: TabKey }) {
    const ref = useRef<HTMLElement>(null);
    const data = TABLEAUX[id];
    useAct(ref, WINDOWS[id]);
    return (
        <section ref={ref} className={`kpr-sec kpr-tab kpr-tab--${id}`} id={id} aria-label={data.title}>
            <div className="kpr-tab__story">
                <div className="kpr-tab__cap kpr-cap2" data-r="fade">
                    {data.index}
                    <i className="kpr-dot" aria-hidden="true" />
                    {data.title}
                </div>
                <Lines lines={data.lines} className="kpr-tab__text kpr-body1" as="p" d={0.1} />
            </div>
            <HoldRing />
        </section>
    );
}

export function Tableaux() {
    return (
        <>
            <Tableau id="keep" />
            <Tableau id="factions" />
            <Tableau id="world" />
        </>
    );
}

/** Launch: KEEPERS wordmark (drawn in WebGL so the cards can sit in front) + caption, line, CTA. */
export function Launch() {
    const ref = useRef<HTMLElement>(null);
    useAct(ref, [W.launchIn[0] + 0.3, W.launch[1] + 2], (root) => {
        // the card captions leave with their cards as the footer comes up
        root.style.setProperty('--kpr-leave', launchLeave(film.view).toFixed(3));
    });
    return (
        <section ref={ref} className="kpr-sec kpr-launch" aria-label="Launch">
            <h2 className="kpr-sr">{LAUNCH.word}</h2>
            <div className="kpr-launch__word" data-gl-anchor="launch-word" />
            <div className="kpr-launch__card kpr-launch__a">
                <Caption text={LAUNCH.cards[0]} className="kpr-launch__cardcap" d={0.9} />
            </div>
            <div className="kpr-launch__card kpr-launch__b">
                <Caption text={LAUNCH.cards[2]} className="kpr-launch__cardcap" d={1.0} />
            </div>
            <div className="kpr-launch__card kpr-launch__c">
                <Caption text={LAUNCH.cards[1]} className="kpr-launch__cardcap" d={1.1} />
            </div>
            <div className="kpr-launch__foot">
                <div className="kpr-cap kpr-cap2" data-r="fade" data-d="0.5">
                    <i className="kpr-dot" aria-hidden="true" />
                    {LAUNCH.caption}
                </div>
                <p className="kpr-body1 kpr-launch__body" data-r="fade" data-d="0.6">
                    {LAUNCH.body}
                </p>
                <a className="kpr-btn" href="#top" data-r="fade" data-d="0.7" data-sfx>
                    <BtnFrame />
                    <Hacky text={LAUNCH.cta} reveal={false} />
                </a>
                <Hair dir="h" className="kpr-launch__hr" d={0.4} />
            </div>
        </section>
    );
}
