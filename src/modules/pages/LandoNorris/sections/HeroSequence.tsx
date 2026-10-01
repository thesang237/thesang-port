'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

import BlockReveal, { type BlockRevealHandle } from '@/components/motion-kit/BlockReveal';
import { gsap, useGSAP } from '@/components/motion-kit/gsap';

import { IMG, MARQUEE, TEAM_LINE } from '../data';
import { heroState } from '../gl/heroState';
import { Emblem, Monogram, TrackMap } from '../graphics';
import LnImage from '../LnImage';
import { SIGNATURE_BIG } from '../scribbles';
import { LN_ENTER, useLN } from '../store';

const HeroGL = dynamic(() => import('../gl/HeroGL'), { ssr: false });

/*
 * Pinned hero → card (measured 31.0–35.5s): card rect lerps from the full viewport to 630×405 centred
 * (width & height share one progress), image scale 1 → 0.68, image darkens toward the section green,
 * signature draws over the second half. Two marquee lines drift behind the card.
 */
const PIN = 780; // px of scroll consumed by the pin (measured ≈770)
const CARD_END = { w: 630, h: 405 };

export default function HeroSequence() {
    const root = useRef<HTMLElement>(null);
    const raceReveals = useRef<Array<BlockRevealHandle | null>>([]);
    const msgReveal = useRef<BlockRevealHandle | null>(null);

    // intro (after the preloader / page transition reveal)
    useEffect(() => {
        const play = () => raceReveals.current.forEach((r, i) => void r?.play(0.12 + i * 0.06));
        window.addEventListener(LN_ENTER, play);
        if (useLN.getState().loaded) play();
        return () => window.removeEventListener(LN_ENTER, play);
    }, []);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            const card = q('.ln-hero-card')[0] as HTMLElement;
            const sig = q('.ln-hero-sig path');
            const vw = () => window.innerWidth;
            const vh = () => window.innerHeight;

            const mm = gsap.matchMedia();
            mm.add({ reduce: '(prefers-reduced-motion: reduce)', full: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
                const reduce = Boolean(ctx.conditions?.reduce);
                const state = { p: 0 };
                const apply = () => {
                    const p = state.p;
                    const w = gsap.utils.interpolate(vw(), CARD_END.w, p);
                    const h = gsap.utils.interpolate(vh(), CARD_END.h, p);
                    card.style.width = `${w}px`;
                    card.style.height = `${h}px`;
                    card.style.left = `${(vw() - w) / 2}px`;
                    card.style.top = `${(vh() - h) / 2}px`;
                    heroState.progress = p;
                    root.current?.style.setProperty('--hp', String(p));
                    root.current?.style.setProperty('--hpd', String(Math.pow(p, 1.3) * 0.87));
                    if (root.current) root.current.dataset.header = p > 0.04 ? 'dark' : 'light';
                };

                const tl = gsap.timeline({
                    defaults: { ease: 'none' },
                    scrollTrigger: {
                        id: 'ln-hero',
                        trigger: root.current,
                        start: 'top top',
                        end: `+=${PIN}`,
                        pin: q('.ln-hero-pin')[0],
                        scrub: reduce ? true : 0.35,
                        onLeave: () => msgReveal.current?.play(),
                    },
                });
                tl.to(state, { p: 1, duration: 1, onUpdate: apply }, 0)
                    .fromTo(sig[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 }, 0.3)
                    .fromTo(sig[1], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.16 }, 0.72)
                    .fromTo(sig[2], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.08 }, 0.9)
                    .fromTo(sig[3], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.03 }, 0.97)
                    .fromTo(q('.ln-hero-mq-a'), { xPercent: -8 }, { xPercent: 4, duration: 1 }, 0)
                    .fromTo(q('.ln-hero-mq-b'), { xPercent: 2 }, { xPercent: -10, duration: 1 }, 0)
                    .to(q('.ln-hero-race'), { autoAlpha: 0, y: 20, duration: 0.08 }, 0);
                apply();

                window.addEventListener('resize', apply);
                return () => window.removeEventListener('resize', apply);
            });
            return () => mm.revert();
        },
        { scope: root },
    );

    return (
        <section ref={root} className="ln-hero" data-header="light">
            <div className="ln-hero-pin">
                <div className="ln-hero-marquee" aria-hidden="true">
                    <div className="ln-hero-mq-a">{MARQUEE.serif.repeat(4)}</div>
                    <div className="ln-hero-mq-b">{MARQUEE.sans.repeat(4)}</div>
                </div>

                <div className="ln-hero-card" data-gl-hero>
                    <div className="ln-hero-card-dom">
                        <div className="ln-contours ln-contours--hero" />
                        <LnImage src={IMG.portrait} alt="Ellis Morrow" className="ln-hero-img" sizes="100vw" preload />
                    </div>
                </div>

                <HeroGL />

                <svg className="ln-hero-sig" viewBox="0 0 900 800" fill="none" aria-hidden="true">
                    {SIGNATURE_BIG.map((d, i) => (
                        <path key={i} d={d} />
                    ))}
                </svg>

                <div className="ln-hero-msg">
                    <Monogram className="ln-hero-msg-mono" />
                    <BlockReveal as="p" trigger="manual" split={false} ref={msgReveal} className="ln-hero-msg-label">
                        MESSAGE FROM ELLIS
                    </BlockReveal>
                </div>

                <div className="ln-hero-race">
                    <BlockReveal
                        as="p"
                        className="ln-race-label"
                        trigger="manual"
                        split={false}
                        ref={(r) => {
                            raceReveals.current[0] = r;
                        }}
                    >
                        NEXT RACE
                    </BlockReveal>
                    <div className="ln-race-card">
                        <svg className="ln-race-frame" viewBox="0 0 133 272" fill="none" aria-hidden="true">
                            <path d="M8 22H72C80 22 82 13 88 6C91 2 94 1 99 1H125C129 1 132 4 132 8V264C132 268 129 271 125 271H8C4 271 1 268 1 264V29C1 25 4 22 8 22Z" />
                        </svg>
                        <TrackMap className="ln-race-map" variant={0} />
                        <BlockReveal
                            as="p"
                            className="ln-race-gp"
                            trigger="manual"
                            split={false}
                            ref={(r) => {
                                raceReveals.current[1] = r;
                            }}
                        >
                            SINGAPORE&nbsp;&nbsp;GP
                        </BlockReveal>
                        <span className="ln-race-rule" />
                        <Emblem className="ln-race-emblem" />
                        <BlockReveal
                            as="p"
                            className="ln-race-team"
                            trigger="manual"
                            split={false}
                            ref={(r) => {
                                raceReveals.current[2] = r;
                            }}
                        >
                            {TEAM_LINE.replace(' SINCE', '\nSINCE')}
                        </BlockReveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
