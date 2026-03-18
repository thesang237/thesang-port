'use client';

import type { FC, PropsWithChildren } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { type LenisRef, ReactLenis } from 'lenis/react';

const LenisScroller: FC<PropsWithChildren> = ({ children }) => {
    const lenisRef = useRef<LenisRef | null>(null);

    useLayoutEffect(() => {
        function update(time: number): void {
            lenisRef.current?.lenis?.raf(time * 1000);
        }

        gsap.ticker.add(update);
        return (): void => {
            gsap.ticker.remove(update);
        };
    }, []);

    return (
        <ReactLenis root ref={lenisRef} options={{ autoRaf: false }}>
            {children}
        </ReactLenis>
    );
};

export default LenisScroller;
