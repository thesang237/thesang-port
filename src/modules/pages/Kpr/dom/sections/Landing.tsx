'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '@/components/motion-kit/gsap';

import { LANDING } from '../../data/copy';
import { onFrame } from '../../scroll/frame';
import { seg, W } from '../../scroll/timeline';
import { film } from '../../scroll/useScrollStore';
import { Chevron } from '../icons';
import { actWatcher, buildReveal, EASE_OUT } from '../ui/reveal';
import { Hacky, scrambleInto } from '../ui/Text';

/** Landing: body copy top-left, three huge staggered words, scroll hint. Text over the hero painting. */
export default function Landing() {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const root = ref.current!;
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const words = root.querySelectorAll<HTMLElement>('.kpr-landing__word');
            const tl = gsap.timeline({ paused: true, defaults: { ease: EASE_OUT } });
            // words slide in from the left (as the reference: translate(-320px) + opacity), then the rest
            if (reduced) tl.fromTo(words, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.16, ease: 'none' }, 0);
            else tl.fromTo(words, { autoAlpha: 0, x: () => -Math.min(320, window.innerWidth * 0.17) }, { autoAlpha: 1, x: 0, duration: 1.1, stagger: 0.09 }, 0.1);
            buildReveal(root, scrambleInto, tl);
            const watch = actWatcher(root, [-1, W.landingText[1] + 0.25], tl);
            const fadeEl = root.querySelector<HTMLElement>('.kpr-landing__fade')!;
            const off = onFrame(() => {
                watch();
                const k = seg(film.view, W.landingText);
                fadeEl.style.opacity = String(1 - k);
                fadeEl.style.transform = `translate3d(${-k * 40}px, 0, 0)`;
            });
            return () => {
                off();
                tl.kill();
            };
        },
        { scope: ref },
    );

    return (
        <section ref={ref} className="kpr-sec kpr-landing" aria-label="Introduction">
            <div className="kpr-landing__fade">
                <p className="kpr-landing__body kpr-body1" data-r="fade" data-d="0.5">
                    {LANDING.body}
                </p>
                <div className="kpr-landing__titles">
                    <h1 className="kpr-sr">{LANDING.words.map((w) => `${w.word}.`).join(' ')}</h1>
                    {LANDING.words.map((w, i) => (
                        <div key={w.word} className={`kpr-landing__word is-${i}`} aria-hidden="true">
                            <span className="kpr-landing__sub">{w.sub}</span>
                            {w.word}
                            <span className="kpr-landing__dot">.</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="kpr-scrollhint kpr-cap3" data-r="fade" data-d="0.9">
                <Hacky text={LANDING.scroll} reveal={false} />
                <Chevron className="kpr-scrollhint__icon" />
            </div>
        </section>
    );
}
