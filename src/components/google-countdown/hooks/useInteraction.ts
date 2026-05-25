import { useCallback, useRef } from 'react';
import * as THREE from 'three';

import type { AudioProfile, SessionData } from './useAudioEngine';

const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 900 || /Mobi|Android/i.test(navigator.userAgent));

const gridCols = isMobile ? 280 : 300;
const gridRows = isMobile ? 140 : 150;
const stalksPerCell = 4;
const totalCount = gridCols * gridRows * stalksPerCell;
const groundWidth = 180;
const groundHeight = 90;
const maxInteractiveDust = isMobile ? 1000 : 3000;

type UseInteractionProps = {
    cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
    positions: React.MutableRefObject<Float32Array>;
    bendsRef: React.MutableRefObject<Float32Array>;
    illuminationRef: React.MutableRefObject<Float32Array>;
    startScalesRef: React.MutableRefObject<Float32Array>;
    targetScalesRef: React.MutableRefObject<Float32Array>;
    delaysRef: React.MutableRefObject<Float32Array>;
    shaderUniformsRef: React.MutableRefObject<any>;
    stalkMeshRef: React.MutableRefObject<THREE.InstancedMesh | null>;
    activeDustPositionsRef: React.MutableRefObject<Float32Array>;
    activeDustVelocitiesRef: React.MutableRefObject<Float32Array>;
    activeDustLifetimesRef: React.MutableRefObject<Float32Array>;
    activeDustIndexRef: React.MutableRefObject<number>;
    interactiveDustRef: React.MutableRefObject<THREE.Points | null>;
    audioEnabled: boolean;
    currentAudioProfile: AudioProfile | null;
    playPluck: (frequency: number, brightness: number, waveformType: OscillatorType, panValue: number, duration: number) => void;
    playDustSound: (intensity: number, speed: number, panValue: number) => void;
    sessionDataRef: React.MutableRefObject<SessionData>;
    transitionStartTime: React.MutableRefObject<number>;
};

