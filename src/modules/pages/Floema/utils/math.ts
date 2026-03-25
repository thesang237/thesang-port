export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (min: number, val: number, max: number) => Math.max(min, Math.min(max, val));
