'use client';

import { useRef } from 'react';

import { useGSAP } from '@/components/motion-kit/gsap';
import { useSmoothScroll } from '@/components/motion-kit/SmoothScroll';

import { NAV } from '../../data/copy';
import { onFrame } from '../../scroll/frame';
import { NAV_TARGETS, TOTAL } from '../../scroll/timeline';
import { film, useUi } from '../../scroll/useScrollStore';
import { Burger, Console, KeeperMark } from '../icons';
import { Hacky, scrambleTween } from '../ui/Text';

import { enableAudio } from './audio';

/** Five animated bars; animate only while sound is on. */
export function AudioBars({ className = '' }: { className?: string }) {
    const sound = useUi((s) => s.sound);
    return (
        <button
            type="button"
            className={`kpr-audio ${sound ? 'is-on' : ''} ${className}`}
            aria-pressed={sound}
            aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
            onClick={() => {
                if (!sound) enableAudio();
                useUi.getState().set({ sound: !sound });
            }}
        >
            {[0, 1, 2, 3, 4].map((i) => (
                <i key={i} className="kpr-audio__bar" style={{ animationDelay: `${-i * 0.17}s`, animationDuration: `${0.6 + ((i * 37) % 5) * 0.12}s` }} />
            ))}
        </button>
    );
}

export default function Hud() {
    const ref = useRef<HTMLDivElement>(null);
    const nav = useUi((s) => s.nav);
    const theme = useUi((s) => s.theme);
    const menuOpen = useUi((s) => s.menuOpen);
    const lenis = useSmoothScroll();

    useGSAP(
        () => {
            const fill = ref.current!.querySelector<HTMLElement>('.kpr-hud__progress')!;
            return onFrame(() => {
                fill.style.transform = `scaleX(${Math.min(1, film.view / TOTAL)})`;
            });
        },
        { scope: ref },
    );

    const go = (at: number) => {
        lenis?.scrollTo(at * film.vh, { duration: 2.4, easing: (k: number) => (k < 0.5 ? 8 * k ** 4 : 1 - (-2 * k + 2) ** 4 / 2) });
    };

    return (
        <div ref={ref} className="kpr-hud" data-theme={theme} aria-hidden={menuOpen ? true : undefined}>
            <div className="kpr-hud__frame" aria-hidden="true" />
            <div className="kpr-hud__bar">
                <button type="button" className="kpr-hud__burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => useUi.getState().set({ menuOpen: true })} data-sfx>
                    <Burger className="kpr-hud__burgerIcon" />
                </button>
                <div className="kpr-hud__track">
                    <i className="kpr-hud__progress" aria-hidden="true" />
                    <nav className="kpr-hud__nav kpr-cap2" aria-label="Story chapters">
                        {NAV.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                className={`kpr-hud__navItem ${nav === n.id ? 'is-active' : ''}`}
                                aria-current={nav === n.id ? 'step' : undefined}
                                onClick={() => go(NAV_TARGETS[n.id])}
                                onPointerEnter={(e) => scrambleTween(e.currentTarget, 0.4)}
                                data-sfx
                            >
                                <i className="kpr-dot" aria-hidden="true" />
                                <span className="kpr-lh__bg" aria-hidden="true" />
                                <span className="kpr-lh__content">
                                    <Hacky text={n.label} reveal={false} />
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <a className="kpr-signin kpr-cap1" href="#" data-sfx>
                <span className="kpr-signin__bg" aria-hidden="true" />
                <Hacky text="Sign in" reveal={false} />
            </a>
            <div className="kpr-hud__rail">
                <button type="button" className="kpr-hud__mark" aria-label="Back to the start" onClick={() => go(0)} data-sfx>
                    <KeeperMark className="kpr-hud__markIcon" />
                </button>
                <div className="kpr-hud__railBottom">
                    <AudioBars />
                    <button type="button" className="kpr-hud__console" aria-label="Console (not available in this study)" disabled>
                        <Console className="kpr-hud__consoleIcon" />
                    </button>
                </div>
            </div>
        </div>
    );
}
