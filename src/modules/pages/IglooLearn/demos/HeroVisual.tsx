'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { useThreeCanvas } from '../kit/loop';
import { damp } from '../kit/math';

import { buildCrystalGeometry, createCrystalMaterial, createSnow } from './crystal';

/** Hero teaser: the ice crystal from chapter 07, with a HUD label pinned to it (chapter 10). */
export default function HeroVisual() {
    const host = useRef<HTMLDivElement>(null);
    const label = useRef<HTMLDivElement>(null);

    useThreeCanvas(
        host,
        ({ renderer, pointer, size, host: el }) => {
            renderer.setClearColor(0x000000, 0);
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
            camera.position.set(0, 0, 8.5);

            const crystal = new THREE.Mesh(buildCrystalGeometry(11), createCrystalMaterial());
            crystal.scale.setScalar(1);
            scene.add(crystal);

            const ticks = new THREE.BufferGeometry();
            const seg: number[] = [];
            for (let i = 0; i < 9; i++) {
                const a = (i / 9) * Math.PI * 2 + 0.3;
                const rad = 1.7 + (i % 3) * 0.25;
                const y = ((i * 37) % 10) / 10 - 0.5;
                seg.push(Math.cos(a) * rad, y * 2.6, Math.sin(a) * rad * 0.4, Math.cos(a) * rad + 0.4, y * 2.6 + 0.25, Math.sin(a) * rad * 0.4);
            }
            ticks.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
            const tickLines = new THREE.LineSegments(ticks, new THREE.LineBasicMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.45 }));
            scene.add(tickLines);

            const snow = createSnow(700, [12, 10, 6], { speed: 0.25, pointSize: 1.5, opacity: 0.55 });
            scene.add(snow);

            const mat = crystal.material;
            const ray = new THREE.Raycaster();
            const anchor = new THREE.Vector3();
            const smooth = { x: 0, y: 0, hover: 0 };
            const ndc = new THREE.Vector2();

            return {
                resize: (w, h) => {
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                },
                frame: (t, dt) => {
                    smooth.x = damp(smooth.x, pointer.over ? pointer.x : 0, 3.5, dt);
                    smooth.y = damp(smooth.y, pointer.over ? pointer.y : 0, 3.5, dt);
                    ray.setFromCamera(ndc.set(pointer.x, pointer.y), camera);
                    const hit = pointer.over && ray.intersectObject(crystal, false).length > 0;
                    smooth.hover = damp(smooth.hover, hit ? 1 : 0, 6, dt);
                    el.style.cursor = hit ? 'crosshair' : '';

                    crystal.rotation.set(0.15 + smooth.y * 0.25, t * 0.2 + smooth.x * 0.5, Math.sin(t * 0.25) * 0.05);
                    crystal.position.y = Math.sin(t * 0.6) * 0.08;
                    tickLines.rotation.copy(crystal.rotation);
                    camera.position.set(smooth.x * 0.5, smooth.y * 0.35, 8.5);
                    camera.lookAt(0, 0, 0);

                    const u = mat.uniforms;
                    u.uTime.value = t;
                    u.uGlitch.value = smooth.hover * 0.35;
                    u.uIrid.value = 0.35 + smooth.hover * 0.5;
                    u.uEdges.value = 0.5 + smooth.hover * 0.6;
                    (snow.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

                    // HUD: project a point beside the crystal to screen pixels
                    anchor.set(1.1, 1.3 + crystal.position.y, 0).project(camera);
                    if (label.current) {
                        const x = (anchor.x * 0.5 + 0.5) * size.w;
                        const y = (-anchor.y * 0.5 + 0.5) * size.h;
                        label.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
                    }
                    renderer.render(scene, camera);
                },
                dispose: () => {
                    crystal.geometry.dispose();
                    mat.dispose();
                    ticks.dispose();
                    (tickLines.material as THREE.Material).dispose();
                    snow.geometry.dispose();
                    (snow.material as THREE.Material).dispose();
                },
            };
        },
        [],
        { alpha: true },
    );

    return (
        <div className="relative size-full">
            <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(148,219,255,0.16),rgba(212,194,255,0.05)_45%,transparent_70%)] blur-2xl" />
            <div ref={host} className="absolute inset-0" />
            <div ref={label} className="il-mono pointer-events-none absolute left-0 top-0 text-[10.5px] leading-tight text-[var(--il-ink)] will-change-transform">
                <div className="-translate-y-full pb-2 pl-3">
                    <div className="text-[var(--il-ice)]">PORTFOLIO_CO_01</div>
                    <div>HOVER TO GLITCH</div>
                    <span className="mt-1 block h-px w-28 bg-current opacity-60" />
                </div>
            </div>
        </div>
    );
}
