'use client';

import styles from './scroll.module.css';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BLIND_COUNT = 12;
const NS = 'http://www.w3.org/2000/svg';

const IMAGES = ['/images/scroll-transition/7.webp', '/images/scroll-transition/8.webp', '/images/scroll-transition/9.webp'];

const TEXTS = [
    { h1: ['FIRST', 'IMAGE'], h2: 'Section transition', body: 'Mask images with vertical rectangles that open sequentially on scroll for a smooth transition to the next image.' },
    { h1: ['SECOND', 'IMAGE'], h2: 'Section transition', body: 'Mask images with vertical rectangles that open sequentially on scroll for a smooth transition to the next image.' },
    { h1: ['THIRD', 'IMAGE'], h2: 'Section transition', body: 'Mask images with vertical rectangles that open sequentially on scroll for a smooth transition to the next image.' },
];

type VBlind = { left: SVGRectElement; right: SVGRectElement; x: number; w: number };

export default function VerticalBlinds() {
    const stageRef = useRef<HTMLElement>(null);
    const svgRefs = useRef<(SVGSVGElement | null)[]>([null, null, null]);
    const groupRefs = useRef<(SVGGElement | null)[]>([null, null, null]);
    const textRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
    const fillRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

    useGSAP(() => {
        let master: gsap.core.Timeline | null = null;

        function createBlinds(g: SVGGElement, isFirst: boolean, vbW: number): VBlind[] {
            g.innerHTML = '';
            const slotW = vbW / BLIND_COUNT;
            const blinds: VBlind[] = [];
            let x = 0;

            for (let i = 0; i < BLIND_COUNT; i++) {
                const cx = x + slotW / 2;
                const rL = document.createElementNS(NS, 'rect');
                const rR = document.createElementNS(NS, 'rect');

                for (const r of [rL, rR]) {
                    r.setAttribute('y', '0');
                    r.setAttribute('height', '100');
                    r.setAttribute('width', isFirst ? String(slotW / 2 + 0.1) : '0');
                    r.setAttribute('fill', 'white');
                    r.setAttribute('shape-rendering', 'crispEdges');
                }

                if (isFirst) {
                    rL.setAttribute('x', String(cx - slotW / 2));
                    rR.setAttribute('x', String(cx));
                } else {
                    rL.setAttribute('x', String(cx));
                    rR.setAttribute('x', String(cx));
                }

                g.appendChild(rL);
                g.appendChild(rR);
                blinds.push({ left: rL, right: rR, x: cx, w: slotW / 2 });
                x += slotW;
            }
            return blinds;
        }

        function updateLayout() {
            // Vertical blinds use width/height ratio for vbWidth
            const vbW = (window.innerWidth / window.innerHeight) * 100;
            const vbH = 100;
            const sets: VBlind[][] = [];

            svgRefs.current.forEach((svg, i) => {
                if (!svg) return;
                svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);
                const maskRect = svg.querySelector('mask rect');
                if (maskRect) {
                    maskRect.setAttribute('width', String(vbW));
                    maskRect.setAttribute('height', String(vbH));
                }
                const img = svg.querySelector('image');
                if (img) {
                    img.setAttribute('width', String(vbW));
                    img.setAttribute('height', String(vbH));
                }
                const g = groupRefs.current[i];
                if (g) sets.push(createBlinds(g, i === 0, vbW));
            });

            buildTimeline(sets);
        }

        function openBlinds(blinds: VBlind[]) {
            return gsap.to(
                blinds.flatMap((b) => [b.left, b.right]),
                {
                    attr: {
                        x: (i: number) => {
                            const b = blinds[Math.floor(i / 2)];
                            return i % 2 === 0 ? b.x - b.w : b.x;
                        },
                        width: (i: number) => blinds[Math.floor(i / 2)].w + 0.05,
                    },
                    ease: 'none',
                    stagger: { each: 0.02, from: 'start' },
                },
            );
        }

        function buildTimeline(sets: VBlind[][]) {
            master?.kill();

            const texts = textRefs.current.filter(Boolean) as HTMLDivElement[];

            // First text is visible; others hidden
            gsap.set(texts, { clipPath: 'inset(0% 0% 100% 0%)', y: 40, opacity: 0 });
            if (texts[0]) gsap.set(texts[0], { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1 });

            master = gsap.timeline({
                scrollTrigger: {
                    trigger: stageRef.current,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 2.0,
                    invalidateOnRefresh: true,
                },
            });

            sets.forEach((blinds, i) => {
                if (i === 0) return; // first layer already open

                const prevTxt = texts[i - 1];
                if (prevTxt) {
                    master!.to(prevTxt, { clipPath: 'inset(0% 0% 100% 0%)', y: -40, opacity: 0, duration: 0.8 }, '>');
                }

                master!.add(openBlinds(blinds), '-=0.3');

                const nextTxt = texts[i];
                if (nextTxt) {
                    master!.to(nextTxt, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 0.8 }, '-=0.5');
                }

                master!.to({}, { duration: 1 });
            });
        }

        function initProgressBar() {
            ScrollTrigger.create({
                trigger: stageRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.3,
                onUpdate: (self) => {
                    const n = fillRefs.current.length;
                    fillRefs.current.forEach((fill, i) => {
                        if (!fill) return;
                        const p = Math.max(0, Math.min(1, (self.progress - i / n) * n));
                        fill.style.width = `${p * 100}%`;
                    });
                },
            });
        }

        updateLayout();
        initProgressBar();

        let timer: ReturnType<typeof setTimeout>;
        const onResize = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                updateLayout();
                ScrollTrigger.refresh();
            }, 250);
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            clearTimeout(timer);
        };
    });

    return (
        <div className={styles.root}>
            <nav className={styles.nav}>
                <div className={styles.navLinks}>
                    <Link href="/scroll/1">Horizontal Blinds</Link>
                    <Link href="/scroll/2">Random Grid</Link>
                    <span className={styles.navCurrent}>Vertical Blinds</span>
                    <Link href="/scroll/4">Column Grid</Link>
                </div>
            </nav>

            <div className={styles.spacer}>
                <h1>
                    On-Scroll SVG Mask Transitions
                    <br />
                    <span>(Vertical Blinds)</span>
                </h1>
                <span className={styles.info}>Scroll down</span>
            </div>

            <section ref={stageRef} className={styles.stage}>
                <div className={styles.layers}>
                    {IMAGES.map((src, i) => (
                        <svg
                            key={i}
                            ref={(el) => {
                                svgRefs.current[i] = el;
                            }}
                            className={styles.layer}
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <mask id={`vb-mask-${i}`} maskUnits="userSpaceOnUse">
                                    <rect x="0" y="0" width="100" height="100" fill="black" />
                                    <g
                                        ref={(el) => {
                                            groupRefs.current[i] = el;
                                        }}
                                    />
                                </mask>
                            </defs>
                            <image href={src} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" mask={`url(#vb-mask-${i})`} style={{ filter: 'brightness(0.8)' }} />
                        </svg>
                    ))}

                    <div className={styles.progressBar}>
                        {[0, 1, 2].map((i) => (
                            <div key={i} className={styles.segment}>
                                <div
                                    ref={(el) => {
                                        fillRefs.current[i] = el;
                                    }}
                                    className={styles.fill}
                                />
                            </div>
                        ))}
                    </div>

                    <div className={styles.texts}>
                        {TEXTS.map((t, i) => (
                            <div
                                key={i}
                                ref={(el) => {
                                    textRefs.current[i] = el;
                                }}
                                className={styles.txt}
                            >
                                <h1>
                                    {t.h1[0]}
                                    <br />
                                    {t.h1[1]}
                                </h1>
                                <h2>{t.h2}</h2>
                                <span>{t.body}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className={styles.spacer}>
                <h1>
                    <Link href="/scroll/4">Next: Column Grid →</Link>
                </h1>
            </div>
        </div>
    );
}
