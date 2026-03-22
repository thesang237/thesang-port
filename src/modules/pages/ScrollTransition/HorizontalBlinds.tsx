'use client';

import styles from './scroll.module.css';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BLIND_COUNT = 30;
const NS = 'http://www.w3.org/2000/svg';

const IMAGES = ['/images/scroll-transition/1.webp', '/images/scroll-transition/2.webp', '/images/scroll-transition/3.webp'];

const TEXTS = [
    { h1: ['FIRST', 'IMAGE'], h2: 'Section transition', body: 'Mask images with horizontal rectangles that open sequentially on scroll for a smooth transition to the next image.' },
    { h1: ['SECOND', 'IMAGE'], h2: 'Section transition', body: 'Mask images with horizontal rectangles that open sequentially on scroll for a smooth transition to the next image.' },
    { h1: ['THIRD', 'IMAGE'], h2: 'Section transition', body: 'Mask images with horizontal rectangles that open sequentially on scroll for a smooth transition to the next image.' },
];

type Blind = { top: SVGRectElement; bottom: SVGRectElement; y: number; h: number };

export default function HorizontalBlinds() {
    const stageRef = useRef<HTMLElement>(null);
    const svgRefs = useRef<(SVGSVGElement | null)[]>([null, null, null]);
    const groupRefs = useRef<(SVGGElement | null)[]>([null, null, null]);
    const textRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
    const fillRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

    useGSAP(() => {
        let master: gsap.core.Timeline | null = null;

        function createBlinds(g: SVGGElement): Blind[] {
            g.innerHTML = '';
            const w = window.innerWidth;
            const h = window.innerHeight;
            const vbH = (h / w) * 100;
            const slotH = vbH / BLIND_COUNT;
            const blinds: Blind[] = [];
            let y = 0;

            for (let i = 0; i < BLIND_COUNT; i++) {
                const cy = vbH - (y + slotH / 2);
                const rTop = document.createElementNS(NS, 'rect');
                const rBot = document.createElementNS(NS, 'rect');

                for (const r of [rTop, rBot]) {
                    r.setAttribute('x', '0');
                    r.setAttribute('width', '100');
                    r.setAttribute('height', '0');
                    r.setAttribute('fill', 'white');
                    r.setAttribute('shape-rendering', 'crispEdges');
                }
                rTop.setAttribute('y', String(cy));
                rBot.setAttribute('y', String(cy));
                g.appendChild(rTop);
                g.appendChild(rBot);
                blinds.push({ top: rTop, bottom: rBot, y: cy, h: slotH / 2 });
                y += slotH;
            }
            return blinds;
        }

        function updateLayout() {
            const vbW = 100;
            const vbH = (window.innerHeight / window.innerWidth) * 100;
            const sets: Blind[][] = [];

            svgRefs.current.forEach((svg, i) => {
                if (!svg) return;
                svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);
                svg.querySelector('mask rect')?.setAttribute('height', String(vbH));
                svg.querySelector('mask rect')?.setAttribute('width', String(vbW));
                const img = svg.querySelector('image');
                if (img) {
                    img.setAttribute('width', String(vbW));
                    img.setAttribute('height', String(vbH));
                }
                const g = groupRefs.current[i];
                if (g) sets.push(createBlinds(g));
            });

            buildTimeline(sets);
        }

        function openBlinds(blinds: Blind[]) {
            return gsap.timeline().to(
                blinds.flatMap((b) => [b.top, b.bottom]),
                {
                    attr: {
                        y: (i: number) => {
                            const b = blinds[Math.floor(i / 2)];
                            return i % 2 === 0 ? b.y - b.h : b.y;
                        },
                        height: (i: number) => blinds[Math.floor(i / 2)].h + 0.01,
                    },
                    ease: 'power3.out',
                    stagger: { each: 0.02, from: 'start' },
                },
            );
        }

        function textIn(el: HTMLDivElement) {
            return gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.5, ease: 'expo.out' });
        }

        function textOut(el: HTMLDivElement) {
            return gsap.to(el, { clipPath: 'inset(0% 0% 100% 0%)', y: -30, duration: 1.2, ease: 'power2.inOut' });
        }

        function buildTimeline(sets: Blind[][]) {
            master?.kill();
            master = gsap.timeline({
                scrollTrigger: {
                    trigger: stageRef.current,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 2.5,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                },
            });

            sets.forEach((blinds, i) => {
                master!.add(openBlinds(blinds));
                const txt = textRefs.current[i];
                if (txt) {
                    master!.add(textIn(txt), '-=0.3');
                    master!.add(textOut(txt), '+=0.8');
                }
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
            timer = setTimeout(updateLayout, 250);
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
                    <span className={styles.navCurrent}>Horizontal Blinds</span>
                    <Link href="/scroll/2">Random Grid</Link>
                    <Link href="/scroll/3">Vertical Blinds</Link>
                    <Link href="/scroll/4">Column Grid</Link>
                </div>
            </nav>

            <div className={styles.spacer}>
                <h1>
                    On-Scroll SVG Mask Transitions
                    <br />
                    <span>(Horizontal Blinds)</span>
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
                                <mask id={`h-mask-${i}`} maskUnits="userSpaceOnUse">
                                    <rect x="0" y="0" width="100" height="100" fill="black" />
                                    <g
                                        ref={(el) => {
                                            groupRefs.current[i] = el;
                                        }}
                                    />
                                </mask>
                            </defs>
                            <image href={src} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" mask={`url(#h-mask-${i})`} style={{ filter: 'brightness(0.8)' }} />
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
                    <Link href="/scroll/2">Next: Random Grid →</Link>
                </h1>
            </div>
        </div>
    );
}
