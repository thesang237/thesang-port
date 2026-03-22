'use client';

import { Suspense, useMemo } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import BannerRing from './components/BannerRing';
import Billboard from './components/Billboard';
import { useCollageTexture } from './hooks/useCollageTexture';

const COUNT = 10;
const GAP = 3.2;

const COLLAGE_IMAGES = [
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
    const collageTexture = useCollageTexture(COLLAGE_IMAGES);

    const groups = useMemo(
        () =>
            Array.from({ length: COUNT }, (_, i) => ({
                id: i,
                y: i * GAP - ((COUNT - 1) * GAP) / 2,
            })),
        [],
    );

    if (!collageTexture) return null;

    return (
        <group rotation={[-0.15, 0, -0.2]}>
            {groups.map(({ id, y }) => (
                <group key={id} position={[0, y, 0]}>
                    <Billboard texture={collageTexture} />
                    <Suspense fallback={null}>
                        <BannerRing />
                    </Suspense>
                </group>
            ))}
        </group>
    );
}

export default function KineticScene() {
    return (
        <Canvas style={{ position: 'fixed', inset: 0, background: '#ffe135' }} camera={{ fov: 7, position: [0, 0, 70] }}>
            <Scene />
            <OrbitControls />
        </Canvas>
    );
}
