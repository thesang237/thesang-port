'use client';

import { Demo, Readout, Slider, Toggle } from '../kit/controls';
import { useParams } from '../kit/loop';
import { FEATURED, sample, SCENES } from '../kit/source';

const DEFAULTS = { progress: 35, xray: false };

/** The stage's counter and name list: small things that step in sync with the slides, all from one progress number. */
export default function OdometerLab() {
    const { p, set, reset } = useParams(DEFAULTS);
    const y = sample(SCENES.COUNTER.y ?? [], p.progress); // em
    const slide = p.progress < 35 ? 0 : Math.min(5, Math.floor((p.progress - 35) / 10) + (p.progress >= 45 ? 1 : 0));

    return (
        <Demo
            title="Odometer + name list: three things stepping in sync"
            hint="Drag the progress. The digit strip slides up inside a one-digit window, and the list highlights one name at a time: all tracks of the same progress number."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="stage progress"
                        value={p.progress}
                        min={30}
                        max={90}
                        step={0.1}
                        onChange={(v) => set('progress', v)}
                        format={(v) => `${v.toFixed(1)}%`}
                        help="Slides move at 35→45, 45→55 … 75→85."
                    />
                    <Toggle label="x-ray the digit window" checked={p.xray} onChange={(v) => set('xray', v)} help="Shows the window and the full strip behind it." />
                    <Readout
                        items={[
                            { label: 'strip offset', value: `${y.toFixed(2)}em` },
                            { label: 'digit', value: String(slide + 1) },
                        ]}
                    />
                </>
            }
        >
            <div className="grid min-h-[300px] place-items-center bg-[#e7e4df] p-6 text-[#141414]">
                <div className="flex items-start gap-10" style={{ fontFamily: 'var(--al-display)', fontSize: 20 }}>
                    <div className="flex" style={{ lineHeight: 1 }}>
                        <div className="relative" style={{ height: '0.9em', width: '0.7em' }}>
                            {/* the strip: all six digits, moved up inside a window that shows one */}
                            <div
                                className={p.xray ? 'outline outline-1 outline-dashed outline-[#ef5a1f]' : ''}
                                style={{ overflow: p.xray ? 'visible' : 'hidden', height: '0.9em', position: 'relative' }}
                            >
                                <div style={{ transform: `translateY(${y}em)` }}>
                                    {FEATURED.map((f, i) => (
                                        <div key={f.name} style={{ marginBottom: '0.69em', opacity: p.xray ? 0.9 : 1, color: p.xray && i !== slide ? '#6b6862' : undefined }}>
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <span>— 6</span>
                    </div>
                    <ul>
                        {FEATURED.map((f, i) => (
                            <li key={f.name} style={{ opacity: sample(SCENES.NAMES[i]?.opacity ?? [[0, 1]], p.progress), marginBottom: 2 }}>
                                {f.name}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Demo>
    );
}
