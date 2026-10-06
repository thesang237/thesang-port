'use client';

// The tweak panel (leva). Press D to show or hide it.
//
// How overrides work: every scene dial has a checkbox. Unticked = "use what the seed rolled" (the
// dial shows that rolled value so you can see it). Tick it and the dial's value is forced.
// Traits use a menu whose first option, "seed", means the same thing.

import { type RefObject, useEffect, useRef } from 'react';
import { button, folder, LevaPanel, monitor, useControls, useCreateStore } from 'leva';

import { PALETTE_NAMES } from '../art/palettes';
import type { SceneOverrides, SceneParams } from '../art/params';
import type { ArtOverrides, Scene } from '../art/scene';
import { BRUSHES, DUNE_COUNTS, MARGINS, SKIES, type Traits } from '../art/traits';

const SEED = 'seed';

// ── scene dials: [min, max, step, unit] in panel units ──
// leva shows at most 2 decimals, so tiny values are shown in thousandths (‰) of the canvas:
// the panel value × unit = the scene value (dotSize 1.2 ‰ = 0.0012).
const MILLI = 0.001;
const NUMBER_DIALS = {
    // composition
    margin: [0, 0.2, 0.005, 1],
    // warp
    verticalCompression: [0.2, 2, 0.01, 1],
    warpFreqY: [0, 20, 0.1, 1],
    warpAmplY: [0, 100, 0.1, MILLI],
    warpPhaseY: [0, Math.PI * 2, 0.01, 1],
    // dunes
    nearY: [0, 1, 0.01, 1],
    farY: [0, 1, 0.01, 1],
    depthCurve: [0.1, 3, 0.05, 1],
    peakScale: [0.1, 3, 0.05, 1],
    ridgeWobble: [0, 5, 0.05, 1],
    ridgeLean: [-2, 2, 0.01, MILLI],
    ridgeStep: [0.2, 5, 0.05, MILLI],
    // sand brush
    skyDensity: [0, 1, 0.01, 1],
    slopeDensity: [0, 1, 0.01, 1],
    coreDensity: [0, 1, 0.01, 1],
    dotsPerFrame: [500, 40000, 500, 1],
    frames: [1, 200, 1, 1],
    dotSize: [0.3, 10, 0.05, MILLI],
    inkAlpha: [0, 255, 1, 1],
} as const satisfies Partial<Record<keyof SceneParams, readonly [number, number, number, number]>>;

const BOOL_DIALS = ['flipX', 'mistyLayout', 'specialPeaks', 'smoothEdges', 'blur'] as const satisfies readonly (keyof SceneParams)[];
const COLOR_DIALS = ['paper', 'ink'] as const satisfies readonly (keyof SceneParams)[];

type NumberKey = keyof typeof NUMBER_DIALS;
const numberDial = (key: NumberKey) => {
    const [min, max, step, unit] = NUMBER_DIALS[key];
    return { label: unit === MILLI ? `${key} ‰` : key, value: min, min, max, step, optional: true, disabled: true };
};
const boolDial = () => ({ value: false, optional: true, disabled: true });
const colorDial = () => ({ value: '#000000', optional: true, disabled: true });
const traitMenu = (options: readonly (string | number)[]) => ({ value: SEED, options: [SEED, ...options.map(String)] });

/** Panel values → the overrides the scene understands. */
function toOverrides(v: Record<string, unknown>): ArtOverrides {
    const traits: Partial<Traits> = {};
    if (v.palette !== SEED) traits.Palette = v.palette as string;
    if (v.dunes !== SEED) traits.Dunes = Number(v.dunes);
    if (v.sky !== SEED) traits.Sky = v.sky as Traits['Sky'];
    if (v.marginTrait !== SEED) traits.Margin = v.marginTrait as Traits['Margin'];
    if (v.brush !== SEED) traits.Brush = v.brush as Traits['Brush'];
    if (v.dancers !== SEED) traits.Dancers = v.dancers === 'on';
    if (v.sandstorm !== SEED) traits.Sandstorm = v.sandstorm === 'on';
    if (v.misty !== SEED) traits.Misty = v.misty === 'on';

    const params: Record<string, unknown> = {};
    for (const key of Object.keys(NUMBER_DIALS) as NumberKey[]) {
        if (v[key] !== undefined) params[key] = (v[key] as number) * NUMBER_DIALS[key][3];
    }
    for (const key of [...BOOL_DIALS, ...COLOR_DIALS]) {
        if (v[key] !== undefined) params[key] = v[key];
    }
    if (v.skew !== SEED) params.skew = v.skew;
    return { traits, params: params as SceneOverrides };
}

type Props = {
    visible: boolean;
    seed: string;
    locked: boolean;
    animate: boolean;
    scene: Scene;
    /** frame / total, written by the draw loop (read here a few times a second, never re-renders) */
    progress: RefObject<string>;
    onSeed: (seed: string) => void;
    onLock: (locked: boolean) => void;
    onAnimate: (animate: boolean) => void;
    onNewSeed: () => void;
    onRedraw: () => void;
    onSave: () => void;
    onCopyLink: () => void;
    /** Overrides as a JSON string (see ArtSolacePage). */
    onOverrides: (overridesJson: string) => void;
};

