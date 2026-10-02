'use client';

import { useEffect, useRef } from 'react';

import { gsap } from '@/components/motion-kit/gsap';
import { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { introRect } from '../../gl/choreo';
import { film, useUi } from '../../scroll/useScrollStore';

/** the KPR wordmark from the reference (viewBox 0 0 72 24) */
const KPR_PATH =
    'm15.26 11.963 7.855 10.692c.458.67.313 1.34-.489 1.34h-4.608c-.628 0-1.083-.14-1.466-.74l-4.748-6.595-4.782 6.457c-.458.6-.801.882-1.572.882H1.222C.454 23.999 0 23.536 0 22.765V1.236C0 .46.458.002 1.222.002H5c.768 0 1.22.463 1.22 1.234v10.94c0 .634-.034 1.023-.383 1.552l-.907 1.34c-.14.212-.07.424.21.424h.522c.175 0 .385-.035.489-.212L16.764.742c.383-.528.837-.74 1.466-.74h4.396c.801 0 .977.67.489 1.34L15.26 11.964ZM26.411.743a1.836 1.836 0 0 1 1.466-.741h14.63a1.506 1.506 0 0 1 1.43.847l3.526 6.28c.314.565.28 1.094 0 1.659l-3.49 6.387c-.28.564-.802.81-1.432.81H31.056a.348.348 0 0 0-.247.104.356.356 0 0 0-.102.249v6.422c0 .327-.129.641-.358.873-.23.231-.54.361-.864.361h-3.769c-.324 0-.634-.13-.864-.361a1.242 1.242 0 0 1-.358-.873V4.488c0-.75.24-1.482.687-2.082L26.41.743Zm5.133 12.561a.56.56 0 0 0 .458-.212l1.603-2.046c.343-.494.801-.74 1.466-.74h4.712l1.117-2.33-1.117-2.294h-9.076v7.27a.337.337 0 0 0 .213.326c.043.016.09.023.136.02l.488.006ZM51.784.846c.138-.254.342-.467.589-.615a1.59 1.59 0 0 1 .817-.226h13.617c.664 0 1.117.283 1.432.847l3.525 6.281a1.572 1.572 0 0 1 0 1.658L67.75 15.99l3.525 6.528c.458.847 0 1.482-.977 1.482h-3.561c-.663 0-1.221-.212-1.57-.81l-3.84-7.198h-5.97a.34.34 0 0 0-.318.218.35.35 0 0 0-.025.134v6.423c0 .327-.129.641-.358.873-.23.231-.54.361-.864.361h-3.77c-.324 0-.635-.13-.864-.361a1.241 1.241 0 0 1-.358-.873V7.263a3.5 3.5 0 0 1 .423-1.669L51.784.846ZM64.08 10.31l1.117-2.329-1.117-2.294h-9.075v7.269a.337.337 0 0 0 .21.325.325.325 0 0 0 .133.022h.489a.555.555 0 0 0 .458-.212l1.602-2.046c.344-.494.801-.74 1.466-.74l4.717.005Z';

/**
 * The wordmark is cut into slanted pieces (a mask). Each piece has its own moment to switch on (the
 * logo builds left to right inside the barcode) and to switch off (it breaks apart over the painting).
 * Seeded, so every visit plays the same.
 */
const COLS = 24;
const ROWS = 6;
const PIECES = (() => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out: { x: number; y: number; on: number; off: number }[] = [];
    for (let c = 0; c < COLS; c++)
        for (let r = 0; r < ROWS; r++) {
            const fx = c / COLS;
            out.push({ x: (c / COLS) * 80 - 4, y: (r / ROWS) * 24, on: fx * 0.7 + rnd() * 0.3, off: rnd() * 0.75 + (1 - fx) * 0.25 });
        }
    return out;
})();

/** timeline (s, from the click): barcode, logo build, card opens, logo breaks, page arrives */
const T = { barcode: 0.05, build: [0.3, 1.5], open: [2.1, 3.45], breakUp: [3.2, 4.2], enter: 4.15, end: 4.3 };
const BARCODE_FPS = 56;

