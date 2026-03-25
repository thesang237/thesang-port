'use client';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

/**
 * Attaches an IntersectionObserver to every [data-animation="highlight"]
 * element inside `scope`. When the element enters the viewport, it animates
 * from { autoAlpha: 0, scale: 1.2 } → { autoAlpha: 1, scale: 1 }.
 */
export function useHighlightAnimation(scope: React.RefObject<HTMLElement | null>) {
    useGSAP(
        () => {
            if (!scope.current) return;

            const els = scope.current.querySelectorAll<HTMLElement>('[data-animation="highlight"]');
            if (!els.length) return;

            gsap.set(els, { autoAlpha: 0, scale: 1.2 });

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        gsap.to(entry.target, {
                            autoAlpha: 1,
                            scale: 1,
                            duration: 1.5,
                            ease: 'expo.out',
                        });
                        observer.unobserve(entry.target);
                    });
                },
                { threshold: 0.2 },
            );

            els.forEach((el) => observer.observe(el));

            return () => observer.disconnect();
        },
        { scope },
    );
}
