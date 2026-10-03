'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Readout, Slider } from '../kit/controls';
import { fitPixelCamera, labelTexture, makeShared, STAGE_H } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { createNotchedMaterial, KPR, stageDistance } from '../kit/source';

const D0 = stageDistance(STAGE_H);
const DEFAULTS = { distance: D0, turn: 0.9, z: 0 };

/**
 * Chapter 04: the pixel stage. The camera's field of view is solved so the plane at depth 0 shows
 * exactly 900 px of height: a 400 × 300 card is 400 × 300 screen pixels when flat, at any distance.
 * The distance only changes how strong the perspective is when it turns.
 */
export default function PixelStage() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(STAGE_H / 2 / p.distance));

    useThreeCanvas(host, ({ renderer }) => {
        renderer.setClearColor('#ffffff', 1);
        const scene = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera();
        const shared = makeShared();
        const tex = labelTexture('px', '400 × 300', KPR.lavender);
        const mat = createNotchedMaterial(shared);
        mat.uniforms.uMapF.value = tex;
        mat.uniforms.uMapB.value = tex;
        mat.uniforms.uFace.value.set(1, 1, 1, 1);
        mat.uniforms.uSize.value.set(400, 300);
        mat.uniforms.uRadius.value = 17;
        mat.uniforms.uNotch.value.set(1, 0, 150, 18);
        mat.uniforms.uGrain.value = 0;
        mat.uniforms.uFlickAmt.value = 0;
        const geo = new THREE.PlaneGeometry(1, 1, 24, 1);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(400, 300, 1);
        scene.add(mesh);
        // a floor grid at y = −200 so the depth is readable
        const grid = new THREE.GridHelper(3000, 30, 0xb9b4e8, 0xe4e1f5);
        grid.position.y = -230;
        scene.add(grid);
        let aspect = 1;
        return {
            resize: (w, h) => {
                aspect = w / h;
            },
            frame: () => {
                const d = ref.current;
                fitPixelCamera(cam, aspect, STAGE_H, d.distance);
                mesh.rotation.y = d.turn;
                mesh.position.z = d.z;
                renderer.render(scene, cam);
            },
            dispose: () => {
                geo.dispose();
                mat.dispose();
                tex.dispose();
                grid.geometry.dispose();
                (grid.material as THREE.Material).dispose();
                shared.dispose();
            },
        };
    });

    return (
        <Demo
            title="The pixel stage — 1 unit = 1 screen pixel"
            hint="Set the turn to 0: the card fits the dashed 400 × 300 box exactly, whatever the camera distance. Then turn it and change the distance."
            onReset={reset}
            controls={
                <>
                    <Slider label="turn" value={p.turn} min={-1.5} max={1.5} step={0.01} onChange={(v) => set('turn', v)} format={(v) => `${((v / Math.PI) * 180).toFixed(0)}°`} />
                    <Slider
                        label="camera distance"
                        value={p.distance}
                        min={250}
                        max={5000}
                        step={5}
                        onChange={(v) => set('distance', v)}
                        help={`Source: max(1100, 1.25 × viewport height) = ${D0.toFixed(0)} at 900 px. Short = fisheye, long = flat.`}
                        format={(v) => `${v.toFixed(0)}`}
                    />
                    <Slider
                        label="card depth z"
                        value={p.z}
                        min={-1200}
                        max={400}
                        step={5}
                        onChange={(v) => set('z', v)}
                        help="Pushing back shrinks it by perspective (the second turn dips to −320)."
                        format={(v) => `${v.toFixed(0)}`}
                    />
                    <Readout
                        items={[
                            { label: 'field of view', value: `${fov.toFixed(1)}°`, color: '#c0fb50' },
                            { label: 'visible height', value: '900 px' },
                        ]}
                    />
                </>
            }
        >
            <div className="relative">
                <div ref={host} className="aspect-[16/10] w-full" />
                {/* the DOM box the card should match when flat: 400 × 300 of a 900 px tall stage */}
                <div
                    className="pointer-events-none absolute left-1/2 top-1/2 border border-dashed border-[var(--kl-ink)]"
                    style={{ width: `${(400 / STAGE_H) * 62.5}%`, height: `${(300 / STAGE_H) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    aria-hidden
                />
            </div>
        </Demo>
    );
}
