'use client';

import type { RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';

type Props = {
    ref: RefObject<DomLike | null>;
    options?: IntersectionObserverInit;
    onChange?: (isVisible: boolean) => void;
};

const useViewport = ({ ref, options, onChange }: Props) => {
    const ioRef = useRef<IntersectionObserver | null>(null);

    useLayoutEffect(() => {
        ioRef.current = new IntersectionObserver(
            ([entry]) => {
                onChange?.(entry.isIntersecting);
            },

            {
                ...{ threshold: 0, rootMargin: '0px 0px 0px 0px' },
                ...options,
            },
        );

        if (ref.current) {
            ioRef.current.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                ioRef.current?.unobserve(ref.current);
                ioRef.current?.disconnect();
            }
        };
    }, []);
};

export default useViewport;
