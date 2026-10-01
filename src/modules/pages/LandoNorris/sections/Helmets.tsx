'use client';

import { useRef } from 'react';

import BlockReveal from '@/components/motion-kit/BlockReveal';
import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import { TransitionLink } from '@/components/motion-kit/PageTransition';

import { HELMETS, HELMETS_COPY, IMG } from '../data';
import { Emblem, HookArrow } from '../graphics';
import LnImage from '../LnImage';

/*
 * Measured: full-bleed photo holds while the #111 band (HELMETS / HALL OF FAME, 80px) slides up to y=615;
 * grid 4 × 452px columns (gutter 23), even columns offset +41px, cells 348px incl. notched label tab;
 * hover → lime frame + photo swap. CTA: lime emblem, serif 40px, lime button 188×52. Section ends with a
 * convex curve into the store.
 */
export default function Helmets() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            // photo reaches the top, holds (image drifts up inside), then scrolls away with the band
            gsap.fromTo(
                q('.ln-hl-photo img'),
                { yPercent: 0 },
                {
                    yPercent: -6,
                    ease: 'none',
                    scrollTrigger: { id: 'ln-helmets-photo', trigger: q('.ln-hl-photo')[0], start: 'top top', end: '+=420', pin: true, pinSpacing: true, scrub: true },
                },
            );
            // offset columns drift slightly faster than the page
            q('.ln-hl-col').forEach((col, i) => {
                if (i % 2) gsap.fromTo(col, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: q('.ln-hl-grid')[0], start: 'top bottom', end: 'bottom top', scrub: true } });
            });
        },
        { scope: root },
    );

    const cols = [0, 1, 2, 3].map((c) => HELMETS.filter((_, i) => i % 4 === c));

    return (
        <section ref={root} className="ln-helmets" data-header="dark">
            <div className="ln-hl-photo">
                <LnImage src={IMG.scene} sizes="100vw" />
            </div>
            <div className="ln-hl-band">
                <BlockReveal as="h2" className="ln-hl-title" stagger={0.08} start="top 85%">
                    <span className="ln-hl-t1">HELMETS</span>
                    <br />
                    <span className="ln-serif ln-hl-t2">HALL OF FAME</span>
                </BlockReveal>
                <BlockReveal as="p" className="ln-hl-copy" stagger={0.06} start="top 85%">
                    {HELMETS_COPY}
                </BlockReveal>
            </div>

            <div className="ln-hl-grid">
                {cols.map((col, c) => (
                    <div key={c} className="ln-hl-col" style={{ paddingTop: c % 2 ? 276 : 0 }}>
                        {col.map((h, k) => (
                            <div key={k} className="ln-hl-cell" data-photo={h.photo ? '1' : '0'}>
                                <svg className="ln-hl-frame" viewBox="0 0 452 456" preserveAspectRatio="none" fill="none" aria-hidden="true">
                                    <path
                                        d="M7 1H445C448 1 451 4 451 7V449C451 452 448 455 445 455H316C306 455 300 451 294 445L276 424C270 417 264 413 254 413H7C4 413 1 410 1 407V7C1 4 4 1 7 1Z"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>
                                <div className="ln-hl-media">
                                    <LnImage className="ln-hl-helmet" src={IMG.helmet} sizes="400px" style={{ filter: h.filter }} />
                                    <LnImage className="ln-hl-shot" src={c % 2 ? IMG.portraitHelmet : IMG.scene} sizes="452px" />
                                </div>
                                <p className="ln-hl-label">
                                    {h.name}
                                    <b>{h.year}</b>
                                </p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="ln-hl-cta">
                <Emblem className="ln-hl-emblem" />
                <BlockReveal as="p" className="ln-hl-cta-text ln-serif" stagger={0.08} start="top 88%">
                    See more helmets and highlights
                    <br />
                    from Ellis on the track
                </BlockReveal>
                <TransitionLink href="/landonorris/on-track" className="ln-btn ln-btn--lime">
                    VIEW ON TRACK <HookArrow className="ln-btn-icon" />
                </TransitionLink>
            </div>
            <svg className="ln-hl-curve" viewBox="0 0 1920 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 0H1920V8Q960 70 0 8Z" fill="var(--ln-black)" />
            </svg>
        </section>
    );
}
