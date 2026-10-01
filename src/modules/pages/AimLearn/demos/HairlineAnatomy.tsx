'use client';

import { useState } from 'react';

import { Demo } from '../kit/controls';

import HeroMock, { type Part } from './HeroMock';
import ScaledBox from './ScaledBox';

const PARTS: { id: Part; label: string; value: string; text: string }[] = [
    {
        id: 'bar',
        label: 'Thick bar',
        value: '3.19em',
        text: 'The only heavy shape on the page besides the logo. It is the page’s “ground line”: the logo animation lands on it, and it separates the loud top from the quiet text below.',
    },
    { id: 'strip', label: 'Gutter strip', value: '0.97em', text: 'An empty strip that equals one gutter. Spacing is always a multiple of the same unit, so nothing looks arbitrary.' },
    { id: 'rule', label: 'Hairline', value: '1px · 98% wide', text: 'A single 1px rule under the nav, inset by one gutter. It draws itself in during the intro (0 → 98% over 1s).' },
    { id: 'divider', label: 'Column divider', value: '32.8% | 66.3%', text: 'A vertical 1px rule on the right of the left column. The two columns add up to 99.1%: the rest is the gutters.' },
    {
        id: 'gutter',
        label: 'Gutters',
        value: '0.97em both sides',
        text: 'Page padding. Because it is an em, it grows with the window: the margin you see on a laptop is proportionally the same as on a 27-inch screen.',
    },
    { id: 'label', label: 'Label text', value: '0.95em', text: 'All UI text is one size and one weight. Hierarchy comes from position and space, not from a type scale.' },
    {
        id: 'heading',
        label: 'Hero lines',
        value: '5.69em / 0.915',
        text: 'Three tight lines, anchored to the bottom of the right column. The line-height is below 1 so descenders nearly touch the next line.',
    },
];

/** Hover or focus a part to see what it is and how big. Each is outlined on the real layout. */
export default function HairlineAnatomy() {
    const [on, setOn] = useState<Part>('rule');
    const part = PARTS.find((x) => x.id === on) ?? PARTS[2];
    return (
        <Demo title="Structure without boxes: anatomy of the hero" hint="Click a part. Notice there are no cards, shadows or fills: only one thick bar, hairlines and empty space.">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="bg-[var(--al-bg-2)] p-4">
                    <div className="mx-auto max-w-[640px] border border-[var(--al-ink)]">
                        <ScaledBox width={1440}>
                            <HeroMock width={1440} fluid hl={on} />
                        </ScaledBox>
                    </div>
                </div>
                <div className="border-t border-[var(--al-ink)] bg-[var(--al-bg-2)] p-4 lg:border-l lg:border-t-0">
                    <div className="mb-3 flex flex-wrap gap-1 lg:flex-col">
                        {PARTS.map((x) => (
                            <button
                                key={x.id}
                                type="button"
                                aria-pressed={on === x.id}
                                onClick={() => setOn(x.id)}
                                className={`al-btn al-mono border px-2 py-1.5 text-left text-[11px] ${on === x.id ? 'border-[var(--al-ink)] bg-[var(--al-ink)] text-[var(--al-bg)]' : 'border-[var(--al-line-2)] text-[var(--al-dim)] hover:border-[var(--al-ink)]'}`}
                            >
                                {x.label}
                            </button>
                        ))}
                    </div>
                    <div className="al-mono mb-1 text-[10px] uppercase tracking-[0.16em] text-[var(--al-accent-ink)]">{part.value}</div>
                    <p className="text-[13.5px] leading-relaxed text-[var(--al-dim)]">{part.text}</p>
                </div>
            </div>
        </Demo>
    );
}
