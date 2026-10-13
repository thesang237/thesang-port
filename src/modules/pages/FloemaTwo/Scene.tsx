'use client';

/* R3F owns these Three.js resources. Mutating them in frame callbacks avoids React renders; each owned resource is disposed on unmount. */
/* eslint-disable react-hooks/immutability */

import { Suspense, useEffect, useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { asset, heroTiles } from './data';
import { motion, type SceneDialsRef } from './motion';

type Props = { mode: 'home' | 'outline' | 'cube'; dialsRef: SceneDialsRef; active: boolean; onReady: () => void; onLost: () => void };

function Ready({ onReady }: { onReady: () => void }) {
    useEffect(onReady, [onReady]);
    return null;
}
function RendererLifecycle({ onLost }: { onLost: () => void }) {
    const { gl } = useThree();
    useEffect(() => {
        const canvas = gl.domElement;
        const lost = (event: Event) => {
            event.preventDefault();
            onLost();
        };
        canvas.addEventListener('webglcontextlost', lost);
        if (new URLSearchParams(location.search).has('debug')) Object.assign(window, { __floemaGPU: gl });
        return () => {
            canvas.removeEventListener('webglcontextlost', lost);
            delete (window as Window & { __floemaGPU?: THREE.WebGLRenderer }).__floemaGPU;
        };
    }, [gl, onLost]);
    return null;
}

function ImageField({ dialsRef }: { dialsRef: SceneDialsRef }) {
    const textures = useTexture(heroTiles.map((t) => asset(t.image)));
    const { viewport } = useThree();
    const cards = useMemo(
        () =>
            heroTiles.map((tile, index) => {
                const material = new THREE.MeshBasicMaterial({ map: textures[index], transparent: true, opacity: Math.min(1, tile.depth + 0.15), depthWrite: false, toneMapped: false });
                return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
            }),
        [textures],
    );
    useEffect(
        () => () =>
            cards.forEach((card) => {
                card.geometry.dispose();
                card.material.dispose();
            }),
        [cards],
    );
    const travel = useMemo(() => ({ speed: motion.heroCruise, distance: 0 }), []);
    // Each lane starts at its measured screen position, then approaches the camera.
    // The far/near wrap occurs after the card has faded out, so there is no visible reset.
    const lanes = useMemo(() => heroTiles.map((tile) => ({ distance: 30 - (0.1 + tile.depth * 0.5) * 26 })), []);
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);
        const dials = dialsRef.current;
        dials.scrollVelocity *= Math.exp(-4 * dt);
        const targetSpeed = motion.heroCruise + dials.progress * 2 + dials.scrollVelocity * motion.heroBoost;
        travel.speed = THREE.MathUtils.damp(travel.speed, targetSpeed, 5, dt);
        travel.distance += travel.speed * dt;
        cards.forEach((card, i) => {
            const tile = heroTiles[i];
            const initial = lanes[i].distance;
            const distance = 30 - ((((30 - initial + travel.distance) % 26) + 26) % 26);
            const projection = initial / 20;
            card.position.set((tile.x / 100 - 0.5) * viewport.width * projection, (0.5 - tile.y / 100) * viewport.height * projection, 20 - distance);
            card.scale.set((tile.w / 100) * viewport.width * projection, (tile.h / 100) * viewport.height * projection, 1);
            card.material.opacity = Math.min(1, (30 - distance) / 3, (distance - 4) / 2) * Math.min(1, tile.depth + 0.25);
        });
    });
    return (
        <group>
            {cards.map((card, index) => (
                <primitive key={index} object={card} />
            ))}
        </group>
    );
}

