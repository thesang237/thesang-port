'use client';

import type { RefObject } from 'react';
import { useId } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { SplitText } from 'gsap/dist/SplitText';

import { SplitType } from '@/components/animation/types';
import type { CustomAnimateParams } from '@/components/animation/Typo/hooks/useTypoMotionBase';
import useTypoMotionBase from '@/components/animation/Typo/hooks/useTypoMotionBase';
import { useSubscribePage } from '@/providers/page';
import { PageState } from '@/stores/page';
import { calcThreshold, checkIsInView } from '@/utils/animation';
import { isClient } from '@/utils/client-only';

export type UseTypoMotionConfig = {
    delayWhenEnter?: number;
    delayWhenExit?: number;
    delayWhenInView?: number;
    debug?: boolean;
    start?: string;
    threshold?: number;
    splitType?: string;
    animateOnType?: SplitType;
    maskOnType?: SplitType;
};

export type UseTypoMotionProps = {
    config?: UseTypoMotionConfig;
    initVars?: gsap.TweenVars;
    inVars?: gsap.TweenVars;
    outVars?: gsap.TweenVars;
    animateIn?: (params: CustomAnimateParams) => gsap.core.Tween | gsap.core.Timeline;
    animateOut?: (params: CustomAnimateParams) => gsap.core.Tween | gsap.core.Timeline;
};

export type UseTypoMotionReturn = {
    ref: RefObject<DomLike | null>;
};

if (isClient) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(SplitText);
}

const useTypoMotion = ({ config, initVars, inVars, outVars, animateIn: customAnimateIn, animateOut: customAnimateOut }: UseTypoMotionProps): UseTypoMotionReturn => {
    const subscriptionKey = useId();

    const { ref, animateIn, animateOut, reset } = useTypoMotionBase({
        splitType: config?.splitType ?? SplitType.LINES,
        animateOnType: config?.animateOnType ?? SplitType.LINES,
        maskOnType: config?.maskOnType,
        initVars,
        animateIn: customAnimateIn,
        animateOut: customAnimateOut,
    });

    const handlePageChange = (pageState: PageState) => {
        const isElementInViewport = checkIsInView(ref.current);

        if (pageState === PageState.READY) {
            const visibility = isElementInViewport ? 'visible' : 'hidden';
            gsap.set(ref.current, { visibility });
            return;
        }

        if (pageState === PageState.ENTERED) {
            const delay = isElementInViewport ? (config?.delayWhenEnter ?? 0) : (config?.delayWhenInView ?? 0);

            const topStart = calcThreshold({
                element: ref.current,
                threshold: config?.threshold,
            });

            animateIn({
                initVars: { ...initVars },
                inVars: {
                    ...inVars,
                    delay,
                    onStart: () => {
                        gsap.set(ref.current, { visibility: 'visible' });
                    },
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
            reset?.({ resetVars: { ...initVars } });
            return;
        }
    };

    useSubscribePage(subscriptionKey, {
        onChange: handlePageChange,
    });

    return { ref };
};

export default useTypoMotion;
