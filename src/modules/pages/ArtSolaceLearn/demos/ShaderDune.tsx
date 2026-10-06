'use client';

import { useMemo, useRef, useState } from 'react';

import { bakeSeed } from '../kit/bake';
import { Btn, Demo, Group, Readout, Segmented, Slider } from '../kit/controls';
import { DUNES, GRAIN, HASH, UNWARP } from '../kit/glsl';
import { randomSeed, type Scene } from '../kit/source';
import { useDune } from '../kit/useDune';

/** The whole artwork as one fragment shader: unwarp → shade → grain, for every pixel at once. */
export const DUNE_FRAG = /* glsl */ `
${HASH}
${UNWARP}
${DUNES}
${GRAIN}
uniform float uMargin;
uniform vec3 uDensity;   // draw chance: core, slope, sky
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uView;     // 0 sand · 1 zones · 2 which dune
uniform float uScan;     // 0..1: how far the top-to-bottom build has got

void main() {
    // canvas position 0..1 with y down, like the art
    vec2 c = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y);
    bool inside = c.x >= uMargin && c.x <= 1.0 - uMargin && c.y >= uMargin && c.y <= 1.0 - uMargin;

    vec2 m = unwarp(c);                 // 1. where did this pixel come from?
    int which;
    int zone = shadeAt(m, which);       // 2. core, slope or sky?

    if (uView > 1.5) {                  // x-ray: one hue per dune
        vec3 col = which < 0 ? uPaper : 0.5 + 0.35 * cos(6.2831 * (float(which) * 0.13 + vec3(0.0, 0.33, 0.67)));
        if (zone == 1) col = mix(col, vec3(1.0), 0.45);
        fragColor = vec4(inside ? col : uPaper, 1.0);
        return;
    }
    if (uView > 0.5) {                  // x-ray: the three zones as flat colours
        vec3 col = zone == 0 ? vec3(0.118, 0.11, 0.129) : zone == 1 ? vec3(0.87, 0.52, 0.443) : vec3(0.953, 0.902, 0.847);
        fragColor = vec4(inside ? col : uPaper, 1.0);
        return;
    }

    float density = zone == 0 ? uDensity.x : zone == 1 ? uDensity.y : uDensity.z;
    if (!inside || c.y > mix(uMargin, 1.0 - uMargin, uScan)) density = 0.0;
    float ink = inkAt(c, density);      // 3. how many grains landed here?
    fragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}
`;

const PRESETS = ['solace', 'r5', 'r29', 'r23', 'r1', 'r12'] as const;
const VIEWS = [
    { value: 'sand', label: 'Sand' },
    { value: 'zones', label: 'Zones' },
    { value: 'dunes', label: 'Which dune' },
] as const;
type View = (typeof VIEWS)[number]['value'];

type Dials = { vc: number; amp: number; freq: number; phase: number; core: number; slope: number; sky: number; grain: number; tries: number };
const dialsFrom = (s: Scene): Dials => ({
    vc: s.params.verticalCompression,
    amp: s.params.warpAmplY,
    freq: s.params.warpFreqY,
    phase: s.params.warpPhaseY,
    core: s.params.coreDensity,
    slope: s.params.slopeDensity,
    sky: s.params.skyDensity,
    grain: 1,
    tries: 1,
});

