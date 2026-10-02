'use client';

import * as THREE from 'three';

import type { Flipbook } from './assets';

/** TexturePacker / grid flipbook player: switches the UV rect (and sheet) per frame in the shader. */
export function createSpriteMaterial(book: Flipbook, opts: { additive?: boolean; opacity?: number; tint?: THREE.ColorRepresentation; tintAmount?: number; offset?: number } = {}) {
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            map: { value: book.textures[0] },
            rect: { value: book.frames[0].rect.clone() },
            opacity: { value: opts.opacity ?? 1 },
            tint: { value: new THREE.Color(opts.tint ?? '#ffffff') },
            tintAmount: { value: opts.tintAmount ?? 0 },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */ `
            uniform sampler2D map; uniform vec4 rect; uniform float opacity; uniform vec3 tint; uniform float tintAmount; varying vec2 vUv;
            void main(){
                vec4 c = texture2D(map, rect.xy + vUv * rect.zw);
                gl_FragColor = vec4(mix(c.rgb, c.rgb * tint, tintAmount), c.a * opacity);
                #include <colorspace_fragment>
            }`,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    return {
        material: mat,
        /** frame index (wraps) */
        setFrame(i: number) {
            const n = book.frames.length;
            const f = book.frames[((Math.floor(i) % n) + n) % n];
            mat.uniforms.map.value = book.textures[f.sheet];
            (mat.uniforms.rect.value as THREE.Vector4).copy(f.rect);
        },
        setTime(seconds: number) {
            this.setFrame((seconds + (opts.offset ?? 0)) * book.fps);
        },
        get count() {
            return book.frames.length;
        },
    };
}
