'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { Btn, Demo, Readout, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams, useTicker } from '../kit/loop';
import { type ElementTracks, FEATURED, IMG, sample, SCENES, smooth } from '../kit/source';

const DEFAULTS = { smoothing: 70, xray: false };
const TRACK_SCREENS = 10; // the page's track is 1000vh

/** The page's applyTracks, with “vh” measured in the demo box instead of the real window. */
function write(el: HTMLElement | null, t: ElementTracks, pct: number, boxH: number) {
    if (!el) return;
    if (t.x || t.y || t.scale) {
        const x = t.x ? sample(t.x, pct) : 0;
        const y = t.y ? sample(t.y, pct) : 0;
        const s = t.scale ? sample(t.scale, pct) : 1;
        const xu = t.xUnit === 'vh' ? undefined : (t.xUnit ?? '%');
        const yv = t.yUnit === 'vh' ? `${(y * boxH) / 100}px` : `${y}${t.yUnit ?? '%'}`;
        el.style.transform = `translate3d(${xu ? `${x}${xu}` : '0px'}, ${yv}, 0)${s !== 1 ? ` scale(${s})` : ''}`;
    }
    if (t.opacity) el.style.opacity = String(sample(t.opacity, pct));
}

const BANDS = [
    { from: 0, to: 12, label: 'rise', color: 'var(--al-accent)' },
    { from: 13, to: 30, label: 'sideways', color: 'var(--al-blue)' },
    { from: 23, to: 31, label: 'text in', color: 'var(--al-green)' },
    { from: 35, to: 85, label: 'six slides', color: 'var(--al-ink)' },
];

