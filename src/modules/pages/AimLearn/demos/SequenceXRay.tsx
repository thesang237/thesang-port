'use client';

import { useEffect, useRef, useState } from 'react';

import { Btn, Demo, Readout, Segmented, Slider } from '../kit/controls';
import { EASES } from '../kit/eases';
import { gsap } from '../kit/gsap';
import { type SeqEase, SEQUENCES } from '../kit/sequences';
import { IMG } from '../kit/source';

import ScaledBox from './ScaledBox';

const gsapEase = (e: SeqEase) => (e === 'out-quad' ? 'power1.out' : e === 'none' ? 'none' : EASES[e]);
const KEYS = ['blur', 'panel', 'content', 'sheet', 'menu', 'menubg', 'word0', 'word1', 'word2', 'close', 'desc', 'credit', 'nav'];

/** Timeline x-ray: the bars are drawn from the same data that builds the real GSAP timeline running in the mock page. */
export default function SequenceXRay() {
    const [id, setId] = useState(SEQUENCES[0].id);
    const [t, setT] = useState(0);
    const [speed, setSpeed] = useState(1);
    const root = useRef<HTMLDivElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const seq = SEQUENCES.find((s) => s.id === id) ?? SEQUENCES[0];

    useEffect(() => {
        const el = root.current;
        if (!el) return;
        const ctx = gsap.context(() => {
            const q = (k: string) => el.querySelector<HTMLElement>(`[data-s="${k}"]`);
            // everything this sequence doesn't use is hidden; GSAP owns both ends of every property it moves
            // (clear only what we animate: clearing everything would also wipe React's own inline styles, like the blur)
            const visible = new Set([...seq.show, ...seq.tweens.map((x) => x.key)]);
            KEYS.forEach((k) => {
                const n = q(k);
                if (!n) return;
                gsap.set(n, { clearProps: 'transform,opacity,display' });
                if (!visible.has(k) && !['menubg', 'word0', 'word1', 'word2', 'close', 'desc', 'credit'].includes(k)) gsap.set(n, { display: 'none' });
            });
            const tl = gsap.timeline({ paused: true, onUpdate: () => setT(tl.time()) });
            // initial state = each target's first tween start
            const first = new Map<string, (typeof seq.tweens)[number]>();
            seq.tweens.forEach((tw) => {
                if (!first.has(tw.key)) first.set(tw.key, tw);
            });
            first.forEach((tw, k) => {
                const n = q(k);
                if (n) gsap.set(n, tw.prop === 'opacity' ? { opacity: tw.from } : { yPercent: tw.from, y: 0 });
            });
            seq.tweens.forEach((tw) => {
                const n = q(tw.key);
                if (!n) return;
                tl.fromTo(
                    n,
                    tw.prop === 'opacity' ? { opacity: tw.from } : { yPercent: tw.from },
                    { ...(tw.prop === 'opacity' ? { opacity: tw.to } : { yPercent: tw.to }), duration: tw.dur, ease: gsapEase(tw.ease), immediateRender: false },
                    tw.at,
                );
            });
            tl.duration(seq.total);
            tlRef.current = tl;
        }, el);
        return () => {
            ctx.revert();
            tlRef.current = null;
        };
    }, [seq]);

    const play = () => {
        const tl = tlRef.current;
        if (!tl) return;
        tl.timeScale(speed).play(0);
    };

    const pct = (v: number) => `${(v / seq.total) * 100}%`;

    return (
        <Demo
            title="Sequence x-ray: the overlays, as numbers"
            hint="Pick a sequence, press Play, or drag the playhead. Every bar is one tween: when it starts, how long it takes and its curve."
            onReset={() => {
                tlRef.current?.pause(0);
                setT(0);
            }}
            controls={
                <>
                    <Segmented label="sequence" options={SEQUENCES.map((s) => ({ value: s.id, label: s.label }))} value={id} onChange={setId} />
                    <Slider
                        label="playhead"
                        value={Math.min(t, seq.total)}
                        min={0}
                        max={seq.total}
                        step={0.01}
                        onChange={(v) => {
                            tlRef.current?.pause().time(v);
                            setT(v);
                        }}
                        format={(v) => `${v.toFixed(2)}s`}
                    />
                    <Slider label="speed" value={speed} min={0.2} max={1} step={0.05} onChange={setSpeed} format={(v) => `${v.toFixed(2)}×`} help="Slow it down to see the overlaps." />
                    <Btn primary onClick={play}>
                        ▶ Play
                    </Btn>
                    <Readout
                        items={[
                            { label: 'total', value: `${seq.total.toFixed(1)}s` },
                            { label: 'tweens', value: String(seq.tweens.length) },
                        ]}
                    />
                </>
            }
        >
            <div className="grid gap-0 bg-[var(--al-bg-2)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="min-w-0 border-b border-[var(--al-line-2)] p-3 md:border-b-0 md:border-r">
                    <div className="border border-[var(--al-ink)]">
                        <ScaledBox width={640}>
                            <div ref={root} className="relative overflow-hidden bg-[#e7e4df] text-[#141414]" style={{ width: 640, height: 400, fontFamily: 'var(--al-display)' }}>
                                {/* the page behind */}
                                <div className="absolute inset-x-5 top-10 h-px bg-[#141414]" />
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="absolute left-5 text-[44px] leading-[0.92] tracking-[-0.03em]" style={{ top: 80 + i * 44 }}>
                                        {['AIM—', 'AI Modernism', 'Of Kharkiv'][i]}
                                    </div>
                                ))}
                                {/* gallery overlay */}
                                <div data-s="blur" className="absolute inset-0" style={{ background: 'rgba(14,14,14,0.78)', backdropFilter: 'blur(10px)' }} />
                                {/* the popup: its opacity fades (content), the photo panel inside it also rises (panel) */}
                                <div data-s="content" className="absolute inset-0">
                                    <div className="al-mono absolute right-6 top-3 w-[430px] border-t border-[#e7e4df]/60 pt-2 text-[10px] text-[#e7e4df]">
                                        <div className="mb-2 text-right">[Close]</div>
                                        <div>Gallery:</div>
                                    </div>
                                    <div data-s="panel" className="absolute right-6 top-16 grid w-[430px] grid-cols-3 gap-2">
                                        {['Petrytskiy-art-1-6', 'Ermilov-art-2-2', 'Meller-art-1-2'].map((n) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img key={n} src={IMG(n)} alt="" className="h-[240px] w-full object-cover" />
                                        ))}
                                    </div>
                                </div>
                                {/* page wipe */}
                                <div data-s="sheet" className="absolute inset-0 bg-[#111]" />
                                {/* pinned header */}
                                <div data-s="nav" className="al-mono absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between border-b border-[#141414] bg-[#e7e4df] px-5 text-[10px]">
                                    <span>AI Modernism of Kharkiv [Ukraine]</span>
                                    <span>Index / Experiment / About</span>
                                    <span>[Gallery]</span>
                                </div>
                                {/* phone menu */}
                                <div data-s="menu" className="absolute inset-0 overflow-hidden text-[#e7e4df]">
                                    <div data-s="menubg" className="absolute inset-0 bg-[#18181a]" />
                                    <div className="absolute inset-0 z-10 p-6">
                                        <div data-s="close" className="al-mono mb-12 text-[11px]">
                                            Close
                                        </div>
                                        {['Index', 'Experiment', 'About'].map((w, i) => (
                                            <div key={w} className="overflow-hidden" style={{ height: 56 }}>
                                                <div data-s={`word${i}`} className="text-[52px] leading-[1.02] tracking-[-0.03em]" style={{ opacity: i === 0 ? 0.3 : 1 }}>
                                                    {w}
                                                </div>
                                            </div>
                                        ))}
                                        <div data-s="desc" className="al-mono absolute bottom-14 left-6 right-6 border-t border-[#e7e4df] pt-3 text-[10px]">
                                            An AI Experiment, based on the Kharkiv Modernism.
                                        </div>
                                        <div data-s="credit" className="al-mono absolute bottom-5 left-6 text-[10px]">
                                            Obys Agency ©2023
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScaledBox>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[var(--al-dim)]">{seq.blurb}</p>
                </div>
                <div className="min-w-0 p-4">
                    <div className="al-mono mb-2 flex justify-between text-[10px] text-[var(--al-faint)]">
                        <span>0s</span>
                        <span>{`${seq.total}s`}</span>
                    </div>
                    <div className="relative">
                        <div className="space-y-1.5">
                            {seq.tweens.map((tw, i) => (
                                <div key={`${tw.key}${i}`} className="relative h-7 border border-dashed border-[var(--al-line-2)]">
                                    <span className="absolute inset-y-0 bg-[var(--al-ink)]" style={{ left: pct(tw.at), width: pct(tw.dur) }} />
                                    <span
                                        className="al-mono absolute left-1.5 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap text-[9.5px] text-[var(--al-ink)] mix-blend-difference [text-shadow:none]"
                                        style={{ color: '#fff' }}
                                    >
                                        {tw.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {seq.markers?.map((m) => (
                            <div key={m.text} className="pointer-events-none absolute inset-y-[-4px] border-l border-dashed border-[var(--al-accent-ink)]" style={{ left: pct(m.at) }}>
                                <span className="al-mono absolute -top-4 left-1 whitespace-nowrap text-[9px] text-[var(--al-accent-ink)]">{m.text}</span>
                            </div>
                        ))}
                        <div className="pointer-events-none absolute inset-y-[-4px] w-[2px] bg-[var(--al-accent)]" style={{ left: pct(Math.min(t, seq.total)) }} />
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="al-mono w-full min-w-[420px] border-collapse text-[10.5px]">
                            <thead>
                                <tr className="text-left text-[var(--al-faint)]">
                                    <th className="py-1 pr-2 font-normal">tween</th>
                                    <th className="py-1 pr-2 font-normal">start</th>
                                    <th className="py-1 pr-2 font-normal">dur</th>
                                    <th className="py-1 font-normal">curve</th>
                                </tr>
                            </thead>
                            <tbody>
                                {seq.tweens.map((tw, i) => (
                                    <tr key={`${tw.key}${i}`} className="border-t border-[var(--al-line)] text-[var(--al-dim)]">
                                        <td className="py-1 pr-2 text-[var(--al-ink)]">{tw.label}</td>
                                        <td className="py-1 pr-2 tabular-nums">{tw.at.toFixed(2)}s</td>
                                        <td className="py-1 pr-2 tabular-nums">{tw.dur.toFixed(2)}s</td>
                                        <td className="py-1">{tw.ease}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Demo>
    );
}
