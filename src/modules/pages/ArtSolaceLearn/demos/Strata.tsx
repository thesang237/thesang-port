'use client';

import { useEffect, useRef, useState } from 'react';

import { Btn, Demo, Group, Segmented, Slider } from '../kit/controls';
import { rgb, useFragment } from '../kit/gl';
import { GRAIN, HASH, NOISE } from '../kit/glsl';
import { prefersReducedMotion, useParams } from '../kit/loop';
import { PALETTE_NAMES, paletteByName } from '../kit/source';

/** Domain-warped noise, sliced into bands; each band is given one of Solace's zones and stippled. */
export const STRATA_FRAG = /* glsl */ `
${HASH}
${NOISE}
${GRAIN}
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uScale;     // how much land fits in the frame
uniform float uWarp;      // domain-warp strength (0 = plain fBm)
uniform int uOctaves;
uniform float uBands;     // strata per unit of height
uniform float uTilt;      // layers stacked like sediment (height grows downward)
uniform float uLine;      // contour line width, as a fraction of a band
uniform float uFace;      // how much each band shades from dark to light across itself
uniform vec2 uShare;      // share of bands that are core (x) and slope (y); the rest are sky
uniform vec3 uDensity;    // core, slope, sky chances (the art's 1, 0.1, ~0.8)
uniform float uDrift;     // slow motion of the warp
uniform float uSeedOff;   // a different landscape

// noise of noise of noise (Inigo Quilez's domain warping)
float height(vec2 p, float t) {
    p += uSeedOff;
    vec2 q = vec2(fbm(p, uOctaves), fbm(p + vec2(5.2, 1.3), uOctaves));
    vec2 r = vec2(fbm(p + uWarp * q + vec2(1.7, 9.2) + 0.15 * t, uOctaves), fbm(p + uWarp * q + vec2(8.3, 2.8) - 0.126 * t, uOctaves));
    return fbm(p + uWarp * r, uOctaves);
}

void main() {
    vec2 c = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y);
    float h = height(c * uScale, uTime * uDrift) + uTilt * c.y;

    float b = h * uBands;
    float band = floor(b);         // which layer
    float f = fract(b);            // where inside it (0 → 1)

    // every band rolls its own zone, like the art rolls each dune: a hash of its number
    float roll = hash12(vec2(band, 7.31));
    int zone = roll < uShare.x ? 0 : roll < uShare.x + uShare.y ? 1 : 2;
    float density = zone == 0 ? uDensity.x : zone == 1 ? uDensity.y : uDensity.z;

    density *= mix(1.0, 0.35 + 0.65 * f, uFace);   // each band fades across itself: a lit face
    if (f < uLine) density = 1.0;                  // contour line: the band's edge, solid
    fragColor = vec4(mix(uPaper, uInk, inkAt(c, density)), 1.0);
}
`;

const DEFAULTS = {
    scale: 1.4,
    warp: 2.2,
    octaves: 4,
    bands: 6,
    tilt: 2.4,
    line: 0.05,
    face: 0.85,
    core: 0.25,
    slope: 0.45,
    sky: 0.35,
    drift: 0.04,
    seed: 0,
    grain: 1.2,
};

export default function Strata() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);
    const [palette, setPalette] = useState('Mars');
    const [playing, setPlaying] = useState(() => !prefersReducedMotion());
    const live = useRef({ p, palette });

    const { invalidate } = useFragment(
        host,
        STRATA_FRAG,
        (f) => {
            const { p: d, palette: name } = live.current;
            const pal = paletteByName(name);
            f.set('uPaper', rgb(pal.paper));
            f.set('uInk', rgb(pal.ink));
            f.set('uScale', d.scale);
            f.set('uWarp', d.warp);
            f.setInt('uOctaves', d.octaves);
            f.set('uBands', d.bands);
            f.set('uTilt', d.tilt);
            f.set('uLine', d.line);
            f.set('uFace', d.face);
            f.set('uShare', [d.core, d.slope]);
            f.set('uDensity', [1, 0.1, d.sky]);
            f.set('uDrift', d.drift);
            f.set('uSeedOff', d.seed * 17.3);
            f.set('uDotSize', 0.0012 * d.grain);
            f.set('uTries', 0.576 * 1.4);
            f.set('uInkAlpha', 0.5);
            f.set('uGrainSeed', 3);
        },
        { animate: playing, maxDpr: 1.5 },
    );
    useEffect(() => {
        live.current = { p, palette };
        invalidate();
    }, [p, palette, invalidate]);

    return (
        <Demo
            title="Strata"
            hint="One smooth height field, sliced into bands. Each band rolls a zone (core, slope or sky) and is stippled with Solace’s brush."
            onReset={() => {
                reset();
                setPalette('Mars');
            }}
            controls={
                <>
                    <div className="flex flex-wrap gap-2">
                        <Btn primary onClick={() => setPlaying((v) => !v)}>
                            {playing ? 'Pause ❚❚' : 'Drift ▶'}
                        </Btn>
                        <Btn onClick={() => set('seed', p.seed + 1)}>New land ↻</Btn>
                    </div>
                    <Group title="The land (domain warping)">
                        <Slider label="scale" value={p.scale} min={0.5} max={8} onChange={(v) => set('scale', v)} help="How much land fits in the frame." />
                        <Slider label="warp" value={p.warp} min={0} max={8} step={0.05} onChange={(v) => set('warp', v)} help="0 = plain noise. Up = folded, marbled rock." />
                        <Slider label="octaves" value={p.octaves} min={1} max={8} step={1} onChange={(v) => set('octaves', v)} help="Detail layers in every noise call." />
                        <Slider label="tilt" value={p.tilt} min={0} max={4} onChange={(v) => set('tilt', v)} help="Adds height toward the bottom: layers stack like sediment." />
                        <Slider label="drift" value={p.drift} min={0} max={0.5} step={0.005} onChange={(v) => set('drift', v)} help="How fast the warp moves while playing." />
                    </Group>
                    <Group title="Slicing (floor / fract)">
                        <Slider label="bands" value={p.bands} min={1} max={40} step={1} onChange={(v) => set('bands', v)} help="Strata per unit of height." />
                        <Slider label="contour line" value={p.line} min={0} max={0.3} step={0.005} onChange={(v) => set('line', v)} help="Solid line at each band’s edge (share of the band)." />
                        <Slider label="lit face" value={p.face} min={0} max={1} onChange={(v) => set('face', v)} help="Each band fades from dark to light across itself." />
                    </Group>
                    <Group title="Zones (the art’s brush)">
                        <Slider label="core bands" value={p.core} min={0} max={1} onChange={(v) => set('core', Math.min(v, 1 - p.slope))} help="Share of bands drawn as dark cores (chance 1)." />
                        <Slider label="slope bands" value={p.slope} min={0} max={1} onChange={(v) => set('slope', Math.min(v, 1 - p.core))} help="Share drawn as lit slopes (chance 0.1)." />
                        <Slider label="sky chance" value={p.sky} min={0} max={1} onChange={(v) => set('sky', v)} help="Chance for the remaining bands." />
                        <Slider label="grain size ×" value={p.grain} min={0.6} max={5} step={0.1} onChange={(v) => set('grain', v)} />
                        <Segmented label="Palette" options={PALETTE_NAMES} value={palette} onChange={setPalette} />
                    </Group>
                </>
            }
        >
            <div className="mx-auto aspect-square w-full max-w-[640px]">
                <div ref={host} className="relative size-full" role="img" aria-label="Warped noise sliced into stippled rock strata" />
            </div>
        </Demo>
    );
}
