'use client';
import type { FC } from 'react';
import { useMemo, useRef } from 'react';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import type { ShaderMaterial } from 'three';
import * as THREE from 'three';

import fragmentShader from './fragmentShader.glsl';
import vertexShader from './vertexShader.glsl';

const Hologram: FC = () => {
    const materialRef = useRef<ShaderMaterial>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    useControls('Hologram', {
        color: {
            value: '#70c1ff',
            onChange: (value) => {
                if (materialRef.current) {
                    materialRef.current.uniforms.uColor.value.set(value);
                }
            },
        },
    });

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#70c1ff') },
        }),
        [],
    );

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime();
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 4]} />
            <OrbitControls />
            <gridHelper args={[10, 10]} />
            <mesh ref={meshRef}>
                <torusKnotGeometry args={[0.6, 0.25, 128, 32]} />
                {/* <planeGeometry args={[2, 2, 128, 128]} /> */}
                <shaderMaterial
                    key={[vertexShader, fragmentShader].join('-')}
                    ref={materialRef}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </>
    );
};

export default Hologram;
