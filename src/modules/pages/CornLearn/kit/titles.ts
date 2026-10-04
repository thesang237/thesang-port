import type * as THREE from 'three';

import { FACE, type MsdfFont, TitleText, type Trail } from './source';

/**
 * TitleText keeps its uniforms private (the engine never needs them). A few demos turn its dials
 * (stagger, field radii) at run time; this reads the same object without changing the class.
 */
export function titleUniforms(t: TitleText) {
    return (t as unknown as { uniforms: Record<string, THREE.IUniform> }).uniforms;
}

/**
 * Engine.measureTitles, for a stage instead of the window: read the transparent DOM heading (font-size
 * = cap / 0.7, line-height = 1.41 cap), rebuild the title at that cap height and place it so its cap
 * top sits 0.169 cap below the heading's line top. Coordinates are relative to `host`.
 */
export function placeOnAnchor(title: TitleText, anchor: HTMLElement, host: HTMLElement, dpr: number) {
    const fontPx = parseFloat(getComputedStyle(anchor).fontSize) || 16;
    const cap = fontPx * FACE.capPerEm;
    title.build(cap, dpr);
    const r = anchor.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    title.setOrigin(r.left - h.left, r.top - h.top + FACE.capTop * cap);
    return cap;
}

export function makeTitle(font: MsdfFont, lines: string[], trail: Trail, align: 'left' | 'center' = 'left') {
    return new TitleText(font, { lines, capPx: 68, align }, trail);
}
