'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { ColorInput, Demo, Group, Readout, Segmented, Slider, StageNote } from '../kit/controls';
import { useParams, useThreeCanvas } from '../kit/loop';
import { CARD_IMAGES, KPR } from '../kit/source';

import { makeCardStage, setPicture } from './cardStage';

const DEFAULTS = { wash: 0, washColor: KPR.glow as string, mode: 'screen (page)' as 'screen (page)' | 'fade', grain: 0.03, flick: 0.03, dim: 0, vel: 0, edge: 0 };

/** Stage.tsx: chroma from scroll speed · choreo.ts fullRadius(): skew from scroll speed */
const chromaFrom = (vel: number) => Math.min(0.012, Math.abs(vel) * 0.0035);
const skewFrom = (vel: number) => Math.max(-0.06, Math.min(0.06, vel * 0.004)) * 0.3;

/** Chapter 06: the finishing layers of the card shader, each on its own dial. */
export default function LookLab() {
    const host = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const tmp = useRef(new THREE.Color());

    useThreeCanvas(host, ({ renderer }) => {
        const st = makeCardStage(renderer, '#ffffff');
        const m = st.card();
        void st.ktx(`/kpr/tex/${CARD_IMAGES.eyes.file}.ktx2`).then((t) => {
            setPicture(m.material, t, CARD_IMAGES.eyes.aspect);
            setLoading(false);
        });
        const u = m.material.uniforms;
        return {
            resize: (w, h) => st.resize(w, h),
            frame: (time) => {
                const d = ref.current;
                const w = Math.min(st.width * 0.82, 980);
                const h = 640;
                m.scale.set(w, h, 1);
                u.uSize.value.set(w, h);
                u.uRadius.value = 30;
                u.uNotch.value.set(1, 0, 0.36 * w, 26);
                tmp.current.set(d.washColor);
                const fade = d.mode === 'fade';
                u.uWash.value.set(tmp.current.r, tmp.current.g, tmp.current.b, fade ? 0 : d.wash);
                u.uOpacity.value = fade ? 1 - d.wash : 1;
                u.uGrain.value = d.grain;
                u.uFlickAmt.value = d.flick;
                u.uDim.value = d.dim;
                u.uChroma.value = chromaFrom(d.vel);
                u.uSkew.value = skewFrom(d.vel);
                u.uEdge.value.w = d.edge;
                u.uTime.value = time;
                st.pin(m.material, 0, 0, 0, w, h);
                st.sync();
                st.render();
            },
            dispose: () => st.dispose(),
        };
    });

    return (
        <Demo
            title="Glow, grain and scroll-speed effects"
            hint="Every dial is one line of the card shader. Push “scroll speed” to feel what fast scrolling does to a card."
            onReset={reset}
            controls={
                <>
                    <Group title="Wash (the glow while cards change scale)">
                        <Slider
                            label="strength"
                            value={p.wash}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => set('wash', v)}
                            help="0 at rest. The hero peaks at 0.36 while it becomes a card; handoffs at 0.4."
                        />
                        <ColorInput label="colour" value={p.washColor} onChange={(v) => set('washColor', v)} />
                        <Segmented label="blend" options={['screen (page)', 'fade']} value={p.mode} onChange={(v) => set('mode', v)} />
                    </Group>
                    <Group title="Film texture">
                        <Slider label="grain" value={p.grain} min={0} max={0.3} step={0.005} onChange={(v) => set('grain', v)} help="noise.webp, re-positioned every frame. Source: 0.03." />
                        <Slider
                            label="flicker"
                            value={p.flick}
                            min={0}
                            max={0.4}
                            step={0.005}
                            onChange={(v) => set('flick', v)}
                            help="flick.webp: a 1-px-tall strip of brightness values. Source: 0.03."
                        />
                        <Slider label="dim" value={p.dim} min={0} max={0.8} step={0.01} onChange={(v) => set('dim', v)} help="The ring darkens its side cards up to 0.25." />
                        <Slider
                            label="rim light"
                            value={p.edge}
                            min={0}
                            max={16}
                            step={0.5}
                            onChange={(v) => set('edge', v)}
                            help="Inner white rim, used while a card swings edge-on."
                            format={(v) => `${v.toFixed(1)} px`}
                        />
                    </Group>
                    <Group title="Scroll speed (film.vel)">
                        <Slider label="speed" value={p.vel} min={-8} max={8} step={0.1} onChange={(v) => set('vel', v)} format={(v) => `${v.toFixed(1)} scr/s`} />
                        <Readout
                            items={[
                                { label: 'chroma', value: chromaFrom(p.vel).toFixed(4), color: '#c0fb50' },
                                { label: 'skew', value: skewFrom(p.vel).toFixed(4) },
                            ]}
                        />
                    </Group>
                </>
            }
        >
            <div className="relative aspect-[16/10] w-full lg:aspect-auto lg:h-full lg:min-h-[520px]">
                <div ref={host} className="absolute inset-0" />
                {loading ? <StageNote>Loading the eyes card image…</StageNote> : null}
            </div>
        </Demo>
    );
}
