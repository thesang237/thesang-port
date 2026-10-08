import { useRef } from 'react';
import { CanvasTexture, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace } from 'three';

import { Demo, Slider, Toggle } from '../kit/controls';
import { useParams } from '../kit/loop';
import { gsap } from '../kit/motion';
import { useThreeStudy } from '../kit/three';

const DEFAULTS = { bend: 0, segments: 20, entrance: 1, wireframe: false };
const VERTEX = `uniform float uSpeed; uniform float uHeight; varying vec2 vUv;
void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);
p.z+=sin(p.y/uHeight*3.14159265+1.57079633)*uSpeed;
gl_Position=projectionMatrix*p;}`;
const FRAGMENT = `uniform sampler2D uImage; uniform float uOpacity; varying vec2 vUv;
void main(){gl_FragColor=texture2D(uImage,vUv);gl_FragColor.a*=uOpacity;
#include <colorspace_fragment>
}`;
export default function Webgl() {
    const host = useRef<HTMLDivElement>(null),
        gpu = useRef<HTMLDivElement>(null);
    const { values, live, set, reset } = useParams(DEFAULTS);
    useThreeStudy(gpu, (renderer, element) => {
        const scene = new Scene(),
            camera = new PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 5;
        const art = document.createElement('canvas');
        art.width = 256;
        art.height = 384;
        const ctx = art.getContext('2d')!;
        ctx.fillStyle = '#a1bcc5';
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = '#f3f0e9';
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.arc(128, 160, 62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 260 + i * 10);
            ctx.lineTo(256, 160 + i * 10);
            ctx.stroke();
        }
        ctx.font = '14px monospace';
        ctx.fillStyle = '#26333d';
        ctx.fillText('FORM / 01', 20, 356);
        const texture = new CanvasTexture(art);
        texture.colorSpace = SRGBColorSpace;
        let segments = 20,
            geometry = new PlaneGeometry(1.6, 2.4, segments, segments);
        const worldHeight = 2 * Math.tan(Math.PI / 8) * 5;
        const material = new ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            uniforms: { uImage: { value: texture }, uSpeed: { value: 0 }, uHeight: { value: worldHeight }, uOpacity: { value: 0.4 } },
            transparent: true,
            depthWrite: false,
        });
        const mesh = new Mesh(geometry, material);
        scene.add(mesh);
        const ease = gsap.parseEase('expo.inOut');
        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            frame: () => {
                const p = live.current;
                if (p.segments !== segments) {
                    segments = p.segments;
                    geometry.dispose();
                    geometry = new PlaneGeometry(1.6, 2.4, segments, segments);
                    mesh.geometry = geometry;
                }
                material.wireframe = p.wireframe;
                material.uniforms.uSpeed.value = p.bend;
                const progress = ease(p.entrance);
                mesh.position.z = 2 * (1 - progress);
                material.uniforms.uOpacity.value = 0.4 * progress;
                renderer.render(scene, camera);
                element.dataset.studyMetrics = JSON.stringify({
                    calls: renderer.info.render.calls,
                    triangles: renderer.info.render.triangles,
                    geometries: renderer.info.memory.geometries,
                    textures: renderer.info.memory.textures,
                });
            },
            dispose: () => {
                geometry.dispose();
                material.dispose();
                texture.dispose();
            },
        };
    });
    return (
        <Demo
            stageRef={host}
            title="The portrait is a subdivided plane"
            hint="Add bend, inspect the mesh, then scrub its depth entrance."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="Bend / speed signal"
                        value={values.bend}
                        min={-1.5}
                        max={1.5}
                        step={0.05}
                        help="Source starts at 0; scroll lag changes this shader input."
                        onChange={(v) => set('bend', v)}
                    />
                    <Slider label="Mesh segments" value={values.segments} min={1} max={40} help="Source uses 20×20; 1 leaves only the corner points." onChange={(v) => set('segments', v)} />
                    <Slider
                        label="Entrance progress"
                        value={values.entrance}
                        min={0}
                        max={1}
                        step={0.01}
                        help="The source’s 2-second depth and opacity entrance, manually scrubbed."
                        onChange={(v) => set('entrance', v)}
                    />
                    <Toggle label="Show wireframe" checked={values.wireframe} help="See the vertices that the shader can bend." onChange={(v) => set('wireframe', v)} />
                </>
            }
        >
            <div ref={gpu} className="fl-gpu-stage" />
            <p className="fl-stage-caption">
                45° camera · z = 5 · photo opacity = 0.4
                <br />
                Same shader rule; neutral generated artwork.
            </p>
        </Demo>
    );
}
