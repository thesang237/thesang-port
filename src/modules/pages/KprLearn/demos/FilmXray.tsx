'use client';

import { useEffect, useRef, useState } from 'react';

import { Btn, Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useTicker } from '../kit/loop';
import { navAt, scrollFromT, themeAt, TOTAL, W } from '../kit/source';

import { actAt, ACTS, drawCards, isShown, sampleAt, STAGE } from './xray';

const END = TOTAL + 1;

/** the windows drawn as tracks under the stage (a readable subset of W) */
const TRACKS: { label: string; w: readonly [number, number] }[] = [
    { label: 'landing → card', w: W.landingToCard },
    { label: 'intro cards in', w: W.introCardsIn },
    { label: 'intro out', w: W.introOut },
    { label: 'story', w: W.story },
    { label: 'logo wipe', w: W.glyph },
    { label: 'collection', w: W.collectionIn },
    { label: 'gallery in', w: W.galleryIn },
    { label: 'gallery out', w: W.galleryOut },
    { label: 'keep in', w: W.keepIn },
    { label: 'handoff 1', w: W.handoff1 },
    { label: 'handoff 2', w: W.handoff2 },
    { label: 'launch in', w: W.launchIn },
];

/**
 * Chapter 00: the real choreography of /kpr, drawn flat. Drag the film clock and every card of the
 * page lands exactly where the page would put it at that moment.
 */
export default function FilmXray() {
    const [t, setT] = useState(0.3);
    const [playing, setPlaying] = useState(false);
    const [labels, setLabels] = useState(true);
    const tRef = useRef(t);
    const host = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const [size, setSize] = useState(0);

    // redraw when the canvas changes size
    useEffect(() => {
        const c = canvas.current;
        if (!c) return;
        const ro = new ResizeObserver(([e]) => setSize(Math.round(e.contentRect.width)));
        ro.observe(c);
        return () => ro.disconnect();
    }, []);

    const setTime = (v: number) => {
        tRef.current = v;
        setT(v);
    };

    // play: the film advances half a screen per second (≈ a calm scroll)
    useTicker(host, (_time, dt) => {
        if (!playing) return;
        const next = tRef.current + dt * 0.5;
        setTime(next > END ? 0 : next);
    });

    useEffect(() => {
        const c = canvas.current;
        if (!c) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const r = c.getBoundingClientRect();
        c.width = Math.round(r.width * dpr);
        c.height = Math.round(r.height * dpr);
        const g = c.getContext('2d')!;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const theme = themeAt(Math.min(t, TOTAL));
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, r.width, r.height);
        // the viewport outline (what the visitor sees)
        const s = Math.min(r.width / STAGE.w, r.height / STAGE.h);
        const vw = STAGE.w * s;
        const vh = STAGE.h * s;
        const cards = sampleAt(t, { time: t * 2 });
        drawCards(g, cards, r.width, r.height, { labels });
        g.strokeStyle = theme === 'light' ? 'rgba(139,126,217,0.9)' : 'rgba(0,0,0,0.6)';
        g.setLineDash([4, 4]);
        g.strokeRect((r.width - vw) / 2 + 0.5, (r.height - vh) / 2 + 0.5, vw - 1, vh - 1);
        g.setLineDash([]);
    }, [t, labels, size]);

    const visibleList = sampleAt(t).filter(isShown);
    const groups = [...new Set(visibleList.map((c) => c.group))];

    return (
        <Demo
            title="Film x-ray — the real choreography, drawn flat"
            hint="Drag the film clock (or press play). Every box is a real card of /kpr at that moment, placed by the page’s own choreograph()."
            onReset={() => {
                setPlaying(false);
                setTime(0.3);
            }}
            controls={
                <>
                    <Slider
                        label="film t (screens)"
                        value={t}
                        min={0}
                        max={END}
                        step={0.01}
                        onChange={(v) => setTime(v)}
                        help="The one number. 0 = top of the page, 20.2 = the launch, +1 = the footer sliding up."
                    />
                    <div className="flex gap-2">
                        <Btn primary onClick={() => setPlaying((p) => !p)}>
                            {playing ? '❚❚ Pause' : '▶ Play'}
                        </Btn>
                    </div>
                    <Toggle label="labels" checked={labels} onChange={setLabels} />
                    <Readout
                        items={[
                            { label: 'act', value: actAt(t) },
                            { label: 'scroll', value: `${scrollFromT(Math.min(t, END)).toFixed(2)} scr` },
                            { label: 'HUD theme', value: themeAt(Math.min(t, TOTAL)), color: themeAt(Math.min(t, TOTAL)) === 'light' ? '#b9b4e8' : '#fff' },
                            { label: 'nav', value: navAt(t) },
                            { label: 'cards drawn', value: visibleList.length, color: '#c0fb50' },
                            { label: 'groups', value: groups.length },
                        ]}
                    />
                    <p className="text-[11.5px] leading-snug text-[var(--kl-dim)]">
                        Dashed outline = the screen. Dashed card = you’re seeing its back. Narrow cards are turning; small ones are pushed back in depth.
                    </p>
                </>
            }
        >
            <div ref={host}>
                <canvas ref={canvas} className="block aspect-[16/10] w-full bg-white" aria-label={`Diagram of every card at film time ${t.toFixed(2)}: ${groups.join(', ') || 'none'}`} role="img" />
                <Timeline t={t} onScrub={setTime} />
            </div>
        </Demo>
    );
}

