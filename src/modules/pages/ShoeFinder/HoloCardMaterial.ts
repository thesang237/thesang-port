import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

import fragmentShader from '@/shaders/shoe-finder/holocard.frag';
import vertexShader from '@/shaders/shoe-finder/holocard.vert';

const HoloCardMaterial = shaderMaterial(
    {
        uTime: 0,
        uTexture: new THREE.Texture(),
        uOpacity: 1,
        uActive: 0,
    },
    vertexShader as string,
    fragmentShader as string,
);

extend({ HoloCardMaterial });

export type HoloCardMaterialType = InstanceType<typeof HoloCardMaterial> & {
    uTime: number;
    uTexture: THREE.Texture;
    uOpacity: number;
    uActive: number;
};

export default HoloCardMaterial;
