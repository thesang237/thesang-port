'use client';

/**
 * DOM drives the GL layout: elements marked `data-gl-anchor="name"` are measured once (and on
 * resize / font load), converted to stage coordinates (origin at the viewport centre, y up, 1 unit =
 * 1 CSS px) and read by the choreography every frame. Never measured inside the frame loop.
 */
export type Rect = { x: number; y: number; w: number; h: number };

export const anchors: Record<string, Rect> = {};

export function measureAnchors(root: ParentNode, vw: number, vh: number) {
    root.querySelectorAll<HTMLElement>('[data-gl-anchor]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        anchors[el.dataset.glAnchor!] = { x: r.left + r.width / 2 - vw / 2, y: vh / 2 - (r.top + r.height / 2), w: r.width, h: r.height };
    });
}

export function clearAnchors() {
    Object.keys(anchors).forEach((k) => delete anchors[k]);
}

/** anchor or a fallback built from viewport fractions (left, top, width, height) */
export function anchor(name: string, vw: number, vh: number, fb: [number, number, number, number]): Rect {
    const a = anchors[name];
    if (a) return a;
    const [l, t, w, h] = fb;
    return { x: (l + w / 2 - 0.5) * vw, y: (0.5 - t - h / 2) * vh, w: w * vw, h: h * vh };
}
