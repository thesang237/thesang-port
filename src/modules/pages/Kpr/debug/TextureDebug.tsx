'use client';

/**
 * /kpr?debug=textures — loads every KTX2 in public/kpr/tex and shows it with its atlas frames,
 * plus a looping preview of each atlas. Temporary study tool (see NOTES.md "Texture mapping").
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { type Atlas, disposeKtx2, gridAtlas, loadAtlas, loadKtx2 } from '../gl/loaders';

type Entry = { file: string; atlas?: string | (() => Atlas) };

const ENTRIES: Entry[] = [
    { file: 'beam-ship-0', atlas: () => gridAtlas(4, 5, 508, 380) },
    { file: 'beam-ship-1', atlas: 'beam-ship-1' },
    { file: 'beam-ship-2', atlas: 'beam-ship-2' },
    { file: 'beam-2' },
    { file: 'beam-3' },
    { file: 'beam-4' },
    { file: 'male-hair-0', atlas: 'male-hair-0' },
    { file: 'male-hair-1', atlas: 'male-hair-1' },
    { file: 'kai-0' },
    { file: 'kai-1' },
    { file: 'kai-2' },
    { file: 'kai-3' },
    { file: 'character-light-0' },
    { file: 'character-light-1' },
    { file: 'character-light-2' },
    { file: 'magic-0' },
    { file: 'logo-anim-low-res-0', atlas: 'logo-anim-low-res-0' },
    { file: 'front-face' },
    { file: 'back-face' },
    { file: 'card-keep' },
    { file: 'card-factions' },
    { file: 'card-universe' },
    { file: 'pnoise0' },
    { file: 'beam-0', atlas: 'beam-0' },
    { file: 'beam-1', atlas: 'beam-1' },
    { file: 'energy-left-0', atlas: 'energy-left-0' },
    { file: 'energy-left-1', atlas: 'energy-left-1' },
    { file: 'energy-right-0', atlas: 'energy-right-0' },
    { file: 'energy-right-1', atlas: 'energy-right-1' },
    { file: 'female-hair-0', atlas: 'female-hair-0' },
    { file: 'female-hair-1', atlas: 'female-hair-1' },
    { file: 'female-cloth-0', atlas: 'female-cloth-0' },
    { file: 'female-cloth-1', atlas: 'female-cloth-1' },
    { file: 'female-cloth-2', atlas: 'female-cloth-2' },
];

const COLS = 6;

export default function TextureDebug() {
    const host = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('loading…');
    const [bg, setBg] = useState<'checker' | 'black' | 'white'>('checker');
    const bgRef = useRef(bg);
    bgRef.current = bg;

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
        const disposables: { dispose: () => void }[] = [];
        const players: { mat: THREE.ShaderMaterial; atlas: Atlas }[] = [];
        let cell = 200;

        const layout = () => {
            const w = el.clientWidth;
            cell = Math.floor(w / COLS);
            const rows = Math.ceil(ENTRIES.length / COLS) * 2;
            const h = rows * (cell + 24);
            renderer.setSize(w, h);
            camera.right = w;
            camera.bottom = -h;
            camera.updateProjectionMatrix();
        };
        layout();

        const vert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
        const frag = /* glsl */ `
            uniform sampler2D map; uniform vec4 rect; uniform float bgMode; varying vec2 vUv;
            void main(){
                vec2 uv = rect.xy + vUv * rect.zw;
                vec4 c = texture2D(map, uv);
                vec2 ck = floor(vUv * 16.); float k = mod(ck.x + ck.y, 2.);
                vec3 bg = bgMode < .5 ? mix(vec3(.25), vec3(.35), k) : (bgMode < 1.5 ? vec3(0.) : vec3(1.));
                gl_FragColor = vec4(mix(bg, c.rgb, c.a), 1.);
                #include <colorspace_fragment>
            }`;
        const bgUniform = { value: 0 };

        const addPlane = (tex: THREE.Texture, x: number, y: number, size: number, rect = new THREE.Vector4(0, 0, 1, 1)) => {
            const geo = new THREE.PlaneGeometry(size, size);
            const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { map: { value: tex }, rect: { value: rect }, bgMode: bgUniform } });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x + size / 2, -(y + size / 2), 0);
            scene.add(mesh);
            disposables.push(geo, mat);
            return mat;
        };

        const addFrameOutlines = (atlas: Atlas, x: number, y: number, size: number) => {
            const pts: number[] = [];
            atlas.frames.forEach((f) => {
                const x0 = x + f.u * size;
                const x1 = x + (f.u + f.w) * size;
                const y0 = -(y + (1 - f.v - f.h) * size);
                const y1 = -(y + (1 - f.v) * size);
                pts.push(x0, y0, 1, x1, y0, 1, x1, y0, 1, x1, y1, 1, x1, y1, 1, x0, y1, 1, x0, y1, 1, x0, y0, 1);
            });
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            const mat = new THREE.LineBasicMaterial({ color: 0xc6ff3d, transparent: true, opacity: 0.6 });
            scene.add(new THREE.LineSegments(geo, mat));
            disposables.push(geo, mat);
        };

        // grid detection for sheets without JSON: alpha occupancy runs along x and y
        const R = 512;
        const rt = new THREE.WebGLRenderTarget(R, R);
        disposables.push(rt);
        const aScene = new THREE.Scene();
        const aCam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1);
        const aMat = new THREE.ShaderMaterial({
            vertexShader: vert,
            fragmentShader: `uniform sampler2D map; varying vec2 vUv; void main(){ float a = texture2D(map, vUv).a; gl_FragColor = vec4(a, a, a, 1.); }`,
            uniforms: { map: { value: null } },
        });
        disposables.push(aMat);
        aScene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), aMat));
        const runs = (occ: boolean[]) => {
            const out: [number, number][] = [];
            let s = -1;
            occ.forEach((o, i) => {
                if (o && s < 0) s = i;
                if (!o && s >= 0) {
                    out.push([s, i - 1]);
                    s = -1;
                }
            });
            if (s >= 0) out.push([s, occ.length - 1]);
            return out;
        };
        const report: Record<string, unknown> = {};
        (window as unknown as { __kprAtlasReport: unknown }).__kprAtlasReport = report;
        const analyse = (tex: THREE.Texture, name: string) => {
            aMat.uniforms.map.value = tex;
            renderer.setRenderTarget(rt);
            renderer.render(aScene, aCam);
            const px = new Uint8Array(R * R * 4);
            renderer.readRenderTargetPixels(rt, 0, 0, R, R, px);
            renderer.setRenderTarget(null);
            const col = Array.from({ length: R }, (_, x) => {
                let s = 0;
                for (let y = 0; y < R; y++) s += px[(y * R + x) * 4];
                return s > 255 * 2;
            });
            const row = Array.from({ length: R }, (_, y) => {
                let s = 0;
                for (let x = 0; x < R; x++) s += px[(y * R + x) * 4];
                return s > 255 * 2;
            });
            // rows are reported top→bottom in texture space (GL y is flipped)
            report[name] = { cols: runs(col).map(([a, b]) => [a * 4, b * 4]), rows: runs(row.reverse()).map(([a, b]) => [a * 4, b * 4]) };
        };

        let alive = true;
        const labels: HTMLDivElement[] = [];
        (async () => {
            let i = 0;
            for (const entry of ENTRIES) {
                try {
                    const tex = await loadKtx2(renderer, `/kpr/tex/${entry.file}.ktx2`);
                    if (!alive) return;
                    disposables.push(tex);
                    const col = i % COLS;
                    const row = Math.floor(i / COLS) * 2;
                    const x = col * cell;
                    const y = row * (cell + 24) + 24;
                    addPlane(tex, x + 4, y, cell - 8);
                    const label = document.createElement('div');
                    label.textContent = `${entry.file} (${tex.image?.width}×${tex.image?.height}, ${tex.format})`;
                    Object.assign(label.style, { position: 'absolute', left: `${x + 4}px`, top: `${y - 20}px`, font: '11px monospace', color: '#c6ff3d' });
                    el.appendChild(label);
                    labels.push(label);
                    if (!entry.atlas) analyse(tex, entry.file);
                    if (entry.atlas) {
                        const atlas = typeof entry.atlas === 'string' ? await loadAtlas(`/kpr/tex/${entry.atlas}.json`) : entry.atlas();
                        addFrameOutlines(atlas, x + 4, y, cell - 8);
                        const mat = addPlane(tex, x + 4, y + cell + 24, cell - 8, new THREE.Vector4());
                        players.push({ mat, atlas });
                        const l2 = label.cloneNode() as HTMLDivElement;
                        l2.textContent = `▶ ${atlas.frames.length} frames`;
                        l2.style.top = `${y + cell + 4}px`;
                        el.appendChild(l2);
                        labels.push(l2);
                    }
                } catch (e) {
                    console.warn('[kpr debug] failed', entry.file, e);
                }
                i++;
            }
            setStatus(`${ENTRIES.length} textures`);
        })();

        let raf = 0;
        const t0 = performance.now();
        const loop = () => {
            raf = requestAnimationFrame(loop);
            const t = (performance.now() - t0) / 1000;
            bgUniform.value = bgRef.current === 'checker' ? 0 : bgRef.current === 'black' ? 1 : 2;
            players.forEach(({ mat, atlas }) => {
                const f = atlas.frames[Math.floor(t * 24) % atlas.frames.length];
                (mat.uniforms.rect.value as THREE.Vector4).set(f.u, f.v, f.w, f.h);
            });
            renderer.render(scene, camera);
        };
        loop();
        window.addEventListener('resize', layout);

        return () => {
            alive = false;
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', layout);
            disposables.forEach((d) => d.dispose());
            labels.forEach((l) => l.remove());
            renderer.dispose();
            renderer.domElement.remove();
            disposeKtx2();
        };
    }, []);

    return (
        <div style={{ background: '#111', minHeight: '100vh', color: '#fff', padding: 16 }}>
            <div style={{ font: '12px monospace', marginBottom: 12, display: 'flex', gap: 12 }}>
                <span>KPR texture debug — {status}</span>
                {(['checker', 'black', 'white'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setBg(m)} style={{ textDecoration: bg === m ? 'underline' : 'none' }}>
                        {m}
                    </button>
                ))}
            </div>
            <div ref={host} style={{ position: 'relative' }} />
        </div>
    );
}
