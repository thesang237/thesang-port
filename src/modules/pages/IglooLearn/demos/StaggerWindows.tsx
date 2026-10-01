'use client';

import { useMemo, useRef, useState } from 'react';

import { Btn, Demo, Segmented, Slider } from '../kit/controls';
import { useParams, useTicker } from '../kit/loop';
import { clamp, ease, rng } from '../kit/math';

type Order = 'bottom → top' | 'top → bottom' | 'centre out' | 'random';
const DEFAULTS = { mode: 'build' as 'build' | 'explode', order: 'bottom → top' as Order, spread: 0.5, jitter: 0.14, dur: 0.42, ease: 'power3.out' };

type Brick = { x: number; y: number; w: number; h: number; h01: number; c01: number; rand: number; sx: number; sy: number; sr: number; fx: number; fy: number; fr: number };

// A 2D igloo: rows of bricks under a dome curve, every other row offset by half a brick.
function buildBricks(): Brick[] {
    const r = rng(7);
    const out: Brick[] = [];
    const rows = 8;
    const R = 150;
    for (let row = 0; row < rows; row++) {
        const phi = ((row + 0.5) / rows) * 1.38;
        const y = -Math.sin(phi) * R;
        const half = Math.cos(phi) * R;
        const n = Math.max(3, Math.round((half * 2) / 38));
        const w = (half * 2) / n;
        for (let k = 0; k < n; k++) {
            const x = -half + (k + 0.5 + (row % 2 ? 0.25 : -0.25)) * w;
            if (Math.abs(x) > half - w * 0.2) continue;
            const rand = r();
            out.push({
                x,
                y,
                w: w * 0.9,
                h: ((R * 1.38) / rows) * 0.82,
                h01: row / (rows - 1),
                c01: Math.abs(x) / R,
                rand,
                sx: (r() - 0.5) * 520,
                sy: -260 - r() * 200,
                sr: (r() - 0.5) * 540,
                fx: x * 1.6 + (r() - 0.5) * 160,
                fy: -120 - r() * 240 + (1 - row / rows) * 60,
                fr: (r() - 0.5) * 720,
            });
        }
    }
    return out;
}

/**
 * One progress value, dozens of personal time windows. Each brick computes
 * its own delay from its height (+ a little random) — like IglooWorld does
 * for the intro build and the scroll explosion.
 */
