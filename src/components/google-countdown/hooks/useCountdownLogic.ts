import { useCallback, useRef, useState } from 'react';
import type * as THREE from 'three';

import type { AudioProfile, SessionData } from './useAudioEngine';

const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 900 || /Mobi|Android/i.test(navigator.userAgent));
const canvasSize = 512;

type UseCountdownLogicProps = {
    stalkMeshRef: React.MutableRefObject<THREE.InstancedMesh | null>;
    tipMeshRef: React.MutableRefObject<THREE.InstancedMesh | null>;
    startScalesRef: React.MutableRefObject<Float32Array>;
    targetScalesRef: React.MutableRefObject<Float32Array>;
    delaysRef: React.MutableRefObject<Float32Array>;
    bendsRef: React.MutableRefObject<Float32Array>;
    illuminationRef: React.MutableRefObject<Float32Array>;
    colorState: React.MutableRefObject<{
        colorGrnd1: THREE.Color;
        colorGrnd2: THREE.Color;
        colorEdge: THREE.Color;
        colorPeak: THREE.Color;
        targetColorGrnd1: THREE.Color;
        targetColorGrnd2: THREE.Color;
        targetColorEdge: THREE.Color;
        targetColorPeak: THREE.Color;
    }>;
    fadeOutAudio: () => void;
    sessionDataRef: React.MutableRefObject<SessionData>;
};

const audioProfiles: Record<number, AudioProfile> = {
    10: {
        name: 'C Major Pent.',
        scale: [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0],
        drone: 'triangle',
        pluck: 'sine',
        colors: { g1: '#033f35', g2: '#339eec', edge: '#ff5500', peak: '#ffcc00' },
    },
    9: {
        name: 'A Minor Pent.',
        scale: [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0],
        drone: 'sine',
        pluck: 'triangle',
        colors: { g1: '#1a5b1a', g2: '#0af00a', edge: '#00bfff', peak: '#c800ff' },
    },
    8: {
        name: 'F Major Pent.',
        scale: [174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25, 587.33],
        drone: 'triangle',
        pluck: 'sine',
        colors: { g1: '#1a0033', g2: '#a142ff', edge: '#88ff00', peak: '#00ffe1' },
    },
    7: {
        name: 'D Minor Pent.',
        scale: [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25],
        drone: 'square',
        pluck: 'sine',
        colors: { g1: '#004242', g2: '#00dbdb', edge: '#ff0033', peak: '#ff8866' },
    },
    6: {
        name: 'G Major Pent.',
        scale: [196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25],
        drone: 'sine',
        pluck: 'triangle',
        colors: { g1: '#33001a', g2: '#fa007d', edge: '#1100ff', peak: '#00ffb3' },
    },
    5: {
        name: 'E Minor Pent.',
        scale: [164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33],
        drone: 'triangle',
        pluck: 'sine',
        colors: { g1: '#331100', g2: '#ff5500', edge: '#6600ff', peak: '#00bfff' },
    },
    4: {
        name: 'A Minor Pent. 2',
        scale: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99],
        drone: 'sine',
        pluck: 'square',
        colors: { g1: '#1c0033', g2: '#004cff', edge: '#9900ff', peak: '#ffbdf2' },
    },
    3: {
        name: 'C Major Pent. 2',
        scale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0],
        drone: 'triangle',
        pluck: 'sine',
        colors: { g1: '#140033', g2: '#660014', edge: '#ff5900', peak: '#d4ff00' },
    },
    2: {
        name: 'F Major Pent. 2',
        scale: [349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 880.0, 1046.5, 1174.66],
        drone: 'sine',
        pluck: 'triangle',
        colors: { g1: '#330000', g2: '#ff0000', edge: '#00ffbf', peak: '#e5ffff' },
    },
    1: {
        name: 'C Major Pent. 3',
        scale: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0],
        drone: 'triangle',
        pluck: 'sine',
        colors: { g1: '#050505', g2: '#1100ff', edge: '#fbff00', peak: '#fb00ff' },
    },
};

const gridCols = isMobile ? 280 : 300;
const gridRows = isMobile ? 140 : 150;
const stalksPerCell = 4;
const totalCount = gridCols * gridRows * stalksPerCell;
const groundWidth = 180;
const groundHeight = 90;

