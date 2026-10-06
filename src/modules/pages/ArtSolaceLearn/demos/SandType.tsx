'use client';

import { useEffect, useRef, useState } from 'react';

import { Btn, Demo, Group, Segmented, Slider, Toggle } from '../kit/controls';
import { rgb, useFragment } from '../kit/gl';
import { GRAIN, HASH, NOISE } from '../kit/glsl';
import { useParams } from '../kit/loop';
import { PALETTE_NAMES, paletteByName } from '../kit/source';

/** Any picture → sand: its darkness becomes the draw chance, noise frays its edges. */
export const TYPE_FRAG = /* glsl */ `
${HASH}
${NOISE}
${GRAIN}
uniform sampler2D uImage;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uGamma;      // contrast curve on darkness
uniform float uErode;      // how far noise bends the lookup
uniform float uErodeScale; // size of the erosion
uniform float uWindDir;    // erosion stretched along this angle
uniform float uSky;        // grain kept on blank paper
uniform float uZones;      // 1 = posterise into the art's three zones
uniform vec3 uZone;        // core, slope, sky chances for that mode
uniform float uScan;       // 0..1 pour from the top

void main() {
    vec2 c = vec2(gl_FragCoord.x / uResolution.x, 1.0 - gl_FragCoord.y / uResolution.y);

    // erosion: bend where we read the picture, using noise (domain warping), stretched by the wind
    vec2 wind = vec2(cos(uWindDir), sin(uWindDir));
    vec2 p = c * uErodeScale;
    vec2 bend = vec2(fbm(p, 4), fbm(p + vec2(5.2, 1.3), 4));
    vec2 q = c + uErode * (bend + wind * abs(bend.x) * 1.5);

    float lum = dot(texture(uImage, q).rgb, vec3(0.299, 0.587, 0.114));
    float dark = pow(1.0 - lum, uGamma);               // darkness, shaped by the contrast curve

    float density = mix(uSky, 1.0, dark);               // tone straight from darkness…
    if (uZones > 0.5) {                                 // …or the art's three zones
        density = dark > 0.66 ? uZone.x : dark > 0.33 ? uZone.y : uZone.z;
    }
    if (c.y > uScan) density = 0.0;                     // still pouring
    fragColor = vec4(mix(uPaper, uInk, inkAt(c, density)), 1.0);
}
`;

const DEFAULTS = {
    gamma: 1.2,
    erode: 0.016,
    erodeScale: 9,
    windDir: 0,
    sky: 0.04,
    zones: false,
    grain: 1.8,
    tries: 2.8,
    alpha: 0.7,
};
const SOURCE_SIZE = 1024;

/** next/font puts the family names in CSS variables on the layout wrapper: read them from inside it. */
function fontFamily(from: Element, variable: string, fallback: string) {
    const v = getComputedStyle(from).getPropertyValue(variable).trim();
    return v || fallback;
}

