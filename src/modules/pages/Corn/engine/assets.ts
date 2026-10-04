import * as THREE from 'three';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { loadFont, type MsdfFont } from './text/msdf';

/**
 * Everything the page needs, loaded once behind the loader. Textures are the reference's ASTC KTX
 * files decoded to WebP (`.clone-analysis/corn/tools/ktx_decode.py`): they keep the glTF UV
 * convention, so `flipY = false`. Table of what each file is: NOTES.md "Assets".
 */
const BASE = '/corn';

const TEXTURES = {
    // hero: cob + husk atlas lit from four directions (pointer blends them), its alpha, the silk
    cobTL: 'TOP_L',
    cobTR: 'TOP_R',
    cobBL: 'BOTTOM_L',
    cobBR: 'BOTTOM_R',
    cobAlpha: 'alpha',
    silkTL: 'HAIR_TOP_L_',
    silkTR: 'HAIR_TOP_R_',
    silkBL: 'HAIR_BOTTOM_L_',
    silkBR: 'HAIR_BOTTOM_R_',
    silkAlpha: 'alpha_(1)',
    bgCorn: 'bg_corn',
    // science: pot, seedling, falling kernels
    pot: 'diffuse_pot',
    bgPot: 'bg_pot_diffuse',
    kernel: 'map_diffuse_kernel',
    kernelBump: 'map_bump_kernel',
    matcapMult: 'map_matcap_mult',
    matcapScreen: 'map_matcap_screen',
    // stalk world: the field simulator (reference "testing" scene)
    stalk: 'stalk_diffuse_flat',
    stalkShadow: 'stalk_diffuse_shadow',
    stalkScreen: 'stalk-screen',
    stalkEnergy: 'stalk_energy',
    stalkBg: 'bg',
    fieldPlant: 'SingleStalk_DifF_0007',
    fieldPlantReveal: 'SingleStalk_DifF_0007_reveal',
    fieldPlantDead: 'SingleStalk_DifF_0007_DEAD',
    soil: 'soil_default',
    soilClay: 'soil_nutrients_clay',
    soilLoam: 'soil_nutrients_loam',
    soilSand: 'soil_nutrients_sand',
    revealMap: 'revealMap',
    plantShadow: 'plantShadow',
    rain: 'rainTexture',
    // plots world
    field: 'map-field-diffuse',
    ground: 'map-ground-diffuse',
    clouds: 'map-cloud-noise',
    // kernel world
    horizon: 'map_bg',
    flare: 'lens-flare',
} as const;

const DATA_TEXTURES = new Set(['cobAlpha', 'silkAlpha', 'kernelBump', 'clouds', 'fieldPlantReveal', 'revealMap', 'plantShadow', 'rain', 'stalkEnergy']);

const MODELS = {
    cob: 'cobb_test',
    silk: 'hair',
    pot: 'pot3',
    bgPot: 'bg_pot',
    kernel: 'KERNAL',
    stalk: 'stalk_rigged3',
    fieldPlant: 'SingleStalk12_db',
} as const;

export type TexKey = keyof typeof TEXTURES;
export type ModelKey = keyof typeof MODELS;

export type Assets = {
    tex: Record<TexKey, THREE.Texture>;
    models: Record<ModelKey, GLTF>;
    lut: THREE.Texture;
    noise: THREE.Texture;
    display: MsdfFont;
    body: MsdfFont;
};

export async function loadAssets(renderer: THREE.WebGLRenderer, onProgress: (p: number) => void): Promise<Assets> {
    const texLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    let done = 0;
    const total = Object.keys(TEXTURES).length + Object.keys(MODELS).length + 4;
    const tick = <T>(v: T) => {
        onProgress(++done / total);
        return v;
    };

    const tex = (file: string, data = false, ext = 'webp') =>
        texLoader.loadAsync(`${BASE}/tex/${file}.${ext}`).then((t) => {
            t.flipY = false;
            t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
            t.anisotropy = maxAniso;
            return tick(t);
        });

    const texEntries = Promise.all(Object.entries(TEXTURES).map(([k, f]) => tex(f, DATA_TEXTURES.has(k)).then((t) => [k, t] as const)));
    const modelEntries = Promise.all(Object.entries(MODELS).map(([k, f]) => gltfLoader.loadAsync(`${BASE}/models/${f}.gltf`).then((g) => [k, tick(g)] as const)));
    const [texList, modelList, lut, noise, display, body] = await Promise.all([
        texEntries,
        modelEntries,
        texLoader.loadAsync(`${BASE}/tex/map-grade.png`).then((t) => {
            t.flipY = false;
            t.minFilter = t.magFilter = THREE.LinearFilter;
            t.generateMipmaps = false;
            return tick(t);
        }),
        texLoader.loadAsync(`${BASE}/tex/post-noise.png`).then((t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            return tick(t);
        }),
        loadFont(`${BASE}/fonts/manifold.json`, `${BASE}/fonts/manifold-msdf.png`, `${BASE}/tex/gradient-map.png`).then(tick),
        loadFont(`${BASE}/fonts/gilroy.json`, `${BASE}/fonts/gilroy-msdf.png`).then(tick),
    ]);

    const all: Assets = {
        tex: Object.fromEntries(texList) as Record<TexKey, THREE.Texture>,
        models: Object.fromEntries(modelList) as Record<ModelKey, GLTF>,
        lut,
        noise,
        display,
        body,
    };
    // upload now, so the first frame of each world does not stall
    Object.values(all.tex).forEach((t) => renderer.initTexture(t));
    return all;
}

export function disposeAssets(a: Assets) {
    Object.values(a.tex).forEach((t) => t.dispose());
    Object.values(a.models).forEach((g) =>
        g.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            m.geometry.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
        }),
    );
    [a.lut, a.noise, a.display.atlas, a.display.outline, a.body.atlas].forEach((t) => t?.dispose());
}
