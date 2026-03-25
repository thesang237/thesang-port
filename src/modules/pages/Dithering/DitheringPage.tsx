'use client';

import './dithering.css';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Center, Float, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { folder, Leva, useControls } from 'leva';
import * as THREE from 'three';

import { EnvironmentWrapper } from './Environment';
import { PostProcessing } from './PostProcessing';

useGLTF.preload('/jousting_helmet-transformed.glb');

function DemoName() {
    return (
        <div className="dithering-demo-container">
            <div className="dithering-demo-name">Dithering Shader</div>
            <div className="dithering-demo-author">
                made by{' '}
                <span className="dithering-underlined">
                    <a href="https://niccolofanton.dev" target="_blank" rel="noopener noreferrer">
                        niccolofanton
                    </a>
                </span>
                {' • '}
                <a href="https://github.com/niccolofanton/dithering-shader" target="_blank" rel="noopener noreferrer" className="dithering-github-link">
                    GitHub
                </a>
            </div>
        </div>
    );
}

const Effects = memo(() => <PostProcessing />);
Effects.displayName = 'Effects';

type HelmetProps = {
    [key: string]: unknown;
};

function Helmet(props: HelmetProps) {
    const { nodes, materials } = useGLTF('/jousting_helmet-transformed.glb') as any;
    return (
        <group {...props} dispose={null}>
            <mesh
                castShadow
                geometry={nodes.Object_2.geometry}
                material={materials.model_Material_u1_v1}
                material-roughness={0.15}
                position={[-2.016, -0.06, 1.381]}
                rotation={[-1.601, 0.068, 2.296]}
                scale={0.038}
            />
        </group>
    );
}

export default function DitheringPage() {
    const { bgColor } = useControls({
        'Scene Settings': folder({
            bgColor: { value: '#ffffff', label: 'Background Color' },
        }),
    });

    const { intensity, highlight } = useControls({
        'Environment Settings': folder({
            intensity: { value: 1.5, min: 0, max: 5, step: 0.1, label: 'Environment Intensity' },
            highlight: { value: '#066aff', label: 'Highlight Color' },
        }),
    });

    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const [modelScale, setModelScale] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2.4 : 3));

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setClearColor(new THREE.Color(bgColor));
        }
    }, [bgColor]);

    const handleResize = useCallback(() => {
        setModelScale(window.innerWidth <= 768 ? 2.4 : 3);
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return (
        <div className="dithering-page">
            <Leva collapsed={false} />
            <Canvas
                shadows
                camera={{ position: [0, -1, 4], fov: 65 }}
                gl={{ alpha: false }}
                style={{ position: 'fixed', inset: 0 }}
                onCreated={({ gl }) => {
                    rendererRef.current = gl;
                    gl.setClearColor(new THREE.Color(bgColor));
                }}
            >
                <group position={[0, -0.5, 0]}>
                    <Float floatIntensity={2} rotationIntensity={1} speed={2}>
                        <Center scale={modelScale} position={[0, 0.8, 0]} rotation={[0, -Math.PI / 3.5, -0.4]}>
                            <Helmet />
                        </Center>
                    </Float>
                </group>
                <OrbitControls />
                <EnvironmentWrapper intensity={intensity} highlight={highlight} />
                <Effects />
            </Canvas>
            <DemoName />
        </div>
    );
}
