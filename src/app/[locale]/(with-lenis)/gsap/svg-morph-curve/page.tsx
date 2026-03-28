'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(useGSAP, MorphSVGPlugin);

const START = 'M 0 100 V 50 Q 50 0 100 50 V 100 z';
const END = 'M 0 100 V 0 Q 50 0 100 0 V 100 z';

export default function SvgMorphCurvePage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useGSAP(
        () => {
            tlRef.current = gsap.timeline().to('.path', { morphSVG: START, ease: 'power2.in' }).to('.path', { morphSVG: END, ease: 'power2.out' }).reverse();
        },
        { scope: containerRef },
    );

    const handleClick = () => {
        const tl = tlRef.current;
        if (tl) tl.reversed(!tl.reversed());
    };

    return (
        <div ref={containerRef} onClick={handleClick} style={{ overflow: 'hidden', background: '#0e100f', cursor: 'pointer', minHeight: '100vh', position: 'relative' }}>
            <p style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: '#fffce1', zIndex: 999 }}>{'click me'}</p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                    <defs>
                        <linearGradient id="grad-curve" x1="0" y1="0" x2="99" y2="99" gradientUnits="userSpaceOnUse">
                            <stop offset="0.2" stopColor="rgb(255, 135, 9)" />
                            <stop offset="0.7" stopColor="rgb(247, 189, 248)" />
                        </linearGradient>
                    </defs>
                    <path className="path" stroke="url(#grad-curve)" fill="url(#grad-curve)" strokeWidth="2px" vectorEffect="non-scaling-stroke" d="M 0 100 V 100 Q 50 100 100 100 V 100 z" />
                </svg>
            </div>
        </div>
    );
}
