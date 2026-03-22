'use client';

import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import Paper from './components/Paper';
import { useCollageTexture } from './hooks/useCollageTexture';

const PAPER_IMAGES = ['/images/r3f-carousel/img1.webp', '/images/r3f-carousel/img2.webp', '/images/r3f-carousel/img3.webp', '/images/r3f-carousel/img4.webp', '/images/r3f-carousel/img5.webp'];

function Scene() {
    const texture = useCollageTexture(PAPER_IMAGES, { axis: 'y', canvasWidth: 1024 });

    if (!texture) return null;

    return (
        <Suspense fallback={null}>
            <Paper texture={texture} rotation={[0, Math.PI * 0.3, 0]} position={[0, 0.5, 0]} />
        </Suspense>
    );
}

export default function PaperScene() {
    return (
        <Canvas style={{ position: 'fixed', inset: 0, background: '#ffe135' }} camera={{ fov: 20, position: [0, 0, 13], near: 0.01, far: 100000 }}>
            <Scene />
            <OrbitControls />
        </Canvas>
    );
}
