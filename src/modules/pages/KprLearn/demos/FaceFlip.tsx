'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { Btn, Demo, Readout, Slider, Toggle } from '../kit/controls';
import { fitPixelCamera, labelTexture, makeShared } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { type Face, KPR, NotchedCard } from '../kit/source';

const NAMES = ['girl', 'story', 'portrait'];
const DEFAULTS = { turn: 0, single: false, swap: true, spin: false };

/**
 * Chapter 04: a real NotchedCard with three faces (placeholders for the hero's girl, story and
 * portrait). Its own apply() decides which face sits on the front and back of the plane.
 */
export default function FaceFlip() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const [slots, setSlots] = useState({ front: 'girl', back: 'story', showing: 'girl' });

    useThreeCanvas(host, ({ renderer }) => {
        renderer.setClearColor('#f3f2ee', 1);
        const scene = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera();
        const shared = makeShared();
        const texes = [labelTexture('1', 'girl · front', '#6d5fc4'), labelTexture('2', 'story · back', '#c98a68'), labelTexture('3', 'portrait · front', KPR.lavender)];
        const faces: Face[] = texes.map((tex, i) => ({ tex, aspect: 1, base: ['#6d5fc4', '#cf9a7a', KPR.lavender][i] }));
        const geo = new THREE.PlaneGeometry(1, 1, 24, 1);
        const card = new NotchedCard(geo, shared).setFaces(...faces);
        scene.add(card.mesh);
        void shared.ready.then(() => {
            card.u.uNoise.value = shared.noise;
            card.u.uFlick.value = shared.flick;
        });
        let last = '';
        let spin = 0;
        return {
            resize: (w, h) => fitPixelCamera(cam, w / h),
            frame: (time, dt) => {
                const d = ref.current;
                if (d.spin) spin = (spin + dt * 0.9) % (Math.PI * 2);
                const ry = -(d.spin ? spin : d.turn);
                const s = card.state;
                Object.assign(s, { x: 0, y: 0, w: 380, h: 470, ry, opacity: 1, radius: 22, tiltX: 0, tiltY: 0, edge: 7 * Math.abs(Math.sin(ry)) });
                s.notch = [0, 1, 0.52 * 470, 21];
                s.chamfer = [2, 23];
                card.single(d.single);
                card.apply(time, dt, 0, 0, 0);
                // the demo shows the picture on the card itself (no screen pinning: that is chapter 06)
                card.u.uRect.value.set(0, 0, 0, 0);
                if (!d.swap) {
                    // naive two-sided card: picture 1 on the front, picture 2 on the back, forever
                    card.u.uMapF.value = texes[0];
                    card.u.uMapB.value = texes[1];
                }
                const k = Math.round(Math.abs(ry) / Math.PI);
                const name = (t: THREE.Texture | null) => (t ? NAMES[texes.indexOf(t as THREE.CanvasTexture)] : 'none');
                const showing = Math.cos(ry) >= 0 ? name(card.u.uMapF.value) : name(card.u.uMapB.value);
                const key = `${name(card.u.uMapF.value)}|${name(card.u.uMapB.value)}|${showing}|${k}`;
                if (key !== last) {
                    last = key;
                    setSlots({ front: name(card.u.uMapF.value), back: name(card.u.uMapB.value), showing: d.single && Math.cos(ry) < 0 ? '(hidden)' : showing });
                }
                renderer.render(scene, cam);
            },
            dispose: () => {
                card.dispose();
                geo.dispose();
                texes.forEach((t) => t.dispose());
                shared.dispose();
            },
        };
    });

    return (
        <Demo
            title="One card, three faces"
            hint="Drag the turn from 0° to 360°. Watch the front/back slots: the hidden side gets its next picture while it faces away."
            onReset={reset}
            controls={
                <>
                    <Slider
                        label="turn (ry)"
                        value={p.turn}
                        min={0}
                        max={Math.PI * 2}
                        step={0.005}
                        onChange={(v) => set('turn', v)}
                        format={(v) => `${((v / Math.PI) * 180).toFixed(0)}°`}
                        help="Every half turn (180°) moves one step along the faces list."
                    />
                    <Btn onClick={() => set('spin', !p.spin)}>{p.spin ? '❚❚ Stop spinning' : '↻ Spin'}</Btn>
                    <Toggle
                        label="swap the hidden face"
                        checked={p.swap}
                        onChange={(v) => set('swap', v)}
                        help="Off: a plain two-sided card. After the second half turn you see picture 1 again instead of 3."
                    />
                    <Toggle label="single-sided" checked={p.single} onChange={(v) => set('single', v)} help="Back discarded: past 90° the card vanishes (ring cards, trailer card)." />
                    <Readout
                        items={[
                            { label: 'front slot', value: slots.front },
                            { label: 'back slot', value: slots.back },
                            { label: 'you see', value: slots.showing, color: '#c0fb50' },
                        ]}
                    />
                </>
            }
        >
            <div ref={host} className="aspect-[4/3] w-full lg:aspect-auto lg:h-full lg:min-h-[460px]" />
        </Demo>
    );
}