export default function Intro() {
    const ref = useRef<HTMLDivElement>(null);
    const opening = useUi((s) => s.opening);
    const lenis = useSmoothScroll();

    useEffect(() => {
        if (!opening) return;
        const root = ref.current!;
        const white = root.querySelector<HTMLElement>('.kpr-intro-logo--white')!;
        const rects = Array.from(root.querySelectorAll<SVGRectElement>('mask rect.kpr-piece'));
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const state = { t: 0 };
        let entered = false;
        const enter = () => {
            if (entered) return;
            entered = true;
            film.started = true;
            useUi.getState().set({ entered: true });
            lenis?.start();
        };

        if (reduced) {
            film.barcode = -1;
            film.intro = 1;
            root.style.display = 'none';
            enter();
            return;
        }

        const render = () => {
            const t = state.t;
            film.barcode = t >= T.barcode ? (t - T.barcode) * BARCODE_FPS : -1;
            const o = gsap.utils.clamp(0, 1, (t - T.open[0]) / (T.open[1] - T.open[0]));
            film.intro = o;
            const b = gsap.utils.clamp(0, 1, (t - T.build[0]) / (T.build[1] - T.build[0]));
            const k = gsap.utils.clamp(0, 1, (t - T.breakUp[0]) / (T.breakUp[1] - T.breakUp[0]));
            for (let i = 0; i < rects.length; i++) {
                const p = PIECES[i];
                const on = b >= p.on && k < p.off + 0.001;
                const vis = on && !(k > 0 && k >= p.off);
                rects[i].style.visibility = vis ? 'visible' : 'hidden';
            }
            // the white copy shows only over the opening card (its rect, from the choreography)
            const r = introRect(o);
            if (o <= 0) white.style.clipPath = 'inset(50% 50% 50% 50%)';
            else {
                const top = Math.max(0, window.innerHeight / 2 - (r.y + r.h / 2));
                const left = Math.max(0, window.innerWidth / 2 + r.x - r.w / 2);
                const right = Math.max(0, window.innerWidth - (left + r.w));
                const bottom = Math.max(0, window.innerHeight - (top + r.h));
                white.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
            }
            if (t >= T.enter) enter();
        };
        const tl = gsap.to(state, {
            t: T.end,
            duration: T.end,
            ease: 'none',
            onUpdate: render,
            onComplete: () => {
                render();
                film.barcode = -1;
                film.intro = 1;
                root.style.display = 'none';
                enter();
            },
        });
        render();
        return () => {
            tl.kill();
        };
    }, [opening, lenis]);

    return (
        <div ref={ref} className="kpr-intro-logo" aria-hidden="true">
            <div className="kpr-intro-logo__layer">
                <svg className="kpr-intro-logo__svg" viewBox="0 0 72 24" width="72" height="24">
                    <defs>
                        <mask id="kpr-intro-mask" maskUnits="userSpaceOnUse" x="-8" y="-2" width="88" height="28">
                            {PIECES.map((p, i) => (
                                <rect
                                    key={i}
                                    className="kpr-piece"
                                    x={p.x}
                                    y={p.y}
                                    width={80 / COLS + 0.15}
                                    height={24 / ROWS + 0.15}
                                    fill="#fff"
                                    transform={`skewX(-28) translate(${p.y * 0.53} 0)`}
                                    style={{ visibility: 'hidden' }}
                                />
                            ))}
                        </mask>
                    </defs>
                    <path d={KPR_PATH} fill="#000" mask="url(#kpr-intro-mask)" />
                </svg>
            </div>
            <div className="kpr-intro-logo__layer kpr-intro-logo--white">
                <svg className="kpr-intro-logo__svg" viewBox="0 0 72 24" width="72" height="24">
                    <path d={KPR_PATH} fill="#fff" mask="url(#kpr-intro-mask)" />
                </svg>
            </div>
        </div>
    );
}