/** Draw the words (or the uploaded image) into the source canvas: black on white, square. */
function paintSource(canvas: HTMLCanvasElement, from: Element, text: string, face: 'serif' | 'sans' | 'mono', image: ImageBitmap | null) {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, SOURCE_SIZE, SOURCE_SIZE);
    if (image) {
        const s = Math.max(SOURCE_SIZE / image.width, SOURCE_SIZE / image.height); // cover
        ctx.drawImage(image, (SOURCE_SIZE - image.width * s) / 2, (SOURCE_SIZE - image.height * s) / 2, image.width * s, image.height * s);
        return;
    }
    const lines = text
        .split('/')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 4);
    if (!lines.length) return;
    const family =
        face === 'serif'
            ? fontFamily(from, '--sl-font-display', 'Georgia, serif')
            : face === 'mono'
              ? fontFamily(from, '--sl-font-mono', 'monospace')
              : fontFamily(from, '--font-inter', 'Arial, sans-serif');
    const weight = face === 'sans' ? '800' : '400';
    // fit: the widest line spans 86 % of the width, all lines fit 80 % of the height
    ctx.font = `${weight} 100px ${family}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const size = Math.min((100 * SOURCE_SIZE * 0.86) / widest, (SOURCE_SIZE * 0.8) / (lines.length * 1.05));
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, SOURCE_SIZE / 2, SOURCE_SIZE / 2 + (i - (lines.length - 1) / 2) * size * 1.05));
}

export default function SandType() {
    const host = useRef<HTMLDivElement>(null);
    const { p, set, reset } = useParams(DEFAULTS);
    const [text, setText] = useState('Solace');
    const [face, setFace] = useState<'serif' | 'sans' | 'mono'>('serif');
    const [palette, setPalette] = useState('Weather');
    const [image, setImage] = useState<ImageBitmap | null>(null);
    const [grainSeed, setGrainSeed] = useState(1);
    const [scanning, setScanning] = useState(false);
    const scanStart = useRef(-1);

    // the picture lives in a hidden 2D canvas; `version` tells the GPU side to re-upload it
    const source = useRef<HTMLCanvasElement | null>(null);
    const version = useRef(0);
    const uploaded = useRef<{ version: number; tex: WebGLTexture | null }>({ version: -1, tex: null });

    const live = useRef({ p, palette, grainSeed });
    const { invalidate } = useFragment(
        host,
        TYPE_FRAG,
        (f, time) => {
            const L = live.current;
            if (source.current && uploaded.current.version !== version.current) {
                uploaded.current = { version: version.current, tex: f.imageTexture(source.current, uploaded.current.tex ?? undefined) };
            }
            if (uploaded.current.tex) f.texture('uImage', uploaded.current.tex, 0);
            const pal = paletteByName(L.palette);
            f.set('uPaper', rgb(pal.paper));
            f.set('uInk', rgb(pal.ink));
            f.set('uGamma', L.p.gamma);
            f.set('uErode', L.p.erode);
            f.set('uErodeScale', L.p.erodeScale);
            f.set('uWindDir', (L.p.windDir * Math.PI) / 180);
            f.set('uSky', L.p.sky);
            f.set('uZones', L.p.zones ? 1 : 0);
            f.set('uZone', [1, 0.1, 0.03]);
            f.set('uDotSize', 0.0012 * L.p.grain);
            f.set('uTries', 0.576 * L.p.tries);
            f.set('uInkAlpha', L.p.alpha);
            f.set('uGrainSeed', L.grainSeed);
            let scan = 1.01;
            if (scanStart.current === -2) scanStart.current = time;
            if (scanStart.current >= 0) {
                scan = Math.min(1.01, (time - scanStart.current) / 1.8);
                if (scan >= 1.01) {
                    scanStart.current = -1;
                    setScanning(false);
                }
            }
            f.set('uScan', scan);
        },
        {
            animate: scanning,
            maxDpr: 2,
            setup: () => {
                // a fresh GL context needs a fresh upload
                uploaded.current = { version: -1, tex: null };
            },
        },
    );

    useEffect(() => {
        live.current = { p, palette, grainSeed };
        invalidate();
    }, [p, palette, grainSeed, invalidate]);

    // redraw the source picture when the words, face or image change (after fonts are ready)
    useEffect(() => {
        let cancelled = false;
        if (!source.current) {
            source.current = document.createElement('canvas');
            source.current.width = source.current.height = SOURCE_SIZE;
        }
        void document.fonts.ready.then(() => {
            if (cancelled || !source.current || !host.current) return;
            paintSource(source.current, host.current, text, face, image);
            version.current++;
            invalidate();
        });
        return () => {
            cancelled = true;
        };
    }, [text, face, image, invalidate]);

    // free the decoded image when it's replaced or the demo closes
    useEffect(() => () => image?.close(), [image]);

    const onFile = async (file: File | undefined) => {
        if (!file || !file.type.startsWith('image/')) return;
        setImage(await createImageBitmap(file));
    };

    return (
        <Demo
            title="Sand type"
            hint="Type a word (use / for a new line) or load an image from your computer. Its darkness becomes each grain’s chance to stay. Nothing is uploaded anywhere."
            onReset={() => {
                reset();
                setText('Solace');
                setFace('serif');
                setPalette('Weather');
                setImage(null);
            }}
            controls={
                <>
                    <div>
                        <label htmlFor="sandtype-text" className="sl-mono mb-1.5 block text-[11px] text-[var(--sl-ink)]">
                            Words
                        </label>
                        <input
                            id="sandtype-text"
                            value={text}
                            maxLength={60}
                            onChange={(e) => {
                                setText(e.target.value);
                                setImage(null);
                            }}
                            className="sl-mono w-full rounded-md border border-[var(--sl-line-3)] bg-[var(--sl-stage)] px-3 py-2 text-[13px] outline-none focus:border-[var(--sl-ink)]"
                        />
                    </div>
                    <Segmented
                        label="Typeface"
                        options={[
                            { value: 'serif', label: 'Serif' },
                            { value: 'sans', label: 'Sans black' },
                            { value: 'mono', label: 'Mono' },
                        ]}
                        value={face}
                        onChange={(v) => {
                            setFace(v);
                            setImage(null);
                        }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="sl-btn sl-mono cursor-pointer rounded-full border border-[var(--sl-line-3)] px-3.5 py-1.5 text-[11px] uppercase text-[var(--sl-body)] hover:border-[var(--sl-ink)]">
                            Load an image…
                            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
                        </label>
                        <Btn
                            onClick={() => {
                                scanStart.current = -2;
                                setScanning(true);
                            }}
                        >
                            Pour ↓
                        </Btn>
                        <Btn onClick={() => setGrainSeed((g) => g + 1)}>Re-throw</Btn>
                    </div>
                    <Group title="Tone">
                        <Slider label="contrast curve" value={p.gamma} min={0.3} max={4} onChange={(v) => set('gamma', v)} help="Darkness to the power of this. Up = harder edges." />
                        <Slider label="paper grain" value={p.sky} min={0} max={0.5} onChange={(v) => set('sky', v)} help="Chance kept on blank paper (the art’s sky)." />
                        <Toggle label="three zones, like the art" checked={p.zones} onChange={(v) => set('zones', v)} help="Posterise darkness into core / slope / sky chances." />
                    </Group>
                    <Group title="Erosion">
                        <Slider label="erosion" value={p.erode} min={0} max={0.08} step={0.001} onChange={(v) => set('erode', v)} help="How far noise bends the lookup." />
                        <Slider label="erosion size" value={p.erodeScale} min={1} max={40} step={0.5} onChange={(v) => set('erodeScale', v)} help="Big = sweeping drifts, small = gritty." />
                        <Slider label="wind angle °" value={p.windDir} min={-180} max={180} step={1} onChange={(v) => set('windDir', v)} help="Edges smear in this direction." />
                    </Group>
                    <Group title="Grain">
                        <Slider label="grain size ×" value={p.grain} min={0.6} max={6} step={0.1} onChange={(v) => set('grain', v)} />
                        <Slider label="dots ×" value={p.tries} min={0.2} max={5} step={0.1} onChange={(v) => set('tries', v)} />
                        <Slider label="ink opacity" value={p.alpha} min={0.05} max={1} onChange={(v) => set('alpha', v)} />
                        <Segmented label="Palette" options={PALETTE_NAMES} value={palette} onChange={setPalette} />
                    </Group>
                </>
            }
        >
            <div className="mx-auto aspect-square w-full max-w-[640px]">
                <div ref={host} className="relative size-full" role="img" aria-label={image ? 'An uploaded image rendered as sand' : `The words “${text}” rendered as sand`} />
            </div>
        </Demo>
    );
}
