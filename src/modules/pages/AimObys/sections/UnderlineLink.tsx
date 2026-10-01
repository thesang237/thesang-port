'use client';

import { useRef } from 'react';

import { gsap } from '@/components/motion-kit/gsap';

/** Hover: the underline slides out to the right while a second one slides in from the left (and back on leave). */
export default function UnderlineLink({ href, label }: { href: string; label: string }) {
    const ref = useRef<HTMLAnchorElement>(null);

    const lines = () => ref.current?.querySelectorAll('.aim-ulink__line') ?? [];
    const onEnter = () => {
        gsap.to(lines(), { xPercent: 140, duration: 0.5, ease: 'aimInOutCubic', overwrite: true });
    };
    const onLeave = () => {
        gsap.to(lines(), { xPercent: 0, duration: 0.4, delay: 0.2, ease: 'aimInOutCubic', overwrite: true });
    };

    return (
        <span className="aim-ulink-wrap">
            <a ref={ref} href={href} target="_blank" rel="noreferrer" className="aim-ulink" onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <span className="aim-t">{label}</span>
                <span className="aim-ulink__line aim-ulink__line--2" />
                <span className="aim-ulink__line" />
            </a>
        </span>
    );
}
