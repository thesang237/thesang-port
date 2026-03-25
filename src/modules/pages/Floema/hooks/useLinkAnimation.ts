'use client';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

function buildCharSpans(text: string): HTMLDivElement {
    const div = document.createElement('div');
    text.split('').forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        div.appendChild(span);
    });
    return div;
}

/**
 * Attaches the Floema link hover animation to every [data-animation="link"]
 * element found inside `scope`.
 *
 * Same dual-layer char-span rotate3d pattern as useButtonAnimation,
 * but uses power2 ease and rotate3d(1, 0.2, 0, ...) — no SVG stroke.
 */
export function useLinkAnimation(scope: React.RefObject<HTMLElement | null>) {
    useGSAP(
        () => {
            if (!scope.current) return;

            const links = scope.current.querySelectorAll<HTMLElement>('[data-animation="link"]');
            const cleanups: (() => void)[] = [];

            links.forEach((link) => {
                const spanEl = link.querySelector<HTMLElement>('span');
                if (!spanEl) return;

                const text = spanEl.textContent?.trim() ?? '';
                if (!text) return;

                const textDiv = buildCharSpans(text);
                const hoverDiv = buildCharSpans(text);

                hoverDiv.style.cssText = 'position:absolute;top:0;left:0;';
                spanEl.style.cssText = 'position:relative;display:inline-block;overflow:hidden;perspective:500px;';
                spanEl.innerHTML = '';
                spanEl.appendChild(textDiv);
                spanEl.appendChild(hoverDiv);

                const textSpans = Array.from(textDiv.querySelectorAll<HTMLElement>('span'));
                const hoverSpans = Array.from(hoverDiv.querySelectorAll<HTMLElement>('span'));

                const tl = gsap.timeline({ paused: true });
                tl.to(textSpans, { duration: 0.5, ease: 'power2', transform: 'rotate3d(1, 0.2, 0, -90deg)', stagger: 0.02 }, 0);
                tl.fromTo(hoverSpans, { transform: 'rotate3d(1, 0.2, 0, 90deg)' }, { duration: 0.5, ease: 'power2', transform: 'rotate3d(0, 0, 0, 90deg)', stagger: 0.02 }, 0.05);

                const onEnter = () => {
                    tl.play();
                };
                const onLeave = () => {
                    tl.reverse();
                };

                link.addEventListener('mouseenter', onEnter);
                link.addEventListener('mouseleave', onLeave);

                cleanups.push(() => {
                    link.removeEventListener('mouseenter', onEnter);
                    link.removeEventListener('mouseleave', onLeave);
                    tl.kill();
                });
            });

            return () => cleanups.forEach((c) => c());
        },
        { scope },
    );
}
