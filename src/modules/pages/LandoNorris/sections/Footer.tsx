'use client';

import { useRef } from 'react';

import BlockReveal from '@/components/motion-kit/BlockReveal';
import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import Marquee from '@/components/motion-kit/Marquee';
import { TransitionLink } from '@/components/motion-kit/PageTransition';
import RollingText from '@/components/motion-kit/RollingText';

import { IMG, NAV, PARTNERS, SOCIALS } from '../data';
import { HookArrow } from '../graphics';
import LnImage from '../LnImage';
import { SIGNATURE_BIG } from '../scribbles';

import { PartnerLogo } from './PartnerLogo';

/*
 * Measured (k_108.0): lime page, dark card inset 22px with a raised tab (x 740–1180, 50px) and a lowered
 * bottom between x 330–1650; heading 86px (sans 800 white + serif lime) centred at y≈245–390,
 * signature drawn over it; PAGES / FOLLOW ON columns centred at x 327 / 1585 (36px condensed);
 * helmet bust bottom-centre; logo marquee y≈918; BUSINESS ENQUIRIES 846–1073 × 925–978.
 */
export default function Footer() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            gsap.fromTo(q('.ln-ft-sig path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut', stagger: 0.12, scrollTrigger: { trigger: root.current, start: 'top 20%' } });
            gsap.fromTo(q('.ln-ft-bust'), { yPercent: 12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true } });
        },
        { scope: root },
    );

    return (
        <footer ref={root} className="ln-footer" data-header="light">
            <div className="ln-ft-hit" data-header="dark" />
            <div className="ln-ft-card">
                <svg className="ln-ft-shape" viewBox="0 0 1876 1000" preserveAspectRatio="none" aria-hidden="true">
                    <path
                        d="M40 50H700C730 50 740 44 754 30L768 14C778 4 790 0 810 0H1066C1086 0 1098 4 1108 14L1122 30C1136 44 1146 50 1176 50H1836C1858 50 1876 68 1876 90V902C1876 924 1858 942 1836 942H1650C1626 942 1614 952 1604 964L1590 978C1580 990 1566 996 1546 996H330C310 996 296 990 286 978L272 964C262 952 250 942 226 942H40C18 942 0 924 0 902V90C0 68 18 50 40 50Z"
                        fill="var(--ln-dark)"
                    />
                </svg>
                <div className="ln-contours ln-ft-contours" />
                <LnImage className="ln-ft-bust" src={IMG.portraitHelmet} sizes="(min-width: 1200px) 1625px, 100vw" />

                <div className="ln-ft-head">
                    <BlockReveal as="h2" className="ln-ft-title" stagger={0.08} start="top 100%">
                        <span className="ln-ft-t1">ALWAYS </span>
                        <span className="ln-serif ln-ft-t2">PUSHING</span>
                        <br />
                        <span className="ln-ft-t1">THE </span>
                        <span className="ln-serif ln-ft-t2">LIMIT</span>
                        <span className="ln-ft-t1">.</span>
                    </BlockReveal>
                    <svg className="ln-ft-sig" viewBox="0 0 900 640" fill="none" aria-hidden="true">
                        {SIGNATURE_BIG.slice(2).map((d, i) => (
                            <path key={i} d={d} />
                        ))}
                    </svg>
                </div>

                <div className="ln-ft-col ln-ft-col--pages">
                    <p className="ln-ft-label">PAGES</p>
                    {NAV.map((n) => (
                        <TransitionLink key={n.label} href={n.href} className="ln-ft-link">
                            <RollingText text={n.label} hoverColor="var(--ln-lime)" />
                        </TransitionLink>
                    ))}
                    <a href="#store" className="ln-ft-link ln-ft-link--lime" onClick={(e) => e.preventDefault()}>
                        <RollingText text="STORE" hoverColor="#f1f3e8" />
                    </a>
                </div>
                <div className="ln-ft-col ln-ft-col--follow">
                    <p className="ln-ft-label">FOLLOW ON</p>
                    {SOCIALS.map((s) => (
                        <a key={s} href="#" className="ln-ft-link" onClick={(e) => e.preventDefault()}>
                            <RollingText text={s} hoverColor="var(--ln-lime)" />
                        </a>
                    ))}
                </div>

                <Marquee className="ln-ft-logos" speed={45} gap={0}>
                    {PARTNERS.map((p) => (
                        <PartnerLogo key={p} name={p} color="#cdff0b" />
                    ))}
                </Marquee>

                <a href="#" className="ln-btn ln-btn--lime ln-ft-biz" onClick={(e) => e.preventDefault()}>
                    BUSINESS ENQUIRIES <HookArrow className="ln-btn-icon" />
                </a>
            </div>
            <p className="ln-ft-copy">
                © 2026 <b>Ellis Morrow.</b> All rights reserved
            </p>
            <p className="ln-ft-legal">
                <a href="#">PRIVACY POLICY</a>
                <a href="#">TERMS</a>
            </p>
        </footer>
    );
}
