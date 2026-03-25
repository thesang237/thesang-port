'use client';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';

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
 * Attaches the full Floema button animation to every [data-animation="button"]
 * element found inside `scope`.
 *
 * - Inner <span> text splits into two char-span layers: original + hover
 * - Hover in:  text rotates out (rotate3d), hover rotates in  — paused GSAP timeline
 * - SVG <path:last-child>: stroke-dashoffset draw animation on mouseenter/mouseleave
 */
export function useButtonAnimation(scope: React.RefObject<HTMLElement | null>) {
    useGSAP(
        () => {
            if (!scope.current) return;

            const buttons = scope.current.querySelectorAll<HTMLElement>('[data-animation="button"]');
            const cleanups: (() => void)[] = [];

            buttons.forEach((button) => {
                const spanEl = button.querySelector<HTMLElement>('span');
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
                tl.to(textSpans, { duration: 0.5, ease: EASE, transform: 'rotate3d(1, 0.1, 0, -90deg)', stagger: 0.01 }, 0);
                tl.fromTo(hoverSpans, { transform: 'rotate3d(1, 0.1, 0, 90deg)' }, { duration: 0.5, ease: EASE, transform: 'rotate3d(0, 0, 0, 90deg)', stagger: 0.01 }, 0.05);

                // SVG stroke draw
                const path = button.querySelector<SVGPathElement>('path:last-child');
                let pathLen = 0;
                let pathValue = 0;
                if (path) {
                    pathLen = path.getTotalLength();
                    pathValue = pathLen;
                    gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
                }

                const onEnter = () => {
                    tl.play();
                    if (path) {
                        pathValue -= pathLen;
                        gsap.to(path, { duration: 1, ease: EASE, strokeDashoffset: pathValue });
                    }
                };
                const onLeave = () => {
                    tl.reverse();
                    if (path) {
                        pathValue -= pathLen;
                        gsap.to(path, { duration: 1, ease: EASE, strokeDashoffset: pathValue });
                    }
                };

                button.addEventListener('mouseenter', onEnter);
                button.addEventListener('mouseleave', onLeave);

                cleanups.push(() => {
                    button.removeEventListener('mouseenter', onEnter);
                    button.removeEventListener('mouseleave', onLeave);
                    tl.kill();
                });
            });

            return () => cleanups.forEach((c) => c());
        },
        { scope },
    );
}
