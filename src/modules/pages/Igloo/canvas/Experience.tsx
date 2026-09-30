'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { useIglooUI } from '../store';

import Compositor from './Compositor';
import CrystalWorld from './CrystalWorld';
import IglooWorld from './IglooWorld';
import ParticleWorld from './ParticleWorld';
import RingsWorld from './RingsWorld';

function Worlds() {
    const gl = useThree((s) => s.gl);
    const env = useMemo(() => {
        const pmrem = new THREE.PMREMGenerator(gl);
        const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
        return tex;
    }, [gl]);

    useEffect(() => {
        useIglooUI.getState().set({ ready: true });
        return () => env.dispose();
    }, [env]);

    return (
        <>
            <IglooWorld env={env} />
            <CrystalWorld />
            <RingsWorld env={env} />
            <ParticleWorld env={env} />
            <Compositor />
        </>
    );
}

export default function Experience() {
    return (
        <Canvas
            className="!fixed inset-0"
            dpr={[1, 1.5]}
            shadows={{ type: THREE.PCFSoftShadowMap }}
            gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
            camera={{ position: [0, 0, 5] }}
            onCreated={({ gl }) => {
                gl.toneMapping = THREE.NeutralToneMapping;
                gl.toneMappingExposure = 1;
            }}
        >
            <Suspense fallback={null}>
                <Worlds />
            </Suspense>
        </Canvas>
    );
}
