'use client';

import { useEffect, useRef } from 'react';

import { CHAPTERS, LEGAL_LINKS, MENU_BUTTONS, MENU_LINK, SECTIONS } from '../data/story';
import { useUi } from '../store';

import { Mark } from './Logo';

/**
 * Menu (reference 17.5–28 s): the scene behind blurs (engine), then the content fades up in a
 * stagger. Left: "Explore the story", three chapters (small grey label + big title). Right: three
 * outline buttons and an underlined link. Bottom: legal links + social icons. Top right: partner
 * mark + round close button. Measured at 1920 × 994 (see the SCSS for the numbers).
 */
export default function Menu({ onClose, onGo }: { onClose: () => void; onGo: (chapter: number) => void }) {
    const open = useUi((s) => s.menuOpen);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        closeRef.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <div className={`corn-menu${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
            <div className="corn-menu__top">
                <span className="corn-menu__partner">
                    <Mark className="corn-menu__partner-mark" />
                    <span>
                        GRAINLINE
                        <small>research</small>
                    </span>
                </span>
                <button ref={closeRef} type="button" className="corn-menu__close" aria-label="Close menu" onClick={onClose} tabIndex={open ? 0 : -1}>
                    <svg viewBox="0 0 20 20" aria-hidden>
                        <path d="M3 3l14 14M17 3L3 17" />
                    </svg>
                </button>
            </div>
            <div className="corn-menu__story">
                <p className="corn-menu__kicker" style={{ '--i': 0 } as React.CSSProperties}>
                    Explore the story
                </p>
                <ol>
                    {SECTIONS.map((s, i) => (
                        <li key={s.id} style={{ '--i': i + 1 } as React.CSSProperties}>
                            <span className="corn-menu__chapter">Chapter {i + 1}</span>
                            <button type="button" className="corn-menu__title" tabIndex={open ? 0 : -1} onClick={() => onGo(CHAPTERS.findIndex((c) => c.section === s.id))}>
                                {s.label}
                            </button>
                        </li>
                    ))}
                </ol>
            </div>
            <div className="corn-menu__actions">
                {MENU_BUTTONS.map((b, i) => (
                    <a key={b} href="#" className="corn-menu__btn" style={{ '--i': i + 1 } as React.CSSProperties} tabIndex={open ? 0 : -1} onClick={(e) => e.preventDefault()}>
                        {b}
                    </a>
                ))}
                <a href="#" className="corn-menu__link" style={{ '--i': 4 } as React.CSSProperties} tabIndex={open ? 0 : -1} onClick={(e) => e.preventDefault()}>
                    {MENU_LINK}
                </a>
            </div>
            <div className="corn-menu__bottom" style={{ '--i': 5 } as React.CSSProperties}>
                {LEGAL_LINKS.map((l) => (
                    <a key={l} href="#" tabIndex={open ? 0 : -1} onClick={(e) => e.preventDefault()}>
                        {l}
                    </a>
                ))}
                <span className="corn-menu__social" aria-label="Social links">
                    {['M4 4l12 12M16 4L4 16', 'M10 3v14M3 10h14', 'M4 10a6 6 0 1 0 12 0a6 6 0 1 0 -12 0'].map((d, i) => (
                        <a key={d} href="#" aria-label={['X', 'Profile', 'Photos'][i]} tabIndex={open ? 0 : -1} onClick={(e) => e.preventDefault()}>
                            <svg viewBox="0 0 20 20" aria-hidden>
                                <path d={d} />
                            </svg>
                        </a>
                    ))}
                </span>
            </div>
        </div>
    );
}
