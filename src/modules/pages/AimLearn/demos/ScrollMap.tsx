'use client';

import { useState } from 'react';

import { Demo, Readout, Slider } from '../kit/controls';
import { sample, SCENES } from '../kit/source';

// Measured on the real page at a 1920 × 994 window (see the page's NOTES). Everything else is derived from the page's own keyframes.
const VH = 994;
const PAGE = 14788; // document height
const MAX = PAGE - VH; // last scroll position
const DECK_TOP = 3767; // top of the 1000vh track
const DECK_H = 9940;
const ABOUT = [800, 3050] as const;
const FOOTER = 13094; // footer enters (top < 110% of the window)

type Lane = { id: string; label: string; kind: 'scrub' | 'trigger' | 'time'; from: number; to: number; note: string };

const LANES: Lane[] = [
    { id: 'intro', label: 'Loader + hero build', kind: 'time', from: 0, to: 0, note: 'Plays once on load, on a timer (4.5s). Scroll has nothing to do with it.' },
    { id: 'logo', label: 'Logo falls apart', kind: 'scrub', from: 0, to: PAGE * 0.35, note: 'Scrubbed: 0% to 35% of the page. Frame 0→99 by 22%, zoom ×4 at 19–23%, gone at 35%.' },
    { id: 'about', label: 'About lines rise', kind: 'trigger', from: ABOUT[0], to: ABOUT[1], note: 'Triggered: each line plays once (0.9s) when it crosses the 15% line.' },
    { id: 'stage', label: 'Pinned photo stage', kind: 'scrub', from: DECK_TOP, to: DECK_TOP + DECK_H - VH, note: 'Scrubbed: a 1000vh track, the 100vh stage sticks for about 90% of it.' },
    { id: 'footer', label: 'Footer logo builds', kind: 'trigger', from: FOOTER, to: MAX, note: 'Triggered: 8 blocks tumble in over 2.8s when the footer is in view.' },
];

const KIND = { scrub: 'var(--al-accent)', trigger: 'var(--al-blue)', time: 'var(--al-ink)' } as const;

const pct = (v: number) => `${(v / PAGE) * 100}%`;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function ScrollMap() {
    const [y, setY] = useState(0);
    const [pick, setPick] = useState<string>('logo');

    const logoP = clamp01(y / PAGE) * 100;
    const frame = sample(SCENES.LOGO_FRAME, logoP);
    const scale = sample(SCENES.LOGO_TRACKS.scale ?? [[0, 1]], logoP);
    const deckP = clamp01((y - DECK_TOP) / DECK_H) * 100;
    const active = LANES.filter((l) => (l.kind === 'time' ? y < 300 : y >= l.from - VH * 0.1 && y <= l.to));
    const lane = LANES.find((l) => l.id === pick) ?? LANES[1];

    return (
        <Demo
            title="Scroll map: where each scene lives"
            hint="Drag the playhead down the page. Orange scenes are scrubbed by scroll, blue ones are triggered and then play on their own clock."
            onReset={() => setY(0)}
            controls={
                <>
                    <Slider
                        label="scroll position"
                        value={y}
                        min={0}
                        max={MAX}
                        step={1}
                        onChange={setY}
                        format={(v) => `${Math.round(v)}px`}
                        help="0 = top of the page, 13 794 = the very bottom at 1920×994."
                    />
                    <Readout
                        items={[
                            { label: 'page progress', value: `${logoP.toFixed(1)}%` },
                            { label: 'logo frame', value: `${frame.toFixed(0)}%` },
                            { label: 'logo scale', value: `×${scale.toFixed(2)}` },
                            { label: 'stage progress', value: `${deckP.toFixed(1)}%`, color: 'var(--al-accent-ink)' },
                        ]}
                    />
                    <p className="al-mono text-[10.5px] leading-relaxed text-[var(--al-faint)]">
                        {active.length ? `Active now: ${active.map((l) => l.label).join(' · ')}` : 'Nothing is animating here: the page is just scrolling.'}
                    </p>
                </>
            }
        >
            <div className="space-y-3 p-4 sm:p-6">
                <div className="relative">
                    {LANES.map((l) => (
                        <button
                            key={l.id}
                            type="button"
                            onClick={() => setPick(l.id)}
                            aria-pressed={pick === l.id}
                            className="al-btn group relative mb-2 block h-9 w-full border border-dashed border-[var(--al-line-2)] text-left"
                        >
                            <span className="al-mono absolute left-2 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.1em] text-[var(--al-dim)] mix-blend-multiply">
                                {l.label}
                            </span>
                            <span
                                className="absolute top-0 h-full opacity-90 transition-opacity group-hover:opacity-100"
                                style={{
                                    left: pct(l.from),
                                    width: l.kind === 'time' ? '6px' : `max(6px, ${((l.to - l.from) / PAGE) * 100}%)`,
                                    background: KIND[l.kind],
                                    opacity: pick === l.id ? 1 : 0.55,
                                }}
                            />
                        </button>
                    ))}
                    {/* the playhead and the window it shows */}
                    <div
                        className="pointer-events-none absolute inset-y-0 border-x border-[var(--al-ink)] bg-[rgba(20,20,20,0.07)]"
                        style={{ left: pct(y), width: `${(VH / PAGE) * 100}%` }}
                        aria-hidden
                    />
                </div>
                <div className="al-mono flex justify-between text-[10px] text-[var(--al-faint)]">
                    <span>top</span>
                    <span>{`${(PAGE / VH).toFixed(1)} screens tall`}</span>
                    <span>bottom</span>
                </div>
                <div className="border-t border-[var(--al-line-2)] pt-3">
                    <div className="al-mono mb-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: KIND[lane.kind] }}>
                        {lane.kind === 'scrub' ? 'scrubbed by scroll' : lane.kind === 'trigger' ? 'triggered, then timed' : 'timed'}
                    </div>
                    <p className="text-[14px] leading-relaxed text-[var(--al-dim)]">
                        <strong className="text-[var(--al-ink)]">{lane.label}.</strong> {lane.note}
                    </p>
                </div>
            </div>
        </Demo>
    );
}
