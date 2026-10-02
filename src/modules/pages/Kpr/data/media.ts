/**
 * Media manifest for /kpr. Everything here is a real file in public/kpr (copied from refs/KPR).
 *
 * Paintings are small 3D scenes (glTF): painted planes at different depths, and for the characters a
 * FaceBuilder head mesh with the painting projected onto it. A card shows a painting by rendering it
 * from its own camera into a texture; the pointer moves that camera, so every plane shifts by its own
 * depth (real parallax, the head even turns a little). Effect planes in the files carry no texture;
 * they play the flipbook named in `fx`.
 */

export type FlipbookRef = { sheets: string[]; fps: number };

/** TexturePacker sheets (KTX2 + JSON, both in /kpr/tex). */
export const FLIPBOOKS = {
    ship: { sheets: ['beam-ship-0', 'beam-ship-1', 'beam-ship-2'], fps: 24 },
    maleHair: { sheets: ['male-hair-0', 'male-hair-1'], fps: 20 },
    femaleHair: { sheets: ['female-hair-0', 'female-hair-1'], fps: 20 },
    femaleCloth: { sheets: ['female-cloth-0', 'female-cloth-1', 'female-cloth-2'], fps: 20 },
    kai: { sheets: ['kai-0', 'kai-1', 'kai-2', 'kai-3'], fps: 24 },
    beam: { sheets: ['beam-0', 'beam-1', 'beam-2', 'beam-3', 'beam-4'], fps: 24 },
    energyLeft: { sheets: ['energy-left-0', 'energy-left-1'], fps: 24 },
    energyRight: { sheets: ['energy-right-0', 'energy-right-1'], fps: 24 },
    magic: { sheets: ['magic-0'], fps: 24 },
    characterLight: { sheets: ['character-light-0', 'character-light-1', 'character-light-2'], fps: 30 },
    /** barcode wipe → keeper symbol (frames 0–92), then a zoomed symbol (93–100, unused) */
    logo: { sheets: ['logo-anim-low-res-0'], fps: 48 },
} satisfies Record<string, FlipbookRef>;

export type FlipbookId = keyof typeof FLIPBOOKS;

/** An effect plane inside a painting: `node` is the glTF node name (exact match). */
export type FxBind = { node: string; book: FlipbookId; additive?: boolean; tint?: string; tintAmount?: number; opacity?: number };

export type Painting = {
    glb: string;
    /** colour behind the planes (also the card colour while the scene loads) */
    clear: string;
    /** nodes hidden on purpose */
    hide?: string[];
    fx?: FxBind[];
    /** how far the inner camera orbits with the pointer (radians at the screen edge: yaw, pitch) … */
    orbit: [number, number];
    /** … around a pivot this far in front of it (scene units, ≈ the subject's distance) */
    pivot: number;
};

export const PAINTINGS = {
    /** hero girl: landing close-up → intro character card (front face of the hero card) */
    landing: { glb: '/kpr/glb/landing-2048.glb', clear: '#3d3478', orbit: [0.1, 0.065], pivot: 3 },
    /** the story painting (back face of the hero card), camera clip scrubbed by scroll */
    story: {
        glb: '/kpr/glb/project-2048.glb',
        clear: '#cf9a7a',
        orbit: [0.025, 0.015],
        pivot: 1.4,
        fx: [
            { node: 'male_hair_fx', book: 'maleHair', tint: '#3a3340', tintAmount: 0.85 },
            { node: 'female_hair_fx', book: 'femaleHair' },
            { node: 'female_cloth_fx', book: 'femaleCloth' },
        ],
    },
    /** 10K portrait (front face again after the second turn), sits on the gallery lavender */
    collection: { glb: '/kpr/glb/collection-2048.glb', clear: '#8b7ed9', orbit: [0.06, 0.04], pivot: 3 },
    keep: {
        glb: '/kpr/glb/tableaux-keep-2048.glb',
        clear: '#8fb3d9',
        // the girl stands very close to this camera (0.17 units): a small pivot and angle
        orbit: [0.012, 0.008],
        pivot: 0.45,
        fx: [
            { node: 'kai_fx', book: 'kai', additive: true },
            { node: 'ship_fx', book: 'ship' },
            { node: 'beams_fx', book: 'beam', additive: true },
        ],
    },
    factions: {
        glb: '/kpr/glb/tableaux-factions-2048.glb',
        clear: '#e9b49a',
        orbit: [0.03, 0.02],
        pivot: 1.3,
        fx: [
            { node: 'energy_left_fx', book: 'energyLeft' },
            { node: 'energy_right_fx', book: 'energyRight' },
        ],
    },
    world: {
        glb: '/kpr/glb/tableaux-universe-2048.glb',
        clear: '#2a1d24',
        orbit: [0.03, 0.02],
        pivot: 1.5,
        fx: [
            { node: 'magic_fx', book: 'magic', additive: true },
            { node: 'beams_fx', book: 'beam', additive: true },
        ],
    },
} satisfies Record<string, Painting>;

