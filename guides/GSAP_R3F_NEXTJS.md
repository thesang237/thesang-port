# GSAP + React Three Fiber in Next.js

## Architecture & Animation Guide — Based on Floema

This guide translates every animation and WebGL pattern from the Floema Eleventy/OGL project into a **Next.js + GSAP + React Three Fiber (R3F)** project. Each section covers the "why", the file structure, and working code for every page.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Setup](#2-project-setup)
3. [Core Hooks & Utilities](#3-core-hooks--utilities)
4. [Global Canvas Layer](#4-global-canvas-layer)
5. [Smooth Scroll](#5-smooth-scroll)
6. [Preloader](#6-preloader)
7. [Page Transitions](#7-page-transitions)
8. [Home Page](#8-home-page)
9. [Collections Page](#9-collections-page)
10. [About Page](#10-about-page)
11. [Detail Overlay](#11-detail-overlay)
12. [DOM Animations (Shared)](#12-dom-animations-shared)
13. [Performance Rules](#13-performance-rules)

---

## 1. Architecture Overview

The key architectural insight of Floema — and this guide — is the **two-layer model**:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 2 — React DOM (z-index: 2, pointer-events: auto) │
│  Transparent backgrounds, text, buttons, nav            │
│  GSAP animates opacity/transform of DOM elements        │
└─────────────────────────────────────────────────────────┘
          ↑ DOM shows through because backgrounds are
            transparent — WebGL shows through beneath

┌─────────────────────────────────────────────────────────┐
│  LAYER 1 — R3F Canvas (z-index: 1, fixed, full screen)  │
│  Images rendered as WebGL meshes                        │
│  Mesh positions mirror DOM element bounding rects       │
│  GSAP animates uniforms (uAlpha) and mesh.position/scale│
└─────────────────────────────────────────────────────────┘
```

**Critical rules that make this work:**

- Gallery `<img>` elements are `visibility: hidden` (they only serve as layout anchors for WebGL positioning)
- Every image in the app goes through a single texture preloader; WebGL meshes reference `window.TEXTURES[url]`
- GSAP drives all animation — both DOM and R3F uniforms — from a single timeline
- Smooth scroll is lerp-based, applied via `useFrame` in R3F and CSS `transform: translate3d` on the DOM wrapper

---

## 2. Project Setup

### Install dependencies

```bash
npm install gsap @react-three/fiber @react-three/drei three
npm install @gsap/react          # useGSAP hook
npm install lenis                # smooth scroll (replaces manual lerp)
npm install split-type           # replaces custom split() util
```

### `next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Required for Three.js / R3F transpilation
    transpilePackages: ['three'],
};

module.exports = nextConfig;
```

### TypeScript path aliases (`tsconfig.json`)

```json
{
    "compilerOptions": {
        "paths": {
            "@/components/*": ["./src/components/*"],
            "@/hooks/*": ["./src/hooks/*"],
            "@/shaders/*": ["./src/shaders/*"],
            "@/utils/*": ["./src/utils/*"],
            "@/store/*": ["./src/store/*"]
        }
    }
}
```

### Folder structure

```
src/
  app/
    layout.tsx           ← global providers, canvas, nav
    page.tsx             ← home route
    collections/page.tsx
    about/page.tsx
  components/
    canvas/
      SceneCanvas.tsx    ← <Canvas> wrapper, always mounted
      HomeGallery.tsx    ← R3F home image planes
      AboutGallery.tsx   ← R3F about image planes
      CollectionsMedia.tsx
      TransitionMesh.tsx ← shared flip/morph mesh
    ui/
      Preloader.tsx
      Navigation.tsx
      PageWrapper.tsx    ← smooth scroll + GSAP show/hide
  hooks/
    useTextureStore.ts   ← global window.TEXTURES equivalent
    useSmoothScroll.ts
    useDomRect.ts        ← getBoundingClientRect reactive
    usePageTransition.ts
  shaders/
    home.vert / home.frag
    plane.vert / plane.frag
    collections.vert / collections.frag
  store/
    appStore.ts          ← zustand: preloaded, currentPage, scroll
  utils/
    math.ts              ← lerp, clamp, mapRange
```

---

## 3. Core Hooks & Utilities

### `src/utils/math.ts`

```ts
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (min: number, val: number, max: number) => Math.max(min, Math.min(max, val));
export const mapRange = (inMin: number, inMax: number, outMin: number, outMax: number, val: number) => outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
```

### `src/store/appStore.ts`

```ts
import { create } from 'zustand';

interface AppStore {
    isPreloaded: boolean;
    currentPage: string;
    scrollY: number;
    setPreloaded: () => void;
    setPage: (page: string) => void;
    setScrollY: (y: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
    isPreloaded: false,
    currentPage: 'home',
    scrollY: 0,
    setPreloaded: () => set({ isPreloaded: true }),
    setPage: (page) => set({ currentPage: page }),
    setScrollY: (y) => set({ scrollY: y }),
}));
```

### `src/hooks/useTextureStore.ts`

This is the direct equivalent of `window.TEXTURES` — a singleton map of URL → Three.js Texture, loaded once during preloading.

```ts
import { useEffect } from 'react';
import * as THREE from 'three';

// Singleton — persists for the app lifetime
const TEXTURES = new Map<string, THREE.Texture>();

export function getTexture(url: string): THREE.Texture | undefined {
    return TEXTURES.get(url);
}

export function usePreloadTextures(urls: string[], onComplete: () => void) {
    useEffect(() => {
        let loaded = 0;

        const loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';

        urls.forEach((url) => {
            // Skip empty urls (model fallback case)
            if (!url) {
                loaded++;
                check();
                return;
            }

            loader.load(
                url,
                (texture) => {
                    texture.generateMipmaps = false;
                    texture.needsUpdate = true;
                    TEXTURES.set(url, texture);
                    loaded++;
                    check();
                },
                undefined,
                () => {
                    // onerror — count as loaded to avoid stalling
                    loaded++;
                    check();
                },
            );
        });

        function check() {
            if (loaded === urls.length) onComplete();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
```

### `src/hooks/useDomRect.ts`

Reactive version of `getBoundingClientRect` — used to sync DOM positions to WebGL meshes.

```ts
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export function useDomRect() {
    const ref = useRef<HTMLElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const measure = useCallback(() => {
        if (ref.current) setRect(ref.current.getBoundingClientRect());
    }, []);

    useLayoutEffect(() => {
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure]);

    return { ref, rect, measure };
}
```

---

## 4. Global Canvas Layer

The R3F `<Canvas>` is mounted **once** in the root layout and never unmounts. Page components add/remove their meshes by conditionally rendering R3F children inside the persistent canvas.

### `src/app/layout.tsx`

```tsx
import SceneCanvas from '@/components/canvas/SceneCanvas';
import Navigation from '@/components/ui/Navigation';
import Preloader from '@/components/ui/Preloader';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {/* Layer 1 — fixed WebGL canvas, always present */}
                <SceneCanvas />

                {/* Layer 2 — scrollable DOM content */}
                <main id="page-wrapper">
                    <Navigation />
                    {children}
                </main>

                <Preloader />
            </body>
        </html>
    );
}
```

### `src/components/canvas/SceneCanvas.tsx`

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { useAppStore } from '@/store/appStore';
import HomeGallery from './HomeGallery';
import AboutGallery from './AboutGallery';
import CollectionsMedia from './CollectionsMedia';

export default function SceneCanvas() {
    const currentPage = useAppStore((s) => s.currentPage);

    return (
        <Canvas
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1,
                pointerEvents: 'none', // DOM handles all pointer events
            }}
            camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 5] }}
            gl={{ antialias: true, alpha: true }}
            dpr={Math.min(window.devicePixelRatio, 2)}
        >
            {/* Each page mounts its own R3F subtree */}
            {currentPage === 'home' && <HomeGallery />}
            {currentPage === 'about' && <AboutGallery />}
            {currentPage === 'collections' && <CollectionsMedia />}
        </Canvas>
    );
}
```

**Why `pointerEvents: none` on the canvas?**
The DOM layer (z-index: 2) receives all mouse/touch events. The canvas is purely visual. When a product card is clicked on the Collections page, the DOM button fires the event and the React state change drives the GSAP animation.

---

## 5. Smooth Scroll

Replace Floema's manual `lerp` + `translate3d` with **Lenis**, which integrates cleanly with R3F's `useFrame`.

### `src/hooks/useSmoothScroll.ts`

```ts
import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import Lenis from 'lenis';
import { useAppStore } from '@/store/appStore';

let lenis: Lenis | null = null;

export function getLenis() {
    return lenis;
}

export function useSmoothScroll() {
    const setScrollY = useAppStore((s) => s.setScrollY);

    useEffect(() => {
        lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        lenis.on('scroll', ({ scroll }: { scroll: number }) => {
            setScrollY(scroll);
        });

        return () => {
            lenis?.destroy();
            lenis = null;
        };
    }, [setScrollY]);

    // Drive Lenis from R3F's animation loop — single rAF for everything
    useFrame((_, delta) => {
        lenis?.raf(delta * 1000);
    });
}
```

### Usage in root layout

```tsx
// src/components/canvas/SceneCanvas.tsx — add inside <Canvas>
function ScrollDriver() {
    useSmoothScroll();
    return null;
}

// inside <Canvas>:
<ScrollDriver />;
```

---

## 6. Preloader

Exact port of `Preloader.js`. Loads all textures, animates title letters in/out with GSAP, then emits completion.

### `src/components/ui/Preloader.tsx`

```tsx
'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';
import { usePreloadTextures } from '@/hooks/useTextureStore';
import { useAppStore } from '@/store/appStore';

// All image URLs to preload — pass from page data or a global manifest
const ASSETS: string[] = [
    '/images/home/1.jpg',
    '/images/home/2.jpg',
    // ... all product and gallery images
];

export default function Preloader() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLParagraphElement>(null);
    const numberRef = useRef<HTMLSpanElement>(null);
    const setPreloaded = useAppStore((s) => s.setPreloaded);

    // Animate in title on mount
    useEffect(() => {
        if (!titleRef.current) return;

        const split = new SplitType(titleRef.current, { types: 'words,chars' });
        const chars = split.chars ?? [];

        const tl = gsap.timeline();

        tl.set(titleRef.current, { autoAlpha: 1 });

        tl.fromTo(
            chars,
            { autoAlpha: 0, y: '100%' },
            {
                autoAlpha: 1,
                y: '0%',
                duration: 1,
                stagger: 0.015,
                ease: 'back.inOut',
            },
        );

        return () => split.revert();
    }, []);

    // Load all textures; update counter on each asset loaded
    usePreloadTextures(ASSETS, () => {
        animateOut();
    });

    function onAssetLoaded(loaded: number, total: number) {
        const pct = Math.round((loaded / total) * 100);
        if (numberRef.current) numberRef.current.textContent = `${pct}%`;
    }

    function animateOut() {
        if (!titleRef.current || !wrapperRef.current) return;

        const split = new SplitType(titleRef.current, { types: 'words,chars' });
        const chars = split.chars ?? [];

        const tl = gsap.timeline({
            delay: 0.5,
            onComplete: () => {
                setPreloaded();
                wrapperRef.current?.remove();
            },
        });

        tl.to(chars, {
            autoAlpha: 0,
            y: '-100%',
            duration: 1,
            stagger: 0.015,
            ease: 'back.inOut',
        });

        tl.to(numberRef.current, { autoAlpha: 0, duration: 0.8 }, '<');
        tl.to(wrapperRef.current, { autoAlpha: 0, duration: 0.6 });
    }

    return (
        <div ref={wrapperRef} className="preloader">
            <p ref={titleRef} className="preloader__title">
                The surprise of what is possible
                <br />
                to make with a simple
                <br />
                and thin thread.
            </p>
            <div className="preloader__number">
                <span ref={numberRef} className="preloader__number__text">
                    0%
                </span>
            </div>
        </div>
    );
}
```

```css
/* preloader.css */
.preloader {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color-background);
}

.preloader__title {
    opacity: 0; /* GSAP sets autoAlpha:1 on start */
    text-align: center;
}

.preloader__number {
    position: absolute;
    bottom: 4rem;
}
```

---

## 7. Page Transitions

Floema uses a WebGL mesh that morphs between collection card and detail view. In R3F this is a shared `TransitionMesh` component controlled by a Zustand state machine.

### Transition state (`src/store/appStore.ts` addition)

```ts
interface TransitionState {
  from: string | null;
  to: string | null;
  phase: 'idle' | 'out' | 'in';
  sourceRect: DOMRect | null;
  targetRect: DOMRect | null;
}

// add to store:
transition: TransitionState = {
  from: null, to: null, phase: 'idle',
  sourceRect: null, targetRect: null,
};
startTransition: (from: string, to: string, sourceRect: DOMRect) => void;
```

### `src/hooks/usePageTransition.ts`

```ts
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useAppStore } from '@/store/appStore';

export function usePageTransition() {
    const router = useRouter();
    const setPage = useAppStore((s) => s.setPage);

    async function navigate(href: string, sourceEl?: HTMLElement) {
        const fromPage = useAppStore.getState().currentPage;
        const sourceRect = sourceEl?.getBoundingClientRect() ?? null;

        // 1. Animate current page out
        await animatePageOut(fromPage);

        // 2. Change route (Next.js soft nav — DOM stays mounted via layout)
        router.push(href);

        // 3. Set new page in store (mounts correct R3F subtree)
        const toPage = href.replace('/', '') || 'home';
        setPage(toPage);

        // 4. Animate new page in
        await animatePageIn(toPage);
    }

    return { navigate };
}

function animatePageOut(page: string) {
    const el = document.querySelector(`[data-page="${page}"]`);
    if (!el) return Promise.resolve();

    return gsap.to(el, {
        autoAlpha: 0,
        duration: 0.6,
        ease: 'expo.inOut',
    });
}

function animatePageIn(page: string) {
    const el = document.querySelector(`[data-page="${page}"]`);
    if (!el) return Promise.resolve();

    return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: 'expo.inOut' });
}
```

### `src/components/ui/PageWrapper.tsx`

Every page component wraps its content in this. It applies the smooth scroll container and triggers show/hide animations.

```tsx
'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useAppStore } from '@/store/appStore';

interface Props {
    pageId: string;
    backgroundColor: string;
    color: string;
    children: React.ReactNode;
}

export default function PageWrapper({ pageId, backgroundColor, color, children }: Props) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isPreloaded = useAppStore((s) => s.isPreloaded);

    // Set CSS custom properties for background/text color transitions
    useEffect(() => {
        document.documentElement.style.setProperty('--bg', backgroundColor);
        document.documentElement.style.setProperty('--color', color);
    }, [backgroundColor, color]);

    // Animate in when preloader completes
    useEffect(() => {
        if (!isPreloaded || !wrapperRef.current) return;

        gsap.fromTo(wrapperRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: 'expo.inOut' });
    }, [isPreloaded]);

    return (
        <div
            ref={wrapperRef}
            data-page={pageId}
            style={{ visibility: 'hidden' }} // GSAP sets autoAlpha:1
        >
            {children}
        </div>
    );
}
```

---

## 8. Home Page

### What Floema does

- Infinite auto-scrolling vertical list of collection labels (looping with lerp)
- 5 WebGL image planes that mirror `visibility: hidden` `<img>` elements
- Images fade in with staggered 2.5–4s delay, slight z-position entrance
- Wheel/touch drives the vertical loop speed

### File: `src/app/page.tsx`

```tsx
import PageWrapper from '@/components/ui/PageWrapper';
import HomeTitles from '@/components/ui/HomeTitles';

export default function HomePage() {
    return (
        <PageWrapper pageId="home" backgroundColor="#b56d65" color="#f5f0e8">
            {/* Titles loop — pure DOM + GSAP */}
            <HomeTitles />

            {/* Gallery — visibility:hidden, positions used by R3F */}
            <div className="home__gallery" aria-hidden="true">
                {GALLERY_IMAGES.map((src, i) => (
                    <figure key={i} className={`home__gallery__media home__gallery__media--${i + 1}`}>
                        <img className="home__gallery__media__image" alt="" data-src={src} style={{ aspectRatio: '2/3', display: 'block', width: '100%' }} />
                    </figure>
                ))}
            </div>

            <a className="home__link" href="/collections">
                Shop the Collection
            </a>
        </PageWrapper>
    );
}

const GALLERY_IMAGES = ['/images/home/1.jpg', '/images/home/2.jpg', '/images/home/3.jpg', '/images/home/4.jpg', '/images/home/5.jpg'];
```

### Infinite Scroll Titles: `src/components/ui/HomeTitles.tsx`

This is the port of `Titles.js` — an infinitely looping vertical marquee driven by lerp, responsive to wheel and touch. In React we use `useFrame` for the rAF loop.

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { lerp } from '@/utils/math';

const COLLECTIONS = ['Vita', 'Treccia', 'Aria', 'Onde'];

// Speed constant — pixels per frame added automatically
const AUTO_SPEED = 1.5;

export default function HomeTitles() {
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<HTMLDivElement[]>([]);

    const scroll = useRef({
        current: 0,
        target: 0,
        last: 0,
        ease: 0.1,
        speed: AUTO_SPEED,
    });

    const metrics = useRef<{
        items: Array<{ el: HTMLDivElement; height: number; offset: number; extra: number; position: number }>;
        heightTotal: number;
        direction: 'up' | 'down';
    }>({ items: [], heightTotal: 0, direction: 'up' });

    // Measure items after mount
    useEffect(() => {
        if (!listRef.current) return;

        const items = itemRefs.current.map((el) => {
            const rect = el.getBoundingClientRect();
            return { el, height: rect.height, offset: rect.top, extra: 0, position: 0 };
        });

        metrics.current.items = items;
        metrics.current.heightTotal = listRef.current.getBoundingClientRect().height;
    }, []);

    // Wheel handler
    useEffect(() => {
        const onWheel = (e: WheelEvent) => {
            const s = scroll.current;
            s.target += e.deltaY * 0.5;
            s.speed = e.deltaY > 0 ? AUTO_SPEED : -AUTO_SPEED;
        };
        window.addEventListener('wheel', onWheel, { passive: true });
        return () => window.removeEventListener('wheel', onWheel);
    }, []);

    // Touch handler
    useEffect(() => {
        let startY = 0;
        let startScroll = 0;

        const onTouchStart = (e: TouchEvent) => {
            startY = e.touches[0].clientY;
            startScroll = scroll.current.current;
        };

        const onTouchMove = (e: TouchEvent) => {
            const dist = (startY - e.touches[0].clientY) * 2;
            scroll.current.target = startScroll + dist;
        };

        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    useFrame(() => {
        const s = scroll.current;
        const m = metrics.current;

        // Auto-advance
        s.target += s.speed;

        // Lerp toward target
        s.current = lerp(s.current, s.target, s.ease);

        m.direction = s.current < s.last ? 'down' : 'up';

        m.items.forEach((item) => {
            item.position = -s.current - item.extra;

            const offset = item.position + item.offset + item.height;

            const isBefore = offset < 0;
            const isAfter = offset > m.heightTotal;

            if (m.direction === 'up' && isBefore) {
                item.extra -= m.heightTotal;
            }

            if (m.direction === 'down' && isAfter) {
                item.extra += m.heightTotal;
            }

            item.el.style.transform = `translate3d(0, ${Math.floor(item.position)}px, 0)`;
        });

        s.last = s.current;
    });

    return (
        <div className="home__titles" ref={listRef}>
            {COLLECTIONS.map((title, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        if (el) itemRefs.current[i] = el;
                    }}
                    className="home__titles__item"
                >
                    <span className="home__titles__label">Collection {String(i + 1).padStart(2, '0')}</span>
                    <span className="home__titles__title">{title}</span>
                </div>
            ))}
        </div>
    );
}
```

### WebGL Gallery: `src/components/canvas/HomeGallery.tsx`

Maps each DOM `<img data-src>` rect to a Three.js plane mesh. GSAP animates `uAlpha` and `mesh.position.z` on show.

```tsx
'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { getTexture } from '@/hooks/useTextureStore';
import { useAppStore } from '@/store/appStore';

const SRCS = ['/images/home/1.jpg', '/images/home/2.jpg', '/images/home/3.jpg', '/images/home/4.jpg', '/images/home/5.jpg'];

// Repeated twice to fill gallery (matches Floema's [0,1] rows loop)
const ALL_SRCS = [...SRCS, ...SRCS];

interface PlaneData {
    mesh: THREE.Mesh;
    uniforms: { uAlpha: { value: number }; uSpeed: { value: number } };
    domEl: HTMLImageElement;
}

export default function HomeGallery() {
    const { size, camera } = useThree();
    const isPreloaded = useAppStore((s) => s.isPreloaded);
    const scrollY = useAppStore((s) => s.scrollY);
    const planesRef = useRef<PlaneData[]>([]);
    const groupRef = useRef<THREE.Group>(null);

    // Viewport size in world units (for a perspective camera)
    const getViewport = () => {
        const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
        const height = 2 * Math.tan(fov / 2) * (camera as THREE.PerspectiveCamera).position.z;
        const width = height * (size.width / size.height);
        return { width, height };
    };

    useLayoutEffect(() => {
        if (!isPreloaded) return;

        const viewport = getViewport();
        const imgEls = document.querySelectorAll<HTMLImageElement>('.home__gallery__media__image');
        if (imgEls.length === 0) return;

        const planes: PlaneData[] = [];

        imgEls.forEach((el, i) => {
            const src = el.getAttribute('data-src');
            if (!src) return;

            const texture = getTexture(src);
            const uniforms = {
                uAlpha: { value: 0 },
                uSpeed: { value: 0 },
                tMap: { value: texture ?? new THREE.Texture() },
                uViewportSizes: { value: new THREE.Vector2(viewport.width, viewport.height) },
            };

            const material = new THREE.ShaderMaterial({
                vertexShader: HOME_VERT,
                fragmentShader: HOME_FRAG,
                uniforms,
                transparent: true,
                depthWrite: false,
            });

            const rect = el.getBoundingClientRect();
            const w = (rect.width / size.width) * viewport.width;
            const h = (rect.height / size.height) * viewport.height;

            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

            mesh.scale.set(w, h, 1);
            mesh.rotation.z = (Math.random() - 0.5) * 0.06; // slight random tilt
            groupRef.current?.add(mesh);

            planes.push({ mesh, uniforms, domEl: el });
        });

        planesRef.current = planes;

        // Animate in — staggered 2.5–4s delay (matches Floema's show(isPreloaded))
        planes.forEach(({ mesh, uniforms }) => {
            const delay = 2.5 + Math.random() * 1.5;

            gsap.fromTo(uniforms.uAlpha, { value: 0 }, { value: 0.4, duration: 2, delay, ease: 'expo.inOut' });

            gsap.fromTo(mesh.position, { z: 2 + Math.random() * 4 }, { z: 0, duration: 2, delay, ease: 'expo.inOut' });
        });

        // Position sync loop below handles ongoing position
        syncPositions(planes, viewport, size, 0);
    }, [isPreloaded]);

    useFrame((_, delta) => {
        const viewport = getViewport();
        syncPositions(planesRef.current, viewport, size, scrollY);

        // Pass scroll speed to distortion uniform
        planesRef.current.forEach(({ uniforms }) => {
            uniforms.uSpeed.value = lerp(uniforms.uSpeed.value, delta * 50, 0.1);
        });
    });

    return <group ref={groupRef} />;
}

function syncPositions(planes: PlaneData[], viewport: { width: number; height: number }, size: { width: number; height: number }, scrollY: number) {
    planes.forEach(({ mesh, domEl }) => {
        const rect = domEl.getBoundingClientRect();

        // Map DOM coords to WebGL world coords
        const x = ((rect.left + rect.width / 2) / size.width) * viewport.width - viewport.width / 2;
        const y = (-(rect.top + rect.height / 2) / size.height) * viewport.height + viewport.height / 2;

        mesh.position.x = x;
        mesh.position.y = y - (scrollY / size.height) * viewport.height;
    });
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

// ---- Shaders ----
const HOME_VERT = /* glsl */ `
  uniform vec2 uViewportSizes;
  uniform float uSpeed;

  varying vec2 vUv;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    // Barrel distortion driven by scroll speed
    float dist = length(worldPos.xy / uViewportSizes);
    worldPos.z += cos(dist * 3.14159 * 0.5) * uSpeed * 0.01;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
    vUv = uv;
  }
`;

const HOME_FRAG = /* glsl */ `
  uniform sampler2D tMap;
  uniform float uAlpha;

  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tMap, vUv);
    gl_FragColor = vec4(color.rgb, uAlpha);
  }
`;
```

---

## 9. Collections Page

### What Floema does

- Horizontal drag/wheel slider of product images
- Each image is a WebGL plane that floats with a sine wave
- Clicking a product flips the mesh 180° (Y rotation) while morphing to fill the screen
- Active product shows info panel; a "close" button reverses the animation

### `src/app/collections/page.tsx`

```tsx
import PageWrapper from '@/components/ui/PageWrapper';

export default function CollectionsPage() {
    return (
        <PageWrapper pageId="collections" backgroundColor="#c4bba0" color="#f5f0e8">
            {/* Gallery — visibility:hidden, positions used by R3F */}
            <div className="collections__gallery" aria-hidden="true">
                {PRODUCTS.map((p, i) => (
                    <figure key={i} className="collections__gallery__media" data-index={i}>
                        <img
                            className="collections__gallery__media__image"
                            alt={p.title}
                            data-src={p.image}
                            data-model-src={p.model ?? ''}
                            style={{ aspectRatio: '35.76/50.48', display: 'block', width: '100%' }}
                        />
                    </figure>
                ))}
            </div>

            {/* Text content — always visible, sits above canvas */}
            <div className="collections__content">
                {PRODUCTS.map((p, i) => (
                    <article key={i} className="collections__article" data-index={i}>
                        <h2>{p.title}</h2>
                        <p>{p.description}</p>
                    </article>
                ))}
            </div>
        </PageWrapper>
    );
}
```

### WebGL + Flip interaction: `src/components/canvas/CollectionsMedia.tsx`

```tsx
'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { getTexture } from '@/hooks/useTextureStore';
import { useAppStore } from '@/store/appStore';

interface CardData {
    group: THREE.Group;
    jewlery: THREE.Mesh; // front face
    model: THREE.Mesh; // back face (rotated 180° on Y)
    opacity: { current: number; target: number; multiplier: number };
    animation: number; // 0=gallery, 1=detail
    index: number;
    domEl: HTMLElement;
}

export default function CollectionsMedia() {
    const { size, camera } = useThree();
    const isPreloaded = useAppStore((s) => s.isPreloaded);
    const scrollX = useRef(0); // horizontal drag scroll
    const activeIndex = useRef(-1);
    const cardsRef = useRef<CardData[]>([]);
    const sceneRef = useRef<THREE.Group>(null);

    // Drag tracking
    const drag = useRef({ isDown: false, start: 0, position: 0, target: 0, current: 0 });

    useLayoutEffect(() => {
        if (!isPreloaded) return;

        const imgEls = document.querySelectorAll<HTMLImageElement>('.collections__gallery__media__image');
        const viewport = getViewport(camera as THREE.PerspectiveCamera, size);

        imgEls.forEach((el, i) => {
            const src = el.getAttribute('data-src') ?? '';
            const modelSrc = el.getAttribute('data-model-src') ?? '';

            const jewleryTex = getTexture(src) ?? new THREE.Texture();
            const modelTex = getTexture(modelSrc) ?? jewleryTex; // fallback to front if no model

            const group = new THREE.Group();

            const jewlery = makePlane(jewleryTex, COLLECTIONS_VERT, COLLECTIONS_FRAG);
            const model = makePlane(modelTex, COLLECTIONS_VERT, COLLECTIONS_FRAG);
            model.rotation.y = Math.PI; // face away by default

            group.add(jewlery, model);
            sceneRef.current?.add(group);

            const card: CardData = {
                group,
                jewlery,
                model,
                opacity: { current: 0, target: 0, multiplier: 0 },
                animation: 0,
                index: i,
                domEl: el.closest('.collections__gallery__media') as HTMLElement,
            };

            cardsRef.current.push(card);
        });

        // Show all cards
        cardsRef.current.forEach((card) => {
            gsap.to(card.opacity, { delay: 0.5, multiplier: 1, duration: 0.8 });
        });

        // Click handlers on DOM cards
        imgEls.forEach((el, i) => {
            el.closest('.collections__gallery__media')?.addEventListener('click', () => {
                openDetail(i);
            });
        });

        syncCardPositions(cardsRef.current, viewport, size, drag.current.current);
    }, [isPreloaded]);

    function openDetail(index: number) {
        const card = cardsRef.current[index];
        if (!card) return;

        activeIndex.current = index;

        // Get target rect — full screen detail media element
        const detailMedia = document.querySelector('.detail__media__image') as HTMLElement;
        const targetRect = detailMedia?.getBoundingClientRect();

        // Animate group scale/position to fill detail area
        gsap.to(card.animation, { value: 1, duration: 2, ease: 'expo.inOut' });
        gsap.to(card.group.rotation, {
            y: Math.PI * 2,
            duration: 2,
            ease: 'expo.inOut',
        });

        // Show detail DOM panel
        gsap.to('.detail', { autoAlpha: 1, duration: 0.6, ease: 'expo.out' });
    }

    function closeDetail() {
        const card = cardsRef.current[activeIndex.current];
        if (!card) return;

        gsap.to(card.group.rotation, { y: 0, duration: 2, ease: 'expo.inOut' });
        gsap.to(card, { animation: 0, duration: 2, ease: 'expo.inOut' });
        gsap.to('.detail', { autoAlpha: 0, duration: 0.4 });

        activeIndex.current = -1;
    }

    // Drag/wheel for horizontal scroll
    useLayoutEffect(() => {
        const d = drag.current;
        const onDown = (e: PointerEvent) => {
            d.isDown = true;
            d.start = e.clientX;
            d.position = d.current;
        };
        const onMove = (e: PointerEvent) => {
            if (!d.isDown) return;
            d.target = d.position + (d.start - e.clientX);
        };
        const onUp = () => {
            d.isDown = false;
        };
        const onWheel = (e: WheelEvent) => {
            d.target += e.deltaY;
        };

        window.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('wheel', onWheel, { passive: true });

        document.querySelector('.detail__button')?.addEventListener('click', closeDetail);

        return () => {
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('wheel', onWheel);
        };
    }, []);

    useFrame((state) => {
        const d = drag.current;
        const viewport = getViewport(camera as THREE.PerspectiveCamera, size);

        // Lerp horizontal scroll
        d.current = lerp(d.current, d.target, 0.08);

        cardsRef.current.forEach((card, i) => {
            // Sine wave float (Floema's sliderY)
            const sliderY = Math.sin(i * 0.5 + state.clock.elapsedTime * 0.5) * 0.3;

            // Opacity lerp
            card.opacity.target = i === activeIndex.current || activeIndex.current === -1 ? 1 : 0.4;
            card.opacity.current = lerp(card.opacity.current, card.opacity.target, 0.1);

            const alpha = card.opacity.multiplier * card.opacity.current;
            setUniform(card.jewlery, 'uAlpha', alpha);
            setUniform(card.model, 'uAlpha', alpha);

            // Float
            card.group.position.y = lerp(sliderY, 0, card.animation);
        });

        syncCardPositions(cardsRef.current, viewport, size, d.current);
    });

    return <group ref={sceneRef} />;
}

function makePlane(texture: THREE.Texture, vert: string, frag: string) {
    const mat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
            uAlpha: { value: 0 },
            tMap: { value: texture },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
}

function setUniform(mesh: THREE.Mesh, key: string, val: number) {
    (mesh.material as THREE.ShaderMaterial).uniforms[key].value = val;
}

function syncCardPositions(cards: CardData[], viewport: { width: number; height: number }, size: { width: number; height: number }, scrollX: number) {
    cards.forEach((card) => {
        const rect = card.domEl.getBoundingClientRect();
        const w = (rect.width / size.width) * viewport.width;
        const h = (rect.height / size.height) * viewport.height;

        card.jewlery.scale.set(w, h, 1);
        card.model.scale.set(w, h, 1);

        const x = ((rect.left + rect.width / 2) / size.width) * viewport.width - viewport.width / 2;
        const y = -((rect.top + rect.height / 2) / size.height) * viewport.height + viewport.height / 2;

        card.group.position.x = x;
        // card.group.position.y set in useFrame (includes float)
        card.group.position.z = lerp(0, 0.1, card.animation);
    });
}

function getViewport(camera: THREE.PerspectiveCamera, size: { width: number; height: number }) {
    const fov = camera.fov * (Math.PI / 180);
    const h = 2 * Math.tan(fov / 2) * camera.position.z;
    return { width: h * (size.width / size.height), height: h };
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

const COLLECTIONS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

const COLLECTIONS_FRAG = /* glsl */ `
  uniform sampler2D tMap;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(tMap, vUv);
    gl_FragColor = vec4(color.rgb, uAlpha);
  }
`;
```

---

## 10. About Page

### What Floema does

- Vertically scrollable page with sections: title, two content blocks, highlight, gallery
- Gallery images are WebGL planes arranged in an arc (cosine offset)
- Each image rotates on the Z axis based on its X world position
- GSAP IntersectionObserver-driven paragraph animations (words slide up on enter)

### `src/app/about/page.tsx`

```tsx
import PageWrapper from '@/components/ui/PageWrapper';
import AnimatedParagraph from '@/components/ui/AnimatedParagraph';

export default function AboutPage() {
    return (
        <PageWrapper pageId="about" backgroundColor="#8b7355" color="#f5f0e8">
            <div className="about__wrapper">
                {/* Title — GSAP split text animation */}
                <section className="about__title" data-animation="paragraph">
                    <h1>
                        Handcrafted
                        <br />
                        with intention.
                    </h1>
                </section>

                {/* Content blocks */}
                <section className="about__content">
                    <AnimatedParagraph>
                        <p>Founded on the belief that the simplest materials hold the deepest beauty.</p>
                    </AnimatedParagraph>
                    <figure className="about__content__media">
                        <img data-src="/images/about/content-1.jpg" alt="Our Story" />
                    </figure>
                </section>

                {/* Gallery — visibility:hidden, WebGL renders instead */}
                <div className="about__gallery" aria-hidden="true">
                    {GALLERY.map((src, i) => (
                        <figure key={i} className="about__gallery__media" style={{ width: '30.9rem', height: '43.7rem' }}>
                            <img className="about__gallery__media__image" data-src={src} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                        </figure>
                    ))}
                </div>
            </div>
        </PageWrapper>
    );
}

const GALLERY = ['/images/about/1.jpg', '/images/about/2.jpg', '/images/about/3.jpg'];
```

### WebGL arc gallery: `src/components/canvas/AboutGallery.tsx`

The key visual: images arranged horizontally, each one bowed upward (cosine Y offset) and rotated on Z based on X position.

```tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { getTexture } from '@/hooks/useTextureStore';
import { useAppStore } from '@/store/appStore';

interface MediaData {
    mesh: THREE.Mesh;
    uniforms: { uAlpha: { value: number } };
    domEl: HTMLElement;
    extra: number;
}

export default function AboutGallery() {
    const { size, camera } = useThree();
    const isPreloaded = useAppStore((s) => s.isPreloaded);
    const scrollY = useAppStore((s) => s.scrollY);
    const mediasRef = useRef<MediaData[]>([]);
    const groupRef = useRef<THREE.Group>(null);

    useLayoutEffect(() => {
        if (!isPreloaded) return;

        const figures = document.querySelectorAll<HTMLElement>('.about__gallery__media');
        const viewport = getViewport(camera as THREE.PerspectiveCamera, size);

        figures.forEach((figure) => {
            const img = figure.querySelector<HTMLImageElement>('img');
            if (!img) return;

            const src = img.getAttribute('data-src') ?? '';
            const texture = getTexture(src) ?? new THREE.Texture();

            const uniforms = {
                uAlpha: { value: 0 },
                tMap: { value: texture },
            };

            const mat = new THREE.ShaderMaterial({
                vertexShader: PLANE_VERT,
                fragmentShader: PLANE_FRAG,
                uniforms,
                transparent: true,
                depthWrite: false,
            });

            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            groupRef.current?.add(mesh);

            mediasRef.current.push({ mesh, uniforms, domEl: figure, extra: 0 });
        });

        // Animate in
        mediasRef.current.forEach(({ uniforms }) => {
            gsap.fromTo(uniforms.uAlpha, { value: 0 }, { value: 1, duration: 1, ease: 'expo.inOut' });
        });
    }, [isPreloaded]);

    useFrame(() => {
        const viewport = getViewport(camera as THREE.PerspectiveCamera, size);
        const ARC_EXTRA = 60; // pixels — matches Floema's `extra = 60`

        mediasRef.current.forEach(({ mesh, domEl }) => {
            const rect = domEl.getBoundingClientRect();

            const w = (rect.width / size.width) * viewport.width;
            const h = (rect.height / size.height) * viewport.height;
            mesh.scale.set(w, h, 1);

            const x = ((rect.left + rect.width / 2) / size.width) * viewport.width - viewport.width / 2;
            const y = ((rect.top + rect.height / 2) / size.height) * viewport.height - viewport.height / 2;

            mesh.position.x = x;

            // Arc — cosine bow matching Floema's About/Media.js updateY()
            const arc = Math.cos((x / viewport.width) * Math.PI * 0.1) * ARC_EXTRA - ARC_EXTRA;
            mesh.position.y = -y + (arc / size.height) * viewport.height;

            // Z-rotation based on X position
            mesh.rotation.z = (x / viewport.width) * Math.PI * 0.2;
        });
    });

    return <group ref={groupRef} />;
}

function getViewport(camera: THREE.PerspectiveCamera, size: { width: number; height: number }) {
    const fov = camera.fov * (Math.PI / 180);
    const h = 2 * Math.tan(fov / 2) * camera.position.z;
    return { width: h * (size.width / size.height), height: h };
}

const PLANE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;

const PLANE_FRAG = /* glsl */ `
  uniform sampler2D tMap;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(tMap, vUv);
    gl_FragColor = vec4(color.rgb, uAlpha);
  }
`;
```

---

## 11. Detail Overlay

The product detail panel sits on top of all pages (z-index: 10, always in the DOM, `autoAlpha: 0` by default). When a collection card is clicked, the WebGL mesh morphs into the detail view and the panel fades in.

### `src/components/ui/DetailPanel.tsx`

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function DetailPanel() {
    const panelRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        // Initially hidden
        gsap.set(panelRef.current, { autoAlpha: 0 });
    });

    return (
        <article ref={panelRef} className="detail" style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
            <div className="detail__wrapper">
                {/* This figure is the DOM anchor for the WebGL transition mesh */}
                <figure className="detail__media">
                    <img
                        className="detail__media__image"
                        alt=""
                        style={{
                            display: 'block',
                            width: '35rem',
                            height: '50rem',
                            visibility: 'hidden', // WebGL renders here
                        }}
                    />
                </figure>

                <div className="detail__information">
                    <h1 className="detail__title" data-animation="paragraph">
                        Product Title
                    </h1>
                    <div className="detail__description" data-animation="paragraph">
                        <p>Product description text.</p>
                    </div>
                    <a href="#" className="detail__link" data-animation="link" target="_blank">
                        Shop Now
                    </a>
                </div>
            </div>

            <button className="detail__button" style={{ pointerEvents: 'auto' }}>
                Close
            </button>
        </article>
    );
}
```

---

## 12. DOM Animations (Shared)

### Paragraph reveal (IntersectionObserver + GSAP)

Port of `Paragraph.js` — splits text into lines, reveals on scroll enter.

```tsx
'use client';

import { useRef, useLayoutEffect } from 'react';
import SplitType from 'split-type';
import gsap from 'gsap';

const EASE_CSS = 'cubic-bezier(0.19, 1, 0.22, 1)';

interface Props {
    children: React.ReactNode;
}

export default function AnimatedParagraph({ children }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!ref.current) return;

        const targets = ref.current.querySelectorAll<HTMLElement>('h1,h2,h3,p');
        const allLines: HTMLElement[] = [];

        // Double-split: word → char level (allows line grouping)
        targets.forEach((el) => {
            const split = new SplitType(el, { types: 'lines,words' });
            allLines.push(...(split.lines ?? []));
        });

        // Hide all lines initially
        gsap.set(allLines, { yPercent: 100, overflow: 'hidden' });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const lineEls = entry.target.querySelectorAll<HTMLElement>('.line');

                    gsap.to(lineEls, {
                        yPercent: 0,
                        duration: 1.5,
                        stagger: 0.1,
                        ease: 'expo.out',
                    });

                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.1 },
        );

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, []);

    return <div ref={ref}>{children}</div>;
}
```

### Button hover animation

Port of `Button.js` — draws an SVG path stroke around a button on hover.

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';

interface Props {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
}

export default function AnimatedButton({ children, href, onClick }: Props) {
    const pathRef = useRef<SVGPathElement>(null);

    const handleEnter = () => {
        if (!pathRef.current) return;
        const length = pathRef.current.getTotalLength();

        gsap.fromTo(pathRef.current, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 0.8, ease: 'expo.inOut' });
    };

    const handleLeave = () => {
        if (!pathRef.current) return;
        const length = pathRef.current.getTotalLength();

        gsap.to(pathRef.current, {
            strokeDashoffset: -length,
            duration: 0.6,
            ease: 'expo.inOut',
        });
    };

    const Tag = href ? 'a' : 'button';

    return (
        <Tag href={href} onClick={onClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            {children}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 288 60" xmlns="http://www.w3.org/2000/svg">
                <path
                    ref={pathRef}
                    fill="none"
                    stroke="currentColor"
                    d="M144,0.5c79.25,0,143.5,13.21,143.5,29.5S223.25,59.5,144,59.5S0.5,46.29,0.5,30S64.75,0.5,144,0.5z"
                    style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                />
            </svg>
        </Tag>
    );
}
```

### Link underline animation

Port of `Link.js` — scrubbable underline drawn on hover.

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';

export default function AnimatedLink({ children, href }: { children: React.ReactNode; href: string }) {
    const lineRef = useRef<HTMLSpanElement>(null);

    const animIn = () => gsap.to(lineRef.current, { scaleX: 1, duration: 0.6, ease: 'expo.inOut', transformOrigin: 'left' });
    const animOut = () => gsap.to(lineRef.current, { scaleX: 0, duration: 0.4, ease: 'expo.inOut', transformOrigin: 'right' });

    return (
        <a href={href} onMouseEnter={animIn} onMouseLeave={animOut} style={{ position: 'relative', display: 'inline-block' }}>
            {children}
            <span
                ref={lineRef}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'currentColor',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                }}
            />
        </a>
    );
}
```

### Parallax on scroll

Port of `Parallax.js` — element moves at a fraction of scroll speed.

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { lerp } from '@/utils/math';

interface Props {
    children: React.ReactNode;
    speed?: number; // 0.1 = slow, 1 = normal, 2 = fast
}

export default function Parallax({ children, speed = 0.5 }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const currentY = useRef(0);
    const targetY = useRef(0);

    useEffect(() => {
        const unsubscribe = useAppStore.subscribe(
            (state) => state.scrollY,
            (scrollY) => {
                targetY.current = scrollY * speed;
            },
        );

        let rafId: number;
        function tick() {
            currentY.current = lerp(currentY.current, targetY.current, 0.1);
            if (ref.current) {
                ref.current.style.transform = `translate3d(0, ${-currentY.current}px, 0)`;
            }
            rafId = requestAnimationFrame(tick);
        }
        rafId = requestAnimationFrame(tick);

        return () => {
            unsubscribe();
            cancelAnimationFrame(rafId);
        };
    }, [speed]);

    return <div ref={ref}>{children}</div>;
}
```

---

## 13. Performance Rules

These are non-negotiable for a smooth 60fps experience:

### R3F

- **Never create new objects in `useFrame`** — no `new THREE.Vector3()`, no object literals. Cache everything in `useRef`.
- **Use `depthWrite: false`** on all transparent materials (images rendered as planes).
- **Single `<Canvas>` for the whole app** — mounting/unmounting Canvas recreates the WebGL context.
- **`dpr={Math.min(devicePixelRatio, 2)}`** — cap pixel ratio to 2.

### GSAP

- **Only animate `transform` and `opacity`** on DOM elements — these do not trigger layout.
- **Use `gsap.set()` before any `fromTo()`** on elements that start hidden, so there's no flash.
- **`useGSAP()`** from `@gsap/react` handles cleanup automatically. Use it instead of `useEffect` for GSAP code.
- **Kill timelines on cleanup**: `return () => tl.kill()` inside `useGSAP`.

### Textures

- Load all textures **once** in the Preloader; never reload on navigation.
- Set `generateMipmaps: false` on textures that are displayed at a single size.
- SVG textures: serve as rasterized images (PNG/JPG) if possible — SVG-to-WebGL texture rendering varies by browser.

### Scroll

- **One `rAF` for everything**: drive Lenis from `useFrame` so GSAP, Lenis, and R3F share a single animation frame.
- Store `scrollY` in Zustand only if needed for WebGL sync — prefer reading `lenis.scroll` directly in `useFrame` to avoid a React render on every scroll event.

```ts
// Preferred: read scroll in useFrame directly, no React re-render
useFrame(() => {
    const y = getLenis()?.scroll ?? 0;
    syncMeshPositions(y);
});
```

### CSS

- Gallery wrappers: `visibility: hidden` (not `display: none`) — elements must have layout for `getBoundingClientRect()` to return real values.
- Image elements inside galleries must have **explicit dimensions** (via `aspect-ratio` or fixed `width/height`) so their bounding rect is non-zero before `src` loads.
- Page wrappers: `position: fixed; inset: 0; overflow: hidden` — scroll is simulated via `transform: translate3d`, not native scroll.
