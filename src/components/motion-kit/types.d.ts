import type Lenis from 'lenis';

export {};

declare global {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Window {
        /** Exposed by <SmoothScroll/> so tooling (e.g. Playwright replays) can drive scroll. */
        __lenis?: Lenis;
    }
}
