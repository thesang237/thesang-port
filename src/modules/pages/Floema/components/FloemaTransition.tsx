'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

/**
 * Full-screen wipe overlay that plays on every floema route change.
 * Animates scaleY 0→1 (cover) then 1→0 (reveal) using the current page
 * background colour so the swap is invisible.
 */
export default function FloemaTransition() {
    const pathname = usePathname();
    const overlayRef = useRef<HTMLDivElement>(null);
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        const el = overlayRef.current;
        if (!el) return;

        const tl = gsap.timeline();
        tl.fromTo(el, { scaleY: 0, transformOrigin: 'bottom center' }, { scaleY: 1, duration: 0.45, ease: 'expo.inOut' });
        tl.to(el, { scaleY: 0, transformOrigin: 'top center', duration: 0.45, ease: 'expo.inOut', delay: 0.05 });
    }, [pathname]);

    return <div ref={overlayRef} className="floema-transition" style={{ background: 'currentColor', transform: 'scaleY(0)' }} />;
}
