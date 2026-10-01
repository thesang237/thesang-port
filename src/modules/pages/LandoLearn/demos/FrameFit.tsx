'use client';

import { useMemo } from 'react';

import { Btn, Demo, Group, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';

/**
 * Measured in the reference video (.clone-analysis/four_growth.json, “load”): the share of the frame that
 * shows through the “4” window, one value per video frame (30 fps). Area grows with scale², so
 * scale ∝ √(coverage − baseline). The first frame is smaller than the monogram noise and the last two are
 * clipped by the screen edge — they are shown but left out of the fit unless you include them.
 */
const COVERAGE = [0.0061, 0.0151, 0.0272, 0.0593, 0.1424, 0.2176, 0.3242];
const BASE = 0.004;
const DATA = COVERAGE.map((c) => Math.sqrt(c - BASE));
const NOTE = ['too small', '', '', '', '', 'edge clipped', 'edge clipped'];
const FPS = 30;
const EASES = ['expo.in', 'power4.in', 'power2.in', 'none', 'power2.out'] as const;
type Ease = (typeof EASES)[number];

const DEFAULTS = { ease: 'expo.in' as Ease, D: 0.51, endP: 0.99, all: false, log: true };

const LAST = DATA.length - 1;
const used = (all: boolean) => DATA.map((_, i) => all || NOTE[i] === '');
const lastUsed = (all: boolean) => used(all).lastIndexOf(true);

function model(ease: Ease, D: number, endP: number, ref: number) {
    const e = gsap.parseEase(ease);
    const end = Math.max(1e-6, e(endP));
    // time of each sample relative to the start of the tween; the reference sample sits at endP
    const at = (i: number) => endP * D - (ref - i) / FPS;
    const val = (t: number) => (t <= 0 ? 0 : e(Math.min(1, t / D)) / end);
    return { at, val };
}

function error(ease: Ease, D: number, endP: number, all: boolean) {
    const ref = lastUsed(all);
    const { at, val } = model(ease, D, endP, ref);
    const mask = used(all);
    let s = 0;
    let n = 0;
    for (let i = 0; i <= LAST; i++) {
        if (!mask[i]) continue;
        const m = val(at(i));
        s += m <= 0 ? 100 : Math.log2(m / (DATA[i] / DATA[ref])) ** 2;
        n++;
    }
    return Math.sqrt(s / n);
}

// chart space
const CW = 640;
const CH = 300;
const PAD = 36;
const F0 = -4;
const F1 = LAST + 2;
const Y0 = -5; // log2 range
const Y1 = 1;
const x = (frame: number) => PAD + ((frame - F0) / (F1 - F0)) * (CW - PAD * 2);

export default function FrameFit() {
    const { p, set, reset } = useParams(DEFAULTS);
    const y = (v: number) => {
        if (p.log) {
            const l = Math.min(Y1, Math.max(Y0, Math.log2(Math.max(v, 1e-9))));
            return CH - PAD - ((l - Y0) / (Y1 - Y0)) * (CH - PAD * 2);
        }
        return CH - PAD - Math.min(1.7, v) * (CH - PAD * 2) * 0.58;
    };

    const ref = lastUsed(p.all);
    const mask = used(p.all);
    const norm = DATA.map((v) => v / DATA[ref]);

    const { curve, err, samples } = useMemo(() => {
        const m = model(p.ease, p.D, p.endP, ref);
        const pts: string[] = [];
        for (let f = F0; f <= F1; f += 0.05) {
            const t = m.at(0) + f / FPS;
            const v = m.val(t);
            if (v > (p.log ? 2 ** Y0 : 0)) pts.push(`${x(f).toFixed(1)},${y(v).toFixed(1)}`);
        }
        return { curve: pts.join(' '), err: error(p.ease, p.D, p.endP, p.all), samples: DATA.map((_, i) => m.val(m.at(i))) };
        // y depends on p.log
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.ease, p.D, p.endP, p.log, p.all, ref]);

    const fit = () => {
        let best = { e: Infinity, D: p.D, endP: p.endP };
        for (let D = 0.2; D <= 1.2; D += 0.01)
            for (let e = 0.2; e <= 1; e += 0.01) {
                const v = error(p.ease, D, e, p.all);
                if (v < best.e) best = { e: v, D, endP: e };
            }
        set('D', +best.D.toFixed(2));
        set('endP', +best.endP.toFixed(2));
    };

    const verdict = err < 0.12 ? 'great fit' : err < 0.3 ? 'close' : 'poor fit';

    return (
        <Demo
            title="Frame fit — which ease grew the “4”?"
            hint="Each dot is one video frame (label = share of the screen visible through the “4”). Pick an ease, press “Auto-fit”, compare the error. Then include the clipped frames and fit again."
            onReset={reset}
            controls={
                <>
                    <Group title="Candidate">
                        <Segmented label="ease" options={EASES} value={p.ease} onChange={(v) => set('ease', v)} />
                        <Slider label="duration" value={p.D} min={0.2} max={1.2} onChange={(v) => set('D', v)} format={(v) => `${v.toFixed(2)} s`} help="Total length of the tween." />
                        <Slider
                            label="last dot at"
                            value={p.endP}
                            min={0.2}
                            max={1}
                            onChange={(v) => set('endP', v)}
                            format={(v) => `${Math.round(v * 100)}%`}
                            help="How far through the tween the last used frame was. The glyph fills the screen before the tween ends."
                        />
                        <Btn primary onClick={fit}>
                            Auto-fit this ease
                        </Btn>
                    </Group>
                    <Group title="Data">
                        <Toggle
                            label="include noisy + clipped frames"
                            checked={p.all}
                            onChange={(v) => set('all', v)}
                            help="The hollow dots: one frame smaller than the noise, two where the glyph already touches the screen edge (its area stops growing)."
                        />
                        <Toggle label="log scale" checked={p.log} onChange={(v) => set('log', v)} help="On a log scale, exponential growth is a straight line." />
                    </Group>
                    <Readout
                        items={[
                            { label: 'error', value: err.toFixed(3), color: err < 0.12 ? 'var(--ll-lime)' : err < 0.3 ? 'var(--ll-gold)' : 'var(--ll-warn)' },
                            { label: 'verdict', value: verdict },
                            { label: 'k (expo)', value: p.ease === 'expo.in' ? `${((10 * Math.LN2) / p.D).toFixed(1)} /s` : '—' },
                            { label: 'doubles', value: p.ease === 'expo.in' ? `every ${((p.D / 10) * 1000).toFixed(0)} ms` : '—' },
                        ]}
                    />
                </>
            }
        >
            <div className="ll-scrollbox overflow-x-auto p-4">
                <svg viewBox={`0 0 ${CW} ${CH}`} className="min-w-[520px]" role="img" aria-label="Measured glyph growth per frame and the fitted ease curve">
                    {/* grid */}
                    {Array.from({ length: F1 - F0 + 1 }, (_, i) => F0 + i).map((f) => (
                        <g key={f}>
                            <line x1={x(f)} x2={x(f)} y1={PAD} y2={CH - PAD} stroke="rgba(241,243,232,0.06)" />
                            <text x={x(f)} y={CH - PAD + 16} fill="#7f8375" fontSize="9" textAnchor="middle" fontFamily="var(--font-ll-mono)">
                                {f}
                            </text>
                        </g>
                    ))}
                    {p.log &&
                        [1, 0, -1, -2, -3, -4, -5].map((l) => (
                            <text key={l} x={PAD - 6} y={y(2 ** l) + 3} fill="#7f8375" fontSize="9" textAnchor="end" fontFamily="var(--font-ll-mono)">
                                {l >= 0 ? `×${2 ** l}` : `1/${2 ** -l}`}
                            </text>
                        ))}
                    <text x={CW - PAD} y={CH - 6} fill="#7f8375" fontSize="9" textAnchor="end" fontFamily="var(--font-ll-mono)">
                        video frame (1/30 s) →
                    </text>
                    {/* model */}
                    <polyline points={curve} fill="none" stroke="#cdff0b" strokeWidth="2" />
                    {samples.map((m, i) => (!mask[i] ? null : <line key={i} x1={x(i)} x2={x(i)} y1={y(norm[i])} y2={y(Math.max(m, 1e-9))} stroke="rgba(255,179,107,0.7)" strokeDasharray="2 2" />))}
                    {/* data */}
                    {norm.map((v, i) => (
                        <g key={i}>
                            <circle cx={x(i)} cy={y(v)} r="4.5" fill={mask[i] ? '#f1f3e8' : '#171a12'} stroke={mask[i] ? '#f1f3e8' : '#7f8375'} strokeWidth="1.5" />
                            <text x={x(i)} y={y(v) - 9} fill={mask[i] ? '#b5b7ae' : '#7f8375'} fontSize="9" textAnchor="middle" fontFamily="var(--font-ll-mono)">
                                {NOTE[i] || `${(COVERAGE[i] * 100).toFixed(1)}%`}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </Demo>
    );
}
