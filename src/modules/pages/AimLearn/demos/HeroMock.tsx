'use client';

import type { CSSProperties } from 'react';

import { HERO_LINES, MODERNISTS } from '../kit/source';

export type Part = 'bar' | 'strip' | 'rule' | 'divider' | 'gutter' | 'label' | 'heading' | 'list' | 'cue';

type Props = {
    /** Window width in px: the mock is drawn at this width. */
    width: number;
    /** em = 1vw like the page (true) or a fixed 19.2px designed at 1920 (false). */
    fluid: boolean;
    /** Show the gutters and the 32.8 / 66.3 column split. */
    grid?: boolean;
    /** Outline one part. */
    hl?: Part | null;
};

const hlStyle = (on: boolean): CSSProperties | undefined => (on ? { outline: '2px solid var(--al-accent)', outlineOffset: '2px' } : undefined);

/** A teaching copy of the page's hero layout. Every size is in em, with the page's own multipliers. */
export default function HeroMock({ width, fluid, grid, hl }: Props) {
    const phone = fluid && width <= 479;
    const em = fluid ? width / 100 : 19.2;
    // desktop multipliers (aim.scss) and the phone ones (≤ 479px)
    const m = phone ? { label: 3.8, head: 9.6, gutter: 5.2, bar: 3.19 } : { label: 0.95, head: 5.69, gutter: 0.97, bar: 3.19 };
    const gutter = `${m.gutter}em`;
    const label: CSSProperties = { fontSize: `${m.label}em`, lineHeight: phone ? 1 : 0.93, whiteSpace: 'nowrap' };

    return (
        <div className="relative origin-top-left overflow-hidden bg-[#e7e4df] text-[#141414]" style={{ width, fontSize: `${em}px`, fontFamily: 'var(--al-display)', fontWeight: 400 }}>
            {/* the thick black bar */}
            <div style={{ padding: `${phone ? 0 : m.gutter}em ${gutter} 0`, paddingTop: `${m.gutter}em` }}>
                <div className="bg-[#141414]" style={{ height: `${phone ? 1 : m.bar}em`, ...hlStyle(hl === 'bar') }} />
            </div>
            {/* small invisible strip above it keeps the rhythm */}
            <div style={{ height: `${m.gutter}em`, ...hlStyle(hl === 'strip') }} />

            {/* nav row */}
            {!phone && (
                <div className="flex items-end justify-between" style={{ padding: `0 ${gutter}` }}>
                    <span style={{ ...label, ...hlStyle(hl === 'label') }}>AI Modernism of Kharkiv [Ukraine]</span>
                    <span style={label}>Index / Experiment / About</span>
                    <span style={label}>[Gallery]</span>
                    <span style={label}>Obys Agency ©2025</span>
                </div>
            )}
            {phone && (
                <div style={{ padding: `0 ${gutter}`, height: '14em', display: 'flex', alignItems: 'center' }}>
                    <span style={{ ...label, fontWeight: 500, ...hlStyle(hl === 'label') }}>Menu</span>
                </div>
            )}
            {/* hairline at 98% width, inset by one gutter */}
            <div className="bg-[#141414]" style={{ height: 1, width: '98%', margin: `${phone ? 0 : 0.5}em 0 0 ${gutter}`, ...hlStyle(hl === 'rule') }} />

            {/* two columns */}
            <div className="relative flex" style={{ padding: `0 ${gutter}`, flexDirection: phone ? 'column' : 'row', minHeight: phone ? undefined : '14em' }}>
                <div
                    className="relative flex flex-col justify-end"
                    style={{
                        width: phone ? '100%' : '32.8%',
                        borderRight: phone ? undefined : '1px solid #141414',
                        paddingBottom: `${phone ? 5 : m.gutter}em`,
                        paddingTop: phone ? '3em' : 0,
                        ...hlStyle(hl === 'divider'),
                    }}
                >
                    <div style={{ display: 'flex', ...hlStyle(hl === 'list') }}>
                        <span style={{ ...label, width: phone ? '33%' : '7.3em' }}>Modernists:</span>
                        <span style={label}>
                            {MODERNISTS.slice(0, 3).map((n) => (
                                <span key={n} style={{ display: 'block', marginBottom: '0.07em' }}>
                                    {n}
                                </span>
                            ))}
                        </span>
                    </div>
                </div>
                <div style={{ width: phone ? '100%' : '66.3%', paddingLeft: phone ? 0 : '0', paddingTop: phone ? '4em' : '3em' }} className="flex flex-col justify-end">
                    <div style={{ marginLeft: phone ? '35%' : 0, ...hlStyle(hl === 'heading') }}>
                        {HERO_LINES.map((l) => (
                            <div key={l} style={{ fontSize: `${m.head}em`, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 0.915 }}>
                                {l}
                            </div>
                        ))}
                    </div>
                    <div style={{ ...label, marginTop: '0.6em', paddingBottom: `${m.gutter}em`, textAlign: 'right', ...hlStyle(hl === 'cue') }}>Scroll to Explore ↓</div>
                </div>

                {grid && (
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                        <div className="absolute inset-y-0 left-0 bg-[rgba(239,90,31,0.22)]" style={{ width: gutter }} />
                        <div className="absolute inset-y-0 right-0 bg-[rgba(239,90,31,0.22)]" style={{ width: gutter }} />
                        {!phone && <div className="absolute inset-y-0 bg-[rgba(47,93,138,0.16)]" style={{ left: gutter, width: `calc((100% - 2 * ${m.gutter}em) * 0.328)` }} />}
                    </div>
                )}
            </div>
            {hl === 'gutter' && (
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                    <div className="absolute inset-y-0 left-0 bg-[rgba(239,90,31,0.3)]" style={{ width: gutter }} />
                    <div className="absolute inset-y-0 right-0 bg-[rgba(239,90,31,0.3)]" style={{ width: gutter }} />
                </div>
            )}
        </div>
    );
}
