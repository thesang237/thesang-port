'use client';

import { useRef } from 'react';

import BlockReveal from '@/components/motion-kit/BlockReveal';
import { gsap, useGSAP } from '@/components/motion-kit/gsap';

import { IMG, SOCIALS } from '../data';
import LnImage from '../LnImage';

/*
 * Measured (95.6–103s): centre card (354 wide, r≈60) rises from the bottom; once it is ~60 % up the six
 * side cards fan out from behind it (≈0.6s, centre-out). Title WHAT'S UP / ON SOCIALS block-reveals.
 * Follow line serif 40px + 4 links; lime glow grows at the bottom toward the footer.
 */
const CARDS = [
    { src: IMG.scene, pos: '70% 40%', x: -575, y: 150, r: -17 },
    { src: IMG.portraitHelmet, pos: '50% 30%', x: -415, y: 60, r: -10 },
    { src: IMG.portrait, pos: '40% 30%', x: -222, y: 18, r: -4 },
    { src: IMG.profile, pos: '50% 30%', x: 222, y: 18, r: 4 },
    { src: IMG.helmet, pos: '50% 50%', x: 415, y: 60, r: 10 },
    { src: IMG.back, pos: '50% 20%', x: 575, y: 150, r: 17 },
];

export default function Socials() {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const q = gsap.utils.selector(root);
            const side = q('.ln-so-card:not(.ln-so-card--main)');
            gsap.set(side, { x: 0, y: 30, rotation: 0 });
            gsap.timeline({ scrollTrigger: { trigger: q('.ln-so-fan')[0], start: 'top 62%', toggleActions: 'play none none reverse' } }).to(side, {
                x: (i) => CARDS[i].x,
                y: (i) => CARDS[i].y,
                rotation: (i) => CARDS[i].r,
                duration: 0.7,
                ease: 'power3.out',
                stagger: { each: 0.04, from: 'center' },
            });
            gsap.fromTo(q('.ln-so-icon'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', scrollTrigger: { trigger: q('.ln-so-icon')[0], start: 'top 90%' } });
        },
        { scope: root },
    );

    return (
        <section ref={root} className="ln-socials" data-header="light">
            <svg className="ln-so-icon" viewBox="0 0 60 70" fill="none" stroke="#8b8d84" strokeWidth={1.4} aria-hidden="true">
                <ellipse cx="28" cy="26" rx="20" ry="22" />
                {Array.from({ length: 5 }).map((_, r) => Array.from({ length: 5 }).map((__, c) => <circle key={`${r}${c}`} cx={14 + c * 7} cy={12 + r * 7} r={1.4} fill="#8b8d84" stroke="none" />))}
                <path d="M36 46 50 66M40 44l14 20" />
            </svg>
            <BlockReveal as="h2" className="ln-so-title" color="#1e1f1a" stagger={0.08}>
                <span className="ln-so-t1">WHAT&apos;S UP</span>
                <br />
                <span className="ln-serif ln-so-t2">ON SOCIALS</span>
            </BlockReveal>

            <div className="ln-so-fan">
                {CARDS.map((c, i) => (
                    <div key={i} className="ln-so-card" style={{ zIndex: 3 - Math.abs(i < 3 ? i - 3 : i - 2) }}>
                        <LnImage src={c.src} sizes="360px" style={{ objectPosition: c.pos }} />
                    </div>
                ))}
                <div className="ln-so-card ln-so-card--main">
                    <LnImage src={IMG.scene} sizes="360px" style={{ objectPosition: '42% 50%' }} />
                </div>
            </div>

            <BlockReveal as="p" className="ln-so-follow ln-serif" color="#1e1f1a" split={false}>
                Follow Ellis on social media
            </BlockReveal>
            <div className="ln-so-links">
                {SOCIALS.map((s, i) => (
                    <BlockReveal key={s} as="span" color="#1e1f1a" split={false} delay={0.05 * i}>
                        {s}
                    </BlockReveal>
                ))}
            </div>
        </section>
    );
}
