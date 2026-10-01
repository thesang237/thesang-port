import * as THREE from 'three';

/**
 * The source’s WebGLCanvas convention: an orthographic camera in CSS-pixel units, origin at the canvas
 * centre, +y up. A 1×1 plane scaled to (w, h) and placed at (x + w/2 − W/2, −(y + h/2 − H/2)) sits exactly
 * on top of a DOM box at (x, y, w, h).
 */
export function pixelCamera() {
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
    cam.position.z = 500;
    const resize = (w: number, h: number) => {
        cam.left = -w / 2;
        cam.right = w / 2;
        cam.top = h / 2;
        cam.bottom = -h / 2;
        cam.updateProjectionMatrix();
    };
    return { cam, resize };
}

/** Place a unit plane over a DOM rect given in canvas-relative pixels. */
export function placeOver(mesh: THREE.Object3D, x: number, y: number, w: number, h: number, W: number, H: number) {
    mesh.scale.set(w, h, 1);
    mesh.position.set(x + w / 2 - W / 2, -(y + h / 2 - H / 2), 0);
}

export function loadTexture(src: string, onLoad?: (t: THREE.Texture) => void) {
    const t = new THREE.TextureLoader().load(src, onLoad);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

/**
 * GLSL port of the menu photo mapping (MenuGL.tsx): object-fit cover + object-position + zoom about the
 * box centre, expressed as a uv scale and offset.
 */
export function coverUv(boxW: number, boxH: number, imgW: number, imgH: number, posX: number, posY: number, zoom: number) {
    const s = Math.max(boxW / imgW, boxH / imgH);
    const dw = imgW * s;
    const dh = imgH * s;
    const ox = (boxW - dw) * posX;
    const oy = (boxH - dh) * posY;
    return {
        scale: [boxW / (zoom * dw), boxH / (zoom * dh)] as [number, number],
        offset: [((boxW / 2) * (1 - 1 / zoom) - ox) / dw, ((boxH / 2) * (1 - 1 / zoom) - oy) / dh] as [number, number],
        dw,
        dh,
        ox,
        oy,
    };
}

export const COVER_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
