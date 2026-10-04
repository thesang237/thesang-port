'use client';

import { type CSSProperties, useMemo, useRef, useState } from 'react';

import { Btn, Demo, Readout, Slider } from '../kit/controls';
import { prefersReducedMotion, useTicker } from '../kit/loop';
import { CHAPTERS, ENGINE, LAST, SECTIONS, smooth, Timeline } from '../kit/source';

/**
 * Engine.tick, frozen at any step you choose. The real Timeline turns the step into the story
 * position and dwell; the same formulas as the engine pick the worlds, the transition and its
 * progress, the copy and title visibility and the side-nav ring. The mini screen applies the wipe
 * (or blend) to stills of the real stops.
 */
const W = ENGINE.wipe;

function frameAt(tl: Timeline, step: number) {
    const story = tl.toStory(step);
    const pos = story.pos;
    const i0 = Math.min(Math.floor(pos), LAST + 1);
    const f = pos - i0;
    const chapterAt = (i: number) => (i > LAST ? 0 : i);
    const A = chapterAt(i0);
    const Bc = chapterAt(i0 + 1);
    const worldA = CHAPTERS[A].world;
    const worldB = f > 1e-4 ? CHAPTERS[Bc].world : worldA;
    let mode = 0;
    let p = 0;
    if (worldA !== worldB) {
        mode = CHAPTERS[Bc].enter === 'wipe' ? 1 : 2;
        p = mode === 1 ? smooth(W.window[0], W.window[1], f) : smooth(0, 1, f);
    } else if (f > 1e-4) {
        // same world: the engine keeps one world; the world blends its own stops by `local`
        p = smooth(0, 1, f);
    }
    const nearest = Math.round(pos) > LAST ? 0 : Math.round(pos);
    const copy = Math.abs(pos - Math.round(pos)) < ENGINE.copyNear ? nearest : -1;
    const sec = tl.section(Math.min(step, tl.total - 1e-6));
    // title visibility of the nearest chapter (Engine.updateTitles)
    const d = Math.abs(pos - nearest);
    const titleVis = 1 - smooth(ENGINE.titleOut[0], ENGINE.titleOut[1], d);
    return { pos, dwell: story.dwell, A, B: Bc, worldA, worldB, mode, p, f, copy, nearest, sec, titleVis };
}

