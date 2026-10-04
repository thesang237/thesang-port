import * as THREE from 'three';

/** BMFont-style MSDF font (gilroy.json from the reference, manifold.json rebuilt — see NOTES.md). */
type RawChar = { id: number; x: number; y: number; width: number; height: number; xoffset: number; yoffset: number; xadvance: number };
type RawFont = {
    info: { capHeight?: number; distanceRange?: number };
    common: { lineHeight: number; base: number; scaleW: number; scaleH: number };
    chars: RawChar[];
};

export type MsdfFont = {
    chars: Map<number, RawChar>;
    base: number;
    /** Cap height in atlas px: the unit every layout size is given in. */
    cap: number;
    /** Distance range in atlas px (signed distance 0..1 spans this many px). */
    range: number;
    atlas: THREE.Texture;
    /** Optional per-glyph "position along the outline" map (same layout, any resolution). */
    outline: THREE.Texture | null;
    /** Atlas median, CPU side, for sampling particle positions inside glyphs. */
    median: Uint8Array;
    size: number;
};

function loadImage(url: string) {
    return new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
    });
}

function atlasTexture(img: HTMLImageElement, linear: boolean) {
    const t = new THREE.Texture(img);
    t.flipY = false; // BMFont rects are measured from the image top
    t.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
}

export async function loadFont(json: string, atlasUrl: string, outlineUrl?: string, defaults = { cap: 28, range: 9 }): Promise<MsdfFont> {
    const [raw, img, outlineImg] = await Promise.all([fetch(json).then((r) => r.json() as Promise<RawFont>), loadImage(atlasUrl), outlineUrl ? loadImage(outlineUrl) : Promise.resolve(null)]);
    const size = raw.common.scaleW;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, size, size).data;
    const median = new Uint8Array(size * size);
    for (let i = 0; i < median.length; i++) {
        const r = px[i * 4],
            g = px[i * 4 + 1],
            b = px[i * 4 + 2];
        median[i] = Math.max(Math.min(r, g), Math.min(Math.max(r, g), b));
    }
    return {
        chars: new Map(raw.chars.map((ch) => [ch.id, ch])),
        base: raw.common.base,
        cap: raw.info.capHeight ?? defaults.cap,
        range: raw.info.distanceRange ?? defaults.range,
        atlas: atlasTexture(img, true),
        outline: outlineImg ? atlasTexture(outlineImg, true) : null,
        median,
        size,
    };
}

export type GlyphQuad = {
    /** Quad in screen px relative to the block origin (left, first cap top). */
    x: number;
    y: number;
    w: number;
    h: number;
    uv: [number, number, number, number];
    /** Reading order across the whole block (for the left → right reveal stagger). */
    index: number;
    line: number;
    char: RawChar;
};

export type Layout = { glyphs: GlyphQuad[]; width: number; height: number; scale: number };

/**
 * Lay out lines at a given cap height (screen px). Origin: left edge, top of the first line's caps.
 * `lineGap` is the line pitch in caps (1.41 measured on the chapter titles).
 */
export function layoutLines(font: MsdfFont, lines: string[], capPx: number, lineGap = 1.41, align: 'left' | 'center' = 'left'): Layout {
    const s = capPx / font.cap;
    const glyphs: GlyphQuad[] = [];
    let index = 0;
    let width = 0;
    const widths: number[] = [];
    lines.forEach((text, line) => {
        let pen = 0;
        const start = glyphs.length;
        for (const chr of text) {
            const ch = font.chars.get(chr.charCodeAt(0)) ?? font.chars.get(32);
            if (!ch) continue;
            if (ch.width > 0) {
                glyphs.push({
                    x: (pen + ch.xoffset) * s,
                    // block origin is the cap top of line 0: baseline sits at `cap` below it
                    y: line * lineGap * capPx + (ch.yoffset - (font.base - font.cap)) * s,
                    w: ch.width * s,
                    h: ch.height * s,
                    uv: [ch.x / font.size, ch.y / font.size, (ch.x + ch.width) / font.size, (ch.y + ch.height) / font.size],
                    index: index++,
                    line,
                    char: ch,
                });
            }
            pen += ch.xadvance;
        }
        // trailing gap is not ink: measure the line to the last glyph's ink edge
        const last = glyphs[glyphs.length - 1];
        const lw = glyphs.length > start && last ? last.x + last.w - (font.range / 2) * s : 0;
        widths.push(lw);
        width = Math.max(width, lw);
    });
    if (align === 'center') {
        for (const g of glyphs) g.x += (width - widths[g.line]) / 2;
    }
    return { glyphs, width, height: ((lines.length - 1) * lineGap + 1) * capPx, scale: s };
}

/**
 * Points on the glyph shapes (screen px, block space), roughly `spacing` px apart. `band` picks which
 * part of the shape: the default is the inside; a band around 128 (the MSDF edge) gives points on the
 * outlines. `keep` thins the grid at random. Deterministic, so a resize gives the same pattern.
 */
export function samplePoints(font: MsdfFont, layout: Layout, spacing: number, band: [number, number] = [150, 256], keep = 1) {
    const out: number[] = [];
    const glyphIndex: number[] = [];
    let seed = 1;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const step = spacing / layout.scale; // atlas px
    for (const g of layout.glyphs) {
        const ch = g.char;
        for (let ay = ch.y; ay < ch.y + ch.height; ay += step) {
            for (let ax = ch.x; ax < ch.x + ch.width; ax += step) {
                const jx = ax + (rnd() - 0.5) * step;
                const jy = ay + (rnd() - 0.5) * step;
                const v = font.median[Math.floor(jy) * font.size + Math.floor(jx)];
                if (v < band[0] || v >= band[1] || rnd() > keep) continue;
                out.push(g.x + (jx - ch.x) * layout.scale, g.y + (jy - ch.y) * layout.scale);
                glyphIndex.push(g.index);
            }
        }
    }
    return { points: new Float32Array(out), glyph: new Float32Array(glyphIndex) };
}