export default function StaggerWindows() {
    const { p, set, reset } = useParams(DEFAULTS);
    const [t, setT] = useState(0.55);
    const [playing, setPlaying] = useState(false);
    const host = useRef<HTMLDivElement>(null);
    const bricks = useMemo(() => buildBricks(), []);

    const key = (b: Brick) => {
        switch (p.order) {
            case 'top → bottom':
                return 1 - b.h01;
            case 'centre out':
                return b.c01;
            case 'random':
                return b.rand;
            default:
                return b.h01;
        }
    };
    // the whole sequence lasts spread + jitter + dur; the slider maps 0..1 onto it
    const total = p.spread + p.jitter + p.dur;
    const P = t * total;
    const f = ease(p.ease);

    useTicker(host, (_, dt) => {
        if (!playing) return;
        const n = Math.min(1, t + dt / 2.2);
        setT(n);
        if (n >= 1) setPlaying(false);
    });

    return (
        <Demo
            title="Stagger windows — one number, many timings"
            hint="Drag progress. Every brick has its own little window (bars below). Change the order and spread to choreograph the build."
            onReset={() => {
                reset();
                setT(0.55);
            }}
            controls={
                <>
                    <Slider label="progress" value={t} min={0} max={1} step={0.001} onChange={setT} help="The single number (intro or explode) the whole igloo reads." />
                    <Btn
                        primary
                        onClick={() => {
                            setT(0);
                            setPlaying(true);
                        }}
                    >
                        ▶ Play 0 → 1
                    </Btn>
                    <Segmented label="mode" options={['build', 'explode'] as const} value={p.mode} onChange={(v) => set('mode', v)} />
                    <Segmented label="order" options={['bottom → top', 'top → bottom', 'centre out', 'random'] as const} value={p.order} onChange={(v) => set('order', v)} />
                    <Slider
                        label="spread"
                        value={p.spread}
                        min={0}
                        max={1.2}
                        onChange={(v) => set('spread', v)}
                        help="How much the order key delays each brick. 0 = all at once. Igloo intro: 0.5 × height."
                    />
                    <Slider label="jitter" value={p.jitter} min={0} max={0.5} onChange={(v) => set('jitter', v)} help="Random extra delay per brick. Igloo: 0.14. Breaks the mechanical look." />
                    <Slider label="duration (each)" value={p.dur} min={0.05} max={1} onChange={(v) => set('dur', v)} help="How long one brick takes. Igloo: 0.42 in, 0.46 out." />
                    <Segmented label="ease (each)" options={['none', 'power3.out', 'expo.out', 'back.out(1.7)'] as const} value={p.ease} onChange={(v) => set('ease', v)} />
                </>
            }
        >
            <div ref={host}>
                <svg viewBox="-280 -330 560 380" className="block h-[340px] w-full">
                    <ellipse cx="0" cy="8" rx="230" ry="16" fill="rgba(148,219,255,0.06)" />
                    <line x1="-270" y1="0" x2="270" y2="0" stroke="rgba(196,212,235,0.2)" />
                    {bricks.map((b, i) => {
                        const delay = key(b) * p.spread + b.rand * p.jitter;
                        const lp = clamp((P - delay) / p.dur);
                        const e = f(lp);
                        let dx: number;
                        let dy: number;
                        let rot: number;
                        let op = 1;
                        if (p.mode === 'build') {
                            dx = b.sx * (1 - e);
                            dy = b.sy * (1 - e);
                            rot = b.sr * (1 - e);
                            op = lp <= 0 ? 0 : Math.min(1, lp * 4);
                        } else {
                            dx = b.fx * e;
                            dy = b.fy * e;
                            rot = b.fr * e;
                        }
                        const active = lp > 0 && lp < 1;
                        return (
                            <rect
                                key={i}
                                x={b.x - b.w / 2}
                                y={b.y - b.h}
                                width={b.w}
                                height={b.h}
                                rx={4}
                                opacity={op}
                                fill={active ? '#bfe6ff' : '#6d7888'}
                                stroke={active ? '#e8f6ff' : 'rgba(10,13,19,0.6)'}
                                style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` }}
                            />
                        );
                    })}
                </svg>

                {/* windows */}
                <div className="border-t border-[var(--il-line)] p-4">
                    <div className="il-mono mb-2 flex justify-between text-[10px] text-[var(--il-faint)]">
                        <span>{`each brick's window (sorted), total length = spread + jitter + duration = ${total.toFixed(2)}`}</span>
                    </div>
                    <div className="relative h-[92px]">
                        {[...bricks]
                            .map((b) => key(b) * p.spread + b.rand * p.jitter)
                            .sort((a, b) => a - b)
                            .map((d, i, arr) => {
                                const lp = clamp((P - d) / p.dur);
                                return (
                                    <span
                                        key={i}
                                        className="absolute h-px rounded-full"
                                        style={{
                                            left: `${(d / total) * 100}%`,
                                            width: `${(p.dur / total) * 100}%`,
                                            top: `${(i / arr.length) * 88}px`,
                                            background: lp >= 1 ? 'rgba(148,219,255,0.45)' : lp > 0 ? '#e8f6ff' : 'rgba(196,212,235,0.15)',
                                        }}
                                    />
                                );
                            })}
                        <span className="absolute inset-y-0 w-px bg-[var(--il-ink)]" style={{ left: `${t * 100}%` }} />
                    </div>
                </div>
            </div>
        </Demo>
    );
}
