'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '../kit/gsap';
import { IMAGES } from '../kit/source';

/** three portrait cards from the source's gallery (their notch is baked into the image's alpha) */
const PICKS = [IMAGES.gallery[3], IMAGES.gallery[0], IMAGES.gallery[7]];
const FAN = [
    { x: -30, y: 6, r: -7, z: 0 },
    { x: 0, y: 0, r: 0, z: 2 },
    { x: 30, y: 8, r: 6, z: 1 },
];

/**
 * The guide's hero borrows the page's pointer lean in CSS: each card follows the pointer at its own
 * speed (like the seeded ±15 % per card in NotchedCard), so the three never move in lockstep.
 */
export default function HeroVisual() {
    const root = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const el = root.current!;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const frames = gsap.utils.toArray<HTMLElement>('.kl-hv-frame', el);
            const fx = frames.map((f, i) => gsap.quickTo(f, 'rotationY', { duration: 0.8 + i * 0.15, ease: 'power3' }));
            const fy = frames.map((f, i) => gsap.quickTo(f, 'rotationX', { duration: 0.8 + i * 0.15, ease: 'power3' }));
            const move = (e: PointerEvent) => {
                const nx = (e.clientX / window.innerWidth) * 2 - 1;
                const ny = (e.clientY / window.innerHeight) * 2 - 1;
                frames.forEach((_, i) => {
                    fx[i](nx * 12);
                    fy[i](-ny * 8);
                });
            };
            window.addEventListener('pointermove', move, { passive: true });
            gsap.from(frames, { yPercent: 40, rotationY: 80, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: 0.3 });
            return () => window.removeEventListener('pointermove', move);
        },
        { scope: root },
    );

    return (
        <div ref={root} className="relative h-full w-full [perspective:1100px]" aria-hidden>
            {PICKS.map((src, i) => (
                <div
                    key={src}
                    className="absolute left-1/2 top-1/2 w-[46%]"
                    style={{ transform: `translate(-50%, -50%) translate(${FAN[i].x}%, ${FAN[i].y}%) rotate(${FAN[i].r}deg)`, zIndex: FAN[i].z }}
                >
                    <div className="kl-hv-frame relative aspect-[622/682] drop-shadow-[0_30px_40px_rgba(40,30,90,0.25)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
                    </div>
                </div>
            ))}
        </div>
    );
}
