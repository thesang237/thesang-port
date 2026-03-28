'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useTexture } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { GridCanvas } from './GridCanvas';
import { CONFIG, DEFAULT_CONFIG } from './gridConfig';
import { calculateGridDimensions, EMPTY_COLORS, matchesFilter, rigState } from './gridState';
import { UnifiedControlBar } from './GridUI';
import { ShoeFinderHeader } from './Header';
import MiniMap from './MiniMap';
import { Rig } from './Rig';
import shoes from './shoes.json';
import type { ShoeData } from './ShoeTile';
import { TopologyBackground } from './TopologyBackground';

import './HoloCardMaterial'; // Registers <holoCardMaterial />

// Preload all textures
(shoes as ShoeData[]).forEach((shoe) => {
    useTexture.preload(shoe.image_url);
});

type GridLayer = {
    id: string;
    items: ShoeData[];
    mode: 'enter' | 'exit';
    startTime: number;
};

export default function ShoeGrid() {
    const [zoomTarget, setZoomTarget] = useState<number | 'OUT' | null>(null);
    const [initialZoom] = useState(DEFAULT_CONFIG.zoomOut);
    const [currentZoom, setCurrentZoom] = useState(rigState.zoom);
    const [hasActiveSelection, setHasActiveSelection] = useState(false);
    const [nikeFilter, setNikeFilter] = useState('all');
    const [colorFilter, setColorFilter] = useState<string[]>(EMPTY_COLORS);
    const [activeCollectionIdx, setActiveCollectionIdx] = useState(0);

    useEffect(() => {
        const iv = setInterval(() => setCurrentZoom(rigState.zoom), 50);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setHasActiveSelection(rigState.activeId !== null), 16);
        return () => clearInterval(iv);
    }, []);

    const isZoomedIn = currentZoom <= CONFIG.zoomIn + 0.5;

    useEffect(() => {
        const update = () => {
            const width = window.innerWidth;
            const newZoomOut = width < 480 ? 48 : width < 768 ? 38 : DEFAULT_CONFIG.zoomOut;
            CONFIG.zoomOut = newZoomOut;
            if (rigState.zoom > CONFIG.zoomIn + 2) {
                rigState.zoom = newZoomOut;
                setCurrentZoom(newZoomOut);
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const collectionsData = useMemo(() => {
        const allShoes = shoes as ShoeData[];
        const nike = allShoes.filter((s) => s.brand === 'Nike');
        const nbFull = allShoes.filter((s) => s.brand === 'New Balance');
        const nbHalf = nbFull.slice(0, Math.ceil(nbFull.length / 2));
        const newBalance = [...nbHalf, ...nbHalf.map((s, i) => ({ ...s, product_url: `${s.product_url}-dup-${i}` }))];
        const budget = allShoes.filter((s) => {
            const price = parseInt(s.price?.replace(/[$,]/g, '') || '999');
            return price < 150;
        });
        return [nike, newBalance, budget];
    }, []);

    const [gridLayers, setGridLayers] = useState<GridLayer[]>(() => [{ id: 'init', items: (shoes as ShoeData[]).filter((s) => s.brand === 'Nike'), mode: 'enter', startTime: 0 }]);

    const handleCollectionSwitch = (index: number) => {
        if (index === activeCollectionIdx) return;
        const now = Date.now();
        setGridLayers((prev) => {
            const exiting = prev.map((layer) => (layer.mode === 'enter' ? { ...layer, mode: 'exit' as const, startTime: now } : layer));
            const newLayer: GridLayer = { id: `grid-${index}-${now}`, items: collectionsData[index], mode: 'enter', startTime: now };
            return [...exiting, newLayer];
        });
        setActiveCollectionIdx(index);
        setNikeFilter('all');
        setColorFilter(EMPTY_COLORS);
        rigState.target.set(0, 2, 0);
        rigState.activeId = null;
        setTimeout(() => setGridLayers((prev) => prev.filter((l) => l.mode === 'enter')), CONFIG.cleanupTimeout);
    };

    const handleFilterChange = (filter: string) => {
        if (filter === nikeFilter) return;
        setNikeFilter(filter);
        rigState.activeId = null;
    };

    useEffect(() => {
        if (zoomTarget === null) return;
        if (zoomTarget === 'OUT') {
            rigState.zoom = CONFIG.zoomOut;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentZoom(CONFIG.zoomOut);
            rigState.target.set(0, 2, 0);
        } else if (typeof zoomTarget === 'number') {
            rigState.zoom = zoomTarget;

            setCurrentZoom(zoomTarget);
        }
        setZoomTarget(null);
    }, [zoomTarget]);

    const activeLayer = gridLayers[gridLayers.length - 1];

    const filteredItemCount = useMemo(() => {
        if (activeCollectionIdx !== 0) return activeLayer.items.length;
        return activeLayer.items.filter((item) => matchesFilter(item, nikeFilter, colorFilter)).length;
    }, [activeLayer.items, activeCollectionIdx, nikeFilter, colorFilter]);

    const activeDims = calculateGridDimensions(filteredItemCount);

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#f0f0f0',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'none',
            }}
        >
            <ShoeFinderHeader />
            <Canvas camera={{ position: [0, 0, initialZoom], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
                <Rig gridW={activeDims.width} gridH={activeDims.height} />
                <TopologyBackground isZoomedIn={isZoomedIn} color={CONFIG.bgColor} opacity={CONFIG.bgOpacity} speed={CONFIG.bgSpeed} scale={CONFIG.bgScale} lineThickness={CONFIG.bgLineThickness} />
                <fog attach="fog" args={['#f0f0f0', DEFAULT_CONFIG.fogNear, DEFAULT_CONFIG.fogFar]} />
                <Suspense fallback={null}>
                    {gridLayers.map((layer) => (
                        <GridCanvas
                            key={layer.id}
                            items={layer.items}
                            gridVisible={layer.mode === 'enter'}
                            transitionStartTime={layer.startTime}
                            interactive={layer.mode === 'enter'}
                            filter={activeCollectionIdx === 0 ? nikeFilter : 'all'}
                            colorFilter={activeCollectionIdx === 0 ? colorFilter : EMPTY_COLORS}
                        />
                    ))}
                </Suspense>
            </Canvas>
            <MiniMap gridDims={activeDims} rigState={rigState} config={CONFIG} totalItems={filteredItemCount} isZoomedIn={isZoomedIn} />
            <UnifiedControlBar
                currentCollection={activeCollectionIdx}
                onSwitch={handleCollectionSwitch}
                setZoomTrigger={setZoomTarget}
                isZoomedIn={isZoomedIn}
                hasActiveSelection={hasActiveSelection}
                nikeFilter={nikeFilter}
                onFilterChange={handleFilterChange}
            />
        </div>
    );
}
