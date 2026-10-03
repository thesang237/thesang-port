'use client';

import { useEffect, useRef } from 'react';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useParams } from '../kit/loop';
import { curvePath, mapX, mapY } from '../kit/plot';
import { SCROLL_TOTAL, scrollFromT, tFromScroll, TOTAL } from '../kit/source';

import { actAt, drawCards, sampleAt } from './xray';

/** the film times where the warp changes speed (timeline.ts WARP knots) */
const KNOTS = [0, 2.0, 4.15, 8.35, 9.7, 18.3, TOTAL];
const S_END = SCROLL_TOTAL + 1;
const T_END = TOTAL + 1;

const DEFAULTS = { s: 1.0, warp: true };

/**
 * Chapter 01: the scroll warp. x = screens actually scrolled, y = film time shown. The real curve is
 * `tFromScroll` from the source; the dashed line is what 1 screen = 1 film screen would be.
 */
export default function WarpGraph() {
    const { p, set, reset } = useParams(DEFAULTS);
    const canvas = useRef<HTMLCanvasElement>(null);
    const filmT = p.warp ? tFromScroll(p.s) : p.s;
    const slope = p.warp ? (tFromScroll(p.s + 0.01) - tFromScroll(p.s - 0.01)) / 0.02 : 1;
    const G = { w: 520, h: 300 };
    const X1 = Math.max(S_END, T_END);

    useEffect(() => {
        const c = canvas.current;
        if (!c) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const r = c.getBoundingClientRect();
        c.width = Math.round(r.width * dpr);
        c.height = Math.round(r.height * dpr);
        const g = c.getContext('2d')!;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = '#fff';
        g.fillRect(0, 0, r.width, r.height);
        drawCards(g, sampleAt(Math.min(filmT, T_END)), r.width, r.height);
    }, [filmT]);

    return (
        <Demo
            title="Scroll warp — how much scroll each part of the film takes"
            hint="Drag “scrolled”. Steep parts of the curve play faster per screen of scroll (the hero, the intro, the logo beat, the launch)."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="scrolled (screens)"
                        value={p.s}
                        min={0}
                        max={p.warp ? S_END : T_END}
                        step={0.01}
                        onChange={(v) => set('s', v)}
                        help="How far the visitor’s wheel has moved the page."
                    />
                    <Toggle label="warp on" checked={p.warp} onChange={(v) => set('warp', v)} help="Off: 1 screen of scroll = 1 screen of film. The page gets 3.5 screens longer and the hero drags." />
                    <Readout
                        items={[
                            { label: 'film t', value: filmT.toFixed(2), color: '#c0fb50' },
                            { label: 'speed', value: `${slope.toFixed(2)}×` },
                            { label: 'act', value: actAt(filmT) },
                            { label: 'page length', value: `${(p.warp ? S_END : T_END).toFixed(1)} scr` },
                        ]}
                    />
                </>
            }
        >
            <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
                <svg viewBox={`-30 -10 ${G.w + 44} ${G.h + 40}`} className="w-full" role="img" aria-label="Film time against scroll position">
                    {[0, 5, 10, 15, 20].map((v) => (
                        <g key={v}>
                            <line x1={0} x2={G.w} y1={mapY(v, G.h, 0, X1)} y2={mapY(v, G.h, 0, X1)} stroke="rgba(0,0,0,0.07)" />
                            <text x={-8} y={mapY(v, G.h, 0, X1) + 4} fontSize={10} textAnchor="end" fontFamily="ui-monospace" fill="#8a8a94">
                                {v}
                            </text>
                            <text x={mapX(v, G.w, 0, X1)} y={G.h + 16} fontSize={10} textAnchor="middle" fontFamily="ui-monospace" fill="#8a8a94">
                                {v}
                            </text>
                        </g>
                    ))}
                    <path d={curvePath((x) => x, G.w, G.h, 0, X1, 0, X1, 2)} stroke="#8a8a94" strokeDasharray="4 4" fill="none" />
                    {p.warp && <path d={curvePath((x) => tFromScroll(x), (G.w * S_END) / X1, G.h, 0, S_END, 0, X1, 240)} stroke="#0c0c0e" strokeWidth={2.2} fill="none" />}
                    {p.warp &&
                        KNOTS.map((k) => (
                            <rect key={k} x={mapX(scrollFromT(k), G.w, 0, X1) - 3} y={mapY(k, G.h, 0, X1) - 3} width={6} height={6} fill="#8b7ed9">
                                <title>{`film ${k}`}</title>
                            </rect>
                        ))}
                    <line x1={mapX(p.s, G.w, 0, X1)} x2={mapX(p.s, G.w, 0, X1)} y1={mapY(filmT, G.h, 0, X1)} y2={G.h} stroke="#5b4daa" strokeDasharray="2 3" />
                    <line x1={0} x2={mapX(p.s, G.w, 0, X1)} y1={mapY(filmT, G.h, 0, X1)} y2={mapY(filmT, G.h, 0, X1)} stroke="#5b4daa" strokeDasharray="2 3" />
                    <rect x={mapX(p.s, G.w, 0, X1) - 6} y={mapY(filmT, G.h, 0, X1) - 6} width={12} height={12} fill="#c0fb50" stroke="#0c0c0e" />
                    <text x={G.w} y={G.h + 32} fontSize={10} textAnchor="end" fontFamily="ui-monospace" fill="#55555f">
                        {'SCROLLED (SCREENS) →'}
                    </text>
                    <text x={4} y={4} fontSize={10} fontFamily="ui-monospace" fill="#55555f">
                        {'↑ FILM T'}
                    </text>
                </svg>
                <div>
                    <canvas ref={canvas} className="block aspect-[16/10] w-full border border-[var(--kl-line-2)] bg-white" aria-hidden />
                    <p className="kl-mono mt-2 text-[10.5px] uppercase text-[var(--kl-dim)]">{`What the screen shows at film ${filmT.toFixed(2)}`}</p>
                </div>
            </div>
        </Demo>
    );
}
