'use client';

import { useRef } from 'react';
import * as THREE from 'three';

import { Demo, Group, Slider, Toggle } from '../kit/controls';
import { createLinearOutput, disposeObject } from '../kit/gl';
import { prefersReducedMotion, useParams, useThreeCanvas } from '../kit/loop';
import { accentBackdropMaterial, DofController, Network, tickPoly } from '../kit/source';

/**
 * The page's Network class as ScienceWorld uses it: candidates on two narrowing helices plus
 * stragglers below, every pair closer than 1.8 linked by a string of beads, breathing on 3D simplex
 * noise. Amount rebuilds it; the toggles hide its three layers.
 */
const DEFAULTS = { amount: 14, breathe: true, speed: 1, nodes: true, halos: true, links: true, size: 64 };

export default function NetworkLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const info = useRef<HTMLSpanElement>(null);

    useThreeCanvas(
        host,
        ({ renderer, size, pointer }) => {
            const out = createLinearOutput({ samples: 2, vignette: true });
            const scene = new THREE.Scene();
            const bgMat = accentBackdropMaterial('#05190d', '#262808', '#0b3838', [0.2, 0.2], [0.8, 0.8]);
            const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
            bg.frustumCulled = false;
            scene.add(bg);
            const flat = new THREE.Camera();
            const fx = new THREE.Scene();
            const cam = new THREE.PerspectiveCamera(45, 1, 1, 700);
            cam.position.set(0, 0, 10);
            const dof = new DofController({ width: 20, height: 15, farMin: 55, farMax: 55 });
            let net: Network | null = null;
            let built = -1;
            const ptr = new THREE.Vector2();
            let t = 0;
            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    cam.aspect = w / h;
                    cam.updateProjectionMatrix();
                },
                frame(time, dt) {
                    t += dt;
                    const prm = ref.current;
                    if (built !== prm.amount) {
                        if (net) {
                            fx.remove(net.object);
                            disposeObject(net.object);
                        }
                        net = new Network({ dof, color1: '#7ddbbf', color2: '#eeff30', linksColor: '#345b46', size: 64, amount: prm.amount });
                        net.object.position.set(0, -1.2, -1);
                        net.object.scale.setScalar(0.62);
                        fx.add(net.object);
                        built = prm.amount;
                        const links = (net.object.children[0] as THREE.Points).geometry.attributes.position.count / 30;
                        if (info.current)
                            info.current.textContent = `${(net.object.children[2] as THREE.Points).geometry.attributes.position.count} nodes · ${links} links · ${links * 30} link beads · 3 draw calls`;
                    }
                    if (!net) return;
                    if (pointer.over) ptr.set(pointer.x, pointer.y);
                    else if (!prefersReducedMotion()) ptr.set(Math.sin(t * 0.35) * 0.6, Math.sin(t * 0.5) * 0.4);
                    const k = 1 - Math.exp(-3 * dt);
                    cam.position.x += (ptr.x * 0.75 - cam.position.x) * k;
                    cam.position.y += (ptr.y * 0.75 - cam.position.y) * k;
                    dof.update(ptr, true, dt);
                    net.object.rotation.y = time * 0.06 + 0.6;
                    if (prm.breathe) net.update(dt * 1000 * prm.speed);
                    const [links, halos, nodes] = net.object.children;
                    links.visible = prm.links;
                    halos.visible = prm.halos;
                    nodes.visible = prm.nodes;
                    net.mats[0].uniforms.size.value = prm.size;
                    net.mats[1].uniforms.size.value = prm.size * 2;
                    tickPoly(fx, time * 0.6, size.h, size.dpr);
                    out.begin(renderer);
                    renderer.render(scene, flat);
                    renderer.clearDepth();
                    renderer.render(fx, cam);
                    out.present(renderer);
                },
                dispose() {
                    disposeObject(scene);
                    disposeObject(fx);
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 1.5 },
    );

    return (
        <Demo
            title="Network: candidates in a funnel"
            hint="A funnel of candidate nodes that narrows toward the top, linked by strings of beads. Turn up the breathing speed to see the noise at work."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="nodes per spiral"
                        value={p.amount}
                        min={6}
                        max={26}
                        step={1}
                        onChange={(v) => set('amount', v)}
                        help="14 on the page. Links appear between any two nodes closer than 1.8."
                    />
                    <Group title="Breathing">
                        <Toggle label="breathe on noise" checked={p.breathe} onChange={(v) => set('breathe', v)} help="Nodes push outward on 3D simplex noise, most near the top." />
                        <Slider
                            label="speed"
                            value={p.speed}
                            min={0}
                            max={60}
                            step={0.5}
                            onChange={(v) => set('speed', v)}
                            format={(v) => `${v}×`}
                            help="The page is very slow (1×): it reads as a calm drift."
                        />
                    </Group>
                    <Group title="Layers">
                        <Toggle label="nodes" checked={p.nodes} onChange={(v) => set('nodes', v)} />
                        <Toggle label="halos" checked={p.halos} onChange={(v) => set('halos', v)} help="A second, bigger soft sprite on each node." />
                        <Toggle label="link beads" checked={p.links} onChange={(v) => set('links', v)} help="30 bokeh beads strung along each link." />
                        <Slider label="node size" value={p.size} min={8} max={140} step={1} onChange={(v) => set('size', v)} format={(v) => `${v} px`} />
                    </Group>
                    <span ref={info} className="cl-mono block text-[10.5px] text-[var(--cl-dim)]" />
                </>
            }
        >
            <div ref={host} className="aspect-[4/3] w-full sm:aspect-[16/10]" />
        </Demo>
    );
}