/** The real pinned stage: a 1000vh track with a sticky stage, every layer driven by one scroll progress. */
export default function DeckLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const cur = useRef(0);
    const [w, setW] = useState(900);
    const [shown, setShown] = useState(0);
    const H = Math.round(w * 0.58);
    const em = w / 100;

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setW(Math.max(320, Math.round(e.contentRect.width))));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useTicker(host, (_t, dt) => {
        const b = box.current;
        const st = stage.current;
        if (!b || !st) return;
        const frames = Math.min(Math.max(dt * 60, 0.25), 4);
        const target = Math.min(1, Math.max(0, b.scrollTop / (TRACK_SCREENS * H))) * 100;
        cur.current = smooth(cur.current, target, ref.current.smoothing, frames);
        const at = cur.current;
        const q = (k: string) => st.querySelector<HTMLElement>(`[data-k="${k}"]`);
        const qa = (k: string) => Array.from(st.querySelectorAll<HTMLElement>(`[data-k="${k}"]`));
        write(q('slider'), SCENES.SLIDER, at, H);
        write(q('col2'), SCENES.COL_2, at, H);
        write(q('col3'), SCENES.COL_3, at, H);
        write(q('h1'), SCENES.HEADING_1, at, H);
        write(q('h2'), SCENES.HEADING_2, at, H);
        qa('fade').forEach((n) => write(n, SCENES.FADE_IN, at, H));
        write(q('right'), SCENES.RIGHT_FADE_IN, at, H);
        qa('slide').forEach((n, i) => write(n, SCENES.SLIDES[i] ?? {}, at, H));
        qa('slideimg').forEach((n, i) => write(n, SCENES.SLIDE_IMAGES[i] ?? {}, at, H));
        qa('digit').forEach((n) => write(n, SCENES.COUNTER, at, H));
        qa('name').forEach((n, i) => write(n, SCENES.NAMES[i] ?? {}, at, H));
        setShown((s) => (Math.abs(s - at) > 0.05 ? at : s));
    });

    const jump = (pct: number) => {
        const b = box.current;
        if (!b) return;
        gsap.to(b, { scrollTop: (pct / 100) * TRACK_SCREENS * H, duration: 1.1, ease: 'power2.inOut', overwrite: true });
    };

    const slide = shown < 35 ? 0 : Math.min(5, Math.floor((shown - 35) / 10) + (shown >= 45 ? 1 : 0));
    const band =
        BANDS.filter((x) => shown >= x.from && shown <= x.to)
            .map((x) => x.label)
            .join(' + ') || (shown > 85 ? 'hold, then release' : 'hold');
    const font: CSSProperties = { fontFamily: 'var(--al-display)', fontSize: em, fontWeight: 400, lineHeight: 1 };
    const label: CSSProperties = { fontSize: `${0.95}em`, lineHeight: 0.93 };

    return (
        <Demo
            title="Pinned stage lab: the page’s photo stage, real keyframes"
            hint="Scroll the box (or use the jump buttons). The stage stays put while the track scrolls past it; every layer reads the same progress. It is a miniature of a full window, so it reads best on a wide screen."
            onReset={() => {
                reset();
                cur.current = 0;
                if (box.current) box.current.scrollTop = 0;
            }}
            stacked
            controls={
                <>
                    <Slider label="smoothing" value={p.smoothing} min={0} max={95} step={1} onChange={(v) => set('smoothing', v)} help="The page uses 70." />
                    <Toggle label="x-ray the layers" checked={p.xray} onChange={(v) => set('xray', v)} help="Dashed boxes: photo columns, slider, text layer." />
                    <div className="sm:col-span-2">
                        <div className="al-mono mb-1.5 text-[11px] text-[var(--al-ink)]">jump to</div>
                        <div className="flex flex-wrap gap-1.5">
                            {[0, 12, 30, 45, 55, 65, 75, 85].map((v) => (
                                <Btn key={v} onClick={() => jump(v)}>{`${v}%`}</Btn>
                            ))}
                        </div>
                    </div>
                    <Readout
                        items={[
                            { label: 'stage progress', value: `${shown.toFixed(1)}%`, color: 'var(--al-accent-ink)' },
                            { label: 'doing', value: band },
                            { label: 'slide', value: shown < 35 ? '—' : `${slide + 1} / 6` },
                            { label: 'track', value: `${TRACK_SCREENS * 100}vh` },
                        ]}
                    />
                </>
            }
        >
            <div ref={host} className="bg-[var(--al-bg-2)] p-3">
                <div
                    ref={box}
                    data-lenis-prevent
                    className={`al-scrollbox relative overflow-x-hidden overflow-y-auto border border-[var(--al-ink)] ${p.xray ? 'al-deck-xray' : ''}`}
                    style={{ height: H, background: '#e7e4df', color: '#141414', ...font }}
                >
                    <div style={{ height: H * TRACK_SCREENS, position: 'relative' }}>
                        <div ref={stage} className="sticky top-0 overflow-hidden" style={{ height: H, ...font }}>
                            {/* three photo columns, right-aligned: they rise, then slide right */}
                            <div className="absolute inset-0 z-[2] flex justify-end" data-layer="photos">
                                <div data-k="col2" style={{ width: '33.5%', height: '100%', background: '#5f5151', transform: `translate3d(0, ${H}px, 0)`, position: 'relative', zIndex: 2 }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={IMG('home-slider-7')} alt="" className="h-full w-full object-cover" />
                                </div>
                                <div data-k="col3" style={{ width: '33.5%', height: '100%', background: '#412525', transform: `translate3d(0, ${H}px, 0)` }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={IMG('Kosarev-art-1-10')} alt="" className="h-full w-full object-cover" />
                                </div>
                            </div>

                            {/* text layer */}
                            <div className="absolute inset-0 z-[4] flex" data-layer="text" style={{ padding: `${0.97 * em}px 0 ${0.97 * em}px ${0.97 * em}px` }}>
                                <div className="flex flex-col justify-between" style={{ width: '50%', paddingTop: `${2.5}em` }}>
                                    <div className="flex flex-col">
                                        <div style={{ marginLeft: '-0.35em' }}>
                                            {['Explore', 'Experiment'].map((t, i) => (
                                                <div key={t} className="relative overflow-hidden" style={{ height: '9.2em', marginBottom: '-0.8em', marginLeft: '-0.3em', paddingRight: '0.5em' }}>
                                                    <div
                                                        data-k={`h${i + 1}`}
                                                        style={{ fontSize: '9.5em', fontWeight: 500, lineHeight: 0.85, letterSpacing: '-0.035em', transform: 'translate3d(0,120%,0)' }}
                                                    >
                                                        {t}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            data-k="fade"
                                            className="relative"
                                            style={{ width: '48.2%', marginTop: '3.47em', paddingTop: '0.69em', borderTop: '1px solid #141414', opacity: 0, ...label }}
                                        >
                                            Learn More →
                                        </div>
                                    </div>
                                    <div data-k="fade" style={{ opacity: 0, ...label }}>
                                        Kharkiv Modernism × Obys × AI
                                    </div>
                                </div>
                                <div data-k="right" className="flex flex-col justify-between" style={{ paddingTop: '3em', opacity: 0 }}>
                                    <div>
                                        <div className="flex" style={{ height: '0.9em', marginBottom: '0.69em', ...label }}>
                                            <div className="overflow-hidden" style={{ height: '0.9em' }}>
                                                {FEATURED.map((f, i) => (
                                                    <div key={f.name} data-k="digit" style={{ marginBottom: '0.69em' }}>
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                            <span style={{ marginLeft: '0.3em' }}>— 6</span>
                                        </div>
                                        <div className="flex" style={label}>
                                            <span style={{ width: '7.3em', marginRight: '0.97em' }}>[06] Featured:</span>
                                            <ul>
                                                <li style={{ marginBottom: '0.6em' }}>Name:</li>
                                                {FEATURED.map((f, i) => (
                                                    <li key={f.name} data-k="name" style={{ opacity: i === 0 ? 1 : 0.4, marginBottom: '0.07em' }}>
                                                        {f.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div data-k="fade" style={{ opacity: 0, ...label }}>
                                        ©2025
                                    </div>
                                </div>
                            </div>

                            {/* the slide deck on the right third */}
                            <div data-k="slider" className="absolute right-0 top-0 z-[3] overflow-visible" style={{ width: '33%', height: '100%', transform: `translate3d(-203%, ${H}px, 0)` }}>
                                {FEATURED.map((f, i) => (
                                    <div key={f.name} data-k="slide" className="absolute w-full overflow-hidden" style={{ height: '100%', top: i ? '100%' : 0, zIndex: i ? i + 1 : undefined }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img data-k="slideimg" src={f.img} alt={f.name} className="relative z-[2] h-full w-full object-cover" style={{ opacity: i ? 0 : 1 }} />
                                        <div className="absolute inset-0" style={{ background: f.bg }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="al-mono flex items-center justify-center bg-[#ef5a1f] text-[10px] uppercase tracking-[0.14em] text-[#141414]" style={{ height: H * 0.6 }}>
                        next section: the stage lets go when its track ends (90% of the progress)
                    </div>
                </div>

                {/* ruler: which part of the progress does what */}
                <div className="relative mt-3 h-7 border border-[var(--al-line-2)]" aria-hidden>
                    {BANDS.map((b, i) => (
                        <span
                            key={b.label}
                            className="al-mono absolute top-0 flex h-3.5 items-center overflow-hidden whitespace-nowrap pl-1 text-[9px] text-white"
                            style={{ left: `${b.from}%`, width: `${b.to - b.from}%`, background: b.color, top: i % 2 ? 14 : 0 }}
                        >
                            {b.label}
                        </span>
                    ))}
                    <span className="absolute inset-y-[-3px] w-[2px] bg-[var(--al-accent-ink)]" style={{ left: `${shown}%` }} />
                </div>
                <div className="al-mono mt-1 flex justify-between text-[9.5px] text-[var(--al-faint)]">
                    <span>0%</span>
                    <span>stage progress →</span>
                    <span>100%</span>
                </div>
            </div>
        </Demo>
    );
}
