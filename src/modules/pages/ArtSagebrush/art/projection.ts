import { cos, sin, TAU } from './math';
import { ART_SIZE } from './settings';

/** Displace a mark after erosion. Height acts as both an angle and elevation.
 * This is a screen-space warp, not domain warping of the noise lookup. */
export function projectTerrain(x: number, y: number, height: number, warp = 10, elevation = -0.2 * ART_SIZE) {
    return { x: x + cos(height) * warp, y: y + sin(height) * warp + (height / (2 * TAU)) * elevation };
}
