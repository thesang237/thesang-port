'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { disposeGltf, loadModel, loadTex } from '../kit/assets';
import { Demo, Group, Segmented, Slider, StageNote, Toggle } from '../kit/controls';
import { createLinearOutput, disposeObject } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { accentBackdropMaterial, CORN, damp, relitMaterial, remat } from '../kit/source';

/**
 * The hero cob exactly as HeroWorld builds it: the painted cards of cobb_test.gltf with the page's
 * relitMaterial (four baked lightings blended by a 2D light position), drawn without depth in the
 * artist's order. The light follows the pointer and the cob's own turn, with the source's mapping.
 */
const DEFAULTS = { light: 'follow' as 'follow' | 'TL' | 'TR' | 'BL' | 'BR', turn: 0, sway: 0.06, exposure: 1, order: true, depth: false };
const CORNERS: Record<string, [number, number]> = { TL: [0, 0], TR: [1, 0], BL: [0, 1], BR: [1, 1] };
const map = (v: number, a: number, b: number, c: number, d: number) => c + (d - c) * Math.min(1, Math.max(0, (v - a) / (b - a)));
const lerp = THREE.MathUtils.lerp;
const deg = THREE.MathUtils.degToRad;

export default function RelitLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const dot = useRef<HTMLSpanElement>(null);
    const [status, setStatus] = useState('Loading the cob…');

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            const out = createLinearOutput({ samples: 2, vignette: true });
            const scene = new THREE.Scene();
            const bgMat = accentBackdropMaterial(CORN.heroBase, CORN.heroBlue, CORN.heroGreen, [0.2, 0.2], [0.8, 0.8]);
            bgMat.uniforms.uFloor.value.set(-0.2, 0.3);
            const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
            bg.frustumCulled = false;
            bg.renderOrder = -100;
            scene.add(bg);
            const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
            const rig = new THREE.Group();
            scene.add(rig);
            const mats: THREE.ShaderMaterial[] = [];
            const meshes: { m: THREE.Mesh; order: number }[] = [];
            const textures: THREE.Texture[] = [];
            const models: GLTF[] = [];
            let alive = true;
            Promise.all([
                loadModel('cobb_test'),
                loadModel('hair'),
                ...['TOP_L', 'TOP_R', 'BOTTOM_L', 'BOTTOM_R'].map((f) => loadTex(f)),
                loadTex('alpha', { data: true }),
                ...['HAIR_TOP_L_', 'HAIR_TOP_R_', 'HAIR_BOTTOM_L_', 'HAIR_BOTTOM_R_'].map((f) => loadTex(f)),
                loadTex('alpha_(1)', { data: true }),
            ])
                .then((res) => {
                    const [cob, silk, ...tex] = res as [GLTF, GLTF, ...THREE.Texture[]];
                    models.push(cob, silk);
                    textures.push(...tex);
                    if (!alive) return;
                    const [tl, tr, bl, br, ca, htl, htr, hbl, hbr, ha] = tex;
                    const cobMat = relitMaterial([tl, tr, bl, br], ca, { sway: 0.06, baseY: -3, height: 9 });
                    const silkMat = relitMaterial([htl, htr, hbl, hbr], ha, { sway: 0.05, baseY: -3, height: 9 });
                    mats.push(cobMat, silkMat);
                    remat(cob.scene, (m) => {
                        const order = Number(m.userData['RENDER ORDER'] ?? 0);
                        m.renderOrder = order;
                        meshes.push({ m, order });
                        return cobMat;
                    });
                    remat(silk.scene, (m) => {
                        m.renderOrder = 9;
                        meshes.push({ m, order: 9 });
                        return silkMat;
                    });
                    rig.add(cob.scene, silk.scene);
                    setStatus('');
                })
                .catch(() => setStatus('Could not load the cob'));

            const light = new THREE.Vector2(0.5, 0.35);
            const ptr01 = new THREE.Vector2(0.5, 0.5);
            const ptr = new THREE.Vector2();
            let yaw = 0;
            let pitch = 0.03;
            let t = 0;
            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(time, dt) {
                    t += dt;
                    const prm = ref.current;
                    if (pointer.over) ptr.set(pointer.x, pointer.y);
                    else if (!prefersReducedMotion()) ptr.set(Math.sin(t * 0.45) * 0.8, Math.sin(t * 0.7) * 0.6);
                    ptr01.set(damp(ptr01.x, 0.5 + ptr.x * 0.5, 4.8, dt), damp(ptr01.y, 0.5 - ptr.y * 0.5, 4.8, dt));
                    // HeroWorld's light mapping: the cob's own turn + the pointer
                    const rY = prm.turn + 5 * Math.sin(0.2 * time);
                    const sY = lerp(-5, 15, ptr01.x);
                    const sX = lerp(-20, 0, ptr01.y);
                    if (prm.light === 'follow') light.set(map(rY + sY, -15, 15, 0, 1), map(sX, -20, 0, 1, 0));
                    else light.set(...CORNERS[prm.light]);
                    for (const m of mats) {
                        m.uniforms.uLight.value.copy(light);
                        m.uniforms.uTime.value = time;
                        m.uniforms.uSway.value = prm.sway * (m === mats[1] ? 0.83 : 1);
                        m.uniforms.uExposure.value = prm.exposure;
                        m.depthTest = prm.depth;
                        m.depthWrite = prm.depth;
                    }
                    for (const { m, order } of meshes) m.renderOrder = prm.order ? order : 0;
                    rig.rotation.set(deg(3 * Math.cos(0.2 * time)) * 0.2, deg(rY) * 0.55, deg(3 * Math.cos(0.2 * time)) * 0.35);
                    if (dot.current) {
                        dot.current.style.left = `${light.x * 100}%`;
                        dot.current.style.top = `${light.y * 100}%`;
                    }
                    yaw = damp(yaw, ptr.x * 0.3, 4, dt);
                    pitch = damp(pitch, 0.03 + ptr.y * 0.15, 4, dt);
                    const cp = Math.cos(pitch);
                    cam.position.set(Math.sin(yaw) * cp * 24, Math.sin(pitch) * 24, Math.cos(yaw) * cp * 24);
                    cam.lookAt(0, 0.4, 0);
                    out.begin(renderer);
                    renderer.render(scene, cam);
                    out.present(renderer);
                },
                dispose() {
                    alive = false;
                    disposeObject(scene);
                    models.forEach(disposeGltf);
                    textures.forEach((x) => x.dispose());
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 2 },
    );

    return (
        <Demo
            title="Relit cob: four baked lights, mixed live"
            stacked
            hint="Move over the cob: the light seems to follow you, yet there is no light in the scene. Pick a corner to see one bake on its own, then break the draw order."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="light"
                        options={[
                            { value: 'follow', label: 'follow pointer' },
                            { value: 'TL', label: 'top-left bake' },
                            { value: 'TR', label: 'top-right' },
                            { value: 'BL', label: 'bottom-left' },
                            { value: 'BR', label: 'bottom-right' },
                        ]}
                        value={p.light}
                        onChange={(v) => set('light', v)}
                    />
                    <div className="flex items-center gap-4">
                        <div className="relative size-[86px] shrink-0 rounded-md border border-[var(--cl-line-2)] bg-[#030806]" aria-label="Light position between the four bakes">
                            {(['TL', 'TR', 'BL', 'BR'] as const).map((k) => (
                                <span
                                    key={k}
                                    className="cl-mono absolute text-[9px] text-[var(--cl-faint)]"
                                    style={{
                                        left: k.endsWith('L') ? 4 : undefined,
                                        right: k.endsWith('R') ? 4 : undefined,
                                        top: k.startsWith('T') ? 3 : undefined,
                                        bottom: k.startsWith('B') ? 3 : undefined,
                                    }}
                                >
                                    {k}
                                </span>
                            ))}
                            <span
                                ref={dot}
                                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cl-gold)] shadow-[0_0_10px_#e9c46a]"
                                style={{ left: '50%', top: '35%' }}
                            />
                        </div>
                        <p className="text-[12px] leading-snug text-[var(--cl-dim)]">uLight: x mixes left ↔ right bakes, y mixes top ↔ bottom. Four texture reads, two mixes.</p>
                    </div>
                    <Group title="Cob">
                        <Slider
                            label="cob turn"
                            value={p.turn}
                            min={-20}
                            max={20}
                            step={0.5}
                            onChange={(v) => set('turn', v)}
                            format={(v) => `${v}°`}
                            help="The page turns the cob with the scroll (−20° → 20°); the light shifts with it."
                        />
                        <Slider label="leaf sway" value={p.sway} min={0} max={0.4} step={0.005} onChange={(v) => set('sway', v)} help="Vertex-shader flutter, growing with height (0.06)." />
                        <Slider label="exposure" value={p.exposure} min={0.3} max={2} step={0.01} onChange={(v) => set('exposure', v)} />
                    </Group>
                    <Group title="Break it">
                        <Toggle
                            label="artist’s draw order"
                            checked={p.order}
                            onChange={(v) => set('order', v)}
                            help="Cards drawn in the order stored in the glTF (“RENDER ORDER”). Off = file order."
                        />
                        <Toggle label="depth test" checked={p.depth} onChange={(v) => set('depth', v)} help="The page turns it OFF: soft leaf edges would cut holes in each other." />
                    </Group>
                </>
            }
        >
            <div ref={host} className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                {status ? <StageNote>{status}</StageNote> : null}
            </div>
        </Demo>
    );
}
