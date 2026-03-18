'use client';

import { useEffect, useRef } from 'react';
import { useAnimation, useInView } from 'framer-motion';

const useViewportAnimation = (once = true, amount = 0.2) => {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once, amount });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        } else if (!once) {
            controls.start('hidden');
        }
    }, [isInView, controls, once]);

    return { ref, controls, isInView };
};

export default useViewportAnimation;
