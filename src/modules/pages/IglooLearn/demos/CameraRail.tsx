'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Btn, Demo, Group, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { disposeTree, useParams, useThreeCanvas } from '../kit/loop';
import { clamp, damp, easeInOutCubic, fitFov, lerp } from '../kit/math';

import { buildBricks, CAM, createBrickMesh, createTerrain, FOG } from './iglooScene';

const DEFAULTS = { intro: 1, rise: 0, parallax: true, portrait: false, director: true };

/**
 * The Igloo hero camera: three keyframe positions blended by two dials
 * (intro, heroCam). A second "director" camera films the first one.
 */
export default function CameraRail() {
    const host = useRef<HTMLDivElement>(null);
    const read = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(host, ({ renderer, pointer, size }) => {
        renderer.shadowMap.enabled = true;
        renderer.setScissorTest(false);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(FOG);
        const fog = new THREE.FogExp2(FOG, 0.021);
        scene.fog = fog;
        scene.add(createTerrain(140));
        scene.add(createBrickMesh(buildBricks()));
        scene.add(new THREE.HemisphereLight('#dfe6ef', '#5d6574', 0.9));
        const sun = new THREE.DirectionalLight('#fbfcff', 1.8);
        sun.position.set(-7, 9, 5);
        sun.castShadow = true;
        Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
        scene.add(sun);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3.1, 3.4), toneMapped: false }));
        glow.position.set(0, 0.55, 0);
        scene.add(glow);

        // the "real" camera we are animating
        const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
        const helper = new THREE.CameraHelper(cam);
        helper.visible = false;
        scene.add(helper);

        // path line through the three keyframes
        const pathGeo = new THREE.BufferGeometry().setFromPoints([CAM.INTRO_POS, CAM.HERO_POS, CAM.RISE_POS]);
        const path = new THREE.Line(pathGeo, new THREE.LineDashedMaterial({ color: '#2f6f9a', dashSize: 0.3, gapSize: 0.2, fog: false }));
        path.computeLineDistances();
        path.visible = false;
        scene.add(path);
        const keyGeo = new THREE.SphereGeometry(0.18, 12, 8);
        const keyMat = new THREE.MeshBasicMaterial({ color: '#2f6f9a', fog: false });
        const keys = [CAM.INTRO_POS, CAM.HERO_POS, CAM.RISE_POS].map((v) => {
            const m = new THREE.Mesh(keyGeo, keyMat);
            m.position.copy(v);
            m.visible = false;
            scene.add(m);
            return m;
        });

        // the director's view, looking at the whole set
        const director = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
        director.position.set(16, 12, 16);
        director.lookAt(0, 2.5, 4);

        const pos = new THREE.Vector3();
        const target = new THREE.Vector3();
        const sm = { x: 0, y: 0 };

        return {
            resize: (w, h) => {
                cam.aspect = w / h;
                cam.updateProjectionMatrix();
            },
            frame: (t, dt) => {
                const P = ref.current;
                const W = size.w;
                const H = size.h;
                // simulate a phone: render into a tall strip in the middle
                const vw = P.portrait ? Math.round(H * 0.5) : W;
                const vx = Math.round((W - vw) / 2);
                cam.aspect = vw / H;

                sm.x = damp(sm.x, P.parallax && pointer.over ? pointer.x : 0, 3.5, dt);
                sm.y = damp(sm.y, P.parallax && pointer.over ? pointer.y : 0, 3.5, dt);

                // ── exactly the IglooWorld camera maths ──
                const ei = easeInOutCubic(clamp((P.intro - 0.25) / 0.75));
                const rise = easeInOutCubic(P.rise);
                pos.copy(CAM.INTRO_POS).lerp(CAM.HERO_POS, ei).lerp(CAM.RISE_POS, rise);
                target.copy(CAM.HERO_TARGET).lerp(CAM.RISE_TARGET, rise);
                cam.position.set(pos.x + sm.x * 0.55, pos.y + sm.y * 0.3 + Math.sin(t * 0.3) * 0.04, pos.z);
                cam.lookAt(target);
                const fov = lerp(lerp(38, 30, ei), 44, rise);
                cam.fov = P.portrait ? fitFov(fov, cam.aspect) : fov;
                cam.updateProjectionMatrix();
                fog.density = lerp(lerp(0.2, 0.021, clamp(P.intro * 1.4)), 0.035, rise);

                // main view
                helper.visible = path.visible = false;
                keys.forEach((k) => {
                    k.visible = false;
                });
                renderer.setScissorTest(true);
                renderer.setViewport(0, 0, W, H);
                renderer.setScissor(0, 0, W, H);
                renderer.setClearColor('#0a0d13');
                renderer.clear();
                renderer.setViewport(vx, 0, vw, H);
                renderer.setScissor(vx, 0, vw, H);
                renderer.render(scene, cam);

                // director inset (picture in picture)
                if (P.director) {
                    const iw = Math.round(Math.min(W * 0.34, 300));
                    const ih = Math.round(iw * 0.66);
                    director.aspect = iw / ih;
                    director.updateProjectionMatrix();
                    helper.visible = path.visible = true;
                    keys.forEach((k) => {
                        k.visible = true;
                    });
                    helper.update();
                    const prevFog = scene.fog;
                    scene.fog = null;
                    renderer.setViewport(W - iw - 12, 12, iw, ih);
                    renderer.setScissor(W - iw - 12, 12, iw, ih);
                    renderer.render(scene, director);
                    scene.fog = prevFog;
                }
                renderer.setScissorTest(false);

                if (read.current) read.current.textContent = `pos (${cam.position.x.toFixed(1)}, ${cam.position.y.toFixed(1)}, ${cam.position.z.toFixed(1)})  ·  fov ${cam.fov.toFixed(1)}°`;
            },
            dispose: () => {
                disposeTree(scene);
                helper.dispose();
            },
        };
    });

    const playIntro = () => {
        const o = { v: 0 };
        set('rise', 0);
        gsap.to(o, { v: 1, duration: 4.8, ease: 'sine.inOut', onUpdate: () => set('intro', o.v) });
    };

    return (
        <Demo
            title="Camera rail — the hero camera, keyframed"
            hint="Drag intro and rise. The small inset is a “director” camera filming our camera: see it glide between the three blue keyframes."
            onReset={reset}
            controls={
                <>
                    <Group title="Dials (as in the timeline)">
                        <Slider
                            label="intro (loader → hero)"
                            value={p.intro}
                            min={0}
                            max={1}
                            step={0.001}
                            onChange={(v) => set('intro', v)}
                            help="Played by the loader over 4.8s with sine.inOut. Starts after 25% so the fog clears first."
                        />
                        <Btn onClick={playIntro}>▶ Play the intro</Btn>
                        <Slider
                            label="heroCam (rise on scroll)"
                            value={p.rise}
                            min={0}
                            max={1}
                            step={0.001}
                            onChange={(v) => set('rise', v)}
                            help="Scroll 0.2 → 1.9 screens. The camera rises above the dome while it explodes."
                        />
                    </Group>
                    <Group title="Extras">
                        <Toggle
                            label="pointer parallax"
                            checked={p.parallax}
                            onChange={(v) => set('parallax', v)}
                            help="Move over the view: ±0.55 units sideways, ±0.3 up, smoothed with damp(…, 3.5)."
                        />
                        <Toggle label="simulate portrait phone" checked={p.portrait} onChange={(v) => set('portrait', v)} help="fitFov() widens the lens on tall screens so the igloo isn’t cropped." />
                        <Toggle label="director inset" checked={p.director} onChange={(v) => set('director', v)} />
                    </Group>
                    <div ref={read} className="il-mono rounded-lg border border-[var(--il-line)] bg-black/25 p-2.5 text-[10.5px] tabular-nums text-[var(--il-dim)]" />
                </>
            }
        >
            <div className="relative">
                <div ref={host} className="h-[440px] sm:h-[520px]" />
                {p.director && (
                    <div className="il-mono pointer-events-none absolute bottom-3 right-3 aspect-[300/198] w-[min(34%,300px)] rounded-sm border border-white/50 text-[9.5px] text-white/80">
                        <span className="absolute -top-5 right-0 whitespace-nowrap">director view — blue dots = keyframes</span>
                    </div>
                )}
            </div>
        </Demo>
    );
}
