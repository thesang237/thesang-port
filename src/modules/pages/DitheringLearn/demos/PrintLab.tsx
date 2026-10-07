'use client';
import { useRef, useState } from 'react';

import { ColorControl, RangeControl, SelectControl, ToggleControl } from '@/modules/pages/Dithering/Controls';
import type { DitherSettings } from '@/modules/pages/Dithering/settings';
import { DEFAULT_DITHER, DIALS, PATTERNS } from '@/modules/pages/Dithering/settings';

import { FallbackPrint } from '../kit/FallbackPrint';
import type { LabParams } from '../kit/usePrintCanvas';
import { usePrintCanvas } from '../kit/usePrintCanvas';

export type LabConfig = {
    title: string;
    hint: string;
    subject: number;
    settings?: Partial<DitherSettings>;
    dials: (keyof typeof DIALS)[];
    patterns?: number[];
    palette?: boolean;
    bench?: boolean;
    recipe?: boolean;
    glow?: boolean;
};
export default function PrintLab({ config }: { config: LabConfig }) {
    const defaults = (): LabParams => ({
        dither: { ...DEFAULT_DITHER, ...config.settings },
        subject: config.subject,
        phase: 0,
        frequency: 9,
        density: 1.5,
        play: false,
        preGlow: false,
        postGlow: false,
    });
    const [params, setParams] = useState<LabParams>(defaults);
    const [copied, setCopied] = useState('Copy recipe');
    const host = useRef<HTMLDivElement>(null);
    usePrintCanvas(host, params);
    const setDither = <K extends keyof DitherSettings>(key: K, value: DitherSettings[K]) => setParams((p) => ({ ...p, dither: { ...p.dither, [key]: value } }));
    return (
        <div className="dl-demo">
            <header>
                <div>
                    <span className="dl-kicker">Live shader lab</span>
                    <h3>{config.title}</h3>
                    <p>{config.hint}</p>
                </div>
                <button type="button" onClick={() => setParams(defaults())}>
                    Reset lab
                </button>
            </header>
            <div className="dl-lab-layout">
                <div className="dl-stage-wrap">
                    <div ref={host} className="dl-stage" data-bench={config.bench ? 'true' : 'false'}>
                        <FallbackPrint>Static plate · WebGL is unavailable. Read the code below to recreate the live print.</FallbackPrint>
                    </div>
                    <div data-stats className="dl-stats">
                        One scene · one print pass · renders when edited
                    </div>
                </div>
                <div className="dl-dials" data-lenis-prevent>
                    {config.patterns && (
                        <SelectControl
                            label="Print screen"
                            value={params.dither.pattern}
                            options={PATTERNS.filter((p) => config.patterns?.includes(p.id)).map((p) => ({ value: p.id, label: p.name }))}
                            onChange={(v) => setDither('pattern', Number(v))}
                            help={PATTERNS[params.dither.pattern].hint}
                        />
                    )}
                    {config.dials.map((key) => (
                        <RangeControl key={key} dial={DIALS[key]} value={params.dither[key]} onChange={(v) => setDither(key, v)} />
                    ))}
                    {config.palette && (
                        <>
                            <SelectControl
                                label="Colour treatment"
                                value={params.dither.colorMode}
                                options={[
                                    { value: 0, label: 'Black & white' },
                                    { value: 1, label: 'Ink & paper' },
                                    { value: 2, label: 'Source colour' },
                                ]}
                                onChange={(v) => setDither('colorMode', Number(v))}
                            />
                            <ColorControl label="Ink" value={params.dither.ink} onChange={(v) => setDither('ink', v)} />
                            <ColorControl label="Paper" value={params.dither.paper} onChange={(v) => setDither('paper', v)} />
                            <ToggleControl label="Invert coverage" value={params.dither.invert} onChange={(v) => setDither('invert', v)} />
                        </>
                    )}
                    <details>
                        <summary>Teaching image</summary>
                        <div className="print-group">
                            <SelectControl
                                label="Procedural subject"
                                value={params.subject}
                                options={[
                                    { value: 0, label: 'Tone ramp' },
                                    { value: 1, label: 'Orbital poster' },
                                    { value: 2, label: 'Contour landscape' },
                                    { value: 3, label: 'Sine ribbons' },
                                    { value: 4, label: 'Colour field' },
                                ]}
                                onChange={(v) => setParams((p) => ({ ...p, subject: Number(v) }))}
                                help="A separate teaching image; the print pipeline is the real studio code."
                            />
                            <RangeControl
                                dial={{ label: 'Field frequency', min: 1, max: 30, step: 1, help: 'Number of folds across the ribbon or landscape.' }}
                                value={params.frequency}
                                onChange={(v) => setParams((p) => ({ ...p, frequency: v }))}
                            />
                            <RangeControl
                                dial={{ label: 'Phase', min: 0, max: 6.28, step: 0.01, help: 'Scrub the procedural field without running a loop.' }}
                                value={params.phase}
                                onChange={(v) => setParams((p) => ({ ...p, phase: v }))}
                            />
                            <ToggleControl
                                label="Animate field"
                                value={params.play}
                                onChange={(v) => setParams((p) => ({ ...p, play: v }))}
                                help="Off by default. Reduced motion keeps the field still; Phase remains usable."
                            />
                        </div>
                    </details>
                    {config.glow && (
                        <>
                            <ToggleControl
                                label="Glow before print"
                                value={params.preGlow}
                                onChange={(v) => setParams((p) => ({ ...p, preGlow: v }))}
                                help="Changes the image that determines the ink coverage."
                            />
                            <ToggleControl label="Glow after print" value={params.postGlow} onChange={(v) => setParams((p) => ({ ...p, postGlow: v }))} help="Softens the already printed marks." />
                        </>
                    )}
                    {config.bench && (
                        <SelectControl
                            label="Render density"
                            value={params.density}
                            options={[
                                { value: 1, label: '1×' },
                                { value: 1.5, label: '1.5×' },
                                { value: 2, label: '2×' },
                            ]}
                            onChange={(v) => setParams((p) => ({ ...p, density: Number(v) }))}
                            help="2× has four times the pixels of 1×. Printed marks stay the same size."
                        />
                    )}
                    {config.recipe && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    void navigator.clipboard.writeText(JSON.stringify(params.dither, null, 2)).then(
                                        () => setCopied('Recipe copied'),
                                        () => setCopied('Copy unavailable'),
                                    );
                                }}
                                aria-live="polite"
                            >
                                {copied}
                            </button>
                            <details>
                                <summary>Your settings · JSON</summary>
                                <pre>{JSON.stringify(params.dither, null, 2)}</pre>
                            </details>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
