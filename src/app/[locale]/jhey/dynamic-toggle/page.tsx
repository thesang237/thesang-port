'use client';

import styles from './dynamic-toggle.module.css';

import { useState } from 'react';

type Theme = 'system' | 'light' | 'dark';

export default function DynamicTogglePage() {
    const [theme, setTheme] = useState<Theme>('system');
    const [debug, setDebug] = useState(false);

    return (
        <div data-theme={theme === 'system' ? undefined : theme} data-debug={String(debug)} className={styles.page}>
            {/* ── Toggle control ── */}
            <div className={styles.control}>
                <div className={styles.controlTrack}>
                    <div className={styles.indicator} />

                    <label htmlFor="free">{'Free'}</label>
                    <input className={styles.srOnly} type="radio" name="tier" id="free" defaultChecked />

                    <div className={styles.premium}>
                        <div className={styles.indicator} />
                        <label htmlFor="solo">
                            <span>{'Solo'}</span>
                            <span className={styles.srOnly}>{'Premium Solo'}</span>
                        </label>
                        <input className={styles.srOnly} type="radio" name="tier" id="solo" />
                        <label htmlFor="team">
                            <span>{'Team'}</span>
                            <span className={styles.srOnly}>{'Premium Team'}</span>
                        </label>
                        <input className={styles.srOnly} type="radio" name="tier" id="team" />
                    </div>
                </div>
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

            {/* ── Config buttons (replaces tweakpane) ── */}
            <div className={styles.configBar}>
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
