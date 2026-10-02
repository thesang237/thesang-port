'use client';

import * as THREE from 'three';

/** Draws a word into a canvas texture (KEEPERS in the launch stack), tight to its glyph bounds. */
export function paintText(text: string, font: string, color: string, height: number, letterSpacingEm = 0): { tex: THREE.CanvasTexture; aspect: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${height}px ${font}`;
    const spacing = letterSpacingEm * height;
    const widths = [...text].map((c) => ctx.measureText(c).width);
    const w = Math.ceil(widths.reduce((a, b) => a + b + spacing, -spacing));
    const m = ctx.measureText(text);
    const asc = Math.ceil(m.actualBoundingBoxAscent);
    const desc = Math.ceil(m.actualBoundingBoxDescent);
    canvas.width = w + 8;
    canvas.height = asc + desc + 8;
    ctx.font = `${height}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    let x = 4;
    [...text].forEach((c, i) => {
        ctx.fillText(c, x, asc + 4);
        x += widths[i] + spacing;
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { tex, aspect: canvas.width / canvas.height };
}
