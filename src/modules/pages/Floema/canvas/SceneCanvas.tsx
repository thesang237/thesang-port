'use client';
import { Canvas } from '@react-three/fiber';

import { useFloemaStore } from '../store/floemaStore';

import AboutGallery from './AboutGallery';
import CollectionsMedia from './CollectionsMedia';
import HomeGallery from './HomeGallery';

export default function SceneCanvas() {
    const currentPage = useFloemaStore((s) => s.currentPage);

    return (
        <Canvas
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1,
                pointerEvents: 'none',
            }}
            camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 5] }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
        >
            {currentPage === 'home' && <HomeGallery />}
            {currentPage === 'collections' && <CollectionsMedia />}
            {currentPage === 'about' && <AboutGallery />}
        </Canvas>
    );
}
