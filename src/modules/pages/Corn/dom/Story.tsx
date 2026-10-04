'use client';

import type { CSSProperties } from 'react';

import { CHAPTERS, HERO } from '../data/story';
import { type HotspotId, useUi } from '../store';

/**
 * DOM side of each stop. Headings are real text in the traced display face, kept transparent:
 * the engine measures them and draws the WebGL title exactly on top (so layout, wrapping and
 * screen readers stay in the DOM). Body copy and the CTA ring fade in once the title has drawn.
 */

export function HeroCopy() {
    const ready = useUi((s) => s.heroReady);
    const here = useUi((s) => s.chapter === 0);
    return (
        <section className={`corn-hero${ready && here ? ' is-on' : ''}`} aria-label="Introduction">
            <h1 className="corn-gl-anchor corn-hero__title" data-gl-title="0">
                {HERO.title}
            </h1>
            <p className="corn-hero__sub">{HERO.subtitle}</p>
            <p className="corn-hero__hint">{HERO.hint}</p>
        </section>
    );
}

export function CtaRing({ label, at, on, onClick }: { label: string; at: [number, number]; on: boolean; onClick?: () => void }) {
    const style = { '--x': at[0], '--y': at[1] } as CSSProperties;
    return (
        <button type="button" className={`corn-cta${on ? ' is-on' : ''}`} style={style} tabIndex={on ? 0 : -1} onClick={onClick}>
            <svg className="corn-cta__rings" viewBox="0 0 200 200" aria-hidden>
                <circle className="corn-cta__inner" cx="100" cy="100" r="62" />
                <circle className="corn-cta__arc" cx="100" cy="100" r="78" pathLength="100" />
                <circle className="corn-cta__arc corn-cta__arc--b" cx="100" cy="100" r="92" pathLength="100" />
            </svg>
            <span className="corn-cta__label">{label}</span>
        </button>
    );
}

export function Chapters({ onOpen }: { onOpen: (id: HotspotId) => void }) {
    const chapter = useUi((s) => s.chapter);
    const hotspot = useUi((s) => s.hotspot);
    return (
        <>
            {CHAPTERS.map((c, i) =>
                c.title.length && i > 0 ? (
                    <section key={c.id} className={`corn-chapter${chapter === i && !hotspot ? ' is-on' : ''}`} aria-hidden={chapter !== i || !!hotspot}>
                        <div className="corn-chapter__group">
                            <h2 className="corn-gl-anchor corn-chapter__title" data-gl-title={i}>
                                {c.title.map((line) => (
                                    <span key={line}>{line}</span>
                                ))}
                            </h2>
                            {c.body && <p className="corn-chapter__body">{c.body}</p>}
                        </div>
                        {c.cta && c.ctaAt && <CtaRing label={c.cta} at={c.ctaAt} on={chapter === i && !hotspot} onClick={c.hotspot ? () => onOpen(c.hotspot!) : undefined} />}
                    </section>
                ) : null,
            )}
        </>
    );
}
