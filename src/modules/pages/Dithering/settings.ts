/** Artist-facing vocabulary. IDs are shared with patterns.glsl.ts. */
export const PATTERNS = [
    { id: 0, name: 'Bayer · 2 × 2', hint: 'Four ordered thresholds. Bold, early-computer texture.' },
    { id: 1, name: 'Bayer · 4 × 4', hint: 'Sixteen ordered thresholds. A balanced, repeating print.' },
    { id: 2, name: 'Bayer · 8 × 8', hint: 'Sixty-four thresholds. Finer tonal transitions.' },
    { id: 3, name: 'Stipple', hint: 'A stable seeded threshold for each cell. Organic ink dust.' },
    { id: 4, name: 'Halftone', hint: 'Circular marks grow with the amount of ink.' },
    { id: 5, name: 'Crosshatch', hint: 'Two crossing line screens accumulate in shadows.' },
    { id: 6, name: 'Line screen', hint: 'Parallel engraved lines. Rotate to change their gesture.' },
    { id: 7, name: 'Woven', hint: 'Alternating warp and weft marks, like a textile.' },
    { id: 8, name: 'Contour', hint: 'Repeating tonal bands, like a topographic print.' },
] as const;
export type DitherSettings = {
    pattern: number;
    cellSize: number;
    pixelSize: number;
    angle: number;
    stretch: number;
    softness: number;
    seed: number;
    levels: number;
    exposure: number;
    contrast: number;
    gamma: number;
    threshold: number;
    strength: number;
    colorMode: number;
    ink: string;
    paper: string;
    invert: boolean;
    warp: number;
    aberration: number;
    grain: number;
    scanlines: number;
    vignette: number;
};
export const DEFAULT_DITHER: Readonly<DitherSettings> = {
    pattern: 1,
    cellSize: 4,
    pixelSize: 1,
    angle: 0,
    stretch: 1,
    softness: 0.02,
    seed: 12,
    levels: 2,
    exposure: 0,
    contrast: 1,
    gamma: 1,
    threshold: 0,
    strength: 1,
    colorMode: 0,
    ink: '#10121a',
    paper: '#f2eee6',
    invert: false,
    warp: 0,
    aberration: 0,
    grain: 0,
    scanlines: 0,
    vignette: 0,
};
export type NumericSetting = { [K in keyof DitherSettings]: DitherSettings[K] extends number ? K : never }[keyof DitherSettings];
export type Dial = { key: NumericSetting; label: string; min: number; max: number; step: number; help: string };
/** UI and lessons share the artwork's ranges and descriptions. */
export const DIALS: Record<Exclude<NumericSetting, 'pattern' | 'colorMode'>, Dial> = {
    cellSize: { key: 'cellSize', label: 'Cell size', min: 1, max: 24, step: 1, help: 'Size of each printed mark, in CSS pixels.' },
    pixelSize: { key: 'pixelSize', label: 'Sample size', min: 1, max: 24, step: 1, help: 'Size of the block sampled from the image; independent of the mark.' },
    angle: { key: 'angle', label: 'Screen angle', min: 0, max: 180, step: 1, help: 'Rotate the pattern without rotating the subject.' },
    stretch: { key: 'stretch', label: 'Mark stretch', min: 0.3, max: 3, step: 0.05, help: 'Squash or elongate the pattern along one axis.' },
    softness: { key: 'softness', label: 'Edge softness', min: 0.001, max: 0.2, step: 0.001, help: 'Feather the ink boundary; large values make a soft print.' },
    seed: { key: 'seed', label: 'Random seed', min: 0, max: 100, step: 1, help: 'A repeatable arrangement of stipple and paper grain.' },
    levels: { key: 'levels', label: 'Tone levels', min: 2, max: 8, step: 1, help: 'Two gives ink and paper; more adds intermediate shades.' },
    exposure: { key: 'exposure', label: 'Exposure', min: -3, max: 3, step: 0.05, help: 'Lighten or darken the source in stops, before printing.' },
    contrast: { key: 'contrast', label: 'Contrast', min: 0, max: 3, step: 0.05, help: 'Push tones away from middle gray.' },
    gamma: { key: 'gamma', label: 'Midtone lift', min: 0.3, max: 3, step: 0.05, help: 'Lift midtones without moving black and white endpoints.' },
    threshold: { key: 'threshold', label: 'Tone bias', min: -0.5, max: 0.5, step: 0.01, help: 'Positive values use less ink; negative values use more.' },
    strength: { key: 'strength', label: 'Print mix', min: 0, max: 1, step: 0.01, help: 'Blend between the untreated source and the finished print.' },
    warp: { key: 'warp', label: 'Lens warp', min: -0.6, max: 0.6, step: 0.01, help: 'Bend the image radially before it reaches the print screen.' },
    aberration: { key: 'aberration', label: 'Colour separation', min: 0, max: 12, step: 0.5, help: 'Offset red and blue samples. Most visible in Source colour mode.' },
    grain: { key: 'grain', label: 'Paper grain', min: 0, max: 0.3, step: 0.005, help: 'Stable texture added after ink colours are chosen.' },
    scanlines: { key: 'scanlines', label: 'Scanline depth', min: 0, max: 1, step: 0.01, help: 'Darken alternating horizontal rows for a CRT finish.' },
    vignette: { key: 'vignette', label: 'Edge falloff', min: 0, max: 1, step: 0.01, help: 'Darken the perimeter to frame the composition.' },
};
export type BloomSettings = { enabled: boolean; intensity: number; threshold: number; smoothing: number; radius: number };
export type StudioSettings = {
    dither: DitherSettings;
    before: BloomSettings;
    after: BloomSettings;
    background: string;
    highlight: string;
    environment: number;
    roughness: number;
    subject: 'helmet' | 'knot' | 'sphere';
    animate: boolean;
    speed: number;
    quality: number;
};
export const DEFAULT_STUDIO: StudioSettings = {
    dither: { ...DEFAULT_DITHER },
    before: { enabled: false, intensity: 1, threshold: 0.8, smoothing: 0.2, radius: 0.6 },
    after: { enabled: false, intensity: 0.4, threshold: 0.8, smoothing: 0.2, radius: 0.75 },
    background: '#ffffff',
    highlight: '#066aff',
    environment: 1.5,
    roughness: 0.15,
    subject: 'helmet',
    animate: true,
    speed: 1,
    quality: 1.5,
};
export const PRINT_PRESETS = [
    { name: 'Classic', settings: { ...DEFAULT_DITHER } },
    { name: 'Ink dust', settings: { ...DEFAULT_DITHER, pattern: 3, cellSize: 2, ink: '#25352e', paper: '#e9e6cc', colorMode: 1, contrast: 1.3 } },
    { name: 'Orbital press', settings: { ...DEFAULT_DITHER, pattern: 4, cellSize: 9, angle: 30, colorMode: 1, ink: '#263149', paper: '#efbfa0', gamma: 1.3 } },
    { name: 'Copper etching', settings: { ...DEFAULT_DITHER, pattern: 5, cellSize: 5, angle: 35, colorMode: 1, ink: '#502819', paper: '#efdec6', grain: 0.04 } },
    { name: 'Jacquard', settings: { ...DEFAULT_DITHER, pattern: 7, cellSize: 7, stretch: 1.4, colorMode: 1, ink: '#30294e', paper: '#d1d6bb' } },
    { name: 'Phosphor', settings: { ...DEFAULT_DITHER, pattern: 2, colorMode: 1, ink: '#102b23', paper: '#b2e8bf', scanlines: 0.4, warp: 0.2, vignette: 0.4 } },
] satisfies { name: string; settings: DitherSettings }[];
