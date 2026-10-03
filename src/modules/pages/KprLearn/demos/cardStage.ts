import * as THREE from 'three';

import { fitPixelCamera, makeLoaders, makeShared, setView, STAGE_H } from '../kit/gl';
import { createNotchedMaterial, stageDistance } from '../kit/source';

/**
 * A small pixel stage with real notched cards, shared by the chapter 06–08 demos: perspective camera
 * (1 unit = 1 px on a 900 px tall stage), grain/flicker textures, a KTX2 loader for the page's own
 * card images, and helpers to pin a card's picture to the screen exactly like NotchedCard.apply().
 */
export function makeCardStage(renderer: THREE.WebGLRenderer, clear = '#ffffff') {
    renderer.setClearColor(clear, 1);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera();
    const shared = makeShared();
    const loaders = makeLoaders(renderer);
    const geo = new THREE.PlaneGeometry(1, 1, 24, 1);
    const mats: THREE.ShaderMaterial[] = [];
    const texes: THREE.Texture[] = [];
    let aspect = 16 / 10;
    const D = stageDistance(STAGE_H);

    const card = () => {
        const mat = createNotchedMaterial(shared);
        mats.push(mat);
        void shared.ready.then(() => {
            mat.uniforms.uNoise.value = shared.noise;
            mat.uniforms.uFlick.value = shared.flick;
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        scene.add(mesh);
        return mesh as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    };

    return {
        scene,
        cam,
        shared,
        card,
        get width() {
            return STAGE_H * aspect;
        },
        resize(w: number, h: number) {
            aspect = w / h;
            fitPixelCamera(cam, aspect);
        },
        /** call once per frame before rendering: the stage + buffer size every card's shader reads */
        sync() {
            setView(shared, renderer, STAGE_H * aspect, STAGE_H);
        },
        async ktx(url: string) {
            const t = await loaders.ktx(url);
            t.colorSpace = THREE.SRGBColorSpace;
            texes.push(t);
            return t;
        },
        track(t: THREE.Texture) {
            texes.push(t);
            return t;
        },
        /**
         * Teaching copy of NotchedCard.apply's picture rect: the card's upright rect on screen, projected at
         * its depth (or a fixed `frame`). Set w = 0 to glue the picture to the card instead.
         */
        pin(mat: THREE.ShaderMaterial, x: number, y: number, z: number, w: number, h: number, on = true) {
            const k = D / Math.max(1, D - z);
            if (on) mat.uniforms.uRect.value.set(x * k, y * k, Math.max(1, w * k), Math.max(1, h * k));
            else mat.uniforms.uRect.value.set(0, 0, 0, 0);
        },
        render() {
            renderer.render(scene, cam);
        },
        dispose() {
            geo.dispose();
            mats.forEach((m) => m.dispose());
            texes.forEach((t) => t.dispose());
            shared.dispose();
            loaders.dispose();
        },
    };
}

/** bind a picture to a card material's front (and back) slot */
export function setPicture(mat: THREE.ShaderMaterial, tex: THREE.Texture | null, aspect: number, both = true) {
    const u = mat.uniforms;
    u.uMapF.value = tex;
    u.uFace.value.x = tex ? 1 : 0;
    u.uFace.value.z = aspect;
    if (both) {
        u.uMapB.value = tex;
        u.uFace.value.y = tex ? 1 : 0;
        u.uFace.value.w = aspect;
    }
}