export function useCountdownLogic(props: UseCountdownLogicProps) {
    const { stalkMeshRef, tipMeshRef, startScalesRef, targetScalesRef, delaysRef, bendsRef, illuminationRef, colorState, fadeOutAudio, sessionDataRef } = props;

    const [currentNumber, setCurrentNumber] = useState(10);
    const [isCountdownPaused, setIsCountdownPaused] = useState(false);
    const [isSequenceComplete, setIsSequenceComplete] = useState(false);
    const [animationStarted, setAnimationStarted] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

    const transitionStartTime = useRef(0);
    const offCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const offCtxRef = useRef<CanvasRenderingContext2D | null>(null);

    const startTransition = useCallback(
        (num: number) => {
            if (typeof window === 'undefined') return;

            if (!offCanvasRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = canvasSize;
                canvas.height = canvasSize;
                offCanvasRef.current = canvas;
                offCtxRef.current = canvas.getContext('2d', { willReadFrequently: true });
            }

            const ctx = offCtxRef.current;
            if (!ctx) return;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            const fontSize = num === 10 ? 280 : 380;
            ctx.filter = 'blur(16px)';
            ctx.fillStyle = '#0000ff';
            ctx.font = `bold ${fontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(num.toString(), canvasSize / 2, canvasSize / 2 + 20);
            ctx.fillText(num.toString(), canvasSize / 2, canvasSize / 2 + 20);

            ctx.filter = 'none';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 14;
            ctx.strokeText(num.toString(), canvasSize / 2, canvasSize / 2 + 20);

            const imgData = ctx.getImageData(0, 0, canvasSize, canvasSize).data;

            const currentAudioProfile = audioProfiles[num];

            // Update target colors
            if (currentAudioProfile.colors) {
                colorState.current.targetColorGrnd1.set(currentAudioProfile.colors.g1);
                colorState.current.targetColorGrnd2.set(currentAudioProfile.colors.g2);
                colorState.current.targetColorEdge.set(currentAudioProfile.colors.edge);
                colorState.current.targetColorPeak.set(currentAudioProfile.colors.peak);

                sessionDataRef.current.dominantColors.add(currentAudioProfile.colors.peak);
            }

            let idx = 0;
            const aspect = window.innerWidth / window.innerHeight;
            let textRegionSize = 65;
            if (aspect < 0.6) textRegionSize = 25;
            else if (aspect < 0.9) textRegionSize = 40;

            const prevElapsed = performance.now() - transitionStartTime.current;

            for (let r = 0; r < gridRows; r++) {
                for (let c = 0; c < gridCols; c++) {
                    const worldX = (c / gridCols - 0.5) * groundWidth;
                    const worldY = -(r / gridRows - 0.5) * groundHeight;

                    const canvasX = (worldX / textRegionSize + 0.5) * canvasSize;
                    const canvasY = (-worldY / textRegionSize + 0.5) * canvasSize;

                    let isVein = false;
                    let haloIntensity = 0;

                    if (canvasX >= 0 && canvasX < canvasSize && canvasY >= 0 && canvasY < canvasSize) {
                        const pixelIndex = (Math.floor(canvasY) * canvasSize + Math.floor(canvasX)) * 4;
                        const rVal = imgData[pixelIndex];
                        const bVal = imgData[pixelIndex + 2];

                        isVein = rVal > 100;
                        haloIntensity = bVal / 255;
                    }

                    const dx = worldX;
                    const dy = worldY;
                    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
                    const baseDelay = distFromCenter * 4.0;

                    for (let s = 0; s < stalksPerCell; s++) {
                        if (idx >= totalCount) break;

                        const progress = Math.min(1, Math.max(0, (prevElapsed - delaysRef.current[idx]) / 2000));
                        const easeFactor = 1 - Math.pow(1 - progress, 3);
                        const currentHeight = startScalesRef.current[idx] + (targetScalesRef.current[idx] - startScalesRef.current[idx]) * easeFactor;
                        startScalesRef.current[idx] = currentHeight;

                        let targetHeight = 0;

                        if (isVein) {
                            targetHeight = 4.8 + Math.random() * 1.5;
                        } else if (haloIntensity > 0.02) {
                            const t = Math.pow(haloIntensity, 0.4);
                            targetHeight = 0.5 + t * 4.0 + Math.random() * 0.8;

                            if (haloIntensity < 0.08 && Math.random() > 0.3) {
                                targetHeight *= 0.35;
                            }
                        } else {
                            targetHeight = 0.6 + Math.random() * 0.6;
                            if (currentHeight > 1.0) {
                                targetHeight = 0.8 + Math.random() * 0.6;
                            }
                        }

                        targetScalesRef.current[idx] = targetHeight;
                        delaysRef.current[idx] = baseDelay + Math.random() * 500;
                        idx++;
                    }
                }
            }

            if (stalkMeshRef.current && tipMeshRef.current) {
                stalkMeshRef.current.geometry.attributes.aStartScale.needsUpdate = true;
                stalkMeshRef.current.geometry.attributes.aTargetScale.needsUpdate = true;
                stalkMeshRef.current.geometry.attributes.aDelay.needsUpdate = true;
            }

            transitionStartTime.current = performance.now();
        },
        [stalkMeshRef, tipMeshRef, startScalesRef, targetScalesRef, delaysRef, colorState, sessionDataRef],
    );

    const restartAnimation = useCallback(() => {
        setCurrentNumber(10);
        setIsSequenceComplete(false);
        setIsCountdownPaused(false);

        sessionDataRef.current = {
            totalInteractions: 0,
            maxVelocity: 0,
            avgResonance: 0,
            resonanceSamples: 0,
            dominantColors: new Set(),
            notesPlayed: 0,
        };

        for (let i = 0; i < totalCount; i++) {
            startScalesRef.current[i] = 0;
            targetScalesRef.current[i] = 0;
            bendsRef.current[i * 2] = 0;
            bendsRef.current[i * 2 + 1] = 0;
            illuminationRef.current[i] = 0;
        }

        if (stalkMeshRef.current && tipMeshRef.current) {
            stalkMeshRef.current.geometry.attributes.aStartScale.needsUpdate = true;
            stalkMeshRef.current.geometry.attributes.aTargetScale.needsUpdate = true;
            stalkMeshRef.current.geometry.attributes.aBend.needsUpdate = true;
            stalkMeshRef.current.geometry.attributes.aIllumination.needsUpdate = true;
        }

        startTransition(10);
    }, [stalkMeshRef, tipMeshRef, startScalesRef, targetScalesRef, bendsRef, illuminationRef, startTransition, sessionDataRef]);

    const triggerEndSequence = useCallback(() => {
        setIsSequenceComplete(true);
        fadeOutAudio();
    }, [fadeOutAudio]);

    return {
        currentNumber,
        setCurrentNumber,
        isCountdownPaused,
        setIsCountdownPaused,
        isSequenceComplete,
        animationStarted,
        setAnimationStarted,
        isPreview,
        setIsPreview,
        transitionStartTime,
        startTransition,
        restartAnimation,
        triggerEndSequence,
    };
}
