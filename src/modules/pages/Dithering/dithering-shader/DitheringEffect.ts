import { Effect, EffectAttribute } from 'postprocessing';
import type { WebGLRenderer, WebGLRenderTarget } from 'three';
import { Color, Uniform, Vector2 } from 'three';

import { DEFAULT_DITHER, type DitherSettings } from '../settings';

import ditheringShader from './DitheringShader';

export type DitheringEffectOptions = Partial<DitherSettings>;
/** Owns uniforms only. A slider changes values; it never rebuilds the shader. */
export class DitheringEffect extends Effect {
    constructor(options: DitheringEffectOptions = {}) {
        const settings = { ...DEFAULT_DITHER, ...options };
        const uniforms = new Map<string, Uniform<number | Vector2 | Color>>([
            ['resolution', new Uniform(new Vector2(1, 1))],
            ['pixelRatio', new Uniform(1)],
        ]);
        for (const [key, value] of Object.entries(settings)) {
            uniforms.set(key, new Uniform(typeof value === 'string' ? new Color(value) : typeof value === 'boolean' ? Number(value) : value));
        }
        // Texture-sampling effects need a separate input from previous effects.
        super('DitheringEffect', ditheringShader, { uniforms, attributes: EffectAttribute.CONVOLUTION });
    }
    setSettings(settings: DitherSettings): void {
        for (const [key, value] of Object.entries(settings)) {
            const uniform = this.uniforms.get(key);
            if (!uniform) continue;
            if (typeof value === 'string') (uniform.value as Color).set(value);
            else uniform.value = typeof value === 'boolean' ? Number(value) : value;
        }
    }
    update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget): void {
        (this.uniforms.get('resolution')!.value as Vector2).set(inputBuffer.width, inputBuffer.height);
        this.uniforms.get('pixelRatio')!.value = renderer.getPixelRatio();
    }
}
