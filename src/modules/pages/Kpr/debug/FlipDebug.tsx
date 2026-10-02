'use client';

/**
 * /kpr?debug=flip&sheets=logo-anim-low-res-0&every=4 — lays out every Nth frame of a TexturePacker
 * flipbook in a grid (checker background) so its content can be read frame by frame. Study tool.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { type Atlas, disposeKtx2, gridAtlas, loadAtlas, loadKtx2 } from '../gl/loaders';

export default function FlipDebug() {
    const host = useRef<HTMLDivElement>(null);
    const [info, setInfo] = useState('loading…');

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        const q = new URLSearchParams(window.location.search);
        const sheets = (q.get('sheets') ?? 'logo-anim-low-res-0').split(',');
        const every = Number(q.get('every') ?? 4);
        const cols = Number(q.get('cols') ?? 8);
        const grid = q.get('grid'); // "cols,rows,cellW,cellH,pad" when the sheet has no JSON
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(1);
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const W = innerWidth;
        const cell = Math.floor(W / cols);
        const camera = new THREE.OrthographicCamera(0, W, 0, -100, -1, 1);
        const disposables: { dispose: () => void }[] = [];
        let alive = true;

        (async () => {
            const frames: { tex: THREE.Texture; f: Atlas['frames'][number] }[] = [];
            for (const s of sheets) {
                const tex = await loadKtx2(renderer, `/kpr/tex/${s}.ktx2`);
                disposables.push(tex);
                let atlas: Atlas;
                if (grid) {
                    const [c, r, w, h, pad] = grid.split(',').map(Number);
                    atlas = gridAtlas(c, r, w, h, (tex.image as { width: number }).width, pad);
                } else atlas = await loadAtlas(`/kpr/tex/${s}.json`);
                atlas.frames.forEach((f) => frames.push({ tex, f }));
            }
            if (!alive) return;
            const from = Number(q.get('from') ?? 0);
            const pick = frames.filter((_, i) => i >= from && ((i - from) % every === 0 || i === frames.length - 1));
            const img = pick[0].tex.image as { width: number; height: number };
            const ar = (pick[0].f.w * img.width) / (pick[0].f.h * img.height);
            const ch = Math.round(cell / ar);
            const rows = Math.ceil(pick.length / cols);
            const H = rows * (ch + 4);
            renderer.setSize(W, H);
            camera.bottom = -H;
            camera.updateProjectionMatrix();
            const geo = new THREE.PlaneGeometry(cell - 4, ch);
            disposables.push(geo);
            pick.forEach(({ tex, f }, i) => {
                const mat = new THREE.ShaderMaterial({
                    uniforms: { map: { value: tex }, rect: { value: new THREE.Vector4(f.u, f.v, f.w, f.h) } },
                    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
                    fragmentShader: `uniform sampler2D map; uniform vec4 rect; varying vec2 vUv; void main(){ vec4 c = texture2D(map, rect.xy + vUv * rect.zw); vec2 k = floor(vUv * vec2(12., 12.)); vec3 bg = mix(vec3(.2), vec3(.3), mod(k.x + k.y, 2.)); gl_FragColor = vec4(mix(bg, c.rgb, c.a), 1.);\n#include <colorspace_fragment>\n}`,
                });
                disposables.push(mat);
                const m = new THREE.Mesh(geo, mat);
                m.position.set((i % cols) * cell + cell / 2, -(Math.floor(i / cols) * (ch + 4) + ch / 2), 0);
                scene.add(m);
            });
            renderer.render(scene, camera);
            setInfo(`${sheets.join(',')}: ${frames.length} frames, showing every ${every}`);
        })();

        return () => {
            alive = false;
            disposables.forEach((d) => d.dispose());
            renderer.dispose();
            renderer.domElement.remove();
            disposeKtx2();
        };
    }, []);

    return (
        <div ref={host} style={{ background: '#111', minHeight: '100vh' }}>
            <pre style={{ position: 'fixed', left: 8, bottom: 8, margin: 0, font: '11px monospace', color: '#c6ff3d' }}>{info}</pre>
        </div>
    );
}
