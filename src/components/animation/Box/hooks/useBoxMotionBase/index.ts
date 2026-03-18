'use client';

import { type RefObject, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import type { AnimateInParams, AnimateOutParams, ResetParams } from '@/components/animation/types';
import { isClient } from '@/utils/client-only';

if (isClient) {
    gsap.registerPlugin(useGSAP);
}

type Return = {
    ref: RefObject<DomLike | null>;
    animateIn: (params: AnimateInParams) => void;
    animateOut: (params: AnimateOutParams) => void;
    reset: (params: ResetParams) => void;
};

const useBoxMotionBase = (): Return => {
    const ref = useRef<DomLike>(null);
    const tweenRef = useRef<gsap.core.Tween | null>(null);

    const animateIn = ({ initVars, inVars }: AnimateInParams) => {
        tweenRef.current?.kill();

        tweenRef.current = gsap.fromTo(ref.current, initVars ?? {}, {
            duration: 1.6,
            ease: 'power3.out',
            ...inVars,
        });
    };

    const animateOut = ({ outVars }: AnimateOutParams) => {
        tweenRef.current?.kill();

        tweenRef.current = gsap.to(ref.current, {
            duration: 1.6,
            ease: 'power3.out',
            ...outVars,
        });
    };

    const reset = ({ resetVars }: ResetParams) => {
        tweenRef.current?.kill();

        gsap.set(ref.current, resetVars ?? {});
    };

    return { ref, animateIn, animateOut, reset };
};

export default useBoxMotionBase;
