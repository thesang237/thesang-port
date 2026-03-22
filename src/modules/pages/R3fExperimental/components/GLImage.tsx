'use client';

import { forwardRef, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import horizontalImageVertexShader from '../shaders/horizontal-image/vertex.glsl';
import imageFragmentShader from '../shaders/image/fragment.glsl';
import imageVertexShader from '../shaders/image/vertex.glsl';

type GLImageProps = {
    imageUrl?: string;
    scale: [number, number, number];
    position?: [number, number, number];
    curveStrength?: number;
    curveFrequency?: number;
    geometry: THREE.PlaneGeometry;
    direction?: 'vertical' | 'horizontal';
};

const GLImage = forwardRef<THREE.Mesh, GLImageProps>(
    ({ imageUrl = '/images/r3f-carousel/img1.webp', scale, position = [0, 0, 0], curveStrength, curveFrequency, geometry, direction = 'vertical' }, forwardedRef) => {
        const localRef = useRef<THREE.Mesh>(null);
        const imageRef = forwardedRef || localRef;
        const texture = useTexture(imageUrl);

        const imageSizes = useMemo(() => {
            if (!texture) return [1, 1];
            // @ts-expect-error ignore
            return [texture.image.width, texture.image.height];
        }, [texture]);

        const shaderArgs = useMemo(
            () => ({
                uniforms: {
                    uTexture: { value: texture },
                    uScrollSpeed: { value: 0.0 },
                    uPlaneSizes: { value: new THREE.Vector2(scale[0], scale[1]) },
                    uImageSizes: {
                        value: new THREE.Vector2(imageSizes[0], imageSizes[1]),
                    },
                    uCurveStrength: { value: curveStrength || 0 },
                    uCurveFrequency: { value: curveFrequency || 0 },
                },
                vertexShader: direction === 'vertical' ? imageVertexShader : horizontalImageVertexShader,
                fragmentShader: imageFragmentShader,
            }),
            [texture, direction, curveStrength, curveFrequency, scale, imageSizes],
        );

        return (
            <mesh position={position} ref={imageRef} scale={scale}>
                <primitive object={geometry} attach="geometry" />
                <shaderMaterial {...shaderArgs} />
            </mesh>
        );
    },
);

GLImage.displayName = 'GLImage';

export default GLImage;
