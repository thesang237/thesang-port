'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import Lenis from 'lenis';
import * as THREE from 'three';

import { getTexture } from '../hooks/useTextureStore';
import { useFloemaStore } from '../store/floemaStore';

// --- Shaders ---
const PLANE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

const PLANE_FRAG = /* glsl */ `
  uniform sampler2D tMap;
  uniform float uAlpha;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tMap, vUv);
    gl_FragColor = vec4(color.rgb, uAlpha);
  }
`;

type MediaData = {
    mesh: THREE.Mesh;
    uniforms: { uAlpha: { value: number }; tMap: { value: THREE.Texture } };
    domEl: HTMLElement;
};

function getViewport(camera: THREE.PerspectiveCamera, aspect: number) {
    const fov = camera.fov * (Math.PI / 180);
    const h = 2 * Math.tan(fov / 2) * camera.position.z;
    return { width: h * aspect, height: h };
}

// Module-level Lenis instance shared with the scroll driver
let aboutLenis: Lenis | null = null;
export function getAboutLenis() {
    return aboutLenis;
}

export default function AboutGallery() {
    const { camera, size } = useThree();
    const isPreloaded = useFloemaStore((s) => s.isPreloaded);
    const setScrollY = useFloemaStore((s) => s.setScrollY);
    const groupRef = useRef<THREE.Group>(null);
    const mediasRef = useRef<MediaData[]>([]);

    // Init Lenis for the About page scoped scroll
    useEffect(() => {
        const wrapper = document.querySelector<HTMLElement>('.floema-about');
        const content = document.querySelector<HTMLElement>('.floema-about__wrapper');
        if (!wrapper || !content) return;

        const lenis = new Lenis({
            wrapper,
            content,
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        } as ConstructorParameters<typeof Lenis>[0]);

        lenis.on('scroll', ({ scroll: y }: { scroll: number }) => {
            setScrollY(y);
        });

        aboutLenis = lenis;

        return () => {
            lenis.destroy();
            aboutLenis = null;
        };
    }, [setScrollY]);

    // Build WebGL meshes for gallery images on About page
    useLayoutEffect(() => {
        if (!isPreloaded || !groupRef.current) return;
        const group = groupRef.current;
        const medias: MediaData[] = [];

        const figures = document.querySelectorAll<HTMLElement>('.floema-about__gallery__media--webgl');

        figures.forEach((figure) => {
            const img = figure.querySelector<HTMLImageElement>('img');
            if (!img) return;

            const src = img.getAttribute('data-src') ?? '';
            const texture = getTexture(src) ?? new THREE.Texture();

            const uniforms = {
                uAlpha: { value: 0 },
                tMap: { value: texture },
            };

            const mat = new THREE.ShaderMaterial({
                vertexShader: PLANE_VERT,
                fragmentShader: PLANE_FRAG,
                uniforms,
                transparent: true,
                depthWrite: false,
            });

            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            group.add(mesh);
            medias.push({ mesh, uniforms, domEl: figure });
        });

        mediasRef.current = medias;

        // Animate in
        medias.forEach(({ uniforms }) => {
            gsap.fromTo(uniforms.uAlpha, { value: 0 }, { value: 1, duration: 1, ease: 'expo.inOut' });
        });

        return () => {
            medias.forEach((m) => group.remove(m.mesh));
            mediasRef.current = [];
        };
    }, [isPreloaded]);

    useFrame((_, delta) => {
        // Drive Lenis from R3F animation loop
        aboutLenis?.raf(delta * 1000);

        if (mediasRef.current.length === 0) return;
        const cam = camera as THREE.PerspectiveCamera;
        const vp = getViewport(cam, size.width / size.height);
        const ARC_EXTRA = 60;

        mediasRef.current.forEach(({ mesh, domEl }) => {
            const rect = domEl.getBoundingClientRect();
            const w = (rect.width / size.width) * vp.width;
            const h = (rect.height / size.height) * vp.height;
            mesh.scale.set(w, h, 1);

            const x = ((rect.left + rect.width / 2) / size.width) * vp.width - vp.width / 2;
            const y = -((rect.top + rect.height / 2) / size.height) * vp.height + vp.height / 2;

            mesh.position.x = x;
            // Cosine arc bow
            const arc = Math.cos((x / vp.width) * Math.PI * 0.1) * ARC_EXTRA - ARC_EXTRA;
            mesh.position.y = y + (arc / size.height) * vp.height;
            // Z-rotation from X position
            mesh.rotation.z = (x / vp.width) * Math.PI * 0.2;
        });
    });

    return <group ref={groupRef} />;
}
