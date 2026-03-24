'use client';

// https://cydstumpel.nl/ — original by Cyd Stumpel
// Ported to Next.js / React 19 / R3F v9 by thesang.dev

import { useRef, useState } from 'react';
import { Environment, Image, ScrollControls, useScroll, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import './utils';

// ─── Damping helpers (replaces maath/easing) ─────────────────────────────────

function damp(object: Record<string, number>, key: string, to: number, lambda: number, delta: number) {
    object[key] = THREE.MathUtils.damp(object[key], to, lambda, delta);
}

function damp3(current: THREE.Vector3, to: [number, number, number] | number, lambda: number, delta: number) {
    const [x, y, z] = typeof to === 'number' ? ([to, to, to] as [number, number, number]) : to;
    current.x = THREE.MathUtils.damp(current.x, x, lambda, delta);
    current.y = THREE.MathUtils.damp(current.y, y, lambda, delta);
    current.z = THREE.MathUtils.damp(current.z, z, lambda, delta);
}

// ─── Rig: rotates the carousel based on scroll + follows the mouse ────────────

function Rig(props: { children: React.ReactNode; rotation?: [number, number, number] }) {
    const ref = useRef<THREE.Group>(null!);
    const scroll = useScroll();
    useFrame((state, delta) => {
        if (!ref.current) return;
        // Full 360° rotation as user scrolls through 4 pages
        ref.current.rotation.y = -scroll.offset * (Math.PI * 2);
        // Raycast every frame so hover works even while the carousel is spinning
        state.events.update?.();
        // Subtle camera parallax following the pointer
        damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y + 1.5, 10], 0.3 / delta, delta);
        state.camera.lookAt(0, 0, 0);
    });
    return <group ref={ref} {...(props as object)} />;
}

// ─── Carousel: 8 cards in a circle ───────────────────────────────────────────

function Carousel({ radius = 1.4, count = 8 }) {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <Card
                    key={i}
                    url={`/r3f-cards/img${(i % 10) + 1}_.jpg`}
                    position={[Math.sin((i / count) * Math.PI * 2) * radius, 0, Math.cos((i / count) * Math.PI * 2) * radius]}
                    rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
                />
            ))}
        </>
    );
}

// ─── Card: a single curved image that reacts to hover ────────────────────────

function Card({ url, ...props }: { url: string; position: [number, number, number]; rotation: [number, number, number] }) {
    const ref = useRef<THREE.Mesh & { material: { radius: number; zoom: number } }>(null!);
    const [hovered, hover] = useState(false);

    const pointerOver = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        hover(true);
    };
    const pointerOut = () => hover(false);

    useFrame((_state, delta) => {
        if (!ref.current) return;
        // Scale up on hover with smooth damping
        damp3(ref.current.scale, hovered ? 1.15 : 1, 0.1 / delta, delta);
        // Round the image corners more on hover (material property from drei Image)
        damp(ref.current.material as unknown as Record<string, number>, 'radius', hovered ? 0.25 : 0.1, 0.2 / delta, delta);
        // Zoom into the image slightly at rest, zoom out on hover
        damp(ref.current.material as unknown as Record<string, number>, 'zoom', hovered ? 1 : 1.5, 0.2 / delta, delta);
    });

    return (
        <Image ref={ref as React.Ref<THREE.Mesh>} url={url} transparent side={THREE.DoubleSide} onPointerOver={pointerOver} onPointerOut={pointerOut} {...props}>
            {/* Custom curved geometry: radius=0.1 gives a gentle organic bend */}
            <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
        </Image>
    );
}

// ─── Banner: animated ribbon below the carousel ──────────────────────────────

function Banner(props: { position: [number, number, number] }) {
    const ref = useRef<THREE.Mesh & { material: InstanceType<typeof import('./utils').MeshSineMaterial> }>(null!);
    const texture = useTexture('/r3f-cards/work_.png', (t) => {
        const tex = Array.isArray(t) ? t[0] : t;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    });
    const scroll = useScroll();

    useFrame((_state, delta) => {
        if (!ref.current?.material) return;
        // Drive sine wave amplitude with scroll speed
        ref.current.material.time.value += Math.abs(scroll.delta) * 4;
        // Continuously scroll the texture offset
        ref.current.material.map!.offset.x += delta / 2;
    });

    return (
        <mesh ref={ref as React.Ref<THREE.Mesh>} {...props}>
            <cylinderGeometry args={[1.6, 1.6, 0.14, 128, 16, true]} />
            <meshSineMaterial map={texture} map-anisotropy={16} map-repeat={[30, 1]} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
    );
}

// ─── Root Scene ───────────────────────────────────────────────────────────────

export default function R3fCardsScene() {
    return (
        <>
            <fog attach="fog" args={['#a79', 8.5, 12]} />
            <ScrollControls pages={4} infinite>
                <Rig rotation={[0, 0, 0.15]}>
                    <Carousel />
                </Rig>
                <Banner position={[0, -0.15, 0]} />
            </ScrollControls>
            <Environment preset="dawn" background blur={0.5} />
        </>
    );
}
