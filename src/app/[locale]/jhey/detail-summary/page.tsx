'use client';

import styles from './detail-summary.module.css';

import { useEffect, useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────────
type Theme = 'system' | 'light' | 'dark';

// ─── Data ───────────────────────────────────────────────────────────────────────
const ITEMS: { title: string; content: React.ReactNode }[] = [
    {
        title: 'Details & Summary',
        content: 'A built-in web platform disclosure, accessible by default — no JavaScript required.',
    },
    {
        title: 'Smooth Height',
        content: 'Apply interpolate-size: allow-keywords to create smooth auto-to-open transitions on height/block-size, zero hacks.',
    },
    {
        title: 'Timings',
        content: 'Mess with the timings, use linear() to get that little bounce.',
    },
    {
        title: 'Progressive',
        content: 'Start with plain details/summary markup using [name]. Enhance with interpolate-size: allow-keywords. Then add some scripting for the buttons and to switch motion styles.',
    },
    {
        title: 'Follow for more',
        content: (
            <>
                {'You can find me on '}
                <a aria-label="Follow Jhey" href="https://x.com/intent/follow?screen_name=jh3yy" target="_blank" rel="noreferrer noopener">
                    {'X'}
                </a>
                {' or consider signing up my '}
                <a href="https://craftofui.dev/" target="_blank" rel="noreferrer noopener">
                    {'newsletter'}
                </a>
                {'.'}
            </>
        ),
    },
];

const IMAGES = [
    'https://assets.codepen.io/605876/the-faux-phone.png?format=auto',
    'https://assets.codepen.io/605876/the-faux-phone-closeup.png?format=auto',
    'https://assets.codepen.io/605876/the-faux-phone-breakdown.png?format=auto',
    'https://assets.codepen.io/605876/the-faux-phone-parallax.png?format=auto',
    'https://assets.codepen.io/605876/the-faux-phone-lion-king.png?format=auto',
    'https://assets.codepen.io/605876/the-faux-phone-camera-shot.png?format=auto',
];

// ─── Icons ───────────────────────────────────────────────────────────────────────
function PlusCircle() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────────
export default function DetailSummaryPage() {
    const [theme, setTheme] = useState<Theme>('dark');
    const [debug, setDebug] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [checkingDetails, setCheckingDetails] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    const sectionRef = useRef<HTMLElement>(null);
    const detailsRefs = useRef<(HTMLDetailsElement | null)[]>([]);

    // ── Section-level toggle listener (mirrors original JS) ────────────────────
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const syncState = () => {
            const idx = detailsRefs.current.findIndex((el) => el?.open);
            const newIndex = idx === -1 ? null : idx;
            setOpenIndex(newIndex);
            setCheckingDetails(false);

            if (newIndex !== null) {
                const animations = (section.getAnimations as (opts?: { subtree?: boolean }) => Animation[])({ subtree: true });
                Promise.allSettled(animations.map((a) => a.finished)).then(() => {
                    setCheckingDetails(true);
                });
            }
        };

        section.addEventListener('toggle', syncState, true);
        return () => section.removeEventListener('toggle', syncState, true);
    }, []);

    // ── Navigation helpers ──────────────────────────────────────────────────────
    const openAt = (index: number) => {
        detailsRefs.current.forEach((el, i) => {
            if (el) el.open = i === index;
        });
    };

    const closeAll = () => {
        detailsRefs.current.forEach((el) => {
            if (el) el.open = false;
        });
    };

    const handleNext = () => {
        if (openIndex === null) return;
        openAt((openIndex + 1) % ITEMS.length);
    };

    const handlePrevious = () => {
        if (openIndex === null) return;
        openAt((openIndex - 1 + ITEMS.length) % ITEMS.length);
    };

    const handleExit = () => closeAll();

    const handleReset = () => {
        closeAll();
        setResetKey((k) => k + 1);
    };

    return (
        <div className={styles.page} data-theme={theme === 'system' ? undefined : theme} data-debug={String(debug)}>
            {/* ── Demo section ── */}
            <section ref={sectionRef} className={styles.section} data-open-index={openIndex ?? -1} data-checking-details={String(checkingDetails)}>
                {/* ── Left column: details/summary items ── */}
                <div key={resetKey} className={styles.leftColumn}>
                    {ITEMS.map((item, i) => (
                        <details
                            key={i}
                            ref={(el) => {
                                detailsRefs.current[i] = el;
                            }}
                            name="feature"
                            className={styles.details}
                        >
                            <summary className={styles.summary}>
                                <PlusCircle />
                                <span>{item.title}</span>
                            </summary>
                            <div className={styles.content}>
                                <p>{item.content}</p>
                            </div>
                        </details>
                    ))}
                </div>

                {/* ── Right column: images ── */}
                <div className={styles.rightColumn}>
                    {IMAGES.map((src, i) => (
                        <div key={i} className={styles.imgBlock}>
                            <div className={styles.imgWrapper}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt="" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Control buttons ── */}
                <button aria-hidden="true" tabIndex={-1} className={`${styles.actionBtn} ${styles.actionNext}`} onClick={handleNext}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                </button>
                <button aria-hidden="true" tabIndex={-1} className={`${styles.actionBtn} ${styles.actionPrevious}`} onClick={handlePrevious}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                </button>
                <button aria-hidden="true" tabIndex={-1} className={`${styles.actionBtn} ${styles.actionExit}`} onClick={handleExit}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </section>

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

            {/* ── Config buttons (replaces tweakpane) ── */}
            <div className={styles.configBar}>
                <button className={styles.configBtn} onClick={handleReset}>
                    {'reset'}
                </button>
                <button className={styles.configBtn} data-active={String(debug)} onClick={() => setDebug((d) => !d)}>
                    {debug ? 'debug on' : 'debug off'}
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
