'use client';

import styles from './bento.module.css';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip);

const IMAGES = [
    'https://assets.codepen.io/16327/portrait-pattern-1.jpg',
    'https://assets.codepen.io/16327/portrait-image-12.jpg',
    'https://assets.codepen.io/16327/portrait-image-8.jpg',
    'https://assets.codepen.io/16327/portrait-pattern-2.jpg',
    'https://assets.codepen.io/16327/portrait-image-4.jpg',
    'https://assets.codepen.io/16327/portrait-image-3.jpg',
    'https://assets.codepen.io/16327/portrait-pattern-3.jpg',
    'https://assets.codepen.io/16327/portrait-image-1.jpg',
];

const LOREM =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export default function BentoPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const galleryRef = useRef<HTMLDivElement>(null);
    const [resizeCount, setResizeCount] = useState(0);

    useEffect(() => {
        const onResize = () => setResizeCount((c) => c + 1);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useGSAP(
        () => {
            const gallery = galleryRef.current;
            if (!gallery) return;

            const items = gallery.querySelectorAll<HTMLElement>(`.${styles.galleryItem}`);

            // Reset to initial state before re-setup (important on resize)
            gallery.classList.remove(styles.galleryFinal);
            gsap.set(items, { clearProps: 'all' });

            // Capture the final (expanded) layout positions
            gallery.classList.add(styles.galleryFinal);
            const flipState = Flip.getState(items);
            gallery.classList.remove(styles.galleryFinal);

            const flip = Flip.to(flipState, {
                simple: true,
                ease: 'expoScale(1, 5)',
            });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: gallery,
                    start: 'center center',
                    end: '+=100%',
                    scrub: true,
                    pin: gallery.parentElement,
                },
            });
            tl.add(flip);

            return () => gsap.set(items, { clearProps: 'all' });
        },
        { scope: containerRef, dependencies: [resizeCount] },
    );

    return (
        <div ref={containerRef}>
            <div className={styles.galleryWrap}>
                <div ref={galleryRef} className={`${styles.gallery} ${styles.galleryBento}`}>
                    {IMAGES.map((src, i) => (
                        <div key={i} className={styles.galleryItem}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" />
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h2>{'Here is some content'}</h2>
                {Array.from({ length: 8 }, (_, i) => (
                    <p key={i}>{LOREM}</p>
                ))}
            </div>
        </div>
    );
}
