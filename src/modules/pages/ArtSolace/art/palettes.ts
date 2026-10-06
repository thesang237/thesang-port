// ─── Palettes ────────────────────────────────────────────────────────────────
// Each palette is a paper colour, an ink colour and how strong the ink is. `canSoft` says whether
// the palette may use the 'Soft' brush (faint ink): dark or saturated papers can't, it would vanish.

export type Palette = {
    name: string;
    paper: string;
    ink: string;
    /** Ink opacity, 0–255. */
    inkAlpha: number;
    canSoft: boolean;
};

export const COMMON_PALETTES: Palette[] = [
    { name: 'Shadow', paper: '#FFFFFF', ink: '#000000', inkAlpha: 80, canSoft: true },
    { name: 'Weather', paper: '#FEEFEC', ink: '#1E1C21', inkAlpha: 80, canSoft: true },
    { name: 'Weather', paper: '#FEEFEC', ink: '#1E1C21', inkAlpha: 80, canSoft: true },
    { name: 'Warm', paper: '#FFD7C2', ink: '#191919', inkAlpha: 80, canSoft: true },
    { name: 'Warm', paper: '#FFD7C2', ink: '#191919', inkAlpha: 80, canSoft: true },
    { name: 'Lamp', paper: '#FBE8DA', ink: '#00100B', inkAlpha: 80, canSoft: true },
    { name: 'Lamp', paper: '#FBE8DA', ink: '#00100B', inkAlpha: 80, canSoft: true },
    { name: 'Sweet', paper: '#FFC09F', ink: '#040404', inkAlpha: 80, canSoft: false },
    { name: 'Daze', paper: '#F0DED1', ink: '#543B3B', inkAlpha: 80, canSoft: true },
    { name: 'Secret', paper: '#FDEDF0', ink: '#25040B', inkAlpha: 80, canSoft: false },
    { name: 'Coffee', paper: '#FFF1D6', ink: '#5B3F34', inkAlpha: 80, canSoft: false },
    { name: 'Smart', paper: '#F5EFED', ink: '#0B2332', inkAlpha: 80, canSoft: false },
    { name: 'Mars', paper: '#DE8471', ink: '#221A23', inkAlpha: 80, canSoft: false },
    { name: 'Earth', paper: '#FFF3E4', ink: '#483434', inkAlpha: 80, canSoft: true },
    { name: 'Blood', paper: '#E45D50', ink: '#000000', inkAlpha: 80, canSoft: false },
];

export const RARE_PALETTES: Palette[] = [
    { name: 'Polar', paper: '#5858C6', ink: '#09060F', inkAlpha: 80, canSoft: false },
    { name: 'Forest', paper: '#F3F6F6', ink: '#3D514D', inkAlpha: 80, canSoft: false },
    { name: 'Cold', paper: '#3255A4', ink: '#000000', inkAlpha: 80, canSoft: false },
    { name: 'Underworld', paper: '#27637C', ink: '#000000', inkAlpha: 60, canSoft: true },
    { name: 'Leaf', paper: '#FFFFFF', ink: '#407060', inkAlpha: 60, canSoft: true },
    { name: 'Lychee', paper: '#FFFFFF', ink: '#F15060', inkAlpha: 60, canSoft: false },
];

/**
 * The bag palettes are drawn from. Odds come from repetition: the common list goes in 3 times
 * (and Weather, Warm, Lamp sit in it twice), so each rare palette is about 1 in 51.
 * ⚠ Changing this list (or its order) changes the palette of every existing seed.
 */
export const PALETTE_BAG: Palette[] = [...COMMON_PALETTES, ...COMMON_PALETTES, ...COMMON_PALETTES, ...RARE_PALETTES];

/** One entry per name, in bag order (for menus). */
export const PALETTE_NAMES = [...new Set(PALETTE_BAG.map((p) => p.name))];

export const paletteByName = (name: string): Palette => PALETTE_BAG.find((p) => p.name === name) ?? PALETTE_BAG[0];

/** '#RRGGBB' + alpha 0–255 → a CSS rgba() string. */
export function hexToRgba(hex: string, alpha255: number): string {
    const s = hex.replace('#', '');
    const r = parseInt(s.slice(0, 2), 16),
        g = parseInt(s.slice(2, 4), 16),
        b = parseInt(s.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${(alpha255 / 255).toFixed(4)})`;
}
