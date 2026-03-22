'use client';

import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type PaperProps = {
    texture: THREE.Texture;
    position?: [number, number, number];
    rotation?: [number, number, number];
};

function Paper({ texture, ...props }: PaperProps) {
    const { scene } = useGLTF('/paper.glb');
    const mesh = scene.children[0] as THREE.Mesh;

    useEffect(() => {
        if (!texture || !mesh?.material) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        // eslint-disable-next-line react-hooks/immutability
        texture.colorSpace = THREE.SRGBColorSpace;

        texture.wrapS = THREE.RepeatWrapping;

        texture.wrapT = THREE.RepeatWrapping;
        // eslint-disable-next-line react-hooks/immutability
        mat.map = texture;

        mat.toneMapped = false;

        mat.needsUpdate = true;
    }, [texture, mesh]);

    useFrame((_, delta) => {
        if (!texture) return;
        // eslint-disable-next-line react-hooks/immutability
        texture.offset.y += delta / 30;
    });

    return <primitive {...props} object={scene} />;
}

useGLTF.preload('/paper.glb');

export default Paper;
