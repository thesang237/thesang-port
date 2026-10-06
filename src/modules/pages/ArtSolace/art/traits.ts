// ─── Traits ──────────────────────────────────────────────────────────────────
// The named features a collector would see listed next to the piece ("Palette: Mars, Dunes: 12…").
// They are rolled first, from their own random stream, so that the list can be read without
// drawing anything.

import { PALETTE_BAG } from './palettes';
import type { Random } from './random';

export const DUNE_COUNTS = [1, 3, 6, 12, 24, 48, 120] as const;
export const SKIES = ['Tabula', 'Starry', 'Wool', 'Beam', 'Timelapse', 'Whisper', 'Null'] as const;
export const MARGINS = ['None', 'Narrow', 'Wide'] as const;
export const BRUSHES = ['Sand', 'Soft', 'Grainy'] as const;
export const RENDERS = ['Simple', 'Refine', 'Banners', 'Modulo'] as const;

export type Traits = {
    /** Palette name (see palettes.ts). */
    Palette: string;
    /** How many dunes (peaks) are drawn. */
    Dunes: number;
    /** Sky style. In this port it only sets how dense the sky's grain is (sceneParams › skyDensity). */
    Sky: (typeof SKIES)[number];
    /** White border around the drawing. */
    Margin: (typeof MARGINS)[number];
    /** Ink strength: Sand (normal), Soft (faint), Grainy (solid, 100 frames). */
    Brush: (typeof BRUSHES)[number];
    /** Rolled for the trait list; this port always draws the 'Simple' scan. */
    Render: (typeof RENDERS)[number];
    /** Rolled for the trait list; not drawn in this port. */
    Dusty: boolean;
    /** When false, busy scenes may stack their dunes diagonally (sceneParams › mistyLayout). */
    Misty: boolean;
    /** Ridges sway sideways in a sine wave. */
    Dancers: boolean;
    /** Edges get kicked up and down at random, like blown sand. */
    Sandstorm: boolean;
};

/**
 * Roll the traits. Read each line as "chance → result": e.g. Sky is Tabula 3 % of the time,
 * Starry 11 %, Wool 6 %, Beam 15 %, Timelapse 25 %, Whisper 20 %, Null 20 %.
 */
export function rollTraits(rand: Random): Traits {
    const palette = rand.pick(PALETTE_BAG);

    const duneIndex = Math.floor(6 * rand.next());
    const dunes = rand.chance(0.02) ? 120 : [1, 3, 6, 12, 24, 48][duneIndex];

    const s = rand.next();
    const sky: Traits['Sky'] = s < 0.03 ? 'Tabula' : s < 0.14 ? 'Starry' : s < 0.2 ? 'Wool' : s < 0.35 ? 'Beam' : s < 0.6 ? 'Timelapse' : s < 0.8 ? 'Whisper' : 'Null';

    const m = rand.next();
    const margin: Traits['Margin'] = m < 0.6 ? 'None' : m < 0.9 ? 'Narrow' : 'Wide';

    const b = rand.next();
    const brush: Traits['Brush'] = b < 0.03 && sky !== 'Tabula' ? 'Grainy' : b < 0.9 || !palette.canSoft ? 'Sand' : 'Soft';

    const r = rand.next();
    const render: Traits['Render'] = r < 0.65 || dunes >= 24 ? 'Simple' : r < 0.8 ? 'Refine' : r < 0.93 ? 'Banners' : 'Modulo';

    // the order of the next four rolls is part of every seed: keep it
    const dusty = sky !== 'Whisper' && sky !== 'Tabula' && rand.chance(0.2);
    const misty = dunes > 1 && (dunes === 3 || dunes === 6 || rand.chance(0.6));
    const dancers = dunes >= 6 && rand.chance(0.03);
    const sandstormOdds = dunes >= 12 ? 0.12 : dunes >= 3 ? 0.04 : 0;
    const sandstorm = rand.chance(sandstormOdds);

    return { Palette: palette.name, Dunes: dunes, Sky: sky, Margin: margin, Brush: brush, Render: render, Dusty: dusty, Misty: misty, Dancers: dancers, Sandstorm: sandstorm };
}
