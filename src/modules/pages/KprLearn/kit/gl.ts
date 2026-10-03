import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

import { IMAGES, stageDistance } from './source';

/**
 * Demos film a "virtual stage" the height of a laptop screen (900 px), whatever the canvas size, so a
 * card's radius, notch and perspective look exactly as they do on the real page.
 */
export const STAGE_H = 900;

/**
 * Teaching copy of Stage.tsx `fitPixelCamera`: a perspective camera placed so that 1 world unit = 1 CSS
 * pixel at z = 0 (origin at the centre, y up). The distance is the source's own `stageDistance`.
 */
export function fitPixelCamera(cam: THREE.PerspectiveCamera, aspect: number, h = STAGE_H, distance = stageDistance(h)) {
    cam.position.set(0, 0, distance);
    cam.near = 10;
    cam.far = distance * 4;
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / 2 / distance));
    cam.aspect = aspect;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
}

/**
 * One KTX2 transcoder per demo (the source keeps one per renderer; demos each have their own renderer,
 * so sharing the source's singleton would let one demo shut down another's loads).
 */
export function makeLoaders(renderer: THREE.WebGLRenderer) {
    const ktx2 = new KTX2Loader().setTranscoderPath('/kpr/basis/').detectSupport(renderer);
    const gltf = new GLTFLoader().setKTX2Loader(ktx2);
    return {
        gltf,
        ktx(url: string) {
            return new Promise<THREE.CompressedTexture>((resolve, reject) => ktx2.load(url, (t) => resolve(t as THREE.CompressedTexture), undefined, reject));
        },
        dispose() {
            ktx2.dispose();
        },
    };
}

export function loadTex(url: string, srgb = true) {
    return new Promise<THREE.Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(
            url,
            (t) => {
                if (srgb) t.colorSpace = THREE.SRGBColorSpace;
                resolve(t);
            },
            undefined,
            reject,
        );
    });
}

/**
 * The uniforms every card shares (grain + flicker textures, stage size), set up as Stage.tsx does.
 * `view` = stage size (css px) and drawing buffer size (device px): only used when a card pins its
 * picture to the screen (`uRect`).
 */
export function makeShared() {
    const shared = {
        noise: null as THREE.Texture | null,
        flick: null as THREE.Texture | null,
        view: { value: new THREE.Vector4(1, 1, 1, 1) },
        ready: Promise.resolve(),
        dispose() {
            shared.noise?.dispose();
            shared.flick?.dispose();
        },
    };
    shared.ready = Promise.all([loadTex(IMAGES.noise, false), loadTex(IMAGES.flick, false)]).then(([noise, flick]) => {
        noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
        flick.wrapS = THREE.RepeatWrapping;
        shared.noise = noise;
        shared.flick = flick;
    });
    return shared;
}

/** Plug the shared grain/flicker textures into a card material once they have loaded. */
export function bindSharedTextures(mat: THREE.ShaderMaterial, shared: { noise: THREE.Texture | null; flick: THREE.Texture | null }) {
    mat.uniforms.uNoise.value = shared.noise;
    mat.uniforms.uFlick.value = shared.flick;
}

/** A big numbered placeholder picture (for demos about faces and turning). */
export function labelTexture(label: string, sub: string, bg: string, fg = '#ffffff', size = 512) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d')!;
    g.fillStyle = bg;
    g.fillRect(0, 0, size, size);
    // a hairline grid so you can see the picture stay still or move
    g.strokeStyle = 'rgba(255,255,255,0.22)';
    g.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
        g.beginPath();
        g.moveTo((i * size) / 8, 0);
        g.lineTo((i * size) / 8, size);
        g.moveTo(0, (i * size) / 8);
        g.lineTo(size, (i * size) / 8);
        g.stroke();
    }
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${size * 0.42}px "Helvetica Neue", Arial, sans-serif`;
    g.fillText(label, size / 2, size * 0.46);
    g.font = `500 ${size * 0.06}px ui-monospace, monospace`;
    g.fillText(sub.toUpperCase(), size / 2, size * 0.8);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

/** Stage px → device px helper for the `uView` uniform. */
const buffer = new THREE.Vector2();
export function setView(shared: { view: { value: THREE.Vector4 } }, renderer: THREE.WebGLRenderer, stageW: number, stageH: number) {
    const b = renderer.getDrawingBufferSize(buffer);
    shared.view.value.set(stageW, stageH, b.x, b.y);
}
