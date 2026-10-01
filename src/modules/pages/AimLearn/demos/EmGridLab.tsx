'use client';

import { useState } from 'react';

import { Demo, Readout, Segmented, Slider, Toggle } from '../kit/controls';
import { useParams } from '../kit/loop';

import HeroMock from './HeroMock';
import ScaledBox from './ScaledBox';

const DEFAULTS = { width: 1440, fluid: true, grid: false };

/** The window-width lab: drag the window and watch every em-sized thing follow, or break when sizes are fixed. */
export default function EmGridLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const [scale, setScale] = useState(1);
    const phone = p.fluid && p.width <= 479;
    const em = p.fluid ? p.width / 100 : 19.2;
    const mock = phone ? { head: 9.6, gutter: 5.2, label: 3.8 } : { head: 5.69, gutter: 0.97, label: 0.95 };
    const f = (n: number) => `${(n * em).toFixed(1)}px`;
    const overflow = !p.fluid && p.width < 1100;

    return (
        <Demo
            title="Window-width lab: em = 1vw"
            hint="Drag the window width. In “em = 1vw” mode the whole layout scales like one image; switch to “fixed px” to see what a normal layout does when the window shrinks."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="window width"
                        value={p.width}
                        min={320}
                        max={1920}
                        step={10}
                        onChange={(v) => set('width', v)}
                        format={(v) => `${v}px`}
                        help="Try 1920, 1440, 1024, 480 and 375. At 479px and below the page switches to its phone layout."
                    />
                    <Segmented
                        label="size unit"
                        options={[
                            { value: 'fluid', label: 'em = 1vw (the page)' },
                            { value: 'fixed', label: 'fixed px' },
                        ]}
                        value={p.fluid ? 'fluid' : 'fixed'}
                        onChange={(v) => set('fluid', v === 'fluid')}
                    />
                    <Toggle label="show gutters + columns" checked={p.grid} onChange={(v) => set('grid', v)} help="Orange = the 0.97em gutters. Blue = the 32.8% left column." />
                    <Readout
                        items={[
                            { label: '1em', value: `${em.toFixed(1)}px` },
                            { label: 'heading', value: f(mock.head) },
                            { label: 'gutter', value: f(mock.gutter) },
                            { label: 'label text', value: f(mock.label) },
                        ]}
                    />
                    {overflow && <p className="text-[12px] leading-snug text-[var(--al-accent-ink)]">Fixed sizes: the heading no longer fits its column, and everything has to re-flow or wrap.</p>}
                </>
            }
        >
            <div className="bg-[var(--al-bg-2)] p-4">
                <div className="mx-auto border border-[var(--al-ink)]" style={{ width: Math.min(p.width, 100000), maxWidth: '100%' }}>
                    <ScaledBox width={p.width} onScale={setScale}>
                        <HeroMock width={p.width} fluid={p.fluid} grid={p.grid} />
                    </ScaledBox>
                </div>
                <p className="al-mono mt-2 text-center text-[10.5px] text-[var(--al-faint)]">{`drawn at ${p.width}px wide${scale < 1 ? `, shown at ${Math.round(scale * 100)}%` : ''}`}</p>
            </div>
        </Demo>
    );
}