export type PaintingId = keyof typeof PAINTINGS;

/** Flat card images (KTX2, /kpr/tex). aspect = width / height. */
export const CARD_IMAGES = {
    /** intro trailer card: hero with the rainbow beam behind him */
    trailer: { file: 'front-face', aspect: 1, base: '#9aa0c8' },
    /** lavender mountains, the trailer card's back in the source files (unused: the card is single-sided here) */
    mountains: { file: 'back-face', aspect: 1, base: '#8f88c4' },
    keepTower: { file: 'card-keep', aspect: 744 / 1480, base: '#9db6cf' },
    eyes: { file: 'card-factions', aspect: 1216 / 688, base: '#d9a99a' },
    crater: { file: 'card-universe', aspect: 1560 / 1464, base: '#c99aa8' },
} as const;

export type CardImageId = keyof typeof CARD_IMAGES;

/** generated gallery portraits in public/kpr/img/collections (card-gen-01 … ) */
const GENERATED_CARDS = 14;
const interleave = (a: string[], b: string[]) =>
    Array.from({ length: Math.max(a.length, b.length) }, (_, i) => [a[i], b[i]])
        .flat()
        .filter(Boolean);

/** Real images and media from refs/KPR, copied into public/kpr. */
export const IMAGES = {
    trailerSide: '/kpr/img/trailer-side-media.webp',
    faceTraits: '/kpr/img/collections/face-traits.webp',
    noise: '/kpr/img/extras/noise.webp',
    flick: '/kpr/img/extras/flick.webp',
    headerSprite: '/kpr/img/extras/header-sprite.webp',
    // the 12 reference portraits interleaved with 14 originals generated for this study (prompts in
    // .clone-analysis/kpr/gen/prompts.tsv), cut with the reference cards' notch masks
    gallery: interleave(
        [...[1, 2, 3, 4, 5, 6].map((i) => `/kpr/img/collections/card-left-0${i}.webp`), ...[1, 2, 3, 4, 5, 6].map((i) => `/kpr/img/collections/card-right-0${i}.webp`)],
        Array.from({ length: GENERATED_CARDS }, (_, i) => `/kpr/img/collections/card-gen-${String(i + 1).padStart(2, '0')}.webp`),
    ),
};

export const VIDEOS = {
    crystal: { webm: '/kpr/video/crystal.webm', hevc: '/kpr/video/crystal-hevc.mp4' },
    topo: { webm: '/kpr/video/topo.webm', hevc: '/kpr/video/topo-hevc.mp4' },
    /** missing: the trailer itself (the play button opens a placeholder panel) */
    trailer: null as string | null,
};

export const SOUND = { press: '/kpr/audio/press-sheen.mp3' };

/** Gallery ring: one card per image; repeats get a slight tint if the ring ever needs more than exist. */
export const GALLERY_RING = { count: 26, tints: ['#ffffff', '#efe9ff', '#fff1f6', '#eefcff'] };