export function useInteraction(props: UseInteractionProps) {
    const {
        cameraRef,
        positions,
        bendsRef,
        illuminationRef,
        startScalesRef,
        targetScalesRef,
        delaysRef,
        shaderUniformsRef,
        stalkMeshRef,
        activeDustPositionsRef,
        activeDustVelocitiesRef,
        activeDustLifetimesRef,
        activeDustIndexRef,
        interactiveDustRef,
        audioEnabled,
        currentAudioProfile,
        playPluck,
        playDustSound,
        sessionDataRef,
        transitionStartTime,
    } = props;

    const mouse = useRef(new THREE.Vector2(-1000, -1000));
    const mouseWorld = useRef(new THREE.Vector3());
    const lastMouseWorld = useRef(new THREE.Vector3());
    const raycaster = useRef(new THREE.Raycaster());
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
    const mouseSpeed = useRef(0);
    const hasActiveBends = useRef(false);
    const hasActiveIllum = useRef(false);

    const updateMousePosition = useCallback(
        (clientX: number, clientY: number) => {
            if (!cameraRef.current) return;

            mouse.current.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -(clientY / window.innerHeight) * 2 + 1;
            raycaster.current.setFromCamera(mouse.current, cameraRef.current);
            raycaster.current.ray.intersectPlane(plane.current, mouseWorld.current);
        },
        [cameraRef],
    );

    const updateInteraction = useCallback(
        (now: number, delta: number) => {
            if (!cameraRef.current) return;

            const elapsed = now - transitionStartTime.current;

            // Update shader uniforms
            shaderUniformsRef.current.uTime.value = elapsed;
            shaderUniformsRef.current.uNow.value = now;

            // Calculate mouse speed
            mouseSpeed.current = mouseWorld.current.distanceTo(lastMouseWorld.current);
            if (mouseSpeed.current > sessionDataRef.current.maxVelocity && isFinite(mouseSpeed.current)) {
                sessionDataRef.current.maxVelocity = mouseSpeed.current;
            }

            // Decay bends and illumination
            let needsBendUpdate = false;
            let needsIllumUpdate = false;

            if (hasActiveBends.current || hasActiveIllum.current) {
                let anyBendActive = false;
                let anyIllumActive = false;

                for (let i = 0; i < totalCount; i++) {
                    if (hasActiveBends.current) {
                        const bx = bendsRef.current[i * 2];
                        const by = bendsRef.current[i * 2 + 1];
                        if (bx !== 0 || by !== 0) {
                            bendsRef.current[i * 2] = Math.abs(bx) < 0.001 ? 0 : bx * 0.85;
                            bendsRef.current[i * 2 + 1] = Math.abs(by) < 0.001 ? 0 : by * 0.85;
                            needsBendUpdate = true;
                            anyBendActive = true;
                        }
                    }
                    if (hasActiveIllum.current) {
                        if (illuminationRef.current[i] > 0) {
                            illuminationRef.current[i] -= 0.015;
                            if (illuminationRef.current[i] <= 0) illuminationRef.current[i] = 0;
                            needsIllumUpdate = true;
                            anyIllumActive = true;
                        }
                    }
                }
                hasActiveBends.current = anyBendActive;
                hasActiveIllum.current = anyIllumActive;
            }

            // Grid-based mouse interaction
            const interactionRadius = 8.5;
            const interactionRadSq = interactionRadius * interactionRadius;

            const cellWidth = groundWidth / gridCols;
            const cellHeight = groundHeight / gridRows;
            const mouseCellC = (mouseWorld.current.x / groundWidth + 0.5) * gridCols;
            const mouseCellR = (-mouseWorld.current.y / groundHeight + 0.5) * gridRows;

            const cellRadiusC = Math.ceil(interactionRadius / cellWidth) + 1;
            const cellRadiusR = Math.ceil(interactionRadius / cellHeight) + 1;

            const minR = Math.max(0, Math.floor(mouseCellR - cellRadiusR));
            const maxR = Math.min(gridRows - 1, Math.ceil(mouseCellR + cellRadiusR));
            const minC = Math.max(0, Math.floor(mouseCellC - cellRadiusC));
            const maxC = Math.min(gridCols - 1, Math.ceil(mouseCellC + cellRadiusC));

            let totalForce = 0;
            let weightedAvgX = 0;
            let weightedAvgY = 0;
            let totalWeight = 0;

            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    const cellBaseIdx = (r * gridCols + c) * stalksPerCell;
                    for (let s = 0; s < stalksPerCell; s++) {
                        const i = cellBaseIdx + s;
                        if (i >= totalCount) break;

                        const px = positions.current[i * 3];
                        const py = positions.current[i * 3 + 1];

                        const dx = px - mouseWorld.current.x;
                        const dy = py - mouseWorld.current.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq >= interactionRadSq) continue;

                        const dist = Math.sqrt(distSq);
                        const force = Math.pow((interactionRadius - dist) / interactionRadius, 2);
                        const targetBendX = (dy / dist) * force * 1.2;
                        const targetBendY = -(dx / dist) * force * 1.2;

                        if (force > 0.1) sessionDataRef.current.totalInteractions++;

                        bendsRef.current[i * 2] += targetBendX * 0.15;
                        bendsRef.current[i * 2 + 1] += targetBendY * 0.15;
                        needsBendUpdate = true;
                        hasActiveBends.current = true;

                        const progress = Math.min(1, Math.max(0, (elapsed - delaysRef.current[i]) / 2000));
                        const easeFactor = 1 - Math.pow(1 - progress, 3);
                        const displayHeight = (startScalesRef.current[i] + (targetScalesRef.current[i] - startScalesRef.current[i]) * easeFactor) * shaderUniformsRef.current.uHeightFactor.value;

                        if (displayHeight > 0.1) {
                            const heightWeight = Math.pow(displayHeight, 2.5);
                            const weightedForce = force * heightWeight;

                            totalForce += weightedForce;
                            weightedAvgX += px * weightedForce;
                            weightedAvgY += py * weightedForce;
                            totalWeight += weightedForce;

                            if (displayHeight > 0.5) {
                                illuminationRef.current[i] = Math.min(1.0, illuminationRef.current[i] + force * 1.5);
                                needsIllumUpdate = true;
                                hasActiveIllum.current = true;
                            }
                        }
                    }
                }
            }

            if (needsBendUpdate && stalkMeshRef.current) {
                stalkMeshRef.current.geometry.attributes.aBend.needsUpdate = true;
            }
            if (needsIllumUpdate && stalkMeshRef.current) {
                stalkMeshRef.current.geometry.attributes.aIllumination.needsUpdate = true;
            }

            // Audio interaction
            if (audioEnabled && currentAudioProfile && totalWeight > 0) {
                const avgX = weightedAvgX / totalWeight;
                const avgY = weightedAvgY / totalWeight;

                const xNorm = Math.max(0, Math.min(1, (avgX + 25) / 50));
                const noteIndex = Math.floor(xNorm * (currentAudioProfile.scale.length - 1));

                const brushIntensity = Math.min(mouseSpeed.current * (totalForce / 350.0) * 400, isMobile ? 8 : 15);

                if (brushIntensity > 0.05) {
                    let hits = Math.floor(brushIntensity * 0.25);
                    if (Math.random() < brushIntensity % 1) hits++;
                    hits = Math.min(hits, isMobile ? 3 : 6);

                    for (let h = 0; h < hits; h++) {
                        const pluckIndex = Math.max(0, Math.min(currentAudioProfile.scale.length - 1, noteIndex + Math.floor((Math.random() - 0.5) * 5)));
                        const brightness = 800 + (Math.max(0, avgY + 25) / 50) * 4000 + Math.random() * 2000 + mouseSpeed.current * 12000;
                        const panValue = xNorm * 2 - 1;

                        sessionDataRef.current.notesPlayed++;

                        const cappedSpeed = Math.min(mouseSpeed.current, 0.5);
                        const duration = Math.max(0.1, 0.8 - cappedSpeed * 0.3);

                        playPluck(currentAudioProfile.scale[pluckIndex], brightness, currentAudioProfile.pluck, panValue, duration);
                    }

                    // Spawn dust
                    const dustToSpawn = Math.min(60, Math.floor(brushIntensity * 2.5));
                    if (dustToSpawn > 0) {
                        for (let d = 0; d < dustToSpawn; d++) {
                            const idx = activeDustIndexRef.current % maxInteractiveDust;
                            activeDustPositionsRef.current[idx * 3] = avgX + (Math.random() - 0.5) * 4.0;
                            activeDustPositionsRef.current[idx * 3 + 1] = avgY + (Math.random() - 0.5) * 4.0;
                            activeDustPositionsRef.current[idx * 3 + 2] = 5 + Math.random() * 4;

                            activeDustVelocitiesRef.current[idx * 3] = (mouseWorld.current.x - lastMouseWorld.current.x) * 1.5 + (Math.random() - 0.5) * 2.5;
                            activeDustVelocitiesRef.current[idx * 3 + 1] = (mouseWorld.current.y - lastMouseWorld.current.y) * 1.5 + (Math.random() - 0.5) * 2.5;
                            activeDustVelocitiesRef.current[idx * 3 + 2] = Math.random() * 0.8 + 0.4;

                            activeDustLifetimesRef.current[idx] = 1.0 + Math.random() * 1.2;
                            activeDustIndexRef.current++;
                        }
                        if (interactiveDustRef.current) {
                            interactiveDustRef.current.geometry.attributes.position.needsUpdate = true;
                        }
                    }

                    const panValue = xNorm * 2 - 1;
                    if (Math.random() < 0.5) playDustSound(brushIntensity * 0.5, mouseSpeed.current, panValue);
                }
            }

            // Update dust particles
            if (interactiveDustRef.current) {
                const pos = activeDustPositionsRef.current;
                let needsDustUpdate = false;
                for (let i = 0; i < maxInteractiveDust; i++) {
                    if (activeDustLifetimesRef.current[i] > 0) {
                        pos[i * 3] += activeDustVelocitiesRef.current[i * 3];
                        pos[i * 3 + 1] += activeDustVelocitiesRef.current[i * 3 + 1];
                        pos[i * 3 + 2] += activeDustVelocitiesRef.current[i * 3 + 2];
                        activeDustLifetimesRef.current[i] -= delta * 0.001;

                        activeDustVelocitiesRef.current[i * 3] *= 0.95;
                        activeDustVelocitiesRef.current[i * 3 + 1] *= 0.95;
                        activeDustVelocitiesRef.current[i * 3 + 2] *= 0.98;

                        if (activeDustLifetimesRef.current[i] <= 0) {
                            pos[i * 3] = 9999;
                        }
                        needsDustUpdate = true;
                    }
                }
                if (needsDustUpdate) {
                    interactiveDustRef.current.geometry.attributes.position.needsUpdate = true;
                }
            }

            lastMouseWorld.current.copy(mouseWorld.current);
        },
        [
            cameraRef,
            positions,
            bendsRef,
            illuminationRef,
            startScalesRef,
            targetScalesRef,
            delaysRef,
            shaderUniformsRef,
            stalkMeshRef,
            activeDustPositionsRef,
            activeDustVelocitiesRef,
            activeDustLifetimesRef,
            activeDustIndexRef,
            interactiveDustRef,
            audioEnabled,
            currentAudioProfile,
            playPluck,
            playDustSound,
            sessionDataRef,
            transitionStartTime,
        ],
    );

    return {
        mouseWorld,
        lastMouseWorld,
        mouseSpeed,
        updateMousePosition,
        updateInteraction,
    };
}
