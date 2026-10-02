'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '@/components/motion-kit/gsap';

import { playSfx } from './audio';

/**
 * Crosshair cursor: a thin "+" with a centre gap that follows the pointer tightly, and a dot that
 * trails behind (frame-rate independent via quickTo). Grows over links/buttons, shows DRAG over the
 * gallery ring. Fine pointers only; the native cursor stays for touch and reduced motion.
 */
export default function Cursor() {
    const ref = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const el = ref.current!;
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!fine) return;
        document.documentElement.classList.add('kpr-has-cursor');
        const cross = el.querySelector<HTMLElement>('.kpr-cursor__cross')!;
        const dot = el.querySelector<HTMLElement>('.kpr-cursor__dot')!;
        const cx = gsap.quickTo(cross, 'x', { duration: reduced ? 0.01 : 0.12, ease: 'power3' });
        const cy = gsap.quickTo(cross, 'y', { duration: reduced ? 0.01 : 0.12, ease: 'power3' });
        const dx = gsap.quickTo(dot, 'x', { duration: reduced ? 0.01 : 0.45, ease: 'power3' });
        const dy = gsap.quickTo(dot, 'y', { duration: reduced ? 0.01 : 0.45, ease: 'power3' });
        let hoverEl: Element | null = null;
        const move = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            el.style.opacity = '1';
            cx(e.clientX);
            cy(e.clientY);
            dx(e.clientX);
            dy(e.clientY);
            const target = (e.target as Element | null)?.closest('a, button, [data-cursor]') ?? null;
            if (target !== hoverEl) {
                hoverEl = target;
                el.dataset.state = target ? ((target as HTMLElement).dataset.cursor ?? 'link') : '';
                if (target && (target as HTMLElement).dataset.sfx !== undefined) playSfx();
            }
        };
        const leave = () => (el.style.opacity = '0');
        window.addEventListener('pointermove', move, { passive: true });
        document.addEventListener('pointerleave', leave);
        return () => {
            window.removeEventListener('pointermove', move);
            document.removeEventListener('pointerleave', leave);
            document.documentElement.classList.remove('kpr-has-cursor');
        };
    });

    return (
        <div ref={ref} className="kpr-cursor" aria-hidden="true">
            <div className="kpr-cursor__cross">
                <i className="kpr-cursor__h" />
                <i className="kpr-cursor__v" />
                <span className="kpr-cursor__label">Drag</span>
            </div>
            <div className="kpr-cursor__dot" />
        </div>
    );
}
