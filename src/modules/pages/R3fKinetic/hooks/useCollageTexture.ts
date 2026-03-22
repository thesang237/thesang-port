'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { getCanvasTexture, type GetCanvasTextureOptions } from '../utils/getCanvasTexture';

export function useCollageTexture(urls: string[], options: number | GetCanvasTextureOptions = 512): THREE.CanvasTexture | null {
    const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
    const urlsKey = JSON.stringify(urls);
    const optionsKey = JSON.stringify(options);
    const prevTexture = useRef<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        let cancelled = false;

        getCanvasTexture(urls, options).then((canvas) => {
            if (cancelled) return;

            prevTexture.current?.dispose();

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.generateMipmaps = false;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            prevTexture.current = tex;
            setTexture(tex);
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlsKey, optionsKey]);

    return texture;
}
