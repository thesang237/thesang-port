'use client';

import { useRef } from 'react';

import BlockReveal from '@/components/motion-kit/BlockReveal';
import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import Marquee from '@/components/motion-kit/Marquee';

import { PARTNERS, PARTNERS_COPY } from '../data';
import { SCRIPT_COLLABS } from '../scribbles';

import { PartnerLogo } from './PartnerLogo';

/*
 * Measured (k_94.6): title at 24,620 (sans 800 76px / serif 76px), body 950,620 (22px), logo marquee y≈935
 * (≈40 px/s leftwards), lime "Collabs" script (≈46px stroke) drawn by scroll behind the title.
 */
export default function Partners() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            gsap.fromTo(
                q('.ln-pt-script path'),
                { drawSVG: '0%' },
                { drawSVG: '100%', ease: 'none', stagger: 0.25, scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom 60%', scrub: 0.6 } },
            );
        },
        { scope: root },
    );

    return (
        <section ref={root} className="ln-partners" data-header="light">
            <svg className="ln-pt-script" viewBox="0 0 1300 560" fill="none" aria-hidden="true">
                {SCRIPT_COLLABS.map((d, i) => (
                    <path key={i} d={d} />
                ))}
            </svg>
            <BlockReveal as="h2" className="ln-pt-title" color="#1e1f1a" stagger={0.08}>
                <span className="ln-pt-t1">PARTNERS</span>
                <br />
                <span className="ln-serif ln-pt-t2">&amp;CAMPAIGNS</span>
            </BlockReveal>
            <BlockReveal as="p" className="ln-pt-body" color="#1e1f1a" stagger={0.06}>
                {PARTNERS_COPY}
            </BlockReveal>
            <Marquee className="ln-pt-marquee" speed={40}>
                {PARTNERS.map((p) => (
                    <PartnerLogo key={p} name={p} />
                ))}
            </Marquee>
        </section>
    );
}
