'use client';
/* This harness owns its Three.js objects; mutable frame state avoids React renders. */

import { type RefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { heroTiles } from '../../FloemaTwo/data';

import { gsap } from './runtime';
export type StageParams = Record<string, number | boolean | string>;
export default function ThreeStage({ mode, params, playing }: { mode: 'hero' | 'material' | 'budget'; params: RefObject<StageParams>; playing: boolean }) {
    const host = useRef<HTMLDivElement>(null);
    const run = useRef(playing);
    useEffect(() => {
        run.current = playing;
    }, [playing]);
    useEffect(() => {
        const el = host.current;
        if (!el) return;
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance', stencil: false });
        } catch {
            el.dataset.failed = 'true';
            return;
        }
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NeutralToneMapping;
        renderer.domElement.setAttribute('aria-hidden', 'true');
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(mode === 'hero' ? 35 : 40, 1, 0.1, 100);
        camera.position.z = mode === 'hero' ? 20 : 6;
        const owned: { dispose: () => void }[] = [];
        const group = new THREE.Group();
        scene.add(group);
        const cards: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
        const basic = new THREE.MeshBasicMaterial({ color: '#a9d9df' });
        const geometry = mode === 'hero' ? new THREE.PlaneGeometry(1, 1) : new RoundedBoxGeometry(1.6, 1.6, 1.6, 3, 0.12);
        const material = new THREE.MeshStandardMaterial({ color: '#827a6a', roughness: 0.85, metalness: 0.08 });
        owned.push(basic, geometry, material);
        let instances: THREE.InstancedMesh | undefined;
        let cube: THREE.Mesh | undefined;
        const many: THREE.Mesh[] = [];
        const matrix = new THREE.Matrix4();
        if (mode === 'hero') {
            const tones = ['#9cb5a4', '#c2b59a', '#99b9c5', '#d6caa5', '#9bafa9'];
            heroTiles.forEach((_, i) => {
                const canvas = document.createElement('canvas');
                canvas.width = 128;
                canvas.height = 192;
                const c = canvas.getContext('2d')!;
                c.fillStyle = tones[i % tones.length];
                c.fillRect(0, 0, 128, 192);
                c.strokeStyle = '#263b36';
                c.lineWidth = 5;
                c.strokeRect(26, 35, 76, 96);
                c.beginPath();
                c.moveTo(35, 134);
                c.lineTo(35, 164);
                c.moveTo(95, 134);
                c.lineTo(95, 164);
                c.moveTo(21, 104);
                c.lineTo(107, 104);
                c.stroke();
                c.fillStyle = '#e9e7d9';
                c.beginPath();
                c.arc(65, 64, 14, 0, Math.PI * 2);
                c.fill();
                const texture = new THREE.CanvasTexture(canvas);
                texture.colorSpace = THREE.SRGBColorSpace;
                const m = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
                const card = new THREE.Mesh(geometry as THREE.PlaneGeometry, m);
                cards.push(card);
                group.add(card);
                owned.push(texture, m);
            });
        } else if (mode === 'material') {
            const grain = document.createElement('canvas');
            grain.width = grain.height = 128;
            const ctx = grain.getContext('2d')!;
            const pixels = ctx.createImageData(128, 128);
            for (let i = 0; i < pixels.data.length; i += 4) {
                const noise = Math.sin(i * 0.173) * Math.cos(i * 0.071);
                pixels.data[i] = 128 + noise * 52;
                pixels.data[i + 1] = 128 + Math.sin(i * 0.097) * 52;
                pixels.data[i + 2] = 245;
                pixels.data[i + 3] = 255;
            }
            ctx.putImageData(pixels, 0, 0);
            const normal = new THREE.CanvasTexture(grain);
            normal.colorSpace = THREE.NoColorSpace;
            normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
            normal.repeat.set(3, 3);
            material.normalMap = normal;
            owned.push(normal);
            cube = new THREE.Mesh(geometry, material);
            group.add(cube);
            cube.rotation.set(0.4, -0.5, -0.3);
            const room = new RoomEnvironment();
            const pmrem = new THREE.PMREMGenerator(renderer);
            const env = pmrem.fromScene(room, 0.04);
            scene.environment = env.texture;
            scene.environmentIntensity = 0.8;
            room.dispose();
            pmrem.dispose();
            owned.push(env);
            scene.add(new THREE.AmbientLight('#ffffff', 0.25));
            const light = new THREE.DirectionalLight('#ffffff', 0.45);
            light.position.set(4, 6, 10);
            scene.add(light);
        } else {
            instances = new THREE.InstancedMesh(geometry, basic, 300);
            owned.push(instances);
            group.add(instances);
            for (let i = 0; i < 300; i++) {
                const x = ((i % 15) - 7) * 0.31,
                    y = (Math.floor(i / 15) - 9.5) * 0.24;
                matrix.makeScale(0.12, 0.12, 0.12);
                matrix.setPosition(x, y, 0);
                instances.setMatrixAt(i, matrix);
                const mesh = new THREE.Mesh(geometry, basic);
                mesh.scale.setScalar(0.12);
                mesh.position.set(x, y, 0);
                many.push(mesh);
                group.add(mesh);
            }
            instances.instanceMatrix.needsUpdate = true;
        }
        let visible = false,
            lost = false,
            w = 1,
            h = 1,
            lastParams: StageParams | null = null,
            dirty = true,
            frameCount = 0,
            elapsed = 0,
            deltaTotal = 0,
            deltaFrames = 0;
        const travel = { distance: 0, speed: 1.4 };
        const drag = { down: false, x: 0, y: 0, rx: 0, ry: 0 };
        const size = new THREE.Vector3();
        const resize = new ResizeObserver(([entry]) => {
            w = entry.contentRect.width;
            h = entry.contentRect.height;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            dirty = true;
        });
        resize.observe(el);
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) dirty = true;
        });
        observer.observe(el);
        const down = (event: PointerEvent) => {
            if (mode !== 'material') return;
            drag.down = true;
            drag.x = event.clientX;
            drag.y = event.clientY;
            el.setPointerCapture(event.pointerId);
        };
        const move = (event: PointerEvent) => {
            if (!drag.down) return;
            drag.ry += (event.clientX - drag.x) * 0.008;
            drag.rx += (event.clientY - drag.y) * 0.008;
            drag.x = event.clientX;
            drag.y = event.clientY;
            dirty = true;
        };
        const up = () => {
            drag.down = false;
        };
        const key = (event: KeyboardEvent) => {
            if (mode !== 'material' || !event.key.startsWith('Arrow')) return;
            event.preventDefault();
            if (event.key === 'ArrowLeft') drag.ry -= 0.3;
            if (event.key === 'ArrowRight') drag.ry += 0.3;
            if (event.key === 'ArrowUp') drag.rx -= 0.3;
            if (event.key === 'ArrowDown') drag.rx += 0.3;
            dirty = true;
        };
        const loss = (event: Event) => {
            event.preventDefault();
            lost = true;
            el.dataset.failed = 'true';
            delete el.dataset.ready;
        };
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('keydown', key);
        renderer.domElement.addEventListener('webglcontextlost', loss);
        const tick = (_: number, ms: number) => {
            if (!visible || document.hidden || lost) return;
            const p = params.current;
            const changed = p !== lastParams;
            if (!run.current && !dirty && !changed) return;
            const dt = Math.min(ms / 1000, 0.05);
            elapsed += run.current ? dt : 0;
            if (changed) {
                renderer.setPixelRatio(Math.min(Number(p.dpr || 1.5), 2.5));
                renderer.setSize(w, h, false);
                camera.fov = Number(p.fov || (mode === 'hero' ? 35 : 40));
                camera.updateProjectionMatrix();
                lastParams = p;
            }
            if (mode === 'hero') {
                const target = Number(p.speed) + Number(p.velocity) * Number(p.boost);
                travel.speed = THREE.MathUtils.damp(travel.speed, target, 5, dt);
                if (run.current) travel.distance += travel.speed * dt;
                // Keep the composition's world dimensions fixed while the reader changes the lens.
                const vh = 2 * Math.tan(THREE.MathUtils.degToRad(35 / 2)) * 20;
                size.set(vh * camera.aspect, vh, 0);
                cards.forEach((card, i) => {
                    const tile = heroTiles[i],
                        initial = 30 - (0.1 + tile.depth * 0.5) * 26,
                        distance = 30 - ((30 - initial + travel.distance) % 26),
                        projection = initial / 20;
                    card.position.set((tile.x / 100 - 0.5) * size.x * projection, (0.5 - tile.y / 100) * size.y * projection, 20 - distance);
                    card.scale.set((tile.w / 100) * size.x * projection, (tile.h / 100) * size.y * projection, 1);
                    card.material.opacity = Math.min(1, (30 - distance) / 3, (distance - 4) / 2) * Math.min(1, tile.depth + 0.25);
                });
            } else if (cube) {
                material.roughness = Number(p.roughness);
                material.metalness = Number(p.metalness);
                material.normalScale.setScalar(Number(p.normal || 0));
                material.color.set(String(p.color));
                cube.rotation.set(0.4 + drag.rx, -0.5 + drag.ry + elapsed * 0.11, -0.3);
            } else if (instances) {
                const n = Number(p.count);
                instances.visible = Boolean(p.instanced);
                instances.count = n;
                if (changed || dirty) {
                    const columns = Math.ceil(Math.sqrt(n));
                    const rows = Math.ceil(n / columns);
                    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
                    group.scale.setScalar(Math.min(1, (vh * 0.8) / (rows * 0.36), (vh * camera.aspect * 0.8) / (columns * 0.36)));
                    for (let i = 0; i < n; i++) {
                        const x = ((i % columns) - (columns - 1) / 2) * 0.36;
                        const y = ((rows - 1) / 2 - Math.floor(i / columns)) * 0.36;
                        many[i].position.set(x, y, 0);
                        matrix.makeScale(0.12, 0.12, 0.12);
                        matrix.setPosition(x, y, 0);
                        instances.setMatrixAt(i, matrix);
                    }
                    instances.instanceMatrix.needsUpdate = true;
                    instances.computeBoundingSphere();
                }
                many.forEach((mesh, i) => {
                    mesh.visible = !p.instanced && i < n;
                });
                group.rotation.y = run.current ? Math.sin(elapsed * 0.4) * 0.3 : 0;
            }
            renderer.render(scene, camera);
            dirty = false;
            frameCount++;
            el.dataset.frames = String(frameCount);
            el.dataset.calls = String(renderer.info.render.calls);
            el.dataset.geometries = String(renderer.info.memory.geometries);
            el.dataset.textures = String(renderer.info.memory.textures);
            el.dataset.ready = 'true';
            if (run.current) {
                deltaTotal += ms;
                deltaFrames++;
                if (deltaFrames >= 20) {
                    const out = el.parentElement?.querySelector('[data-gpu-readout]');
                    if (out) out.textContent = `${(deltaTotal / deltaFrames).toFixed(1)} ms / ${renderer.info.render.calls} draw calls`;
                    deltaTotal = 0;
                    deltaFrames = 0;
                }
            }
        };
        gsap.ticker.add(tick);
        return () => {
            gsap.ticker.remove(tick);
            resize.disconnect();
            observer.disconnect();
            el.removeEventListener('pointerdown', down);
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerup', up);
            el.removeEventListener('pointercancel', up);
            el.removeEventListener('keydown', key);
            renderer.domElement.removeEventListener('webglcontextlost', loss);
            scene.environment = null;
            owned.forEach((resource) => resource.dispose());
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        };
    }, [mode, params]);
    return (
        <div
            className="f2l-three-stage"
            ref={host}
            tabIndex={mode === 'material' ? 0 : undefined}
            role={mode === 'material' ? 'group' : undefined}
            aria-label={mode === 'material' ? 'Rotate cube: drag or use arrow keys.' : undefined}
        >
            <div className="f2l-three-fallback">
                <div className="f2l-fallback-cube">◇</div>
                <p>Preparing the scene…</p>
                <span>3D unavailable? The diagrams and controls still explain the technique.</span>
            </div>
        </div>
    );
}
