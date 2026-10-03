'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Btn, Demo, Group, Slider } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';

/**
 * Chapter 09: teaching copy of the opening (dom/hud/Intro.tsx) with a neutral word. The word is masked
 * by a grid of slanted pieces; each piece has a seeded moment to switch on (left to right, while it
 * builds) and to switch off (breaking apart). A white copy is clipped to the card that opens in the
 * middle, so the letters turn white over the picture.
 */
const DEFAULTS = { build: 1, open: 0, breakUp: 0, cols: 24, rows: 6, slant: 28 };
const VB = { w: 72, h: 24 };

function pieces(cols: number, rows: number) {
    // Intro.tsx: a seeded generator, so every visit plays the same
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out: { x: number; y: number; on: number; off: number }[] = [];
    for (let c = 0; c < cols; c++)
        for (let r = 0; r < rows; r++) {
            const fx = c / cols;
            out.push({ x: (c / cols) * 80 - 4, y: (r / rows) * 24, on: fx * 0.7 + rnd() * 0.3, off: rnd() * 0.75 + (1 - fx) * 0.25 });
        }
    return out;
}

export default function WordmarkLab() {
    const { p, set, merge, reset } = useParams(DEFAULTS);
    const list = useMemo(() => pieces(p.cols, p.rows), [p.cols, p.rows]);
    const tl = useRef<gsap.core.Timeline | null>(null);
    useEffect(() => () => void tl.current?.kill(), []);

    // the opening's timing (Intro.tsx T): build 0.3–1.5 s, card opens 2.1–3.45 s, breaks 3.2–4.2 s
    const play = () => {
        tl.current?.kill();
        const st = { build: 0, open: 0, breakUp: 0 };
        merge(st);
        tl.current = gsap
            .timeline({ onUpdate: () => merge({ ...st }) })
            .to(st, { build: 1, duration: 1.2, ease: 'none' }, 0.3)
            .to(st, { open: 1, duration: 1.35, ease: 'none' }, 2.1)
            .to(st, { breakUp: 1, duration: 1.0, ease: 'none' }, 3.2);
    };

    // the card: a thin line that grows tall, widens into a narrow card, then opens wide (choreo.ts introRect)
    const io = (k: number) => (k < 0.5 ? 8 * k ** 4 : 1 - (-2 * k + 2) ** 4 / 2);
    const out = (k: number) => 1 - Math.pow(2, -10 * k);
    const c = (v: number) => Math.min(1, Math.max(0, v));
    const hk = io(c(p.open / 0.38));
    const w1 = out(c((p.open - 0.08) / 0.5));
    const w2 = io(c((p.open - 0.42) / 0.58));
    const cardW = (0.3 + (13 - 0.3) * w1) * (1 - w2) + 100 * w2; // % of the stage
    const cardH = 30 + 70 * hk;
    const inset = `inset(${(100 - cardH) / 2}% ${(100 - cardW) / 2}% ${(100 - cardH) / 2}% ${(100 - cardW) / 2}%)`;

    const mask = (id: string) => (
        <mask id={id} maskUnits="userSpaceOnUse" x={-8} y={-2} width={88} height={28}>
            {list.map((pc, i) => {
                const on = p.build >= pc.on && !(p.breakUp > 0 && p.breakUp >= pc.off);
                return on ? (
                    <rect
                        key={i}
                        x={pc.x}
                        y={pc.y}
                        width={80 / p.cols + 0.15}
                        height={24 / p.rows + 0.15}
                        fill="#fff"
                        transform={`skewX(${-p.slant}) translate(${pc.y * Math.tan((p.slant * Math.PI) / 180)} 0)`}
                    />
                ) : null;
            })}
        </mask>
    );
    const word = (fill: string, m: string) => (
        <text x={36} y={19.5} textAnchor="middle" fontSize={23} fontWeight={800} letterSpacing={-1.4} fill={fill} mask={`url(#${m})`} style={{ fontFamily: 'var(--kl-sans)' }}>
            KEEP
        </text>
    );

    return (
        <Demo
            title="Building and breaking a wordmark"
            hint="Press play for the opening’s timing, or drag the three phases by hand. The pieces are seeded: the same pattern every visit."
            onReset={() => {
                tl.current?.kill();
                reset();
            }}
            controls={
                <>
                    <Btn primary onClick={play}>
                        ▶ Play the opening
                    </Btn>
                    <Group title="Phases">
                        <Slider
                            label="build"
                            value={p.build}
                            min={0}
                            max={1}
                            step={0.005}
                            onChange={(v) => set('build', v)}
                            help="Pieces switch on roughly left to right (on = x × 0.7 + random × 0.3)."
                        />
                        <Slider label="card opens" value={p.open} min={0} max={1} step={0.005} onChange={(v) => set('open', v)} help="A line grows tall, widens into a narrow card, then opens wide." />
                        <Slider label="break apart" value={p.breakUp} min={0} max={1} step={0.005} onChange={(v) => set('breakUp', v)} help="Pieces switch off at random, the right side first." />
                    </Group>
                    <Group title="Pieces">
                        <Slider label="columns" value={p.cols} min={4} max={48} step={1} onChange={(v) => set('cols', v)} />
                        <Slider label="rows" value={p.rows} min={1} max={12} step={1} onChange={(v) => set('rows', v)} />
                        <Slider
                            label="slant"
                            value={p.slant}
                            min={0}
                            max={50}
                            step={1}
                            onChange={(v) => set('slant', v)}
                            format={(v) => `${v}°`}
                            help="Source 28°: the pieces echo the 45°-ish cuts of the cards."
                        />
                    </Group>
                </>
            }
        >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-white">
                {/* the "painting" that the card reveals */}
                <div className="absolute inset-0 bg-[linear-gradient(160deg,#3d3478,#8b7ed9_55%,#e9b49a)]" style={{ clipPath: inset }} />
                <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 overflow-visible" aria-hidden>
                    <defs>{mask('kl-wm-a')}</defs>
                    {word('#0c0c0e', 'kl-wm-a')}
                </svg>
                {/* the white copy, clipped to the card */}
                <div className="absolute inset-0" style={{ clipPath: inset }}>
                    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 overflow-visible" aria-hidden>
                        <defs>{mask('kl-wm-b')}</defs>
                        {word('#ffffff', 'kl-wm-b')}
                    </svg>
                </div>
            </div>
        </Demo>
    );
}
