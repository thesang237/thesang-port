import styles from './AnalysisModal.module.css';

import { useState } from 'react';

import type { AudioProfile, SessionData } from './hooks/useAudioEngine';

type AnalysisModalProps = {
    show: boolean;
    onClose: () => void;
    apiKey: string;
    sessionDataRef: React.MutableRefObject<SessionData>;
    currentNumber: number;
    currentAudioProfile: AudioProfile | null;
};

export function AnalysisModal({ show, onClose, apiKey, sessionDataRef, currentNumber, currentAudioProfile }: AnalysisModalProps) {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('Awaiting data from the neural network...');

    const handleAnalyze = async () => {
        if (!apiKey.trim()) {
            alert('Please enter a Gemini API Key to run the analysis.');
            return;
        }

        setLoading(true);

        const avgRes = sessionDataRef.current.resonanceSamples > 0 ? (sessionDataRef.current.avgResonance / sessionDataRef.current.resonanceSamples).toFixed(3) : '0';

        const prompt = `
      Act as a Xenobiologist analyzing a newly discovered, sound-reactive synthetic lifeform called a "Symbiont".
      I have just completed an interaction session with a field of these organisms.

      Here is the telemetry data from my interaction session:
      - Current Generation/Organism Phase: ${currentNumber} (started at 10, counts down to 1)
      - Current Audio Scale: ${currentAudioProfile ? currentAudioProfile.name : 'Unknown'}
      - Total Micro-Interactions (Spores Disturbed): ${sessionDataRef.current.totalInteractions}
      - Maximum Interaction Velocity (User Speed): ${sessionDataRef.current.maxVelocity.toFixed(2)}
      - Average Ecosystem Resonance: ${avgRes}
      - Total Sonic Events Triggered: ${sessionDataRef.current.notesPlayed}
      - Observed Dominant Peak Colors: ${Array.from(sessionDataRef.current.dominantColors).join(', ')}

      Based on this specific data, provide a 2-paragraph scientific field report.
      Paragraph 1: Describe the nature of the interaction. Was it chaotic, gentle, highly musical, or sparse? Base this on the velocity, interactions, and notes played.
      Paragraph 2: Speculate on the emotional or biological state of the Symbiont ecosystem based on the colors, resonance, and audio scale.
      Keep the tone analytical, slightly awe-struck, and firmly grounded in a sci-fi xenobiology aesthetic. Do not use markdown formatting.
    `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: {
                parts: [{ text: 'You are a field researcher documenting an alien, musical ecosystem.' }],
            },
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error.message || 'API Error');
            }

            const candidate = result.candidates?.[0];
            if (candidate && candidate.content?.parts?.[0]?.text) {
                setContent(candidate.content.parts[0].text);
            } else {
                setContent("Inconclusive data received from the neural link. The organism's patterns remain a mystery.");
            }
        } catch (error: any) {
            console.error('Gemini API Error:', error);
            setContent(`Error connecting to neural network: ${error.message}. Please check your API key and connection.`);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className={styles.analysisModal} style={{ opacity: show ? 1 : 0 }}>
            <div className={`${styles.glassPanel} ${styles.modalContent}`}>
                <button className={styles.closeBtn} onClick={onClose}>
                    &times;
                </button>
                <h2>SYMBIOTIC ANALYSIS</h2>
                <div className={styles.analysisContent}>{content}</div>
                {loading && <div className={styles.analysisLoading}>PROCESSING BIOSIGNALS...</div>}
                {!loading && (
                    <button className={styles.btn} onClick={handleAnalyze} style={{ marginTop: '20px' }}>
                        RUN ANALYSIS
                    </button>
                )}
            </div>
        </div>
    );
}
