'use client';

import { type RefObject, useRef } from 'react';
import * as THREE from 'three';

import { disposeFont, loadDisplayFont } from '../kit/assets';
import { createLinearOutput, disposeObject, gentle, overlayCamera } from '../kit/gl';
import { prefersReducedMotion, useThreeCanvas } from '../kit/loop';
import { accentBackdropMaterial, CORN, DofController, ENGINE, type MsdfFont, particleArea, tickPoly, type TitleText, Trail } from '../kit/source';
import { makeTitle, placeOnAnchor } from '../kit/titles';

/**
 * The guide's own hero, built with the page's techniques (chapter 04, 05, 07): the hero background
 * card, the three hero bokeh fields with a focus that follows the pointer, and the real TitleText
 * drawn over a transparent DOM heading — it traces in, fills, and scatters under the pointer.
 */
export default function HeroTitle({ anchor, area, onReady }: { anchor: RefObject<HTMLElement | null>; area: RefObject<HTMLElement | null>; onReady?: (ok: boolean) => void }) {
    const host = useRef<HTMLDivElement>(null);

    useThreeCanvas(
        host,
        ({ renderer, size, host: el }) => {
            const out = createLinearOutput({ samples: 2, grain: ENGINE.wipe.grain, vignette: true });
            const scene = new THREE.Scene();
            const bgMat = accentBackdropMaterial(CORN.heroBase, CORN.heroBlue, CORN.heroGreen, [0.2, 0.2], [0.8, 0.8]);
            bgMat.uniforms.uShift.value.set(0, -0.12);
            bgMat.uniforms.uFloor.value.set(0.0, 0.35);
            const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
            bg.frustumCulled = false;
            scene.add(bg);
            const flat = new THREE.Camera();

            // bokeh in the reference camera (45°, z 10), hero presets
            const fx = new THREE.Scene();
            const fxCam = new THREE.PerspectiveCamera(45, 1, 1, 700);
            fxCam.position.set(0, 0, 10);
            const dof = new DofController({ width: 5, height: 12, farMin: 25, farMax: 40 });
            const areas = new THREE.Group();
            areas.add(
                particleArea({ pX: 2.33, pY: -3.05, s: 1, rY: -27.746, color: '#103f0c', o: 0.8, particleSizeMin: 10, particleSizeMax: 200, radius: 2 }, dof, 200, 1),
                particleArea({ pX: 1.4, pY: -2.82, s: 0.6, rY: -47.968, rZ: 1.84, color: '#b22020', o: 1, particleSizeMin: 10, particleSizeMax: 80, radius: 4 }, dof, 200, 2),
                particleArea({ pX: -3.27, pY: -2.15, s: 1, rY: -11.1965, color: '#103f42', o: 0.58, particleSizeMin: 5, particleSizeMax: 200, radius: 3 }, dof, 500, 3),
            );
            areas.position.set(2.2, 1.2, 0);
            fx.add(areas);

            // the title: overlay in screen px, drawn on the transparent h1
            const overlay = new THREE.Scene();
            const ortho = overlayCamera(1, 1);
            const trail = new Trail();
            let title: TitleText | null = null;
            let font: MsdfFont | null = null;
            let alive = true;
            const reduced = prefersReducedMotion();
            let t = reduced ? 99 : -0.3;

            const measure = () => {
                if (title && anchor.current) placeOnAnchor(title, anchor.current, el, size.dpr);
            };
            loadDisplayFont()
                .then((f) => {
                    if (!alive) return disposeFont(f);
                    font = f;
                    title = makeTitle(f, ['GRAINLINE,', 'DECODED.'], trail);
                    overlay.add(title.group);
                    measure();
                    onReady?.(true);
                })
                .catch(() => onReady?.(false));
            // fonts in the DOM can shift the heading after load
            void document.fonts?.ready.then(() => alive && measure());

            // pointer over the hero (the canvas itself lets clicks through)
            const ptr = new THREE.Vector2();
            const ptrTarget = new THREE.Vector2();
            const px = new THREE.Vector2(-1e4, -1e4);
            let active = false;
            const zone = area.current ?? el;
            const local = (e: PointerEvent) => {
                const r = el.getBoundingClientRect();
                px.set(e.clientX - r.left, e.clientY - r.top);
                ptrTarget.set((px.x / r.width) * 2 - 1, -((px.y / r.height) * 2 - 1));
            };
            const onMove = (e: PointerEvent) => {
                active = true;
                local(e);
            };
            const onLeave = () => {
                active = false;
                px.set(-1e4, -1e4);
                trail.release();
            };
            const onDown = (e: PointerEvent) => {
                local(e);
                if (title && title.fill > 0.99 && title.hits(px.x, px.y, 20)) trail.press(px.x, px.y);
            };
            const onUp = () => trail.release();
            zone.addEventListener('pointermove', onMove);
            zone.addEventListener('pointerleave', onLeave);
            zone.addEventListener('pointerdown', onDown);
            window.addEventListener('pointerup', onUp);

            let fxTime = 0;
            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    fxCam.aspect = w / h;
                    fxCam.updateProjectionMatrix();
                    overlayCamera(w, h, ortho);
                    measure();
                },
                frame(time, dt) {
                    t += dt;
                    const k = 1 - Math.exp(-3 * dt);
                    ptr.lerp(ptrTarget, k);
                    // the reference camera slides (not turns) toward the pointer by ±0.75
                    fxCam.position.x += (ptr.x * 0.75 - fxCam.position.x) * k;
                    fxCam.position.y += (ptr.y * 0.75 - fxCam.position.y) * k;
                    dof.update(ptr, active, dt);
                    fxTime += dt * 0.6;
                    tickPoly(fx, fxTime, size.h, size.dpr);
                    areas.children.forEach((c) => (c.rotation.y -= 0.03 * dt));

                    if (title) {
                        const D = ENGINE.draw;
                        const s = t - D.delay;
                        title.draw = gentle(0, D.draw, s);
                        title.fill = gentle(D.fillAt, D.fillAt + D.fill, s);
                        title.update(time);
                        const over = title.fill > 0.9 && title.hits(px.x, px.y, 10);
                        if (over) trail.push(px.x, px.y);
                        trail.rest(px.x, px.y, over);
                    }
                    trail.update(dt);

                    out.begin(renderer);
                    renderer.render(scene, flat);
                    renderer.clearDepth();
                    renderer.render(fx, fxCam);
                    renderer.clearDepth();
                    renderer.render(overlay, ortho);
                    out.present(renderer);
                },
                dispose() {
                    alive = false;
                    zone.removeEventListener('pointermove', onMove);
                    zone.removeEventListener('pointerleave', onLeave);
                    zone.removeEventListener('pointerdown', onDown);
                    window.removeEventListener('pointerup', onUp);
                    title?.dispose();
                    disposeFont(font);
                    disposeObject(scene);
                    disposeObject(fx);
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: ENGINE.maxDpr },
    );

    return <div ref={host} className="absolute inset-0" aria-hidden />;
}
