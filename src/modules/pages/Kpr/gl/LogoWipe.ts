'use client';

import * as THREE from 'three';

import type { Flipbook } from './assets';

/** Frames 0–92 of logo-anim-low-res: barcode rows fill the screen, drop out, the keeper symbol stays. */
export const LOGO_LAST = 92;

/**
 * A "barcode" wipe from a reference sheet (220×124 frames, possibly trimmed): logo-anim-low-res
 * (barcode → keeper symbol, white, story) and header-sprite (barcode only, black, the opening). Each
 * frame is placed inside its source rect, drawn in one colour, and its soft low-res alpha is thresholded so
 * the pills and crosses stay crisp at full-screen size.
 */
export function createLogoWipe(book: Flipbook, opts: { color?: THREE.ColorRepresentation; last?: number; order?: number } = {}) {
    const last = opts.last ?? LOGO_LAST;
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: book.textures[0] },
            uRect: { value: new THREE.Vector4() },
            uTrim: { value: new THREE.Vector4(0, 0, 1, 1) },
            uOpacity: { value: 1 },
            uSoft: { value: 0.08 },
            uColor: { value: new THREE.Color(opts.color ?? '#ffffff') },
        },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */ `
            uniform sampler2D uMap; uniform vec4 uRect; uniform vec4 uTrim; uniform float uOpacity; uniform float uSoft; uniform vec3 uColor;
            varying vec2 vUv;
            void main(){
                // source frame (y down) → trimmed frame
                vec2 s = vec2(vUv.x, 1.0 - vUv.y);
                vec2 f = (s - uTrim.xy) / uTrim.zw;
                if (f.x < 0.0 || f.x > 1.0 || f.y < 0.0 || f.y > 1.0) discard;
                float a = texture2D(uMap, uRect.xy + vec2(f.x, 1.0 - f.y) * uRect.zw).a;
                a = smoothstep(0.5 - uSoft, 0.5 + uSoft, a);
                if (a * uOpacity < 0.004) discard;
                gl_FragColor = vec4(uColor, a * uOpacity);
                #include <colorspace_fragment>
            }`,
        transparent: true,
        depthWrite: false,
        depthTest: false,
    });
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = opts.order ?? 200;
    mesh.frustumCulled = false;
    mesh.visible = false;
    const aspect = 220 / 124;

    return {
        mesh,
        /**
         * frame: 0..LOGO_LAST (float); the sheet is cover-fitted to the viewport, then moved to (x, y)
         * and squashed horizontally by `squash` (0..1) so the symbol can turn with a card.
         */
        update(frame: number, vw: number, vh: number, x: number, y: number, squash: number, opacity: number) {
            mesh.visible = opacity > 0.001 && squash > 0.002 && frame >= 0;
            if (!mesh.visible) return;
            const f = book.frames[Math.max(0, Math.min(last, Math.round(frame)))];
            mat.uniforms.uMap.value = book.textures[f.sheet];
            (mat.uniforms.uRect.value as THREE.Vector4).copy(f.rect);
            (mat.uniforms.uTrim.value as THREE.Vector4).copy(f.trim);
            mat.uniforms.uOpacity.value = opacity;
            // ~1.6 screen px of edge softness, whatever the scale
            const w = Math.max(vw, vh * aspect);
            mat.uniforms.uSoft.value = Math.min(0.2, Math.max(0.03, (220 / w) * 1.6 * 0.5));
            mesh.scale.set(w * squash, w / aspect, 1);
            mesh.position.set(x, y, 20);
        },
        count: book.frames.length,
        dispose() {
            geo.dispose();
            mat.dispose();
        },
    };
}
