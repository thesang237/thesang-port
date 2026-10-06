// Helpers that run the real artwork code into a demo canvas.

import { type ArtOverrides, buildScene, type Scene, Shade, shadeAt, shadeOfPeak } from './source';

/** Build a scene sized for a demo canvas (size = CSS px of the square). */
export const sceneFor = (seed: string, size: number, overrides?: ArtOverrides) => buildScene(seed, size, overrides);

/** Draw every frame at once (no build-up). */
export function drawAll(ctx: CanvasRenderingContext2D, scene: Scene, size: number) {
    ctx.fillStyle = scene.paper;
    ctx.fillRect(0, 0, size, size);
    let frame = 0;
    while (scene.drawFrame(ctx, frame)) frame++;
}

export const ZONE_COLORS = {
    [Shade.Core]: '#1e1c21',
    [Shade.Slope]: '#de8471',
    [Shade.Sky]: '#f3e6d8',
} as const;

/**
 * Paint the shade zones as flat colours: every `step` px, unwarp the point and ask the dunes.
 * (Sandstorm scenes take random numbers here too, so they look a little different each paint.)
 */
export function paintZones(ctx: CanvasRenderingContext2D, scene: Scene, size: number, step = 2, colors: Record<number, string> = ZONE_COLORS, warped = true) {
    const m = scene.params.margin;
    ctx.fillStyle = colors[Shade.Sky];
    ctx.fillRect(0, 0, size, size);
    for (let py = 0; py < size; py += step) {
        for (let px = 0; px < size; px += step) {
            const x = px / size,
                y = py / size;
            if (x < m || x > 1 - m || y < m || y > 1 - m) continue;
            const [mx, my] = warped ? scene.unwarp(x, y) : [x, y];
            const shade = shadeAt(scene.peaks, scene.keys, mx, my);
            if (shade === Shade.Sky) continue;
            ctx.fillStyle = colors[shade];
            ctx.fillRect(px, py, step, step);
        }
    }
}

/** Same, but colour by which dune claimed the point (front dune first): one hue per dune. */
export function paintClaims(ctx: CanvasRenderingContext2D, scene: Scene, size: number, step = 2) {
    ctx.fillStyle = '#f3e6d8';
    ctx.fillRect(0, 0, size, size);
    for (let py = 0; py < size; py += step) {
        for (let px = 0; px < size; px += step) {
            const [mx, my] = scene.unwarp(px / size, py / size);
            for (let i = 0; i < scene.peaks.length; i++) {
                const shade = shadeOfPeak(scene.peaks[i], scene.keys, mx, my);
                if (shade === null) continue;
                ctx.fillStyle = `hsl(${(i * 47 + 12) % 360} 42% ${shade === Shade.Core ? 32 : 66}%)`;
                ctx.fillRect(px, py, step, step);
                break;
            }
        }
    }
}
