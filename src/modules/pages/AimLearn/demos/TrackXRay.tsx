'use client';

import { useRef, useState } from 'react';

import { Btn, Demo, Group, Readout, Segmented, Slider } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { EASE, type Ease, type Key, sample, SCENES, scrollLottie, setLottieProgress, smooth, useLottie } from '../kit/source';

type EaseChoice = 'none' | 'out-cubic' | 'in-out-cubic';
const CHOICE: Record<EaseChoice, Ease | undefined> = { none: undefined, 'out-cubic': EASE.outCubic, 'in-out-cubic': EASE.inOutCubic };

const DEFAULTS = { target: 0, smoothing: 70, first: 'none' as EaseChoice, later: 'none' as EaseChoice };

type Row = { id: string; label: string; keys: Key[]; range: [number, number]; fmt: (v: number) => string };

const ROWS: Row[] = [
    { id: 'frame', label: 'lottie frame (% of the file)', keys: SCENES.LOGO_FRAME, range: [0, 100], fmt: (v) => `${v.toFixed(0)}%` },
    { id: 'scale', label: 'logo scale', keys: SCENES.LOGO_TRACKS.scale ?? [], range: [1, 4], fmt: (v) => `×${v.toFixed(2)}` },
    { id: 'opacity', label: 'logo opacity', keys: SCENES.LOGO_TRACKS.opacity ?? [], range: [0, 1], fmt: (v) => v.toFixed(2) },
];

/** Same keyframes, but with an ease on the first key and/or the later keys, to show which one the engine honours. */
const withEase = (keys: Key[], first?: Ease, later?: Ease): Key[] => keys.map((k, i) => [k[0], k[1], i === 0 ? first : later] as Key);

const GRAPH_W = 300;
const GRAPH_H = 44;

