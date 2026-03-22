'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Darkens the backface to black (0.7 mix factor), frontface shows the collage texture
function onBeforeCompile(shader: THREE.WebGLProgramParametersWithUniforms) {
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
    if (!gl_FrontFacing) {
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0), 0.7);
    }`,
    );
}

type BillboardProps = {
    texture: THREE.Texture;
};

export default function Billboard({ texture }: BillboardProps) {
    const matRef = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((_, delta) => {
        if (matRef.current?.map) {
            matRef.current.map.offset.x += delta * 0.001;
        }
    });

    return (
        <mesh>
            <cylinderGeometry args={[5, 5, 2, 100, 1, true]} />
            <meshBasicMaterial ref={matRef} map={texture} side={THREE.DoubleSide} onBeforeCompile={onBeforeCompile} customProgramCacheKey={() => 'kinetic-billboard'} />
        </mesh>
    );
}
