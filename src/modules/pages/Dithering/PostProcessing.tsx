'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import { createPrintPipeline } from './pipeline';
import type { StudioSettings } from './settings';

export function PostProcessing({ settings }: { settings: StudioSettings }) {
    const { gl, scene, camera, size, invalidate } = useThree();
    const pipeline = useRef<ReturnType<typeof createPrintPipeline> | null>(null);
    useEffect(() => {
        const app = createPrintPipeline(gl, scene, camera);
        pipeline.current = app;
        return () => {
            pipeline.current = null;
            app.dispose();
        };
    }, [gl, scene, camera]);
    useEffect(() => {
        pipeline.current?.resize(size.width, size.height);
        invalidate();
    }, [size.width, size.height, settings.quality, invalidate]);
    useEffect(() => {
        pipeline.current?.update(settings.dither, settings.before, settings.after);
        invalidate();
    }, [settings.dither, settings.before, settings.after, invalidate]);
    useFrame((_state, delta) => {
        gl.info.reset();
        pipeline.current?.render(delta);
        gl.domElement.setAttribute('data-draw-calls', String(gl.info.render.calls));
        gl.domElement.setAttribute('data-geometries', String(gl.info.memory.geometries));
        gl.domElement.setAttribute('data-textures', String(gl.info.memory.textures));
    }, 1);
    return null;
}