function Graph({ row, keys, at }: { row: Row; keys: Key[]; at: number }) {
    const [lo, hi] = row.range;
    const x = (pct: number) => (pct / 100) * GRAPH_W;
    const y = (v: number) => GRAPH_H - 4 - ((v - lo) / (hi - lo)) * (GRAPH_H - 8);
    const pts = Array.from({ length: 101 }, (_, i) => `${x(i).toFixed(1)},${y(sample(keys, i)).toFixed(1)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} className="block h-11 w-full" role="img" aria-label={`${row.label} track`}>
            <polyline points={pts} fill="none" stroke="var(--al-ink)" strokeWidth="1.5" />
            {keys.map((k) => (
                <rect key={k[0]} x={x(k[0]) - 3} y={y(k[1]) - 3} width="6" height="6" fill="var(--al-accent)" stroke="var(--al-ink)" strokeWidth="1" />
            ))}
            <line x1={x(at)} x2={x(at)} y1="0" y2={GRAPH_H} stroke="var(--al-accent-ink)" strokeWidth="1.5" />
        </svg>
    );
}

/** The page's real logo tracks as a graph, with a live logo preview and the smoothing dial. */
export default function TrackXRay() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const logo = useRef<HTMLDivElement>(null);
    const wrap = useRef<HTMLDivElement>(null);
    const cur = useRef(0);
    const [shown, setShown] = useState(0);
    const anim = useLottie(logo, scrollLottie);

    useTicker(host, (_t, dt) => {
        const frames = Math.min(Math.max(dt * 60, 0.25), 4); // the page smooths once per 60Hz frame
        const r = ref.current;
        cur.current = smooth(cur.current, r.target, r.smoothing, frames);
        const at = cur.current;
        const first = CHOICE[r.first];
        const later = CHOICE[r.later];
        setLottieProgress(anim.current, sample(withEase(SCENES.LOGO_FRAME, first, later), at));
        if (wrap.current) {
            wrap.current.style.transform = `scale(${sample(withEase(SCENES.LOGO_TRACKS.scale ?? [], first, later), at)})`;
            wrap.current.style.opacity = String(sample(withEase(SCENES.LOGO_TRACKS.opacity ?? [], first, later), at));
        }
        setShown((s) => (Math.abs(s - at) > 0.02 ? at : s));
    });

    const first = CHOICE[p.first];
    const later = CHOICE[p.later];
    const lag = Math.abs(p.target - shown);

    return (
        <Demo
            title="Track x-ray: keyframes in, values out"
            hint="Drag “scroll progress”. The orange squares are the page’s real keyframes; the red line is the smoothed playhead. Then try the ease dials."
            onReset={() => {
                reset();
                cur.current = 0;
            }}
            controls={
                <>
                    <Slider
                        label="scroll progress (target)"
                        value={p.target}
                        min={0}
                        max={40}
                        step={0.1}
                        onChange={(v) => set('target', v)}
                        format={(v) => `${v.toFixed(1)}%`}
                        help="Of the whole page. The logo scene lives in the first 35%."
                    />
                    <div className="flex flex-wrap gap-1.5">
                        {[0, 10, 22, 35].map((v) => (
                            <Btn key={v} onClick={() => set('target', v)}>
                                {`${v}%`}
                            </Btn>
                        ))}
                    </div>
                    <Slider
                        label="smoothing"
                        value={p.smoothing}
                        min={0}
                        max={95}
                        step={1}
                        onChange={(v) => set('smoothing', v)}
                        format={(v) => `${v}`}
                        help="0 = glued to the scroll. The page uses 70. Jump between the buttons above to see the glide."
                    />
                    <Group title="Curves (the engine’s rule)">
                        <Segmented label="ease on the first key" options={['none', 'out-cubic', 'in-out-cubic'] as const} value={p.first} onChange={(v) => set('first', v)} />
                        <Segmented label="ease on later keys" options={['none', 'out-cubic', 'in-out-cubic'] as const} value={p.later} onChange={(v) => set('later', v)} />
                        <p className="text-[11.5px] leading-snug text-[var(--al-faint)]">
                            {first ? 'The first key’s curve now shapes every segment.' : 'Linear, like the page.'} Curves on later keys are ignored by the engine: change them and nothing moves.
                        </p>
                    </Group>
                    <Readout
                        items={[
                            { label: 'target', value: `${p.target.toFixed(1)}%` },
                            { label: 'playhead', value: `${shown.toFixed(1)}%`, color: 'var(--al-accent-ink)' },
                            { label: 'gap', value: `${lag.toFixed(2)}%` },
                            { label: 'engine', value: first ? 'curved' : 'linear' },
                        ]}
                    />
                </>
            }
        >
            <div ref={host} className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="border-b border-[var(--al-line-2)] bg-[#e7e4df] sm:border-b-0 sm:border-r">
                    <div className="relative aspect-[1440/860] overflow-hidden">
                        <div ref={wrap} className="h-full w-full origin-center will-change-transform">
                            <div ref={logo} className="h-full w-full" />
                        </div>
                    </div>
                    <p className="al-mono px-3 pb-3 text-[10px] text-[#6b6862]">the page’s own logo animation, driven by the tracks on the right</p>
                </div>
                <div className="space-y-3 p-4">
                    {ROWS.map((row) => {
                        const keys = withEase(row.keys, first, later);
                        return (
                            <div key={row.id}>
                                <div className="al-mono mb-0.5 flex justify-between text-[10px] uppercase tracking-[0.1em] text-[var(--al-faint)]">
                                    <span>{row.label}</span>
                                    <span className="tabular-nums text-[var(--al-accent-ink)]">{row.fmt(sample(keys, shown))}</span>
                                </div>
                                <Graph row={row} keys={keys} at={shown} />
                            </div>
                        );
                    })}
                    <p className="al-mono text-[10px] text-[var(--al-faint)]">x axis: 0% → 100% of the page’s scroll</p>
                </div>
            </div>
        </Demo>
    );
}
