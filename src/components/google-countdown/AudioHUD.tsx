import styles from './AudioHUD.module.css';

import { useEffect, useRef } from 'react';

import type { AudioProfile } from './hooks/useAudioEngine';

type AudioHUDProps = {
    visible: boolean;
    currentNumber: number;
    currentAudioProfile: AudioProfile | null;
    shaderUniformsRef: React.MutableRefObject<any>;
    mouseSpeed: React.MutableRefObject<number>;
    activePlucks: number;
    activeDustCount: number;
    isMuted: boolean;
    isCountdownPaused: boolean;
    onToggleMute: () => void;
    onTogglePause: () => void;
    onRestart: () => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    onAnalyze: () => void;
};

export function AudioHUD({
    visible,
    currentNumber,
    currentAudioProfile,
    shaderUniformsRef,
    mouseSpeed,
    activePlucks,
    activeDustCount,
    isMuted,
    isCountdownPaused,
    onToggleMute,
    onTogglePause,
    onRestart,
    apiKey,
    onApiKeyChange,
    onAnalyze,
}: AudioHUDProps) {
    const bioBarRef = useRef<HTMLDivElement>(null);
    const resonanceBarRef = useRef<HTMLDivElement>(null);
    const panDotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateHUD = () => {
            if (!visible) return;

            const globalBioActivity = shaderUniformsRef.current.uGlobalBioActivity.value;

            if (bioBarRef.current) {
                bioBarRef.current.style.width = `${globalBioActivity * 100}%`;
            }

            // Mock resonance based on mouse speed
            const normalizedForce = Math.min(1.0, mouseSpeed.current * 100);
            if (resonanceBarRef.current) {
                resonanceBarRef.current.style.width = `${Math.min(100, normalizedForce * 100)}%`;
            }

            // Mock pan position
            if (panDotRef.current) {
                panDotRef.current.style.left = '50%';
            }

            requestAnimationFrame(updateHUD);
        };

        const animationId = requestAnimationFrame(updateHUD);
        return () => cancelAnimationFrame(animationId);
    }, [visible, shaderUniformsRef, mouseSpeed]);

    return (
        <div className={`${styles.audioHud} ${styles.glassPanel} ${visible ? styles.visible : ''}`}>
            <h3>Terminal Data</h3>
            <div className={styles.hudRow}>
                <span>Organism</span>
                <span className={`${styles.hudVal} ${styles.highlight}`}>{currentNumber}</span>
            </div>
            <div className={styles.hudRow}>
                <span>Scale</span>
                <span className={styles.hudVal}>{currentAudioProfile?.name || '-'}</span>
            </div>
            <div className={styles.hudRow}>
                <span>Root Freq</span>
                <span className={styles.hudVal}>{currentAudioProfile ? `${currentAudioProfile.scale[0].toFixed(1)} Hz` : '-'}</span>
            </div>
            <div className={styles.hudRow}>
                <span>Texture</span>
                <span className={styles.hudVal}>{currentAudioProfile ? `${currentAudioProfile.drone} / ${currentAudioProfile.pluck}` : '-'}</span>
            </div>
            <hr className={styles.hudDivider} />
            <div className={styles.hudRow}>
                <span>Bio-Signal</span>
                <div className={styles.barBg}>
                    <div ref={bioBarRef} className={styles.barFill}></div>
                </div>
            </div>
            <div className={styles.hudRow}>
                <span>Velocity</span>
                <span className={styles.hudVal}>{Math.min(100, Math.floor(mouseSpeed.current * 200))}%</span>
            </div>
            <div className={styles.hudRow}>
                <span>Resonance</span>
                <div className={styles.barBg}>
                    <div ref={resonanceBarRef} className={styles.barFill}></div>
                </div>
            </div>
            <div className={styles.hudRow}>
                <span>Cutoff Freq</span>
                <span className={styles.hudVal}>300 Hz</span>
            </div>
            <div className={styles.hudRow}>
                <span>Stereo Field</span>
                <div className={styles.barBg}>
                    <div ref={panDotRef} className={styles.panDot}></div>
                </div>
            </div>
            <hr className={styles.hudDivider} />
            <div className={styles.hudRow}>
                <span>Plucks</span>
                <span className={styles.hudVal} style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    IDLE
                </span>
            </div>
            <div className={styles.hudRow}>
                <span>Active Voices</span>
                <span className={`${styles.hudVal} ${styles.highlight}`}>{activePlucks}</span>
            </div>
            <div className={styles.hudRow}>
                <span>Airborne Dust</span>
                <span className={styles.hudVal}>{activeDustCount}</span>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                <button className={`${styles.btn} ${styles.btnSmall}`} onClick={onToggleMute}>
                    {isMuted ? 'UNMUTE' : 'MUTE'}
                </button>
                <button className={`${styles.btn} ${styles.btnSmall}`} onClick={onTogglePause}>
                    {isCountdownPaused ? 'RESUME' : 'PAUSE'}
                </button>
                <button className={`${styles.btn} ${styles.btnSmall}`} onClick={onRestart}>
                    RESTART
                </button>
            </div>

            <hr className={styles.hudDivider} style={{ marginTop: '10px' }} />
            <div className={styles.hudRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                <input type="password" value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} placeholder="Enter Gemini API Key..." className={styles.apiKeyInput} />
                <button className={`${styles.btn} ${styles.btnSmall}`} onClick={onAnalyze} style={{ marginTop: 0 }}>
                    ANALYZE BIODATA
                </button>
            </div>
        </div>
    );
}
