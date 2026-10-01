'use client';

import { type MouseEvent, useRef } from 'react';

import BlockReveal from '@/components/motion-kit/BlockReveal';
import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import { TransitionLink } from '@/components/motion-kit/PageTransition';

import { IMG, ON_OFF } from '../data';
import { LoopArrow, ReturnArrow } from '../graphics';
import LnImage from '../LnImage';
import { SCRIPT_ON } from '../scribbles';

/*
 * Measured (k_64.4): left block right-aligned to x=912, right block from x=1008; "ON"/"OFF" serif over
 * heavy "TRACK" (cap 88px); body 22px; lime 66px buttons at y 650. Helmet enters from the left edge and
 * the profile from the right while the section scrolls in (57.0–58.4s). Section then holds while the
 * helmets photo slides over it.
 */
export default function OnOffTrack() {
    const root = useRef<HTMLElement>(null);
    const tip = useRef<HTMLSpanElement>(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            gsap.fromTo(q('.ln-oo-left'), { x: -520 }, { x: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top top', scrub: 0.6 } });
            gsap.fromTo(q('.ln-oo-right'), { x: 520 }, { x: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top top', scrub: 0.6 } });
            gsap.fromTo(
                q('.ln-oo-script path'),
                { drawSVG: '0%' },
                { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut', stagger: 0.18, scrollTrigger: { trigger: root.current, start: 'top 35%', once: true } },
            );
            // hold while the next section slides over
            gsap.timeline({
                scrollTrigger: {
                    id: 'ln-onoff',
                    trigger: root.current,
                    start: 'top top',
                    end: '+=100%',
                    pin: true,
                    pinSpacing: false,
                },
            });
        },
        { scope: root },
    );

    const moveTip = (e: MouseEvent<HTMLElement>, label: string) => {
        const t = tip.current;
        const box = root.current?.getBoundingClientRect();
        if (!t || !box) return;
        t.textContent = label;
        gsap.to(t, { x: e.clientX - box.left + 14, y: e.clientY - box.top + 12, autoAlpha: 1, duration: 0.25, ease: 'power3.out' });
    };
    const hideTip = () => gsap.to(tip.current, { autoAlpha: 0, duration: 0.2 });

    return (
        <section ref={root} className="ln-onoff" data-header="light">
            <div className="ln-contours" />
            {/* driver in profile wearing the helmet: mirrored bust + mirrored helmet render composited */}
            <div className="ln-oo-left">
                <LnImage className="ln-oo-left-bust" src={IMG.profile} sizes="980px" />
                <LnImage className="ln-oo-left-helmet" src={IMG.helmet} sizes="980px" />
            </div>
            <div className="ln-oo-right">
                <LnImage src={IMG.profile} sizes="1200px" />
            </div>

            {ON_OFF.map((b, i) => (
                <div key={b.top} className={`ln-oo-block ln-oo-block--${b.align}`}>
                    <BlockReveal as="h3" className="ln-oo-title" color="#1e1f1a" stagger={0.08} start="top 80%">
                        <span className="ln-serif ln-oo-top">{b.top}</span>
                        <br />
                        <span className="ln-oo-bottom">{b.bottom}</span>
                    </BlockReveal>
                    {i === 0 && (
                        <svg className="ln-oo-script" viewBox="0 0 300 200" fill="none" aria-hidden="true">
                            {SCRIPT_ON.map((d, k) => (
                                <path key={k} d={d} />
                            ))}
                        </svg>
                    )}
                    <BlockReveal as="p" className="ln-oo-body" color="#1e1f1a" stagger={0.06} start="top 85%">
                        {b.body}
                    </BlockReveal>
                    <TransitionLink href={b.href} className="ln-oo-btn" aria-label={b.tip} onMouseMove={(e) => moveTip(e, b.tip)} onMouseLeave={hideTip}>
                        {i === 0 ? <ReturnArrow /> : <LoopArrow />}
                    </TransitionLink>
                </div>
            ))}
            <span ref={tip} className="ln-oo-tip" aria-hidden="true" />
        </section>
    );
}
