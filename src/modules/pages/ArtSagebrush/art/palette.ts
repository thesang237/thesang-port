import { round } from './math';

export type InkColor = [number, number, number, number]; // r,g,b,a 0-255

export function hex2col(h: string): InkColor {
    const s = h.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16), 255];
}
export function lerpcol(a: InkColor, b: InkColor, t: number): InkColor {
    return [round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t), round(a[2] + (b[2] - a[2]) * t), 255];
}
export function col2css(c: InkColor): string {
    return `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
}
export function withA(c: InkColor, a: number): InkColor {
    return [c[0], c[1], c[2], a];
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

export function buildPalettes() {
    const p3a = hex2col('#29264E'),
        p3b = hex2col('#9881F5'),
        p3c = hex2col('#82AFF9');
    const p3d = hex2col('#F97D81'),
        p3e = hex2col('#fcbcbe'),
        p3f = hex2col('#f7c066');

    const palettes: InkColor[][] = [
        ['#000', '#222', '#444', '#777', '#ddd', '#fff'].map(hex2col),
        ['#0f0347', '#1c0682', '#114ff2', '#114ff2', '#d91c2f', '#d91c2f', '#fe3da7', '#fe3da7', '#f79357', '#f79357', '#fbc442', '#fbc442'].map(hex2col),
        ['#1a1d28', '#377D71', '#8879B0', '#FBA1A1', '#FBC5C5'].map(hex2col),
        [p3a, lerpcol(p3a, p3b, 0.5), p3b, lerpcol(p3b, p3c, 0.5), p3d, lerpcol(p3d, p3e, 0.5), p3e, p3f],
        ['#232601', '#4a69fe', '#226330', '#ef412f', '#efac25', '#eeefd0'].map(hex2col),
        ['#040B21', '#0C282D', '#2B4039', '#9A422E', '#d87d1b', '#DFB4BF', '#F3E7DC'].map(hex2col),
    ];
    const treePalettes: InkColor[][] = [
        ['#000', '#222', '#444', '#777', '#ddd', '#fff'].map(hex2col),
        ['#0f0347', '#1c0682', '#114ff2', '#5f317d', '#5f317d', '#bb39a2', '#bb39a2', '#f45969', '#f45969', '#fbc442'].map(hex2col),
        ['#1a1d28', '#2d3351', '#214942', '#214942', '#704723', '#6dad9f', '#6dad9f', '#f99d9d', '#f8b861'].map(hex2col),
        [hex2col('#29264E'), hex2col('#354e6f'), hex2col('#8475bd'), hex2col('#6daba5'), hex2col('#fcbcde'), hex2col('#f7c066')],
        ['#232601', '#232601', '#6b8adc', '#226330', '#c4685b', '#c1a953', '#eeefd0'].map(hex2col),
        ['#040B21', '#0C282D', '#2B4039', '#9A422E', '#d87d1b', '#DFB4BF', '#F3E7DC'].map(hex2col),
    ];
    return { palettes, treePalettes };
}
