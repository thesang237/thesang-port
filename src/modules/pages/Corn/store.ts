'use client';

import { useSyncExternalStore } from 'react';

/** UI state shared by the engine (writer) and the DOM layer (readers). Changes rarely: never per frame. */
export type UiState = {
    /** 0–1 while assets load. */
    progress: number;
    /** Loader finished and the intro is playing / played. */
    started: boolean;
    /** Chapter the scroll has settled on (−1 while moving between chapters). */
    chapter: number;
    /** Chapter nearest to the scroll position (for the nav, updates while moving). */
    nearest: number;
    menuOpen: boolean;
    /** The hero title has finished its intro draw (header and hint fade in after it). */
    heroReady: boolean;
    /** A chapter's deep-dive mode (the CTA ring opens it; scrolling pauses while it is open). */
    hotspot: HotspotId | null;
    /** Tests mode: the picked condition (−1 = the picker, 0–4 = wind, drought, disease, soil, density). */
    condition: number;
    /** Kernel mode: the fact the spun kernel has settled on (0–2). */
    fact: number;
};

export type HotspotId = 'library' | 'tests' | 'kernel';

const INITIAL: UiState = { progress: 0, started: false, chapter: 0, nearest: 0, menuOpen: false, heroReady: false, hotspot: null, condition: -1, fact: 0 };
let state: UiState = { ...INITIAL };
const listeners = new Set<() => void>();

export function setUi(patch: Partial<UiState>) {
    let changed = false;
    for (const k in patch) {
        const key = k as keyof UiState;
        if (state[key] !== patch[key]) changed = true;
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
}

export const getUi = () => state;

export function resetUi() {
    state = { ...INITIAL };
}

const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
        listeners.delete(l);
    };
};

export function useUi<T>(pick: (s: UiState) => T): T {
    return useSyncExternalStore(
        subscribe,
        () => pick(state),
        () => pick(state),
    );
}
