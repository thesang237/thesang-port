'use client';

import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import Spiral from './components/Spiral';
import { useCollageTexture } from './hooks/useCollageTexture';

const SPIRAL_IMAGES = [
    '/images/r3f-carousel/img1.webp',
    '/images/r3f-carousel/img2.webp',
    '/images/r3f-carousel/img3.webp',
    '/images/r3f-carousel/img4.webp',
    '/images/r3f-carousel/img5.webp',
    '/images/r3f-carousel/img6.webp',
    '/images/r3f-carousel/img7.webp',
    '/images/r3f-carousel/img8.webp',
    '/images/r3f-carousel/img9.webp',
    '/images/r3f-carousel/img10.webp',
    '/images/r3f-carousel/img11.webp',
    '/images/r3f-carousel/img12.webp',
    '/images/r3f-carousel/img13.webp',
];

function Scene() {
    const texture = useCollageTexture(SPIRAL_IMAGES);

    if (!texture) return null;

    return (
        <Suspense fallback={null}>
            <Spiral texture={texture} />
        </Suspense>
    );
}

export default function SpiralScene() {
    return (
        <Canvas style={{ position: 'fixed', inset: 0, background: '#ffe135' }} camera={{ fov: 7, position: [0, 0, 100], near: 0.01, far: 100000 }}>
            <Scene />
            <OrbitControls />
        </Canvas>
    );
}
