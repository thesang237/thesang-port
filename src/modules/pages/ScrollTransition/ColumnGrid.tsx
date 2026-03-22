'use client';

import styles from './scroll.module.css';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const NS = 'http://www.w3.org/2000/svg';

const IMAGES = ['/images/scroll-transition/10.webp', '/images/scroll-transition/1.webp', '/images/scroll-transition/2.webp'];

const TEXTS = [
    { h1: ['FIRST', 'IMAGE'], h2: 'Section transition', body: 'Mask images with a grid that opens column by column (left to right), with random ordering within each column.' },
    { h1: ['SECOND', 'IMAGE'], h2: 'Section transition', body: 'Mask images with a grid that opens column by column (left to right), with random ordering within each column.' },
    { h1: ['THIRD', 'IMAGE'], h2: 'Section transition', body: 'Mask images with a grid that opens column by column (left to right), with random ordering within each column.' },
];

function getGridCols() {
    if (window.innerWidth <= 599) return 6;
    if (window.innerWidth <= 1024) return 10;
    return 14;
}

type GridData = { cells: SVGRectElement[]; rows: number; cols: number };

export default function ColumnGrid() {
    const stageRef = useRef<HTMLElement>(null);
    const svgRefs = useRef<(SVGSVGElement | null)[]>([null, null, null]);
    const groupRefs = useRef<(SVGGElement | null)[]>([null, null, null]);
    const textRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
    const fillRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

    useGSAP(() => {
        let master: gsap.core.Timeline | null = null;

        function createGrid(g: SVGGElement): GridData {
            g.innerHTML = '';
            const vbW = 100;
            const vbH = (window.innerHeight / window.innerWidth) * 100;
            const cols = getGridCols();
            const rows = Math.round(cols * (vbH / vbW));
            const cW = vbW / cols;
            const cH = vbH / rows;
            const cells: SVGRectElement[] = [];

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const r = document.createElementNS(NS, 'rect');
                    r.setAttribute('x', String(x * cW));
                    r.setAttribute('y', String(y * cH));
                    r.setAttribute('width', String(cW));
                    r.setAttribute('height', String(cH));
                    r.setAttribute('fill', 'white');
                    r.setAttribute('shape-rendering', 'crispEdges');
                    r.setAttribute('opacity', '0');
                    g.appendChild(r);
                    cells.push(r);
                }
            }
            return { cells, rows, cols };
        }

        function updateLayout() {
            const vbW = 100;
            const vbH = (window.innerHeight / window.innerWidth) * 100;
            const sets: GridData[] = [];

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
                if (g) sets.push(createGrid(g));
            });

            buildTimeline(sets);
        }

        // Column-by-column left→right, random within each column
        function openGrid({ cells, rows, cols }: GridData) {
            const ordered: SVGRectElement[] = [];
            for (let x = 0; x < cols; x++) {
                const col: SVGRectElement[] = [];
                for (let y = 0; y < rows; y++) {
                    col.push(cells[y * cols + x]);
                }
                ordered.push(...gsap.utils.shuffle(col));
            }
            return gsap.timeline().to(ordered, {
                opacity: 1,
                duration: 1,
                ease: 'power3.out',
                stagger: { each: 0.02 },
            });
        }

        function textIn(el: HTMLDivElement) {
            return gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 2.2, ease: 'expo.out' });
        }

        function textOut(el: HTMLDivElement) {
            return gsap.to(el, { clipPath: 'inset(0% 0% 100% 0%)', y: 0, duration: 1.6, ease: 'power2.inOut' });
        }

        function buildTimeline(sets: GridData[]) {
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

            sets.forEach((grid, i) => {
                master!.add(openGrid(grid));
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
            timer = setTimeout(() => {
                ScrollTrigger.refresh();
                updateLayout();
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
                    <Link href="/scroll/3">Vertical Blinds</Link>
                    <span className={styles.navCurrent}>Column Grid</span>
                </div>
            </nav>

            <div className={styles.spacer}>
                <h1>
                    On-Scroll SVG Mask Transitions
                    <br />
                    <span>(Column Grid)</span>
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
                                <mask id={`cg-mask-${i}`} maskUnits="userSpaceOnUse">
                                    <rect x="0" y="0" width="100" height="100" fill="black" />
                                    <g
                                        ref={(el) => {
                                            groupRefs.current[i] = el;
                                        }}
                                    />
                                </mask>
                            </defs>
                            <image href={src} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" mask={`url(#cg-mask-${i})`} style={{ filter: 'brightness(0.8)' }} />
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
                    <Link href="/scroll/1">Back to start →</Link>
                </h1>
            </div>
        </div>
    );
}
