'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, SplitText);

const LINES = ['SplitText', 'SplitText', 'SplitText', 'SplitText'];

export default function RollingTextPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const container = containerRef.current!;
            const lines = container.querySelectorAll<HTMLElement>('.line');

            gsap.set(container, { visibility: 'visible' });

            const depth = -window.innerWidth / 8;
            const transformOrigin = `50% 50% ${depth}`;

            gsap.set(lines, { perspective: 700, transformStyle: 'preserve-3d' });

            const splitLines = Array.from(lines).map((line) => {
                const split = new SplitText(line, { type: 'chars', charsClass: 'char' });
                gsap.set(split.chars, { backfaceVisibility: 'hidden' });
                return split;
            });

            const tl = gsap.timeline({ repeat: -1 });

            splitLines.forEach((split, index) => {
                tl.fromTo(split.chars, { rotationX: -90 }, { rotationX: 90, stagger: 0.08, duration: 0.9, ease: 'none', transformOrigin }, index * 0.45);
            });
        },
        { scope: containerRef },
    );

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100vh',
                visibility: 'hidden',
            }}
        >
            <div style={{ position: 'relative', width: '100%', height: '24vw' }}>
                {LINES.map((text, i) => (
                    <h1
                        key={i}
                        className="line"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            lineHeight: 1,
                            margin: 0,
                            letterSpacing: '-0.6vw',
                            fontSize: '18vw',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                        }}
                    >
                        {text}
                    </h1>
                ))}
            </div>
        </div>
    );
}
