'use client';

import { useEffect, useRef, useState } from 'react';

import { GLYPHS } from '@/modules/pages/Igloo/ui/scramble';

import { Btn, Demo, Group, Segmented, Slider } from '../kit/controls';
import { gsap, SplitText } from '../kit/gsap';
import { useParams } from '../kit/loop';

const CHARSETS = {
    igloo: GLYPHS,
    lowerCase: 'lowerCase',
    upperCase: 'upperCase',
    binary: '01',
    blocks: '█▓▒░',
} as const;
type Charset = keyof typeof CHARSETS;

const DEFAULTS = { chars: 'igloo' as Charset, speed: 0.7, revealDelay: 0.15, perChar: 0.018 };
const LINES = ['PORTFOLIO_CO_01', 'PUDGY PENGUINS', 'D 03.02.2020', 'CLICK TO EXPLORE'];
const PARA = 'A licensing layer for digital characters. Holders submit the IP they own, brands browse a curated pool of it, and a deal that once took lawyers and months settles in a few clicks.';

const fmt = (v: number, sign = false) => `${sign && v >= 0 ? '+' : ''}${v < 0 ? '-' : ''}${Math.abs(v).toFixed(2).padStart(5, '0')}`;

/** Decode effects: HUD lines, a hover-to-rescramble paragraph and live telemetry. */
export default function ScrambleLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const [run, setRun] = useState(0);
    const hud = useRef<HTMLDivElement>(null);
    const para = useRef<HTMLParagraphElement>(null);
    const temp = useRef<HTMLSpanElement>(null);
    const delta = useRef<HTMLSpanElement>(null);

    // 1 · HUD lines decode one after another (CrystalHud / scrambleIn)
    useEffect(() => {
        const el = hud.current;
        if (!el) return;
        const P = ref.current;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            el.querySelectorAll<HTMLElement>('[data-text]').forEach((n, i) => {
                const text = n.dataset.text ?? '';
                tl.fromTo(
                    n,
                    { opacity: 0 },
                    {
                        opacity: 1,
                        duration: Math.min(1.6, 0.35 + text.length * P.perChar * 2),
                        ease: 'none',
                        scrambleText: { text, chars: CHARSETS[P.chars], revealDelay: P.revealDelay, speed: P.speed },
                    },
                    i * 0.08,
                );
            });
            tl.fromTo('.sl-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, 0.1);
        }, el);
        return () => ctx.revert();
    }, [run, p.chars, p.speed, p.revealDelay, p.perChar, ref]);

    // 2 · paragraph decodes, then every word re-scrambles under the cursor (DetailOverlay)
    useEffect(() => {
        const el = para.current;
        if (!el) return;
        const P = ref.current;
        let split: SplitText | null = null;
        const tween = gsap.fromTo(
            el,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 1.8,
                ease: 'none',
                scrambleText: { text: PARA, chars: P.chars === 'igloo' ? 'lowerCase' : CHARSETS[P.chars], revealDelay: 0.2, speed: 0.9 },
                onComplete: () => {
                    split = SplitText.create(el, { type: 'words', wordsClass: 'sl-word' });
                    split.words.forEach((w) => {
                        const word = w.textContent ?? '';
                        w.addEventListener('mouseenter', () => {
                            if (gsap.isTweening(w)) return;
                            gsap.to(w, { duration: 0.45, scrambleText: { text: word, chars: CHARSETS[ref.current.chars], speed: 1 } });
                        });
                    });
                },
            },
        );
        return () => {
            tween.kill();
            split?.revert();
            el.textContent = PARA;
        };
    }, [run, p.chars, ref]);

    // 3 · live telemetry: numbers jitter every 220ms (CrystalHud)
    useEffect(() => {
        const id = window.setInterval(() => {
            if (temp.current) temp.current.textContent = fmt(35.17 + (Math.random() - 0.5) * 0.4);
            if (delta.current) delta.current.textContent = fmt(1.76 + (Math.random() - 0.5) * 0.2, true);
        }, 220);
        return () => window.clearInterval(id);
    }, []);

    return (
        <Demo
            title="Scramble lab — decode, hover, telemetry"
            hint="Watch the HUD decode, then hover words in the paragraph. Change the character set to change the voice of the brand."
            onReset={reset}
            controls={
                <>
                    <Btn primary onClick={() => setRun((r) => r + 1)}>
                        ↻ Replay
                    </Btn>
                    <Group title="Scramble">
                        <Segmented label="characters" options={Object.keys(CHARSETS) as Charset[]} value={p.chars} onChange={(v) => set('chars', v)} />
                        <Slider label="speed" value={p.speed} min={0.1} max={2} onChange={(v) => set('speed', v)} help="How often the random glyphs change. Igloo: 0.7." />
                        <Slider
                            label="revealDelay"
                            value={p.revealDelay}
                            min={0}
                            max={0.8}
                            onChange={(v) => set('revealDelay', v)}
                            help="Share of the duration spent as pure noise before letters start to lock in."
                        />
                        <Slider
                            label="time per character"
                            value={p.perChar}
                            min={0.005}
                            max={0.06}
                            step={0.001}
                            onChange={(v) => set('perChar', v)}
                            help="Duration grows with text length, capped at 1.6s — long labels don’t drag."
                        />
                    </Group>
                </>
            }
        >
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                <div ref={hud} className="il-mono space-y-6 text-[12.5px] font-bold leading-[1.2]">
                    <div className="w-[210px]">
                        <p data-text={LINES[0]} className="min-h-[1.2em]" />
                        <p data-text={LINES[1]} className="min-h-[1.2em]" />
                        <span className="sl-rule mt-1.5 block h-px w-full origin-left bg-current" />
                    </div>
                    <div className="flex gap-4 text-[11.5px]">
                        <p data-text="TEMP" className="min-h-[1.2em]" />
                        <p className="text-right tabular-nums">
                            <span ref={temp} className="block">
                                35.17
                            </span>
                            <span ref={delta} className="block">
                                +01.76
                            </span>
                        </p>
                    </div>
                    <div className="ml-auto w-[190px] text-right">
                        <p data-text={LINES[2]} className="min-h-[1.2em]" />
                        <p data-text={LINES[3]} className="min-h-[1.2em]" />
                        <span className="sl-rule mt-1.5 block h-px w-full origin-right bg-current" />
                    </div>
                </div>
                <div>
                    <div className="il-mono mb-3 text-[10.5px] uppercase tracking-[0.14em] text-[var(--il-faint)]">{'////// Summary — hover the words'}</div>
                    <p
                        ref={para}
                        className="il-mono text-[13px] leading-[1.6] text-[#c9d2de] [&_.sl-word:hover]:text-white [&_.sl-word:hover]:[text-shadow:0_0_12px_rgba(255,255,255,0.6)] [&_.sl-word]:transition-colors"
                    >
                        {PARA}
                    </p>
                </div>
            </div>
        </Demo>
    );
}
