'use client';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

/** One KTX2 transcoder per renderer (the worker pool is expensive). Disposed with the stage. */
let ktx2: KTX2Loader | null = null;
let ktx2Renderer: THREE.WebGLRenderer | null = null;

export function getKtx2(renderer: THREE.WebGLRenderer) {
    if (ktx2 && ktx2Renderer === renderer) return ktx2;
    ktx2?.dispose();
    ktx2 = new KTX2Loader().setTranscoderPath('/kpr/basis/').detectSupport(renderer);
    ktx2Renderer = renderer;
    return ktx2;
}

export function disposeKtx2() {
    ktx2?.dispose();
    ktx2 = null;
    ktx2Renderer = null;
}

export function getGltfLoader(renderer: THREE.WebGLRenderer) {
    return new GLTFLoader().setKTX2Loader(getKtx2(renderer));
}

export function loadKtx2(renderer: THREE.WebGLRenderer, url: string) {
    return new Promise<THREE.CompressedTexture>((resolve, reject) => {
        getKtx2(renderer).load(url, (t) => resolve(t as THREE.CompressedTexture), undefined, reject);
    });
}

export function loadImageTexture(url: string) {
    return new Promise<THREE.Texture>((resolve, reject) => {
        new THREE.TextureLoader().load(
            url,
            (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                resolve(t);
            },
            undefined,
            reject,
        );
    });
}

/**
 * TexturePacker "array" JSON → normalised UV rects (y flipped for GL), in filename order.
 * `trim` = where the (trimmed) frame sits inside its source frame: x, y (from top-left), w, h, 0..1.
 */
export type AtlasFrame = { u: number; v: number; w: number; h: number; name: string; trim: [number, number, number, number] };
export type Atlas = { frames: AtlasFrame[]; size: { w: number; h: number } };

type TPRect = { x: number; y: number; w: number; h: number };
type TPFrame = { filename: string; frame: TPRect; spriteSourceSize?: TPRect; sourceSize?: { w: number; h: number } };
type TPJson = { frames: TPFrame[] | Record<string, TPFrame>; meta: { size: { w: number; h: number } } };

export async function loadAtlas(url: string): Promise<Atlas> {
    const json = (await fetch(url).then((r) => r.json())) as TPJson;
    const list = Array.isArray(json.frames) ? json.frames : Object.entries(json.frames).map(([filename, f]) => ({ ...f, filename }));
    list.sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0));
    const { w: W, h: H } = json.meta.size;
    return {
        size: { w: W, h: H },
        frames: list.map((f) => {
            const src = f.sourceSize ?? { w: f.frame.w, h: f.frame.h };
            const sss = f.spriteSourceSize ?? { x: 0, y: 0, w: f.frame.w, h: f.frame.h };
            return {
                name: f.filename,
                u: f.frame.x / W,
                v: 1 - (f.frame.y + f.frame.h) / H,
                w: f.frame.w / W,
                h: f.frame.h / H,
                trim: [sss.x / src.w, sss.y / src.h, sss.w / src.w, sss.h / src.h],
            };
        }),
    };
}

/** A regular grid atlas when the JSON is missing (e.g. beam-ship-0: 20 frames of 508×380 on 2048²). */
export function gridAtlas(cols: number, rows: number, cellW: number, cellH: number, size = 2048, pad = 1): Atlas {
    const frames: AtlasFrame[] = [];
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            const x = pad + c * (cellW + pad * 2);
            const y = pad + r * (cellH + pad * 2);
            frames.push({ name: `${r * cols + c}`, u: x / size, v: 1 - (y + cellH) / size, w: cellW / size, h: cellH / size, trim: [0, 0, 1, 1] });
        }
    return { size: { w: size, h: size }, frames };
}
