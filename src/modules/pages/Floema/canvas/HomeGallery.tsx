'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

import { homeGallery } from '../data/content';
import { getTexture } from '../hooks/useTextureStore';
import { useFloemaStore } from '../store/floemaStore';
import { lerp } from '../utils/math';

// --- Shaders ---
const HOME_VERT = /* glsl */ `
  uniform vec2 uViewportSizes;
  uniform float uSpeed;
  varying vec2 vUv;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    float dist = length(worldPos.xy / uViewportSizes);
    worldPos.z += cos(dist * 3.14159 * 0.5) * uSpeed * 0.01;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
    vUv = uv;
  }
`;

const HOME_FRAG = /* glsl */ `
  uniform sampler2D tMap;
  uniform float uAlpha;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tMap, vUv);
    gl_FragColor = vec4(color.rgb, uAlpha);
  }
`;

type PlaneData = {
    mesh: THREE.Mesh;
    uniforms: {
        uAlpha: { value: number };
        uSpeed: { value: number };
        uViewportSizes: { value: THREE.Vector2 };
        tMap: { value: THREE.Texture };
    };
    x: number;
    y: number;
    extra: number;
    targetAlpha: number;
};

function getViewport(camera: THREE.PerspectiveCamera, aspect: number) {
    const fov = camera.fov * (Math.PI / 180);
    const h = 2 * Math.tan(fov / 2) * camera.position.z;
    return { width: h * aspect, height: h };
}

const COLS = 5;
const W = 0.5;
const H = 0.7;
const PADDING = 0.15;

export default function HomeGallery() {
    const { camera, size } = useThree();
    const isPreloaded = useFloemaStore((s) => s.isPreloaded);
    const groupRef = useRef<THREE.Group>(null);
    const planesRef = useRef<PlaneData[]>([]);
    const scroll = useRef({ current: 0, target: 0, last: 0, speed: 2 });

    // Build meshes once preloader is done
    useEffect(() => {
        if (!isPreloaded || !groupRef.current) return;
        const group = groupRef.current;
        const cam = camera as THREE.PerspectiveCamera;
        const vp = getViewport(cam, size.width / size.height);

        const numImages = homeGallery.length;
        const totalRows = Math.ceil(numImages / COLS);

        const planes: PlaneData[] = [];

        for (let row = 0; row < 2; row++) {
            for (let i = 0; i < numImages; i++) {
                const col = i % COLS;
                const r = Math.floor(i / COLS) + row * totalRows;

                const src = homeGallery[i % numImages].url;
                const texture = getTexture(src) ?? new THREE.Texture();

                const uniforms = {
                    uAlpha: { value: 0 },
                    uSpeed: { value: 0 },
                    uViewportSizes: { value: new THREE.Vector2(vp.width, vp.height) },
                    tMap: { value: texture },
                };

                const material = new THREE.ShaderMaterial({
                    vertexShader: HOME_VERT,
                    fragmentShader: HOME_FRAG,
                    uniforms,
                    transparent: true,
                    depthWrite: false,
                });

                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 20, 20), material);
                mesh.scale.set(W, H, 1);
                mesh.rotation.z = (Math.random() - 0.5) * 0.1;

                const x = (col - COLS / 2 + 0.5) * (W + PADDING);
                const y = -(r - 1) * (H + PADDING);

                group.add(mesh);
                planes.push({ mesh, uniforms, x, y, extra: 0, targetAlpha: 0.85 });
            }
        }

        planesRef.current = planes;

        // Z-entrance: each plane flies in from depth
        planes.forEach(({ mesh }) => {
            const startZ = 2 + Math.random() * 4;
            const delay = 2.5 + Math.random() * 1.5;
            gsap.fromTo(mesh.position, { z: startZ }, { z: 0, duration: 2, delay, ease: 'expo.inOut' });
        });

        return () => {
            planes.forEach((p) => group.remove(p.mesh));
            planesRef.current = [];
        };
    }, [isPreloaded, camera, size.width, size.height]);

    // Wheel handler
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            scroll.current.target += e.deltaY * 0.003;
        };
        window.addEventListener('wheel', onWheel, { passive: true });
        return () => window.removeEventListener('wheel', onWheel);
    }, []);

    useFrame(() => {
        const s = scroll.current;
        s.target += s.speed * 0.003;
        s.current = lerp(s.current, s.target, 0.07);
        const velocity = s.current - s.last;
        s.last = s.current;

        const cam = camera as THREE.PerspectiveCamera;
        const vp = getViewport(cam, size.width / size.height);
        const totalRows = Math.ceil(homeGallery.length / COLS);
        const rowH = (H + PADDING) * totalRows;

        planesRef.current.forEach((p) => {
            // Lerp alpha toward target
            const mat = p.mesh.material as THREE.ShaderMaterial;
            mat.uniforms.uAlpha.value = lerp(mat.uniforms.uAlpha.value, p.targetAlpha, 0.05);
            mat.uniforms.uSpeed.value = velocity * 5;
            mat.uniforms.uViewportSizes.value.set(vp.width, vp.height);

            const y = p.y + s.current + p.extra;

            // Wrap vertically
            if (y < -rowH * 0.5) p.extra += rowH * 2;
            if (y > rowH * 1.5) p.extra -= rowH * 2;

            p.mesh.position.set(p.x, p.y + s.current + p.extra, 0);
        });

        // fade-in on first render after preload
        if (!isPreloaded) return;
        if (planesRef.current.length > 0 && planesRef.current[0].targetAlpha === 0) {
            planesRef.current.forEach((p) => {
                p.targetAlpha = 0.85;
            });
        }
    });

    return <group ref={groupRef} />;
}
