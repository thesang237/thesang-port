'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Slider } from '../kit/controls';
import { useParams, useThreeCanvas } from '../kit/loop';

import { createSnow } from './crystal';
import { FOG } from './iglooScene';

const DEFAULTS = { count: 2200, speed: 0.55, size: 2.2, wind: 0, sway: 1, opacity: 0.85 };

/** Thousands of flakes, zero JavaScript per flake: all motion is in the vertex shader. */
export default function GpuSnow() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);

    useThreeCanvas(host, ({ renderer }) => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#9aa5b4');
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.set(0, 4, 14);
        camera.lookAt(0, 4, 0);
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: FOG }));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        scene.add(ground);
        let snow = createSnow(DEFAULTS.count, [26, 14, 26]);
        snow.position.set(0, 5, 0);
        scene.add(snow);
        let count = DEFAULTS.count;
        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            frame: (t) => {
                const P = ref.current;
                if (P.count !== count) {
                    count = P.count;
                    scene.remove(snow);
                    snow.geometry.dispose();
                    (snow.material as THREE.Material).dispose();
                    snow = createSnow(count, [26, 14, 26]);
                    snow.position.set(0, 5, 0);
                    scene.add(snow);
                }
                const u = (snow.material as THREE.ShaderMaterial).uniforms;
                u.uTime.value = t;
                u.uSpeed.value = P.speed;
                u.uSize.value = P.size;
                u.uWind.value = P.wind;
                u.uSway.value = P.sway;
                u.uOpacity.value = P.opacity;
                renderer.render(scene, camera);
            },
            dispose: () => {
                snow.geometry.dispose();
                (snow.material as THREE.Material).dispose();
                ground.geometry.dispose();
                (ground.material as THREE.Material).dispose();
            },
        };
    });

    return (
        <Demo
            title="GPU snow — points + a vertex shader"
            hint="Push count to 20,000: it stays smooth, because JavaScript only updates one number (time) per frame."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="count"
                        value={p.count}
                        min={100}
                        max={20000}
                        step={100}
                        onChange={(v) => set('count', v)}
                        help="Igloo: 2,200 in the valley, 900 among the crystals, 260 in the colony."
                    />
                    <Slider label="fall speed" value={p.speed} min={0} max={3} onChange={(v) => set('speed', v)} />
                    <Slider label="flake size" value={p.size} min={0.5} max={8} step={0.1} onChange={(v) => set('size', v)} help="Divided by depth: far flakes are smaller (perspective)." />
                    <Slider label="wind" value={p.wind} min={-4} max={4} step={0.05} onChange={(v) => set('wind', v)} />
                    <Slider label="sway" value={p.sway} min={0} max={3} onChange={(v) => set('sway', v)} help="Each flake’s own sine wobble, phase-shifted by its seed." />
                    <Slider label="opacity" value={p.opacity} min={0} max={1} onChange={(v) => set('opacity', v)} />
                </>
            }
        >
            <div ref={host} className="h-[380px] sm:h-[440px]" />
        </Demo>
    );
}