export default function ShaderDune({ initialSeed = 'solace', initialView = 'sand' }: { initialSeed?: string; initialView?: View }) {
    const host = useRef<HTMLDivElement>(null);
    const [seed, setSeed] = useState(initialSeed);
    const [view, setView] = useState<View>(initialView);
    const [grainSeed, setGrainSeed] = useState(1);

    // CPU: roll the scene and bake its boundary maps (only when the seed changes)
    const { scene, baked, bakeMs } = useMemo(() => bakeSeed(seed), [seed]);
    const [dials, setDials] = useState<Dials>(() => dialsFrom(scene));
    const [shownFor, setShownFor] = useState(scene);
    if (shownFor !== scene) {
        // new seed: the dials jump to what this seed rolled (state adjusted while rendering, no effect)
        setShownFor(scene);
        setDials(dialsFrom(scene));
    }
    const set = <K extends keyof Dials>(k: K, v: number) => setDials((d) => ({ ...d, [k]: v }));

    // "Build ↓" replays the top-to-bottom scan: the loop only animates while it runs
    const [scanning, setScanning] = useState(false);
    const scanStart = useRef(-1);

    // GPU: the shared dune shader setup, then the dials as uniforms on top of the seeded values
    useDune(
        host,
        DUNE_FRAG,
        scene,
        baked,
        (f, time) => {
            const d = dials;
            const sp = scene.params;
            f.set('uVC', d.vc);
            f.set('uAmpY', d.amp);
            f.set('uFreqY', d.freq);
            f.set('uPhaseY', d.phase);
            f.set('uDensity', [d.core, d.slope, d.sky]);
            f.set('uDotSize', sp.dotSize * d.grain);
            f.set('uTries', (sp.dotsPerFrame * sp.frames * sp.dotSize * sp.dotSize * d.tries) / (1 - 2 * sp.margin) ** 2);
            f.set('uGrainSeed', grainSeed);
            f.set('uView', view === 'sand' ? 0 : view === 'zones' ? 1 : 2);
            let scan = 1;
            if (scanStart.current === -2) scanStart.current = time;
            if (scanStart.current >= 0) {
                scan = Math.min(1, (time - scanStart.current) / 1.6);
                if (scan >= 1) {
                    scanStart.current = -1;
                    setScanning(false);
                }
            }
            f.set('uScan', scan);
        },
        // nothing moves on its own: render only when a dial changes (or while the scan plays)
        { animate: scanning },
    );

    const reset = () => setDials(dialsFrom(scene));

    return (
        <Demo
            title="The artwork as one fragment shader"
            hint="Every pixel runs the same three steps at once. Switch the view to x-ray the zones, or drag the warp dials: no re-drawing, it updates every frame."
            onReset={reset}
            controls={
                <>
                    <Group title="Seed (dune shapes are baked on the CPU)">
                        <Segmented options={PRESETS.map((s) => ({ value: s, label: s }))} value={(PRESETS as readonly string[]).includes(seed) ? seed : ''} onChange={setSeed} />
                        <div className="flex flex-wrap gap-2">
                            <Btn onClick={() => setSeed(randomSeed())}>Random seed</Btn>
                            <Btn onClick={() => setGrainSeed((g) => g + 1)}>Re-throw grain</Btn>
                            <Btn
                                onClick={() => {
                                    scanStart.current = -2;
                                    setScanning(true);
                                }}
                            >
                                Build ↓
                            </Btn>
                        </div>
                        <Segmented<View> label="View" options={VIEWS} value={view} onChange={setView} />
                    </Group>
                    <Group title="Warp (uniforms: free to change)">
                        <Slider label="verticalCompression" value={dials.vc} min={0.2} max={2} onChange={(v) => set('vc', v)} help="Depth squeeze. Under 1 pushes the land down." />
                        <Slider label="warpAmplY" value={dials.amp} min={0} max={0.1} step={0.001} onChange={(v) => set('amp', v)} help="Height of the horizon wave." />
                        <Slider label="warpFreqY" value={dials.freq} min={0} max={20} step={0.1} onChange={(v) => set('freq', v)} help="How many waves across." />
                        <Slider label="warpPhaseY" value={dials.phase} min={0} max={Math.PI * 2} onChange={(v) => set('phase', v)} help="Slides the wave sideways." />
                    </Group>
                    <Group title="Sand">
                        <Slider label="core" value={dials.core} min={0} max={1} onChange={(v) => set('core', v)} help="Draw chance in a dune’s core." />
                        <Slider label="slope" value={dials.slope} min={0} max={1} onChange={(v) => set('slope', v)} help="Draw chance on a lit slope." />
                        <Slider label="sky" value={dials.sky} min={0} max={1} onChange={(v) => set('sky', v)} help="Draw chance in the sky." />
                        <Slider label="grain size ×" value={dials.grain} min={0.5} max={6} step={0.1} onChange={(v) => set('grain', v)} help="Cell size, times the art’s dot size." />
                        <Slider label="dots ×" value={dials.tries} min={0.1} max={6} step={0.1} onChange={(v) => set('tries', v)} help="Times the art’s 400,000 dots." />
                    </Group>
                    <Readout
                        items={[
                            { label: 'dunes', value: `${baked.count}/${scene.peaks.length}` },
                            { label: 'palette', value: scene.traits.Palette },
                            { label: 'bake (CPU)', value: `${bakeMs.toFixed(0)} ms` },
                            { label: 'texels', value: `${(baked.texels / 1e6).toFixed(2)} M` },
                        ]}
                    />
                    {baked.dropped > 0 && (
                        <p className="text-[12px] leading-snug text-[var(--sl-warn)]">{`${baked.dropped} back dunes left out: their stripe rows would need more than 16 MB of texture.`}</p>
                    )}
                </>
            }
        >
            <div className="mx-auto aspect-square w-full max-w-[640px]">
                <div ref={host} className="relative size-full" />
            </div>
        </Demo>
    );
}
