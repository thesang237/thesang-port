'use client';

import styles from './svg-slider.module.css';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

// ─── Constants (tweakpane defaults) ──────────────────────────────────────────
const ACCENT = 'hsl(10, 100%, 65%)';
const VIEW_BOX_WIDTH = 300;
const BUMP_HEIGHT = 40;
const CURVE_SECTION_WIDTH = 150;
const CURVE_TOP_WIDTH = 65;

// ─── Types ────────────────────────────────────────────────────────────────────
type PathParams = {
    baselineY: number;
    curveStartX: number;
    curveEndX: number;
    leftControlX: number;
    centralControlX: number;
    centralControlY: number;
    curveMidX: number;
    curveMidY: number;
    rightControl1X: number;
    rightControl2X: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SvgSliderPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const [explode, setExplode] = useState(false);

    useGSAP(
        (_ctx, contextSafe) => {
            const slider = sliderRef.current!;
            const svgEl = slider.querySelector<SVGSVGElement>('svg')!;
            const pathEls = slider.querySelectorAll<SVGPathElement>('.track');
            const controller = slider.querySelector<HTMLInputElement>('[type=range]')!;
            const markerEl = slider.querySelector<SVGGElement>('.marker')!;
            const trackClipRect = slider.querySelector<SVGRectElement>('#track-bounds rect')!;
            const indicators = slider.querySelectorAll<SVGElement>('.indicator');

            svgEl.style.setProperty('--accent', ACCENT);
            controller.value = String(gsap.utils.random(0, 100, 1));

            let pathParams: PathParams | null = null;

            // ── Cubic Bezier Y-at-X via binary search ──────────────────────
            const getYAtX = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, tx: number): number => {
                const bx = (t: number) => {
                    const m = 1 - t;
                    return m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x3;
                };
                const by = (t: number) => {
                    const m = 1 - t;
                    return m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y3;
                };
                let lo = 0,
                    hi = 1,
                    t = 0.5;
                for (let i = 0; i < 20; i++) {
                    const cx = bx(t);
                    if (Math.abs(cx - tx) < 0.0001) break;
                    if (cx < tx) lo = t;
                    else hi = t;
                    t = (lo + hi) / 2;
                }
                return by(t);
            };

            const getYAtPos = (x: number): number => {
                if (!pathParams) return 2;
                const { baselineY, curveStartX, curveEndX, leftControlX, centralControlX, centralControlY, curveMidX, curveMidY, rightControl1X, rightControl2X } = pathParams;
                if (x <= curveStartX || x >= curveEndX) return baselineY;
                if (x <= curveMidX) return getYAtX(curveStartX, baselineY, leftControlX, baselineY, centralControlX, centralControlY, curveMidX, curveMidY, x);
                return getYAtX(curveMidX, curveMidY, rightControl1X, curveMidY, rightControl2X, baselineY, curveEndX, baselineY, x);
            };

            const updateIndicators = () => {
                indicators.forEach((el) => {
                    const cx = el.getAttribute('cx');
                    if (cx === null) return;
                    const x = (parseFloat(cx) / 100) * VIEW_BOX_WIDTH;
                    const y = getYAtPos(x);
                    gsap.to(el, { attr: { cy: y, y }, duration: 0 });
                });
            };

            const updatePath = (value = 50, bumpH = BUMP_HEIGHT) => {
                const baselineY = 2;
                const peakY = baselineY - bumpH;
                const cx = (value / 100) * VIEW_BOX_WIDTH;
                const half = CURVE_SECTION_WIDTH / 2;
                const curveStartX = cx - half;
                const curveEndX = cx + half;
                const halfPeak = CURVE_TOP_WIDTH / 2;
                const centralControlX = cx - halfPeak;
                const rightControl1X = cx + halfPeak;
                const leftControlX = curveStartX + 33;
                const rightControl2X = curveEndX - 33;

                pathParams = {
                    baselineY,
                    curveStartX,
                    curveEndX,
                    leftControlX,
                    centralControlX,
                    centralControlY: peakY,
                    curveMidX: cx,
                    curveMidY: peakY,
                    rightControl1X,
                    rightControl2X,
                };

                const d = `M ${-half} ${baselineY} L ${curveStartX} ${baselineY} C ${leftControlX} ${baselineY} ${centralControlX} ${peakY} ${cx} ${peakY} C ${rightControl1X} ${peakY} ${rightControl2X} ${baselineY} ${curveEndX} ${baselineY} L ${VIEW_BOX_WIDTH + half} ${baselineY}`;

                gsap.to(pathEls, { attr: { d }, duration: 0 });
                updateIndicators();
            };

            // ── Symbols ────────────────────────────────────────────────────
            const symbols = {
                triangle: slider.querySelector<SVGElement>('.marker-symbol--triangle')!,
                square: slider.querySelector<SVGElement>('.marker-symbol--square')!,
                circle: slider.querySelector<SVGElement>('.marker-symbol--circle')!,
                star: slider.querySelector<SVGElement>('.marker-symbol--star')!,
            };

            const setActiveSymbol = (v: number) => {
                Object.values(symbols).forEach((s) => s.removeAttribute('data-active'));
                const active = v <= 24 ? symbols.triangle : v <= 49 ? symbols.square : v <= 74 ? symbols.circle : symbols.star;
                active.setAttribute('data-active', 'true');
            };

            // ── Event handlers ─────────────────────────────────────────────
            const onUpdate = contextSafe!(() => {
                const v = Number(controller.value);
                gsap.to(markerEl, { x: VIEW_BOX_WIDTH * (v / 100), duration: 0.15 });
                gsap.to(trackClipRect, { scaleX: v / 100, duration: 0 });
                updatePath(v);
                setActiveSymbol(v);
            });

            const activate = contextSafe!(() => {
                gsap.to(markerEl, { y: -BUMP_HEIGHT, duration: 0.15 });
                updatePath(Number(controller.value), BUMP_HEIGHT);
            });

            const deactivate = contextSafe!(() => {
                updatePath(Number(controller.value), 0);
                gsap.to(markerEl, { y: 0, duration: 0.15 });
            });

            controller.addEventListener('input', onUpdate);
            controller.addEventListener('pointerdown', activate);
            controller.addEventListener('pointerup', deactivate);
            controller.addEventListener('touchend', deactivate);
            controller.addEventListener('focus', activate);
            controller.addEventListener('blur', deactivate);

            onUpdate();
            updatePath(Number(controller.value), 0);

            gsap.to(slider, { opacity: 1, delay: 0.25, ease: 'power2.out', duration: 1 });

            return () => {
                controller.removeEventListener('input', onUpdate);
                controller.removeEventListener('pointerdown', activate);
                controller.removeEventListener('pointerup', deactivate);
                controller.removeEventListener('touchend', deactivate);
                controller.removeEventListener('focus', activate);
                controller.removeEventListener('blur', deactivate);
            };
        },
        { scope: containerRef },
    );

    return (
        <div ref={containerRef} data-explode={String(explode)} className={styles.page}>
            {/* ── Slider ── */}
            <div ref={sliderRef} className={styles.slider}>
                <input type="range" min="0" max="100" defaultValue="0" />

                <svg viewBox="0 0 300 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="bounds">
                            <rect x="0" y="-200" width="100%" height="400" />
                        </clipPath>
                        <clipPath id="track-bounds">
                            <rect x="0" y="-200" width="100%" height="400" />
                        </clipPath>
                        <filter id="goo">
                            <feGaussianBlur id="blur" result="blurred" in="SourceGraphic" stdDeviation="9.2" />
                            <feColorMatrix id="adjust" result="adjusted" in="blurred" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 66 -10" />
                            <feComposite id="combine" result="combined" in="adjusted" operator="atop" />
                        </filter>
                    </defs>

                    <g clipPath="url(#bounds)">
                        <path className="track" d="" stroke="currentColor" strokeWidth="4" />
                    </g>
                    <g clipPath="url(#track-bounds)">
                        <path className="track track--progress" d="" stroke="currentColor" strokeWidth="6" />
                    </g>

                    {/* Fixed indicators */}
                    <g>
                        <circle className="indicator" cx="0%" cy="2" r="6" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                        <rect className="indicator" x="25%" cx="25%" y="2" width="3" height="12" transform="translate(-1 -6)" fill="currentColor" />
                        <rect className="indicator" x="50%" cx="50%" y="2" width="3" height="12" transform="translate(-1 -6)" fill="currentColor" />
                        <rect className="indicator" x="75%" cx="75%" y="2" width="3" height="12" transform="translate(-1 -6)" fill="currentColor" />
                        <circle className="indicator" cx="100%" cy="2" r="6" fill="canvas" stroke="currentColor" strokeWidth="2" />
                    </g>

                    {/* Draggable marker */}
                    <g className="marker">
                        <g className="marker__dot" filter="url(#goo)">
                            <circle className="marker__circle" cx="0" cy="2" r="5.8" />
                            <g className="marker__balloon">
                                <circle className="marker__circle" cx="0" cy="2" r="18" />
                            </g>
                            <rect x="-50" y="-100" width="100" height="200" fill="none" />
                        </g>
                        <circle className="marker__circle" cx="0" cy="2" r="8" />
                        <g className="marker__symbols">
                            <path
                                className="marker-symbol marker-symbol--triangle"
                                transform="translate(-9.55859 0)"
                                d="M9.55859 2L17.5586 16H1.55859L9.55859 2Z"
                                stroke="canvas"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <circle className="marker-symbol marker-symbol--circle" cx="0" cy="10" r="7" stroke="canvas" strokeWidth="2" />
                            <rect className="marker-symbol marker-symbol--square" x="-7" y="3" width="14" height="14" stroke="canvas" strokeWidth="2" strokeLinejoin="round" />
                            <path
                                className="marker-symbol marker-symbol--star"
                                transform="translate(-9.55859 0)"
                                d="M9.55859 1L11.5792 7.21885H18.1181L12.828 11.0623L14.8487 17.2812L9.55859 13.4377L4.26853 17.2812L6.28915 11.0623L0.999085 7.21885H7.53797L9.55859 1Z"
                                stroke="canvas"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                        </g>
                    </g>
                </svg>
            </div>

            {/* ── Arrow annotation ── */}
            <span className={styles.arrow}>
                <span>
                    {'jus\u2019 [type=range]'}
                    <br />
                    {'w/ \u201cextras\u201d'}
                </span>
                <svg viewBox="0 0 122 97" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M116.102 0.0996005C114.952 0.334095 112.7 1.53002 111.433 2.53834C110.869 2.98388 109.368 4.15635 108.077 5.11778C103.455 8.6352 102.61 9.40903 102.187 10.4877C101.39 12.5982 102.798 14.5914 105.097 14.5914C106.13 14.5914 108.241 13.7941 109.696 12.8561C110.424 12.3871 111.01 12.0823 111.01 12.1526C111.01 12.692 107.796 17.8274 106.2 19.8206C102.023 25.0733 95.6642 29.6928 86.2548 34.2889C81.0926 36.8214 77.4555 38.2753 73.9123 39.2367C71.7066 39.823 70.6507 39.9871 67.9053 40.0809C66.0516 40.1513 64.5499 40.1747 64.5499 40.1278C64.5499 40.0809 64.808 38.9788 65.1365 37.6891C65.465 36.3993 65.8404 34.1716 66.0047 32.7647C66.4505 28.3796 65.4884 24.2994 63.4704 22.2359C62.1564 20.8758 60.9363 20.3599 59.0121 20.3599C57.6043 20.3599 57.1115 20.4537 55.7975 21.1103C52.8878 22.5407 50.5648 25.9878 49.5089 30.4197C48.453 34.922 49.2742 38.0877 52.3481 41.1127C53.4744 42.2148 54.46 42.9183 55.9852 43.6921C57.1584 44.2549 58.1439 44.7473 58.1909 44.7708C58.5898 45.0053 54.5304 53.4705 52.0666 57.6211C47.4674 65.3125 39.3486 74.575 30.5728 82.0789C22.2427 89.2309 16.7285 92.4435 9.87677 94.1553C8.28116 94.554 7.13138 94.6478 4.2452 94.6478C1.17131 94.6712 0.608154 94.7181 0.608154 95.023C0.608154 95.234 1.19478 95.5857 2.13337 95.9609C3.54126 96.4768 3.96363 96.5472 7.41296 96.5237C10.5572 96.5237 11.4724 96.4299 13.1149 96.0078C21.7265 93.6863 31.1594 87.1908 42.6102 75.7006C49.2977 69.0175 52.5828 64.9373 56.1494 58.9343C58.0501 55.7217 60.6312 50.6801 61.7575 47.9365L62.5553 45.9902L64.0806 46.1543C71.3547 46.9047 77.7136 45.3101 88.3667 40.034C96.2274 36.1414 101.976 32.3426 106.505 28.0748C108.617 26.0816 111.855 22.2828 112.794 20.7117C113.028 20.313 113.286 19.9847 113.357 19.9847C113.427 19.9847 113.662 20.782 113.873 21.72C114.084 22.6814 114.647 24.276 115.093 25.2609C115.82 26.8085 116.008 27.043 116.454 26.9727C116.876 26.9258 117.228 26.4333 117.956 24.9795C119.317 22.2828 119.833 20.2661 120.772 13.8879C121.757 7.25168 121.781 4.4143 120.889 2.56179C119.95 0.615488 118.12 -0.322489 116.102 0.0996005ZM60.7016 25.7767C61.4525 26.9023 61.8279 29.2942 61.6637 31.9205C61.4759 34.7813 60.5139 38.9788 60.0681 38.9788C59.5284 38.9788 57.1584 37.6422 56.2198 36.8214C54.8354 35.6021 54.3426 34.2889 54.5538 32.2957C54.8589 29.2473 56.1964 26.2223 57.5808 25.3547C58.7306 24.6512 60.0681 24.8388 60.7016 25.7767Z"
                        fill="currentColor"
                    />
                </svg>
            </span>

            {/* ── Bear link ── */}
            <a aria-label="Follow Jhey" className={styles.bearLink} href="https://twitter.com/intent/follow?screen_name=jh3yy" target="_blank" rel="noreferrer noopener">
                <svg viewBox="0 0 969 955" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="161.191" cy="320.191" r="133.191" stroke="currentColor" strokeWidth="20" />
                    <circle cx="806.809" cy="320.191" r="133.191" stroke="currentColor" strokeWidth="20" />
                    <circle cx="695.019" cy="587.733" r="31.4016" fill="currentColor" />
                    <circle cx="272.981" cy="587.733" r="31.4016" fill="currentColor" />
                    <path
                        d="M564.388 712.083C564.388 743.994 526.035 779.911 483.372 779.911C440.709 779.911 402.356 743.994 402.356 712.083C402.356 680.173 440.709 664.353 483.372 664.353C526.035 664.353 564.388 680.173 564.388 712.083Z"
                        fill="currentColor"
                    />
                    <rect x="310.42" y="448.31" width="343.468" height="51.4986" fill="#FF1E1E" />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M745.643 288.24C815.368 344.185 854.539 432.623 854.539 511.741H614.938V454.652C614.938 433.113 597.477 415.652 575.938 415.652H388.37C366.831 415.652 349.37 433.113 349.37 454.652V511.741L110.949 511.741C110.949 432.623 150.12 344.185 219.845 288.24C289.57 232.295 384.138 200.865 482.744 200.865C581.35 200.865 675.918 232.295 745.643 288.24Z"
                        fill="currentColor"
                    />
                </svg>
            </a>

            {/* ── Explode toggle (replaces tweakpane checkbox) ── */}
            <button className={styles.explodeBtn} onClick={() => setExplode((e) => !e)}>
                {explode ? 'hide' : 'explode'}
            </button>
        </div>
    );
}
