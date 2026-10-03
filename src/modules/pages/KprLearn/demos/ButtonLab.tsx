'use client';

import { Demo, Slider, Toggle } from '../kit/controls';
import { useParams } from '../kit/loop';
import { BtnFrame, scrambleTween } from '../kit/source';

/**
 * Teaching copy of BtnFrame's path (dom/ui/BtnFrame.tsx): a rounded box whose bottom-right corner is a
 * cubic curve that blends from a quarter circle (k = 0) to a straight 45° cut (k = 1).
 */
function framePath(w: number, h: number, r: number, cut: number, k: number) {
    const o = 0.5;
    const W = w - o;
    const H = h - o;
    const c = r + (cut - r) * k;
    const m = (a: number, b: number) => a + (b - a) * k;
    const kap = 0.552 * c;
    const c1 = [m(W, W - c / 3), m(H - c + kap, H - (2 * c) / 3)];
    const c2 = [m(W - c + kap, W - (2 * c) / 3), m(H, H - c / 3)];
    const d = [
        `M${o + r},${o}`,
        `H${W - r}`,
        `Q${W},${o} ${W},${o + r}`,
        `V${H - c}`,
        `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${W - c},${H}`,
        `H${o + r}`,
        `Q${o},${H} ${o},${H - r}`,
        `V${o + r}`,
        `Q${o},${o} ${o + r},${o}`,
        'Z',
    ].join(' ');
    return { d, c1, c2, a: [W, H - c], b: [W - c, H] };
}

const DEFAULTS = { k: 1, handles: true };

/** Chapter 10: the CTA button's outline, as a morph you can scrub, next to the real component. */
export default function ButtonLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    // corner enlarged 2.5× (the page: r = 0.5 u, cut = 1.2 u) so the handles are visible
    const B = { w: 240, h: 72, r: 12, cut: 34 };
    const path = framePath(B.w, B.h, B.r, B.cut, p.k);
    return (
        <Demo
            title="The button’s cut corner morph"
            hint="Scrub k from 1 (45° cut) to 0 (rounded corner). Then hover the real button on the right: it runs the same morph in 0.5 s."
            onReset={reset}
            controls={
                <>
                    <Slider label="k (cut amount)" value={p.k} min={0} max={1} step={0.005} onChange={(v) => set('k', v)} help="1 = straight 45° cut (rest), 0 = rounded corner (hover)." />
                    <Toggle label="show curve handles" checked={p.handles} onChange={(v) => set('handles', v)} />
                </>
            }
        >
            <div className="grid items-center gap-8 p-6 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:p-10">
                <svg viewBox={`-20 -20 ${B.w + 40} ${B.h + 40}`} className="w-full overflow-visible" role="img" aria-label="The button outline with its corner curve">
                    <path d={path.d} fill="none" stroke="#0c0c0e" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                    {p.handles && (
                        <g>
                            <line x1={path.a[0]} y1={path.a[1]} x2={path.c1[0]} y2={path.c1[1]} stroke="#8b7ed9" strokeWidth={0.8} />
                            <line x1={path.b[0]} y1={path.b[1]} x2={path.c2[0]} y2={path.c2[1]} stroke="#8b7ed9" strokeWidth={0.8} />
                            {[path.c1, path.c2].map(([x, y], i) => (
                                <rect key={i} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="#5b4daa" />
                            ))}
                            {[path.a, path.b].map(([x, y], i) => (
                                <rect key={i} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="#c0fb50" stroke="#0c0c0e" strokeWidth={0.4} />
                            ))}
                        </g>
                    )}
                </svg>
                <div className="flex flex-col items-start gap-3">
                    <span className="kl-mono text-[10.5px] uppercase text-[var(--kl-dim)]">The real component (BtnFrame)</span>
                    <a href="#words" className="kl-kprbtn" onPointerEnter={(e) => scrambleTween(e.currentTarget, 0.45)} onClick={(e) => e.preventDefault()}>
                        <BtnFrame />
                        <span className="kpr-hacky">
                            <span className="kpr-hacky__spacer">Become a keeper</span>
                            <span className="kpr-hacky__anim" aria-hidden>
                                Become a keeper
                            </span>
                        </span>
                    </a>
                </div>
            </div>
        </Demo>
    );
}
