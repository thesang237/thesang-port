'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';

import { disposeFont, loadDisplayFont } from '../kit/assets';
import { Demo, Group, Segmented, Slider, StageNote } from '../kit/controls';
import { overlayCamera } from '../kit/gl';
import { useParams, useThreeCanvas } from '../kit/loop';
import type { MsdfFont } from '../kit/source';

/**
 * One glyph of the page's headline atlas, under a microscope. The atlas stores distance to the edge in
 * three channels; the median of the three is the signed distance; the shader turns it into a crisp
 * fill or a hairline at any zoom. A second map (gradient-map.png) stores how far along the outline each
 * edge pixel is: that is what the trace reveal reads.
 */
const MODES = ['atlas', 'median', 'fill', 'outline', 'path map', 'trace', 'bitmap'] as const;
type Mode = (typeof MODES)[number];
const DEFAULTS = { mode: 'fill' as Mode, glyph: 'G', zoom: 1, weight: 0, soft: 1, progress: 0.6 };

const frag = /* glsl */ `
uniform sampler2D uAtlas, uOutline;
uniform float uMode, uPxRange, uWeight, uProgress, uTexel;
uniform vec4 uRect;      // glyph rect in atlas uv: u0, v0, u1, v1
uniform vec2 uAtlasSize;
varying vec2 vUv;
float median(vec3 c) { return max(min(c.r, c.g), min(max(c.r, c.g), c.b)); }
vec3 ramp(float t) { return clamp(vec3(abs(t * 6.0 - 3.0) - 1.0, 2.0 - abs(t * 6.0 - 2.0), 2.0 - abs(t * 6.0 - 4.0)), 0.0, 1.0); }
float along(vec2 uv) {
    vec2 o = vec2(uTexel * 1.5, 0.0);
    float a = texture2D(uOutline, uv).r;
    a = min(a, texture2D(uOutline, uv + o.xy).r);
    a = min(a, texture2D(uOutline, uv - o.xy).r);
    a = min(a, texture2D(uOutline, uv + o.yx).r);
    a = min(a, texture2D(uOutline, uv - o.yx).r);
    return a;
}
void main() {
    vec2 uv = mix(uRect.xy, uRect.zw, vUv);
    vec3 msdf = texture2D(uAtlas, uv).rgb;
    float m = median(msdf);
    float sd = (m - 0.5 + uWeight) * uPxRange;          // signed distance in screen px, + inside
    float fill = clamp(sd + 0.5, 0.0, 1.0);
    float line = 1.0 - smoothstep(0.35, 1.25, abs(sd));
    vec3 col = vec3(0.0);
    if (uMode < 0.5) col = msdf;
    else if (uMode < 1.5) col = vec3(m);
    else if (uMode < 2.5) col = vec3(fill);
    else if (uMode < 3.5) col = vec3(line) * vec3(0.33, 1.0, 0.76);
    else if (uMode < 4.5) {
        float p = line > 0.001 ? along(uv) : 1.0;
        col = ramp(p * 0.8) * line + vec3(fill) * 0.08;
    } else if (uMode < 5.5) {
        float p = line > 0.001 ? along(uv) : 1.0;
        float drawn = smoothstep(p - 0.02, p, uProgress) * step(0.001, uProgress);
        col = vec3(line * drawn) + vec3(line) * 0.12;
    } else {
        // what a plain bitmap of the same size would give: one sample per atlas pixel, hard threshold
        vec2 px = (floor(uv * uAtlasSize) + 0.5) / uAtlasSize;
        col = vec3(step(0.5 - uWeight, median(texture2D(uAtlas, px).rgb)));
    }
    gl_FragColor = vec4(col, 1.0);
}`;

