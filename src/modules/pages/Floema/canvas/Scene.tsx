/* eslint-disable react-hooks/immutability -- SceneState is an imperative GSAP/Three runtime, mutated only outside React rendering. */
'use client';
import { Component, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { FrontSide, Group, Mesh, MeshBasicMaterial, NoToneMapping, PlaneGeometry, ShaderMaterial, SRGBColorSpace, type Texture, TextureLoader } from 'three';

import { content } from '../data';
import { damp, wrap } from '../motion';
import { cardPose, homeLayout, homeY, type SceneState } from '../scene';

const homePhotos = [...content.home, ...content.home];
const aboutGalleries = content.about.filter((section) => section.type === 'gallery');
const sources = [...new Set([...homePhotos.map((p) => p.src), ...content.products.flatMap((p) => [p.image.src, p.model.src]), ...aboutGalleries.flatMap((g) => g.images.map((p) => p.src))])];
const vertex = `
    uniform float uSpeed;
    uniform float uHeight;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        p.z += sin(p.y / uHeight * 3.14159265 + 1.57079633) * uSpeed;
        gl_Position = projectionMatrix * p;
    }
`;
const fragment = `
    uniform sampler2D uImage;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
        gl_FragColor = texture2D(uImage, vUv);
        gl_FragColor.a *= uOpacity;
        #include <colorspace_fragment>
    }
`;
class CanvasBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch() {
        this.props.onFailure();
    }
    render() {
        return this.state.failed ? null : this.props.children;
    }
}
function World({ scene, textures }: { scene: SceneState; textures: Map<string, Texture> }) {
    const objects = useMemo(() => {
        const flat = new PlaneGeometry(1, 1);
        const subdivided = new PlaneGeometry(1, 1, 20, 20);
        const home = new Group();
        const collections = new Group();
        const about = new Group();
        const homeMeshes = homePhotos.map((photo, index) => {
            const material = new ShaderMaterial({
                vertexShader: vertex,
                fragmentShader: fragment,
                uniforms: { uImage: { value: textures.get(photo.src) }, uOpacity: { value: 0 }, uSpeed: { value: 0 }, uHeight: { value: scene.worldHeight } },
                transparent: true,
                depthWrite: false,
                depthTest: false,
            });
            const mesh = new Mesh(subdivided, material);
            mesh.rotation.z = Math.sin(index * 12.9898) * Math.PI * 0.03;
            home.add(mesh);
            return mesh;
        });
        const cards = content.products.map((product) => {
            const group = new Group();
            const front = new Mesh(flat, new MeshBasicMaterial({ map: textures.get(product.image.src), transparent: true, opacity: 0, side: FrontSide, toneMapped: false }));
            const back = new Mesh(flat, new MeshBasicMaterial({ map: textures.get(product.model.src), transparent: true, opacity: 0, side: FrontSide, toneMapped: false }));
            back.rotation.y = Math.PI;
            back.position.z = -0.0001;
            group.add(front, back);
            collections.add(group);
            return { group, front, back };
        });
        const galleries = aboutGalleries.map((gallery) =>
            gallery.images.map((photo) => {
                const mesh = new Mesh(flat, new MeshBasicMaterial({ map: textures.get(photo.src), transparent: true, side: FrontSide, toneMapped: false }));
                about.add(mesh);
                return mesh;
            }),
        );
        return { home, collections, about, homeMeshes, cards, galleries, flat, subdivided, layout: homeLayout(scene), layoutWidth: scene.width, entered: -1, previousView: '' };
    }, [scene, textures]);
    useEffect(
        () => () => {
            for (const group of [objects.home, objects.collections, objects.about])
                group.traverse((child) => {
                    if (child instanceof Mesh) child.material.dispose();
                });
            objects.flat.dispose();
            objects.subdivided.dispose();
        },
        [objects],
    );
    useFrame((_state, delta) => {
        const { width, height, worldHeight, view, ready, reduced } = scene;
        objects.home.visible = ready && !reduced && view === 'home';
        objects.collections.visible = ready && !reduced && view === 'collections';
        objects.about.visible = ready && !reduced && view === 'about';
        if (!ready || reduced || document.hidden) return;
        if (objects.previousView !== view) {
            objects.entered = scene.time;
            objects.previousView = view;
        }
        const ratio = worldHeight / height;
        if (objects.layoutWidth !== width) {
            objects.layout = homeLayout(scene);
            objects.layoutWidth = width;
        }
        if (view === 'home') {
            objects.homeMeshes.forEach((mesh, index) => {
                const rect = objects.layout.rects[index];
                mesh.scale.set(rect.width * ratio, rect.height * ratio, 1);
                mesh.position.set((rect.x + rect.width / 2 - width / 2) * ratio, (height / 2 - homeY(scene, rect, objects.layout.total) - rect.height / 2) * ratio, 0);
                mesh.material.uniforms.uSpeed.value = scene.home.speed;
                const elapsed = scene.time - objects.entered - (index % 7) * 0.16;
                const progress = Math.max(0, Math.min(1, elapsed / 2));
                const eased = progress === 0 || progress === 1 ? progress : progress < 0.5 ? Math.pow(2, 20 * progress - 10) / 2 : (2 - Math.pow(2, -20 * progress + 10)) / 2;
                mesh.material.uniforms.uOpacity.value = 0.4 * eased;
                mesh.position.z = (2 + Math.abs(Math.sin(index * 8.7)) * 4) * (1 - eased);
                mesh.visible = Math.abs(mesh.position.y) < worldHeight / 2 + mesh.scale.y;
            });
        } else if (view === 'collections') {
            objects.cards.forEach(({ group, front, back }, index) => {
                const pose = cardPose(scene, index);
                group.position.set(
                    (pose.x + pose.width / 2 - width / 2) * ratio,
                    (height / 2 - pose.y - pose.height / 2) * ratio,
                    scene.collection.selected === index ? scene.collection.expansion * 0.1 : 0,
                );
                group.rotation.set(0, pose.flip, pose.rotation);
                group.scale.set(pose.width * ratio, pose.height * ratio, 1);
                const opacity = damp(front.material.opacity, pose.opacity, 0.1, Math.min(delta, 0.05));
                for (const mesh of [front, back]) {
                    mesh.material.opacity = opacity;
                    mesh.material.depthTest = scene.collection.expansion < 0.01;
                    mesh.material.depthWrite = scene.collection.expansion < 0.01;
                }
                group.visible = pose.x + pose.width > -pose.width && pose.x < width + pose.width;
            });
        } else {
            objects.galleries.forEach((meshes, index) => {
                const gallery = scene.about.galleries[index];
                if (!gallery) return;
                meshes.forEach((mesh, i) => {
                    const unit = scene.unit;
                    const step = 38.9 * unit;
                    const x = wrap(i * step + 4 * unit + gallery.offset, -34.9 * unit, step * meshes.length - 34.9 * unit);
                    const centerX = (x + 15.45 * unit - width / 2) * ratio;
                    const worldWidth = width * ratio;
                    const curve = (Math.cos((centerX / worldWidth) * Math.PI * 0.1) - 1) * (width < 768 ? 15 : 60);
                    const y = gallery.top + 29.3 * unit - scene.about.current;
                    mesh.position.set(centerX, (height / 2 - y) * ratio + curve, 0);
                    mesh.scale.set(30.9 * unit * ratio, 43.7 * unit * ratio, 1);
                    mesh.rotation.z = (-centerX / worldWidth) * Math.PI * 0.2;
                    mesh.visible = y > -400 && y < height + 400 && x > -40 * unit && x < width + 40 * unit;
                });
            });
        }
    });
    return (
        <>
            <primitive object={objects.home} />
            <primitive object={objects.collections} />
            <primitive object={objects.about} />
        </>
    );
}
function RendererLifecycle({ ready, onReady, onFailure }: { ready: boolean; onReady: () => void; onFailure: () => void }) {
    const gl = useThree((state) => state.gl);
    useEffect(() => {
        if (!ready) return;
        onReady();
        const canvas = gl.domElement;
        canvas.addEventListener('webglcontextlost', onFailure);
        canvas.addEventListener('webglcontextrestored', onReady);
        return () => {
            canvas.removeEventListener('webglcontextlost', onFailure);
            canvas.removeEventListener('webglcontextrestored', onReady);
        };
    }, [gl, ready, onReady, onFailure]);
    return null;
}

