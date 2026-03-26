'use client';

import { useCallback, useRef, useState } from 'react';
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { ControlPanel } from './ControlPanel';
import { CubeGrid } from './CubeGrid';
import { DEFAULT_PARAMS, type Params } from './types';

type CameraState = {
    isOrtho: boolean;
    pos: [number, number, number];
};

// Syncs camera position to a ref each frame so parent can read it on toggle
function CamSync({ posRef }: { posRef: { current: THREE.Vector3 } }) {
    useFrame(({ camera }) => {
        posRef.current.copy(camera.position);
    });
    return null;
}

function SceneCamera({ state }: { state: CameraState }) {
    const p = state.pos;
    if (state.isOrtho) {
        return <OrthographicCamera makeDefault position={p} near={0.1} far={500} zoom={20} />;
    }
    return <PerspectiveCamera makeDefault fov={60} position={p} near={0.1} far={500} />;
}

export function OmmaCubesPage() {
    const paramsRef = useRef<Params>({ ...DEFAULT_PARAMS });
    const camPosRef = useRef(new THREE.Vector3(30, 25, 30));

    const [bgColor, setBgColor] = useState(DEFAULT_PARAMS.bgColor);
    const [camState, setCamState] = useState<CameraState>({
        isOrtho: false,
        pos: [30, 25, 30],
    });

    const handleToggleCamera = useCallback(() => {
        const { x, y, z } = camPosRef.current;
        setCamState((prev) => ({ isOrtho: !prev.isOrtho, pos: [x, y, z] }));
    }, []);

    const handleBgChange = useCallback((color: string) => {
        setBgColor(color);
    }, []);

    return (
        <div className="fixed inset-0">
            <Canvas shadows style={{ position: 'fixed', inset: 0 }}>
                <color attach="background" args={[bgColor]} />

                {/* Camera — keyed so it remounts on switch, matching original OrbitControls dispose/recreate */}
                <SceneCamera key={camState.isOrtho ? 'ortho' : 'persp'} state={camState} />
                <OrbitControls key={camState.isOrtho ? 'ortho-ctrl' : 'persp-ctrl'} enableDamping dampingFactor={0.08} minDistance={10} maxDistance={100} />

                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[40, 60, 30]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-camera-near={0.5}
                    shadow-camera-far={200}
                    shadow-camera-left={-40}
                    shadow-camera-right={40}
                    shadow-camera-top={40}
                    shadow-camera-bottom={-40}
                    shadow-bias={-0.001}
                    shadow-normalBias={0.02}
                />
                <hemisphereLight args={['#aaccff', '#446644', 0.4]} />

                <CubeGrid paramsRef={paramsRef} />
                <CamSync posRef={camPosRef} />
            </Canvas>

            <ControlPanel paramsRef={paramsRef} isOrtho={camState.isOrtho} onToggleCamera={handleToggleCamera} onBgChange={handleBgChange} />
        </div>
    );
}
