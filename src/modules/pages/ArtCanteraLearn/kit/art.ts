// Teaching copies reuse the exact source math, noise, dice, camera and erosion.
import { Camera } from '../../ArtCantera/art/camera.js';
import { createTerrainTools } from '../../ArtCantera/art/height-field.js';
import { createNoise3D } from '../../ArtCantera/art/noise.js';
import { LocalRandom } from '../../ArtCantera/art/random.js';
import { createTracing } from '../../ArtCantera/art/tracing.js';

export { Camera, LocalRandom };
export { addVec, dot, lerp, rotate2, rotateXZ } from '../../ArtCantera/art/math.js';
export { DEFAULT_HASH, TokenRandom } from '../../ArtCantera/art/random.js';

export function studyField(seed = 19, frequency = 0.025, layers = 3) {
    const world = { random: new LocalRandom(seed), extent: 64 };
    const math = createTracing(world);
    math.setNoise(createNoise3D(seed));
    const { HeightField } = createTerrainTools(world, math);
    const field = new HeightField(65, 65, 0.39);
    for (let layer = 0; layer < layers; layer++) field.addNoise(8 / (layer + 1), layer * 17, frequency * (layer + 1), -0.5, 1, false, 1, 1, false);
    field.normalize();
    return field;
}

export const INK = '#292724';
export const PAPER = '#f3ede3';
export const CLAY = '#9a4e33';

/** Parallel projection of an artist's small test object; no perspective distortion. */
export function projectStudy(point: number[], width: number, height: number, turn = -Math.PI / 4, tilt = Math.PI / 4) {
    const camera = new Camera(0, 0, 0, tilt, turn);
    const scale = Math.min(width / 100, height / 80);
    const p = camera.project(point, 1 / scale, width, height);
    return [p[0], p[1] + height * 0.1, p[2]];
}

export function drawField(context: CanvasRenderingContext2D, width: number, height: number, field: ReturnType<typeof studyField>, relief = 1, ink = false) {
    context.fillStyle = PAPER;
    context.fillRect(0, 0, width, height);
    context.lineWidth = 0.65;
    const point = (x: number, y: number) => projectStudy([x - 32, y - 32, field.sample(x, y, true)[2] * 24 * relief], width, height);
    for (let y = 63; y >= 0; y -= 2) {
        context.beginPath();
        for (let x = 0; x < 64; x++) {
            const p = point(x, y);
            if (x === 0) context.moveTo(p[0], p[1]);
            else context.lineTo(p[0], p[1]);
        }
        context.strokeStyle = ink ? INK : `rgba(41,39,36,${0.3 + y / 160})`;
        context.stroke();
    }
    if (!ink)
        for (let x = 0; x < 64; x += 4) {
            context.beginPath();
            for (let y = 0; y < 64; y++) {
                const p = point(x, y);
                if (!y) context.moveTo(p[0], p[1]);
                else context.lineTo(p[0], p[1]);
            }
            context.strokeStyle = '#9a4e333d';
            context.stroke();
        }
}

export function cube(context: CanvasRenderingContext2D, x: number, y: number, z: number, size: number, width: number, height: number, turn = -Math.PI / 4, tilt = Math.PI / 4, tint = false) {
    const faces = [
        [
            [x, y, z],
            [x + size, y, z],
            [x + size, y, z + size],
            [x, y, z + size],
        ],
        [
            [x, y, z],
            [x, y + size, z],
            [x, y + size, z + size],
            [x, y, z + size],
        ],
        [
            [x, y, z + size],
            [x + size, y, z + size],
            [x + size, y + size, z + size],
            [x, y + size, z + size],
        ],
    ];
    faces.forEach((face, index) => {
        context.beginPath();
        face.forEach((vertex, i) => {
            const p = projectStudy(vertex, width, height, turn, tilt);
            if (!i) context.moveTo(p[0], p[1]);
            else context.lineTo(p[0], p[1]);
        });
        context.closePath();
        context.fillStyle = tint ? ['#805444', '#b67758', '#d6a37e'][index] : ['#aaa49a', '#cbc4b8', '#e7dfd1'][index];
        context.fill();
        context.strokeStyle = '#5c554744';
        context.lineWidth = 0.6;
        context.stroke();
    });
}
