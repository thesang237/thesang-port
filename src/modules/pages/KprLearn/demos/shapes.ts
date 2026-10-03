/**
 * Card outlines measured on the reference (values copied from choreo.ts at a 1440 × 900 viewport, where
 * one "unit" u = 9 px). Notch = [corner 0 TL · 1 TR · 2 BR · 3 BL, axis 0 top/bottom edge · 1 side edge, length, depth].
 */
export type ShapePreset = {
    label: string;
    w: number;
    h: number;
    radius: number; // −1 = automatic
    notch: [number, number, number, number];
    notch2: [number, number, number, number];
    chamfer: [number, number];
};

const u = 9;

export const SHAPES: Record<string, ShapePreset> = {
    girl: { label: 'Girl (intro card)', w: 308, h: 346, radius: -1, notch: [0, 1, 0.52 * 346, 2.35 * u], notch2: [0, 0, 0, 0], chamfer: [2, 2.6 * u] },
    trailer: { label: 'Trailer card', w: 425, h: 712, radius: -1, notch: [1, 0, 0.41 * 425, 3.5 * u], notch2: [3, 1, 0.45 * 712, 0.9 * u], chamfer: [2, 5.6 * u] },
    small: { label: 'Small landscape', w: 213, h: 140, radius: 1 * u, notch: [1, 0, 0.55 * 213, 1.4 * u], notch2: [0, 0, 0, 0], chamfer: [3, 1.8 * u] },
    tower: { label: 'Keep tower', w: 187, h: 450, radius: -1, notch: [1, 1, 0.45 * 450, 2 * u], notch2: [0, 0, 0, 0], chamfer: [2, 0] },
    launch: { label: 'Launch card C', w: 283, h: 160, radius: 1.1 * u, notch: [0, 0, 0.68 * 283, 2.75 * u], notch2: [0, 0, 0, 0], chamfer: [3, 1.7 * u] },
    handoff: { label: 'Handoff strip', w: 662, h: 270, radius: -1, notch: [3, 0, 0.27 * 662, 5 * u], notch2: [0, 0, 0, 0], chamfer: [2, 0] },
};

/** NotchedCard's automatic radius: ≈ 5.8 % of the short side, clamped to 1.2–4.2 u */
export const autoRadius = (w: number, h: number) => Math.min(4.2 * u, Math.max(1.2 * u, 0.058 * Math.min(w, h)));
