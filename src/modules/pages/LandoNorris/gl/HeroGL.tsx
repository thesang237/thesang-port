'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { color, Fn, mix, mx_noise_float, positionGeometry, smoothstep, texture, time, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import WebGLCanvas from '@/components/motion-kit/WebGLCanvas';

import { IMG } from '../data';

import { heroState } from './heroState';

/*
 * Hero layer (lives inside the pinned hero, between the marquee and the signature):
 *  – card plane synced to the DOM `[data-gl-hero]` rect: light bg + contour lines + portrait
 *  – helmet version revealed where the pointer trail is (canvas trail → noise-thresholded liquid edge)
 *  – glass helmet shell (wire grid) dropping onto the head every 1.0 s (idle loop, measured)
 *  – card state (scroll): image scale 1 → 0.68, darken toward #22281C
 */

const IMG_ASPECT = 2400 / 1288;
const HEAD = { u: 0.5, v: 0.47, unitsPerHeight: 0.36 }; // head centre in image uv (y down), px/unit ÷ image height
const TRAIL_SCALE = 0.25;
const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TRAIL_DECAY = 0.018; // per 60fps frame → ~0.9 s to fall under the reveal threshold (measured blob life)

function makeContourTexture(): Promise<THREE.CanvasTexture> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = 1920;
            c.height = 1200;
            const ctx = c.getContext('2d')!;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.filter = 'invert(1)';
            ctx.drawImage(img, 0, 0, 1920, 2400);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.NoColorSpace;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            resolve(t);
        };
        img.src = IMG.contours;
    });
}

