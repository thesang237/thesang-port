import type { Camera, Scene } from 'three';
import { create } from 'zustand';

/**
 * Mutable, frame-rate state. Written by the GSAP master timeline (scroll) and
 * by time-based tweens, read every frame by the WebGL worlds. It is a plain
 * object on purpose: no React renders happen while scrolling.
 */
export const motion = {
    // scroll-driven — see IglooPage master timeline
    scene: 0, // 0 igloo → 1 crystals → 2 portal → 3 colony → 4 (== 0, loop)
    explode: 0, // igloo bricks fly apart
    heroCam: 0, // igloo camera rise
    crystals: -0.8, // crystal carousel position (index of centred crystal)
    rings: 0, // ring assembly
    dive: 0, // camera dives through the portal
    form: 0, // particle cloud → figure
    colonyCam: 0,
    progress: 0,

    // time-driven
    intro: 0, // loader → wireframe → igloo
    detail: 0, // portfolio detail overlay
    morph: 1, // particle morph between social shapes

    // input
    pointer: { x: 0, y: 0 },
    pointerSmooth: { x: 0, y: 0 },
    hasPointer: false, // no hover effects until the pointer actually moves
    overUI: false, // pointer is over a panel — scene ignores it
    velocity: 0,
    hoverCrystal: -1,
};

const initialMotion = JSON.parse(JSON.stringify(motion)) as typeof motion;

/** Module state outlives route changes — reset it whenever the page mounts. */
export const resetMotion = () => {
    const fresh = JSON.parse(JSON.stringify(initialMotion)) as typeof motion;
    Object.assign(motion, fresh);
};

export type World = { scene: Scene; camera: Camera };

/** Registered by each world; read by the compositor. */
export const worlds: (World | null)[] = [null, null, null, null];

/** DOM nodes the crystal world positions every frame (HUD anchored to 3D). */
export const hudNodes: (HTMLElement | null)[] = [];

/** Which world is visible, and how much (0..1). */
export const worldWeight = (index: number) => {
    const s = motion.scene % 4;
    const a = Math.floor(s);
    const t = s - a;
    if (index === a) return 1 - t;
    if (index === (a + 1) % 4) return t;
    return 0;
};

type UIState = {
    ready: boolean;
    introDone: boolean;
    section: number;
    activeCrystal: number;
    detail: number; // -1 closed
    social: number;
    sound: boolean;
    set: (partial: Partial<Omit<UIState, 'set'>>) => void;
};

export const useIglooUI = create<UIState>((set) => ({
    ready: false,
    introDone: false,
    section: 0,
    activeCrystal: -1,
    detail: -1,
    social: 0,
    sound: false,
    set: (partial) => set(partial),
}));
