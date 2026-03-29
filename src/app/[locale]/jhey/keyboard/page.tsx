'use client';

import styles from './keyboard.module.css';

import { useEffect, useRef, useState } from 'react';
import { Leva, useControls } from 'leva';

type KeyId = 'one' | 'two' | 'three';
const KEY_IDS: KeyId[] = ['one', 'two', 'three'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KeyboardPage() {
    const [pressed, setPressed] = useState<Record<KeyId, boolean>>({ one: false, two: false, three: false });
    const [bindings, setBindings] = useState<Record<KeyId, string>>({ one: 'o', two: 'g', three: 'Enter' });
    const [recordingFor, setRecordingFor] = useState<KeyId | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ── Leva controls ────────────────────────────────────────────────────────
    const { theme, muted, explode } = useControls({
        theme: { value: 'system', options: { system: 'system', light: 'light', dark: 'dark' } },
        muted: false,
        explode: false,
    });

    const {
        text: textOne,
        travel: travelOne,
        hue: hueOne,
        saturation: satOne,
        brightness: brightnessOne,
    } = useControls('key one', {
        text: 'ok',
        travel: { value: 26, min: 1, max: 50, step: 1 },
        hue: { value: 114, min: 0, max: 360, step: 1 },
        saturation: { value: 1.4, min: 0, max: 2, step: 0.1 },
        brightness: { value: 1.2, min: 0, max: 2, step: 0.1 },
    });

    const {
        text: textTwo,
        travel: travelTwo,
        hue: hueTwo,
        saturation: satTwo,
        brightness: brightnessTwo,
    } = useControls('key two', {
        text: 'go',
        travel: { value: 26, min: 1, max: 50, step: 1 },
        hue: { value: 0, min: 0, max: 360, step: 1 },
        saturation: { value: 0, min: 0, max: 2, step: 0.1 },
        brightness: { value: 1.4, min: 0, max: 2, step: 0.1 },
    });

    const {
        text: textThree,
        travel: travelThree,
        hue: hueThree,
        saturation: satThree,
        brightness: brightnessThree,
    } = useControls('key three', {
        text: 'create.',
        travel: { value: 18, min: 1, max: 50, step: 1 },
        hue: { value: 0, min: 0, max: 360, step: 1 },
        saturation: { value: 0, min: 0, max: 2, step: 0.1 },
        brightness: { value: 0.4, min: 0, max: 2, step: 0.1 },
    });

    const keyData = {
        one: { text: textOne, travel: travelOne, hue: hueOne, saturation: satOne, brightness: brightnessOne },
        two: { text: textTwo, travel: travelTwo, hue: hueTwo, saturation: satTwo, brightness: brightnessTwo },
        three: { text: textThree, travel: travelThree, hue: hueThree, saturation: satThree, brightness: brightnessThree },
    };

    // ── Audio ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        audioRef.current = new Audio('https://cdn.freesound.org/previews/378/378085_6260145-lq.mp3');
    }, []);

    useEffect(() => {
        if (audioRef.current) audioRef.current.muted = muted as boolean;
    }, [muted]);

    const playClick = () => {
        const audio = audioRef.current;
        if (!audio || (muted as boolean)) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    };

    // ── Keyboard recording ────────────────────────────────────────────────────
    useEffect(() => {
        if (!recordingFor) return;
        const handler = (e: KeyboardEvent) => {
            setBindings((prev) => ({ ...prev, [recordingFor]: e.key }));
            setRecordingFor(null);
        };
        window.addEventListener('keydown', handler, { once: true });
        return () => window.removeEventListener('keydown', handler);
    }, [recordingFor]);

    // ── Keyboard press events ─────────────────────────────────────────────────
    useEffect(() => {
        if (recordingFor) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const id = KEY_IDS.find((k) => e.key === bindings[k]);
            if (!id) return;
            setPressed((prev) => ({ ...prev, [id]: true }));
            playClick();
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const id = KEY_IDS.find((k) => e.key === bindings[k]);
            if (!id) return;
            setPressed((prev) => ({ ...prev, [id]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bindings, recordingFor, muted]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const keyStyle = (id: KeyId): React.CSSProperties =>
        ({
            '--travel': keyData[id].travel,
            '--hue': keyData[id].hue,
            '--saturate': keyData[id].saturation,
            '--brightness': keyData[id].brightness,
        }) as React.CSSProperties;

    const pressHandlers = (id: KeyId) => ({
        onPointerDown: () => {
            setPressed((p) => ({ ...p, [id]: true }));
            playClick();
        },
        onPointerUp: () => setPressed((p) => ({ ...p, [id]: false })),
        onPointerLeave: () => setPressed((p) => ({ ...p, [id]: false })),
    });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={styles.page} data-theme={(theme as string) === 'system' ? undefined : (theme as string)} data-exploded={String(explode)}>
            <Leva collapsed />

            <main className={styles.main}>
                {/* ── Newsletter section ── */}
                <section className={styles.section}>
                    <div className={styles.content}>
                        <h1>
                            {"Jus' make things."}
                            <br />
                            {'Put them on the internet.'}
                        </h1>
                        <p>{'Sign up for a newsletter all about building in public, sharing your work, and ignoring the haters.'}</p>
                        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                            <input type="email" required placeholder="creator@hotmail.com" className={styles.input} />
                            <button type="submit" className={styles.submitBtn}>
                                {'sign up'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* ── Keypad ── */}
                <div className={styles.keypad}>
                    {/* Base */}
                    <div className={styles.keypadBase}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://assets.codepen.io/605876/keypad-base.png?format=auto&quality=86" alt="" />
                    </div>

                    {/* Key one — left single */}
                    <button id="one" className={`${styles.key} ${styles.keypadSingle} ${styles.keypadSingleLeft}`} data-pressed={String(pressed.one)} style={keyStyle('one')} {...pressHandlers('one')}>
                        <span className={styles.keyMask}>
                            <span className={styles.keyContent}>
                                <span className={styles.keyText}>{textOne}</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/keypad-single.png?format=auto&quality=86" alt="" />
                            </span>
                        </span>
                    </button>

                    {/* Key two — right single */}
                    <button id="two" className={`${styles.key} ${styles.keypadSingle}`} data-pressed={String(pressed.two)} style={keyStyle('two')} {...pressHandlers('two')}>
                        <span className={styles.keyMask}>
                            <span className={styles.keyContent}>
                                <span className={styles.keyText}>{textTwo}</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/keypad-single.png?format=auto&quality=86" alt="" />
                            </span>
                        </span>
                    </button>

                    {/* Key three — double */}
                    <button id="three" className={`${styles.key} ${styles.keypadDouble}`} data-pressed={String(pressed.three)} style={keyStyle('three')} {...pressHandlers('three')}>
                        <span className={styles.keyMask}>
                            <span className={styles.keyContent}>
                                <span className={styles.keyText}>{textThree}</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://assets.codepen.io/605876/keypad-double.png?format=auto&quality=86" alt="" />
                            </span>
                        </span>
                    </button>
                </div>
            </main>

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

            {/* ── Key binding recorder ── */}
            <div className={styles.bindingBar}>
                {KEY_IDS.map((id) => (
                    <div key={id} className={styles.bindingItem}>
                        <span className={styles.bindingKey}>{bindings[id]}</span>
                        <button className={`${styles.bindingBtn} ${recordingFor === id ? styles.bindingBtnRecording : ''}`} onClick={() => setRecordingFor(recordingFor === id ? null : id)}>
                            {recordingFor === id ? 'press key…' : `key ${id}`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
