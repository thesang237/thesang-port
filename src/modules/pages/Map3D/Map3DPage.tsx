'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Html, OrbitControls, OrthographicCamera, useGLTF, useProgress, useTexture } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

import { type PointInfo, POINTS } from './data';
import { InfoPanel } from './InfoPanel';

// ─── constants ────────────────────────────────────────────────────────────────

const FRUSTUM = 12;
const BG_COLOR = '#d6d2ca';
const CAMERA_START: [number, number, number] = [3, 1, 3];
const CAMERA_END: [number, number, number] = [1, 0.6, 1];

// ─── preloader (outside Canvas — useProgress works globally) ──────────────────

function Preloader() {
    const { progress, active } = useProgress();
    const ref = useRef<HTMLDivElement>(null);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        if (!active && progress >= 100) {
            gsap.to(ref.current, {
                opacity: 0,
                delay: 0.5,
                duration: 0.6,
                onComplete: () => setHidden(true),
            });
        }
    }, [active, progress]);

    if (hidden) return null;

    return (
        <div ref={ref} className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ backgroundColor: BG_COLOR }}>
            <div className="flex items-center gap-4">
                <Image src="/3d-map/images/loader.svg" alt="Loading" width={48} height={48} className="animate-spin" style={{ animationDuration: '2s', animationTimingFunction: 'linear' }} />
                <span className="text-[#041676] text-6xl font-bold tabular-nums" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    {Math.round(progress)}
                </span>
            </div>
        </div>
    );
}

// ─── orthographic camera frustum sync on resize ───────────────────────────────

function OrthoResizer() {
    const camera = useThree((s) => s.camera);
    const { width, height } = useThree((s) => s.size);

    useEffect(() => {
        if (!(camera instanceof THREE.OrthographicCamera)) return;
        const aspect = width / height;
        // eslint-disable-next-line react-hooks/immutability
        camera.left = (-aspect * FRUSTUM) / 2;
        camera.right = (aspect * FRUSTUM) / 2;
        camera.top = FRUSTUM / 2;
        camera.bottom = -FRUSTUM / 2;
        camera.updateProjectionMatrix();
    }, [camera, width, height]);

    return null;
}

// ─── intro camera animation (runs once after model loads) ─────────────────────

function CameraIntro() {
    const camera = useThree((s) => s.camera);
    const done = useRef(false);

    useEffect(() => {
        if (done.current) return;
        done.current = true;
        camera.position.set(...CAMERA_START);
        gsap.to(camera.position, { x: CAMERA_END[0], y: CAMERA_END[1], z: CAMERA_END[2], duration: 2, delay: 0.6, ease: 'power2.inOut' });
    }, [camera]);

    return null;
}

// ─── baked-texture 3D model ───────────────────────────────────────────────────

function MapModel() {
    const { scene } = useGLTF('/3d-map/models/plateforme10.glb', '/draco/');

    const [texBuildings, texMdba, texMudac, texTerrain] = useTexture([
        '/3d-map/textures/buildings-baked.jpg',
        '/3d-map/textures/mdba-baked.jpg',
        '/3d-map/textures/mudacDetails-baked.jpg',
        '/3d-map/textures/terrain-baked.jpg',
    ]);

    const matBuildings = useMemo(() => {
        // eslint-disable-next-line react-hooks/immutability
        texBuildings.flipY = false;
        // eslint-disable-next-line react-hooks/immutability
        texBuildings.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshBasicMaterial({ map: texBuildings });
    }, [texBuildings]);
    const matMdba = useMemo(() => {
        // eslint-disable-next-line react-hooks/immutability
        texMdba.flipY = false;
        // eslint-disable-next-line react-hooks/immutability
        texMdba.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshBasicMaterial({ map: texMdba });
    }, [texMdba]);
    const matMudac = useMemo(() => {
        // eslint-disable-next-line react-hooks/immutability
        texMudac.flipY = false;
        // eslint-disable-next-line react-hooks/immutability
        texMudac.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshBasicMaterial({ map: texMudac });
    }, [texMudac]);
    const matTerrain = useMemo(() => {
        // eslint-disable-next-line react-hooks/immutability
        texTerrain.flipY = false;
        // eslint-disable-next-line react-hooks/immutability
        texTerrain.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshBasicMaterial({ map: texTerrain });
    }, [texTerrain]);
    const matLight = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffe5 }), []);

    useEffect(() => {
        scene.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            if (/^mdba/.test(child.name)) child.material = matMdba;
            else if (/^mudac/.test(child.name)) child.material = matMudac;
            else if (/^terrain/.test(child.name)) child.material = matTerrain;
            else if (/^buildings/.test(child.name)) child.material = matBuildings;
            else if (/^lightPanel/.test(child.name)) child.material = matLight;
        });
    }, [scene, matBuildings, matMdba, matMudac, matTerrain, matLight]);

    return <primitive object={scene} />;
}

// ─── HTML point-of-interest labels projected into 3D space ───────────────────

