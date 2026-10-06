import { type RefObject, useEffect, useRef } from 'react';

import { type Baked, sceneUniforms, uploadBake } from './bake';
import { type Fragment, useFragment } from './gl';
import type { Scene } from './source';

/**
 * A fragment shader that knows a Solace scene: uploads its baked boundary maps (again whenever the
 * bake changes), sets every scene uniform, then lets `extra` set the demo's own uniforms on top.
 */
export function useDune(
    host: RefObject<HTMLElement | null>,
    frag: string,
    scene: Scene,
    baked: Baked,
    extra: (f: Fragment, time: number) => void,
    { animate = false, maxDpr = 2 }: { animate?: boolean; maxDpr?: number } = {},
) {
    const live = useRef({ scene, baked, extra });
    const gpu = useRef<{ baked: Baked | null; tex: { edges: WebGLTexture; meta: WebGLTexture } | null }>({ baked: null, tex: null });

    const { invalidate } = useFragment(
        host,
        frag,
        (f, time) => {
            const L = live.current;
            if (gpu.current.baked !== L.baked) {
                if (gpu.current.tex) {
                    f.gl.deleteTexture(gpu.current.tex.edges);
                    f.gl.deleteTexture(gpu.current.tex.meta);
                }
                gpu.current = { baked: L.baked, tex: uploadBake(f, L.baked) };
            }
            f.texture('uEdges', gpu.current.tex!.edges, 0);
            f.texture('uMeta', gpu.current.tex!.meta, 1);
            sceneUniforms(f, L.scene, L.baked);
            f.set('uSwayPhase', 0);
            L.extra(f, time);
        },
        {
            animate,
            maxDpr,
            // a new GL context (remount, recompile) needs a fresh upload
            setup: () => {
                gpu.current = { baked: null, tex: null };
            },
        },
    );

    useEffect(() => {
        live.current = { scene, baked, extra };
        invalidate();
    });

    return { invalidate };
}
