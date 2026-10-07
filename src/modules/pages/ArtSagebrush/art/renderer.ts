import { createNoise } from './noise';
import { createRandom } from './random';
import { ART_SIZE, COMPOSITION_SCALE, FRAME_BUDGET_MS, PAPER_COLOR, STEPS_PER_FRAME } from './settings';
import { type World } from './world';

/** Owns a persistent ink surface and random stream. Scheduling is the caller's job.
 * A wall-clock budget prevents slow devices from doing 2,000 expensive steps at once;
 * it never changes their order, so the finished drawing is independent of frame rate.
 */
export function createRenderer(ctx: CanvasRenderingContext2D, world: World, seed: number, noiseSeed: number) {
    const noise = createNoise(noiseSeed);
    const random = createRandom(seed + 1);
    const size = ctx.canvas.width;
    const scale = (COMPOSITION_SCALE * size) / ART_SIZE;
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, size, size);
    return {
        step(maxSteps = STEPS_PER_FRAME, budgetMs = FRAME_BUDGET_MS) {
            const start = performance.now();
            let steps = 0;
            ctx.save();
            ctx.scale(scale, scale);
            ctx.translate(size / (2 * scale) - ART_SIZE / 2, size / (2 * scale) - (world.maxY - world.minY) / 2 - world.minY);
            while (world.shapes.length && steps < maxSteps) {
                const stroke = world.shapes[world.shapes.length - 1];
                if (stroke.update(ctx, noise, random) === 'done') world.shapes.pop();
                steps++;
                if (steps % 32 === 0 && performance.now() - start >= budgetMs) break;
            }
            ctx.restore();
            return { done: world.shapes.length === 0, steps, remaining: world.shapes.length };
        },
    };
}
