'use client';

import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CARD_IMAGES, GALLERY_RING, type PaintingId, PAINTINGS } from '../data/media';
import { W } from '../scroll/timeline';
import { film, useUi } from '../scroll/useScrollStore';

import { type Assets, loadAssets } from './assets';
import { type Cast, choreograph, logoRide } from './choreo';
import { disposeKtx2 } from './loaders';
import { createLogoWipe, LOGO_LAST } from './LogoWipe';
import { type Face, NotchedCard } from './NotchedCard';
import { baseView, PaintedScene } from './PaintedScene';
import { paintText } from './text';

/** Camera distance for the pixel stage: 1 world unit = 1 CSS px at z = 0. */
const distance = (vh: number) => Math.max(1100, vh * 1.25);

function fitPixelCamera(cam: THREE.PerspectiveCamera, w: number, h: number) {
    const d = distance(h);
    cam.position.set(0, 0, d);
    cam.near = 10;
    cam.far = d * 4;
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / 2 / d));
    cam.aspect = w / h;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
}

function PixelCamera() {
    const { camera, size } = useThree();
    useEffect(() => fitPixelCamera(camera as THREE.PerspectiveCamera, size.width, size.height), [camera, size]);
    return null;
}

type Built = {
    cast: Cast;
    all: NotchedCard[];
    scenes: Record<PaintingId, PaintedScene>;
    logo: ReturnType<typeof createLogoWipe>;
    barcode: ReturnType<typeof createLogoWipe>;
    dispose: () => void;
};

function build(assets: Assets, scene: THREE.Scene, displayFont: string): Built {
    const geo = new THREE.PlaneGeometry(1, 1, 24, 1);
    const shared = { noise: assets.noise, flick: assets.flick };
    const card = () => new NotchedCard(geo, shared);

    const scenes = Object.fromEntries((Object.keys(PAINTINGS) as PaintingId[]).map((id) => [id, new PaintedScene(assets.paintings[id], PAINTINGS[id], assets.books)])) as Record<
        PaintingId,
        PaintedScene
    >;
    const painted = (id: PaintingId): Face => ({ tex: scenes[id].texture, aspect: 16 / 9, base: PAINTINGS[id].clear, scene: scenes[id] });
    const image = (id: keyof typeof CARD_IMAGES): Face => ({ tex: assets.cards[id], aspect: CARD_IMAGES[id].aspect, base: CARD_IMAGES[id].base });

    const ring = Array.from({ length: GALLERY_RING.count }, (_, i) =>
        card()
            .setFaces({ tex: assets.gallery[i % assets.gallery.length], aspect: 622 / 682, base: '#6e5aa8', alphaMap: true })
            .single(),
    );

    const word = paintText('KEEPERS', `"${displayFont}"`, '#000000', 360, 0.01);
    const wordCard = card().setFaces({ tex: word.tex, aspect: word.aspect, base: '#000', alphaMap: true }).single();
    wordCard.u.uGrain.value = 0;
    wordCard.u.uFlickAmt.value = 0;

    const cast: Cast = {
        hero: card().setFaces(painted('landing'), painted('story'), painted('collection')),
        introSmall: card()
            .setFaces({ tex: assets.trailerSide, aspect: 546 / 306, base: '#8a6a7a', alphaMap: true })
            .single(),
        introTall: card().setFaces(image('trailer')).single(),
        lav: LAV_SHADES.map((base) => card().setFaces({ tex: null, aspect: 1, base }).single()),
        ring,
        keepB: card().setFaces(image('keepTower')),
        keepC: card().setFaces(image('crater')),
        keep: card().setFaces(painted('keep')),
        factions: card().setFaces(painted('factions')),
        world: card().setFaces(painted('world')),
        launchA: card().setFaces(image('crater')),
        launchB: card().setFaces(image('keepTower')),
        launchC: card().setFaces(image('eyes')),
        word: wordCard,
    };
    cast.lav.forEach((l) => (l.u.uGrain.value = 0.015));
    const all = Object.values(cast).flat() as NotchedCard[];
    all.forEach((c) => scene.add(c.mesh));

    const logo = createLogoWipe(assets.books.logo);
    scene.add(logo.mesh);
    const barcode = createLogoWipe(assets.header, { color: '#000000', last: assets.header.frames.length - 1, order: 210 });
    scene.add(barcode.mesh);

    return {
        cast,
        all,
        scenes,
        logo,
        barcode,
        dispose: () => {
            all.forEach((c) => {
                scene.remove(c.mesh);
                c.dispose();
            });
            scene.remove(logo.mesh, barcode.mesh);
            logo.dispose();
            barcode.dispose();
            word.tex.dispose();
            geo.dispose();
            Object.values(scenes).forEach((p) => p.dispose());
        },
    };
}

