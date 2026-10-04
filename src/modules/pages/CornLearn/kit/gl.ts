import * as THREE from 'three';

/**
 * The page draws every world in linear light into a half-float target and converts to display colour
 * at the very end (Composite.ts). Demos that reuse the source's materials do the same, so colours and
 * glow match the page: draw into `target`, then `present()` converts and puts it on the canvas.
 * Optional grain + vignette, the page's last pass.
 */
const quadVert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const presentFrag = /* glsl */ `
uniform sampler2D tSrc, tNoise;
uniform float uGrain, uVignette;
uniform vec2 uNoiseScale, uNoiseOffset;
varying vec2 vUv;
vec3 toSrgb(vec3 c) {
    c = max(c, 0.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
    vec3 col = toSrgb(texture2D(tSrc, vUv).rgb);
    float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.2, 1.0)));
    col *= mix(mix(0.78, 1.0, v), 1.0, 1.0 - uVignette);
    if (uGrain > 0.0) col += (texture2D(tNoise, vUv * uNoiseScale + uNoiseOffset).r - 0.5) * uGrain;
    gl_FragColor = vec4(col, 1.0);
}`;

export function fullscreenPass(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: quadVert, fragmentShader, uniforms, depthTest: false, depthWrite: false }));
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    return {
        scene,
        mesh,
        uniforms,
        dispose() {
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        },
    };
}

export function createLinearOutput(opts: { samples?: number; grain?: number; vignette?: boolean } = {}) {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: opts.samples ?? 2, depthBuffer: true });
    let noise: THREE.Texture | null = null;
    const pass = fullscreenPass(presentFrag, {
        tSrc: { value: target.texture },
        tNoise: { value: null },
        uGrain: { value: 0 },
        uVignette: { value: opts.vignette ? 1 : 0 },
        uNoiseScale: { value: new THREE.Vector2(1, 1) },
        uNoiseOffset: { value: new THREE.Vector2() },
    });
    if (opts.grain) {
        new THREE.TextureLoader().load('/corn/tex/post-noise.png', (t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            noise = t;
            pass.uniforms.tNoise.value = t;
            pass.uniforms.uGrain.value = opts.grain;
        });
    }
    const cam = new THREE.Camera();
    return {
        target,
        uniforms: pass.uniforms,
        setSize(w: number, h: number, dpr: number) {
            const W = Math.max(1, Math.round(w * dpr));
            const H = Math.max(1, Math.round(h * dpr));
            target.setSize(W, H);
            pass.uniforms.uNoiseScale.value.set(W / 512, H / 512);
        },
        /** Bind the linear target (and clear it). Layers then stack: auto-clear is off, as in the engine. */
        begin(renderer: THREE.WebGLRenderer, clear: THREE.ColorRepresentation = 0x000000) {
            renderer.autoClear = false;
            renderer.setRenderTarget(target);
            renderer.setClearColor(clear, 1);
            renderer.clear();
        },
        present(renderer: THREE.WebGLRenderer) {
            pass.uniforms.uNoiseOffset.value.set(Math.random(), Math.random());
            renderer.setRenderTarget(null);
            renderer.render(pass.scene, cam);
        },
        dispose() {
            target.dispose();
            pass.dispose();
            noise?.dispose();
        },
    };
}

/** The engine's screen-px overlay camera: x right, y down, origin top-left (for TitleText). */
export function overlayCamera(w: number, h: number, cam = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10)) {
    cam.left = 0;
    cam.right = w;
    cam.top = 0;
    cam.bottom = h;
    cam.updateProjectionMatrix();
    return cam;
}

/** Engine.ts `gentle`: sine in-out over [a, b]. */
export const gentle = (a: number, b: number, v: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, (v - a) / (b - a))));

/** Dispose every geometry/material under an object (not textures: demos own and free those). */
export function disposeObject(root: THREE.Object3D) {
    const seen = new Set<unknown>();
    root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry && !seen.has(m.geometry)) {
            seen.add(m.geometry);
            m.geometry.dispose();
        }
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => {
            if (seen.has(mat)) return;
            seen.add(mat);
            mat.dispose();
        });
    });
}
