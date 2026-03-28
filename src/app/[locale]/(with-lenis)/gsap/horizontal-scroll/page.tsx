'use client';

import styles from './horizontal-scroll.module.css';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const IMAGES = Array.from({ length: 8 }, (_, i) => `https://assets.codepen.io/16327/portrait-image-${i + 1}.jpg`);

export default function HorizontalScrollPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const stripRef = useRef<HTMLDivElement>(null);

    // Sync ScrollTrigger to Lenis scroll events
    useLenis(() => {
        ScrollTrigger.update();
    });

    useGSAP(
        () => {
            const wrapper = wrapperRef.current!;
            const strip = stripRef.current!;

            gsap.to(strip, {
                x: () => -(strip.scrollWidth - window.innerWidth),
                ease: 'none',
                scrollTrigger: {
                    trigger: wrapper,
                    pin: true,
                    scrub: true,
                    start: 'center center',
                    end: () => `+=${strip.scrollWidth}`,
                    invalidateOnRefresh: true,
                },
            });

            ScrollTrigger.refresh();
        },
        { scope: containerRef },
    );

    return (
        <div ref={containerRef}>
            <section className={styles.panel}>
                <h3>{'Scroll down for the Gallery'}</h3>
            </section>

            <section className={styles.portfolio}>
                <div className={styles.containerFluid}>
                    <div ref={wrapperRef} className={styles.horizGalleryWrapper}>
                        <div ref={stripRef} className={styles.horizGalleryStrip}>
                            {IMAGES.map((src, i) => (
                                <div key={i} className={styles.projectWrap}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.panel}>
                <h3>{"That's it!"}</h3>
            </section>
        </div>
    );
}