/** Development-only telemetry for comparing long-running routes without a visible HUD. */
function FrameProbe() {
    const sample = useMemo(() => ({ frames: new Float32Array(120), count: 0 }), []);
    useFrame(({ gl }, delta) => {
        if (document.hidden || delta > 0.1) return;
        sample.frames[sample.count++] = delta * 1000;
        if (sample.count < sample.frames.length) return;
        const sorted = sample.frames.slice().sort();
        gl.domElement.dataset.floemaMetrics = JSON.stringify({
            medianMs: Number(sorted[60].toFixed(2)),
            p95Ms: Number(sorted[114].toFixed(2)),
            calls: gl.info.render.calls,
            triangles: gl.info.render.triangles,
            textures: gl.info.memory.textures,
            geometries: gl.info.memory.geometries,
        });
        sample.count = 0;
    });
    return null;
}

export default function Scene({ scene, reduced, onReady, onFailure }: { scene: SceneState; reduced: boolean; onReady: () => void; onFailure: () => void }) {
    const [textures, setTextures] = useState<Map<string, Texture> | null>(null);
    const [hidden, setHidden] = useState(false);
    useEffect(() => {
        let cancelled = false;
        const loader = new TextureLoader();
        const loaded: Texture[] = [];
        Promise.all(
            sources.map(async (src) => {
                const texture = await loader.loadAsync(src);
                texture.colorSpace = SRGBColorSpace;
                loaded.push(texture);
                if (cancelled) texture.dispose();
                return [src, texture] as const;
            }),
        )
            .then((entries) => {
                if (!cancelled) {
                    setTextures(new Map(entries));
                }
            })
            .catch(() => {
                if (!cancelled) onFailure();
            });
        return () => {
            cancelled = true;
            loaded.forEach((texture) => texture.dispose());
        };
        // Callbacks report lifecycle state; they must not restart texture loading on parent renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);
    useEffect(() => {
        const visibility = () => setHidden(document.hidden);
        document.addEventListener('visibilitychange', visibility);
        return () => document.removeEventListener('visibilitychange', visibility);
    }, []);
    return (
        <CanvasBoundary onFailure={onFailure}>
            <Canvas
                camera={{ fov: 45, position: [0, 0, 5], near: 0.1, far: 100 }}
                dpr={[1, 1.5]}
                gl={{ alpha: true, antialias: true, toneMapping: NoToneMapping }}
                frameloop={hidden || reduced ? 'never' : 'always'}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0);
                }}
            >
                <RendererLifecycle ready={Boolean(textures)} onReady={onReady} onFailure={onFailure} />
                {textures && <World scene={scene} textures={textures} />}
                {process.env.NODE_ENV === 'development' && <FrameProbe />}
            </Canvas>
        </CanvasBoundary>
    );
}
