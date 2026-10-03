'use client';

import { useRef, useState } from 'react';

import { Demo, Group, Slider, StageNote, Toggle } from '../kit/controls';
import { useParams, useThreeCanvas } from '../kit/loop';
import { CARD_IMAGES } from '../kit/source';

import { makeCardStage, setPicture } from './cardStage';

const DEFAULTS = { auto: true, turn: 0.35, lean: 0.06, size: 1, frame: false };

/**
 * Chapter 06: the same motion on two real cards. Left: the picture is glued to the card (the usual way).
 * Right: the picture is sampled in screen space inside the card's upright rect (how /kpr does it).
 */
export default function MaskLab() {
    const host = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const { p, set, ref, reset } = useParams({ ...DEFAULTS, auto: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });

    useThreeCanvas(host, ({ renderer }) => {
        const st = makeCardStage(renderer, '#ffffff');
        const glued = st.card();
        const pinned = st.card();
        void st.ktx(`/kpr/tex/${CARD_IMAGES.trailer.file}.ktx2`).then((t) => {
            setPicture(glued.material, t, CARD_IMAGES.trailer.aspect);
            setPicture(pinned.material, t, CARD_IMAGES.trailer.aspect);
            setLoading(false);
        });
        let clock = 0;
        const W = 360;
        const H = 470;
        return {
            resize: (w, h) => st.resize(w, h),
            frame: (time, dt) => {
                const d = ref.current;
                if (d.auto) clock += dt;
                const ry = d.auto ? Math.sin(clock * 0.8) * 0.75 : d.turn;
                const rz = d.auto ? Math.sin(clock * 0.55 + 1) * 0.08 : d.lean;
                const sc = d.auto ? 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(clock * 0.4)) : d.size;
                const x = Math.min(330, st.width * 0.24);
                [glued, pinned].forEach((m, i) => {
                    const cx = i ? x : -x;
                    const w = W * sc;
                    const h = H * sc;
                    m.position.set(cx, 0, 0);
                    m.rotation.set(0, ry, rz);
                    m.scale.set(w, h, 1);
                    const u = m.material.uniforms;
                    u.uSize.value.set(w, h);
                    u.uRadius.value = 20 * Math.max(0.6, sc);
                    u.uNotch.value.set(0, 1, 0.52 * h, 21);
                    u.uChamfer.value.set(2, 23);
                    u.uTime.value = time;
                    u.uEdge.value.w = 7 * Math.abs(Math.sin(ry));
                    if (i === 0) st.pin(m.material, 0, 0, 0, 0, 0, false);
                    // the fixed frame: a full-size rect that doesn't shrink with the card
                    else if (d.frame) st.pin(m.material, cx, 0, 0, W, H);
                    else st.pin(m.material, cx, 0, 0, w, h);
                });
                st.sync();
                st.render();
            },
            dispose: () => st.dispose(),
        };
    });

    return (
        <Demo
            title="Glued vs pinned — the card is a mask"
            hint="Same motion, two cards. Left: the picture turns and leans with the card. Right: the card only moves its outline; the picture stays upright on screen."
            onReset={reset}
            controls={
                <>
                    <Toggle label="animate" checked={p.auto} onChange={(v) => set('auto', v)} help="Off: set the motion yourself with the dials below." />
                    <Group title="Motion">
                        <Slider label="turn (ry)" value={p.turn} min={-1.2} max={1.2} step={0.01} onChange={(v) => set('turn', v)} format={(v) => `${((v / Math.PI) * 180).toFixed(0)}°`} />
                        <Slider label="lean (rz)" value={p.lean} min={-0.3} max={0.3} step={0.005} onChange={(v) => set('lean', v)} format={(v) => `${((v / Math.PI) * 180).toFixed(1)}°`} />
                        <Slider label="size" value={p.size} min={0.3} max={1.2} step={0.01} onChange={(v) => set('size', v)} format={(v) => `${(v * 100).toFixed(0)} %`} />
                    </Group>
                    <Toggle
                        label="fixed frame (right card)"
                        checked={p.frame}
                        onChange={(v) => set('frame', v)}
                        help="The picture keeps its full-size rect while the card shrinks: the hero does this while it turns, so the painting never budges."
                    />
                </>
            }
        >
            <div className="relative aspect-[16/10] w-full">
                <div ref={host} className="absolute inset-0" />
                {loading ? <StageNote>Loading the trailer card image…</StageNote> : null}
                <div className="kl-mono pointer-events-none absolute inset-x-0 bottom-3 flex justify-around text-[10.5px] uppercase text-[var(--kl-dim)]">
                    <span>Glued to the card</span>
                    <span>Pinned to the screen (/kpr)</span>
                </div>
            </div>
        </Demo>
    );
}
