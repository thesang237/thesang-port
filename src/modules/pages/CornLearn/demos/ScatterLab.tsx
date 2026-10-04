'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { disposeFont, loadDisplayFont } from '../kit/assets';
import { Btn, Demo, Group, Slider, StageNote, Toggle } from '../kit/controls';
import { createLinearOutput, overlayCamera } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import { CHAPTERS, type MsdfFont, type TitleText, Trail } from '../kit/source';
import { makeTitle, placeOnAnchor, titleUniforms } from '../kit/titles';

/**
 * The real thing: TitleText + Trail from the page, fully drawn, waiting for your pointer. Layer
 * toggles show the three meshes a title is made of (links, letters, nodes); the radius dials scale
 * the field the shader reads (uTrailR = 1.15 cap, uHoldR = 3 cap).
 */
const LINES = CHAPTERS[6].title;
const DEFAULTS = { letters: true, nodes: true, links: true, hover: 1, hold: 1 };

export default function ScatterLab() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const anchor = useRef<HTMLHeadingElement>(null);
    const sweep = useRef(-1);
    const [status, setStatus] = useState('Loading the font atlas…');

    useThreeCanvas(
        host,
        ({ renderer, size, host: el }) => {
            const out = createLinearOutput({ samples: 2 });
            const overlay = new THREE.Scene();
            const cam = overlayCamera(1, 1);
            const trail = new Trail();
            let font: MsdfFont | null = null;
            let title: TitleText | null = null;
            let cap = 60;
            let alive = true;
            const fit = () => {
                const a = anchor.current;
                if (!a) return;
                const longest = Math.max(...LINES.map((l) => l.length));
                a.style.fontSize = `${Math.max(18, Math.min(84, (size.w * 0.8) / (0.53 * longest), (size.h * 0.7) / (0.987 * LINES.length))).toFixed(1)}px`;
            };
            const place = () => {
                if (!title || !anchor.current) return;
                fit();
                cap = placeOnAnchor(title, anchor.current, el, size.dpr);
            };
            loadDisplayFont()
                .then((f) => {
                    if (!alive) return disposeFont(f);
                    font = f;
                    title = makeTitle(f, [...LINES], trail);
                    title.draw = 1;
                    title.fill = 1;
                    overlay.add(title.group);
                    place();
                    setStatus('');
                })
                .catch(() => setStatus('Could not load the atlas'));

            const px = new THREE.Vector2(-1e4, -1e4);
            const zone = stage.current ?? el;
            const localXY = (e: PointerEvent) => {
                const r = el.getBoundingClientRect();
                px.set(e.clientX - r.left, e.clientY - r.top);
            };
            const onMove = (e: PointerEvent) => localXY(e);
            const onLeave = () => {
                px.set(-1e4, -1e4);
                trail.release();
            };
            const onDown = (e: PointerEvent) => {
                localXY(e);
                if (title?.hits(px.x, px.y, 20)) trail.press(px.x, px.y);
            };
            const onUp = () => trail.release();
            zone.addEventListener('pointermove', onMove);
            zone.addEventListener('pointerleave', onLeave);
            zone.addEventListener('pointerdown', onDown);
            window.addEventListener('pointerup', onUp);

            return {
                resize(w, h) {
                    out.setSize(w, h, size.dpr);
                    overlayCamera(w, h, cam);
                    place();
                },
                frame(time, dt) {
                    const prm = ref.current;
                    if (title) {
                        // auto sweep: a virtual pointer across the block (touch screens, demos)
                        if (sweep.current >= 0) {
                            sweep.current += dt / 2.6;
                            const k = sweep.current;
                            const o = title.origin;
                            px.set(o.x + title.layout.width * k, o.y + title.layout.height * (0.5 + 0.45 * Math.sin(k * 10)));
                            if (k >= 1) {
                                sweep.current = -1;
                                px.set(-1e4, -1e4);
                            }
                        }
                        const [links, letters, nodes] = title.group.children;
                        links.visible = prm.links;
                        letters.visible = prm.letters;
                        nodes.visible = prm.nodes;
                        const u = titleUniforms(title);
                        u.uTrailR.value = cap * 1.15 * prm.hover;
                        u.uHoldR.value = cap * 3 * prm.hold;
                        title.update(time);
                        const over = title.hits(px.x, px.y, 10);
                        if (over) trail.push(px.x, px.y);
                        trail.rest(px.x, px.y, over);
                    }
                    trail.update(dt);
                    out.begin(renderer, 0x050b08);
                    renderer.render(overlay, cam);
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
                    out.dispose();
                },
            };
        },
        [],
        { antialias: false, maxDpr: 2 },
    );

    return (
        <Demo
            title="Scatter lab: the page’s title, live"
            hint="Sweep the title, rest on it, press and hold. Then switch layers off to see what each mesh adds."
            onReset={reset}
            controls={
                <>
                    <Group title="Layers (three meshes, one title)">
                        <Toggle label="letters (instanced quads)" checked={p.letters} onChange={(v) => set('letters', v)} help="Fill, outline and the travelling segments." />
                        <Toggle label="nodes (points)" checked={p.nodes} onChange={(v) => set('nodes', v)} help="Sampled on the letter edges; fly out inside the field." />
                        <Toggle label="links (line segments)" checked={p.links} onChange={(v) => set('links', v)} help="Each node joined to its 2 nearest neighbours at full flight." />
                    </Group>
                    <Group title="Field size">
                        <Slider
                            label="hover radius"
                            value={p.hover}
                            min={0.3}
                            max={3}
                            step={0.05}
                            onChange={(v) => set('hover', v)}
                            format={(v) => `${(v * 1.15).toFixed(2)} cap`}
                            help="uTrailR. The page: 1.15 cap."
                        />
                        <Slider
                            label="hold radius"
                            value={p.hold}
                            min={0.3}
                            max={2.5}
                            step={0.05}
                            onChange={(v) => set('hold', v)}
                            format={(v) => `${(v * 3).toFixed(1)} cap`}
                            help="uHoldR. The page: 3 cap."
                        />
                    </Group>
                    <Btn
                        onClick={() => {
                            sweep.current = 0;
                        }}
                    >
                        Auto sweep
                    </Btn>
                </>
            }
        >
            <div ref={stage} className="relative aspect-[4/3] w-full touch-none overflow-hidden sm:aspect-[16/9]">
                <div ref={host} className="absolute inset-0" />
                <h2 ref={anchor} className="cl-gl-anchor absolute left-[9%] top-1/2 -translate-y-1/2 leading-[0.987]" aria-label={LINES.join(' ')}>
                    {LINES.map((l) => (
                        <span key={l} className="block">
                            {l}
                        </span>
                    ))}
                </h2>
                {status ? <StageNote>{status}</StageNote> : null}
            </div>
        </Demo>
    );
}
