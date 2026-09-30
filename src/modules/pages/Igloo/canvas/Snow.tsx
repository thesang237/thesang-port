'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { rng } from '../utils/math';

type Props = {
    count?: number;
    size?: [number, number, number];
    center?: [number, number, number];
    speed?: number;
    pointSize?: number;
    opacity?: number;
    color?: string;
    /** Called every frame; return 0 to skip updates (world hidden). */
    visible?: () => number;
};

/** Falling snow / floating dust — fully animated on the GPU. */
export default function Snow({ count = 2500, size = [30, 16, 30], center = [0, 6, 0], speed = 0.6, pointSize = 2.2, opacity = 0.85, color = '#ffffff', visible }: Props) {
    const { geometry, material } = useMemo(() => {
        const r = rng(count);
        const pos = new Float32Array(count * 3);
        const seed = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (r() - 0.5) * size[0];
            pos[i * 3 + 1] = (r() - 0.5) * size[1];
            pos[i * 3 + 2] = (r() - 0.5) * size[2];
            seed[i] = r();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
        const m = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uSpeed: { value: speed },
                uHeight: { value: size[1] },
                uSize: { value: pointSize },
                uOpacity: { value: opacity },
                uColor: { value: new THREE.Color(color) },
                uWind: { value: 0 },
            },
            vertexShader: /* glsl */ `
                uniform float uTime; uniform float uSpeed; uniform float uHeight; uniform float uSize; uniform float uWind;
                attribute float aSeed;
                varying float vAlpha;
                void main() {
                    vec3 p = position;
                    float t = uTime * uSpeed * (0.6 + aSeed * 0.8);
                    p.y = mod(p.y - t + uHeight * 0.5, uHeight) - uHeight * 0.5;
                    p.x += sin(uTime * 0.6 + aSeed * 40.0) * 0.35 + uWind * (0.5 + aSeed);
                    p.z += cos(uTime * 0.5 + aSeed * 23.0) * 0.25;
                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mv;
                    gl_PointSize = uSize * (0.5 + aSeed) * (12.0 / -mv.z);
                    vAlpha = smoothstep(uHeight * 0.5, uHeight * 0.3, abs(p.y)) * (0.4 + 0.6 * aSeed);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform float uOpacity; uniform vec3 uColor;
                varying float vAlpha;
                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    float a = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
                    if (a < 0.01) discard;
                    gl_FragColor = vec4(uColor * 1.4, a);
                }
            `,
        });
        return { geometry: g, material: m };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useFrame((state) => {
        if (visible && visible() <= 0) return;
        material.uniforms.uTime.value = state.clock.elapsedTime;
    });

    return <points geometry={geometry} material={material} position={center} frustumCulled={false} />;
}