export function DebugPanel(props: Props) {
    const { visible, seed, locked, animate, scene, progress, onOverrides } = props;
    const store = useCreateStore();
    // buttons are created once by leva: give them the latest callbacks through a ref
    const actions = useRef(props);
    useEffect(() => {
        actions.current = props;
    });
    const rolled = useRef('');

    const [values, set] = useControls(
        () => ({
            Seed: folder({
                seed: { value: seed, onChange: (v: string, _p, ctx) => ctx.fromPanel && !ctx.initial && v && actions.current.onSeed(v), transient: false },
                'lock seed (L)': { value: locked, onChange: (v: boolean, _p, ctx) => ctx.fromPanel && !ctx.initial && actions.current.onLock(v), transient: false },
                'animate build': { value: animate, onChange: (v: boolean, _p, ctx) => ctx.fromPanel && !ctx.initial && actions.current.onAnimate(v), transient: false },
                'new seed (R)': button(() => actions.current.onNewSeed()),
                redraw: button(() => actions.current.onRedraw()),
                'copy link': button(() => actions.current.onCopyLink()),
                'save PNG (S)': button(() => actions.current.onSave()),
                progress: monitor(progress),
                rolled: monitor(rolled),
            }),
            Traits: folder(
                {
                    palette: { label: 'Palette', ...traitMenu(PALETTE_NAMES) },
                    dunes: { label: 'Dunes', ...traitMenu(DUNE_COUNTS) },
                    sky: { label: 'Sky', ...traitMenu(SKIES) },
                    marginTrait: { label: 'Margin', ...traitMenu(MARGINS) },
                    brush: { label: 'Brush', ...traitMenu(BRUSHES) },
                    dancers: { label: 'Dancers', ...traitMenu(['on', 'off']) },
                    sandstorm: { label: 'Sandstorm', ...traitMenu(['on', 'off']) },
                    misty: { label: 'Misty', ...traitMenu(['on', 'off']) },
                },
                { collapsed: true },
            ),
            Composition: folder(
                {
                    flipX: boolDial(),
                    skew: traitMenu(['none', 'left', 'right']),
                    mistyLayout: boolDial(),
                    margin: numberDial('margin'),
                },
                { collapsed: true },
            ),
            Warp: folder(
                {
                    verticalCompression: numberDial('verticalCompression'),
                    warpFreqY: numberDial('warpFreqY'),
                    warpAmplY: numberDial('warpAmplY'),
                    warpPhaseY: numberDial('warpPhaseY'),
                },
                { collapsed: true },
            ),
            Dunes: folder(
                {
                    nearY: numberDial('nearY'),
                    farY: numberDial('farY'),
                    depthCurve: numberDial('depthCurve'),
                    peakScale: numberDial('peakScale'),
                    specialPeaks: boolDial(),
                    smoothEdges: boolDial(),
                    ridgeWobble: numberDial('ridgeWobble'),
                    ridgeLean: numberDial('ridgeLean'),
                    ridgeStep: numberDial('ridgeStep'),
                },
                { collapsed: true },
            ),
            'Sand brush': folder(
                {
                    skyDensity: numberDial('skyDensity'),
                    slopeDensity: numberDial('slopeDensity'),
                    coreDensity: numberDial('coreDensity'),
                    blur: boolDial(),
                    dotsPerFrame: numberDial('dotsPerFrame'),
                    frames: numberDial('frames'),
                    dotSize: numberDial('dotSize'),
                    paper: colorDial(),
                    ink: colorDial(),
                    inkAlpha: numberDial('inkAlpha'),
                },
                { collapsed: true },
            ),
        }),
        { store },
    );

    // seed / lock / animate can also change from the keyboard: mirror them into the panel
    useEffect(() => set({ seed, 'lock seed (L)': locked, 'animate build': animate }), [seed, locked, animate, set]);

    // show what the seed rolled: unticked dials display the rolled value
    useEffect(() => {
        const t = scene.traits;
        rolled.current = `${t.Palette} · ${t.Dunes} dunes · sky ${t.Sky} · ${t.Brush}${t.Dancers ? ' · Dancers' : ''}${t.Sandstorm ? ' · Sandstorm' : ''}${t.Misty ? ' · Misty' : ''}`;
        const v = store.getData();
        const patch: Record<string, unknown> = {};
        for (const key of [...Object.keys(NUMBER_DIALS), ...BOOL_DIALS, ...COLOR_DIALS] as (keyof SceneParams)[]) {
            const input = Object.entries(v).find(([path]) => path.endsWith(`.${key}`))?.[1] as { disabled?: boolean } | undefined;
            if (!input?.disabled) continue;
            const value = scene.params[key];
            patch[key] = typeof value === 'number' && key in NUMBER_DIALS ? value / NUMBER_DIALS[key as NumberKey][3] : value;
        }
        set(patch);
    }, [scene, set, store]);

    // hand overrides to the page only when they really change (not when the rolled values are shown)
    const overridesKey = JSON.stringify(toOverrides(values as Record<string, unknown>));
    useEffect(() => onOverrides(overridesKey), [overridesKey, onOverrides]);

    return <LevaPanel store={store} hidden={!visible} titleBar={{ title: 'Solace · debug (D)', filter: false }} theme={{ sizes: { rootWidth: '320px', controlWidth: '150px' } }} />;
}
