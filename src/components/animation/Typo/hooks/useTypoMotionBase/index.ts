'use client';

import { type RefObject, useId, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/dist/SplitText';

import type { AnimateInParams, AnimateOutParams, ResetParams, SplitType } from '@/components/animation/types';
import { useSubscribeFont } from '@/providers/font';
import { isClient } from '@/utils/client-only';

if (isClient) {
    gsap.registerPlugin(useGSAP);
}

export type CustomAnimateParams = {
    splitInstanceRef: SplitText | null;
    inVars?: gsap.TweenVars;
    outVars?: gsap.TweenVars;
};

type Props = {
    splitType: string;
    animateOnType: SplitType;
    maskOnType?: SplitType;
    initVars?: gsap.TweenVars;
    animateIn?: (params: CustomAnimateParams) => gsap.core.Tween | gsap.core.Timeline;
    animateOut?: (params: CustomAnimateParams) => gsap.core.Tween | gsap.core.Timeline;
};

type Return = {
    ref: RefObject<DomLike | null>;
    animateIn: (params: AnimateInParams) => void;
    animateOut: (params: AnimateOutParams) => void;
    reset: (params: ResetParams) => void;
};

const useTypoMotionBase = ({ splitType, animateOnType, maskOnType, initVars, animateIn: customAnimateIn, animateOut: customAnimateOut }: Props): Return => {
    const subscriptionKey = useId();

    const ref = useRef<DomLike>(null);
    const splitInstanceRef = useRef<SplitText | null>(null);
    const tweenRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);

    const initSplitInstance = (vars: gsap.TweenVars = {}) => {
        splitInstanceRef.current?.revert();

        splitInstanceRef.current = SplitText.create(ref.current, {
            type: splitType,
            smartWrap: true,
            mask: maskOnType,
            linesClass: 'line',
            wordsClass: 'word',
            charsClass: 'char',
            reduceWhiteSpace: false,
            onSplit(self) {
                gsap.set(self[animateOnType], vars ?? {});
            },
        });
    };

    const revertSplitInstance = () => {
        splitInstanceRef.current?.revert();
    };

    const animateIn = ({ initVars, inVars }: AnimateInParams) => {
        tweenRef.current?.kill();

        tweenRef.current = customAnimateIn
            ? customAnimateIn({
                  splitInstanceRef: splitInstanceRef.current,
                  inVars: {
                      ...inVars,
                      onComplete: () => {
                          revertSplitInstance();
                          inVars?.onComplete?.();
                      },
                  },
              })
            : gsap.fromTo(splitInstanceRef.current?.[animateOnType] ?? [], initVars ?? {}, {
                  duration: 1.6,
                  ease: 'power3.out',
                  stagger: 0.2,
                  ...inVars,
                  onComplete: () => {
                      revertSplitInstance();
                      inVars?.onComplete?.();
                  },
              });
    };

    const animateOut = ({ outVars }: AnimateOutParams) => {
        tweenRef.current?.kill();

        tweenRef.current = customAnimateOut
            ? customAnimateOut({
                  splitInstanceRef: splitInstanceRef.current,
                  outVars: {
                      ...outVars,
                      onComplete: () => {
                          revertSplitInstance();
                          outVars?.onComplete?.();
                      },
                  },
              })
            : gsap.to(splitInstanceRef.current?.[animateOnType] ?? [], {
                  duration: 1.6,
                  ease: 'power3.out',
                  stagger: 0.2,
                  ...outVars,
                  onComplete: () => {
                      revertSplitInstance();
                      outVars?.onComplete?.();
                  },
              });
    };

    const reset = ({ resetVars }: ResetParams) => {
        tweenRef.current?.kill();
        initSplitInstance(resetVars ?? {});
    };

    useSubscribeFont(subscriptionKey, {
        onComplete: () => {
            initSplitInstance(initVars ?? {});
        },
    });

    return { ref, animateIn, animateOut, reset };
};

export default useTypoMotionBase;
