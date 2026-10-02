'use client';

/**
 * /kpr?debug=glb&name=landing — renders one painted GLB from its own camera, unlit, with pointer
 * parallax and an optional `p` (camera clip progress). `?solo=<node>` shows one plane only;
 * `?wire` outlines every mesh. Temporary study tool (see NOTES.md "GLB scenes").
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { disposeKtx2, getGltfLoader } from '../gl/loaders';

export default function GlbDebug() {
    const host = useRef<HTMLDivElement>(null);
    const [info, setInfo] = useState('loading…');

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const q = new URLSearchParams(window.location.search);
        const name = q.get('name') ?? 'landing';
        const solo = q.get('solo');
        const wire = q.has('wire');
        const p = Number(q.get('p') ?? 0);
        const amt = Number(q.get('amt') ?? 1);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(innerWidth, innerHeight);
        el.appendChild(renderer.domElement);
        (window as unknown as { __kprGL: unknown }).__kprGL = renderer;
        const scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(23, innerWidth / innerHeight, 0.1, 1000);
        let mixer: THREE.AnimationMixer | null = null;
        let dur = 1;
        let rig: THREE.Object3D | null = null;
        const base = new THREE.Vector3();
        const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
        let raf = 0;
        let alive = true;

        getGltfLoader(renderer).load(`/kpr/glb/${name}-2048.glb`, (glb) => {
            if (!alive) return;
            scene.add(glb.scene);
            const lines: string[] = [];
            glb.scene.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh) return;
                const order = Number(m.userData?.order ?? 6);
                m.renderOrder = 100 - order;
                m.frustumCulled = false;
                const src = m.material as THREE.MeshStandardMaterial;
                const map = src.map ?? src.emissiveMap;
                if (map) map.colorSpace = THREE.SRGBColorSpace;
                m.material = new THREE.MeshBasicMaterial({
                    map,
                    color: map ? 0xffffff : 0xff00ff,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    alphaTest: 0.002,
                    wireframe: wire,
                    opacity: map ? 1 : 0.25,
                });
                if (solo && !m.name.includes(solo)) m.visible = false;
                const box = new THREE.Box3().setFromObject(m);
                lines.push(
                    `${order.toString().padStart(2)} ${m.name.padEnd(28)} tex:${map ? `${(map.image as { width: number }).width}×${(map.image as { height: number }).height}` : '—'} z:${((box.min.z + box.max.z) / 2).toFixed(2)}`,
                );
            });
            lines.sort();
            if (glb.cameras[0]) camera = glb.cameras[0] as THREE.PerspectiveCamera;
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            rig = camera.parent ?? camera;
            base.copy(rig.position);
            if (glb.animations[0]) {
                mixer = new THREE.AnimationMixer(glb.scene);
                mixer.clipAction(glb.animations[0]).play();
                dur = glb.animations[0].duration;
            }
            setInfo(`${name}: fov ${camera.fov.toFixed(1)}° · clip ${glb.animations[0]?.name ?? 'none'} ${dur.toFixed(2)}s\n${lines.join('\n')}`);
        });

        const onMove = (e: PointerEvent) => {
            ptr.x = (e.clientX / innerWidth) * 2 - 1;
            ptr.y = -((e.clientY / innerHeight) * 2 - 1);
        };
        window.addEventListener('pointermove', onMove);
        (window as unknown as { __kprPtr: typeof ptr }).__kprPtr = ptr;

        const loop = () => {
            raf = requestAnimationFrame(loop);
            ptr.sx += (ptr.x - ptr.sx) * 0.08;
            ptr.sy += (ptr.y - ptr.sy) * 0.08;
            if (mixer) mixer.setTime(Math.min(dur - 1e-3, p * dur));
            if (rig) {
                if (!mixer) rig.position.copy(base);
                rig.position.x += ptr.sx * 0.05 * amt;
                rig.position.y += ptr.sy * 0.03 * amt;
            }
            renderer.render(scene, camera);
        };
        loop();

        return () => {
            alive = false;
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove);
            renderer.dispose();
            renderer.domElement.remove();
            disposeKtx2();
        };
    }, []);

    return (
        <div ref={host} style={{ position: 'fixed', inset: 0, background: '#111' }}>
            <pre style={{ position: 'absolute', left: 8, top: 8, margin: 0, font: '11px/1.35 monospace', color: '#c6ff3d', textShadow: '0 0 3px #000', pointerEvents: 'none', zIndex: 1 }}>{info}</pre>
        </div>
    );
}
