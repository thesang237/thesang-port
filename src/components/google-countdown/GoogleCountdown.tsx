'use client';

import styles from './GoogleCountdown.module.css';

import { useEffect, useRef, useState } from 'react';

import { useAudioEngine } from './hooks/useAudioEngine';
import { useCountdownLogic } from './hooks/useCountdownLogic';
import { useInteraction } from './hooks/useInteraction';
import { useThreeScene } from './hooks/useThreeScene';
import { AnalysisModal } from './AnalysisModal';
import { AudioHUD } from './AudioHUD';
import { ControlPanel } from './ControlPanel';
import { FadeOverlay } from './FadeOverlay';
import { IntroModal } from './IntroModal';
import { MobileMenuButton } from './MobileMenuButton';

const DURATION_PER_NUMBER = 6000;

export function GoogleCountdown() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showIntro, setShowIntro] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [apiKey, setApiKey] = useState('');

    // Initialize Three.js scene
    const {
        sceneRef,
        cameraRef,
        rendererRef,
        stalkMeshRef,
        tipMeshRef,
        interactiveDustRef,
        shaderUniformsRef,
        positions,
        startScalesRef,
        targetScalesRef,
        illuminationRef,
        bendsRef,
        delaysRef,
        activeDustPositionsRef,
        activeDustVelocitiesRef,
        activeDustLifetimesRef,
        activeDustIndexRef,
        colorState,
        initScene,
        cleanupScene,
    } = useThreeScene();

    // Initialize audio engine
    const { audioEnabled, isMuted, setIsMuted, currentAudioProfile, setCurrentAudioProfile, sessionDataRef, audioProfiles, initAudio, playPluck, playDustSound, fadeOutAudio, activePlucks } =
        useAudioEngine();

    // Countdown logic
    const {
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
    } = useCountdownLogic({
        stalkMeshRef,
        tipMeshRef,
        startScalesRef,
        targetScalesRef,
        delaysRef,
        bendsRef,
        illuminationRef,
        colorState,
        fadeOutAudio,
        sessionDataRef,
    });

    // Mouse/touch interaction
    const { mouseWorld, lastMouseWorld, mouseSpeed, updateMousePosition, updateInteraction } = useInteraction({
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
    });

    // Initialize scene on mount
    useEffect(() => {
        if (!containerRef.current) return;

        initScene(containerRef.current);
        setAnimationStarted(true);

        return () => {
            cleanupScene();
        };
    }, [initScene, cleanupScene, setAnimationStarted]);

    // Animation loop with countdown logic
    useEffect(() => {
        if (!animationStarted || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        let animationFrameId: number;
        let lastFrameTime = performance.now();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const now = performance.now();
            const delta = now - lastFrameTime;
            lastFrameTime = now;

            const elapsed = now - transitionStartTime.current;

            // Countdown logic
            if (elapsed > DURATION_PER_NUMBER && !isCountdownPaused && !isPreview && !isSequenceComplete) {
                if (currentNumber > 1) {
                    const nextNumber = currentNumber - 1;
                    setCurrentNumber(nextNumber);
                    setCurrentAudioProfile(audioProfiles[nextNumber]);
                    startTransition(nextNumber);
                } else if (currentNumber === 1) {
                    triggerEndSequence();
                }
            }

            // Update interaction
            updateInteraction(now, delta);

            // Render
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };

        animate();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [
        animationStarted,
        rendererRef,
        sceneRef,
        cameraRef,
        updateInteraction,
        currentNumber,
        setCurrentNumber,
        isCountdownPaused,
        isPreview,
        isSequenceComplete,
        transitionStartTime,
        startTransition,
        triggerEndSequence,
        setCurrentAudioProfile,
        audioProfiles,
    ]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current) return;

            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [cameraRef, rendererRef]);

    // Handle mouse/touch events
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            updateMousePosition(e.clientX, e.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
                lastMouseWorld.current.copy(mouseWorld.current);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
        };
    }, [updateMousePosition, mouseWorld, lastMouseWorld]);

    const handleStartSequence = () => {
        setShowIntro(false);
        initAudio();
        setIsPreview(false);
        setCurrentAudioProfile(audioProfiles[10]);
        startTransition(10);
    };

    const handleRestart = () => {
        restartAnimation();
        setCurrentAudioProfile(audioProfiles[10]);
    };

    const handleTogglePause = () => {
        setIsCountdownPaused(!isCountdownPaused);
    };

    const handleToggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div ref={containerRef} className={`${styles.container} ${menuOpen ? styles.menuOpen : ''}`}>
            <IntroModal show={showIntro} onStart={handleStartSequence} />

            <MobileMenuButton visible={!showIntro} menuOpen={menuOpen} onToggle={() => setMenuOpen(!menuOpen)} />

            <ControlPanel visible={!showIntro} colorState={colorState} shaderUniformsRef={shaderUniformsRef} cameraRef={cameraRef} />

            <AudioHUD
                visible={!showIntro}
                currentNumber={currentNumber}
                currentAudioProfile={currentAudioProfile}
                shaderUniformsRef={shaderUniformsRef}
                mouseSpeed={mouseSpeed}
                activePlucks={activePlucks}
                activeDustCount={0}
                isMuted={isMuted}
                isCountdownPaused={isCountdownPaused}
                onToggleMute={handleToggleMute}
                onTogglePause={handleTogglePause}
                onRestart={handleRestart}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                onAnalyze={() => setShowAnalysis(true)}
            />

            <FadeOverlay active={isSequenceComplete} onRestart={handleRestart} />

            <AnalysisModal
                show={showAnalysis}
                onClose={() => setShowAnalysis(false)}
                apiKey={apiKey}
                sessionDataRef={sessionDataRef}
                currentNumber={currentNumber}
                currentAudioProfile={currentAudioProfile}
            />
        </div>
    );
}
