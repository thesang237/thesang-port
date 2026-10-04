'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/utils/cn';

import { Demo, Readout } from '../kit/controls';
import { CHAPTERS, SECTIONS, Timeline } from '../kit/source';

const WORLD_COL: Record<string, string> = { hero: '#2a8f5a', science: '#ed863b', stalk: '#8fbf5a', plots: '#c9b45a', kernel: '#e9c46a' };

/**
 * The storyboard, built from the page's own data: `CHAPTERS` (data/story.ts) and the real `Timeline`
 * for the step numbers. The stills are the /corn page itself at each stop.
 */
export default function StoryStrip() {
    const tl = useMemo(() => new Timeline(), []);
    const [sel, setSel] = useState(1);
    const c = CHAPTERS[sel];
    const start = tl.starts[sel];
    const dwell = tl.dwells[sel];
    const section = SECTIONS.find((s) => s.id === c.section)?.label ?? '—';

    return (
        <Demo title="The storyboard: 9 stops, 5 worlds" hint="Click a stop. Everything here (titles, worlds, how each stop enters, the step numbers) is read live from the page’s own story data.">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="p-4 sm:p-5">
                    <div className="relative overflow-hidden rounded-lg border border-[var(--cl-line-2)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/corn-learn/stops/stop${sel}.webp`} alt={`Stop ${sel}: ${c.title.join(' ') || 'footer links'}`} className="block aspect-[1920/994] w-full object-cover" />
                        <span className="cl-mono absolute left-3 top-3 rounded-full bg-[rgba(3,8,6,0.75)] px-2.5 py-1 text-[10.5px] uppercase text-[var(--cl-ink)]">{`stop ${sel} · ${c.id}`}</span>
                    </div>
                    <div className="cl-scrollbox mt-3 flex gap-2 overflow-x-auto pb-1" data-lenis-prevent>
                        {CHAPTERS.map((ch, i) => (
                            <button
                                key={ch.id}
                                type="button"
                                onClick={() => setSel(i)}
                                aria-pressed={sel === i}
                                aria-label={`Stop ${i}: ${ch.id}`}
                                className={cn(
                                    'cl-btn relative w-[104px] shrink-0 overflow-hidden rounded-md border-2',
                                    sel === i ? 'border-[var(--cl-mint)]' : 'border-transparent opacity-70 hover:opacity-100',
                                )}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={`/corn-learn/stops/stop${i}.webp`} alt="" className="block aspect-[1920/994] w-full object-cover" />
                                <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: WORLD_COL[ch.world] }} />
                                <span className="cl-mono absolute left-1 top-1 rounded bg-black/60 px-1 text-[9.5px] text-white">{i}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4 border-t border-[var(--cl-line)] p-4 sm:p-5 lg:border-l lg:border-t-0">
                    <div>
                        <div className="cl-mono mb-1 text-[10px] uppercase text-[var(--cl-faint)]">Title (WebGL, over a hidden heading)</div>
                        <div className="cl-display text-[22px] leading-[1.05]">
                            {c.title.length ? (
                                c.title.map((l) => (
                                    <span key={l} className="block">
                                        {l}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[var(--cl-dim)]">footer links</span>
                            )}
                        </div>
                    </div>
                    <Readout
                        items={[
                            { label: 'world', value: c.world, color: WORLD_COL[c.world] },
                            { label: 'section', value: section },
                            { label: 'enters with', value: c.enter, color: c.enter === 'wipe' ? 'var(--cl-mint)' : 'var(--cl-gold)' },
                            { label: 'dwell steps', value: dwell },
                            { label: 'arrives at step', value: start },
                            { label: 'leaves at step', value: start + dwell },
                        ]}
                    />
                    {c.body && <p className="text-[13.5px] leading-relaxed text-[var(--cl-dim)]">{c.body}</p>}
                    {c.cta && <p className="cl-mono text-[11px] uppercase text-[var(--cl-mint)]">{`CTA ring → “${c.cta}” opens the ${c.hotspot} deep dive`}</p>}
                    <div className="cl-mono text-[10.5px] leading-relaxed text-[var(--cl-faint)]">
                        {`${CHAPTERS.length} stops · ${tl.total} steps in total · step ${tl.total} is the hero again (the loop)`}
                    </div>
                </div>
            </div>
        </Demo>
    );
}
