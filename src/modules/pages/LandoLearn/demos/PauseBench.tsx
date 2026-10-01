'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { Demo, Readout, Toggle } from '../kit/controls';
import { gsap } from '../kit/gsap';
import { useParams } from '../kit/loop';

const DEFAULTS = { pause: true };

const FRAG = /* glsl */ `
uniform float time;
varying vec2 vUv;
void main() {
    float r = length(vUv - 0.5);
    float rings = 0.5 + 0.5 * sin(r * 40.0 - time * 4.0);
    vec3 c = mix(vec3(0.133, 0.157, 0.110), vec3(0.804, 1.0, 0.043), rings * smoothstep(0.5, 0.1, r));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
}`;

/**
 * A WebGL canvas in a scroll box. With “pause off screen” on, an IntersectionObserver stops the render loop
 * as soon as the canvas leaves the box — exactly what HeroGL does with `frameloop="never"`.
 */
export default function PauseBench() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const box = useRef<HTMLDivElement>(null);
    const host = useRef<HTMLDivElement>(null);
    const out = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        const el = host.current!;
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'display:block;width:100%;height:100%';
        el.appendChild(canvas);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const scene = new THREE.Scene();
        const cam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
        const uniforms = { time: { value: 0 } };
        const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }', fragmentShader: FRAG });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        scene.add(mesh);
        const resize = () => renderer.setSize(el.clientWidth, el.clientHeight, false);
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        let visible = true;
        const io = new IntersectionObserver(
            ([e]) => {
                visible = e.isIntersecting;
            },
            { root: box.current },
        );
        io.observe(el);

        const count = { drawn: 0, skipped: 0 };
        const tick = (time: number) => {
            const onScreen = visible;
            if (ref.current.pause && !onScreen) count.skipped++;
            else {
                uniforms.time.value = time;
                renderer.render(scene, cam);
                count.drawn++;
            }
            const o = out.current;
            if (o.drawn) o.drawn.textContent = String(count.drawn);
            if (o.skipped) o.skipped.textContent = String(count.skipped);
            if (o.state) o.state.textContent = onScreen ? 'on screen' : 'off screen';
            if (o.gpu) o.gpu.textContent = ref.current.pause && !onScreen ? 'idle' : 'drawing';
        };
        gsap.ticker.add(tick);
        return () => {
            gsap.ticker.remove(tick);
            io.disconnect();
            ro.disconnect();
            mesh.geometry.dispose();
            mat.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        };
    }, [ref]);

    const rd = (k: string) => (
        <span
            ref={(el) => {
                out.current[k] = el;
            }}
        />
    );

    return (
        <Demo
            title="Pause when off screen"
            hint="Scroll the box until the lime canvas is gone. Watch “frames drawn” stop climbing — then turn the pause off and do it again."
            onReset={reset}
            controls={
                <>
                    <Toggle label="pause off screen" checked={p.pause} onChange={(v) => set('pause', v)} help="Off: the GPU keeps drawing a canvas nobody can see, 60 times a second." />
                    <Readout
                        items={[
                            { label: 'canvas', value: rd('state') },
                            { label: 'GPU', value: rd('gpu'), color: 'var(--ll-lime)' },
                            { label: 'frames drawn', value: rd('drawn') },
                            { label: 'frames skipped', value: rd('skipped') },
                        ]}
                    />
                </>
            }
        >
            <div ref={box} data-lenis-prevent className="ll-scrollbox h-[360px] overflow-y-auto bg-[var(--ll-bg-2)]">
                <div className="flex h-[1200px] flex-col items-center pt-[70px]">
                    <div ref={host} className="size-[220px] overflow-hidden rounded-xl" />
                    <p className="ll-mono mt-6 text-[10px] uppercase tracking-[0.16em] text-[var(--ll-faint)]">↓ scroll it away</p>
                </div>
            </div>
        </Demo>
    );
}
