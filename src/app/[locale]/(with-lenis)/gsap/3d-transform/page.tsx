'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

export default function Transform3DPage() {
    const mainRef = useRef<HTMLElement>(null);
    const outerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<SVGSVGElement>(null);

    useGSAP(
        () => {
            const main = mainRef.current!;

            gsap.set(main, { perspective: 650 });

            const outerRX = gsap.quickTo(outerRef.current, 'rotationX', { ease: 'power3' });
            const outerRY = gsap.quickTo(outerRef.current, 'rotationY', { ease: 'power3' });
            const innerX = gsap.quickTo(logoRef.current, 'x', { ease: 'power3' });
            const innerY = gsap.quickTo(logoRef.current, 'y', { ease: 'power3' });

            const onMove = (e: PointerEvent) => {
                outerRX(gsap.utils.interpolate(15, -15, e.y / window.innerHeight));
                outerRY(gsap.utils.interpolate(-15, 15, e.x / window.innerWidth));
                innerX(gsap.utils.interpolate(-30, 30, e.x / window.innerWidth));
                innerY(gsap.utils.interpolate(-30, 30, e.y / window.innerHeight));
            };

            const onLeave = () => {
                outerRX(0);
                outerRY(0);
                innerX(0);
                innerY(0);
            };

            main.addEventListener('pointermove', onMove);
            main.addEventListener('pointerleave', onLeave);

            return () => {
                main.removeEventListener('pointermove', onMove);
                main.removeEventListener('pointerleave', onLeave);
            };
        },
        { scope: mainRef },
    );

    return (
        <main
            ref={mainRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100vh',
                background: '#0e100f',
                backgroundBlendMode: 'color-dodge',
            }}
        >
            <div
                ref={outerRef}
                style={{
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(89.08% 84.62% at 16.54% 78.46%, #fbfefa 0%, #c9f6b4 39.58%, #abff84 77.6%, #2fee65 100%), url("https://assets.codepen.io/16327/noise-e82662fe.png")',
                    borderRadius: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg ref={logoRef} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 623 231" style={{ width: '66%', maxHeight: '66%' }}>
                    <path
                        fill="#0e100f"
                        d="m182 108-8 36c-1 2-3 3-5 3h-10l-2 2c-9 31-21 52-37 65a82 82 0 0 1-54 16c-21 0-35-6-47-19-15-18-21-46-18-81C8 66 42 1 105 1c20 0 35 6 46 18s16 32 16 57c0 2-1 4-4 4h-46c-2 0-4-2-4-3 0-18-5-26-15-26-18 0-29 24-34 38-8 19-12 40-11 60 0 10 2 23 11 29 8 5 19 2 26-4 7-5 12-15 15-23v-3l-2-1H91l-4-1v-3l8-36c0-2 2-3 4-3h79c2 0 4 2 4 4Z M317 67c0 2-2 4-4 4h-43c-3 0-5-3-5-5 0-13-4-19-13-19s-15 5-15 15c0 11 6 20 23 37 22 21 31 40 31 65-1 41-28 67-69 67-22 0-38-6-48-17-11-11-16-28-15-50 0-2 2-4 4-4h44l4 2v3c0 7 1 13 4 16 2 3 5 4 8 4 9 0 13-6 14-16 0-9-3-17-18-33-20-19-37-39-36-70 0-18 7-35 20-47s31-19 52-19c22 0 38 6 48 18 10 11 15 28 14 49Zm134 156V8a4 4 0 0 0-4-4h-67c-2 0-3 2-4 3l-96 215c-1 3 1 6 4 6h46c3 0 4-1 5-3l10-22c1-3 1-3 4-3h45c3 0 3 0 3 3l-1 21a4 4 0 0 0 4 4h47l3-2a4 4 0 0 0 1-3Zm-83-71h-1a1 1 0 0 1-1-2l1-1 33-83 1-3h1l-3 85c-1 4-1 4-4 4h-27ZM545 4h-35c-2 0-4 1-4 3l-50 216a3 3 0 0 0 1 3l3 2h45c2 0 4-2 4-4l5-24c1-2 0-3-2-4l-2-2-8-4-7-4-3-1a1 1 0 0 1-1-1 2 2 0 0 1 2-2h24c7 0 14 0 21-2 51-9 84-50 85-105 1-47-25-71-77-71h-1Zm-12 129h-1l-2-1 14-62-1-3-22-12a1 1 0 0 1 0-1 2 2 0 0 1 1-2h32c10 0 16 10 16 25-1 27-13 55-37 56Zm48 95c8 0 13-6 13-13 0-8-5-14-13-14-7 0-13 6-13 14 0 7 6 13 13 13Zm-10-14c0-6 4-10 10-10s10 4 10 10c0 7-3 11-10 11s-10-4-10-11Zm5 7h4v-5h1c3 0 2 5 3 5h4c-1 0 0-6-3-6 1-1 3-2 3-4s-2-4-6-4h-6v14Zm4-8v-3h1c2 0 2 0 2 2l-2 1h-1Z"
                    />
                </svg>
            </div>
        </main>
    );
}
