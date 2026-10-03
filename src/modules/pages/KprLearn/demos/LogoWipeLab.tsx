'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { Demo, Group, Readout, Segmented, Slider, StageNote, Toggle } from '../kit/controls';
import { STAGE_H } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { createLogoWipe, loadAtlas, LOGO_LAST, seg, W } from '../kit/source';

import { makeCardStage } from './cardStage';

type Mode = 'own clock (page)' | 'scroll-scrubbed';
const DEFAULTS = { t: 8.2, mode: 'own clock (page)' as Mode, crisp: true, squash: 1 };
const FPS = 48;

/**
 * Chapter 09: the real logo wipe (gl/LogoWipe.ts) with the real sheet (logo-anim-low-res-0, 220 × 124
 * frames). The film clock slider stands in for the scroll; the wipe is armed at film 8.35.
 */
export default function LogoWipeLab() {
    const host = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [frameShown, setFrameShown] = useState(0);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(host, ({ renderer }) => {
        const st = makeCardStage(renderer, '#c98a68');
        let wipe: ReturnType<typeof createLogoWipe> | null = null;
        Promise.all([st.ktx('/kpr/tex/logo-anim-low-res-0.ktx2'), loadAtlas('/kpr/tex/logo-anim-low-res-0.json')])
            .then(([tex, atlas]) => {
                const book = {
                    textures: [tex as THREE.Texture],
                    frames: atlas.frames.map((f) => ({ sheet: 0, rect: new THREE.Vector4(f.u, f.v, f.w, f.h), trim: new THREE.Vector4(...f.trim) })),
                    fps: FPS,
                };
                wipe = createLogoWipe(book);
                st.scene.add(wipe.mesh);
                setLoading(false);
            })
            .catch(() => {});
        let frame = 0;
        let lastShown = -1;
        return {
            resize: (w, h) => st.resize(w, h),
            frame: (_time, dt) => {
                const d = ref.current;
                if (d.mode === 'scroll-scrubbed') frame = seg(d.t, W.glyph) * LOGO_LAST;
                // Stage.tsx: plays on its own clock once armed, holds on the symbol, rewinds 2.5× faster
                else frame = d.t >= W.glyph[0] ? Math.min(LOGO_LAST, frame + dt * FPS) : Math.max(0, frame - dt * FPS * 2.5);
                if (wipe) {
                    wipe.update(frame, st.width, STAGE_H, 0, 0, d.squash, frame > 0.5 ? 1 : 0);
                    // break it: without the threshold the 124-px-tall frames are stretched soft
                    if (!d.crisp) (wipe.mesh.material as THREE.ShaderMaterial).uniforms.uSoft.value = 0.5;
                }
                const r = Math.round(frame);
                if (r !== lastShown) {
                    lastShown = r;
                    setFrameShown(r);
                }
                st.render();
            },
            dispose: () => {
                wipe?.dispose();
                st.dispose();
            },
        };
    });

    return (
        <Demo
            title="The logo wipe — a flipbook on its own clock"
            hint="Drag the film clock past 8.35 and stop. On the page the wipe keeps playing to the keeper symbol by itself; drag back and it rewinds."
            onReset={reset}
            controls={
                <>
                    <Slider label="film t (your scroll)" value={p.t} min={7.9} max={9.3} step={0.005} onChange={(v) => set('t', v)} help={`Armed at ${W.glyph[0]} (W.glyph).`} />
                    <Segmented label="timing" options={['own clock (page)', 'scroll-scrubbed']} value={p.mode} onChange={(v) => set('mode', v)} />
                    <Group title="Drawing">
                        <Toggle
                            label="crisp threshold"
                            checked={p.crisp}
                            onChange={(v) => set('crisp', v)}
                            help="smoothstep around 0.5 alpha, ~1.6 screen px wide. Off: the low-res frames look blurry."
                        />
                        <Slider
                            label="squash (rides the card)"
                            value={p.squash}
                            min={0.02}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('squash', v)}
                            help="|cos ry| of the story card: the symbol turns with it."
                        />
                    </Group>
                    <Readout
                        items={[
                            { label: 'frame', value: `${frameShown}/${LOGO_LAST}`, color: '#c0fb50' },
                            {
                                label: 'state',
                                value: p.mode === 'scroll-scrubbed' ? 'scrubbed' : p.t >= W.glyph[0] ? (frameShown >= LOGO_LAST ? 'holding' : 'playing') : frameShown > 0 ? 'rewinding' : 'waiting',
                            },
                        ]}
                    />
                </>
            }
        >
            <div className="relative aspect-[16/10] w-full">
                <div ref={host} className="absolute inset-0" />
                {loading ? <StageNote>Loading the logo sheet…</StageNote> : null}
            </div>
        </Demo>
    );
}
