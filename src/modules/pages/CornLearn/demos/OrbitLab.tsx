'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { disposeObject } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { damp, TILT } from '../kit/source';

/**
 * Teaching copy of World.orbit(): the camera circles a pivot (yaw / pitch from the pointer, damped
 * λ 4) and shifts its lens so the pivot stays on its designed screen spot. Compare with no lens shift
 * (the subject drifts to the centre) and with a plain pan. The inset is a "director" camera filming
 * the main one.
 */
const DEFAULTS = { mode: 'lens' as 'lens' | 'center' | 'pan', yaw: TILT.yaw as number, pitch: TILT.pitch as number, lambda: 4, lensX: 1050, lensY: 548, director: true, auto: !prefersReducedMotion() };

export default function OrbitLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const cross = useRef<HTMLDivElement>(null);

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            renderer.autoClear = false;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x050b08);
            const fog = new THREE.Fog(0x050b08, 18, 46);
            scene.fog = fog;
            scene.add(new THREE.HemisphereLight(0xdfffee, 0x1a2a1f, 1.4));
            const sun = new THREE.DirectionalLight(0xffe2b0, 2.2);
            sun.position.set(-4, 8, 6);
            scene.add(sun);
            // the subject: a kernel-ish gold capsule on a plinth, plus posts at several depths
            const subject = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 1.4, 8, 24), new THREE.MeshStandardMaterial({ color: 0xe9c46a, roughness: 0.35, metalness: 0.1 }));
            body.position.y = 1.6;
            subject.add(body);
            const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0x1f3a2c, roughness: 0.8 }));
            plinth.position.y = 0.2;
            subject.add(plinth);
            scene.add(subject);
            const postMat = new THREE.MeshStandardMaterial({ color: 0x55ffc2, roughness: 0.6, emissive: 0x0b3a2a });
            const posts = new THREE.Group();
            for (let i = 0; i < 18; i++) {
                const a = (i / 18) * Math.PI * 2;
                const r = 5 + (i % 3) * 3.5;
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2 + (i % 4) * 0.8, 10), postMat);
                post.position.set(Math.cos(a) * r, 0.6 + (i % 4) * 0.4, Math.sin(a) * r);
                posts.add(post);
            }
            scene.add(posts);
            const grid = new THREE.GridHelper(60, 60, 0x2a5a44, 0x15281e);
            scene.add(grid);

            const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
            const director = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
            director.position.set(26, 22, 30);
            director.lookAt(0, 1, 0);
            const helper = new THREE.CameraHelper(cam);
            helper.visible = false;
            scene.add(helper);
            const pivot = new THREE.Vector3(0, 1.4, 0);
            let yaw = 0;
            let pitch = 0;
            let t = 0;
            const ptr = new THREE.Vector2();

            return {
                resize(w, h) {
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(_time, dt) {
                    t += dt;
                    const prm = ref.current;
                    // pointer (or a slow figure-eight when nobody is pointing)
                    if (pointer.over) ptr.set(pointer.x, pointer.y);
                    else if (prm.auto) ptr.set(Math.sin(t * 0.5) * 0.9, Math.sin(t * 0.8) * 0.7);
                    else ptr.set(0, 0);
                    const { w, h } = size;
                    if (prm.mode === 'pan') {
                        yaw = 0;
                        pitch = 0;
                        const px = damp(cam.position.x, ptr.x * 3, prm.lambda, dt);
                        const py = damp(cam.position.y - pivot.y, ptr.y * 1.5, prm.lambda, dt);
                        cam.position.set(px, pivot.y + py, 14);
                        cam.lookAt(px, pivot.y + py, 0);
                    } else {
                        yaw = damp(yaw, ptr.x * prm.yaw, prm.lambda, dt);
                        pitch = damp(pitch, 0.08 + ptr.y * prm.pitch, prm.lambda, dt);
                        const cp = Math.cos(pitch);
                        cam.position.set(pivot.x + Math.sin(yaw) * cp * 14, pivot.y + Math.sin(pitch) * 14, pivot.z + Math.cos(yaw) * cp * 14);
                        cam.lookAt(pivot);
                    }
                    if (prm.mode === 'lens') cam.setViewOffset(w, h, (-(prm.lensX - 960) / 1920) * w, (-(prm.lensY - 497) / 994) * h, w, h);
                    else cam.clearViewOffset();
                    cam.updateMatrixWorld();
                    if (cross.current) {
                        cross.current.style.left = `${(prm.mode === 'lens' ? prm.lensX / 1920 : 0.5) * 100}%`;
                        cross.current.style.top = `${(prm.mode === 'lens' ? prm.lensY / 994 : 0.5) * 100}%`;
                    }

                    renderer.setScissorTest(false);
                    renderer.setViewport(0, 0, w, h);
                    renderer.setClearColor(0x050b08, 1);
                    renderer.clear();
                    helper.visible = false;
                    renderer.render(scene, cam);
                    if (prm.director) {
                        const iw = Math.round(w * 0.32);
                        const ih = Math.round(iw * 0.66);
                        const x = w - iw - 10;
                        const y = 10;
                        director.aspect = iw / ih;
                        director.updateProjectionMatrix();
                        helper.visible = true;
                        helper.update();
                        renderer.setScissorTest(true);
                        renderer.setScissor(x, y, iw, ih);
                        renderer.setViewport(x, y, iw, ih);
                        renderer.setClearColor(0x0b1a12, 1);
                        renderer.clear();
                        // no fog for the director: it films from far away
                        scene.fog = null;
                        renderer.render(scene, director);
                        scene.fog = fog;
                        renderer.setScissorTest(false);
                        renderer.setViewport(0, 0, w, h);
                    }
                },
                dispose() {
                    helper.dispose();
                    disposeObject(scene);
                },
            };
        },
        [],
        { antialias: true, maxDpr: 2 },
    );

    return (
        <Demo
            title="Orbit lab: lens shift keeps the composition"
            stacked
            hint="Move the pointer over the stage. With “lens shift” the subject stays on the crosshair while the world tilts around it. Try the other two modes."
            onReset={reset}
            controls={
                <>
                    <Segmented
                        label="camera move"
                        options={[
                            { value: 'lens', label: 'orbit + lens shift (page)' },
                            { value: 'center', label: 'orbit, no shift' },
                            { value: 'pan', label: 'pan' },
                        ]}
                        value={p.mode}
                        onChange={(v) => set('mode', v)}
                    />
                    <Group title="Orbit">
                        <Slider
                            label="yaw at the edge"
                            value={p.yaw}
                            min={0}
                            max={1.2}
                            step={0.01}
                            onChange={(v) => set('yaw', v)}
                            format={(v) => `${v.toFixed(2)} rad`}
                            help="Left / right swing at the screen edge (0.3 ≈ 17°)."
                        />
                        <Slider
                            label="pitch at the edge"
                            value={p.pitch}
                            min={0}
                            max={0.8}
                            step={0.01}
                            onChange={(v) => set('pitch', v)}
                            format={(v) => `${v.toFixed(2)} rad`}
                            help="Up / down tilt (0.15)."
                        />
                        <Slider label="follow λ" value={p.lambda} min={0.5} max={20} step={0.1} onChange={(v) => set('lambda', v)} help="How fast the camera catches the pointer (4: a soft trail)." />
                    </Group>
                    <Group title="Lens shift">
                        <Slider
                            label="subject x"
                            value={p.lensX}
                            min={200}
                            max={1720}
                            step={1}
                            onChange={(v) => set('lensX', v)}
                            format={(v) => `${v} px`}
                            help="Where the pivot sits, in 1920 px reference space (hero cob: 1050)."
                        />
                        <Slider label="subject y" value={p.lensY} min={150} max={850} step={1} onChange={(v) => set('lensY', v)} format={(v) => `${v} px`} help="(hero cob: 548)." />
                    </Group>
                    <Toggle label="director view" checked={p.director} onChange={(v) => set('director', v)} help="A second camera filming the first: see its frustum swing." />
                    <Toggle label="auto move" checked={p.auto} onChange={(v) => set('auto', v)} help="Moves on its own while no pointer is over the stage." />
                </>
            }
        >
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
                <div ref={host} className="absolute inset-0" />
                {p.director ? (
                    <div className="pointer-events-none absolute bottom-[10px] right-[10px] aspect-[1/0.66] w-[32%] rounded-sm border border-[rgba(85,255,194,0.5)]" aria-hidden>
                        <span className="cl-mono absolute left-1.5 top-1 text-[9.5px] uppercase text-[var(--cl-mint)]">director camera</span>
                    </div>
                ) : null}
                <div ref={cross} className="pointer-events-none absolute size-10 -translate-x-1/2 -translate-y-1/2" style={{ left: '54.7%', top: '55.1%' }} aria-hidden>
                    <span className="absolute left-1/2 top-0 h-full w-px bg-[var(--cl-warn)] opacity-80" />
                    <span className="absolute left-0 top-1/2 h-px w-full bg-[var(--cl-warn)] opacity-80" />
                </div>
            </div>
        </Demo>
    );
}
