'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { motion, worlds } from '../store';
import { HASH, SNOISE } from '../utils/glsl';
import { damp } from '../utils/math';

const vertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uT;
uniform float uTime;
uniform float uVel;
uniform float uDetail;
uniform float uIntro;
uniform vec2 uMouse;
uniform vec2 uRes;
uniform vec3 uFog;
varying vec2 vUv;

${HASH}
${SNOISE}

vec3 sampleCA(sampler2D t, vec2 uv, vec2 dir, float amt) {
    return vec3(
        texture2D(t, uv + dir * amt).r,
        texture2D(t, uv).g,
        texture2D(t, uv - dir * amt).b
    );
}

// Cheap bloom: the render targets are mip-mapped, so high LODs are free blurs.
vec3 bloom(sampler2D t, vec2 uv) {
    vec3 b = vec3(0.0);
    b += max(textureLod(t, uv, 2.0).rgb - 1.05, 0.0) * 0.5;
    b += max(textureLod(t, uv, 3.5).rgb - 1.0, 0.0) * 0.8;
    b += max(textureLod(t, uv, 5.0).rgb - 0.95, 0.0) * 1.1;
    return b;
}

vec3 rainbow(float x) { return 0.5 + 0.5 * cos(6.28318 * (x + vec3(0.0, 0.33, 0.67))); }

void main() {
    vec2 uv = vUv;
    vec2 c = uv - 0.5;
    float aspect = uRes.x / uRes.y;
    float t = uT;
    float mid = sin(t * 3.14159);
    float vel = clamp(abs(uVel), 0.0, 1.0);

    // horizontal glitch bands — strongest mid-transition and on fast scroll
    float row = floor(uv.y * 34.0) + floor(uTime * 14.0) * 7.0;
    float band = step(0.72, hash11(row)) * (hash11(row + 11.0) - 0.5);
    uv.x += band * (0.16 * mid + 0.03 * vel);

    // lens: barrel warp during transition + subtle mouse parallax
    uv += c * dot(c, c) * (mid * 0.55);
    uv += uMouse * 0.004;

    vec2 dir = normalize(c + 1e-4) * (0.35 + length(c));
    float ca = 0.0005 + mid * 0.018 + vel * 0.004 + uDetail * 0.004;

    vec3 A = sampleCA(tA, uv, dir, ca) + bloom(tA, uv);
    vec3 col = A;

    if (t > 0.0005) {
        vec3 B = sampleCA(tB, uv, dir, ca) + bloom(tB, uv);
        // fog-front dissolve: B rolls in through drifting noise
        float n = fbm3(vec3(uv * vec2(aspect, 1.0) * 2.2, uTime * 0.12)) * 0.5 + 0.5;
        float m = smoothstep(n - 0.28, n + 0.28, t * 1.56 - 0.28);
        col = mix(A, B, m);

        // whiteout fog + iridescent streaks
        float streak = smoothstep(0.55, 0.9, snoise(vec3(uv.x * 1.2, uv.y * 14.0, uTime * 0.4))) * mid;
        col += rainbow(uv.x * 1.8 + uv.y * 0.6 + uTime * 0.25) * streak * 0.35;
        col = mix(col, uFog, mid * (0.55 + 0.35 * n));
    }

    // detail overlay: deep slate, blurred through the mip chain
    if (uDetail > 0.001) {
        vec3 blurred = textureLod(tA, uv, 4.0).rgb;
        vec3 slate = vec3(0.006, 0.009, 0.015) + blurred * 0.035;
        col = mix(col, slate, uDetail * 0.96);
    }

    // intro: grey loader wash
    col = mix(uFog, col, uIntro);

    // vignette + grain
    float vig = smoothstep(1.1, 0.25, length(c * vec2(aspect * 0.8, 1.0)));
    col *= mix(0.78, 1.0, vig);
    col += (hash21(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.035;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

const makeTarget = () => {
    const rt = new THREE.WebGLRenderTarget(4, 4, {
        type: THREE.HalfFloatType,
        samples: 4,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        colorSpace: THREE.LinearSRGBColorSpace,
    });
    return rt;
};

/** Takes over R3F's render loop: renders the (up to two) visible worlds into
 *  targets and blends them in a single full-screen pass. */
export default function Compositor() {
    const { gl, size, viewport } = useThree();

    const bundle = useMemo(() => {
        const mat = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            uniforms: {
                tA: { value: null },
                tB: { value: null },
                uT: { value: 0 },
                uTime: { value: 0 },
                uVel: { value: 0 },
                uDetail: { value: 0 },
                uIntro: { value: 0 },
                uMouse: { value: new THREE.Vector2() },
                uRes: { value: new THREE.Vector2(1, 1) },
                uFog: { value: new THREE.Color('#c3cad4').convertSRGBToLinear() },
            },
            depthTest: false,
            depthWrite: false,
            toneMapped: true,
        });
        const scene = new THREE.Scene();
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
        return { rtA: makeTarget(), rtB: makeTarget(), quad: scene, quadCam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), material: mat };
    }, []);
    // three.js objects are mutated every frame — keep them behind a ref
    const pipe = useRef(bundle);

    useEffect(() => {
        const { rtA, rtB, material } = pipe.current;
        const w = Math.floor(size.width * viewport.dpr);
        const h = Math.floor(size.height * viewport.dpr);
        rtA.setSize(w, h);
        rtB.setSize(w, h);
        material.uniforms.uRes.value.set(w, h);
        worlds.forEach((world) => {
            const cam = world?.camera as THREE.PerspectiveCamera | undefined;
            if (cam?.isPerspectiveCamera) {
                cam.aspect = size.width / size.height;
                cam.updateProjectionMatrix();
            }
        });
    }, [size, viewport.dpr]);

    useEffect(() => {
        const { rtA, rtB, material } = pipe.current;
        return () => {
            rtA.dispose();
            rtB.dispose();
            material.dispose();
        };
    }, []);

    useFrame((state, delta) => {
        const s = ((motion.scene % 4) + 4) % 4;
        const ia = Math.floor(s);
        const t = s - ia;
        const a = worlds[ia];
        const b = worlds[(ia + 1) % 4];
        const { rtA, rtB, material, quad, quadCam } = pipe.current;
        const u = material.uniforms;

        // keep late-registered cameras in sync with the viewport
        const aspect = size.width / size.height;
        for (const world of [a, b]) {
            const cam = world?.camera as THREE.PerspectiveCamera | undefined;
            if (cam?.isPerspectiveCamera && Math.abs(cam.aspect - aspect) > 1e-3) {
                cam.aspect = aspect;
                cam.updateProjectionMatrix();
            }
        }

        if (a) {
            gl.setRenderTarget(rtA);
            gl.render(a.scene, a.camera);
        }
        if (b && t > 0.0005) {
            gl.setRenderTarget(rtB);
            gl.render(b.scene, b.camera);
        }
        gl.setRenderTarget(null);

        u.tA.value = rtA.texture;
        u.tB.value = rtB.texture;
        u.uT.value = t;
        u.uTime.value = state.clock.elapsedTime;
        u.uVel.value = damp(u.uVel.value, motion.velocity / 40, 6, delta);
        u.uDetail.value = motion.detail;
        u.uIntro.value = Math.min(1, motion.intro * 3);
        u.uMouse.value.set(motion.pointerSmooth.x, motion.pointerSmooth.y);
        gl.render(quad, quadCam);
    }, 1);

    return null;
}
