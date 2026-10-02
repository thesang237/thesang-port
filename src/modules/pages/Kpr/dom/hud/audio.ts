'use client';

import { SOUND } from '../../data/media';
import { useUi } from '../../scroll/useScrollStore';

/** UI sound: one decoded buffer, played on hover/press only while sound is on. */
let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<void> | null = null;
let last = 0;

export function enableAudio() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    if (!loading)
        loading = fetch(SOUND.press)
            .then((r) => r.arrayBuffer())
            .then((b) => ctx!.decodeAudioData(b))
            .then((b) => {
                buffer = b;
            })
            .catch(() => {});
}

export function playSfx(volume = 0.35) {
    if (!useUi.getState().sound || !ctx || !buffer) return;
    const now = performance.now();
    if (now - last < 60) return; // no machine-gun on fast sweeps
    last = now;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.buffer = buffer;
    src.playbackRate.value = 0.94 + Math.random() * 0.12;
    src.connect(gain).connect(ctx.destination);
    src.start();
}

export function disposeAudio() {
    void ctx?.close();
    ctx = null;
    buffer = null;
    loading = null;
}
