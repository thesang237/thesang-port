'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { Btn, ColorInput, Demo, Group, Slider, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { disposeTree, useParams, useThreeCanvas } from '../kit/loop';
import { clamp, damp, easeInOutCubic, easeOutCubic, lerp, smoothstep } from '../kit/math';

import { createSnow } from './crystal';
import { buildBricks, CAM, createBrickMesh, ENTRANCE, FOG, R, TH } from './iglooScene';

// defaults = tweaks.ts → iglooParams (the shipped look)
const DEFAULTS = {
    intro: 1,
    explode: 0,
    lift: 0.5,
    reach: 1.15,
    tilt: 0.45,
    response: 7,
    color: '#5c6470',
    roughness: 0.88,
    light: 22,
    flicker: 0.06,
    seams: 1.1,
    core: 2.2,
    follow: true,
};

/**
 * The act-0 igloo, rebuilt: 150 instanced bricks, one draw call. Every brick
 * reads two dials (intro, explode) through its own delay window, and lifts
 * away from the cursor using an analytic ray–sphere hit.
 */
export default function MiniIgloo() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(host, ({ renderer, pointer, host: el }) => {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(FOG);
        const fog = new THREE.FogExp2(FOG, 0.03);
        scene.fog = fog;
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
        scene.environment = env;
        scene.environmentIntensity = 0.35;
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

        // ground: a soft snowy disc
        const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: '#c9d0da', roughness: 1 }));
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const hemi = new THREE.HemisphereLight('#dfe6ef', '#5d6574', 0.8);
        const sun = new THREE.DirectionalLight('#fbfcff', 1.8);
        sun.position.set(-7, 9, 5);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.bias = -0.0004;
        sun.shadow.normalBias = 0.02;
        Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
        scene.add(hemi, sun);

        const bricks = buildBricks();
        const mesh = createBrickMesh(bricks);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        scene.add(mesh);

        // the real light inside, casting light through the gaps
        const inner = new THREE.PointLight('#d9ecff', 0, 7, 2);
        inner.castShadow = true;
        inner.shadow.mapSize.set(512, 512);
        inner.shadow.bias = -0.002;
        inner.shadow.normalBias = 0.07;
        inner.shadow.camera.near = 0.05;
        // its visible core: tiny, HDR white (colour > 1, not tone mapped)
        const core = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ toneMapped: false }));
        // dim shell just behind the bricks so the seams read as light
        const shell = new THREE.Mesh(new THREE.SphereGeometry(R - TH * 0.62, 48, 32), new THREE.MeshBasicMaterial({ toneMapped: false }));
        const tunnel = new THREE.Group();
        tunnel.rotation.y = ENTRANCE;
        const tunnelGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.66 - TH * 0.55, 0.66 - TH * 0.55, 1.26, 24, 1), new THREE.MeshBasicMaterial({ toneMapped: false }));
        tunnelGlow.position.set(0, 0.26, R + 0.28);
        tunnelGlow.rotation.x = Math.PI / 2;
        tunnel.add(tunnelGlow);
        scene.add(inner, core, shell, tunnel);

        const snow = createSnow(1400, [26, 14, 26], { speed: 0.55, pointSize: 2.2, opacity: 0.85 });
        snow.position.set(0, 5, 0);
        scene.add(snow);

        // temps reused every frame — no allocations in the loop
        const tmp = {
            m: new THREE.Matrix4(),
            p: new THREE.Vector3(),
            q: new THREE.Quaternion(),
            q2: new THREE.Quaternion(),
            s: new THREE.Vector3(),
            c: new THREE.Color(),
            ray: new THREE.Raycaster(),
            ndc: new THREE.Vector2(),
            hit: new THREE.Vector3(),
            target: new THREE.Vector3(),
            axis: new THREE.Vector3(),
            side: new THREE.Vector3(),
            hover: new Float32Array(bricks.length),
            hoverAmt: 0,
            sx: 0,
            sy: 0,
        };

        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            frame: (time, dt) => {
                const P = ref.current;
                const intro = P.intro;
                const explode = P.explode;

                // camera: hero position, rises with the explosion (like heroCam)
                tmp.sx = damp(tmp.sx, pointer.over ? pointer.x : 0, 3.5, dt);
                tmp.sy = damp(tmp.sy, pointer.over ? pointer.y : 0, 3.5, dt);
                const ei = easeInOutCubic(clamp((intro - 0.25) / 0.75));
                const rise = P.follow ? easeInOutCubic(clamp(explode * 1.1)) : 0;
                tmp.p.copy(CAM.INTRO_POS).lerp(CAM.HERO_POS, ei).lerp(CAM.RISE_POS, rise);
                tmp.target.copy(CAM.HERO_TARGET).lerp(CAM.RISE_TARGET, rise);
                camera.position.set(tmp.p.x + tmp.sx * 0.55, tmp.p.y + tmp.sy * 0.3 + Math.sin(time * 0.3) * 0.04, tmp.p.z);
                camera.lookAt(tmp.target);
                camera.fov = lerp(lerp(38, 30, ei), 44, rise);
                camera.updateProjectionMatrix();
                fog.density = lerp(lerp(0.2, 0.021, clamp(intro * 1.4)), 0.06, explode);

                // pointer → dome hit: analytic ray/sphere, far cheaper than raycasting 150 bricks
                tmp.ndc.set(pointer.x, pointer.y);
                tmp.ray.setFromCamera(tmp.ndc, camera);
                const o = tmp.ray.ray.origin;
                const d = tmp.ray.ray.direction;
                const b = o.dot(d);
                const c = o.lengthSq() - R * R;
                const disc = b * b - c;
                const hasHit = pointer.over && disc > 0 && intro > 0.95 && explode < 0.05;
                if (hasHit) tmp.hit.copy(o).addScaledVector(d, -b - Math.sqrt(disc));
                tmp.hoverAmt = damp(tmp.hoverAmt, hasHit ? 1 : 0, 5, dt);
                mat.color.set(P.color);
                mat.roughness = P.roughness;

                for (let i = 0; i < bricks.length; i++) {
                    const br = bricks[i];
                    // intro: fly in bottom → top
                    const delayIn = br.h01 * 0.5 + br.rand * 0.14;
                    const pin = easeOutCubic(clamp((intro - 0.12 - delayIn * 0.5) / 0.42));
                    tmp.p.copy(br.start).lerp(br.pos, pin);
                    tmp.q.copy(br.startQuat).slerp(br.quat, pin);

                    // hover: lift away from the cursor, tilt open, drift
                    const hw = hasHit ? smoothstep(P.reach, 0.0, br.pos.distanceTo(tmp.hit)) : 0;
                    tmp.hover[i] = damp(tmp.hover[i], hw, P.response, dt);
                    const h = tmp.hover[i];
                    if (h > 0.001) {
                        tmp.axis.set(1, 0, 0).applyQuaternion(br.quat);
                        tmp.side.set(0, 1, 0).applyQuaternion(br.quat);
                        tmp.p.addScaledVector(br.normal, h * P.lift * (0.75 + br.rand * 0.5));
                        tmp.p.addScaledVector(tmp.axis, h * P.lift * 0.22 * (br.rand - 0.5));
                        tmp.p.addScaledVector(tmp.side, h * P.lift * 0.12 * Math.sin(time * 1.3 + br.rand * 6.28));
                        tmp.q2.setFromAxisAngle(tmp.axis, h * P.tilt * (0.6 + br.rand * 0.8));
                        tmp.q.premultiply(tmp.q2);
                    }

                    // scroll: explode top → bottom
                    const delayOut = (1 - br.h01) * 0.42 + br.rand * 0.12;
                    const pe = clamp((explode - delayOut) / 0.46);
                    if (pe > 0) {
                        const e = pe * pe * (3 - 2 * pe);
                        tmp.p.addScaledVector(br.fly, e);
                        tmp.q2.setFromAxisAngle(br.spinAxis, e * (2 + br.rand * 4));
                        tmp.q.premultiply(tmp.q2);
                    }

                    tmp.s.copy(br.scale).multiplyScalar(pin < 0.02 ? 0.0001 : lerp(0.6, 1, pin));
                    tmp.m.compose(tmp.p, tmp.q, tmp.s);
                    mesh.setMatrixAt(i, tmp.m);
                    const glow = 1 + h * 0.35;
                    tmp.c.setRGB(glow, glow, glow * 1.02);
                    mesh.setColorAt(i, tmp.c);
                }
                mesh.instanceMatrix.needsUpdate = true;
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

                // light
                const on = easeOutCubic(clamp((intro - 0.35) / 0.4));
                const lift = easeInOutCubic(clamp((explode - 0.25) / 0.75));
                const coreY = 0.55 + lift * 1.1;
                const flicker = 1 + (Math.sin(time * 11.3) * 0.5 + Math.sin(time * 6.7 + 1.3) * 0.5) * P.flicker;
                inner.position.set(0, coreY, 0);
                inner.intensity = P.light * on * flicker * (1 + explode * 0.5 + tmp.hoverAmt * 0.35);
                inner.distance = 7 * (1 + explode * 0.6);
                core.position.set(0, coreY, 0);
                core.scale.setScalar(Math.max(0.16 * on * (1 + lift * 0.8), 0.0001));
                (core.material as THREE.MeshBasicMaterial).color.set('#d9ecff').multiplyScalar(P.core * (1 + explode * 1.5));
                const k = on * (1 - smoothstep(0.0, 0.25, explode));
                shell.visible = k > 0.001 && P.seams > 0;
                shell.scale.setScalar(Math.max(k, 0.0001));
                (shell.material as THREE.MeshBasicMaterial).color.set('#d9ecff').multiplyScalar(P.seams * flicker);
                tunnelGlow.scale.setScalar((clamp((intro - 0.5) / 0.3) + 0.0001) * (1 - smoothstep(0, 0.35, explode)) + 0.0001);
                (tunnelGlow.material as THREE.MeshBasicMaterial).color.set('#d9ecff').multiplyScalar(1.5 * flicker);

                (snow.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
                el.style.cursor = hasHit ? 'pointer' : '';
                renderer.render(scene, camera);
            },
            dispose: () => {
                disposeTree(scene);
                env.dispose();
            },
        };
    });

    const tweenTo = (key: 'intro' | 'explode', from: number, to: number, duration: number, ease: string) => {
        const o = { v: from };
        gsap.to(o, { v: to, duration, ease, onUpdate: () => set(key, o.v) });
    };

    return (
        <Demo
            title="Mini igloo — instanced, procedural, interactive"
            hint="Hover the dome: bricks lift and light leaks out. Then drag explode — or play the intro and the explosion."
            onReset={reset}
            controls={
                <>
                    <Group title="Timeline dials">
                        <Slider label="intro" value={p.intro} min={0} max={1} step={0.001} onChange={(v) => set('intro', v)} help="0 = scattered debris, 1 = built. Each brick waits for its height." />
                        <Slider label="explode" value={p.explode} min={0} max={1} step={0.001} onChange={(v) => set('explode', v)} help="The scroll dial. Top bricks go first." />
                        <div className="flex flex-wrap gap-2">
                            <Btn
                                primary
                                onClick={() => {
                                    set('explode', 0);
                                    tweenTo('intro', 0, 1, 4.8, 'sine.inOut');
                                }}
                            >
                                ▶ Intro
                            </Btn>
                            <Btn onClick={() => tweenTo('explode', 0, 1, 2.2, 'power1.inOut')}>▶ Explode</Btn>
                            <Btn onClick={() => tweenTo('explode', p.explode, 0, 1.8, 'power2.inOut')}>↺ Rebuild</Btn>
                        </div>
                        <Toggle label="camera rises with explode" checked={p.follow} onChange={(v) => set('follow', v)} />
                    </Group>
                    <Group title="Hover (iglooParams)">
                        <Slider label="lift" value={p.lift} min={0} max={1.5} onChange={(v) => set('lift', v)} help="How far bricks move outward along their normal." />
                        <Slider label="reach" value={p.reach} min={0.2} max={2.5} step={0.05} onChange={(v) => set('reach', v)} help="Radius of influence around the cursor hit point." />
                        <Slider label="tilt" value={p.tilt} min={0} max={1.5} onChange={(v) => set('tilt', v)} help="Bricks hinge open, showing their lit inner faces." />
                        <Slider label="response" value={p.response} min={1} max={20} step={0.5} onChange={(v) => set('response', v)} help="damp λ. 7 = responsive but soft; 2 = lazy; 20 = snappy." />
                    </Group>
                    <Group title="Bricks & light">
                        <ColorInput label="brick colour" value={p.color} onChange={(v) => set('color', v)} />
                        <Slider label="roughness" value={p.roughness} min={0} max={1} onChange={(v) => set('roughness', v)} />
                        <Slider
                            label="inner light"
                            value={p.light}
                            min={0}
                            max={80}
                            step={0.5}
                            onChange={(v) => set('light', v)}
                            help="A real point light with shadows: lights brick inner faces and spills through the doorway."
                        />
                        <Slider label="flicker" value={p.flicker} min={0} max={0.5} onChange={(v) => set('flicker', v)} help="Two sine waves at 11.3 and 6.7 Hz — never repeats obviously." />
                        <Slider
                            label="seam backing"
                            value={p.seams}
                            min={0}
                            max={3}
                            step={0.05}
                            onChange={(v) => set('seams', v)}
                            help="Dim sphere behind the bricks. Turn to 0 and the gaps go dark."
                        />
                        <Slider label="core glow" value={p.core} min={0} max={8} step={0.05} onChange={(v) => set('core', v)} />
                    </Group>
                </>
            }
        >
            <div ref={host} className="h-[460px] sm:h-[560px]" />
        </Demo>
    );
}
