'use client';
import { useState } from 'react';

import { ColorControl, RangeControl, SelectControl, ToggleControl } from './Controls';
import type { BloomSettings, DitherSettings, StudioSettings } from './settings';
import { DEFAULT_STUDIO, DIALS, PATTERNS, PRINT_PRESETS } from './settings';

type Props = { settings: StudioSettings; onChange: (settings: StudioSettings) => void; onClose: () => void };
function BloomControls({ title, value, onChange }: { title: string; value: BloomSettings; onChange: (value: BloomSettings) => void }) {
    const fields = [
        { key: 'intensity', label: 'Glow intensity', min: 0, max: 5, step: 0.05, help: 'Amount of light added around bright areas.' },
        { key: 'threshold', label: 'Highlight threshold', min: 0, max: 2, step: 0.05, help: 'Only areas above this brightness produce a glow.' },
        { key: 'smoothing', label: 'Threshold softness', min: 0, max: 1, step: 0.01, help: 'Feather the transition into glowing areas.' },
        { key: 'radius', label: 'Glow spread', min: 0, max: 1, step: 0.01, help: 'Width of the blurred light surrounding the source.' },
    ] as const;
    return (
        <details>
            <summary>{title}</summary>
            <div className="print-group">
                <ToggleControl label="Enable glow" value={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} />
                {value.enabled && fields.map((dial) => <RangeControl key={dial.key} dial={dial} value={value[dial.key]} onChange={(n) => onChange({ ...value, [dial.key]: n })} />)}
            </div>
        </details>
    );
}
export function StudioPanel({ settings, onChange, onClose }: Props) {
    const [copyStatus, setCopyStatus] = useState('Copy recipe');
    const setDither = <K extends keyof DitherSettings>(key: K, value: DitherSettings[K]) => onChange({ ...settings, dither: { ...settings.dither, [key]: value } });
    const setStudio = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => onChange({ ...settings, [key]: value });
    const renderDials = (keys: (keyof typeof DIALS)[]) => keys.map((key) => <RangeControl key={key} dial={DIALS[key]} value={settings.dither[key]} onChange={(value) => setDither(key, value)} />);
    return (
        <aside className="studio-panel" aria-label="Print settings" data-lenis-prevent>
            <header>
                <div>
                    <span className="print-eyebrow">Artist&apos;s controls</span>
                    <h2>Make an impression.</h2>
                </div>
                <button type="button" onClick={onClose} aria-label="Close controls">
                    ×
                </button>
            </header>
            <div className="studio-panel-body">
                <SelectControl
                    label="Start from a recipe"
                    value="custom"
                    options={[{ value: 'custom', label: 'Choose a starting point…' }, ...PRINT_PRESETS.map((preset, i) => ({ value: i, label: preset.name }))]}
                    onChange={(value) => {
                        if (value !== 'custom') onChange({ ...settings, dither: { ...PRINT_PRESETS[Number(value)].settings } });
                    }}
                />
                <details open>
                    <summary>01 / Print screen</summary>
                    <div className="print-group">
                        <SelectControl
                            label="Pattern"
                            value={settings.dither.pattern}
                            options={PATTERNS.map((p) => ({ value: p.id, label: p.name }))}
                            onChange={(value) => setDither('pattern', Number(value))}
                            help={PATTERNS[settings.dither.pattern].hint}
                        />
                        {renderDials(['cellSize', 'pixelSize', 'angle', 'stretch', 'softness'])}
                        {settings.dither.pattern === 3 && renderDials(['seed'])}
                    </div>
                </details>
                <details>
                    <summary>02 / Tone & colour</summary>
                    <div className="print-group">
                        {renderDials(['levels', 'exposure', 'contrast', 'gamma', 'threshold', 'strength'])}
                        <SelectControl
                            label="Colour treatment"
                            value={settings.dither.colorMode}
                            options={[
                                { value: 0, label: 'Black & white' },
                                { value: 1, label: 'Ink & paper' },
                                { value: 2, label: 'Source colour' },
                            ]}
                            onChange={(value) => setDither('colorMode', Number(value))}
                        />
                        {settings.dither.colorMode === 1 && (
                            <>
                                <ColorControl label="Ink" value={settings.dither.ink} onChange={(v) => setDither('ink', v)} />
                                <ColorControl label="Paper" value={settings.dither.paper} onChange={(v) => setDither('paper', v)} />
                            </>
                        )}
                        <ToggleControl label="Invert coverage" value={settings.dither.invert} onChange={(v) => setDither('invert', v)} />
                    </div>
                </details>
                <details>
                    <summary>03 / Surface & lens</summary>
                    <div className="print-group">{renderDials(['warp', 'aberration', 'grain', 'scanlines', 'vignette', 'seed'])}</div>
                </details>
                <BloomControls title="04 / Glow before printing" value={settings.before} onChange={(before) => setStudio('before', before)} />
                <BloomControls title="05 / Glow after printing" value={settings.after} onChange={(after) => setStudio('after', after)} />
                <details>
                    <summary>06 / Subject & studio</summary>
                    <div className="print-group">
                        <SelectControl
                            label="Subject"
                            value={settings.subject}
                            options={[
                                { value: 'helmet', label: 'Jousting helmet' },
                                { value: 'knot', label: 'Sculptural knot' },
                                { value: 'sphere', label: 'Faceted moon' },
                            ]}
                            onChange={(v) => setStudio('subject', v as StudioSettings['subject'])}
                        />
                        <ColorControl label="Background" value={settings.background} onChange={(v) => setStudio('background', v)} />
                        <ColorControl label="Reflection colour" value={settings.highlight} onChange={(v) => setStudio('highlight', v)} />
                        <RangeControl
                            dial={{ label: 'Light intensity', min: 0, max: 5, step: 0.1, help: 'Brightness of the photographic reflection map.' }}
                            value={settings.environment}
                            onChange={(v) => setStudio('environment', v)}
                        />
                        <RangeControl
                            dial={{ label: 'Roughness', min: 0, max: 1, step: 0.01, help: 'Spread reflections across the surface.' }}
                            value={settings.roughness}
                            onChange={(v) => setStudio('roughness', v)}
                        />
                        <RangeControl
                            dial={{ label: 'Motion speed', min: 0, max: 3, step: 0.1, help: 'Speed of the floating subject.' }}
                            value={settings.speed}
                            onChange={(v) => setStudio('speed', v)}
                        />
                        <SelectControl
                            label="Render density"
                            value={settings.quality}
                            options={[
                                { value: 1, label: '1× · economical' },
                                { value: 1.5, label: '1.5× · balanced' },
                                { value: 2, label: '2× · fine' },
                            ]}
                            onChange={(v) => setStudio('quality', Number(v))}
                            help="Higher density costs more GPU work. Printed marks retain their CSS size."
                        />
                    </div>
                </details>
            </div>
            <footer>
                <button type="button" onClick={() => onChange(structuredClone(DEFAULT_STUDIO))}>
                    Reset all
                </button>
                <button
                    type="button"
                    onClick={() => {
                        void navigator.clipboard.writeText(JSON.stringify(settings, null, 2)).then(
                            () => setCopyStatus('Recipe copied'),
                            () => setCopyStatus('Copy unavailable'),
                        );
                    }}
                    aria-live="polite"
                >
                    {copyStatus}
                </button>
            </footer>
        </aside>
    );
}