export default function MsdfXray() {
    const { p, set, ref, reset } = useParams(DEFAULTS);
    const host = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('Loading the font atlas…');

    useThreeCanvas(
        host,
        ({ renderer, size }) => {
            const scene = new THREE.Scene();
            const cam = overlayCamera(1, 1);
            let font: MsdfFont | null = null;
            let alive = true;
            const uniforms = {
                uAtlas: { value: null as THREE.Texture | null },
                uOutline: { value: null as THREE.Texture | null },
                uMode: { value: 2 },
                uPxRange: { value: 4 },
                uWeight: { value: 0 },
                uProgress: { value: 0.6 },
                uTexel: { value: 1 / 512 },
                uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
                uAtlasSize: { value: new THREE.Vector2(512, 512) },
            };
            const mat = new THREE.ShaderMaterial({
                uniforms,
                vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
                fragmentShader: frag,
                side: THREE.DoubleSide,
            });
            const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            scene.add(quad);
            loadDisplayFont()
                .then((f) => {
                    if (!alive) return disposeFont(f);
                    font = f;
                    uniforms.uAtlas.value = f.atlas;
                    uniforms.uOutline.value = f.outline;
                    uniforms.uTexel.value = 1 / f.size;
                    uniforms.uAtlasSize.value.set(f.size, f.size);
                    setStatus('');
                })
                .catch(() => setStatus('Could not load the atlas'));
            return {
                resize(w, h) {
                    overlayCamera(w, h, cam);
                },
                frame() {
                    if (!font) {
                        renderer.setClearColor(0x040a07, 1);
                        renderer.clear();
                        return;
                    }
                    const prm = ref.current;
                    const ch = font.chars.get(prm.glyph.charCodeAt(0));
                    if (!ch) return;
                    uniforms.uRect.value.set(ch.x / font.size, ch.y / font.size, (ch.x + ch.width) / font.size, (ch.y + ch.height) / font.size);
                    // fit the glyph in the stage, then zoom into its top-left corner region
                    const fit = Math.min((size.w * 0.7) / ch.width, (size.h * 0.82) / ch.height);
                    const scale = fit * prm.zoom;
                    const gw = ch.width * scale;
                    const gh = ch.height * scale;
                    quad.scale.set(gw, gh, 1); // overlay camera is y-down and the atlas is stored top-down: no flip needed
                    const zx = (prm.zoom - 1) * gw * 0.18;
                    const zy = (prm.zoom - 1) * gh * 0.18;
                    quad.position.set(size.w / 2 + zx, size.h / 2 + zy, 0);
                    uniforms.uMode.value = MODES.indexOf(prm.mode);
                    uniforms.uPxRange.value = (font.range * scale) / prm.soft;
                    uniforms.uWeight.value = prm.weight;
                    uniforms.uProgress.value = prm.progress;
                    renderer.setClearColor(0x040a07, 1);
                    renderer.clear();
                    renderer.render(scene, cam);
                },
                dispose() {
                    alive = false;
                    quad.geometry.dispose();
                    mat.dispose();
                    disposeFont(font);
                },
            };
        },
        [],
        { antialias: true },
    );

    const hints: Record<Mode, string> = {
        atlas: 'The raw atlas: three channels, each a distance to a different set of edges. Corners stay sharp because the channels disagree there.',
        median: 'The median of the three channels: grey 0.5 is exactly the letter’s edge, brighter is inside.',
        fill: 'Threshold at 0.5 with a 1 px soft edge: crisp at any size. Zoom in and it stays sharp.',
        outline: 'Keep only the pixels within ±1.25 px of the edge: the hairline the reveal draws.',
        'path map': 'gradient-map.png: how far along the outline each edge pixel is (blue = start, red = end).',
        trace: 'The outline shows where path position < progress. Drag progress: the stroke draws itself.',
        bitmap: 'A plain bitmap of the same atlas: one sample per pixel. Zoom in and the edge turns into stairs.',
    };

    return (
        <Demo
            title="MSDF x-ray: one letter under the microscope"
            hint={hints[p.mode]}
            onReset={reset}
            controls={
                <>
                    <Segmented label="view" options={MODES} value={p.mode} onChange={(v) => set('mode', v)} />
                    <Segmented label="glyph" options={['G', 'R', 'A', 'S', '5', '%'] as const} value={p.glyph as 'G'} onChange={(v) => set('glyph', v)} />
                    <Group title="Dials">
                        <Slider
                            label="zoom"
                            value={p.zoom}
                            min={1}
                            max={14}
                            step={0.1}
                            onChange={(v) => set('zoom', v)}
                            format={(v) => `${v.toFixed(1)}×`}
                            help="Fill and outline stay sharp; bitmap breaks up."
                        />
                        <Slider
                            label="weight"
                            value={p.weight}
                            min={-0.25}
                            max={0.25}
                            step={0.005}
                            onChange={(v) => set('weight', v)}
                            help="Shift the 0.5 threshold: bolder or thinner from the same atlas."
                        />
                        <Slider label="edge softness" value={p.soft} min={0.25} max={12} step={0.05} onChange={(v) => set('soft', v)} help="1 = the page (1 px). Higher = a blurry glow edge." />
                        <Slider label="trace progress" value={p.progress} min={0} max={1} step={0.005} onChange={(v) => set('progress', v)} help="Used by the trace view." />
                    </Group>
                </>
            }
        >
            <div ref={host} className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
                {status ? <StageNote>{status}</StageNote> : null}
            </div>
        </Demo>
    );
}
