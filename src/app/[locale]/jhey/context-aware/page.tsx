'use client';

import styles from './context-aware.module.css';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────
const APPS = [
    { name: 'Finder', src: 'https://assets.codepen.io/605876/finder.png' },
    { name: 'Photos', src: 'https://assets.codepen.io/605876/photos.png' },
    { name: 'Spotify', src: 'https://assets.codepen.io/605876/spotify.png' },
    { name: 'Signal', src: 'https://assets.codepen.io/605876/signal.png' },
];

type Theme = 'system' | 'light' | 'dark';

const DOTS_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <title>More options</title>
        <path d="M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z" />
    </svg>
);

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ContextAwarePage() {
    const [theme, setTheme] = useState<Theme>('dark');
    const [exclude, setExclude] = useState(false);
    const [css, setCss] = useState(true);
    const gridRef = useRef<HTMLDivElement>(null);
    const blurRef = useRef<SVGFEGaussianBlurElement>(null);

    // ── Pointer tracking ───────────────────────────────────────────────────────
    const handlePointerMove = useCallback((e: PointerEvent) => {
        const grid = gridRef.current;
        if (!grid) return;

        const cards = grid.querySelectorAll<HTMLElement>(`.${styles.card}`);
        cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = (e.clientX - centerX) / (rect.width / 2);
            const y = (e.clientY - centerY) / (rect.height / 2);
            card.style.setProperty('--pointer-x', x.toFixed(3));
            card.style.setProperty('--pointer-y', y.toFixed(3));
        });
    }, []);

    useEffect(() => {
        document.addEventListener('pointermove', handlePointerMove);
        return () => document.removeEventListener('pointermove', handlePointerMove);
    }, [handlePointerMove]);

    // ── Config as CSS custom properties ────────────────────────────────────────
    const configVars: React.CSSProperties = {
        '--icon-blur': 28,
        '--icon-saturate': 5,
        '--icon-brightness': 1.3,
        '--icon-contrast': 1.4,
        '--icon-scale': 3.4,
        '--icon-opacity': 0.25,
        '--border-width': 3,
        '--border-blur': 0,
        '--border-saturate': 4.2,
        '--border-brightness': 2.5,
        '--border-contrast': 2.5,
    } as React.CSSProperties;

    return (
        <div className={styles.page} data-theme={theme === 'system' ? undefined : theme} data-exclude={String(exclude)} data-css={String(css)} style={configVars}>
            {/* ── Card grid ── */}
            <div ref={gridRef} className={styles.grid}>
                {APPS.map((app) => (
                    <article key={app.name} className={styles.card}>
                        <div className={styles.cardInner}>
                            <button className={styles.optionsBtn} aria-label="More options">
                                {DOTS_ICON}
                            </button>
                            <div className={styles.iconGlow}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={app.src} alt="" />
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className={styles.iconFront} src={app.src} alt="" />
                            <h2 className={styles.cardTitle}>{app.name}</h2>
                        </div>
                    </article>
                ))}
            </div>

            {/* ── SVG blur filter (shared) ── */}
            <svg className={styles.srOnly} style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
                <filter id="blur" width="500%" height="500%">
                    <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="20" />
                </filter>
            </svg>

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
                <button className={styles.configBtn} data-active={String(exclude)} onClick={() => setExclude((e) => !e)}>
                    {exclude ? 'exclude on' : 'exclude off'}
                </button>
                <button className={styles.configBtn} data-active={String(css)} onClick={() => setCss((c) => !c)}>
                    {css ? 'css blur' : 'svg blur'}
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
