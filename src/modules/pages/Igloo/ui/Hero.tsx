'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

import { MANIFESTO } from '../data';
import { useIglooUI } from '../store';

import { scrambleIn } from './scramble';

/** Hero copy. The wrapper (.ig-hero) is driven by the scroll timeline; the
 *  lines inside are revealed once, when the intro lands. */
export default function Hero() {
    const root = useRef<HTMLDivElement>(null);
    const introDone = useIglooUI((s) => s.introDone);

    useGSAP(
        () => {
            if (!introDone) return;
            const q = gsap.utils.selector(root);
            const tl = gsap.timeline();
            q('[data-scramble]').forEach((el, i) => {
                tl.add(scrambleIn(el)!, i * 0.12);
            });

            const split = SplitText.create(q('.ig-manifesto')[0], { type: 'lines', mask: 'lines', linesClass: 'ig-line' });
            tl.from(split.lines, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.07 }, 0.25);
            split.lines.forEach((line, i) => {
                tl.add(scrambleIn(line, { duration: 0.8 })!, 0.25 + i * 0.07);
            });
            tl.fromTo(q('.ig-hint-bar'), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, 0.6);
            return () => split.revert();
        },
        { scope: root, dependencies: [introDone] },
    );

    return (
        <div ref={root} className="ig-hero pointer-events-none fixed inset-0 z-10 select-none">
            <div className="absolute left-[var(--ig-gutter)] top-[calc(var(--ig-gutter)+56px)] space-y-4 text-[11px] leading-[1.35] sm:text-xs">
                <p data-scramble data-text="// Copyright © 2026" className="opacity-0" />
                <p className="flex flex-col">
                    <span data-scramble data-text="Igloo, Inc." className="opacity-0" />
                    <span data-scramble data-text="All Rights Reserved." className="opacity-0" />
                </p>
            </div>

            <div className="absolute right-[var(--ig-gutter)] top-[calc(var(--ig-gutter)+52px)] w-[15ch] text-right text-[11px] leading-[1.25] sm:w-[17ch] sm:text-xs">
                <p data-scramble data-text="////// Manifesto" className="mb-4 opacity-0" />
                <p className="ig-manifesto" style={{ visibility: introDone ? 'visible' : 'hidden' }}>
                    {MANIFESTO}
                </p>
            </div>

            <div className="absolute bottom-[calc(var(--ig-gutter)+30px)] left-[var(--ig-gutter)] text-[11px] leading-[1.25] sm:text-xs">
                <p data-scramble data-text="Scroll down to" className="opacity-0" />
                <p data-scramble data-text="discover." className="opacity-0" />
                <span className="ig-hint-bar mt-2 block h-px w-16 origin-left bg-current" />
            </div>
        </div>
    );
}
