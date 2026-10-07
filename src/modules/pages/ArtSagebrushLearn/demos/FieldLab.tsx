'use client';

import { useEffect, useRef, useState } from 'react';

import { createHeightfield } from '../../ArtSagebrush/art/heightfield';
import { cv, vdot, vnorm } from '../../ArtSagebrush/art/math';
import { createNoise } from '../../ArtSagebrush/art/noise';
import { buildPalettes, col2css } from '../../ArtSagebrush/art/palette';
import { projectTerrain } from '../../ArtSagebrush/art/projection';
import { createRandom } from '../../ArtSagebrush/art/random';
import { terrainGradient } from '../../ArtSagebrush/art/terrain';
import { Demo, Slider } from '../kit/controls';

export type FieldMode = 'map' | 'seeds' | 'terrain' | 'erosion' | 'light' | 'depth' | 'contours';
const DEFAULTS = { seed: 42, noiseSeed: 1337, scale: 0.55, erosion: 1, angle: -30, warp: 10, bands: 12, stage: 3 };
const TITLES: Record<FieldMode, [string, string]> = {
    map: ['From field to marks', 'Move the stage dial: inspect the data, its slope, then the marks it directs.'],
    seeds: ['Two kinds of chance', 'Change the choice seed, then the noise seed. Notice which half changes.'],
    terrain: ['A field with several scales', 'Compare one broad noise layer with the source’s three-layer height field.'],
    erosion: ['Rain edits the drawing', 'The left field stays dry. The right runs the source’s erosion and softening.'],
    light: ['A moving sun, a fixed landscape', 'Turn the light. The terrain stays still while palette bins change.'],
    depth: ['Where a stroke stands', 'Exaggerate the displacement. Original row order still controls overlap.'],
    contours: ['A topographic print', 'Slice the same smooth field into thin bands; make a print instead of a landscape.'],
};
export default function FieldLab({ mode = 'terrain' }: { mode?: FieldMode }) {
    const [params, setParams] = useState(DEFAULTS);
    const [reverse, setReverse] = useState(false);
    const canvas = useRef<HTMLCanvasElement>(null);
    const info = useRef<HTMLOutputElement>(null);
    const fieldCache = useRef<{ key: string; dry: ReturnType<typeof createHeightfield>; wet: ReturnType<typeof createHeightfield> } | null>(null);
    const set = (key: keyof typeof DEFAULTS, value: number) => setParams((previous) => ({ ...previous, [key]: value }));
    useEffect(() => {
        const ctx = canvas.current?.getContext('2d');
        if (!ctx) return;
        const started = performance.now();
        const noise = createNoise(params.noiseSeed);
        const make = (erosion: number) => createHeightfield(createRandom(params.seed), noise, { scale: params.scale, erosion });
        const needsErosion = ['erosion', 'map', 'depth', 'light'].includes(mode);
        const fieldKey = `${params.seed}:${params.noiseSeed}:${params.scale}:${params.erosion}:${needsErosion}`;
        if (fieldCache.current?.key !== fieldKey) {
            const dry = make(0);
            fieldCache.current = { key: fieldKey, dry, wet: needsErosion ? make(params.erosion) : dry };
        }
        const { dry, wet } = fieldCache.current;
        const size = dry.mapW;
        ctx.fillStyle = '#e8e2d6';
        ctx.fillRect(0, 0, 720, 460);
        const palette = buildPalettes().palettes[5];
        const light = cv(Math.cos((params.angle * Math.PI) / 180), Math.sin((params.angle * Math.PI) / 180));
        const color = (value: number) => col2css(palette[Math.max(0, Math.min(palette.length - 1, Math.floor(value * palette.length)))]);
        const drawMap = (field: number[][], left: number, kind: 'height' | 'light' | 'random' | 'single' | 'contours') => {
            const rng = createRandom(params.seed);
            for (let x = 0; x < size; x++)
                for (let y = 0; y < size; y++) {
                    let value = field[x][y] / (Math.PI * 4);
                    if (kind === 'random') value = rng.r01();
                    if (kind === 'single') value = noise(x * 0.02 * params.scale + 50000, y * 0.02 * params.scale + 50000);
                    if (kind === 'light') value = (vdot(vnorm(terrainGradient(field, x, y, size, size)), light) + 1) / 2;
                    if (kind === 'contours') {
                        ctx.fillStyle = (value * params.bands) % 1 < 0.15 ? '#334b3c' : '#e8e2d6';
                    } else if (kind === 'light') ctx.fillStyle = color(value);
                    else {
                        const tone = Math.round(Math.max(0, Math.min(1, value)) * 225);
                        ctx.fillStyle = `rgb(${tone},${tone + 12},${tone + 4})`;
                    }
                    ctx.fillRect(left + x * 3, 70 + y * 3, 3.1, 3.1);
                }
        };
        const label = (text: string, x: number, y = 400) => {
            ctx.fillStyle = '#334b3c';
            ctx.font = '16px monospace';
            ctx.fillText(text, x, y);
        };
        if (mode === 'depth' || (mode === 'map' && params.stage === 3)) {
            const points: { x: number; y: number }[] = [];
            for (let y = 0; y < size; y += 3) for (let x = 0; x < size; x += 2) points.push({ x, y });
            if (reverse) points.reverse();
            for (const { x, y } of points) {
                const height = wet.hMap[x][y];
                const p = projectTerrain(x * 4, y * 4, height, params.warp);
                const normal = vnorm(terrainGradient(wet.hMap, x, y, size, size));
                ctx.save();
                ctx.translate(100 + p.x * 1.25, 90 + p.y * 0.8);
                ctx.rotate(Math.PI / 2 - (normal.x * Math.PI) / 4);
                ctx.fillStyle = color((vdot(normal, light) + 1) / 2);
                ctx.fillRect(-9, -2, 18, 4);
                ctx.restore();
            }
            label(reverse ? 'FRONT → BACK (deliberately wrong)' : 'BACK → FRONT · original ground row', 100, 435);
        } else {
            const leftKind = mode === 'seeds' ? 'random' : mode === 'terrain' ? 'single' : 'height';
            const rightKind = mode === 'light' || (mode === 'map' && params.stage === 2) ? 'light' : mode === 'contours' ? 'contours' : 'height';
            drawMap(dry.hMap, 36, leftKind);
            drawMap(wet.hMap, 384, rightKind);
            label(mode === 'seeds' ? 'INDEPENDENT CHOICES' : mode === 'terrain' ? 'ONE NOISE LAYER' : 'HEIGHT / BEFORE', 36);
            label(rightKind === 'light' ? 'SLOPE → PALETTE' : mode === 'contours' ? 'THIN CONTOUR BANDS' : mode === 'erosion' ? 'ERODED + SOFTENED' : 'LAYERED FIELD', 384);
        }
        if (info.current) info.current.textContent = `${size} × ${size} samples · ${Math.round(performance.now() - started)} ms to calculate + paint · Canvas 2D`;
    }, [params, mode, reverse]);
    const [title, hint] = TITLES[mode];
    const captions =
        mode === 'depth' || (mode === 'map' && params.stage === 3)
            ? [reverse ? 'Front to back: deliberately reversed' : 'Back to front: sorted by original ground row']
            : [
                  mode === 'seeds' ? 'Independent choices' : mode === 'terrain' ? 'One noise layer' : 'Height field / before',
                  mode === 'light' || (mode === 'map' && params.stage === 2)
                      ? 'Slope → palette'
                      : mode === 'contours'
                        ? 'Thin contour bands'
                        : mode === 'erosion'
                          ? 'After erosion + softening'
                          : 'Layered height field',
              ];
    return (
        <Demo
            title={title}
            hint={hint}
            onReset={() => {
                setParams(DEFAULTS);
                setReverse(false);
            }}
            controls={
                <>
                    {mode === 'map' && <Slider label="Stage" help="1: heights, 2: lighting, 3: projected marks." value={params.stage} min={1} max={3} onChange={(value) => set('stage', value)} />}
                    {mode === 'seeds' && (
                        <Slider label="Choice seed" help="Changes the random stream, independent of the noise seed." value={params.seed} min={0} max={100} onChange={(value) => set('seed', value)} />
                    )}
                    <Slider
                        label="Noise seed"
                        help="Chooses the underlying pattern; it is not a strength control."
                        value={params.noiseSeed}
                        min={1300}
                        max={1400}
                        onChange={(value) => set('noiseSeed', value)}
                    />
                    {(mode === 'terrain' || mode === 'contours') && (
                        <Slider
                            label="Terrain scale"
                            help="Source range 0.15–1. Larger values fit more hills into the field; 0.55 is a study value."
                            value={params.scale}
                            min={0.15}
                            max={1}
                            step={0.05}
                            onChange={(value) => set('scale', value)}
                        />
                    )}
                    {mode === 'erosion' && (
                        <Slider
                            label="Rain multiplier"
                            help="1 = source: 40,000 drops on a 100 × 100 field. Zero retains the final softening pass."
                            value={params.erosion}
                            min={0}
                            max={2}
                            step={0.1}
                            onChange={(value) => set('erosion', value)}
                        />
                    )}
                    {mode === 'light' && (
                        <Slider
                            label="Light angle"
                            help="Source chooses −30° or −150°. This study lets the light travel all the way around."
                            value={params.angle}
                            min={-180}
                            max={180}
                            onChange={(value) => set('angle', value)}
                        />
                    )}
                    {mode === 'depth' && (
                        <>
                            <Slider
                                label="Position warp"
                                help="Source: 10 artwork units. Push it to 60 to fold the marks over each other."
                                value={params.warp}
                                min={0}
                                max={60}
                                onChange={(value) => set('warp', value)}
                            />
                            <button type="button" aria-pressed={reverse} onClick={() => setReverse(!reverse)}>
                                {reverse ? 'Restore depth order' : 'Reverse depth order'}
                            </button>
                        </>
                    )}
                    {mode === 'contours' && (
                        <Slider
                            label="Contour bands"
                            help="A new use of the field. More bands create a denser topographic engraving."
                            value={params.bands}
                            min={2}
                            max={40}
                            onChange={(value) => set('bands', value)}
                        />
                    )}
                    <p className="sg-note">Teaching view: enlarged samples and opaque marks expose the structure. The finished art uses translucent ink strokes.</p>
                </>
            }
        >
            <canvas ref={canvas} width={720} height={460} aria-label={title} />
            <div className="sg-map-captions">
                {captions.map((caption) => (
                    <span key={caption}>{caption}</span>
                ))}
            </div>
            <output className="sg-readout" ref={info} />
        </Demo>
    );
}
