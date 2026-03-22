'use client';

import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Darkens backface to black (0.7 mix), frontface shows the collage texture
function onBeforeCompile(shader: THREE.WebGLProgramParametersWithUniforms) {
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
    if (!gl_FrontFacing) {
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0), 0.7);
    }`,
    );
}

type SpiralProps = {
    texture: THREE.Texture;
};

function Spiral({ texture }: SpiralProps) {
    const { scene } = useGLTF('/spiral.glb');
    const mesh = scene.children[0] as THREE.Mesh;

    useEffect(() => {
        if (!texture || !mesh) return;
        // eslint-disable-next-line react-hooks/immutability
        texture.colorSpace = THREE.SRGBColorSpace;

        texture.wrapS = THREE.RepeatWrapping;

        texture.wrapT = THREE.RepeatWrapping;

        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            toneMapped: false,
        });
        mat.onBeforeCompile = onBeforeCompile;
        mat.customProgramCacheKey = () => 'kinetic-spiral';
        // eslint-disable-next-line react-hooks/immutability
        mesh.material = mat;
    }, [texture, mesh]);

    useFrame((_, delta) => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (!mat?.map) return;
        // eslint-disable-next-line react-hooks/immutability
        mat.map.offset.x -= delta / 50;
    });

    return <primitive object={scene} />;
}

useGLTF.preload('/spiral.glb');

export default Spiral;
