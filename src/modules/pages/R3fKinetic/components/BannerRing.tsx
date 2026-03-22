'use client';

import { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Frontface shows the texture; backface shows a cosine palette gradient
function onBeforeCompile(shader: THREE.WebGLProgramParametersWithUniforms) {
    shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `vec3 pal(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}
void main() {`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
    if (!gl_FrontFacing) {
        diffuseColor.rgb = pal(
            vMapUv.x,
            vec3(0.5, 0.5, 0.5),
            vec3(0.5, 0.5, 0.5),
            vec3(1.0, 1.0, 1.0),
            vec3(0.0, 0.33, 0.67)
        );
    }`,
    );
}

const RADIUS = 5.035;
const HEIGHT = RADIUS * 0.07;
const RADIAL_SEGS = Math.round(RADIUS * 80);
const HEIGHT_SEGS = Math.round(RADIUS * 10);

export default function BannerRing() {
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    const texture = useTexture('/banner.jpg', (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(15, 1);
        tex.anisotropy = 16;
    });

    useFrame((_, delta) => {
        if (matRef.current?.map) {
            matRef.current.map.offset.x += delta / 30;
        }
    });

    return (
        <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0.085]}>
            <cylinderGeometry args={[RADIUS, RADIUS, HEIGHT, RADIAL_SEGS, HEIGHT_SEGS, true]} />
            <meshBasicMaterial ref={matRef} map={texture} side={THREE.DoubleSide} onBeforeCompile={onBeforeCompile} customProgramCacheKey={() => 'kinetic-banner'} />
        </mesh>
    );
}
