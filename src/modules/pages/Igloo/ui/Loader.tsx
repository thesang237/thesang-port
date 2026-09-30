'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

import { motion, useIglooUI } from '../store';

import { scrambleIn } from './scramble';

/** Counter → fade → drives the intro (wireframe network → igloo assembles). */
export default function Loader({ onIntroEnd }: { onIntroEnd: () => void }) {
    const ready = useIglooUI((s) => s.ready);
    const root = useRef<HTMLDivElement>(null);
    const num = useRef<HTMLSpanElement>(null);

    useGSAP(
        () => {
            scrambleIn(root.current?.querySelector('[data-scramble]') ?? null, { duration: 1 });
            if (!ready) return;
            const counter = { v: 0 };
            const tl = gsap.timeline({ delay: 0.2 });
            tl.to(counter, {
                v: 100,
                duration: 1.5,
                ease: 'power2.inOut',
                onUpdate: () => {
                    if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
                },
            })
                .to('.ig-loader-bar', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
                .to(root.current, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' })
                .to(motion, { intro: 1, duration: 4.8, ease: 'sine.inOut' }, '-=0.4')
                .call(() => useIglooUI.getState().set({ introDone: true }), [], '-=1.7')
                .call(onIntroEnd);
        },
        { scope: root, dependencies: [ready] },
    );

    return (
        <div ref={root} className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center text-xs">
            <div className="w-[min(70vw,260px)]">
                <div className="mb-2 flex justify-between">
                    <span data-scramble data-text="IGLOO INC. // INITIALISING" />
                    <span ref={num}>000</span>
                </div>
                <span className="ig-loader-bar block h-px w-full origin-left scale-x-0 bg-current" />
            </div>
        </div>
    );
}
