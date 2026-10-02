'use client';

import { useEffect, useRef } from 'react';

import { gsap } from '@/components/motion-kit/gsap';

/**
 * The button outline from the reference: a rounded box whose bottom-right corner is a 45° cut.
 * Drawn as one SVG path at the button's real size, so the hairline follows the cut too. On hover the
 * cut morphs smoothly into a normal rounded corner (`k` 1 → 0) while the fill switches at once (CSS).
 */
function framePath(w: number, h: number, r: number, cut: number, k: number) {
    const o = 0.5; // half the 1px stroke, so the line sits inside the box
    const W = w - o;
    const H = h - o;
    const c = r + (cut - r) * k; // how far the bottom-right corner reaches along each edge
    // corner control points: a quarter circle (k = 0) → a straight 45° line (k = 1), interpolated
    const m = (a: number, b: number) => a + (b - a) * k;
    const kap = 0.552 * c;
    const c1x = m(W, W - c / 3);
    const c1y = m(H - c + kap, H - (2 * c) / 3);
    const c2x = m(W - c + kap, W - (2 * c) / 3);
    const c2y = m(H, H - c / 3);
    return [
        `M${o + r},${o}`,
        `H${W - r}`,
        `Q${W},${o} ${W},${o + r}`,
        `V${H - c}`,
        `C${c1x},${c1y} ${c2x},${c2y} ${W - c},${H}`,
        `H${o + r}`,
        `Q${o},${H} ${o},${H - r}`,
        `V${o + r}`,
        `Q${o},${o} ${o + r},${o}`,
        'Z',
    ].join(' ');
}

export default function BtnFrame() {
    const svg = useRef<SVGSVGElement>(null);
    const path = useRef<SVGPathElement>(null);

    useEffect(() => {
        const el = svg.current!;
        const btn = el.parentElement!;
        const st = { k: 1, w: 0, h: 0, r: 5, cut: 12 };
        const draw = () => {
            if (st.w < 2) return;
            el.setAttribute('viewBox', `0 0 ${st.w} ${st.h}`);
            path.current!.setAttribute('d', framePath(st.w, st.h, st.r, st.cut, st.k));
        };
        const measure = () => {
            const b = btn.getBoundingClientRect();
            const u = Math.min(12, Math.max(6.4, window.innerWidth * 0.00625));
            Object.assign(st, { w: b.width, h: b.height, r: 0.5 * u, cut: 1.2 * u });
            draw();
        };
        const ro = new ResizeObserver(measure);
        ro.observe(btn);
        measure();
        const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const to = (k: number) => {
            gsap.to(st, { k, duration: reduced() ? 0 : 0.5, ease: 'power2.inOut', overwrite: true, onUpdate: draw });
        };
        const enter = () => to(0);
        const leave = () => to(1);
        btn.addEventListener('pointerenter', enter);
        btn.addEventListener('pointerleave', leave);
        btn.addEventListener('focus', enter);
        btn.addEventListener('blur', leave);
        return () => {
            ro.disconnect();
            gsap.killTweensOf(st);
            btn.removeEventListener('pointerenter', enter);
            btn.removeEventListener('pointerleave', leave);
            btn.removeEventListener('focus', enter);
            btn.removeEventListener('blur', leave);
        };
    }, []);

    return (
        <svg ref={svg} className="kpr-btn__bg" aria-hidden="true" preserveAspectRatio="none">
            <path ref={path} />
        </svg>
    );
}
