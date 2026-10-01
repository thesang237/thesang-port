import { ease } from '../kit/math';

/**
 * The Igloo master timeline, transcribed from IglooPage.tsx (lines 52–91)
 * as data so it can be drawn and scrubbed. Units: 1 = one screen of scroll.
 */
export type Seg = { at: number; dur: number; from: number; to: number; ease: string };
export type Track = { key: string; label: string; kind: 'dial' | 'dom'; world?: number; what: string; initial: number; segs: Seg[] };

const io = 'power1.inOut';

export const IGLOO_TRACKS: Track[] = [
    {
        key: 'scene',
        label: 'scene',
        kind: 'dial',
        what: 'Which world is on screen. 1.4 = 60% crystals + 40% rings. Drives the compositor blend.',
        initial: 0,
        segs: [
            { at: 1.3, dur: 1, from: 0, to: 1, ease: io },
            { at: 7.2, dur: 1, from: 1, to: 2, ease: io },
            { at: 10.8, dur: 1, from: 2, to: 3, ease: io },
            { at: 14.0, dur: 1, from: 3, to: 4, ease: io },
        ],
    },
    {
        key: 'hero',
        label: '.ig-hero (text)',
        kind: 'dom',
        world: 0,
        what: 'Hero copy: fades, drifts up 30px and blurs out; comes back for the loop.',
        initial: 1,
        segs: [
            { at: 0.15, dur: 0.7, from: 1, to: 0, ease: 'power1.in' },
            { at: 15.2, dur: 0.6, from: 0, to: 1, ease: 'power1.out' },
        ],
    },
    {
        key: 'heroCam',
        label: 'heroCam',
        kind: 'dial',
        world: 0,
        what: 'Igloo camera rises from eye level to above the dome.',
        initial: 0,
        segs: [
            { at: 0.2, dur: 1.7, from: 0, to: 1, ease: io },
            { at: 14.2, dur: 1.5, from: 1, to: 0, ease: io },
        ],
    },
    {
        key: 'explode',
        label: 'explode',
        kind: 'dial',
        world: 0,
        what: 'Bricks fly apart top-first (each brick has its own delay window).',
        initial: 0,
        segs: [
            { at: 0.3, dur: 1.5, from: 0, to: 1, ease: 'none' },
            { at: 14.2, dur: 1.4, from: 1, to: 0, ease: 'none' },
        ],
    },
    {
        key: 'crystals',
        label: 'crystals',
        kind: 'dial',
        world: 1,
        what: 'Carousel position = index of the centred crystal (-0.8 → 3.8). Snaps with power3.inOut.',
        initial: -0.8,
        segs: [
            { at: 1.6, dur: 0.7, from: -0.8, to: 0, ease: 'power2.out' },
            { at: 2.4, dur: 1.45, from: 0, to: 1, ease: 'power3.inOut' },
            { at: 3.95, dur: 1.45, from: 1, to: 2, ease: 'power3.inOut' },
            { at: 5.5, dur: 1.45, from: 2, to: 3, ease: 'power3.inOut' },
            { at: 7.0, dur: 0.6, from: 3, to: 3.8, ease: 'power2.in' },
        ],
    },
    {
        key: 'ghosts',
        label: '.ig-ghosts (text)',
        kind: 'dom',
        world: 1,
        what: 'Blurred background glyphs fade in and drift up through the fog.',
        initial: 0,
        segs: [
            { at: 1.8, dur: 0.8, from: 0, to: 0.5, ease: 'none' },
            { at: 7.2, dur: 0.5, from: 0.5, to: 0, ease: 'none' },
        ],
    },
    { key: 'rings', label: 'rings', kind: 'dial', world: 2, what: 'Ring segments fly in from debris and settle face-on.', initial: 0, segs: [{ at: 7.4, dur: 2.6, from: 0, to: 1, ease: 'none' }] },
    {
        key: 'dive',
        label: 'dive',
        kind: 'dial',
        world: 2,
        what: 'Camera dives through the portal; field of view widens to 100°.',
        initial: 0,
        segs: [{ at: 9.8, dur: 1.6, from: 0, to: 1, ease: 'none' }],
    },
    {
        key: 'colonyCam',
        label: 'colonyCam',
        kind: 'dial',
        world: 3,
        what: 'Camera settles from overhead to eye level on the pedestal.',
        initial: 0,
        segs: [{ at: 10.9, dur: 1.8, from: 0, to: 1, ease: 'none' }],
    },
    {
        key: 'form',
        label: 'form',
        kind: 'dial',
        world: 3,
        what: 'Particle cloud gathers into the figure (per-particle staggered).',
        initial: 0,
        segs: [{ at: 11.0, dur: 1.6, from: 0, to: 1, ease: 'none' }],
    },
    {
        key: 'colony',
        label: '.ig-colony (UI)',
        kind: 'dom',
        world: 3,
        what: 'Social carousel UI fades in, then out before the loop.',
        initial: 0,
        segs: [
            { at: 12.3, dur: 0.4, from: 0, to: 1, ease: 'none' },
            { at: 13.9, dur: 0.4, from: 1, to: 0, ease: 'none' },
        ],
    },
];

export const IGLOO_TOTAL = 16;

export const ACTS = [
    {
        n: 0,
        name: 'Igloo',
        from: 0,
        to: 1.8,
        color: '#94dbff',
        see: 'An igloo in a snowy valley. Hover lifts bricks and leaks light. Scroll: it cracks open and the camera rises into the glow.',
        file: 'canvas/IglooWorld.tsx',
    },
    { n: 1, name: 'Portfolio', from: 1.8, to: 7.5, color: '#d4c2ff', see: 'Ice crystals float up one by one. A HUD sticks to each; click opens a detail overlay.', file: 'canvas/CrystalWorld.tsx' },
    { n: 2, name: 'Portal', from: 7.5, to: 11.2, color: '#aef0d8', see: 'Chunky ring segments assemble around a glowing core, then the camera dives through.', file: 'canvas/RingsWorld.tsx' },
    {
        n: 3,
        name: 'Colony',
        from: 11.2,
        to: 14.6,
        color: '#ffd08a',
        see: '65k particles gather into a figure you can sweep, spin and shock. Arrows morph it between logos.',
        file: 'canvas/ParticleWorld.tsx',
    },
    { n: 4, name: 'Loop', from: 14.6, to: 16, color: '#94dbff', see: 'Debris flies back together into the igloo; infinite scroll wraps to the top.', file: 'IglooPage.tsx' },
] as const;

/** Value of a track at timeline time t — exactly what GSAP's scrubbed timeline computes. */
export function trackValue(track: Track, t: number) {
    let v = track.initial;
    for (const s of track.segs) {
        if (t < s.at) break;
        const p = Math.min(1, (t - s.at) / s.dur);
        v = s.from + (s.to - s.from) * ease(s.ease)(p);
    }
    return v;
}

/** How visible each world is for a given `scene` value (store.ts → worldWeight). */
export function worldWeights(scene: number) {
    const s = ((scene % 4) + 4) % 4;
    const a = Math.floor(s);
    const f = s - a;
    return [0, 1, 2, 3].map((i) => (i === a ? 1 - f : i === (a + 1) % 4 ? f : 0));
}

export const WORLD_NAMES = ['Igloo', 'Crystals', 'Rings', 'Colony'];
export const WORLD_COLORS = ['#94dbff', '#d4c2ff', '#aef0d8', '#ffd08a'];
