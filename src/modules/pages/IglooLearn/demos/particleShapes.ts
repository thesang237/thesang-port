import { rng } from '../kit/math';

/**
 * Turn any drawing into points: draw it on a hidden canvas, read the pixels,
 * keep random spots where the drawing is opaque (canvas/shapes.ts → extruded()).
 */
export function sampleDrawing(draw: (ctx: CanvasRenderingContext2D, size: number) => void, n: number, seed: number, depth = 0.35, height = 2.6): Float32Array {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    draw(ctx, size);
    const a = ctx.getImageData(0, 0, size, size).data;
    const inside: number[] = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (a[(y * size + x) * 4 + 3] > 128) inside.push(x, y);
    const r = rng(seed);
    const out = new Float32Array(n * 3);
    if (!inside.length) return out;
    for (let i = 0; i < n; i++) {
        const k = Math.floor(r() * (inside.length / 2)) * 2;
        out[i * 3] = ((inside[k] + r()) / size - 0.5) * height;
        out[i * 3 + 1] = (0.5 - (inside[k + 1] + r()) / size) * height;
        out[i * 3 + 2] = (r() - 0.5) * depth;
    }
    return out;
}

const X_PATH =
    'M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z';

export const SHAPES: Record<string, (ctx: CanvasRenderingContext2D, s: number) => void> = {
    penguin: (ctx, s) => {
        const k = s / 256;
        ctx.beginPath();
        ctx.ellipse(128 * k, 158 * k, 64 * k, 80 * k, 0, 0, Math.PI * 2); // body
        ctx.ellipse(128 * k, 72 * k, 50 * k, 46 * k, 0, 0, Math.PI * 2); // head
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(62 * k, 150 * k, 14 * k, 44 * k, -0.45, 0, Math.PI * 2); // flippers
        ctx.ellipse(194 * k, 150 * k, 14 * k, 44 * k, 0.45, 0, Math.PI * 2);
        ctx.ellipse(100 * k, 236 * k, 22 * k, 9 * k, 0, 0, Math.PI * 2); // feet
        ctx.ellipse(156 * k, 236 * k, 22 * k, 9 * k, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out'; // eyes as holes
        ctx.beginPath();
        ctx.arc(110 * k, 66 * k, 7 * k, 0, Math.PI * 2);
        ctx.arc(146 * k, 66 * k, 7 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    },
    x: (ctx, s) => {
        const sc = (s * 0.78) / 1227;
        ctx.translate((s - 1200 * sc) / 2, (s - 1227 * sc) / 2);
        ctx.scale(sc, sc);
        ctx.fill(new Path2D(X_PATH));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    snowflake: (ctx, s) => {
        ctx.translate(s / 2, s / 2);
        ctx.lineCap = 'round';
        ctx.lineWidth = s * 0.045;
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -s * 0.42);
            ctx.moveTo(0, -s * 0.22);
            ctx.lineTo(-s * 0.09, -s * 0.31);
            ctx.moveTo(0, -s * 0.22);
            ctx.lineTo(s * 0.09, -s * 0.31);
            ctx.stroke();
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    ring: (ctx, s) => {
        ctx.lineWidth = s * 0.09;
        [0.4, 0.26, 0.12].forEach((r) => {
            ctx.beginPath();
            ctx.arc(s / 2, s / 2, s * r, 0, Math.PI * 2);
            ctx.stroke();
        });
    },
};

export const textShape =
    (text: string) =>
    (ctx: CanvasRenderingContext2D, s: number): void => {
        const t = text.trim().slice(0, 8) || '?';
        const size = Math.min(s * 0.85, (s * 1.7) / t.length);
        ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, s / 2, s / 2 + size * 0.05);
    };

/** A loose sphere-ish cloud — where particles live before they "form". */
export function cloudPoints(n: number, seed = 12) {
    const r = rng(seed);
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        let x = r() - 0.5;
        let y = r() - 0.5;
        let z = r() - 0.5;
        const l = Math.hypot(x, y, z) || 1;
        const d = 0.4 + Math.pow(r(), 0.5) * 2.6;
        x = (x / l) * d;
        y = (y / l) * d * 0.8;
        z = (z / l) * d;
        out.set([x, y, z], i * 3);
    }
    return out;
}
