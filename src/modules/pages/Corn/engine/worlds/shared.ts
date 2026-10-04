import * as THREE from 'three';

/** A full-screen background drawn behind everything (clip-space quad, no depth). */
export function backdrop(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
            vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
            fragmentShader,
            uniforms,
            depthTest: false,
            depthWrite: false,
        }),
    );
    mesh.frustumCulled = false;
    mesh.renderOrder = -100;
    return mesh;
}

/**
 * Pre-lit atlas material: the reference bakes each painted model lit from four directions
 * (top-left, top-right, bottom-left, bottom-right) and blends them by the pointer, so the light
 * seems to follow the mouse. Leaves sway from the vertex shader (bend grows with height).
 */
export function relitMaterial(maps: [THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture], alpha: THREE.Texture, opts: { sway: number; baseY: number; height: number }) {
    return new THREE.ShaderMaterial({
        uniforms: {
            tTL: { value: maps[0] },
            tTR: { value: maps[1] },
            tBL: { value: maps[2] },
            tBR: { value: maps[3] },
            tAlpha: { value: alpha },
            uLight: { value: new THREE.Vector2(0.5, 0.5) },
            uTime: { value: 0 },
            uSway: { value: opts.sway },
            uBase: { value: new THREE.Vector2(opts.baseY, opts.height) },
            uExposure: { value: 1 },
        },
        vertexShader: /* glsl */ `
            uniform float uTime;
            uniform float uSway;
            uniform vec2 uBase;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec4 wp = modelMatrix * vec4(position, 1.0);
                float h = clamp((wp.y - uBase.x) / uBase.y, 0.0, 1.0);
                float ph = wp.x * 0.9 + wp.z * 0.7;
                wp.x += sin(uTime * 0.55 + ph) * uSway * h * h;
                wp.z += cos(uTime * 0.43 + ph * 1.3) * uSway * 0.6 * h * h;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }`,
        fragmentShader: /* glsl */ `
            uniform sampler2D tTL, tTR, tBL, tBR, tAlpha;
            uniform vec2 uLight;
            uniform float uExposure;
            varying vec2 vUv;
            void main() {
                float a = texture2D(tAlpha, vUv).r;
                if (a < 0.004) discard;
                vec3 top = mix(texture2D(tTL, vUv).rgb, texture2D(tTR, vUv).rgb, uLight.x);
                vec3 bot = mix(texture2D(tBL, vUv).rgb, texture2D(tBR, vUv).rgb, uLight.x);
                // the atlases are premultiplied on black (reference: rgb / alpha, then normal blending)
                gl_FragColor = vec4(mix(top, bot, uLight.y) * uExposure / a, a);
            }`,
        side: THREE.DoubleSide,
        // reference: no depth at all, cards drawn in the artist's order (glTF extras "RENDER ORDER")
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });
}

/** Soft round sprites (bokeh, dust, glowing nodes): one draw call, additive. */
export function softPoints(count: number, init: (i: number, pos: THREE.Vector3, col: THREE.Color) => number) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    const v = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
        size[i] = init(i, v, c);
        pos.set([v.x, v.y, v.z], i * 3);
        col.set([c.r, c.g, c.b], i * 3);
        seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uAlpha: { value: 1 }, uDrift: { value: new THREE.Vector3(0, 0.04, 0) }, uSoft: { value: 0.5 } },
        vertexShader: /* glsl */ `
            attribute float aSize;
            attribute float aSeed;
            attribute vec3 color;
            uniform float uTime, uScale;
            uniform vec3 uDrift;
            varying vec3 vCol;
            varying float vTw;
            void main() {
                vec3 p = position + uDrift * uTime * (0.5 + aSeed);
                p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.05;
                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_PointSize = aSize * uScale / -mv.z;
                gl_Position = projectionMatrix * mv;
                vCol = color;
                vTw = 0.65 + 0.35 * sin(uTime * (0.8 + aSeed) + aSeed * 30.0);
            }`,
        fragmentShader: /* glsl */ `
            uniform float uAlpha, uSoft;
            varying vec3 vCol;
            varying float vTw;
            void main() {
                float d = length(gl_PointCoord - 0.5) * 2.0;
                float a = 1.0 - smoothstep(1.0 - uSoft, 1.0, d);
                gl_FragColor = vec4(vCol * a * vTw * uAlpha, 0.0);
            }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
    });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    return pts;
}

/** Replace every mesh material in a glTF scene. */
export function remat(root: THREE.Object3D, make: (m: THREE.Mesh) => THREE.Material) {
    root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const old = m.material as THREE.Material;
        m.material = make(m);
        old.dispose();
        m.frustumCulled = false;
    });
}

/** First mesh of a glTF with its node transform baked in (several files are Z-up with a root rotation). */
export function bakedGeometry(root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    const mesh = root.getObjectByProperty('isMesh', true) as THREE.Mesh;
    return mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
}

/**
 * Out-of-focus motes floating between the camera and the subject: big, faint, slow. They move most
 * with the orbit, which sells the depth of each scene.
 */
export function motes(count: number, box: THREE.Box3, color: THREE.Color, size: [number, number]) {
    const pts = softPoints(count, (i, p, c) => {
        p.set(THREE.MathUtils.lerp(box.min.x, box.max.x, Math.random()), THREE.MathUtils.lerp(box.min.y, box.max.y, Math.random()), THREE.MathUtils.lerp(box.min.z, box.max.z, Math.random()));
        c.copy(color).multiplyScalar(0.4 + Math.random() * 0.6);
        return size[0] + Math.random() * (size[1] - size[0]);
    });
    (pts.material as THREE.ShaderMaterial).uniforms.uSoft.value = 0.8;
    return pts;
}