export default function StoryXray() {
    const tl = useMemo(() => new Timeline(), []);
    const [step, setStep] = useState(1.5);
    const [playing, setPlaying] = useState(false);
    const host = useRef<HTMLDivElement>(null);
    // "play" = the real feel: glide step by step on the landing spring (ω 2.5), pausing on each step
    const play = useRef({ x: 0, v: 0, target: 0 });
    const fr = frameAt(tl, step);

    useTicker(host, (_t, dt) => {
        if (!playing) return;
        const s = play.current;
        const w = ENGINE.scroll.wSettle;
        const n = Math.max(1, Math.ceil(dt / (1 / 120)));
        for (let i = 0; i < n; i++) {
            const a = w * w * (s.target - s.x) - 2 * w * s.v;
            s.v += (a * dt) / n;
            s.x += (s.v * dt) / n;
        }
        if (Math.abs(s.target - s.x) < 0.002 && Math.abs(s.v) < 0.01) {
            s.x = s.target;
            s.v = 0;
            if (s.target >= tl.total) setPlaying(false);
            else s.target += 1;
        }
        setStep(s.x);
    });

    const togglePlay = () => {
        if (playing) return setPlaying(false);
        const start = step >= tl.total - 0.01 ? 0 : step;
        setStep(start);
        play.current = { x: start, v: 0, target: Math.floor(start) + 1 };
        setPlaying(true);
    };

    const imgA = fr.A;
    const imgB = fr.B;
    const wipeStyle = (): { a: CSSProperties; b: CSSProperties } => {
        if (fr.mode === 1) {
            // Composite.ts in CSS: the edge rises to the right (slope 0.248 screen px per px), old world
            // pushed up 22 %, new world rising from 30 % lower. uv y is bottom-up, CSS y top-down.
            const p = fr.p;
            const slope = W.slope * (1920 / 994);
            const hs = slope * 0.5;
            const mid = -hs - 0.02 + (1 + 2 * hs + 0.04) * p;
            const lift = W.liftNew * (1 - p) * 100;
            // the clip moves with the element's transform, so subtract the lift to keep the edge in screen space
            const yL = (1 - (mid - hs)) * 100 - lift;
            const yR = (1 - (mid + hs)) * 100 - lift;
            return {
                a: { transform: `translateY(${(-W.pushOld * p * 100).toFixed(2)}%)` },
                b: { clipPath: `polygon(0 ${yL.toFixed(2)}%, 100% ${yR.toFixed(2)}%, 100% 100%, 0 100%)`, transform: `translateY(${lift.toFixed(2)}%)` },
            };
        }
        if (fr.mode === 2 || (fr.f > 1e-4 && fr.worldA === fr.worldB)) return { a: {}, b: { opacity: fr.p } };
        return { a: {}, b: { opacity: 0 } };
    };
    const ws = wipeStyle();
    const segs = SECTIONS.map((_, k) => tl.segmentsOf(k));
    const slot = Math.max(0, fr.sec.index);
    const gap = 7;
    const dash = `${(100 / segs[slot] - gap).toFixed(2)} ${gap}`;

    // tracks drawn across all steps
    const N = Math.round(tl.total * 24);
    const track = (fn: (s: number) => number) => {
        let d = '';
        for (let i = 0; i <= N; i++) {
            const s = (i / N) * tl.total;
            const y = 1 - fn(s);
            d += `${i ? 'L' : 'M'}${((s / tl.total) * 1000).toFixed(1)},${(y * 30 + 4).toFixed(1)}`;
        }
        return d;
    };
    const tracks = useMemo(
        () => [
            { label: 'story position', color: '#e9c46a', d: track((s) => frameAt(tl, s).pos / (LAST + 1)) },
            { label: 'dwell', color: '#8fbf5a', d: track((s) => frameAt(tl, s).dwell) },
            { label: 'transition', color: '#55ffc2', d: track((s) => frameAt(tl, s).p) },
            { label: 'title shown', color: '#f2f5f1', d: track((s) => frameAt(tl, s).titleVis) },
            { label: 'copy shown', color: '#ed863b', d: track((s) => (frameAt(tl, s).copy >= 0 ? 1 : 0)) },
            { label: 'nav ring', color: '#7ddbbf', d: track((s) => frameAt(tl, s).sec.progress) },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tl],
    );

    return (
        <Demo
            title="Story x-ray: Engine.tick at any step"
            hint={
                <>
                    Drag the step slider (or press play for the real pacing). Watch which stills are on screen, the transition, and when title and copy appear.{' '}
                    {prefersReducedMotion() ? 'Play moves the picture; it only starts when you press it.' : ''}
                </>
            }
            controls={
                <>
                    <Slider
                        label="scroll step"
                        value={step}
                        min={0}
                        max={tl.total}
                        step={0.01}
                        onChange={(v) => {
                            setPlaying(false);
                            setStep(v);
                        }}
                        help="The scroller’s position. Whole numbers are where it rests."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Btn primary onClick={togglePlay}>
                            {playing ? 'Pause' : 'Play the story'}
                        </Btn>
                        <Btn
                            onClick={() => {
                                setPlaying(false);
                                setStep(Math.min(tl.total, Math.floor(step + 1e-6) + 1));
                            }}
                        >
                            Next step
                        </Btn>
                    </div>
                    <Readout
                        items={[
                            { label: 'step', value: step.toFixed(2) },
                            { label: 'story pos', value: fr.pos.toFixed(2), color: '#e9c46a' },
                            { label: 'dwell', value: fr.dwell.toFixed(2), color: '#8fbf5a' },
                            { label: 'world A', value: fr.worldA },
                            { label: 'world B', value: fr.worldB === fr.worldA && fr.f < 1e-4 ? '—' : fr.worldB },
                            { label: 'mode', value: fr.mode === 1 ? 'wipe' : fr.mode === 2 ? 'blend' : fr.f > 1e-4 ? 'in-world blend' : 'one world', color: '#55ffc2' },
                            { label: 'progress p', value: fr.p.toFixed(2), color: '#55ffc2' },
                            { label: 'copy for', value: fr.copy >= 0 ? CHAPTERS[fr.copy].id : '—', color: '#ed863b' },
                        ]}
                    />
                    <div className="flex items-center gap-3">
                        <svg viewBox="0 0 40 40" className="size-12 shrink-0" aria-label="Side nav ring">
                            <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(242,245,241,0.3)" strokeWidth="1.5" pathLength="100" strokeDasharray={dash} strokeDashoffset={-gap / 2} />
                            <circle
                                cx="20"
                                cy="20"
                                r="17"
                                fill="none"
                                stroke="#f2f5f1"
                                strokeWidth="1.5"
                                pathLength="100"
                                strokeDasharray={`${(fr.sec.progress * 100).toFixed(2)} 100`}
                                transform="rotate(-90 20 20)"
                            />
                            <circle cx="20" cy="20" r="2" fill="#f2f5f1" />
                        </svg>
                        <p className="text-[12px] leading-snug text-[var(--cl-dim)]">
                            {fr.sec.index >= 0 ? `${SECTIONS[fr.sec.index].label}: ${segs[slot]} snaps, ${Math.round(fr.sec.progress * 100)} % through` : 'hero: no section, ring hidden'}
                        </p>
                    </div>
                </>
            }
        >
            <div ref={host} className="p-4 sm:p-5">
                <div className="relative aspect-[1920/994] overflow-hidden rounded-lg border border-[var(--cl-line-2)] bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/corn-learn/stops/stop${imgA}.webp`} alt="" className="absolute inset-0 size-full object-cover" style={ws.a} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/corn-learn/stops/stop${imgB}.webp`} alt="" className="absolute inset-0 size-full object-cover" style={ws.b} />
                    <span className="cl-mono absolute left-3 top-3 rounded-full bg-[rgba(3,8,6,0.75)] px-2.5 py-1 text-[10.5px] uppercase">{`pos ${fr.pos.toFixed(2)}`}</span>
                </div>
                <div className="cl-scrollbox mt-4 overflow-x-auto" data-lenis-prevent>
                    <div className="min-w-[640px]">
                        {tracks.map((t) => (
                            <div key={t.label} className="flex items-center gap-3">
                                <span className="cl-mono w-[104px] shrink-0 text-[10px] uppercase" style={{ color: t.color }}>
                                    {t.label}
                                </span>
                                <svg viewBox="0 0 1000 38" preserveAspectRatio="none" className="h-[30px] min-w-0 flex-1">
                                    <path d={t.d} fill="none" stroke={t.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" opacity="0.85" />
                                    <line x1={(step / tl.total) * 1000} x2={(step / tl.total) * 1000} y1="0" y2="38" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                </svg>
                            </div>
                        ))}
                        <div className="flex gap-3">
                            <span className="w-[104px] shrink-0" />
                            <div className="relative h-5 flex-1">
                                {Array.from({ length: tl.total + 1 }, (_, s) => (
                                    <span key={s} className="cl-mono absolute top-1 -translate-x-1/2 text-[9.5px] text-[var(--cl-faint)]" style={{ left: `${(s / tl.total) * 100}%` }}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Demo>
    );
}
