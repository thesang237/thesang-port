'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { color, Discard, dot, Fn, If, mix, sin, smoothstep, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { gsap } from '@/components/motion-kit/gsap';
import WebGLCanvas from '@/components/motion-kit/WebGLCanvas';

type Photo = { src: string; x: number; y: number; w: number; h: number; pos: string; zoom: number };

/*
 * Menu photos (measured 20.8–22.4s): inactive = green-grey duotone; hover → colour in ~0.15s with a short
 * horizontal ripple, back to duotone in ~0.45s. Planes follow the DOM slots ([data-menu-photo]) and their
 * --clip reveal (driven by the menu timeline).
 */
const DUO_DARK = 0x283024;
const DUO_LIGHT = 0xd2d6c3;
const BACKDROP = 0xdcddd4; // studio grey behind the (transparent) renders

function parsePos(pos: string): [number, number] {
    const [a, b] = pos.split(' ').map((v) => parseFloat(v) / 100);
    return [a ?? 0.5, b ?? 0.5];
}

function Planes({ photos, active, onReady }: { photos: Photo[]; active: number; onReady: () => void }) {
    const size = useThree((s) => s.size);
    const [textures, setTextures] = useState<THREE.Texture[] | null>(null);
    const ready = useRef(false);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        let alive = true;
        Promise.all(
            photos.map(
                (p) =>
                    new Promise<THREE.Texture>((res) =>
                        loader.load(p.src, (t) => {
                            t.colorSpace = THREE.SRGBColorSpace;
                            t.anisotropy = 4;
                            t.generateMipmaps = true;
                            t.minFilter = THREE.LinearMipmapLinearFilter;
                            res(t);
                        }),
                    ),
            ),
        ).then((t) => alive && setTextures(t));
        return () => {
            alive = false;
        };
    }, [photos]);

    const items = useMemo(() => {
        if (!textures) return null;
        return photos.map((p, i) => {
            const u = {
                scale: uniform(new THREE.Vector2(1, 1)),
                offset: uniform(new THREE.Vector2(0, 0)),
                active: uniform(0),
                clip: uniform(0),
            };
            const tex = textures[i];
            const mat = new THREE.MeshBasicNodeMaterial({ transparent: true });
            mat.colorNode = Fn(() => {
                const q = uv();
                const yDown = q.y.oneMinus();
                If(yDown.greaterThan(u.clip), () => {
                    Discard();
                });
                // ripple while switching (peaks mid-transition)
                const wobble = u.active.mul(u.active.oneMinus()).mul(4.0);
                const dx = sin(yDown.mul(38.0).add(u.active.mul(9.0)))
                    .mul(0.018)
                    .mul(wobble);
                const p = vec2(q.x.add(dx), yDown);
                const iuv = p.mul(u.scale).add(u.offset);
                const t4 = texture(tex, vec2(iuv.x, iuv.y.oneMinus()));
                const c = mix(color(BACKDROP), t4.rgb, t4.a);
                const luma = dot(c, vec3(0.299, 0.587, 0.114));
                const duo = mix(color(DUO_DARK), color(DUO_LIGHT), smoothstep(0.0, 1.05, luma));
                return vec4(mix(duo, c, u.active), 1);
            })();
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            mesh.frustumCulled = false;
            const img = tex.image as HTMLImageElement;
            return { mesh, u, photo: p, iw: img.naturalWidth || img.width, ih: img.naturalHeight || img.height, el: null as HTMLElement | null, state: { a: i === active ? 1 : 0 } };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textures, photos]);

    // colour switch on hover
    useEffect(() => {
        items?.forEach((it, i) => {
            const on = i === active;
            gsap.to(it.state, { a: on ? 1 : 0, duration: on ? 0.18 : 0.45, ease: on ? 'power2.out' : 'power2.inOut', overwrite: true });
        });
    }, [active, items]);

    useFrame((state) => {
        if (!items) return;
        const W = size.width;
        const H = size.height;
        const canvasRect = state.gl.domElement.getBoundingClientRect();
        items.forEach((it, i) => {
            it.el ??= document.querySelector<HTMLElement>(`[data-menu-photo="${i}"]`);
            if (!it.el) return;
            const r = it.el.getBoundingClientRect();
            const x = r.left - canvasRect.left;
            const y = r.top - canvasRect.top;
            it.mesh.scale.set(r.width, r.height, 1);
            it.mesh.position.set(x + r.width / 2 - W / 2, -(y + r.height / 2 - H / 2), 0);
            // cover fit + object-position + zoom about the box centre
            const s = Math.max(r.width / it.iw, r.height / it.ih);
            const dw = it.iw * s;
            const dh = it.ih * s;
            const [px, py] = parsePos(it.photo.pos);
            const ox = (r.width - dw) * px;
            const oy = (r.height - dh) * py;
            const z = it.photo.zoom;
            it.u.scale.value.set(r.width / (z * dw), r.height / (z * dh));
            it.u.offset.value.set(((r.width / 2) * (1 - 1 / z) - ox) / dw, ((r.height / 2) * (1 - 1 / z) - oy) / dh);
            it.u.active.value = it.state.a;
            it.u.clip.value = parseFloat(it.el.style.getPropertyValue('--clip') || '0');
        });
        if (!ready.current) {
            ready.current = true;
            requestAnimationFrame(onReady);
        }
    });

    return (
        <>
            {items?.map((it, i) => (
                <primitive key={i} object={it.mesh} />
            ))}
        </>
    );
}

export default function MenuGL({ photos, active, open }: { photos: Photo[]; active: number; open: boolean }) {
    // keep rendering ~1.2s after close so the closing timeline stays visible
    const [prevOpen, setPrevOpen] = useState(open);
    const [lingering, setLingering] = useState(false);
    if (prevOpen !== open) {
        setPrevOpen(open);
        setLingering(!open);
    }
    useEffect(() => {
        if (!lingering) return;
        const id = window.setTimeout(() => setLingering(false), 1200);
        return () => window.clearTimeout(id);
    }, [lingering]);
    const running = open || lingering;

    return (
        <div className="ln-menu-gl" aria-hidden="true">
            <WebGLCanvas active={running}>
                <Planes photos={photos} active={active} onReady={() => document.querySelectorAll('[data-menu-photo]').forEach((el) => el.setAttribute('data-gl', '1'))} />
            </WebGLCanvas>
        </div>
    );
}