function WireframeCharger({ dialsRef, visible }: { dialsRef: SceneDialsRef; visible: boolean }) {
    const { scene: source } = useGLTF(asset('charging-station.glb'), '/draco/gltf/');
    const { viewport } = useThree();
    const model = useMemo(() => {
        const group = new THREE.Group();
        const fill = new THREE.MeshBasicMaterial({ color: '#022725', toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
        const ink = new THREE.LineBasicMaterial({ color: '#667550', toneMapped: false, transparent: true, opacity: 0.82 });
        source.updateMatrixWorld(true);
        source.traverse((node) => {
            if (!(node instanceof THREE.Mesh)) return;
            const part = new THREE.Group();
            part.add(new THREE.Mesh(node.geometry, fill));
            const edges = new THREE.EdgesGeometry(node.geometry, 28);
            const positions = edges.getAttribute('position');
            const clean: number[] = [];
            for (let i = 0; i < positions.count; i += 2) {
                // The source's front panel contains a triangulation seam, not a product edge.
                const dx = Math.abs(positions.getX(i) - positions.getX(i + 1));
                const dy = Math.abs(positions.getY(i) - positions.getY(i + 1));
                const dz = Math.abs(positions.getZ(i) - positions.getZ(i + 1));
                if (dx > 0.2 && dy > 0.25 && dz < 0.03) continue;
                for (let j = i; j <= i + 1; j++) clean.push(positions.getX(j), positions.getY(j), positions.getZ(j));
            }
            edges.dispose();
            const outline = new THREE.BufferGeometry();
            outline.setAttribute('position', new THREE.Float32BufferAttribute(clean, 3));
            part.add(new THREE.LineSegments(outline, ink));
            part.applyMatrix4(node.matrixWorld);
            group.add(part);
        });
        const frontWidth = new THREE.Box3().setFromObject(source).getSize(new THREE.Vector3()).x;
        group.rotation.y = -Math.PI / 2;
        const bounds = new THREE.Box3().setFromObject(group);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        group.position.sub(center);
        const root = new THREE.Group();
        root.add(group);
        return { root, height: size.y, frontWidth, fill, ink };
    }, [source]);
    useEffect(
        () => () => {
            model.root.traverse((node) => {
                if (node instanceof THREE.LineSegments) node.geometry.dispose();
            });
            model.fill.dispose();
            model.ink.dispose();
        },
        [model],
    );
    useFrame((_, delta) => {
        model.root.visible = visible;
        if (!visible) return;
        const p = dialsRef.current.progress;
        const match = dialsRef.current.chargerMatch;
        // The cropped photo is 1064 × 1689, displayed at 90vh with its top at 10vh.
        const photoWidth = viewport.height * 0.9 * (1064 / 1689);
        const matchedHeight = (photoWidth / model.frontWidth) * model.height;
        const h = THREE.MathUtils.lerp(viewport.height * THREE.MathUtils.lerp(0.48, 1.05, p), matchedHeight, match);
        model.root.scale.setScalar(h / model.height);
        const storyY = THREE.MathUtils.lerp(-viewport.height * 0.26, -viewport.height * 0.055, p);
        model.root.position.y = THREE.MathUtils.lerp(storyY, viewport.height * 0.4 - matchedHeight / 2, match);
        const target = THREE.MathUtils.lerp(-p * Math.PI * 1.5, -Math.PI * 1.5, match) + dialsRef.current.pointerX * 0.025 * (1 - match);
        model.root.rotation.y = THREE.MathUtils.damp(model.root.rotation.y, target, 8, Math.min(delta, 0.05));
    });
    return <primitive object={model.root} dispose={null} />;
}

function MaterialCube({ dialsRef, visible }: { dialsRef: SceneDialsRef; visible: boolean }) {
    const { scene: source } = useGLTF(asset('cube.glb'), '/draco/gltf/');
    const maps = useTexture([asset('plastic-diffuse.jpg'), asset('plastic-normal-2.png'), asset('steel-normal-3.png'), asset('swatch-hpl.webp')]);
    const { viewport, gl, scene } = useThree();
    const model = useMemo(() => {
        maps[0].colorSpace = THREE.SRGBColorSpace;
        maps[1].colorSpace = THREE.NoColorSpace;
        maps[2].colorSpace = THREE.NoColorSpace;
        maps[3].colorSpace = THREE.SRGBColorSpace;
        maps.forEach((t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
        });
        const cube = source.clone(true);
        const body = new THREE.MeshStandardMaterial({ color: '#60564a', map: maps[0], normalMap: maps[1], normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.85, metalness: 0.08 });
        const logo = new THREE.MeshStandardMaterial({ color: '#9c7138', normalMap: maps[2], normalScale: new THREE.Vector2(0.2, 0.2), roughness: 0.48, metalness: 0.5 });
        cube.traverse((node) => {
            if (node instanceof THREE.Mesh) node.material = node.name === 'Logo' ? logo : body;
        });
        const bounds = new THREE.Box3().setFromObject(cube);
        const center = bounds.getCenter(new THREE.Vector3());
        cube.position.sub(center);
        const root = new THREE.Group();
        root.add(cube);
        root.rotation.set(0.4, -0.5, -0.3);
        return { root, body, logo, size: bounds.getSize(new THREE.Vector3()).length() };
    }, [gl, maps, source]);
    const colors = useMemo(() => [new THREE.Color('#60564a'), new THREE.Color('#b28d66'), new THREE.Color('#707677')], []);
    const logoColors = useMemo(() => [new THREE.Color('#9c7138'), new THREE.Color('#9c7138'), new THREE.Color('#d0d5d9')], []);
    const movement = useMemo(() => ({ x: 0.4, y: -0.5, material: -1, time: 0 }), []);
    useEffect(() => {
        const room = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(gl);
        const target = pmrem.fromScene(room, 0.04);
        scene.environment = target.texture;
        scene.environmentIntensity = 0.8;
        room.dispose();
        pmrem.dispose();
        return () => {
            scene.environment = null;
            target.dispose();
            model.body.dispose();
            model.logo.dispose();
        };
    }, [gl, model, scene]);
    useFrame((_, delta) => {
        model.root.visible = visible;
        if (!visible) return;
        const dt = Math.min(delta, 0.05);
        const index = dialsRef.current.material;
        movement.time += dialsRef.current.dragging ? 0 : dt;
        model.root.scale.setScalar((viewport.height * 0.65) / model.size);
        model.root.position.y = -viewport.height * 0.012 - dialsRef.current.cubeOffset / 100;
        movement.x = THREE.MathUtils.damp(movement.x, 0.4 + dialsRef.current.dragY + dialsRef.current.pointerY * 0.05 + Math.sin(movement.time * 0.14) * 0.18, 8, dt);
        movement.y = THREE.MathUtils.damp(movement.y, -0.5 + dialsRef.current.dragX + movement.time * 0.11 + index * 0.9, 7, dt);
        model.root.rotation.set(movement.x, movement.y, -0.3 + Math.sin(movement.time * 0.16) * 0.08);
        model.body.color.lerp(colors[index], 1 - Math.exp(-6 * dt));
        model.logo.color.lerp(logoColors[index], 1 - Math.exp(-6 * dt));
        if (movement.material !== index) {
            movement.material = index;
            model.body.map = index === 0 ? maps[0] : index === 1 ? maps[3] : null;
            model.body.normalMap = index === 0 ? maps[1] : index === 2 ? maps[2] : null;
            model.body.roughness = index === 2 ? 0.5 : 0.85;
            model.body.metalness = index === 2 ? 0.62 : 0.08;
            model.body.needsUpdate = true;
        }
    });
    return <primitive object={model.root} dispose={null} />;
}

export default function Scene({ mode, dialsRef, active, onReady, onLost }: Props) {
    return (
        <Canvas
            orthographic={mode !== 'home'}
            camera={mode === 'home' ? { position: [0, 0, 20], fov: 35, near: 0.1, far: 100 } : { position: [0, 0, 20], zoom: 100, near: 0.1, far: 100 }}
            dpr={[1, 1.5]}
            frameloop={active ? 'always' : 'never'}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', stencil: false }}
            onCreated={({ gl }) => {
                gl.setClearColor(0, 0);
                gl.toneMapping = THREE.NeutralToneMapping;
            }}
        >
            <RendererLifecycle onLost={onLost} />
            <ambientLight intensity={0.25} />
            <directionalLight position={[4, 6, 10]} intensity={0.45} />
            <Suspense fallback={null}>
                {mode === 'home' ? (
                    <ImageField dialsRef={dialsRef} />
                ) : (
                    <>
                        <WireframeCharger dialsRef={dialsRef} visible={mode === 'outline'} />
                        <MaterialCube dialsRef={dialsRef} visible={mode === 'cube'} />
                    </>
                )}
                <Ready onReady={onReady} />
            </Suspense>
        </Canvas>
    );
}
