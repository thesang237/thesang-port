'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LETTERS = 'We wanna be where the people are'.split('');

export default function TruusHorizontalWords() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const container = sectionRef.current!;
            const textRef = container.querySelector('.horizontal-words__relative') as HTMLElement;
            const letters = container.querySelectorAll('.letter');
            const stickers = container.querySelectorAll('.horizontal-words__sticker-watch, .horizontal-words__sticker-cursor, .horizontal-words__sticker-phone');
            const arrows = container.querySelectorAll('.horizontal-words__arrow-svg path, .horizontal-words__arrow-end-svg path');

            const entranceDistance = window.innerHeight;
            const pinnedDistance = 2500;

            const scrollTween = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top bottom',
                    end: () => `+=${entranceDistance + pinnedDistance}`,
                    scrub: 1,
                    invalidateOnRefresh: true,
                },
            });

            scrollTween
                .fromTo(textRef, { x: window.innerWidth }, { x: window.innerWidth * 0.5, ease: 'none', duration: entranceDistance })
                .to(textRef, { x: () => -(textRef.scrollWidth - window.innerWidth * 0.5), ease: 'none', duration: pinnedDistance });

            ScrollTrigger.create({
                trigger: container,
                start: 'top top',
                end: () => `+=${pinnedDistance}`,
                pin: true,
                pinSpacing: true,
                invalidateOnRefresh: true,
            });

            letters.forEach((letter) => {
                gsap.from(letter, {
                    yPercent: (Math.random() - 0.5) * 500,
                    rotation: (Math.random() - 0.5) * 60,
                    ease: 'elastic.out(1.2, 1)',
                    scrollTrigger: {
                        trigger: letter,
                        containerAnimation: scrollTween,
                        start: 'left 90%',
                        end: 'left 50%',
                        scrub: 0.5,
                    },
                });
            });

            stickers.forEach((sticker) => {
                gsap.from(sticker, {
                    scale: 0,
                    yPercent: (Math.random() - 0.5) * 400,
                    rotation: (Math.random() - 0.5) * 60,
                    ease: 'elastic.out(1.2, 1)',
                    scrollTrigger: {
                        trigger: sticker,
                        containerAnimation: scrollTween,
                        start: 'left 90%',
                        end: 'left 50%',
                        scrub: 0.5,
                    },
                });
            });

            arrows.forEach((arrowPath) => {
                const path = arrowPath as SVGPathElement;
                if (path.getTotalLength) {
                    const pathLen = path.getTotalLength();
                    gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
                    gsap.to(path, {
                        strokeDashoffset: 0,
                        duration: 1,
                        scrollTrigger: {
                            trigger: path.parentElement,
                            containerAnimation: scrollTween,
                            start: 'left 90%',
                            end: 'left 50%',
                            scrub: 0.5,
                        },
                    });
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="horizontal-words-section content-section">
            <div className="horizontal-words__relative">
                <div className="horizontal-words__sticker-svg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 386 127" fill="none" className="horizontal-words__arrow-svg">
                        <path
                            d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L356.5 105.5"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L384 97"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <img src="/truus-assets/assets/HorizontalWords SVG/horizontal-words-sticker-thumps-up.svg" className="horizontal-words__sticker-watch" alt="thumbs up sticker" />
                    <img src="/truus-assets/assets/HorizontalWords SVG/horizontal-words-sticker-cursor.svg" className="horizontal-words__sticker-cursor" alt="cursor sticker" />
                    <img src="/truus-assets/assets/HorizontalWords SVG/horizontal-words-sticker-phone.svg" className="horizontal-words__sticker-phone" alt="phone sticker" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 140 127" fill="none" className="horizontal-words__arrow-end-svg">
                        <path d="M2.03125 2.42188C100.469 2.42188 130.156 52.4219 118.437 125.078L99.6875 107.891" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.03125 2.42188C100.469 2.42188 130.156 52.4219 118.438 125.078L137.969 110.234" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h2 className="display horizontal-words__h2" aria-label="We wanna be where the people are">
                        {LETTERS.map((char, i) =>
                            char === ' ' ? (
                                <span key={i}> </span>
                            ) : (
                                <div key={i} className="letter" aria-hidden="true" style={{ position: 'relative', display: 'inline-block' }}>
                                    {char}
                                </div>
                            ),
                        )}
                    </h2>
                </div>
            </div>
            <div className="horizontal-words__bottom-text">
                <div className="horizontal-words__bottom-text-l">
                    Audiences are more scattered <em>and</em> more reachable
                    <br />
                    than ever. We help brands become leaders on the
                    <br />
                    channels of the new mainstream.
                </div>
            </div>
        </section>
    );
}
