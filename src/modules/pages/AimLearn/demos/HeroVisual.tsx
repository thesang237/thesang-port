'use client';

import { useRef } from 'react';

import { useReducedMotion, useTicker } from '../kit/loop';
import { scrollLottie, setLottieProgress, useLottie } from '../kit/source';

/** The page's own logo animation (a Lottie file), played back and forth by a slow sine so the guide's hero is alive. */
export default function HeroVisual() {
    const host = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const anim = useLottie(box, scrollLottie);
    const reduce = useReducedMotion();

    useTicker(host, (time) => {
        if (reduce) {
            setLottieProgress(anim.current, 0);
            return;
        }
        // 0..1 with a short hold at both ends, then eased
        const k = Math.min(1, Math.max(0, (Math.sin(time * 0.55 - Math.PI / 2) * 0.5 + 0.5) * 1.5 - 0.25));
        const e = k * k * (3 - 2 * k);
        setLottieProgress(anim.current, e * 45);
    });

    return (
        <div ref={host} className="flex h-full w-full items-center justify-center" aria-hidden>
            <div ref={box} className="w-full" style={{ aspectRatio: '1440 / 860' }} />
        </div>
    );
}
