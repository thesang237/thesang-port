'use client';
import { Suspense, useEffect, useRef } from 'react';
import { Center, Float, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import type { Mesh, MeshStandardMaterial } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { EnvironmentWrapper } from './Environment';
import { Poster } from './Poster';
import { PostProcessing } from './PostProcessing';
import type { StudioSettings } from './settings';

type HelmetModel = GLTF & { nodes: { Object_2: Mesh }; materials: { model_Material_u1_v1: MeshStandardMaterial } };
function Helmet({ roughness }: { roughness: number }) {
    const { nodes, materials } = useGLTF('/jousting_helmet-transformed.glb', '/draco/gltf/') as unknown as HelmetModel;
    const invalidate = useThree((state) => state.invalidate);
    useEffect(() => {
        invalidate();
    }, [nodes, invalidate]);
    return (
        <mesh geometry={nodes.Object_2.geometry} position={[-2.016, -0.06, 1.381]} rotation={[-1.601, 0.068, 2.296]} scale={0.038}>
            <meshStandardMaterial map={materials.model_Material_u1_v1.map} metalness={0.9} roughness={roughness} />
        </mesh>
    );
}
function Subject({ settings }: { settings: StudioSettings }) {
    const width = useThree((s) => s.size.width);
    const scale = width < 600 ? 2.4 : 3;
    return (
        <Float enabled={settings.animate} floatIntensity={0.6} rotationIntensity={0.5} speed={settings.speed * 2}>
            {settings.subject === 'helmet' ? (
                <Center scale={scale} rotation={[0, -Math.PI / 3.5, -0.4]}>
                    <Helmet roughness={settings.roughness} />
                </Center>
            ) : (
                <mesh rotation={[0.4, 0.5, 0]}>
                    {settings.subject === 'knot' ? <torusKnotGeometry args={[0.9, 0.28, 160, 24]} /> : <icosahedronGeometry args={[1.3, 2]} />}
                    <meshStandardMaterial color="#aaaab0" metalness={0.9} roughness={settings.roughness} flatShading={settings.subject === 'sphere'} />
                </mesh>
            )}
        </Float>
    );
}
function CanvasLifetime({ onLost, animate }: { onLost: () => void; animate: boolean }) {
    const { gl, setFrameloop, invalidate } = useThree();
    useEffect(() => {
        const canvas = gl.domElement;
        const visibility = () => {
            setFrameloop(document.hidden ? 'never' : animate ? 'always' : 'demand');
            invalidate();
        };
        visibility();
        document.addEventListener('visibilitychange', visibility);
        canvas.addEventListener('webglcontextlost', onLost);
        // eslint-disable-next-line react-hooks/immutability -- Three owns mutable render diagnostics
        gl.info.autoReset = false;
        return () => {
            document.removeEventListener('visibilitychange', visibility);
            canvas.removeEventListener('webglcontextlost', onLost);
        };
    }, [gl, setFrameloop, invalidate, onLost, animate]);
    return null;
}
export default function Scene({ settings, onLost }: { settings: StudioSettings; onLost: () => void }) {
    const sceneRoot = useRef<HTMLDivElement>(null);
    return (
        <div ref={sceneRoot} className="studio-canvas">
            <Canvas
                camera={{ position: [0, 0, 4.5], fov: 55 }}
                dpr={[1, settings.quality]}
                gl={{ alpha: false, antialias: false }}
                frameloop={settings.animate ? 'always' : 'demand'}
                fallback={<Poster message="WebGL is unavailable. The controls and field guide are still accessible." />}
            >
                <color attach="background" args={[settings.background]} />
                <Suspense fallback={null}>
                    <Subject settings={settings} />
                </Suspense>
                <EnvironmentWrapper key={settings.highlight} intensity={settings.environment} highlight={settings.highlight} />
                <ambientLight intensity={0.3} />
                <OrbitControls enablePan={false} minDistance={2.5} maxDistance={8} />
                <PostProcessing settings={settings} />
                <CanvasLifetime onLost={onLost} animate={settings.animate} />
            </Canvas>
        </div>
    );
}
