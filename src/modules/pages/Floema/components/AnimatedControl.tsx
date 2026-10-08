'use client';

import { type ComponentPropsWithoutRef, useRef } from 'react';

import { gsap, motion, useGSAP } from '../motion';

function useControl(oval: boolean) {
    const root = useRef<HTMLSpanElement>(null);
    useGSAP(
        () => {
            const element = root.current;
            const control = element?.parentElement;
            if (!element || !control) return;
            const query = gsap.utils.selector(element);
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
            const front = query('[data-front] .floema-letter');
            const back = query('[data-back] .floema-letter');
            const timeline = gsap.timeline({ paused: true });
            timeline
                .to(front, { rotationX: -90, rotationY: -9, duration: motion.hover, ease: oval ? motion.ease : 'power2.out', stagger: oval ? motion.buttonStagger : motion.hoverStagger }, 0)
                .fromTo(
                    back,
                    { rotationX: 90, rotationY: 9 },
                    { rotationX: 0, rotationY: 0, duration: motion.hover, ease: oval ? motion.ease : 'power2.out', stagger: oval ? motion.buttonStagger : motion.hoverStagger },
                    0.05,
                );
            const outline = element.querySelector<SVGEllipseElement>('[data-outline]');
            const length = outline?.getTotalLength() ?? 0;
            if (outline) gsap.set(outline, { attr: { 'stroke-dasharray': `${length} ${length}`, 'stroke-dashoffset': length } });
            // SVG attributes retain fractional distances, so the stroke draws continuously.
            const outlineDraw = outline ? gsap.to(outline, { attr: { 'stroke-dashoffset': 0 }, duration: motion.outline, ease: motion.ease, paused: true }) : null;
            const enter = () => {
                if (reduced.matches) outlineDraw?.progress(1).pause();
                else {
                    timeline.play();
                    outlineDraw?.restart();
                }
            };
            const leave = () => {
                if (reduced.matches) outlineDraw?.progress(0).pause();
                else {
                    timeline.reverse();
                    outlineDraw?.reverse();
                }
            };
            const pointerEnter = (event: PointerEvent) => {
                if (event.pointerType === 'mouse') enter();
            };
            control.addEventListener('pointerenter', pointerEnter);
            control.addEventListener('pointerleave', leave);
            control.addEventListener('focus', enter);
            control.addEventListener('blur', leave);
            return () => {
                control.removeEventListener('pointerenter', pointerEnter);
                control.removeEventListener('pointerleave', leave);
                control.removeEventListener('focus', enter);
                control.removeEventListener('blur', leave);
                gsap.killTweensOf(outline);
            };
        },
        { scope: root },
    );
    return root;
}
function ControlText({ text, oval = false, compact = false }: { text: string; oval?: boolean; compact?: boolean }) {
    const root = useControl(oval);
    const width = compact ? 124 : 288;
    return (
        <span ref={root} className="floema-control-content" aria-hidden="true">
            <span className="floema-control-text">
                {[false, true].map((back) => (
                    <span key={String(back)} {...(back ? { 'data-back': '' } : { 'data-front': '' })}>
                        {Array.from(text).map((letter, index) => (
                            <span className="floema-letter" key={index}>
                                {letter === ' ' ? '\u00a0' : letter}
                            </span>
                        ))}
                    </span>
                ))}
            </span>
            {oval && (
                <svg viewBox={`0 0 ${width} 60`} className="floema-oval" aria-hidden="true">
                    <ellipse cx={width / 2} cy="30" rx={width / 2 - 0.5} ry="29.5" opacity="0.4" />
                    <ellipse data-outline cx={width / 2} cy="30" rx={width / 2 - 0.5} ry="29.5" />
                </svg>
            )}
        </span>
    );
}
export function AnimatedLink({ children, oval, className = '', ...props }: Omit<ComponentPropsWithoutRef<'a'>, 'children'> & { children: string; oval?: boolean }) {
    return (
        <a {...props} aria-label={children} className={`${oval ? 'floema-oval-control' : 'floema-text-link'} ${className}`}>
            <ControlText text={children} oval={oval} />
        </a>
    );
}
export function OvalButton({ children, className = '', ...props }: Omit<ComponentPropsWithoutRef<'button'>, 'children'> & { children: string }) {
    return (
        <button {...props} className={`floema-oval-control floema-oval-control--compact ${className}`} aria-label={children}>
            <ControlText text={children} oval compact />
        </button>
    );
}
