// Where the seed comes from on load, and how a locked seed is remembered.
//
//   ?seed=abc in the URL   → that seed, locked (shareable links)
//   a locked seed saved    → that seed again (refresh keeps the picture)
//   otherwise              → a brand-new random seed every load (the default, like a mint)

import { randomSeed } from '../art/random';

const STORAGE_KEY = 'art-solace:seed';
const DEBUG_KEY = 'art-solace:debug';

export type SeedState = { seed: string; locked: boolean };

export function initialSeed(): SeedState {
    const fromUrl = new URLSearchParams(window.location.search).get('seed');
    if (fromUrl) return { seed: fromUrl, locked: true };
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SeedState | null;
        if (saved?.locked && saved.seed) return saved;
    } catch {
        /* storage blocked: fall through to a random seed */
    }
    return { seed: randomSeed(), locked: false };
}

/** Locked: remember the seed and put it in the URL. Unlocked: forget it and clean the URL. */
export function persistSeed({ seed, locked }: SeedState) {
    const url = new URL(window.location.href);
    if (locked) url.searchParams.set('seed', seed);
    else url.searchParams.delete('seed');
    window.history.replaceState(window.history.state, '', url);
    try {
        if (locked) localStorage.setItem(STORAGE_KEY, JSON.stringify({ seed, locked }));
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* storage blocked: the URL still carries the seed */
    }
}

export function shareLink(seed: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', seed);
    return url.toString();
}

export function initialDebugOpen(): boolean {
    if (new URLSearchParams(window.location.search).has('debug')) return true;
    try {
        return localStorage.getItem(DEBUG_KEY) === '1';
    } catch {
        return false;
    }
}

export function persistDebugOpen(open: boolean) {
    try {
        localStorage.setItem(DEBUG_KEY, open ? '1' : '0');
    } catch {
        /* not remembered */
    }
}
