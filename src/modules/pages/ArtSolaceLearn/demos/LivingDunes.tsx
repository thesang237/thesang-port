'use client';

import { useMemo, useRef, useState } from 'react';

import { bakeSeed } from '../kit/bake';
import { Btn, Demo, Group, Slider } from '../kit/controls';
import { DUNES, HASH, UNWARP } from '../kit/glsl';
import { prefersReducedMotion, useParams } from '../kit/loop';
import { useDune } from '../kit/useDune';

import { SeedPicker } from './SeedPicker';

/** Solace with time as an input: the horizon rolls, ridges ripple, and sand blows across the sky. */
export const LIVING_FRAG = /* glsl */ `
${HASH}
${UNWARP}
${DUNES}
uniform float uMargin;
uniform vec3 uDensity;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uDotSize;
uniform float uTries;
uniform float uInkAlpha;
uniform float uWind;      // canvas widths per second the sky sand drifts
uniform float uStreak;    // sky grains stretched along the wind (1 = round)
uniform float uFlicker;   // grain re-throws per second
uniform float uShimmer;   // how much the lit slopes breathe

// the art's grain, with two additions: the cells can slide (wind) and stretch (streaks)
float inkAt(vec2 c, float density, vec2 drift, float stretch, float seed) {
    vec2 cell = floor((c + drift) / (uDotSize * vec2(stretch, 1.0)));
    float kept = 0.0;
    for (int s = 0; s < 4; s++) {
        kept += step(hash13(vec3(cell, seed + float(s) * 19.19)), density * uTries * stretch * 0.25);
    }
    return 1.0 - pow(max(1.0 - uInkAlpha, 1e-4), kept);
}

void main() {
    vec2 c = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y);
    if (c.x < uMargin || c.x > 1.0 - uMargin || c.y < uMargin || c.y > 1.0 - uMargin) { fragColor = vec4(uPaper, 1.0); return; }

    int which;
    int zone = shadeAt(unwarp(c), which);
    float t = uTime;
    float seed = floor(t * uFlicker);                 // a new throw of the dice, uFlicker times a second

    float ink;
    if (zone == 2) {
        // sky: grains slide with the wind and stretch into streaks
        ink = inkAt(c, uDensity.z, vec2(-t * uWind, 0.0), uStreak, seed);
    } else {
        // slopes breathe a little; cores stay still and solid
        float d = zone == 0 ? uDensity.x : uDensity.y * (1.0 + uShimmer * sin(t * 1.3 + c.x * 9.0 + float(which)));
        ink = inkAt(c, d, vec2(0.0), 1.0, seed + 7.0);
    }
    fragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}
`;

const DEFAULTS = { roll: 0.12, sway: 0.03, swaySpeed: 0.6, wind: 0.02, streak: 2.2, flicker: 6, shimmer: 0.6, grain: 1.1 };

export default function LivingDunes() {
    const host = useRef<HTMLDivElement>(null);
    const [seed, setSeed] = useState('r10');
    const { p, set, reset } = useParams(DEFAULTS);
    const [playing, setPlaying] = useState(() => !prefersReducedMotion());
    const { scene, baked } = useMemo(() => bakeSeed(seed), [seed]);

    useDune(
        host,
        LIVING_FRAG,
        scene,
        baked,
        (f, t) => {
            // the horizon wave's phase slides: the land rolls
            f.set('uPhaseY', scene.params.warpPhaseY + t * p.roll);
            // the Dancers sway, applied when looking up, with a moving phase: ridges ripple
            f.set('uSway', (scene.traits.Dancers ? 0.15 : 0) + p.sway);
            f.set('uSwayPhase', t * p.swaySpeed);
            f.set('uWind', p.wind);
            f.set('uStreak', p.streak);
            f.set('uFlicker', p.flicker);
            f.set('uShimmer', p.shimmer);
            f.set('uDotSize', scene.params.dotSize * p.grain);
        },
        { animate: playing },
    );

    return (
        <Demo
            title="Living dunes"
            hint="The same baked dunes; only time was added. Everything that moves is a uniform that changes with the clock."
            onReset={reset}
            controls={
                <>
                    <SeedPicker seed={seed} onChange={setSeed} />
                    <Btn primary onClick={() => setPlaying((v) => !v)}>
                        {playing ? 'Pause ❚❚' : 'Play ▶'}
                    </Btn>
                    <Group title="Land">
                        <Slider label="horizon roll" value={p.roll} min={0} max={1} onChange={(v) => set('roll', v)} help="Radians per second added to warpPhaseY." />
                        <Slider label="ripple" value={p.sway} min={0} max={0.12} step={0.002} onChange={(v) => set('sway', v)} help="Sideways sway when looking up the stripes (Dancers uses 0.15)." />
                        <Slider label="ripple speed" value={p.swaySpeed} min={0} max={4} onChange={(v) => set('swaySpeed', v)} />
                    </Group>
                    <Group title="Sand">
                        <Slider label="wind" value={p.wind} min={0} max={0.2} step={0.002} onChange={(v) => set('wind', v)} help="Canvas widths per second the sky grain drifts." />
                        <Slider label="streak" value={p.streak} min={1} max={12} step={0.5} onChange={(v) => set('streak', v)} help="Sky grains stretched along the wind." />
                        <Slider label="re-throws / s" value={p.flicker} min={0} max={30} step={1} onChange={(v) => set('flicker', v)} help="0 = frozen grain. High = boiling." />
                        <Slider label="slope shimmer" value={p.shimmer} min={0} max={1.5} onChange={(v) => set('shimmer', v)} help="The lit slopes breathe." />
                        <Slider label="grain size ×" value={p.grain} min={0.5} max={5} step={0.1} onChange={(v) => set('grain', v)} />
                    </Group>
                </>
            }
        >
            <div className="mx-auto aspect-square w-full max-w-[640px]">
                <div ref={host} className="relative size-full" />
            </div>
        </Demo>
    );
}
