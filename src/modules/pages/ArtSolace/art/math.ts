// Small maths helpers shared by every part of the artwork.

export const TWO_PI = Math.PI * 2;

/** Blend from a to b: t = 0 gives a, t = 1 gives b. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Re-map v from the range [inMin, inMax] to [outMin, outMax] (no clamping, same as p5's map()). */
export const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);
