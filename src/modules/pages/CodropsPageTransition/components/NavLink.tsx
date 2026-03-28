'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';

type NavLinkProps = {
    href: string;
    children: React.ReactNode;
    external?: boolean;
};

export default function NavLink({ href, children, external = false }: NavLinkProps) {
    const lineRef = useRef<HTMLDivElement>(null);

    function handleMouseEnter() {
        const line = lineRef.current;
        if (!line) return;
        gsap.killTweensOf(line);
        gsap.set(line, { x: '-101%' });
        gsap.to(line, { x: 0, duration: 0.8, ease: 'power3.out' });
    }

    function handleMouseLeave() {
        const line = lineRef.current;
        if (!line) return;
        gsap.killTweensOf(line);
        gsap.to(line, { x: '101%', duration: 0.5, ease: 'power3.out' });
    }

    const sharedProps = {
        className: 'links items_anim',
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
    };

    const inner = (
        <>
            {children}
            <div className="line_a">
                <div className="line_a_inner" ref={lineRef} />
            </div>
        </>
    );

    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" {...sharedProps}>
                {inner}
            </a>
        );
    }

    return (
        <Link href={href} {...sharedProps}>
            {inner}
        </Link>
    );
}
