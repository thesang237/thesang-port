'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

import { collections, products } from '../data/content';
import { getTexture } from '../hooks/useTextureStore';
import { useFloemaStore } from '../store/floemaStore';
import { lerp } from '../utils/math';

// --- Shaders ---
const COLL_VERT = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin(p.x * 2.0 + uTime) * 0.05;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const COLL_FRAG = /* glsl */ `
  uniform sampler2D tMap;
  uniform float uAlpha;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tMap, vUv);
    gl_FragColor = vec4(color.rgb, uAlpha);
  }
`;

type CardData = {
    mesh: THREE.Mesh;
    uniforms: {
        tMap: { value: THREE.Texture };
        uAlpha: { value: number };
        uTime: { value: number };
    };
    alpha: { current: number; target: number; multiplier: number };
    x: number; // base x position in world units
};

const W = 0.9 * 0.8;
const H = 1.2 * 0.8;
const PAD = 0.2;

const perCollection = products.length / collections.length;

// Module-level: lets CollectionsPage read the lerped scroll without coupling
export const collectionsScrollRef = { current: 0 };

export default function CollectionsMedia() {
    useThree();
    const isPreloaded = useFloemaStore((s) => s.isPreloaded);
    const activeDetail = useFloemaStore((s) => s.activeDetail);
    const groupRef = useRef<THREE.Group>(null);
    const cardsRef = useRef<CardData[]>([]);
    const scroll = useRef({ current: 0, target: 0 });
    const timeRef = useRef(0);
    const prevActiveRef = useRef<number | null>(null);
    const prevColRef = useRef<number>(-1);

    // Build meshes once preloaded
    useLayoutEffect(() => {
        if (!isPreloaded || !groupRef.current) return;
        const group = groupRef.current;
        const cards: CardData[] = [];

        products.forEach((product, i) => {
            const texture = getTexture(product.image.url) ?? new THREE.Texture();

            const uniforms = {
                tMap: { value: texture },
                uAlpha: { value: 0 },
                uTime: { value: 0 },
            };

            const material = new THREE.ShaderMaterial({
                vertexShader: COLL_VERT,
                fragmentShader: COLL_FRAG,
                uniforms,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            });

            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 10, 10), material);
            mesh.scale.set(W, H, 1);

            const x = i * (W + PAD);
            mesh.position.set(x, 0, 0);

            group.add(mesh);
            cards.push({
                mesh,
                uniforms,
                alpha: { current: 0, target: 0.9, multiplier: 0 },
                x,
            });
        });

        cardsRef.current = cards;

        // Fade all cards in with a short delay
        cards.forEach((card) => {
            gsap.to(card.alpha, { multiplier: 1, duration: 0.8, delay: 0.5 });
        });

        return () => {
            cards.forEach((c) => group.remove(c.mesh));
            cardsRef.current = [];
        };
    }, [isPreloaded]);

    // Wheel scroll
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            const delta = e.deltaX !== 0 ? e.deltaX * 0.005 : e.deltaY * 0.005;
            scroll.current.target += delta;
            scroll.current.target = Math.max(0, Math.min(scroll.current.target, products.length - 1));
        };
        window.addEventListener('wheel', onWheel, { passive: true });
        return () => window.removeEventListener('wheel', onWheel);
    }, []);

    // Pointer drag
    useEffect(() => {
        const drag = { isDown: false, startX: 0, startScroll: 0 };
        const onDown = (e: PointerEvent) => {
            drag.isDown = true;
            drag.startX = e.clientX;
            drag.startScroll = scroll.current.current;
        };
        const onMove = (e: PointerEvent) => {
            if (!drag.isDown) return;
            const norm = (drag.startX - e.clientX) / window.innerWidth;
            scroll.current.target = Math.max(0, Math.min(drag.startScroll + norm * products.length, products.length - 1));
        };
        const onUp = () => {
            drag.isDown = false;
        };
        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        return () => {
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    }, []);

    useFrame((state) => {
        timeRef.current += 0.016;
        const s = scroll.current;
        s.current = lerp(s.current, s.target, 0.07);
        collectionsScrollRef.current = s.current;

        cardsRef.current.forEach((card, i) => {
            const isActive = activeDetail !== null;
            const isSelected = activeDetail === i;

            // Opacity: fade out non-selected cards when a detail is open
            card.alpha.target = isActive && !isSelected ? 0.2 : 0.9;
            card.alpha.current = lerp(card.alpha.current, card.alpha.target, 0.1);

            const alpha = card.alpha.multiplier * card.alpha.current;
            card.uniforms.uAlpha.value = alpha;
            card.uniforms.uTime.value = timeRef.current;

            // Sine wave float
            const floatY = Math.sin(i * 0.5 + state.clock.elapsedTime * 0.5) * 0.3;

            card.mesh.position.x = card.x - s.current * (W + PAD);
            card.mesh.position.y = isSelected ? 0 : floatY;
        });

        prevActiveRef.current = activeDetail;

        // Sync active collection article in DOM
        const colIdx = Math.min(Math.floor(Math.round(s.current) / perCollection), collections.length - 1);
        if (colIdx !== prevColRef.current) {
            prevColRef.current = colIdx;
            document.querySelectorAll<HTMLElement>('.floema-collections__article').forEach((el, i) => {
                el.classList.toggle('active', i === colIdx);
            });
        }
    });

    return <group ref={groupRef} />;
}
