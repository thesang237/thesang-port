'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import html2canvas from 'html2canvas';
import { debounce } from 'lodash';
import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material';
import type CSMClass from 'three-custom-shader-material/vanilla';

import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const useDomToCanvas = (domEl: HTMLElement | null) => {
    const [texture, setTexture] = useState<THREE.CanvasTexture>();

    useEffect(() => {
        if (!domEl) return;

        const convertDomToCanvas = async () => {
            const canvas = await html2canvas(domEl, { backgroundColor: null });
            setTexture(new THREE.CanvasTexture(canvas));
        };

        convertDomToCanvas();

        const debouncedResize = debounce(() => {
            convertDomToCanvas();
        }, 100);

        window.addEventListener('resize', debouncedResize);
        return () => {
            window.removeEventListener('resize', debouncedResize);
        };
    }, [domEl]);

    return texture;
};

function Lights() {
    return <pointLight color="#ffffff" intensity={30} distance={12} decay={1} position={[2, 4, 6]} />;
}

export default function Scene() {
    const state = useThree();
    const { width, height } = state.viewport;
    const [domEl, setDomEl] = useState<HTMLElement | null>(null);

    const materialRef = useRef<CSMClass>(null!);
    const textureDOM = useDomToCanvas(domEl);

    const uniforms = useMemo(
        () => ({
            uTexture: { value: textureDOM },
            uMouse: { value: new THREE.Vector2(0, 0) },
        }),
        [textureDOM],
    );

    const mouseLerped = useRef({ x: 0, y: 0 });

    useFrame((state) => {
        const mouse = state.mouse;
        mouseLerped.current.x = THREE.MathUtils.lerp(mouseLerped.current.x, mouse.x, 0.1);
        mouseLerped.current.y = THREE.MathUtils.lerp(mouseLerped.current.y, mouse.y, 0.1);
        if (materialRef.current?.uniforms) {
            materialRef.current.uniforms.uMouse.value.x = mouseLerped.current.x;
            materialRef.current.uniforms.uMouse.value.y = mouseLerped.current.y;
        }
    });

    return (
        <>
            <Html zIndexRange={[-1, -10]} prepend fullscreen>
                <div
                    ref={(el) => setDomEl(el)}
                    style={{
                        width: '100%',
                        height: '100%',
                        fontSize: 'clamp(100px, 17vw, 200px)',
                        backgroundColor: '#000',
                        display: 'flex',
                        color: 'white',
                        alignItems: 'center',
                        paddingLeft: '3vw',
                        lineHeight: 0.8,
                        fontWeight: 700,
                        fontFamily: 'Roboto, sans-serif',
                    }}
                >
                    <p style={{ display: 'flex', flexDirection: 'column' }}>
                        THANH <br />
                        CHINH <br />
                        MAT <br />
                        TRINH ?<br />
                    </p>
                </div>
            </Html>
            <mesh>
                <planeGeometry args={[width, height, 254, 254]} />
                <CustomShaderMaterial ref={materialRef} baseMaterial={THREE.MeshStandardMaterial} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} flatShading silent />
                <Lights />
            </mesh>
        </>
    );
}
