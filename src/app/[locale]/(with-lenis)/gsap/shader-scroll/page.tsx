'use client';

import styles from './shader-scroll.module.css';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';
import * as THREE from 'three';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// ─── Shared velocity state ─────────────────────────────────────────────────────
// Plain mutable object read each frame by every FrameCanvas ticker
const velocityProxy = { v: 0, s: 0 };

// ─── Images ───────────────────────────────────────────────────────────────────
const IMAGES = [
    'https://assets.codepen.io/16327/site-landscape-13.jpg',
    'https://assets.codepen.io/16327/site-landscape-12.jpg',
    'https://assets.codepen.io/16327/site-landscape-11.jpg',
    'https://assets.codepen.io/16327/site-landscape-10.jpg',
    'https://assets.codepen.io/16327/site-landscape-9.jpg',
    'https://assets.codepen.io/16327/site-landscape-8.jpg',
    'https://assets.codepen.io/16327/site-landscape-7.jpg',
    'https://assets.codepen.io/16327/site-landscape-6.jpg',
    'https://assets.codepen.io/16327/site-landscape-5.jpeg',
    'https://assets.codepen.io/16327/site-landscape-4.jpg',
    'https://assets.codepen.io/16327/site-landscape-3.jpg',
    'https://assets.codepen.io/16327/site-landscape-2.jpg',
    'https://assets.codepen.io/16327/site-landscape-1.jpg',
];

// ─── Shaders ──────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vUvCover;
  uniform vec2 uTextureSize;
  uniform vec2 uQuadSize;

  void main() {
    vUv = uv;
    float texR  = uTextureSize.x / uTextureSize.y;
    float quadR = uQuadSize.x    / uQuadSize.y;
    vec2 s = vec2(1.0);
    if (quadR > texR) { s.y = texR / quadR; } else { s.x = quadR / texR; }
    vUvCover = vUv * s + (1.0 - s) * 0.5;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2      uTextureSize;
  uniform vec2      uQuadSize;
  uniform float     uTime;
  uniform float     uScrollVelocity;
  uniform float     uVelocityStrength;

  varying vec2 vUv;
  varying vec2 vUvCover;

  void main() {
    vec2  texCoords = vUvCover;
    float amt = 0.03 * uVelocityStrength;
    float t   = uTime * 0.8;

    texCoords.y += sin((texCoords.x * 8.0) + t)         * amt;
    texCoords.x += cos((texCoords.y * 6.0) - t * 0.8)   * amt * 0.6;

    float dir = sign(uScrollVelocity);
    float r = texture2D(uTexture, texCoords + vec2( amt * 0.50 * dir, 0.0)).r;
    float g = texture2D(uTexture, texCoords + vec2( amt * 0.25 * dir, 0.0)).g;
    float b = texture2D(uTexture, texCoords + vec2(-amt * 0.35 * dir, 0.0)).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

// ─── FrameCanvas ──────────────────────────────────────────────────────────────
function FrameCanvas({ src }: { src: string }) {
    const frameRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const frame = frameRef.current!;
        const canvas = canvasRef.current!;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const geom = new THREE.PlaneGeometry(2, 2);

        const uniforms = {
            uTexture: { value: null as THREE.Texture | null },
            uTextureSize: { value: new THREE.Vector2(1, 1) },
            uQuadSize: { value: new THREE.Vector2(1, 1) },
            uTime: { value: 0 },
            uScrollVelocity: { value: 0 },
            uVelocityStrength: { value: 0 },
        };

        const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true });
        scene.add(new THREE.Mesh(geom, mat));

        const layout = () => {
            const { width, height } = frame.getBoundingClientRect();
            renderer.setSize(width, height, false);
            uniforms.uQuadSize.value.set(width, height);
        };

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(src, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            uniforms.uTexture.value = tex;
            uniforms.uTextureSize.value.set(tex.image.width, tex.image.height);
            layout();
        });

        layout();

        // gsap.ticker passes (time, deltaTime, frame) — deltaTime is ms since last tick
        const tick = (_time: number, deltaTime: number) => {
            uniforms.uTime.value += deltaTime * 0.001;
            uniforms.uScrollVelocity.value = velocityProxy.v;
            uniforms.uVelocityStrength.value = velocityProxy.s;
            renderer.render(scene, camera);
        };
        gsap.ticker.add(tick);

        const ro = new ResizeObserver(layout);
        ro.observe(frame);

        return () => {
            gsap.ticker.remove(tick);
            ro.disconnect();
            uniforms.uTexture.value?.dispose();
            mat.dispose();
            geom.dispose();
            renderer.dispose();
        };
    }, [src]);

    return (
        <div ref={frameRef} className={styles.frame}>
            <canvas ref={canvasRef} />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ShaderScrollPage() {
    // Sync ScrollTrigger to Lenis ticks
    useLenis(() => {
        ScrollTrigger.update();
    });

    useGSAP(() => {
        const clamp = gsap.utils.clamp(-2000, 2000);

        ScrollTrigger.create({
            start: 0,
            end: () => document.documentElement.scrollHeight - window.innerHeight,
            onUpdate(self) {
                const raw = clamp(self.getVelocity());
                const norm = raw / 1000;
                const strength = Math.min(1, Math.abs(norm));

                if (Math.abs(strength) > Math.abs(velocityProxy.s)) {
                    velocityProxy.v = norm;
                    velocityProxy.s = strength;
                    gsap.to(velocityProxy, { v: 0, s: 0, duration: 0.8, ease: 'sine.inOut', overwrite: true });
                }
            },
        });

        ScrollTrigger.refresh();
    });

    return (
        <div className={styles.wrapper}>
            <header className={styles.panel}>
                <h1>{'Adjust a shader on Scroll'}</h1>
                <p>{'Each image is its own WebGL canvas. GSAP feeds scroll velocity to the shader.'}</p>
            </header>

            {IMAGES.map((src, i) => (
                <FrameCanvas key={i} src={src} />
            ))}

            <div className={styles.spacer} />
        </div>
    );
}
