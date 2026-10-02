'use client';

import { useEffect, useRef } from 'react';

import { gsap } from '@/components/motion-kit/gsap';
import { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { INTRO } from '../../data/copy';
import { VIDEOS } from '../../data/media';
import { useUi } from '../../scroll/useScrollStore';
import { Close } from '../icons';
import { EASE_OUT } from '../ui/reveal';

/** Trailer overlay. The trailer video is missing in this pass: a 16:9 placeholder panel stands in. */
export default function TrailerPanel() {
    const open = useUi((s) => s.trailerOpen);
    const ref = useRef<HTMLDivElement>(null);
    const lenis = useSmoothScroll();

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open) {
            lenis?.stop();
            gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24, ease: 'none' });
            gsap.fromTo(el.querySelector('.kpr-trailer__panel'), { y: 18, scale: 0.97 }, { y: 0, scale: 1, duration: 0.7, ease: EASE_OUT });
            el.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
            const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useUi.getState().set({ trailerOpen: false });
            window.addEventListener('keydown', onKey);
            return () => window.removeEventListener('keydown', onKey);
        }
        gsap.to(el, { autoAlpha: 0, duration: 0.16, ease: 'none' });
        if (!useUi.getState().menuOpen) lenis?.start();
    }, [open, lenis]);

    const close = () => useUi.getState().set({ trailerOpen: false });
    return (
        <div ref={ref} className="kpr-trailer" role="dialog" aria-modal="true" aria-label={INTRO.trailer} aria-hidden={!open} inert={!open} onClick={close}>
            <div className="kpr-trailer__panel" onClick={(e) => e.stopPropagation()}>
                {VIDEOS.trailer ? (
                    <video src={VIDEOS.trailer} controls autoPlay playsInline />
                ) : (
                    <div className="kpr-trailer__ph kpr-cap2">
                        <span>{INTRO.trailer}</span>
                        <span>Placeholder — trailer video not in this pass</span>
                    </div>
                )}
                <button type="button" className="kpr-trailer__close" onClick={close} aria-label="Close trailer">
                    <Close />
                </button>
            </div>
        </div>
    );
}