/** Window tracks + act labels + theme strip, with a draggable playhead. */
function Timeline({ t, onScrub }: { t: number; onScrub: (t: number) => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const pct = (v: number) => `${(v / END) * 100}%`;
    const scrub = (clientX: number) => {
        const r = ref.current!.getBoundingClientRect();
        onScrub(Math.max(0, Math.min(END, ((clientX - r.left) / r.width) * END)));
    };
    return (
        <div className="kl-scrollbox overflow-x-auto border-t border-[var(--kl-line)]" data-lenis-prevent>
            <div
                ref={ref}
                className="relative min-w-[640px] cursor-ew-resize select-none px-0 py-2"
                onPointerDown={(e) => {
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    scrub(e.clientX);
                }}
                onPointerMove={(e) => e.buttons === 1 && scrub(e.clientX)}
            >
                {/* theme strip */}
                <div className="relative mb-1 h-2">
                    {Array.from({ length: 120 }, (_, i) => {
                        const a = (i / 120) * END;
                        return (
                            <span
                                key={i}
                                className="absolute top-0 h-full"
                                style={{ left: pct(a), width: pct(END / 120 + 0.001), background: themeAt(Math.min(a, TOTAL)) === 'light' ? '#cfc8f3' : '#0c0c0e' }}
                            />
                        );
                    })}
                </div>
                <div className="kl-mono relative mb-1 h-4 text-[9.5px] uppercase text-[var(--kl-dim)]">
                    {ACTS.map((a) => (
                        <span key={a.label} className="absolute top-0 whitespace-nowrap border-l border-[var(--kl-line-2)] pl-1" style={{ left: pct(a.t) }}>
                            {a.label}
                        </span>
                    ))}
                </div>
                {TRACKS.map((tr) => {
                    const on = t >= tr.w[0] && t <= tr.w[1];
                    return (
                        <div key={tr.label} className="relative h-[13px]">
                            <span
                                className="kl-mono absolute top-[1px] flex h-[11px] items-center overflow-hidden whitespace-nowrap px-1 text-[8.5px] uppercase"
                                style={{
                                    left: pct(tr.w[0]),
                                    width: pct(tr.w[1] - tr.w[0]),
                                    background: on ? '#c0fb50' : 'rgba(139,126,217,0.22)',
                                    color: '#0c0c0e',
                                }}
                            >
                                {tr.label}
                            </span>
                        </div>
                    );
                })}
                <span className="pointer-events-none absolute bottom-0 top-0 w-px bg-[var(--kl-ink)]" style={{ left: pct(t) }}>
                    <span className="absolute -left-[4px] top-0 size-[9px] bg-[var(--kl-ink)]" />
                </span>
            </div>
        </div>
    );
}