function PointLabels({ onPointClick }: { onPointClick: (p: PointInfo) => void }) {
    return (
        <>
            {POINTS.map((point) => {
                const isRestaurant = point.type === 'restaurant';
                const iconSrc = isRestaurant ? '/3d-map/images/icn-restaurant.svg' : point.logo;
                const size = isRestaurant ? 32 : 40;

                return (
                    <Html key={point.id} position={point.position} zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
                        {/* group — hover via CSS since this is real DOM inside Html portal */}
                        <div className="group relative" style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}>
                            <img
                                src={iconSrc}
                                alt={point.title}
                                width={size}
                                height={size}
                                draggable={false}
                                onClick={() => onPointClick(point)}
                                className="absolute cursor-pointer transition-transform duration-300 opacity-100 group-hover:scale-110"
                                style={{
                                    top: -size / 2,
                                    left: -size / 2,
                                    pointerEvents: 'auto',
                                    userSelect: 'none',
                                }}
                            />
                            {/* Tooltip */}
                            <div
                                className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                                style={{
                                    top: size / 2 + 8,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    padding: '0.5rem 0.75rem',
                                    background: '#ffffff',
                                    color: '#041676',
                                    borderRadius: 4,
                                    fontSize: '0.875rem',
                                    lineHeight: '1.2rem',
                                    fontFamily: 'Helvetica, Arial, sans-serif',
                                    zIndex: 999,
                                }}
                            >
                                {point.title}
                            </div>
                        </div>
                    </Html>
                );
            })}
        </>
    );
}

// ─── full R3F scene ───────────────────────────────────────────────────────────

function MapScene({ onPointClick }: { onPointClick: (p: PointInfo) => void }) {
    return (
        <>
            <color attach="background" args={[BG_COLOR]} />
            <fog attach="fog" args={[BG_COLOR, 5, 20]} />

            <OrthographicCamera makeDefault position={CAMERA_START} near={-20} far={20} zoom={1} />
            <OrthoResizer />

            <OrbitControls enableDamping enableZoom maxPolarAngle={Math.PI / 2} />

            <Suspense fallback={null}>
                <MapModel />
                <PointLabels onPointClick={onPointClick} />
                <CameraIntro />
            </Suspense>
        </>
    );
}

// ─── page component ───────────────────────────────────────────────────────────

export function Map3DPage() {
    const [activePoint, setActivePoint] = useState<PointInfo | null>(null);
    const panelOpen = activePoint !== null;

    const handlePointClick = useCallback((point: PointInfo) => {
        setActivePoint(point);
    }, []);

    const handleClose = useCallback(() => {
        setActivePoint(null);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '1.125rem' }}>
            {/* 3D Canvas */}
            <Canvas style={{ position: 'fixed', inset: 0 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.75 }} dpr={[1, 2]}>
                <MapScene onPointClick={handlePointClick} />
            </Canvas>

            {/* Preloader overlay */}
            <Preloader />

            {/* Logo */}
            <header className="absolute top-0 left-0 p-5 z-10 pointer-events-none">
                <Image src="/3d-map/images/logo-plateforme10.svg" alt="Logo Plateforme 10" width={80} height={80} className="sm:w-auto sm:h-auto" />
            </header>

            {/* Controls hint */}
            <footer
                className="absolute bottom-0 left-0 z-10 flex flex-col w-full pointer-events-none"
                style={{ fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', fontSize: '0.8rem', color: '#041676' }}
            >
                {/* Mouse controls — shown only on pointer:fine devices via CSS */}
                <p className="hidden [@media(hover:hover)_and_(pointer:fine)]:block px-5 pb-1 leading-[1.2rem]">
                    Mouse Controls
                    <br />
                    <br />
                    Left — Rotate
                    <br />
                    Right — Move
                    <br />
                    Middle — Zoom
                </p>
                {/* Touch controls */}
                <p className="hidden [@media(hover:none)_and_(pointer:coarse)]:block px-5 pb-1 leading-[1.2rem]">
                    Controls
                    <br />
                    <br />
                    One Finger Drag — Rotate
                    <br />
                    Two Finger Drag — Move
                    <br />
                    Pinch / Spread — Zoom
                </p>
                {/* Footer bar */}
                <div
                    className="w-full px-5 py-5 flex justify-between border-t border-[#041676] pointer-events-auto"
                    style={{ backgroundColor: 'rgba(214,210,202,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                    <span>
                        Created by{' '}
                        <a
                            href="http://kiril.ch"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#041676] border-b border-[#041676] no-underline transition-shadow duration-300 hover:shadow-[inset_0_-18px_0_rgba(61,89,246,0.3)]"
                        >
                            kiril.ch
                        </a>
                    </span>
                    <a
                        href="https://github.com/Kirilbt/interactive-map"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#041676] border-b border-[#041676] no-underline transition-shadow duration-300 hover:shadow-[inset_0_-18px_0_rgba(61,89,246,0.3)]"
                    >
                        View Code
                    </a>
                </div>
            </footer>

            {/* Info panel — slides in from right */}
            <InfoPanel point={activePoint} onClose={handleClose} />

            {/* Dim overlay when panel is open on mobile */}
            {panelOpen && <div className="fixed inset-0 bg-black/20 z-[90] sm:hidden" onClick={handleClose} />}
        </div>
    );
}

useGLTF.preload('/3d-map/models/plateforme10.glb');
