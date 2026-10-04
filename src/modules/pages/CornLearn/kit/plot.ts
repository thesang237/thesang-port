/** Tiny SVG plotting helpers for the guide's graphs (no allocations in frame loops: only used in render). */

/** path for y = fn(x) with x in [x0, x1] mapped to a w×h box (y up, values y0..y1). */
export function curvePath(fn: (x: number) => number, w: number, h: number, x0 = 0, x1 = 1, y0 = 0, y1 = 1, n = 120) {
    let d = '';
    for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        const y = fn(x);
        const px = ((x - x0) / (x1 - x0)) * w;
        const py = h - ((y - y0) / (y1 - y0)) * h;
        d += `${i ? 'L' : 'M'}${px.toFixed(2)},${py.toFixed(2)}`;
    }
    return d;
}

export const mapX = (x: number, w: number, x0: number, x1: number) => ((x - x0) / (x1 - x0)) * w;
export const mapY = (y: number, h: number, y0: number, y1: number) => h - ((y - y0) / (y1 - y0)) * h;
