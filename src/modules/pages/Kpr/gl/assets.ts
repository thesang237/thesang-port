'use client';

import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { CARD_IMAGES, type CardImageId, type FlipbookId, FLIPBOOKS, IMAGES, type PaintingId, PAINTINGS } from '../data/media';

import { getGltfLoader, loadAtlas, loadImageTexture, loadKtx2 } from './loaders';

export type FlipFrame = { sheet: number; rect: THREE.Vector4; trim: THREE.Vector4 };
export type Flipbook = { textures: THREE.Texture[]; frames: FlipFrame[]; fps: number };

export type Assets = {
    noise: THREE.Texture;
    flick: THREE.Texture;
    trailerSide: THREE.Texture;
    gallery: THREE.Texture[];
    cards: Record<CardImageId, THREE.Texture>;
    paintings: Record<PaintingId, GLTF>;
    books: Record<FlipbookId, Flipbook>;
    /** the opening's barcode (header-sprite.webp + JSON, 131 frames) */
    header: Flipbook;
    dispose: () => void;
};

/** Loads everything the film needs and reports real progress (0..1), weighted by rough size. */
export async function loadAssets(renderer: THREE.WebGLRenderer, onProgress: (p: number) => void, signal: { cancelled: boolean }): Promise<Assets> {
    const disposables: { dispose: () => void }[] = [];
    let done = 0;
    let total = 0;
    const track = <T>(p: Promise<T>, weight = 1): Promise<T> => {
        total += weight;
        return p.then((v) => {
            done += weight;
            if (!signal.cancelled) onProgress(done / total);
            return v;
        });
    };
    const keep = <T extends { dispose: () => void }>(v: T) => {
        disposables.push(v);
        return v;
    };

    const ktxCache = new Map<string, Promise<THREE.CompressedTexture>>();
    const ktx = (name: string, weight = 2) => {
        if (!ktxCache.has(name)) ktxCache.set(name, track(loadKtx2(renderer, `/kpr/tex/${name}.ktx2`).then(keep), weight));
        return ktxCache.get(name)!;
    };

    const flipbook = async (id: FlipbookId): Promise<Flipbook> => {
        const ref = FLIPBOOKS[id];
        const [textures, atlases] = await Promise.all([Promise.all(ref.sheets.map((s) => ktx(s))), Promise.all(ref.sheets.map((s) => track(loadAtlas(`/kpr/tex/${s}.json`))))]);
        const frames: FlipFrame[] = [];
        atlases.forEach((atlas, sheet) => atlas.frames.forEach((f) => frames.push({ sheet, rect: new THREE.Vector4(f.u, f.v, f.w, f.h), trim: new THREE.Vector4(...f.trim) })));
        return { textures, frames, fps: ref.fps };
    };

    const image = (url: string) => track(loadImageTexture(url).then(keep));
    const gltf = getGltfLoader(renderer);

    const paintingIds = Object.keys(PAINTINGS) as PaintingId[];
    const bookIds = Object.keys(FLIPBOOKS) as FlipbookId[];
    const cardIds = Object.keys(CARD_IMAGES) as CardImageId[];

    const header = (async (): Promise<Flipbook> => {
        const [tex, atlas] = await Promise.all([image(IMAGES.headerSprite), track(loadAtlas('/kpr/tex/header-sprite.json'))]);
        return { textures: [tex], frames: atlas.frames.map((f) => ({ sheet: 0, rect: new THREE.Vector4(f.u, f.v, f.w, f.h), trim: new THREE.Vector4(...f.trim) })), fps: 56 };
    })();

    const [noise, flick, trailerSide, gallery, cards, paintings, books, headerBook] = await Promise.all([
        image(IMAGES.noise),
        image(IMAGES.flick),
        image(IMAGES.trailerSide),
        Promise.all(IMAGES.gallery.map(image)),
        Promise.all(cardIds.map((id): Promise<THREE.Texture> => ktx(CARD_IMAGES[id].file, 3))),
        Promise.all(paintingIds.map((id) => track(gltf.loadAsync(PAINTINGS[id].glb), 12))),
        Promise.all(bookIds.map(flipbook)),
        header,
    ]);
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    noise.colorSpace = THREE.NoColorSpace;
    noise.needsUpdate = true;
    flick.wrapS = THREE.RepeatWrapping;
    flick.colorSpace = THREE.NoColorSpace;
    flick.needsUpdate = true;
    cards.forEach((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
    });

    // upload everything now so the first scroll never hitches on texture upload
    disposables.forEach((d) => d instanceof THREE.Texture && renderer.initTexture(d));

    onProgress(1);
    return {
        noise,
        flick,
        trailerSide,
        gallery,
        cards: Object.fromEntries(cardIds.map((id, i) => [id, cards[i]])) as Record<CardImageId, THREE.Texture>,
        paintings: Object.fromEntries(paintingIds.map((id, i) => [id, paintings[i]])) as Record<PaintingId, GLTF>,
        books: Object.fromEntries(bookIds.map((id, i) => [id, books[i]])) as Record<FlipbookId, Flipbook>,
        header: headerBook,
        dispose: () => {
            disposables.forEach((d) => d.dispose());
            paintings.forEach((glb) =>
                glb.scene.traverse((o) => {
                    const m = o as THREE.Mesh;
                    if (!m.isMesh) return;
                    m.geometry.dispose();
                    const mats = Array.isArray(m.material) ? m.material : [m.material];
                    mats.forEach((mat) => {
                        Object.values(mat).forEach((v) => v instanceof THREE.Texture && v.dispose());
                        mat.dispose();
                    });
                }),
            );
        },
    };
}
