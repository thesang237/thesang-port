'use client';

import type { RefObject } from 'react';
import { useId } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

import useBoxMotionBase from '@/components/animation/Box/hooks/useBoxMotionBase';
import { useSubscribePage } from '@/providers/page';
import { PageState } from '@/stores/page';
import { calcThreshold, checkIsInView } from '@/utils/animation';
import { isClient } from '@/utils/client-only';

if (isClient) {
    gsap.registerPlugin(ScrollTrigger);
}

export type UseBoxMotionConfig = {
    delayWhenEnter?: number;
    delayWhenExit?: number;
    delayWhenInView?: number;
    debug?: boolean;
    start?: string;
    threshold?: number;
};

export type UseBoxMotionProps = {
    config?: UseBoxMotionConfig;
    initVars?: gsap.TweenVars;
    inVars?: gsap.TweenVars;
    outVars?: gsap.TweenVars;
};

export type UseBoxMotionReturn = {
    ref: RefObject<DomLike | null>;
};

const useBoxMotion = ({ config, initVars, inVars, outVars }: UseBoxMotionProps): UseBoxMotionReturn => {
    const subscriptionKey = useId();

    const { ref, animateIn, animateOut, reset } = useBoxMotionBase();

    const handlePageChange = (pageState: PageState) => {
        const isElementInViewport = checkIsInView(ref.current);

        if (pageState === PageState.READY) {
            const visibility = isElementInViewport ? 'visible' : 'hidden';
            gsap.set(ref.current, { ...initVars, visibility });
            return;
        }

        if (pageState === PageState.ENTERED) {
            const delay = isElementInViewport ? (config?.delayWhenEnter ?? 0) : (config?.delayWhenInView ?? 0);

            const topStart = calcThreshold({
                element: ref.current,
                threshold: config?.threshold,
            });

            animateIn({
                initVars: { ...initVars, visibility: 'visible' },
                inVars: {
                    ...inVars,
                    delay,
                    scrollTrigger: {
                        trigger: ref.current,
                        start: config?.start ? config.start : `top+=${topStart}% bottom`,
                        markers: config?.debug ?? false,
                    },
                },
            });
            return;
        }

        if (pageState === PageState.EXITING) {
            const delay = config?.delayWhenExit ?? 0;
            animateOut?.({ outVars: { ...outVars, delay } });
            return;
        }

        if (pageState === PageState.EXITED) {
            reset?.({ resetVars: { ...initVars, visibility: 'hidden' } });
            return;
        }
    };

    useSubscribePage(subscriptionKey, {
        onChange: handlePageChange,
    });

    return { ref };
};

export default useBoxMotion;
