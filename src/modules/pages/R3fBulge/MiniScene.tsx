'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material';
import type CSMClass from 'three-custom-shader-material/vanilla';

const VERTEX = `
uniform vec2 uMouse;
uniform float uRadius;
uniform float uIntensity;
varying vec2 vUv;

float circle(vec2 uv, vec2 circlePosition, float radius) {
  float dist = distance(circlePosition, uv);
  return 1.0 - smoothstep(0.0, radius, dist);
}

void main() {
  vec3 newPosition = position;
  float circleShape = circle(uv, (uMouse * 0.5) + 0.5, uRadius);
  newPosition.z += circleShape * uIntensity;
  csm_Position = newPosition;
  vUv = uv;
}
`;

const FRAGMENT = `
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  csm_DiffuseColor = vec4(uColor, 1.0);
}
`;

type Props = {
    radius: number;
    intensity: number;
    lerpSpeed: number;
    segments: number;
    color: string;
    wireframe?: boolean;
};

export default function MiniScene({ radius, intensity, lerpSpeed, segments, color, wireframe = false }: Props) {
    const { width, height } = useThree((s) => s.viewport);
    const materialRef = useRef<CSMClass>(null!);
    const mouseLerped = useRef({ x: 0, y: 0 });

    const colorVec = useMemo(() => new THREE.Color(color), [color]);

    const uniforms = useMemo(
        () => ({
            uMouse: { value: new THREE.Vector2(0, 0) },
            uRadius: { value: radius },
            uIntensity: { value: intensity },
            uColor: { value: colorVec },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    // sync props → uniforms without recreating object
    useEffect(() => {
        if (!materialRef.current?.uniforms) return;
        materialRef.current.uniforms.uRadius.value = radius;
        materialRef.current.uniforms.uIntensity.value = intensity;
        materialRef.current.uniforms.uColor.value = new THREE.Color(color);
    }, [radius, intensity, color]);

    useFrame((state) => {
        const mouse = state.mouse;
        mouseLerped.current.x = THREE.MathUtils.lerp(mouseLerped.current.x, mouse.x, lerpSpeed);
        mouseLerped.current.y = THREE.MathUtils.lerp(mouseLerped.current.y, mouse.y, lerpSpeed);
        if (materialRef.current?.uniforms) {
            materialRef.current.uniforms.uMouse.value.x = mouseLerped.current.x;
            materialRef.current.uniforms.uMouse.value.y = mouseLerped.current.y;
        }
    });

    return (
        <>
            <pointLight color="#ffffff" intensity={25} distance={12} decay={1} position={[2, 4, 5]} />
            <mesh>
                <planeGeometry args={[width, height, segments, segments]} />
                <CustomShaderMaterial
                    ref={materialRef}
                    baseMaterial={THREE.MeshStandardMaterial}
                    vertexShader={VERTEX}
                    fragmentShader={FRAGMENT}
                    uniforms={uniforms}
                    flatShading
                    wireframe={wireframe}
                    silent
                />
            </mesh>
        </>
    );
}
