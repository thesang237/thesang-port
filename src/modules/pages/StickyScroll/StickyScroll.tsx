'use client';

import styles from './StickyScroll.module.css';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GALLERY_IMAGES = Array.from({ length: 12 }, (_, i) => `/sticky-scroll/${i + 1}.webp`);
const NUM_COLUMNS = 3;

export default function StickyScroll() {
    const containerRef = useRef<HTMLDivElement>(null);

    const blockRef = useRef<HTMLElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const buttonRef = useRef<HTMLAnchorElement>(null);
    const gridRef = useRef<HTMLUListElement>(null);
    const itemRefs = useRef<HTMLLIElement[]>([]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Sync ScrollTrigger to Lenis scroll events (not native scroll events).
    // Without this, GSAP may read window.scrollY before Lenis has committed the
    // new position, causing a 1-frame mismatch that makes the title jitter.
    useLenis(() => {
        ScrollTrigger.update();
    });

    // Robust image preload: handles already-cached images (onLoad won't fire for those)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
        let remaining = imgs.length;

        if (remaining === 0) {
            setTimeout(() => setIsLoaded(true), 0);
            return;
        }

        function onDone() {
            remaining -= 1;
            if (remaining <= 0) setIsLoaded(true);
        }

        imgs.forEach((img) => {
            if (img.complete) {
                onDone();
            } else {
                img.addEventListener('load', onDone, { once: true });
                img.addEventListener('error', onDone, { once: true }); // don't block on broken images
            }
        });
    }, []);

    useGSAP(
        () => {
            if (!isLoaded) return;

            // Match original: disable GSAP lag smoothing so scroll-driven
            // transforms don't drift between ticks under load.
            gsap.ticker.lagSmoothing(0);

            const block = blockRef.current;
            const wrapper = wrapperRef.current;
            const content = contentRef.current;
            const title = titleRef.current;
            const description = descriptionRef.current;
            const button = buttonRef.current;
            const grid = gridRef.current;
            const items = itemRefs.current.filter(Boolean);

            if (!block || !wrapper || !content || !title || !description || !button || !grid || items.length === 0) return;

            // ── Group items into columns ──────────────────────────────
            const columns: HTMLLIElement[][] = Array.from({ length: NUM_COLUMNS }, () => []);
            items.forEach((item, index) => {
                columns[index % NUM_COLUMNS].push(item);
            });

            // ── Init content state ────────────────────────────────────
            gsap.set([description, button], { opacity: 0, pointerEvents: 'none' });

            const dy = (content.offsetHeight - title.offsetHeight) / 2;
            const titleOffsetY = (dy / content.offsetHeight) * 100;
            gsap.set(title, { yPercent: titleOffsetY });

            // ── Parallax on wrapper entry ─────────────────────────────
            // immediateRender: false — let the scrub set the initial position
            // from the actual scroll value rather than snapping to yPercent:-100
            // first, which would flash the wrapper above the viewport.
            gsap.from(wrapper, {
                yPercent: -100,
                ease: 'none',
                immediateRender: false,
                scrollTrigger: {
                    trigger: block,
                    start: 'top bottom',
                    end: 'top top',
                    scrub: true,
                },
            });

            // ── Title fade-in on scroll ───────────────────────────────
            gsap.from(title, {
                opacity: 0,
                duration: 0.7,
                ease: 'power1.out',
                scrollTrigger: {
                    trigger: block,
                    start: 'top 57%',
                    toggleActions: 'play none none reset',
                },
            });

            // ── Grid reveal: columns enter from alternating directions ─
            function gridRevealTimeline() {
                const tl = gsap.timeline();
                const wh = window.innerHeight;
                const gridDy = wh - (wh - grid!.offsetHeight) / 2;

                columns.forEach((column, colIndex) => {
                    const fromTop = colIndex % 2 === 0;
                    tl.from(
                        column,
                        {
                            y: gridDy * (fromTop ? -1 : 1),
                            stagger: {
                                each: 0.06,
                                from: fromTop ? 'end' : 'start',
                            },
                            ease: 'power1.inOut',
                        },
                        'grid-reveal',
                    );
                });

                return tl;
            }

            // ── Grid zoom: scale + lateral column separation ──────────
            function gridZoomTimeline() {
                const tl = gsap.timeline({ defaults: { duration: 1, ease: 'power3.inOut' } });

                tl.to(grid, { scale: 2.05 });
                tl.to(columns[0], { xPercent: -40 }, '<');
                tl.to(columns[2], { xPercent: 40 }, '<');
                tl.to(
                    columns[1],
                    {
                        yPercent: (index) => (index < Math.floor(columns[1].length / 2) ? -1 : 1) * 40,
                        duration: 0.5,
                        ease: 'power1.inOut',
                    },
                    '-=0.5',
                );

                return tl;
            }

            // ── Toggle content visibility ─────────────────────────────
            function toggleContent(isVisible: boolean) {
                gsap.timeline({ defaults: { overwrite: true } })
                    .to(title, {
                        yPercent: isVisible ? 0 : titleOffsetY,
                        duration: 0.7,
                        ease: 'power2.inOut',
                    })
                    .to(
                        [description, button],
                        {
                            opacity: isVisible ? 1 : 0,
                            duration: 0.4,
                            ease: `power1.${isVisible ? 'inOut' : 'out'}`,
                            pointerEvents: isVisible ? 'all' : 'none',
                        },
                        isVisible ? '-=90%' : '<',
                    );
            }

            // ── Master scroll-driven timeline ─────────────────────────
            const mainTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: block,
                    start: 'top 25%',
                    end: 'bottom bottom',
                    scrub: true,
                },
            });

            mainTimeline
                .add(gridRevealTimeline())
                .add(gridZoomTimeline(), '-=0.6')
                .add(() => toggleContent(mainTimeline.scrollTrigger!.direction === 1), '-=0.32');

            // Recalculate all scroll positions after setup
            ScrollTrigger.refresh();
        },
        { scope: containerRef, dependencies: [isLoaded] },
    );

    return (
        <div ref={containerRef} className={`${styles.root} ${isLoaded ? '' : styles.loading}`}>
            {/* ── Fixed frame header ───────────────────────────────── */}
            <header className={styles.frame}>
                <div className={styles.frameInfos}>
                    <h1>Sticky Grid Scroll</h1>
                    <a href="https://tympanus.net/codrops/?p=106424" target="_blank" rel="noopener noreferrer">
                        Tutorial
                    </a>
                    <a href="https://github.com/theoplawinski/codrops-sticky-grid-scroll" target="_blank" rel="noopener noreferrer">
                        GitHub
                    </a>
                </div>
                <nav className={styles.frameTags}>
                    <a href="https://tympanus.net/codrops/hub/tag/gsap/">#gsap</a>
                    <a href="https://tympanus.net/codrops/hub/tag/sticky/">#sticky</a>
                    <a href="https://tympanus.net/codrops/hub/tag/gris/">#grid</a>
                    <a href="https://tympanus.net/codrops/hub/tag/scroll/">#scroll</a>
                </nav>
                <p className={styles.frameAuthor}>
                    By{' '}
                    <a href="https://theoplawinski.com/?utm_source=codrops&utm_medium=tutorial&utm_campaign=sticky-grid-scroll" target="_blank" rel="noopener noreferrer">
                        Theo Plawinski
                    </a>
                    {' · '}
                    <Link href="/sticky-scroll/learn" style={{ opacity: 1, pointerEvents: 'auto' }}>
                        Learn how →
                    </Link>
                </p>
            </header>

            <main>
                {/* ── Intro: hero image ────────────────────────────── */}
                <section className={styles.blockIntro}>
                    <figure className={styles.media}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className={styles.mediaImage} src="/sticky-scroll/8.webp" alt="Scroll-driven layout experiment" />
                        <figcaption className={styles.mediaCaption}>Scroll-driven layout experiment</figcaption>
                    </figure>
                </section>

                {/* ── Main: sticky grid ────────────────────────────── */}
                <section ref={blockRef} className={styles.blockMain}>
                    <div ref={wrapperRef} className={styles.blockWrapper}>
                        {/* Content overlay */}
                        <div ref={contentRef} className={styles.content}>
                            <h2 ref={titleRef} className={styles.contentTitle}>
                                Sticky Grid Scroll
                            </h2>
                            <p ref={descriptionRef} className={styles.contentDescription}>
                                A structured scroll-driven image grid where movement unfolds progressively within a sticky layout.
                            </p>
                            <a ref={buttonRef} className={styles.contentButton} href="https://tympanus.net/codrops/?p=106424" target="_blank" rel="noopener noreferrer">
                                Read the tutorial
                            </a>
                        </div>

                        {/* Gallery grid */}
                        <div className={styles.gallery}>
                            <ul ref={gridRef} className={styles.galleryGrid}>
                                {GALLERY_IMAGES.map((src, i) => (
                                    <li
                                        key={i}
                                        ref={(el) => {
                                            if (el) itemRefs.current[i] = el;
                                        }}
                                        className={styles.galleryItem}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img className={styles.galleryImage} src={src} alt={`Image ${i + 1}`} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
