'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three/webgpu';

type Props = {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** render loop on/off (pause when off-screen) */
    active?: boolean;
    /** force the WebGL2 backend (debug / comparison) */
    forceWebGL?: boolean;
    onReady?: (renderer: THREE.WebGPURenderer) => void;
};

/**
 * One R3F canvas using three/webgpu's WebGPURenderer (TSL materials). When WebGPU is not available the
 * renderer transparently falls back to its WebGL2 backend. Orthographic camera in CSS-pixel units
 * (origin = canvas centre, +y up), DPR capped at 2, no tone mapping so sRGB colours stay exact.
 * Scene objects are passed as <primitive object={…} /> (no JSX catalogue extension needed).
 */
export default function WebGLCanvas({ children, className, style, active = true, forceWebGL = false, onReady }: Props) {
    return (
        <Canvas
            className={className}
            style={style}
            flat
            dpr={[1, 2]}
            orthographic
            camera={{ zoom: 1, position: [0, 0, 500], near: 0.1, far: 2000 }}
            frameloop={active ? 'always' : 'never'}
            gl={async (props) => {
                const renderer = new THREE.WebGPURenderer({
                    canvas: props.canvas as HTMLCanvasElement,
                    antialias: true,
                    alpha: true,
                    forceWebGL,
                    powerPreference: 'high-performance',
                });
                await renderer.init();
                renderer.toneMapping = THREE.NoToneMapping;
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.setClearColor(0x000000, 0);
                onReady?.(renderer);
                return renderer as unknown as THREE.WebGPURenderer;
            }}
        >
            {children}
        </Canvas>
    );
}
