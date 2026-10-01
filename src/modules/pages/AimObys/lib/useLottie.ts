'use client';

import { type RefObject, useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';

type LottieData = { ip: number; op: number };

/** Frame-driven (never autoplaying) SVG Lottie. `ready` resolves once the first frame is on screen. */
export function useLottie(container: RefObject<HTMLDivElement | null>, data: LottieData, onReady?: (anim: AnimationItem) => void) {
    const anim = useRef<AnimationItem | null>(null);
    const readyCb = useRef(onReady);
    readyCb.current = onReady;

    useEffect(() => {
        let cancelled = false;
        let item: AnimationItem | null = null;
        import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
            if (cancelled || !container.current) return;
            item = lottie.loadAnimation({
                container: container.current,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                // lottie mutates its input — hand it a copy so remounts start clean
                animationData: structuredClone(data),
                rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: false, hideOnTransparent: true },
            });
            item.goToAndStop(0, true);
            anim.current = item;
            readyCb.current?.(item);
        });
        return () => {
            cancelled = true;
            item?.destroy();
            anim.current = null;
        };
    }, [container, data]);

    return anim;
}

/** Webflow-style lottie progress: 0–100 % of the total frames (sub-frames allowed). */
export function setLottieProgress(anim: AnimationItem | null, pct: number) {
    if (!anim) return;
    anim.goToAndStop((anim.totalFrames * pct) / 100, true);
}
