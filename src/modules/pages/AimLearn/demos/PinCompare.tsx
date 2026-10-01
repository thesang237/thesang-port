'use client';

import { useEffect, useRef } from 'react';

import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { gsap, ScrollTrigger } from '../kit/gsap';
import { useParams } from '../kit/loop';

const DEFAULTS = { length: 3, spacing: true, xray: false };
const BOX_H = 300;

const Stage = ({ label, progressRef }: { label: string; progressRef: (el: HTMLElement | null) => void }) => (
    <div className="flex h-full w-full flex-col justify-between bg-[#141414] p-4 text-[#e7e4df]">
        <div className="al-mono text-[10px] uppercase tracking-[0.14em] text-[#e7e4df]/60">{label}</div>
        <div className="al-display text-[clamp(26px,5vw,44px)] leading-[0.95] tracking-[-0.03em]">The stage</div>
        <div>
            <div className="mb-1 h-[3px] w-full bg-[#e7e4df]/20">
                <span ref={progressRef} className="block h-full origin-left bg-[#ef5a1f]" style={{ transform: 'scaleX(0)' }} />
            </div>
            <div className="al-mono text-[10px] text-[#e7e4df]/60">progress bar = scaleX(scroll progress)</div>
        </div>
    </div>
);

const Intro = () => <div className="al-mono flex h-[110px] items-center justify-center bg-[#e7e4df] text-[10px] uppercase tracking-[0.14em] text-[#6b6862]">↓ section before the stage</div>;
const Next = () => <div className="al-display flex h-[260px] items-center justify-center bg-[#ef5a1f] text-[22px] text-[#141414]">Next section</div>;

/** The same pinned stage twice: GSAP ScrollTrigger pin (left) and CSS position: sticky (right). Scroll both boxes. */
export default function PinCompare() {
    const { p, set, reset } = useParams(DEFAULTS);
    const gBox = useRef<HTMLDivElement>(null);
    const gStage = useRef<HTMLDivElement>(null);
    const gBar = useRef<HTMLElement | null>(null);
    const sBox = useRef<HTMLDivElement>(null);
    const sTrack = useRef<HTMLDivElement>(null);
    const sBar = useRef<HTMLElement | null>(null);

    // GSAP side: ScrollTrigger pins the stage for `length` box-heights of scroll
    useEffect(() => {
        const box = gBox.current;
        const stage = gStage.current;
        if (!box || !stage) return;
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                scroller: box,
                trigger: stage,
                start: 'top top',
                end: () => `+=${BOX_H * p.length}`,
                pin: true,
                pinSpacing: p.spacing,
                onUpdate: (self) => {
                    if (gBar.current) gBar.current.style.transform = `scaleX(${self.progress})`;
                },
            });
        }, box);
        return () => ctx.revert();
    }, [p.length, p.spacing]);

    // sticky side: no JavaScript for the pin, only the progress bar reads the scroll
    useEffect(() => {
        const box = sBox.current;
        const track = sTrack.current;
        if (!box || !track) return;
        const update = () => {
            const max = track.offsetHeight - BOX_H;
            const top = track.offsetTop;
            const prog = Math.min(1, Math.max(0, (box.scrollTop - top) / max));
            if (sBar.current) sBar.current.style.transform = `scaleX(${prog})`;
        };
        box.addEventListener('scroll', update, { passive: true });
        update();
        return () => box.removeEventListener('scroll', update);
    }, [p.length]);

    return (
        <Demo
            title="Pin compared: GSAP pin vs position: sticky"
            hint="Scroll each little page. Both hold the stage still and fill a progress bar. Turn on x-ray to see the extra box each one needs."
            onReset={reset}
            stacked
            controls={
                <>
                    <Slider
                        label="pin length"
                        value={p.length}
                        min={1}
                        max={6}
                        step={0.5}
                        onChange={(v) => set('length', v)}
                        format={(v) => `${v} screens`}
                        help="How many box-heights of scrolling the stage stays on screen."
                    />
                    <Group title="Options">
                        <Toggle
                            label="GSAP: pinSpacing"
                            checked={p.spacing}
                            onChange={(v) => set('spacing', v)}
                            help="Off: no space is added after the pin, so the next section slides over the stage (left box only)."
                        />
                        <Toggle label="x-ray the wrappers" checked={p.xray} onChange={(v) => set('xray', v)} help="Dashed: GSAP’s pin-spacer (left) and the sticky track (right)." />
                    </Group>
                </>
            }
        >
            <div className={`grid gap-px bg-[var(--al-line-2)] md:grid-cols-2 ${p.xray ? 'al-pin-xray' : ''}`}>
                <div className="bg-[var(--al-panel)] p-3">
                    <div className="al-mono mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--al-accent-ink)]">GSAP: ScrollTrigger pin</div>
                    <div ref={gBox} data-lenis-prevent className="al-scrollbox relative overflow-y-auto overflow-x-hidden border border-[var(--al-ink)]" style={{ height: BOX_H }}>
                        <Intro />
                        <div ref={gStage} style={{ height: BOX_H }}>
                            <Stage label="pinned by GSAP" progressRef={(el) => (gBar.current = el)} />
                        </div>
                        <Next />
                    </div>
                    <p className="al-mono mt-2 text-[10.5px] leading-relaxed text-[var(--al-faint)]">
                        adds <span className="text-[var(--al-ink)]">div.pin-spacer</span> around the stage, sets it <span className="text-[var(--al-ink)]">position: fixed</span> while pinned
                    </p>
                </div>
                <div className="bg-[var(--al-panel)] p-3">
                    <div className="al-mono mb-2 text-[10px] uppercase tracking-[0.14em] text-[var(--al-blue)]">CSS: position: sticky</div>
                    <div ref={sBox} data-lenis-prevent className="al-scrollbox relative overflow-y-auto overflow-x-hidden border border-[var(--al-ink)]" style={{ height: BOX_H }}>
                        <Intro />
                        <div ref={sTrack} data-track style={{ height: BOX_H * (1 + p.length) }}>
                            <div className="sticky top-0" style={{ height: BOX_H }}>
                                <Stage label="pinned by sticky" progressRef={(el) => (sBar.current = el)} />
                            </div>
                        </div>
                        <Next />
                    </div>
                    <p className="al-mono mt-2 text-[10.5px] leading-relaxed text-[var(--al-faint)]">
                        a <span className="text-[var(--al-ink)]">track</span> as tall as stage + pin length, with a <span className="text-[var(--al-ink)]">position: sticky; top: 0</span> stage inside
                    </p>
                </div>
            </div>
        </Demo>
    );
}
