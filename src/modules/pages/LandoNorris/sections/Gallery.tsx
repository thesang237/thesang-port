'use client';

import { useRef } from 'react';

import BlockReveal, { type BlockRevealHandle } from '@/components/motion-kit/BlockReveal';
import { gsap } from '@/components/motion-kit/gsap';
import HorizontalScroll from '@/components/motion-kit/HorizontalScroll';

import { GALLERY, GALLERY_TRAVEL } from '../data';
import { CheckerFlag } from '../graphics';
import LnImage from '../LnImage';
import { SIGNATURE_SMALL } from '../scribbles';

/*
 * Pinned horizontal gallery. Measured: track starts moving when the section top is ~75 % down the viewport
 * (≈0.93 px sideways per px scrolled), pins for ≈2600px, total travel ≈3144px. Background blends
 * #22281C → #F1F3E8 over the travel with an ease-out (1 − (1 − x)^1.8).
 * Captions / quotes block-reveal when they cross 96 % of the viewport width (horizontal trigger).
 */
const PIN = 2500;
const DARK = [0x22, 0x28, 0x1c];
const LIGHT = [0xf1, 0xf3, 0xe8];

export default function Gallery() {
    const bgRef = useRef<HTMLDivElement>(null);
    const reveals = useRef<Array<{ x: number; y: number; h: BlockRevealHandle | null; done: boolean }>>([]);

    const onUpdate = (_p: number, x: number) => {
        const h = -x;
        const f = 1 - Math.pow(1 - gsap.utils.clamp(0, 1, (h - 700) / 2444), 1.8);
        const c = DARK.map((d, i) => Math.round(d + (LIGHT[i] - d) * f));
        const el = bgRef.current;
        if (el) {
            el.style.backgroundColor = `rgb(${c.join(',')})`;
            el.style.setProperty('--ln-contour', f > 0.5 ? `rgba(0,0,0,${(0.13 * f).toFixed(3)})` : 'rgba(255,255,255,0.05)');
            el.style.setProperty('--g-ink', f > 0.45 ? '#2a2b25' : '#d9ddd0');
        }
        if (el) el.dataset.header = f > 0.4 ? 'light' : 'dark';
        const vw = window.innerWidth;
        const top = el?.getBoundingClientRect().top ?? 0;
        reveals.current.forEach((r) => {
            if (!r.done && r.h && r.x + x < vw * 0.96 && top + r.y < window.innerHeight * 0.92) {
                r.done = true;
                r.h.play();
            }
        });
    };

    const reg = (i: number, x: number, y: number) => (h: BlockRevealHandle | null) => {
        reveals.current[i] = { x, y, h, done: reveals.current[i]?.done ?? false };
    };

    return (
        <div ref={bgRef} className="ln-gallery-bg" data-header="dark">
            <div className="ln-contours" />
            <HorizontalScroll id="ln-gallery" className="ln-gallery" trackClassName="ln-gallery-track" travel={GALLERY_TRAVEL} pinDistance={PIN} moveStart="top 50%" scrub={0.15} onUpdate={onUpdate}>
                {GALLERY.map((it, i) => {
                    const style = { left: it.x, top: it.y, width: it.w, height: it.kind === 'quote' ? undefined : it.h };
                    if (it.kind === 'quote')
                        return (
                            <div key={i} className="ln-g-quote" style={style} data-depth={it.depth}>
                                <BlockReveal as="p" className="ln-g-quote-text" trigger="manual" stagger={0.07} ref={reg(i, it.x, it.y)}>
                                    {it.text?.map(([t, em], k) => (em ? <b key={k}>{t}</b> : <span key={k}>{t}</span>))}
                                </BlockReveal>
                                <svg className="ln-g-sig" viewBox="0 0 160 90" fill="none" aria-hidden="true">
                                    {SIGNATURE_SMALL.map((d, k) => (
                                        <path key={k} d={d} />
                                    ))}
                                </svg>
                            </div>
                        );
                    if (it.kind === 'chip')
                        return (
                            <div key={i} className="ln-g-chip" style={style} data-depth={it.depth}>
                                <span>1</span>
                                <CheckerFlag className="ln-g-chip-flag" />
                            </div>
                        );
                    return (
                        <figure key={i} className="ln-g-item" style={style} data-depth={it.depth} data-tone={it.tone} data-dark={it.dark ? '1' : '0'}>
                            <BlockReveal as="figcaption" className="ln-g-cap" trigger="manual" split={false} ref={reg(i, it.x, it.y)}>
                                {it.caption}
                            </BlockReveal>
                            <div className="ln-g-frame">
                                <LnImage src={it.src ?? ''} sizes="(min-width: 1200px) 700px, 60vw" style={{ objectPosition: it.pos, transform: `scale(${it.zoom ?? 1})`, transformOrigin: it.pos }} />
                            </div>
                        </figure>
                    );
                })}
            </HorizontalScroll>
        </div>
    );
}
