'use client';

import { useEffect, useRef, useState } from 'react';

import { gsap, useGSAP } from '@/components/motion-kit/gsap';
import { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { LOADER } from '../../data/copy';
import { film, useUi } from '../../scroll/useScrollStore';
import { Triangles } from '../icons';
import { EASE_IN_OUT, EASE_OUT } from '../ui/reveal';
import { scrambleTween } from '../ui/Text';

import { enableAudio } from './audio';
import { AudioBars } from './Hud';

const MIN_VISIBLE = 900; // ms — the loader never just blinks (page-transitions rule: ≥ 400 ms)
const GIVE_UP = 12000; // ms — after this the enter buttons appear even if loading is still running

/**
 * Preloader in the HUD language: a 1px bar that fills with REAL asset progress (textures, KTX2
 * sheets, GLB), a mono percent, decoding file URLs, and an audio CTA ring that follows the pointer.
 * Entering (with or without sound): the details fade, the bar collapses, then the opening plays.
 */
export default function Loader() {
    const ref = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    const [gone, setGone] = useState(false);
    const lenis = useSmoothScroll();
    const shown = useRef({ p: 0 });

    // lock scroll until the visitor enters
    useEffect(() => {
        lenis?.stop();
    }, [lenis]);

    useGSAP(
        () => {
            const root = ref.current!;
            const bar = root.querySelector<HTMLElement>('.kpr-loader__progress')!;
            const label = root.querySelector<HTMLElement>('[data-pct]')!;
            const files = root.querySelectorAll<HTMLElement>('.kpr-loader__file');
            const t0 = performance.now();
            let fileIdx = 0;
            const fileTimer = window.setInterval(() => {
                files.forEach((f, i) => f.classList.toggle('is-on', i === fileIdx % files.length));
                scrambleTween(files[fileIdx % files.length], 0.5);
                fileIdx++;
            }, 260);
            // displayed progress eases toward the real one; never runs ahead of it
            const tick = () => {
                const ui = useUi.getState();
                const target = ui.loaded ? 1 : ui.progress * 0.98;
                const s = shown.current;
                s.p += (target - s.p) * Math.min(1, film.dt * 6 || 0.1);
                if (target - s.p < 0.002) s.p = target;
                bar.style.transform = `scaleX(${s.p})`;
                const pct = String(Math.round(s.p * 100));
                if (label.textContent !== pct) label.textContent = pct;
                const elapsed = performance.now() - t0;
                if ((s.p >= 1 && elapsed > MIN_VISIBLE) || elapsed > GIVE_UP) {
                    gsap.ticker.remove(tick);
                    window.clearInterval(fileTimer);
                    setReady(true);
                }
            };
            gsap.ticker.add(tick);
            // audio CTA ring follows the pointer
            const cta = root.querySelector<HTMLElement>('.kpr-loader__cta')!;
            const qx = gsap.quickTo(cta, 'x', { duration: 0.6, ease: 'power3' });
            const qy = gsap.quickTo(cta, 'y', { duration: 0.6, ease: 'power3' });
            gsap.set(cta, { x: window.innerWidth / 2, y: window.innerHeight * 0.72 });
            const move = (e: PointerEvent) => {
                qx(e.clientX);
                qy(e.clientY);
            };
            window.addEventListener('pointermove', move, { passive: true });
            return () => {
                gsap.ticker.remove(tick);
                window.clearInterval(fileTimer);
                window.removeEventListener('pointermove', move);
            };
        },
        { scope: ref },
    );

    useGSAP(
        () => {
            if (!ready) return;
            const root = ref.current!;
            gsap.fromTo(root.querySelectorAll('.kpr-loader__enter'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.07 });
            root.querySelector<HTMLElement>('.kpr-loader__enter')?.focus({ preventScroll: true });
        },
        { scope: ref, dependencies: [ready] },
    );

    const enter = (withSound: boolean) => {
        if (!ready || gone) return;
        if (withSound) enableAudio();
        useUi.getState().set({ sound: withSound });
        const root = ref.current!;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // the loader only clears the screen; the opening (Intro.tsx: barcode → logo → card) takes over
        const tl = gsap.timeline({ onComplete: () => setGone(true) });
        // the barcode starts while the loader's last details are still fading (no blank beat)
        tl.call(() => useUi.getState().set({ opening: true }), [], reduced ? 0 : 0.2);
        if (reduced) tl.to(root, { autoAlpha: 0, duration: 0.16, ease: 'none' });
        else
            tl.to(root.querySelectorAll('.kpr-loader__details, .kpr-loader__enter, .kpr-loader__cta'), { autoAlpha: 0, duration: 0.25, ease: 'none' })
                .to(root.querySelector('.kpr-loader__bar'), { scaleX: 0, transformOrigin: '100% 50%', duration: 0.45, ease: EASE_IN_OUT }, 0.05)
                .to(root, { autoAlpha: 0, duration: 0.2, ease: 'none' }, 0.4);
    };

    if (gone) return null;

    return (
        <div ref={ref} className={`kpr-loader ${ready ? 'is-ready' : ''}`} onClick={() => enter(true)} role="dialog" aria-label="Loading">
            <div className="kpr-loader__bar">
                <i className="kpr-loader__progress" />
                <div className="kpr-loader__details kpr-cap2">
                    <div className="kpr-loader__left">
                        <Triangles className="kpr-loader__tri" />
                        <span>
                            {LOADER.label} - <span data-pct>0</span>%
                        </span>
                    </div>
                    <div className="kpr-loader__files" aria-hidden="true">
                        {LOADER.files.map((f) => (
                            <div className="kpr-loader__file" key={f}>
                                <span className="kpr-hacky__spacer">{f}</span>
                                <span className="kpr-hacky__anim">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="kpr-loader__cta" aria-hidden="true">
                <svg className="kpr-loader__ring" viewBox="0 0 100 100" width="92" height="92">
                    <circle cx="50" cy="50" r="46" />
                </svg>
                <AudioBars className="kpr-loader__bars" />
                <span className="kpr-loader__ctaLabel kpr-cap3">{LOADER.cta}</span>
            </div>
            <div className="kpr-loader__actions">
                <button
                    type="button"
                    className="kpr-loader__enter kpr-cap2"
                    onClick={(e) => {
                        e.stopPropagation();
                        enter(true);
                    }}
                >
                    {LOADER.sound}
                </button>
                <button
                    type="button"
                    className="kpr-loader__enter kpr-cap2"
                    onClick={(e) => {
                        e.stopPropagation();
                        enter(false);
                    }}
                >
                    {LOADER.silent}
                </button>
            </div>
        </div>
    );
}
