'use client';

import { useEffect, useRef } from 'react';

import BlockReveal, { type BlockRevealHandle } from '@/components/motion-kit/BlockReveal';
import { gsap, SplitText, useGSAP } from '@/components/motion-kit/gsap';

import { IMG } from '../data';
import { Emblem, FOUR_BOX, FOUR_PATH, TrackMap, UKFlag } from '../graphics';
import LnImage from '../LnImage';
import { SCRIPT_ON_BIG } from '../scribbles';
import { LN_ENTER, useLN } from '../store';

/*
 * Destination page (measured at 1920×1030, t = 120.0–121.9s):
 * "TRACK" 630–1895 × cap 135–425 (≈400px, white), lime brush "ON" drawn over the helmet, gold helmet crop
 * bottom-left, info row y≈448 (condensed 36px), label + 40px paragraph with a lime serif tail, cards at y≈848.
 * Enter: chars rise out of a mask (stagger from the centre), script draws, block reveals on text.
 */
export default function OnTrackPage() {
    const root = useRef<HTMLElement>(null);
    const reveals = useRef<Array<BlockRevealHandle | null>>([]);
    const intro = useRef<gsap.core.Timeline | null>(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            const split = SplitText.create(q('.ln-ot-title')[0], { type: 'chars', charsClass: 'ln-ot-char' });
            gsap.set(split.chars, { yPercent: 105 });
            gsap.set(q('.ln-ot-script path'), { drawSVG: '0%' });
            intro.current = gsap
                .timeline({ paused: true })
                .to(split.chars, { yPercent: 0, duration: 0.75, ease: 'power3.out', stagger: { each: 0.05, from: 'center' } }, 0.05)
                .to(q('.ln-ot-script path'), { drawSVG: '100%', duration: 0.55, ease: 'power2.inOut', stagger: 0.12 }, 0)
                .fromTo(q('.ln-ot-helmet'), { scale: 1.08, autoAlpha: 0.6 }, { scale: 1, autoAlpha: 1, duration: 1.1, ease: 'power3.out' }, 0)
                .call(() => reveals.current.forEach((r, i) => void r?.play(0.02 * i)), [], 0.12);
            return () => split.revert();
        },
        { scope: root },
    );

    useEffect(() => {
        const play = () => {
            intro.current?.restart();
        };
        window.addEventListener(LN_ENTER, play);
        // direct load: the overlay's first reveal fires LN_ENTER too; if already loaded (client nav w/o overlay), play now
        if (useLN.getState().loaded && useLN.getState().transition === 'idle') play();
        return () => window.removeEventListener(LN_ENTER, play);
    }, []);

    const reg = (i: number) => (h: BlockRevealHandle | null) => {
        reveals.current[i] = h;
    };

    return (
        <main ref={root} className="ln-ontrack" data-header="dim">
            <div className="ln-ot-helmet">
                <LnImage src={IMG.helmet} sizes="1500px" preload />
            </div>
            <h1 className="ln-ot-title" aria-label="On track">
                TRACK
            </h1>
            <svg className="ln-ot-script" viewBox="0 0 760 460" fill="none" aria-hidden="true">
                {SCRIPT_ON_BIG.map((d, i) => (
                    <path key={i} d={d} />
                ))}
            </svg>

            <div className="ln-ot-info">
                <BlockReveal as="p" trigger="manual" split={false} ref={reg(0)}>
                    LAST LAP ELLIS
                </BlockReveal>
                <BlockReveal as="p" trigger="manual" split={false} ref={reg(1)}>
                    26 Y.O
                </BlockReveal>
                <BlockReveal as="p" trigger="manual" split={false} ref={reg(2)} className="ln-ot-home">
                    LEEDS, UK <UKFlag className="ln-ot-flag" />
                </BlockReveal>
            </div>

            <BlockReveal as="p" className="ln-ot-label" trigger="manual" split={false} ref={reg(3)}>
                PUSHING THE LIMIT
            </BlockReveal>
            <BlockReveal as="p" className="ln-ot-copy" trigger="manual" stagger={0.09} ref={reg(4)}>
                Since his debut with Team Orbit in 2019, Ellis Morrow has been all in – pushing limits, chasing wins, and bringing the <em className="ln-serif">fight to every race.</em>
            </BlockReveal>

            <div className="ln-ot-cards">
                <div className="ln-ot-card ln-ot-card--prev">
                    <p className="ln-ot-card-label">PREVIOUS</p>
                    <svg className="ln-ot-frame" viewBox="0 0 132 200" preserveAspectRatio="none" fill="none" aria-hidden="true">
                        <path d="M6 1H120C126 1 131 6 131 12V200M1 200V6C1 3 3 1 6 1" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <TrackMap className="ln-ot-mini" variant={1} />
                    <p className="ln-ot-card-name">AZURE COAST&nbsp;&nbsp;GP</p>
                </div>
                <div className="ln-ot-card ln-ot-card--next">
                    <p className="ln-ot-card-label">NEXT</p>
                    <div className="ln-ot-next">
                        <div className="ln-ot-cell ln-ot-cell--rnd">
                            <div className="ln-contours" />
                            <span>RND.18</span>
                        </div>
                        <div className="ln-ot-cell ln-ot-cell--flag">
                            <span className="ln-ot-sg" />
                            <p>MARINA BAY</p>
                        </div>
                        <div className="ln-ot-cell ln-ot-cell--map">
                            <TrackMap variant={0} className="ln-ot-map" />
                        </div>
                        <div className="ln-ot-cell ln-ot-cell--num">
                            <svg viewBox="0 0 84 97" aria-hidden="true">
                                <path d={FOUR_PATH} transform={`translate(23 0) skewX(${FOUR_BOX.skew})`} fill="var(--ln-lime)" />
                            </svg>
                        </div>
                        <div className="ln-ot-cell ln-ot-cell--emblem">
                            <Emblem />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
