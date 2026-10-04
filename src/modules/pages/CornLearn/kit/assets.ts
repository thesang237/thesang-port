import * as THREE from 'three';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { loadFont, type MsdfFont } from './source';

/**
 * Loaders for the demos, following the source's asset rules (engine/assets.ts): textures are the
 * decoded WebP files with the glTF UV convention (flipY = false), colour maps sRGB, data maps linear.
 * Each demo loads what it needs and disposes it when it unmounts.
 */
export const BASE = '/corn';

export function loadTex(file: string, opts: { data?: boolean; ext?: string; repeat?: boolean } = {}) {
    return new THREE.TextureLoader().loadAsync(`${BASE}/tex/${file}.${opts.ext ?? 'webp'}`).then((t) => {
        t.flipY = false;
        t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
        if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 4;
        return t;
    });
}

export function loadModel(file: string): Promise<GLTF> {
    return new GLTFLoader().loadAsync(`${BASE}/models/${file}.gltf`);
}

/** The headline face exactly as the engine loads it (atlas + rebuilt metrics + the outline path map). */
export function loadDisplayFont(): Promise<MsdfFont> {
    return loadFont(`${BASE}/fonts/manifold.json`, `${BASE}/fonts/manifold-msdf.png`, `${BASE}/tex/gradient-map.png`);
}

/** Free a loaded font's GPU textures. */
export function disposeFont(f: MsdfFont | null) {
    f?.atlas.dispose();
    f?.outline?.dispose();
}

/** Dispose every mesh geometry/material of a loaded glTF scene (textures are the demo's own). */
export function disposeGltf(g: GLTF | null) {
    g?.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
    });
}
