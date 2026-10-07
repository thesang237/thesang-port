/** CPU teaching/inspection companion to bayerRank in patterns.glsl.ts.
 * Values are thresholds, not colours. Negative coordinates wrap correctly.
 */
export function bayerThreshold(x: number, y: number, size: 2 | 4 | 8): number {
    let px = ((Math.floor(x) % size) + size) % size;
    let py = ((Math.floor(y) % size) + size) % size;
    let rank = 0;
    for (let bit = 0; 2 ** bit < size; bit++) {
        const bx = px % 2;
        const by = py % 2;
        rank = rank * 4 + 2 * ((bx + by) % 2) + by;
        px = Math.floor(px / 2);
        py = Math.floor(py / 2);
    }
    return (rank + 0.5) / (size * size);
}
