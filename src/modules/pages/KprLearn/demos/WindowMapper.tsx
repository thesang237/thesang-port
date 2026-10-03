'use client';

import { Demo, Readout, Segmented, Slider } from '../kit/controls';
import { useParams } from '../kit/loop';
import { curvePath, mapX, mapY } from '../kit/plot';
import { ease, lerp, seg, sub, W } from '../kit/source';

const WINDOWS = {
    introOut: W.introOut,
    glyph: W.glyph,
    galleryIn: W.galleryIn,
    keepIn: W.keepIn,
    handoff1: W.handoff1,
} as const;
type WinKey = keyof typeof WINDOWS;
type EaseKey = keyof typeof ease;

const DEFAULTS = { win: 'introOut' as WinKey, t: 4.3, f0: 0, f1: 0.45, ease: 'inOutStrong' as EaseKey, from: -260, to: 260 };

/**
 * Chapter 01: normalise → clamp → ease → lerp, with the source's own functions (seg, sub, ease, lerp).
 * Default: the hero card's grow-and-lean at the start of `introOut` (choreo.ts: io(sub(t, W.introOut, 0, 0.45))).
 */
export default function WindowMapper() {
    const { p, set, reset } = useParams(DEFAULTS);
    const w = WINDOWS[p.win];
    const span = w[1] - w[0];
    const t0 = w[0] - span * 0.35;
    const t1 = w[1] + span * 0.35;
    const raw = seg(p.t, w);
    const k = sub(p.t, w, p.f0, Math.max(p.f0 + 0.01, p.f1));
    const e = ease[p.ease](k);
    const out = lerp(p.from, p.to, e);
    const G = { w: 600, h: 180 };
    const curve = curvePath((x) => ease[p.ease](sub(x, w, p.f0, Math.max(p.f0 + 0.01, p.f1))), G.w, G.h, t0, t1, -0.05, 1.05);
    const s0 = w[0] + span * p.f0;
    const s1 = w[0] + span * Math.max(p.f0 + 0.01, p.f1);

    return (
        <Demo
            title="Window mapper — seg → sub → ease → lerp"
            hint="Drag the film clock through the window. The card only moves inside its slice of the window, and the curve decides how."
            onReset={reset}
            controls={
                <>
                    <Segmented label="window (from W)" options={Object.keys(WINDOWS) as WinKey[]} value={p.win} onChange={(v) => set('win', v)} />
                    <Slider label="film t" value={p.t} min={t0} max={t1} step={0.005} onChange={(v) => set('t', v)} help="The playhead, in screens." />
                    <Slider label="slice from" value={p.f0} min={0} max={0.95} step={0.01} onChange={(v) => set('f0', v)} help="sub(): where inside the window this value starts (0 = window start)." />
                    <Slider label="slice to" value={p.f1} min={0.05} max={1} step={0.01} onChange={(v) => set('f1', v)} help="…and where it is done (1 = window end)." />
                    <Segmented label="ease (timeline.ts)" options={Object.keys(ease) as EaseKey[]} value={p.ease} onChange={(v) => set('ease', v)} />
                    <Slider label="from px" value={p.from} min={-400} max={400} step={1} onChange={(v) => set('from', v)} help="lerp start value" />
                    <Slider label="to px" value={p.to} min={-400} max={400} step={1} onChange={(v) => set('to', v)} help="lerp end value" />
                </>
            }
        >
            <div className="p-4 sm:p-6">
                {/* the card on a track */}
                <div className="relative mb-6 h-[110px] overflow-hidden bg-[var(--kl-panel-2)]">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--kl-line-2)]" />
                    <div
                        className="kl-notch absolute top-1/2 h-[70px] w-[86px] bg-[var(--kl-lav)]"
                        style={{ left: `calc(50% + ${(out / 400) * 42}%)`, transform: 'translate(-50%, -50%)', ['--n-w' as string]: '45%', ['--n-d' as string]: '10px' }}
                    />
                </div>
                <div>
                    <svg viewBox={`-8 -8 ${G.w + 16} ${G.h + 36}`} className="w-full" role="img" aria-label="Eased progress through the window">
                        <rect x={mapX(w[0], G.w, t0, t1)} y={0} width={mapX(w[1], G.w, t0, t1) - mapX(w[0], G.w, t0, t1)} height={G.h} fill="rgba(139,126,217,0.12)" />
                        <rect x={mapX(s0, G.w, t0, t1)} y={0} width={mapX(s1, G.w, t0, t1) - mapX(s0, G.w, t0, t1)} height={G.h} fill="rgba(192,251,80,0.35)" />
                        <line x1={0} x2={G.w} y1={mapY(0, G.h, -0.05, 1.05)} y2={mapY(0, G.h, -0.05, 1.05)} stroke="rgba(0,0,0,0.2)" />
                        <line x1={0} x2={G.w} y1={mapY(1, G.h, -0.05, 1.05)} y2={mapY(1, G.h, -0.05, 1.05)} stroke="rgba(0,0,0,0.2)" strokeDasharray="3 3" />
                        <path d={curve} fill="none" stroke="#0c0c0e" strokeWidth={2} />
                        <line x1={mapX(p.t, G.w, t0, t1)} x2={mapX(p.t, G.w, t0, t1)} y1={0} y2={G.h} stroke="#5b4daa" />
                        <rect x={mapX(p.t, G.w, t0, t1) - 5} y={mapY(e, G.h, -0.05, 1.05) - 5} width={10} height={10} fill="#5b4daa" />
                        <text x={mapX(w[0], G.w, t0, t1)} y={G.h + 16} fontSize={11} fontFamily="ui-monospace" fill="#55555f">
                            {w[0]}
                        </text>
                        <text x={mapX(w[1], G.w, t0, t1)} y={G.h + 16} fontSize={11} fontFamily="ui-monospace" fill="#55555f" textAnchor="end">
                            {w[1]}
                        </text>
                        <text x={mapX(p.t, G.w, t0, t1)} y={G.h + 30} fontSize={11} fontFamily="ui-monospace" fill="#5b4daa" textAnchor="middle">
                            {`t ${p.t.toFixed(2)}`}
                        </text>
                    </svg>
                </div>
                <div className="kl-mono mt-4 overflow-x-auto whitespace-nowrap bg-[var(--kl-black)] p-3 text-[12px] text-white" data-lenis-prevent>
                    {`lerp(${p.from}, ${p.to}, ease.${p.ease}(sub(${p.t.toFixed(2)}, [${w[0]}, ${w[1]}], ${p.f0}, ${p.f1}))) = `}
                    <span className="text-[var(--kl-lime)]">{out.toFixed(1)}px</span>
                </div>
                <div className="mt-3">
                    <Readout
                        items={[
                            { label: 'seg (whole window)', value: raw.toFixed(3) },
                            { label: 'sub (the slice)', value: k.toFixed(3) },
                            { label: 'eased', value: e.toFixed(3), color: '#c0fb50' },
                            { label: 'value', value: `${out.toFixed(1)} px` },
                        ]}
                    />
                </div>
            </div>
        </Demo>
    );
}
