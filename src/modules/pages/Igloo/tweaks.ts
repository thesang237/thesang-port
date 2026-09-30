import type { DialConfig } from 'dialkit';

/**
 * Live-tunable parameters. The WebGL worlds read these plain objects every
 * frame; the DialKit panels (ui/TweakPanel) write into them. Defaults here are
 * the shipped look — the panels only override them while open/persisted.
 */

export const colonyParams = {
    // idle — every particle wanders around its home on a 3D noise field
    idleAmp: 0.045,
    idleFreq: 1.4,
    idleSpeed: 0.35,
    jitter: 0.012,
    breathe: 0.012,
    wisps: true,
    // cursor
    radius: 0.26,
    radiusGain: 0.035,
    drag: 6.5,
    chaos: 1,
    accelChaos: 0.12,
    // physics
    spring: 26,
    looseSpring: 2.8,
    damping: 7,
    energyDecay: 0.45,
    // transition
    burst: 1,
    plume: 0.7,
    morphDuration: 2.1,
    // look
    size: 18,
    glow: 1.15,
    tint: 0.38,
    tintA: '#94dbff',
    tintB: '#dbc4ff',
    tintC: '#c2e6ff',
    paletteSpeed: 0.035,
    scanline: 0.22,
    twinkle: true,
    // figure
    autoSpin: 0.12,
};

export const iglooParams = {
    // hover
    lift: 0.5,
    reach: 1.15,
    tilt: 0.45,
    response: 7,
    // bricks
    brickColor: '#5c6470',
    roughness: 0.88,
    sun: 1.8,
    sky: 0.8,
    // inner light — lights the bricks from inside, leaks through the seams
    lightIntensity: 22,
    lightColor: '#d9ecff',
    lightDistance: 7,
    lightHeight: 0.55,
    flicker: 0.06,
    shadows: true,
    // the source itself — small and mostly hidden
    coreSize: 0.16,
    coreGlow: 2.2,
    seamBacking: 1.1,
    entranceGlow: 1.5,
};

/** Slider tuple: [default, min, max, step]. */
const s = (value: number, min: number, max: number, step: number): [number, number, number, number] => [value, min, max, step];

/** One-shot commands fired from panel actions, consumed by the worlds. */
export const tweakCommands = { shock: false, burst: false };

export const COLONY_CONFIG = {
    idle: {
        amplitude: s(colonyParams.idleAmp, 0, 0.2, 0.001),
        frequency: s(colonyParams.idleFreq, 0.1, 6, 0.05),
        speed: s(colonyParams.idleSpeed, 0, 2, 0.01),
        jitter: s(colonyParams.jitter, 0, 0.08, 0.001),
        breathe: s(colonyParams.breathe, 0, 0.08, 0.001),
        wisps: colonyParams.wisps,
    },
    cursor: {
        radius: s(colonyParams.radius, 0.05, 1, 0.01),
        radiusGain: s(colonyParams.radiusGain, 0, 0.15, 0.005),
        drag: s(colonyParams.drag, 0, 20, 0.1),
        chaos: s(colonyParams.chaos, 0, 4, 0.05),
        accelChaos: s(colonyParams.accelChaos, 0, 0.6, 0.01),
    },
    physics: {
        _collapsed: true,
        spring: s(colonyParams.spring, 2, 60, 0.5),
        looseSpring: s(colonyParams.looseSpring, 0.5, 20, 0.1),
        damping: s(colonyParams.damping, 0.5, 20, 0.1),
        energyDecay: s(colonyParams.energyDecay, 0.05, 2, 0.01),
    },
    transition: {
        _collapsed: true,
        burst: s(colonyParams.burst, 0, 3, 0.05),
        plume: s(colonyParams.plume, 0, 2, 0.05),
        duration: s(colonyParams.morphDuration, 0.6, 5, 0.1),
    },
    look: {
        size: s(colonyParams.size, 4, 40, 0.5),
        glow: s(colonyParams.glow, 0, 4, 0.05),
        tint: s(colonyParams.tint, 0, 1, 0.01),
        tintA: colonyParams.tintA,
        tintB: colonyParams.tintB,
        tintC: colonyParams.tintC,
        paletteSpeed: s(colonyParams.paletteSpeed, 0, 0.3, 0.005),
        scanline: s(colonyParams.scanline, 0, 1, 0.01),
        twinkle: colonyParams.twinkle,
    },
    figure: {
        _collapsed: true,
        autoSpin: s(colonyParams.autoSpin, 0, 1, 0.01),
    },
    shockwave: { type: 'action' as const, label: 'Shockwave' },
    burst: { type: 'action' as const, label: 'Next shape' },
} satisfies DialConfig;

export const IGLOO_CONFIG = {
    hover: {
        lift: s(iglooParams.lift, 0, 1.5, 0.01),
        reach: s(iglooParams.reach, 0.2, 2.5, 0.05),
        tilt: s(iglooParams.tilt, 0, 1.5, 0.01),
        response: s(iglooParams.response, 1, 20, 0.5),
    },
    bricks: {
        color: iglooParams.brickColor,
        roughness: s(iglooParams.roughness, 0, 1, 0.01),
        sun: s(iglooParams.sun, 0, 4, 0.05),
        sky: s(iglooParams.sky, 0, 3, 0.05),
    },
    innerLight: {
        intensity: s(iglooParams.lightIntensity, 0, 80, 0.5),
        color: iglooParams.lightColor,
        distance: s(iglooParams.lightDistance, 1, 20, 0.1),
        height: s(iglooParams.lightHeight, 0, 1.4, 0.01),
        flicker: s(iglooParams.flicker, 0, 0.5, 0.01),
        shadows: iglooParams.shadows,
    },
    source: {
        coreSize: s(iglooParams.coreSize, 0, 1, 0.01),
        coreGlow: s(iglooParams.coreGlow, 0, 8, 0.05),
        seamBacking: s(iglooParams.seamBacking, 0, 3, 0.05),
        entranceGlow: s(iglooParams.entranceGlow, 0, 3, 0.05),
    },
} satisfies DialConfig;
