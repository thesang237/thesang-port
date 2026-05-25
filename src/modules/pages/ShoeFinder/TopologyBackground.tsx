'use client';

import { useRef } from 'react';
import { Plane, shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import * as THREE from 'three';

import fragmentShader from '@/shaders/shoe-finder/topography.frag';
import vertexShader from '@/shaders/shoe-finder/topography.vert';

const TopographyMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#e0e0e0'),
        uResolution: new THREE.Vector2(1, 1),
        uOpacity: 1.0,
        uLineOpacity: 0.4,
        uScale: 3.0,
        uLineThickness: 0.03,
    },
    vertexShader as string,
    fragmentShader as string,
);

extend({ TopographyMaterial });

type TopographyMaterialType = InstanceType<typeof TopographyMaterial> & {
    uTime: number;
    uColor: THREE.Color;
    uResolution: THREE.Vector2;
    uOpacity: number;
    uLineOpacity: number;
    uScale: number;
    uLineThickness: number;
};

export type { TopographyMaterialType };

type TopologyBackgroundProps = {
    isZoomedIn?: boolean;
    color?: string;
    opacity?: number;
    speed?: number;
    scale?: number;
    lineThickness?: number;
};

export function TopologyBackground({ isZoomedIn = false, color = '#e0e0e0', opacity = 0.4, speed = 0.05, scale = 3.0, lineThickness = 0.03 }: TopologyBackgroundProps) {
    const materialRef = useRef<TopographyMaterialType>(null);
    const planeWidth = 90;
    const planeHeight = 40;

    useFrame((_, delta) => {
        if (!materialRef.current) return;
        materialRef.current.uTime += delta * (speed / 0.05);
        materialRef.current.uResolution.set(planeWidth, planeHeight);
        materialRef.current.uColor.set(color);
        materialRef.current.uLineOpacity = opacity;
        materialRef.current.uScale = scale;
        materialRef.current.uLineThickness = lineThickness;
        const targetOpacity = isZoomedIn ? 0.25 : 1.0;
        easing.damp(materialRef.current, 'uOpacity', targetOpacity, 0.3, delta);
    });

    return (
        <Plane args={[planeWidth, planeHeight]} position={[0, 0, -15]} renderOrder={-1}>
            <topographyMaterial ref={materialRef} transparent depthWrite={false} />
        </Plane>
    );
}
