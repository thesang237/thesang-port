import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import type { Camera, Scene, WebGLRenderer } from 'three';
import { HalfFloatType } from 'three';

import { DitheringEffect } from './dithering-shader/DitheringEffect';
import type { BloomSettings, DitherSettings } from './settings';

/** Fixed GPU graph. Creation/disposal happen once per canvas lifetime. */
export function createPrintPipeline(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
    const previousAutoClear = renderer.autoClear;
    const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType, multisampling: 0 });
    composer.autoRenderToScreen = false;
    const print = new DitheringEffect();
    const before = new BloomEffect({ mipmapBlur: true });
    const after = new BloomEffect({ mipmapBlur: true });
    const beforePass = new EffectPass(camera, before);
    const printPass = new EffectPass(camera, print);
    const afterPass = new EffectPass(camera, after);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(beforePass);
    composer.addPass(printPass);
    composer.addPass(afterPass);
    function updateBloom(effect: BloomEffect, settings: BloomSettings) {
        effect.intensity = settings.intensity;
        effect.luminanceMaterial.threshold = settings.threshold;
        effect.luminanceMaterial.smoothing = settings.smoothing;
        effect.mipmapBlurPass.radius = settings.radius;
    }
    return {
        update(dither: DitherSettings, pre: BloomSettings, post: BloomSettings) {
            print.setSettings(dither);
            updateBloom(before, pre);
            updateBloom(after, post);
            beforePass.enabled = pre.enabled;
            afterPass.enabled = post.enabled;
            printPass.renderToScreen = !post.enabled;
            afterPass.renderToScreen = post.enabled;
        },
        resize(width: number, height: number) {
            composer.setSize(width, height);
        },
        render(delta: number) {
            composer.render(delta);
        },
        dispose() {
            composer.dispose(); // Includes passes, effects, materials and render targets.
            renderer.autoClear = previousAutoClear;
        },
    };
}
