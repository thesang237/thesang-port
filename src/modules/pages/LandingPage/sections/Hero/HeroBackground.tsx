'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ShaderMaterial } from 'three';

import fragmentShader from './backgroundFragment.glsl';
import vertexShader from './backgroundVertex.glsl';

const BackgroundMesh = () => {
    const matRef = useRef<ShaderMaterial>(null);

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <mesh scale={[2, 2, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                ref={matRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={{
                    uTime: { value: 0 },
                    uResolution: { value: [1920, 1080] },
                }}
            />
        </mesh>
    );
};

const HeroBackground = () => {
    return (
        <Canvas camera={{ position: [0, 0, 1], fov: 75, near: 0.1, far: 10 }} gl={{ antialias: false, powerPreference: 'high-performance' }} style={{ position: 'absolute', inset: 0 }}>
            <BackgroundMesh />
        </Canvas>
    );
};

export default HeroBackground;
