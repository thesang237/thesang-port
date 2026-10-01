'use client';

import { useRef } from 'react';

import { Btn, Demo } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { ease } from '../kit/math';

const EASES = [
    { name: 'none', where: 'Master scroll timeline default. Scroll is already smoothed, so tweens stay linear.', mood: 'mechanical, honest' },
    { name: 'power1.inOut', where: 'Scene cross-fades, hero camera rise.', mood: 'gentle, invisible' },
    { name: 'power2.out', where: 'Crystals arriving from below.', mood: 'arrives, settles' },
    { name: 'power3.inOut', where: 'Crystal carousel snaps — parks on each crystal.', mood: 'deliberate, “snap”' },
    { name: 'power2.in', where: 'Last crystal leaving upward.', mood: 'accelerates away' },
    { name: 'expo.out', where: 'Word & line reveals, UI fades, side labels.', mood: 'confident, premium' },
    { name: 'expo.inOut', where: 'Logo draw-on, rule lines, detail overlay open.', mood: 'dramatic, precise' },
    { name: 'sine.inOut', where: 'The 4.8s intro that assembles the igloo.', mood: 'breathing, calm' },
    { name: 'elastic.out(1, 0.45)', where: 'Magnetic arrow snapping back when the cursor leaves.', mood: 'playful, physical' },
    { name: 'elastic.out(1, 0.6)', where: 'Active social label “pops” on change.', mood: 'springy pop' },
];

function Curve({ name }: { name: string }) {
    const f = ease(name);
    const pts = Array.from({ length: 61 }, (_, i) => {
        const x = i / 60;
        return `${(x * 100).toFixed(1)},${(78 - f(x) * 60).toFixed(1)}`;
    }).join(' ');
    return (
        <svg viewBox="-4 0 108 96" className="h-[84px] w-full">
            <line x1="0" y1="78" x2="100" y2="78" stroke="rgba(196,212,235,0.15)" />
            <line x1="0" y1="18" x2="100" y2="18" stroke="rgba(196,212,235,0.08)" strokeDasharray="2 3" />
            <polyline points={pts} fill="none" stroke="#94dbff" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

/** Every ease used on Igloo, with where and why. Hover to feel it. */
export default function EaseGallery() {
    const root = useRef<HTMLDivElement>(null);
    const run = (el: HTMLElement | null, name: string) => {
        const dot = el?.querySelector('.il-ease-dot');
        if (!dot) return;
        gsap.fromTo(dot, { x: 0 }, { x: () => (el?.querySelector('.il-ease-track')?.clientWidth ?? 100) - 12, duration: 1.1, ease: name, overwrite: true });
    };
    const runAll = () =>
        root.current?.querySelectorAll<HTMLElement>('[data-ease]').forEach((el, i) => {
            gsap.delayedCall(i * 0.05, () => run(el, el.dataset.ease ?? 'none'));
        });

    return (
        <Demo title="Ease gallery — the personalities used on Igloo" hint="Hover a card to feel its ease. Same distance, same duration — only the curve changes.">
            <div ref={root} className="p-4">
                <div className="mb-4">
                    <Btn primary onClick={runAll}>
                        ▶ Race them all
                    </Btn>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {EASES.map((e) => (
                        <div
                            key={e.name}
                            data-ease={e.name}
                            onMouseEnter={(ev) => run(ev.currentTarget, e.name)}
                            className="rounded-xl border border-[var(--il-line)] bg-black/20 p-3 transition-colors hover:border-[var(--il-line-2)]"
                        >
                            <div className="il-mono text-[11px] text-[var(--il-ink)]">{e.name}</div>
                            <div className="il-mono text-[10px] text-[var(--il-lilac)]">{e.mood}</div>
                            <Curve name={e.name} />
                            <div className="il-ease-track relative mb-3 h-3 rounded-full bg-white/5">
                                <span className="il-ease-dot absolute left-0 top-0 block size-3 rounded-full bg-[var(--il-ice)] shadow-[0_0_10px_rgba(148,219,255,0.7)]" />
                            </div>
                            <p className="text-[12px] leading-snug text-[var(--il-dim)]">{e.where}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Demo>
    );
}
