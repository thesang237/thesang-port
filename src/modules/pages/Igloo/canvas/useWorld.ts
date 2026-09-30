import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { worlds } from '../store';

type Options = {
    fov: number;
    background: string;
    fog?: THREE.Fog | THREE.FogExp2;
    environment?: THREE.Texture | null;
    environmentIntensity?: number;
};

/** Creates an isolated scene + camera pair and registers it for the compositor. */
export default function useWorld(index: number, { fov, background, fog, environment, environmentIntensity = 1 }: Options) {
    const world = useMemo(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(background);
        if (fog) scene.fog = fog;
        const camera = new THREE.PerspectiveCamera(fov, typeof window === 'undefined' ? 1 : window.innerWidth / window.innerHeight, 0.1, 400);
        return { scene, camera };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // the camera/scene are mutated every frame: expose them through a ref too
    const ref = useRef(world);

    useEffect(() => {
        const { scene } = ref.current;
        scene.environment = environment ?? null;
        scene.environmentIntensity = environmentIntensity;
    }, [environment, environmentIntensity]);

    useEffect(() => {
        worlds[index] = world;
        return () => {
            if (worlds[index] === world) worlds[index] = null;
        };
    }, [index, world]);

    return { ...world, ref };
}
