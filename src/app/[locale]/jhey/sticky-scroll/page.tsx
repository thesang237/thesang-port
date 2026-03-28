'use client';

import styles from './sticky-scroll.module.css';

import { useEffect, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Theme = 'system' | 'light' | 'dark';

// ─── Reused arrow SVG ──────────────────────────────────────────────────────────
const ARROW_D =
    'M116.102 0.0996005C114.952 0.334095 112.7 1.53002 111.433 2.53834C110.869 2.98388 109.368 4.15635 108.077 5.11778C103.455 8.6352 102.61 9.40903 102.187 10.4877C101.39 12.5982 102.798 14.5914 105.097 14.5914C106.13 14.5914 108.241 13.7941 109.696 12.8561C110.424 12.3871 111.01 12.0823 111.01 12.1526C111.01 12.692 107.796 17.8274 106.2 19.8206C102.023 25.0733 95.6642 29.6928 86.2548 34.2889C81.0926 36.8214 77.4555 38.2753 73.9123 39.2367C71.7066 39.823 70.6507 39.9871 67.9053 40.0809C66.0516 40.1513 64.5499 40.1747 64.5499 40.1278C64.5499 40.0809 64.808 38.9788 65.1365 37.6891C65.465 36.3993 65.8404 34.1716 66.0047 32.7647C66.4505 28.3796 65.4884 24.2994 63.4704 22.2359C62.1564 20.8758 60.9363 20.3599 59.0121 20.3599C57.6043 20.3599 57.1115 20.4537 55.7975 21.1103C52.8878 22.5407 50.5648 25.9878 49.5089 30.4197C48.453 34.922 49.2742 38.0877 52.3481 41.1127C53.4744 42.2148 54.46 42.9183 55.9852 43.6921C57.1584 44.2549 58.1439 44.7473 58.1909 44.7708C58.5898 45.0053 54.5304 53.4705 52.0666 57.6211C47.4674 65.3125 39.3486 74.575 30.5728 82.0789C22.2427 89.2309 16.7285 92.4435 9.87677 94.1553C8.28116 94.554 7.13138 94.6478 4.2452 94.6478C1.17131 94.6712 0.608154 94.7181 0.608154 95.023C0.608154 95.234 1.19478 95.5857 2.13337 95.9609C3.54126 96.4768 3.96363 96.5472 7.41296 96.5237C10.5572 96.5237 11.4724 96.4299 13.1149 96.0078C21.7265 93.6863 31.1594 87.1908 42.6102 75.7006C49.2977 69.0175 52.5828 64.9373 56.1494 58.9343C58.0501 55.7217 60.6312 50.6801 61.7575 47.9365L62.5553 45.9902L64.0806 46.1543C71.3547 46.9047 77.7136 45.3101 88.3667 40.034C96.2274 36.1414 101.976 32.3426 106.505 28.0748C108.617 26.0816 111.855 22.2828 112.794 20.7117C113.028 20.313 113.286 19.9847 113.357 19.9847C113.427 19.9847 113.662 20.782 113.873 21.72C114.084 22.6814 114.647 24.276 115.093 25.2609C115.82 26.8085 116.008 27.043 116.454 26.9727C116.876 26.9258 117.228 26.4333 117.956 24.9795C119.317 22.2828 119.833 20.2661 120.772 13.8879C121.757 7.25168 121.781 4.4143 120.889 2.56179C119.95 0.615488 118.12 -0.322489 116.102 0.0996005ZM60.7016 25.7767C61.4525 26.9023 61.8279 29.2942 61.6637 31.9205C61.4759 34.7813 60.5139 38.9788 60.0681 38.9788C59.5284 38.9788 57.1584 37.6422 56.2198 36.8214C54.8354 35.6021 54.3426 34.2889 54.5538 32.2957C54.8589 29.2473 56.1964 26.2223 57.5808 25.3547C58.7306 24.6512 60.0681 24.8388 60.7016 25.7767Z';

function ArrowSvg() {
    return (
        <svg viewBox="0 0 122 97" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d={ARROW_D} fill="currentColor" />
        </svg>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function StickyScrollPage() {
    const [explode, setExplode] = useState(false);
    const [theme, setTheme] = useState<Theme>('system');
    const pageRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<HTMLDivElement>(null);

    // Mirror the original update() logic: when explode turns off,
    // wait for scene animations to finish before setting data-collapsed='true'
    useEffect(() => {
        const page = pageRef.current;
        const scene = sceneRef.current;
        if (!page || !scene) return;

        if (explode) {
            page.dataset.collapsed = 'false';
            return;
        }

        let cancelled = false;
        (async () => {
            // Wait two frames so React has committed data-explode='false' to the DOM
            await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
            const anims = scene.getAnimations({ subtree: true });
            if (anims.length > 0) await Promise.allSettled(anims.map((a) => a.finished));
            if (!cancelled) page.dataset.collapsed = 'true';
        })();
        return () => {
            cancelled = true;
        };
    }, [explode]);

    return (
        <div ref={pageRef} className={styles.page} data-explode={String(explode)} data-theme={theme === 'system' ? undefined : theme}>
            {/* ── Arrow detail (sits outside scene, revealed on explode) ── */}
            <span className={`${styles.arrow} ${styles.arrowDetail}`}>
                <span>
                    leverage CSS grid
                    <br />
                    stacking + position:sticky
                </span>
                <ArrowSvg />
            </span>

            {/* ── Scene (3D perspective container) ── */}
            <div ref={sceneRef} className={styles.scene}>
                {/* ── Container: the real scrollable content ── */}
                <div className={styles.container}>
                    <header>
                        <h1 className={styles.fluid}>
                            <span>{'scroll.'}</span>
                            <span>{'supply'}</span>
                        </h1>
                        <span className={`${styles.arrow} ${styles.arrowInstruction}`}>
                            <span>{'scroll for the effect'}</span>
                            <ArrowSvg />
                        </span>
                    </header>

                    <main>
                        <section>
                            <div>
                                <article>
                                    <h2 className={styles.fluid}>{'Create a scroll window effect from CSS layout'}</h2>
                                    <p className={styles.fluid}>{'The trick here is to use CSS subgrid + position: sticky.'}</p>
                                </article>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-charcoal.png" alt="" />
                            </div>
                        </section>
                        <section>
                            <div>
                                <article>
                                    <h2 className={styles.fluid}>{'Overlap and stack elements with CSS grid'}</h2>
                                    <p className={styles.fluid}>{'You can stack elements by putting them in the same cell with grid-row and grid-column.'}</p>
                                </article>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-sand.png" alt="" />
                            </div>
                        </section>
                        <section>
                            <div>
                                <article>
                                    <h2 className={styles.fluid}>{'Make use of outline to create a frame'}</h2>
                                    <p className={styles.fluid}>{'Put an element in the second column spanning all rows. Inset it and give it a big outline.'}</p>
                                </article>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-gray.png" alt="" />
                            </div>
                        </section>
                        <section>
                            <div>
                                <article>
                                    <h2 className={styles.fluid}>{'Finish it off with sticky positioning'}</h2>
                                    <p className={styles.fluid}>{'Stick the frame and backdrop whilst scrolling the content.'}</p>
                                </article>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-forest.png" alt="" />
                            </div>
                        </section>
                        <div className={styles.backdrop}></div>
                        <div className={styles.window}>
                            <div className={styles.frame}></div>
                        </div>
                        <div className={styles.backdropShadow}></div>
                    </main>

                    <section className={styles.footer}>
                        <p className={styles.fluid}>{'fin.'}</p>
                        <footer>
                            <span aria-hidden="true">
                                {'ʕ'}
                                <span className={styles.arm}>{'ノ'}</span>
                                {'•ᴥ•ʔ'}
                                <span className={styles.arm}>{'ノ'}</span>{' '}
                                <span className={styles.spring}>
                                    <span>{'︵'}</span>
                                </span>
                                <span className={styles.table}>{'┻━┻'}</span>
                            </span>
                            {'\u00a0\u00a9 jhey \u002725'}
                        </footer>
                    </section>
                </div>

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

                {/* ── Stickies 1: backdrop layer ── */}
                <div className={styles.stickies}>
                    <main>
                        <div className={styles.backdrop}>
                            <div className={styles.backdropFrame}></div>
                            <div className={styles.backdropTrack}>
                                <div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://assets.codepen.io/605876/hoodie-charcoal.png" alt="" />
                                </div>
                                <div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://assets.codepen.io/605876/hoodie-sand.png" alt="" />
                                </div>
                                <div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://assets.codepen.io/605876/hoodie-gray.png" alt="" />
                                </div>
                                <div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://assets.codepen.io/605876/hoodie-forest.png" alt="" />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                {/* ── Dummy: CSS-animated shadow that mirrors scroll position ── */}
                <div className={styles.dummy}>
                    <header>
                        <h1 className={styles.fluid}>
                            <span>{'scroll.'}</span>
                            <span>{'supply'}</span>
                        </h1>
                    </header>
                    <main>
                        <section>
                            <div>
                                <h2>{'A'}</h2>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-charcoal.png" alt="" />
                            </div>
                        </section>
                        <section>
                            <div>
                                <h2>{'B'}</h2>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-sand.png" alt="" />
                            </div>
                        </section>
                        <section>
                            <div>
                                <h2>{'C'}</h2>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-gray.png" alt="" />
                            </div>
                        </section>
                        <section>
                            <div>
                                <h2>{'D'}</h2>
                            </div>
                            <div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/hoodie-forest.png" alt="" />
                            </div>
                        </section>
                    </main>
                    <section className={styles.footer}>
                        <p className={styles.fluid}>{'fin.'}</p>
                        <footer>
                            <span aria-hidden="true">
                                {'ʕ'}
                                <span className={styles.arm}>{'ノ'}</span>
                                {'•ᴥ•ʔ'}
                                <span className={styles.arm}>{'ノ'}</span>{' '}
                                <span className={styles.spring}>
                                    <span>{'︵'}</span>
                                </span>
                                <span className={styles.table}>{'┻━┻'}</span>
                            </span>
                            {'\u00a0\u00a9 jhey \u002725'}
                        </footer>
                    </section>
                </div>

                {/* ── Stickies 2: window frame layer ── */}
                <div className={styles.stickies}>
                    <main>
                        <div className={styles.window}>
                            <div className={styles.frame}></div>
                        </div>
                    </main>
                </div>
            </div>
            {/* /scene */}

            {/* ── Config bar (replaces Tweakpane) ── */}
            <div className={styles.configBar}>
                <button className={styles.configBtn} data-active={String(explode)} onClick={() => setExplode((e) => !e)}>
                    {explode ? 'explode on' : 'explode off'}
                </button>
                {(['system', 'light', 'dark'] as Theme[]).map((t) => (
                    <button key={t} className={styles.configBtn} data-active={String(theme === t)} onClick={() => setTheme(t)}>
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
}
