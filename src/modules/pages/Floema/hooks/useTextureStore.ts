import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Module-level singleton — persists for app lifetime
const TEXTURES = new Map<string, THREE.Texture>();

export function getTexture(url: string): THREE.Texture | undefined {
    return TEXTURES.get(url);
}

export function usePreloadTextures(urls: string[], onProgress: (loaded: number, total: number) => void, onComplete: () => void) {
    const completedRef = useRef(false);

    useEffect(() => {
        if (completedRef.current) return;
        if (urls.length === 0) {
            onComplete();
            return;
        }

        let loaded = 0;
        const total = urls.length;
        const loader = new THREE.TextureLoader();

        urls.forEach((url) => {
            if (!url) {
                loaded++;
                onProgress(loaded, total);
                if (loaded === total) {
                    completedRef.current = true;
                    onComplete();
                }
                return;
            }

            // Return cached texture immediately
            if (TEXTURES.has(url)) {
                loaded++;
                onProgress(loaded, total);
                if (loaded === total) {
                    completedRef.current = true;
                    onComplete();
                }
                return;
            }

            loader.load(
                url,
                (texture) => {
                    texture.generateMipmaps = false;
                    texture.needsUpdate = true;
                    TEXTURES.set(url, texture);
                    loaded++;
                    onProgress(loaded, total);
                    if (loaded === total) {
                        completedRef.current = true;
                        onComplete();
                    }
                },
                undefined,
                () => {
                    loaded++;
                    onProgress(loaded, total);
                    if (loaded === total) {
                        completedRef.current = true;
                        onComplete();
                    }
                },
            );
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
