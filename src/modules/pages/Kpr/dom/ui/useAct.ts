'use client';

import type { RefObject } from 'react';

import { useGSAP } from '@/components/motion-kit/gsap';

import { onFrame } from '../../scroll/frame';

import { actWatcher, buildReveal } from './reveal';
import { scrambleInto } from './Text';

/**
 * Wires a section root to its window on the film clock: reveal plays on enter, reverses on leave.
 * `frame` (optional) runs every frame for scrubbed values (transform/opacity only).
 */
export function useAct(ref: RefObject<HTMLElement | null>, win: readonly [number, number], frame?: (root: HTMLElement) => void, onState?: (inside: boolean) => void) {
    useGSAP(
        () => {
            const root = ref.current;
            if (!root) return;
            const tl = buildReveal(root, scrambleInto);
            const videos = root.querySelectorAll('video');
            const watch = actWatcher(root, win, tl, {
                onState: (inside) => {
                    // loops only run while their act is on screen
                    videos.forEach((v) => {
                        if (inside) void v.play().catch(() => {});
                        else v.pause();
                    });
                    onState?.(inside);
                },
            });
            const off = onFrame(() => {
                watch();
                frame?.(root);
            });
            return () => {
                off();
                tl.kill();
            };
        },
        { scope: ref },
    );
}
