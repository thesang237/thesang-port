'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

import { PORTFOLIO } from '../data';
import { hudNodes, useIglooUI } from '../store';
import { ambience } from '../utils/sound';

import { scrambleIn } from './scramble';

const fmt = (v: number, sign = false) => `${sign && v >= 0 ? '+' : ''}${v < 0 ? '-' : ''}${Math.abs(v).toFixed(2).padStart(5, '0')}`;

function HudNode({ index, onOpen }: { index: number; onOpen: (i: number) => void }) {
    const item = PORTFOLIO[index];
    const ref = useRef<HTMLDivElement>(null);
    const tempRef = useRef<HTMLSpanElement>(null);
    const deltaRef = useRef<HTMLSpanElement>(null);
    const active = useIglooUI((s) => s.activeCrystal === index);

    useEffect(() => {
        hudNodes[index] = ref.current;
        return () => {
            hudNodes[index] = null;
        };
    }, [index]);

    useEffect(() => {
        const el = ref.current;
        if (!el || !active) return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            el.querySelectorAll('[data-scramble]').forEach((n, i) => {
                tl.add(scrambleIn(n)!, i * 0.08);
            });
            tl.fromTo(el.querySelectorAll('.ig-rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, 0.1);
            tl.fromTo(el.querySelectorAll('.ig-leader'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: 'expo.inOut', stagger: 0.1 }, 0);
        }, el);
        ambience.tick(1400);

        // live telemetry jitter
        const id = window.setInterval(() => {
            if (!tempRef.current || !deltaRef.current) return;
            tempRef.current.textContent = fmt(item.temp[0] + (Math.random() - 0.5) * 0.4);
            deltaRef.current.textContent = fmt(item.temp[1] + (Math.random() - 0.5) * 0.2, true);
        }, 220);
        return () => {
            window.clearInterval(id);
            ctx.revert();
        };
    }, [active, item]);

    return (
        <div ref={ref} className="ig-hud-node pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform">
            <div className="ig-hud-scale relative">
                <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden>
                    <path className="ig-leader" pathLength={1} d="M -150 -196 L -72 -118" />
                    <path className="ig-leader" pathLength={1} d="M 150 -172 L 96 -120" />
                    <path className="ig-leader" pathLength={1} d="M 168 54 L 104 18" />
                </svg>

                <div className="absolute -left-[330px] -top-[232px] w-[190px] text-[12px] font-bold leading-[1.15]">
                    <p data-scramble data-text={item.code} />
                    <p data-scramble data-text={item.name} />
                    <span className="ig-rule mt-1.5 block h-px w-full origin-left bg-current" />
                </div>

                <div className="absolute -top-[212px] left-[150px] flex gap-4 text-[11px] leading-[1.2]">
                    <p data-scramble data-text="TEMP" />
                    <p className="text-right">
                        <span ref={tempRef} className="block">
                            {fmt(item.temp[0])}
                        </span>
                        <span ref={deltaRef} className="block">
                            {fmt(item.temp[1], true)}
                        </span>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onOpen(index)}
                    onMouseEnter={() => ambience.tick(2200)}
                    className="ig-explore pointer-events-auto absolute left-[168px] top-[14px] w-[170px] text-right text-[12px] font-bold leading-[1.15]"
                >
                    <p data-scramble data-text={`D ${item.date}`} />
                    <p data-scramble data-text="CLICK TO EXPLORE" />
                    <span className="ig-rule mt-1.5 block h-px w-full origin-right bg-current" />
                </button>
            </div>
        </div>
    );
}

export default function CrystalHud({ onOpen }: { onOpen: (i: number) => void }) {
    return (
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
            {PORTFOLIO.map((item, i) => (
                <HudNode key={item.code} index={i} onOpen={onOpen} />
            ))}
        </div>
    );
}
