import { useCallback, useRef, useState } from 'react';

const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 900 || /Mobi|Android/i.test(navigator.userAgent));

export type AudioProfile = {
    name: string;
    scale: number[];
    drone: OscillatorType;
    pluck: OscillatorType;
    colors: {
        g1: string;
        g2: string;
        edge: string;
        peak: string;
    };
};

export type SessionData = {
    totalInteractions: number;
    maxVelocity: number;
    avgResonance: number;
    resonanceSamples: number;
    dominantColors: Set<string>;
    notesPlayed: number;
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

const maxVoices = isMobile ? 14 : 32;

export function useAudioEngine() {
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentAudioProfile, setCurrentAudioProfile] = useState<AudioProfile | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const masterDelayRef = useRef<DelayNode | null>(null);
    const delayFeedbackRef = useRef<GainNode | null>(null);
    const droneOscRef = useRef<OscillatorNode | null>(null);
    const droneOsc2Ref = useRef<OscillatorNode | null>(null);
    const droneGainRef = useRef<GainNode | null>(null);
    const droneFilterRef = useRef<BiquadFilterNode | null>(null);
    const activePlucksRef = useRef(0);
    const [activePlucks, setActivePlucks] = useState(0);

    const sessionDataRef = useRef<SessionData>({
        totalInteractions: 0,
        maxVelocity: 0,
        avgResonance: 0,
        resonanceSamples: 0,
        dominantColors: new Set(),
        notesPlayed: 0,
    });

    const initAudio = useCallback(() => {
        if (audioCtxRef.current) {
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            return;
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Master compressor
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 12;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.25;
        compressor.connect(audioCtx.destination);

        // High-pass filter
        const masterHighpass = audioCtx.createBiquadFilter();
        masterHighpass.type = 'highpass';
        masterHighpass.frequency.value = isMobile ? 180 : 120;
        masterHighpass.Q.value = 0.7;
        masterHighpass.connect(compressor);

        // Master gain
        const masterGain = audioCtx.createGain();
        masterGain.gain.value = isMobile ? 0.4 : 0.5;
        masterGain.connect(masterHighpass);
        masterGainRef.current = masterGain;

        // Delay
        const masterDelay = audioCtx.createDelay();
        masterDelay.delayTime.value = 0.85;
        masterDelayRef.current = masterDelay;

        const delayFeedback = audioCtx.createGain();
        delayFeedback.gain.value = 0.75;
        delayFeedbackRef.current = delayFeedback;

        const delayFilter = audioCtx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 800;

        masterDelay.connect(delayFeedback);
        delayFeedback.connect(delayFilter);
        delayFilter.connect(masterDelay);
        masterDelay.connect(masterGain);

        // Drone oscillators
        const droneOsc = audioCtx.createOscillator();
        droneOsc.type = 'sine';
        const oscGain1 = audioCtx.createGain();
        oscGain1.gain.value = 0.5;

        const droneOsc2 = audioCtx.createOscillator();
        droneOsc2.type = 'triangle';
        droneOsc2.detune.value = 15;
        const oscGain2 = audioCtx.createGain();
        oscGain2.gain.value = 0.15;

        const droneGain = audioCtx.createGain();
        droneGain.gain.value = 0;
        droneGainRef.current = droneGain;

        const droneFilter = audioCtx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 250;
        droneFilterRef.current = droneFilter;

        droneOsc.connect(oscGain1);
        oscGain1.connect(droneFilter);
        droneOsc2.connect(oscGain2);
        oscGain2.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(masterGain);
        droneGain.connect(masterDelay);

        droneOsc.start();
        droneOsc2.start();

        droneOscRef.current = droneOsc;
        droneOsc2Ref.current = droneOsc2;

        setAudioEnabled(true);
    }, []);

    const playPluck = useCallback(
        (frequency: number, brightness: number, waveformType: OscillatorType, panValue = 0, duration = 2.5) => {
            if (!audioEnabled || activePlucksRef.current >= maxVoices || isMuted || !audioCtxRef.current || !masterGainRef.current || !masterDelayRef.current) return;

            activePlucksRef.current++;
            setActivePlucks(activePlucksRef.current);

            const audioCtx = audioCtxRef.current;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            let panner: StereoPannerNode | GainNode;
            if (audioCtx.createStereoPanner) {
                panner = audioCtx.createStereoPanner();
                (panner as StereoPannerNode).pan.value = panValue;
            } else {
                panner = audioCtx.createGain();
            }

            osc.type = 'sine';

            const finalFrequency = duration < 0.4 && Math.random() > 0.6 ? frequency * 2 : frequency;
            osc.frequency.value = finalFrequency;

            filter.type = 'lowpass';
            const clampedBrightness = Math.min(brightness, isMobile ? 6000 : 12000);
            filter.frequency.setValueAtTime(clampedBrightness * 0.8, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(Math.max(100, clampedBrightness * 0.1), audioCtx.currentTime + duration * 1.5);
            filter.Q.value = 1.5;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(panner);
            panner.connect(masterDelayRef.current);
            panner.connect(masterGainRef.current);

            osc.start();

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            const peakGain = Math.min(0.035, 0.02 + brightness / 40000);
            gain.gain.linearRampToValueAtTime(peakGain, audioCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration * 1.5);

            osc.stop(audioCtx.currentTime + duration * 1.5);

            osc.onended = () => {
                activePlucksRef.current--;
                setActivePlucks(activePlucksRef.current);
                osc.disconnect();
                filter.disconnect();
                gain.disconnect();
                panner.disconnect();
            };
        },
        [audioEnabled, isMuted],
    );

    const playDustSound = useCallback(
        (intensity: number, speed: number, panValue: number) => {
            if (!audioEnabled || activePlucksRef.current >= maxVoices || isMuted || !audioCtxRef.current || !masterGainRef.current || !masterDelayRef.current) return;
            if (Math.random() > 0.45) return;

            activePlucksRef.current++;
            setActivePlucks(activePlucksRef.current);

            const audioCtx = audioCtxRef.current;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            let panner: StereoPannerNode | GainNode;
            if (audioCtx.createStereoPanner) {
                panner = audioCtx.createStereoPanner();
                (panner as StereoPannerNode).pan.value = panValue;
            } else {
                panner = audioCtx.createGain();
            }

            osc.type = 'sine';

            const scale = currentAudioProfile ? currentAudioProfile.scale : [261.63, 293.66, 329.63, 392.0, 440.0];
            const overtoneFreq = scale[Math.floor(Math.random() * scale.length)];
            osc.frequency.value = overtoneFreq * 2;

            filter.type = 'bandpass';
            filter.frequency.value = overtoneFreq * 2;
            filter.Q.value = 4;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(panner);
            panner.connect(masterDelayRef.current);
            panner.connect(masterGainRef.current);

            osc.start();

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            const peakGain = Math.min(0.02, intensity * 0.006 + 0.002);
            gain.gain.linearRampToValueAtTime(peakGain, audioCtx.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5 + Math.random() * 1.5);

            osc.stop(audioCtx.currentTime + 3.0);

            osc.onended = () => {
                activePlucksRef.current--;
                setActivePlucks(activePlucksRef.current);
                osc.disconnect();
                filter.disconnect();
                gain.disconnect();
                panner.disconnect();
            };
        },
        [audioEnabled, isMuted, currentAudioProfile],
    );

    const updateDroneGain = useCallback((targetGain: number) => {
        if (droneGainRef.current && audioCtxRef.current) {
            droneGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.15);
        }
    }, []);

    const updateDroneFrequency = useCallback((rootFreq: number) => {
        if (droneOscRef.current && droneOsc2Ref.current && audioCtxRef.current) {
            droneOscRef.current.frequency.setTargetAtTime(rootFreq, audioCtxRef.current.currentTime, 0.5);
            droneOsc2Ref.current.frequency.setTargetAtTime(rootFreq, audioCtxRef.current.currentTime, 0.5);
        }
    }, []);

    const fadeOutAudio = useCallback(() => {
        if (masterGainRef.current && audioCtxRef.current) {
            masterGainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
            masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, audioCtxRef.current.currentTime);
            masterGainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 5.0);
        }
    }, []);

    return {
        audioEnabled,
        isMuted,
        setIsMuted,
        currentAudioProfile,
        setCurrentAudioProfile,
        sessionDataRef,
        audioProfiles,
        initAudio,
        playPluck,
        playDustSound,
        updateDroneGain,
        updateDroneFrequency,
        fadeOutAudio,
        activePlucks,
    };
}
