'use client';

/**
 * /corn?debug=model&name=cobb_test&tex=TOP_L&alpha=alpha — renders one glTF unlit with a chosen
 * texture (from /corn/tex/*.webp), orbit with drag. `&uv` draws the texture flat with the mesh's UV
 * wireframe on top, to see which part of an atlas a mesh uses. Study tool (see NOTES.md "Assets").
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function ModelDebug() {
    const host = useRef<HTMLDivElement>(null);
    const [info, setInfo] = useState('loading…');

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const q = new URLSearchParams(window.location.search);
        const name = q.get('name') ?? 'cobb_test';
        const texName = q.get('tex');
        const alphaName = q.get('alpha');
        const uvMode = q.has('uv');
        const solo = q.get('solo');

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(innerWidth, innerHeight);
        renderer.setClearColor(0x303030);
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = uvMode ? new THREE.OrthographicCamera(-0.05, 1.05, 1.05, -0.05, -1, 1) : new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 5000);
        const controls = uvMode ? null : new OrbitControls(camera, renderer.domElement);
        const texLoader = new THREE.TextureLoader();
        const loadTex = (n: string | null) => {
            if (!n) return null;
            const t = texLoader.load(`/corn/tex/${n}.webp`);
            t.colorSpace = THREE.SRGBColorSpace;
            t.flipY = false;
            return t;
        };
        const map = loadTex(texName);
        const alphaMap = loadTex(alphaName);
        if (alphaMap) alphaMap.colorSpace = THREE.NoColorSpace;
        let raf = 0;

        new GLTFLoader().load(`/corn/models/${name}.gltf`, (gltf) => {
            const lines: string[] = [];
            const meshes: THREE.Mesh[] = [];
            gltf.scene.traverse((o) => {
                const m = o as THREE.Mesh;
                if (!m.isMesh) return;
                const uv = m.geometry.getAttribute('uv');
                let u0 = 1,
                    v0 = 1,
                    u1 = 0,
                    v1 = 0;
                for (let i = 0; uv && i < uv.count; i++) {
                    u0 = Math.min(u0, uv.getX(i));
                    u1 = Math.max(u1, uv.getX(i));
                    v0 = Math.min(v0, uv.getY(i));
                    v1 = Math.max(v1, uv.getY(i));
                }
                // world-space bounds (skinned meshes: posed by their bones)
                gltf.scene.updateMatrixWorld(true);
                const sk = m as THREE.SkinnedMesh;
                if (sk.isSkinnedMesh) sk.computeBoundingBox();
                else m.geometry.computeBoundingBox();
                const wb = (sk.isSkinnedMesh ? sk.boundingBox! : m.geometry.boundingBox!).clone().applyMatrix4(m.matrixWorld);
                const f = (v: THREE.Vector3) =>
                    v
                        .toArray()
                        .map((n) => n.toFixed(2))
                        .join(',');
                lines.push(`${m.name} uv ${u0.toFixed(2)}–${u1.toFixed(2)} × ${v0.toFixed(2)}–${v1.toFixed(2)}  world ${f(wb.min)} → ${f(wb.max)}`);
                if (solo && m.name !== solo) m.visible = false;
                meshes.push(m);
                m.material = new THREE.MeshBasicMaterial({
                    map,
                    alphaMap,
                    color: map ? 0xffffff : 0x88cc66,
                    transparent: !!alphaMap,
                    alphaTest: alphaMap ? 0.3 : 0,
                    side: THREE.DoubleSide,
                    wireframe: !map,
                });
            });
            if (uvMode) {
                const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: loadTex(texName) }));
                quad.position.set(0.5, 0.5, -0.5);
                (quad.material as THREE.MeshBasicMaterial).map!.flipY = true;
                scene.add(quad);
                // UV wireframe: position = uv (flipY false → v grows downward in image space)
                meshes.forEach((m, i) => {
                    if (!m.visible) return;
                    const g = m.geometry.clone();
                    const uv = g.getAttribute('uv');
                    const pos = new Float32Array(uv.count * 3);
                    for (let k = 0; k < uv.count; k++) {
                        pos[k * 3] = uv.getX(k);
                        pos[k * 3 + 1] = 1 - uv.getY(k);
                    }
                    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                    const color = new THREE.Color().setHSL(i / meshes.length, 1, 0.6);
                    scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, wireframe: true })));
                });
            } else {
                scene.add(gltf.scene);
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const c = box.getCenter(new THREE.Vector3());
                const r = box.getSize(new THREE.Vector3()).length();
                camera.position.copy(c).add(new THREE.Vector3(0, 0, r * 1.1));
                (camera as THREE.PerspectiveCamera).near = r / 100;
                (camera as THREE.PerspectiveCamera).far = r * 10;
                (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
                controls!.target.copy(c);
                lines.unshift(`box ${box.min.toArray().map((v) => v.toFixed(2))} → ${box.max.toArray().map((v) => v.toFixed(2))}`);
            }
            setInfo(lines.join('\n'));
        });

        const tick = () => {
            controls?.update();
            renderer.render(scene, camera);
            raf = requestAnimationFrame(tick);
        };
        tick();
        return () => {
            cancelAnimationFrame(raf);
            controls?.dispose();
            renderer.dispose();
            el.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div ref={host} style={{ position: 'fixed', inset: 0 }}>
            <pre style={{ position: 'fixed', left: 8, top: 8, color: '#ff0', font: '11px monospace', whiteSpace: 'pre', pointerEvents: 'none' }}>{info}</pre>
        </div>
    );
}