/** the purple layers that grow behind the 10K portrait: darker, darker still, then the gallery's lavender */
const LAV_SHADES = ['#7466c6', '#5b4daa', '#8b7ed9'];

/** the logo wipe's own clock (frames), independent of the scroll once triggered */
const logoClock = { frame: 0 };
const rendered = new Set<PaintedScene>();

function World() {
    const { gl, scene, size, viewport, camera } = useThree();
    const built = useRef<Built | null>(null);

    useEffect(() => {
        const signal = { cancelled: false };
        let assets: Assets | null = null;
        gl.setClearColor(0xffffff, 1);
        // verification tooling only (same ?replay flag the motion-kit uses)
        if (new URLSearchParams(window.location.search).has('replay')) Object.assign(window, { __kprGL: gl });
        const setUi = useUi.getState().set;
        const family = getComputedStyle(document.querySelector('.kpr') ?? document.documentElement)
            .getPropertyValue('--kpr-font-display')
            .split(',')[0]
            .replace(/['"]/g, '')
            .trim();
        Promise.all([loadAssets(gl, (p) => setUi({ progress: p }), signal), document.fonts.load(`700 100px "${family}"`).catch(() => null)])
            .then(([a]) => {
                if (signal.cancelled) {
                    a.dispose();
                    return;
                }
                assets = a;
                built.current = build(a, scene, family);
                if (new URLSearchParams(window.location.search).has('replay')) Object.assign(window, { __kprBuilt: built.current });
                const scenes = Object.values(built.current.scenes);
                scenes.forEach((p) => p.resize(window.innerWidth, window.innerHeight, gl.getPixelRatio()));
                // compile every program once so the first scroll never stalls
                built.current.all.forEach((c) => (c.mesh.visible = true));
                gl.compile(scene, camera);
                // warm every painting now (behind the loader): compile its programs, upload its textures
                // and the flipbook sheets, instead of hitching on the first frame it appears
                const v = baseView();
                scenes.forEach((p) => {
                    gl.compile(p.scene, p.camera);
                    p.render(gl, v);
                    p.render(gl, { ...v, progress: 0.6, time: 2.6 });
                });
                setUi({ loaded: true });
            })
            .catch((e) => {
                console.error('[kpr] asset loading failed', e);
                setUi({ loaded: true });
            });
        return () => {
            signal.cancelled = true;
            logoClock.frame = 0;
            built.current?.dispose();
            built.current = null;
            assets?.dispose();
            disposeKtx2();
        };
    }, [gl, scene, camera]);

    useEffect(() => {
        if (built.current) Object.values(built.current.scenes).forEach((p) => p.resize(size.width, size.height, viewport.dpr));
    }, [size, viewport.dpr]);

    useFrame(() => {
        const b = built.current;
        if (!b || film.covered) return;
        const t = film.view;
        choreograph(b.cast);
        const chroma = film.reduced ? 0 : Math.min(0.012, Math.abs(film.vel) * 0.0035);
        const ptrK = film.reduced ? 0 : 1;
        for (const c of b.all) c.apply(film.time, film.dt, film.px * ptrK, film.py * ptrK, chroma);

        // paintings: only the ones on screen render, each once per frame
        rendered.clear();
        for (const c of b.all)
            for (const n of c.needs) {
                if (rendered.has(n.scene)) continue;
                rendered.add(n.scene);
                n.scene.render(gl, n.view);
            }

        // logo wipe: plays on its own clock once the story reaches it and holds on the symbol; scrolling
        // back above it rewinds it (faster). The symbol then rides the shrinking story card and turns with it.
        const fps = 48;
        const armed = t >= W.glyph[0];
        if (film.reduced) logoClock.frame = armed ? LOGO_LAST : 0;
        else logoClock.frame = armed ? Math.min(LOGO_LAST, logoClock.frame + film.dt * fps) : Math.max(0, logoClock.frame - film.dt * fps * 2.5);

        // the opening's barcode (black, header-sprite), driven by Intro.tsx
        const bf = film.barcode;
        b.barcode.update(bf, film.vw, film.vh, 0, 0, 1, bf >= 0 && bf < b.barcode.count ? 1 : 0);
        b.logo.update(logoClock.frame, film.vw, film.vh, logoRide.x, 0, logoRide.squash, logoClock.frame > 0.5 ? 1 : 0);
    });

    return null;
}

export default function Stage() {
    return (
        <Canvas
            className="kpr-canvas"
            frameloop="never"
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false }}
            camera={{ fov: 45, near: 10, far: 5000, position: [0, 0, 1200] }}
            flat
            aria-hidden
        >
            <PixelCamera />
            <World />
        </Canvas>
    );
}
