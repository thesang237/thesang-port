// Invented partner wordmarks (no real brands). Each one has a distinct typographic treatment so the
// row keeps the rhythm of a real logo strip.
import type { CSSProperties } from 'react';

const STYLES: Record<string, CSSProperties & { frame?: 'box' | 'oval' }> = {
    NORTHWIND: { fontFamily: 'var(--ln-sans)', fontWeight: 700, letterSpacing: '0.18em', fontSize: 22 },
    halcyon: { fontFamily: 'var(--ln-sans)', fontWeight: 500, letterSpacing: '-0.03em', fontSize: 40 },
    VERTEX: { fontFamily: 'var(--ln-sans)', fontWeight: 800, fontStyle: 'italic', fontVariationSettings: "'wdth' 75", fontSize: 34 },
    PULSAR: { fontFamily: 'var(--ln-sans)', fontWeight: 700, fontSize: 24, letterSpacing: '0.06em', frame: 'oval' },
    Oktave: { fontFamily: 'var(--ln-serif)', fontSize: 40 },
    'LUMEN&CO': { fontFamily: 'var(--ln-sans)', fontWeight: 600, fontSize: 24, letterSpacing: '0.3em' },
    ARCADIA: { fontFamily: 'var(--ln-serif)', fontSize: 34, letterSpacing: '0.04em', frame: 'box' },
    kinetik: { fontFamily: 'var(--ln-sans)', fontWeight: 800, fontSize: 36, letterSpacing: '-0.05em', fontStyle: 'italic' },
    HELIX: { fontFamily: 'var(--ln-sans)', fontWeight: 300, fontSize: 30, letterSpacing: '0.4em' },
    orbit: { fontFamily: 'var(--ln-sans)', fontWeight: 700, fontSize: 38, letterSpacing: '-0.04em' },
};

export function PartnerLogo({ name, color = 'currentColor' }: { name: string; color?: string }) {
    const { frame, ...style } = STYLES[name] ?? {};
    return (
        <span className="ln-logo" data-frame={frame} style={{ color, ...style }}>
            {name}
        </span>
    );
}
