'use client';

import BlockReveal from '@/components/motion-kit/BlockReveal';

import { IMG, STORE_COPY } from '../data';
import { BagIcon, HookArrow } from '../graphics';
import LnImage from '../LnImage';
import { SIGNATURE_SMALL } from '../scribbles';

/*
 * Measured (k_90.0): eyebrow 196,243; headline 196–795 × 300–600 (sans 800 ×2 + serif); body 22px;
 * button 196–387 × 753–805. Photo 960–1660 × top…915; gold card 1543–1920 × 203–520; tees at
 * (0,737,238×210) and (760,806,251×…); gold "EM1" 1305–1545 × 868–968. No parallax (all pieces move
 * with the page — measured 848px for every piece between 90.0 and 94.6s).
 */
export default function Store() {
    return (
        <section id="store" className="ln-store" data-header="light">
            <div className="ln-contours" />
            <div className="ln-st-copy">
                <BlockReveal as="p" className="ln-st-eyebrow" color="#1e1f1a" split={false}>
                    <BagIcon className="ln-st-bag" /> ELLIS STORE
                </BlockReveal>
                <BlockReveal as="h2" className="ln-st-title" color="#1e1f1a" stagger={0.08}>
                    <span className="ln-st-t1">WORLD</span>
                    <br />
                    <span className="ln-st-t1">DRIVERS&apos;</span>
                    <br />
                    <span className="ln-serif ln-st-t2">CHAMPION</span>
                </BlockReveal>
                <BlockReveal as="p" className="ln-st-body" color="#1e1f1a" stagger={0.06}>
                    {STORE_COPY}
                </BlockReveal>
                <a href="#store" className="ln-btn ln-btn--lime ln-st-btn" onClick={(e) => e.preventDefault()}>
                    VISIT THE STORE <HookArrow className="ln-btn-icon" />
                </a>
            </div>

            <div className="ln-st-photo">
                <LnImage src={IMG.back} sizes="(min-width: 1200px) 700px, 50vw" />
            </div>
            <div className="ln-st-gold">
                <span className="ln-st-gold-script">Champion</span>
                <span className="ln-st-gold-sub">COLLECTION</span>
                <svg className="ln-st-gold-sig" viewBox="0 0 160 90" fill="none" aria-hidden="true">
                    {SIGNATURE_SMALL.map((d, k) => (
                        <path key={k} d={d} />
                    ))}
                </svg>
            </div>
            <div className="ln-st-tee-a" aria-hidden="true">
                <svg viewBox="0 0 240 210">
                    <path d="M58 8 88 0C98 14 142 14 152 0L182 8 240 50 214 92 192 80V210H48V80L26 92 0 50Z" fill="#1c1c1c" />
                    <text x="120" y="120" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="58" fill="#d6ad5a">
                        #1
                    </text>
                    <text x="120" y="160" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="30" fill="#d6ad5a">
                        MORROW
                    </text>
                </svg>
            </div>
            <div className="ln-st-tee-b" aria-hidden="true">
                <svg viewBox="0 0 250 300">
                    <rect width="250" height="300" fill="#e7e8ec" />
                    <path d="M60 40 90 30C98 44 152 44 160 30L190 40 240 78 218 112 200 102V300H50V102L32 112 10 78Z" fill="#fafafa" />
                    <rect x="75" y="75" width="100" height="120" fill="#2b2b2b" />
                    <image href={IMG.portraitHelmet} x="60" y="70" width="130" height="130" preserveAspectRatio="xMidYMid slice" />
                </svg>
            </div>
            <div className="ln-st-em1" aria-hidden="true">
                EM1
            </div>
        </section>
    );
}
