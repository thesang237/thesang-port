'use client';

import { create } from 'zustand';

import type { NavId } from '../data/copy';

/**
 * Per-frame values live in `film` (a plain object, never React state).
 * Coarse UI state (a few changes per visit) lives in the zustand store below.
 */
export const film = {
    /** scroll position in screens (Lenis-smoothed) */
    t: 0,
    /** what the GL/DOM actually show: t, or t snapped to rests under reduced motion */
    view: 0,
    /** scroll velocity in screens/second (signed, smoothed) */
    vel: 0,
    vw: 1440,
    vh: 900,
    /** pointer in -1..1 (raw and smoothed) */
    px: 0,
    py: 0,
    spx: 0,
    spy: 0,
    time: 0,
    dt: 0.016,
    reduced: false,
    phone: false,
    /** gallery ring: drag offset (radians) and its momentum */
    ringDrag: 0,
    ringMomentum: 0,
    /** 0..1 flash used by the reduced-motion cut between stills */
    cut: 0,
    /** true while the footer fully covers the stage (GL can skip rendering) */
    covered: false,
    started: false,
    /** opening after the loader: 0 = hero card is a closed line, 1 = full screen (1 when skipped) */
    intro: 0,
    /** the opening's barcode wipe (header-sprite frame; < 0 = hidden) */
    barcode: -1,
};

export function resetFilm() {
    Object.assign(film, { t: 0, view: 0, vel: 0, px: 0, py: 0, spx: 0, spy: 0, time: 0, ringDrag: 0, ringMomentum: 0, cut: 0, covered: false, started: false, intro: 0, barcode: -1 });
}

type UiState = {
    nav: NavId;
    theme: 'light' | 'dark';
    menuOpen: boolean;
    sound: boolean;
    loaded: boolean;
    progress: number;
    entered: boolean;
    /** the loader has gone and the opening (barcode → logo → card) is playing */
    opening: boolean;
    trailerOpen: boolean;
    set: (s: Partial<Omit<UiState, 'set'>>) => void;
};

export const useUi = create<UiState>((set) => ({
    nav: 'project',
    theme: 'light',
    menuOpen: false,
    sound: false,
    loaded: false,
    progress: 0,
    entered: false,
    opening: false,
    trailerOpen: false,
    set: (s) => set(s),
}));

export const resetUi = () => useUi.getState().set({ nav: 'project', theme: 'light', menuOpen: false, sound: false, loaded: false, progress: 0, entered: false, opening: false, trailerOpen: false });
