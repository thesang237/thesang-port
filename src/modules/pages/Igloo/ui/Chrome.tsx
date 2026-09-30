'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useLenis } from 'lenis/react';

import { SECTIONS } from '../data';
import { useIglooUI } from '../store';
import { ambience } from '../utils/sound';

import Logo from './Logo';
import { GLYPHS, scrambleIn } from './scramble';

const CAPTIONS = [
    null,
    { tag: '////// 01 — Portfolio', body: 'Companies we build, back, and keep cold-stored until they are ready to melt the internet.' },
    { tag: '////// 02 — Signal', body: 'Community, AI and crypto converging into a single core.' },
    { tag: '////// 03 — Colony', body: 'Find us in the cold. Pick a channel and say hi.' },
];

/** Scramble-decoded tag + masked word rise. */
function Caption({ tag, body }: { tag: string; body: string }) {
    const root = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const el = root.current!;
            const split = SplitText.create(el.querySelector('.ig-caption-body'), { type: 'lines,words', mask: 'lines' });
            const tl = gsap.timeline();
            tl.add(scrambleIn(el.querySelector('.ig-caption-tag'), { text: tag, duration: 0.8 })!, 0);
            tl.from(split.words, { yPercent: 120, rotate: 4, duration: 1, ease: 'expo.out', stagger: 0.025 }, 0.1);
            tl.fromTo(el.querySelector('.ig-caption-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.inOut' }, 0);
            return () => split.revert();
        },
        { scope: root },
    );

    return (
        <div
            ref={root}
            className="ig-caption absolute bottom-[calc(var(--ig-gutter)+44px)] right-[var(--ig-gutter)] w-[min(78vw,30ch)] text-right text-[11px] leading-[1.35] sm:bottom-[var(--ig-gutter)] sm:text-xs"
        >
            <p className="ig-caption-tag mb-2 opacity-60" />
            <span className="ig-caption-rule mb-3 ml-auto block h-px w-12 origin-right bg-current" />
            <p className="ig-caption-body">{body}</p>
        </div>
    );
}

/** Persistent UI: logo, sound, section captions, scroll rail, ghost glyphs. */
export default function Chrome() {
    const root = useRef<HTMLDivElement>(null);
    const introDone = useIglooUI((s) => s.introDone);
    const section = useIglooUI((s) => s.section);
    const sound = useIglooUI((s) => s.sound);
    const lenis = useLenis();

    // logo draws itself, then chrome fades in
    useGSAP(
        () => {
            if (!introDone) return;
            const tl = gsap.timeline();
            tl.fromTo('.ig-logo-stroke', { strokeDasharray: 120, strokeDashoffset: 120 }, { strokeDashoffset: 0, duration: 1.4, ease: 'expo.inOut', stagger: 0.08 });
            tl.fromTo('.ig-chrome-fade', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0.4);
            tl.add(scrambleIn(root.current?.querySelector('.ig-sound-label') ?? null)!, 0.6);
        },
        { scope: root, dependencies: [introDone] },
    );

    // ghost glyphs keep re-scrambling in the background
    useEffect(() => {
        const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('.ig-ghost') ?? []);
        const id = window.setInterval(() => {
            const n = nodes[Math.floor(Math.random() * nodes.length)];
            if (n) gsap.to(n, { duration: 0.9, scrambleText: { text: n.dataset.text ?? '', chars: GLYPHS, speed: 0.5 } });
        }, 700);
        return () => window.clearInterval(id);
    }, []);

    const toggleSound = () => {
        const next = !useIglooUI.getState().sound;
        ambience.toggle(next);
        useIglooUI.getState().set({ sound: next });
        const label = root.current?.querySelector('.ig-sound-label');
        scrambleIn(label ?? null, { text: `Sound: ${next ? 'On' : 'Off'}`, duration: 0.5 });
    };

    const jump = (at: number) => {
        ambience.tick(1500);
        lenis?.scrollTo(at * window.innerHeight, { duration: 2.4, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    };

    return (
        <div ref={root} className="pointer-events-none fixed inset-0 z-20">
            <a
                href="#"
                onClick={(e) => (e.preventDefault(), jump(0))}
                className="pointer-events-auto absolute left-[var(--ig-gutter)] top-[var(--ig-gutter)] block w-[104px] sm:w-[124px]"
                aria-label="Igloo — back to top"
            >
                <Logo className="h-auto w-full drop-shadow-[0_0_14px_rgba(255,255,255,0.35)]" />
            </a>

            <button
                type="button"
                onClick={toggleSound}
                className="ig-chrome-fade pointer-events-auto invisible absolute bottom-[var(--ig-gutter)] left-[var(--ig-gutter)] flex items-center gap-2 text-[11px] sm:text-xs"
            >
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                    <path d="M1 4h2.5L7 1v10L3.5 8H1z" fill="currentColor" />
                    {sound ? <path className="ig-wave" d="M9.5 3.5c1 1.4 1 3.6 0 5M11.5 1.8c1.9 2.4 1.9 6 0 8.4" /> : <path d="M9.5 4l3.5 4M13 4L9.5 8" />}
                </svg>
                <span className="ig-sound-label" data-text={`Sound: ${sound ? 'On' : 'Off'}`}>
                    Sound: {sound ? 'On' : 'Off'}
                </span>
            </button>

            {/* section caption — remounts per section so SplitText always starts clean */}
            {CAPTIONS[section] && <Caption key={section} {...CAPTIONS[section]!} />}

            {/* scroll rail */}
            <nav className="ig-chrome-fade invisible absolute right-[var(--ig-gutter)] top-1/2 hidden -translate-y-1/2 flex-col items-end gap-5 sm:flex" aria-label="Sections">
                {SECTIONS.map((s, i) => (
                    <button key={s.id} type="button" onClick={() => jump(s.at)} className={`ig-rail-item pointer-events-auto flex items-center gap-3 text-[10px] ${section === i ? 'is-active' : ''}`}>
                        <span className="ig-rail-label">{s.label}</span>
                        <span className="ig-rail-dot" />
                    </button>
                ))}
                <span className="ig-rail-track absolute -right-[14px] top-0 h-full w-px">
                    <span className="ig-rail-fill block h-full w-full origin-top scale-y-0" />
                </span>
            </nav>

            {/* ghost glyphs drifting through the fog */}
            <div className="ig-ghosts invisible absolute inset-0 opacity-0" aria-hidden>
                {[
                    ['PRE-LOAD OFF/2', '8%', '62%'],
                    ['NON FUNGIBLE', '58%', '71%'],
                    ['D 2024', '12%', '28%'],
                    ['0x1GL00 // 22', '66%', '18%'],
                    ['LOAD 22', '78%', '46%'],
                    ['TEMP -04.24', '30%', '84%'],
                    ['COLD STORAGE', '40%', '10%'],
                ].map(([t, x, y]) => (
                    <span key={t} className="ig-ghost absolute text-[clamp(18px,2.4vw,38px)] font-bold" style={{ left: x, top: y }} data-text={t}>
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}