function helmetGrid(): THREE.BufferGeometry {
    // lat/long grid of a helmet dome (unit sphere scaled like the render's shell)
    const pts: number[] = [];
    const S = (th: number, ph: number) => {
        const x = Math.sin(th) * Math.cos(ph) * 1.08;
        const y = Math.cos(th) * 1.3;
        const z = Math.sin(th) * Math.sin(ph) * 1.26;
        return [x, y, z];
    };
    const TH = Math.PI * 0.64;
    for (let i = 0; i < 40; i++) {
        const ph = (i / 40) * Math.PI * 2;
        for (let k = 0; k < 24; k++) pts.push(...S((k / 24) * TH, ph), ...S(((k + 1) / 24) * TH, ph));
    }
    for (let j = 1; j <= 16; j++) {
        const th = (j / 16) * TH;
        for (let k = 0; k < 64; k++) pts.push(...S(th, (k / 64) * Math.PI * 2), ...S(th, ((k + 1) / 64) * Math.PI * 2));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
}

function Scene({ onFirstFrame }: { onFirstFrame: () => void }) {
    const size = useThree((s) => s.size);
    const [tex, setTex] = useState<{ portrait: THREE.Texture; helmet: THREE.Texture; contours: THREE.CanvasTexture } | null>(null);
    const first = useRef(false);

    // trail canvas (screen space, quarter res)
    const trail = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = Math.ceil(window.innerWidth * TRAIL_SCALE);
        c.height = Math.ceil(window.innerHeight * TRAIL_SCALE);
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, c.width, c.height);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.NoColorSpace;
        return { c, ctx, t, last: null as null | { x: number; y: number } };
    }, []);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        const load = (src: string) =>
            new Promise<THREE.Texture>((res) =>
                loader.load(src, (t) => {
                    t.colorSpace = THREE.SRGBColorSpace;
                    t.anisotropy = 4;
                    t.minFilter = THREE.LinearMipmapLinearFilter;
                    res(t);
                }),
            );
        let alive = true;
        Promise.all([load(IMG.portrait), load(IMG.portraitHelmet), makeContourTexture()]).then(([portrait, helmet, contours]) => {
            if (alive) setTex({ portrait, helmet, contours });
        });
        const onMove = (e: PointerEvent) => {
            heroState.mouse.x = e.clientX;
            heroState.mouse.y = e.clientY;
            heroState.mouse.active = true;
        };
        window.addEventListener('pointermove', onMove);
        return () => {
            alive = false;
            window.removeEventListener('pointermove', onMove);
        };
    }, []);

    const u = useMemo(
        () => ({
            view: uniform(new THREE.Vector2(1920, 1030)),
            cardPos: uniform(new THREE.Vector2(0, 0)),
            cardSize: uniform(new THREE.Vector2(1920, 1030)),
            cardCenter: uniform(new THREE.Vector2(960, 515)),
            scale: uniform(1),
            imgOrigin: uniform(new THREE.Vector2(0, 0)),
            imgSize: uniform(new THREE.Vector2(1920, 1030)),
            progress: uniform(0),
            glass: uniform(0),
        }),
        [],
    );

    const card = useMemo(() => {
        if (!tex) return null;
        const mat = new THREE.MeshBasicNodeMaterial();
        mat.colorNode = Fn(() => {
            const pUv = uv();
            const P = u.cardPos.add(vec2(pUv.x, pUv.y.oneMinus()).mul(u.cardSize)); // px, y down
            const Q = P.sub(u.cardCenter).div(u.scale).add(u.view.mul(0.5));
            const iuv = Q.sub(u.imgOrigin).div(u.imgSize);
            const tuv = vec2(iuv.x, iuv.y.oneMinus());
            const por = texture(tex.portrait, tuv);
            const hel = texture(tex.helmet, tuv);
            const line = texture(tex.contours, vec2(Q.x.div(1920), Q.y.div(1200).oneMinus())).r;
            const bg = mix(color(0xfafbf6), color(0xe3e4dc), line);
            const bgH = mix(color(0xe4e5de), color(0xd6d8cf), line);
            const base = mix(bg, por.rgb, por.a);
            const helm = mix(bgH, hel.rgb, hel.a);
            const tr = texture(trail.t, vec2(P.x.div(u.view.x), P.y.div(u.view.y).oneMinus())).r;
            const n = mx_noise_float(vec3(P.mul(0.0105), time.mul(0.35)));
            const m = smoothstep(0.4, 0.43, tr.add(n.mul(0.17)));
            const col = mix(base, helm, m);
            return vec4(mix(col, color(0x22281c), u.progress.pow(1.3).mul(0.87)), 1);
        })();
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        mesh.frustumCulled = false;
        return mesh;
    }, [tex, trail, u]);

    const glass = useMemo(() => {
        const mat = new THREE.LineBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false });
        mat.colorNode = color(0x9a9c93);
        // fade the lower part of the dome + global loop opacity
        mat.opacityNode = u.glass.mul(0.42).mul(smoothstep(0.0, 0.62, positionGeometry.y));
        const lines = new THREE.LineSegments(helmetGrid(), mat);
        lines.frustumCulled = false;
        lines.renderOrder = 2;
        const grp = new THREE.Group();
        grp.add(lines);
        return { grp, lines };
    }, [u]);

    useFrame((state) => {
        const el = document.querySelector<HTMLElement>('[data-gl-hero]');
        const canvasRect = state.gl.domElement.getBoundingClientRect();
        const W = size.width;
        const H = size.height;
        const p = heroState.progress;
        const s = 1 - 0.32 * p;
        u.view.value.set(W, H);
        u.progress.value = p;
        u.scale.value = s;
        // image covers the viewport, anchored bottom-centre
        const dw = Math.max(W, H * IMG_ASPECT);
        const dh = dw / IMG_ASPECT;
        u.imgOrigin.value.set(W / 2 - dw / 2, H - dh);
        u.imgSize.value.set(dw, dh);

        if (el && card) {
            const r = el.getBoundingClientRect();
            const x = r.left - canvasRect.left;
            const y = r.top - canvasRect.top;
            u.cardPos.value.set(x, y);
            u.cardSize.value.set(r.width, r.height);
            u.cardCenter.value.set(x + r.width / 2, y + r.height / 2);
            card.scale.set(r.width, r.height, 1);
            card.position.set(x + r.width / 2 - W / 2, -(y + r.height / 2 - H / 2), 0);
        }

        // glass helmet loop (period 1.0s): appear high, drop + settle, fade
        const t = state.clock.elapsedTime;
        const ph = (t % 1.0) / 1.0;
        const fadeIn = Math.min(1, ph / 0.22);
        const fadeOut = 1 - Math.min(1, Math.max(0, (ph - 0.55) / 0.35));
        const visible = (1 - Math.min(1, Math.max(0, (p - 0.3) / 0.2))) * (heroState.mouse.active ? 1 : 1);
        u.glass.value = REDUCED ? 0 : fadeIn * fadeOut * visible; // looping shell is decorative motion
        const drop = 1 - Math.pow(1 - Math.min(1, ph / 0.6), 3);
        const k = HEAD.unitsPerHeight * dh * s;
        const cx = u.cardCenter.value.x + (u.imgOrigin.value.x + HEAD.u * dw - W / 2) * s;
        const cy = u.cardCenter.value.y + (u.imgOrigin.value.y + HEAD.v * dh - H / 2) * s;
        glass.grp.position.set(cx - W / 2, -(cy - H / 2) + (1 - drop) * 90 * s, 10);
        const sc = k * (1.06 - 0.06 * drop);
        glass.grp.scale.set(sc, sc, sc);
        glass.lines.rotation.set(0.32, t * 0.25, 0);

        // pointer trail
        const { ctx, c } = trail;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(0,0,0,${TRAIL_DECAY})`;
        ctx.fillRect(0, 0, c.width, c.height);
        if (heroState.mouse.active && p < 0.15) {
            const mx = (heroState.mouse.x - canvasRect.left) * TRAIL_SCALE;
            const my = (heroState.mouse.y - canvasRect.top) * TRAIL_SCALE;
            // no stamp for the very first pointer position (entering the page is not a stroke)
            const last = trail.last ?? { x: mx, y: my };
            const dist = trail.last ? Math.hypot(mx - last.x, my - last.y) : 0;
            const steps = Math.max(1, Math.ceil(dist / 2));
            const R = 200 * TRAIL_SCALE; // measured blob ≈ 400px across
            // stamp strength follows pointer speed: sub-pixel jitter leaves no trace
            const strength = Math.min(1, Math.max(0, (dist / TRAIL_SCALE - 3) / 25));
            if (strength > 0) {
                for (let i = 1; i <= steps; i++) {
                    const x = last.x + ((mx - last.x) * i) / steps;
                    const y = last.y + ((my - last.y) * i) / steps;
                    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
                    g.addColorStop(0, `rgba(255,255,255,${0.55 * strength})`);
                    g.addColorStop(0.55, `rgba(255,255,255,${0.35 * strength})`);
                    g.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = g;
                    ctx.fillRect(x - R, y - R, R * 2, R * 2);
                }
            }
            trail.last = { x: mx, y: my };
        }
        trail.t.needsUpdate = true;

        if (card && !first.current) {
            first.current = true;
            requestAnimationFrame(onFirstFrame);
        }
    });

    return (
        <>
            {card && <primitive object={card} />}
            <primitive object={glass.grp} />
        </>
    );
}

export default function HeroGL() {
    const [active, setActive] = useState(true);
    const wrap = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = wrap.current?.closest('.ln-hero');
        if (!section) return;
        const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '100px' });
        io.observe(section);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={wrap} className="ln-hero-gl" aria-hidden="true">
            <WebGLCanvas active={active}>
                <Scene
                    onFirstFrame={() => {
                        document.querySelector('.ln-hero-card-dom')?.setAttribute('data-gl', '1');
                    }}
                />
            </WebGLCanvas>
        </div>
    );
}
