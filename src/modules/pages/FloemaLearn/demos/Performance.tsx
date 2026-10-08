import { useRef } from 'react';
import { InstancedMesh, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Scene } from 'three';

import { Demo, Slider, Toggle } from '../kit/controls';
import { useParams } from '../kit/loop';
import { useThreeStudy } from '../kit/three';

const DEFAULTS = { count: 25, instanced: false };
export default function Performance() {
    const host = useRef<HTMLDivElement>(null),
        gpu = useRef<HTMLDivElement>(null),
        readout = useRef<HTMLOutputElement>(null);
    const { values, live, set, reset } = useParams(DEFAULTS);
    useThreeStudy(gpu, (renderer, element) => {
        const scene = new Scene(),
            camera = new PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 6;
        const geometry = new PlaneGeometry(0.18, 0.24),
            material = new MeshBasicMaterial({ color: '#a1bcc5' }),
            dummy = new Object3D();
        let previous = '',
            frames = 0;
        const samples = new Float32Array(60);
        let count = 0;
        const rebuild = () => {
            scene.clear();
            const p = live.current,
                columns = Math.ceil(Math.sqrt(p.count)),
                rows = Math.ceil(p.count / columns);
            const batch = p.instanced ? new InstancedMesh(geometry, material, p.count) : null;
            for (let i = 0; i < p.count; i++) {
                const x = ((i % columns) - (columns - 1) / 2) * 0.23,
                    y = (Math.floor(i / columns) - (rows - 1) / 2) * 0.29;
                if (batch) {
                    dummy.position.set(x, y, 0);
                    dummy.updateMatrix();
                    batch.setMatrixAt(i, dummy.matrix);
                } else {
                    const mesh = new Mesh(geometry, material);
                    mesh.position.set(x, y, 0);
                    scene.add(mesh);
                }
            }
            if (batch) {
                batch.instanceMatrix.needsUpdate = true;
                scene.add(batch);
            }
        };
        return {
            resize: (w, h) => {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            },
            frame: (_t, _dt, frameMs) => {
                const key = `${live.current.count}-${live.current.instanced}`;
                if (key !== previous) {
                    scene.children.forEach((object) => {
                        if (object instanceof InstancedMesh) object.dispose();
                    });
                    rebuild();
                    previous = key;
                }
                renderer.render(scene, camera);
                frames++;
                samples[count++] = frameMs;
                if (count === samples.length) {
                    const sorted = samples.slice().sort();
                    const metrics = {
                        frames,
                        calls: renderer.info.render.calls,
                        geometries: renderer.info.memory.geometries,
                        textures: renderer.info.memory.textures,
                        medianMs: Number(sorted[30].toFixed(1)),
                        p95Ms: Number(sorted[57].toFixed(1)),
                    };
                    element.dataset.studyMetrics = JSON.stringify(metrics);
                    if (readout.current)
                        readout.current.textContent = `${metrics.calls} draw call${metrics.calls === 1 ? '' : 's'} · ${metrics.geometries} geometry\nmedian ${metrics.medianMs}ms · p95 ${metrics.p95Ms}ms`;
                    count = 0;
                }
            },
            dispose: () => {
                scene.children.forEach((object) => {
                    if (object instanceof InstancedMesh) object.dispose();
                });
                geometry.dispose();
                material.dispose();
            },
        };
    });
    return (
        <Demo
            stageRef={host}
            title="Same picture, different batching"
            hint="Compare separate meshes with instances. These are live renderer numbers."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="Repeated shapes"
                        value={values.count}
                        min={5}
                        max={150}
                        step={5}
                        help="Every copy shares one shape and material in this benchmark."
                        onChange={(v) => set('count', v)}
                    />
                    <Toggle label="Use instancing" checked={values.instanced} help="One batch can draw all copies when their geometry and material agree." onChange={(v) => set('instanced', v)} />
                    <output ref={readout} className="fl-readout">
                        Measuring visible frames…
                    </output>
                    <p className="fl-event-message">Frame intervals describe this browser and machine. This is not a comparison of different GPUs.</p>
                </>
            }
        >
            <div ref={gpu} className="fl-gpu-stage" />
            <p className="fl-stage-caption">A controlled batch study, not Floema’s many-texture gallery.</p>
        </Demo>
    );
}
