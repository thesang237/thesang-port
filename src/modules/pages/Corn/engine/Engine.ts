import * as THREE from 'three';

import { CHAPTERS, FOOTER, FOOTER_LINKS, HERO, KERNEL_FACTS, LAST, LIBRARY, TESTS, type WorldId } from '../data/story';
import { getUi, type HotspotId, setUi, type UiState } from '../store';

import { TitleText } from './text/TitleText';
import { Trail } from './text/Trail';
import { HeroWorld } from './worlds/HeroWorld';
import { KernelWorld } from './worlds/KernelWorld';
import { PlotsWorld } from './worlds/PlotsWorld';
import { ScienceWorld } from './worlds/ScienceWorld';
import { StalkWorld } from './worlds/StalkWorld';
import { clamp01, damp, type FrameCtx, smooth, type World } from './worlds/World';
import { type Assets, disposeAssets, loadAssets } from './assets';
import { Composite } from './Composite';
import { Scroller } from './Scroller';
import { Timeline } from './Timeline';

/** Render resolution cap: the scenes are soft and graded, 1.5 keeps the titles crisp enough. */
const MAX_DPR = 1.5;

/**
 * Title reveal timing (s). Pass 4 (Sang: "slower and more gentle"): about twice the recording's pace —
 * the outline traces over 2.4 s with a soft start and end, the fill eases in from 1.9 s over 1.6 s.
 */
const DRAW = { delay: 0.45, draw: 2.4, fillAt: 1.9, fill: 1.6 };
/** Gentle in-out (sine) for the outline trace and the fill. */
const gentle = (a: number, b: number, v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01((v - a) / (b - a)));
/** Titles fade out by this distance (in chapters) from their stop. Late enough that a wipe cuts
 * the outgoing title instead of fading it first (reference 29.6 s); blends fade it mid-way. */
const TITLE_OUT: [number, number] = [0.3, 0.6];
/** Body copy, CTA rings and nav labels show within this distance (stops) of their stop. */
const COPY_NEAR = 0.22;
/** Cap heights in reference px (1920 wide): hero 105, chapter titles 68, footer links 36. */
const CAP = { hero: 105, chapter: 68, link: 36 };
/** The footer list scrolls up this far (reference px) between its two stops (58 s → 61.7 s). */
const FOOTER_SCROLL = 380;

export type EngineOptions = { start?: number; skipIntro?: boolean };

type TitleSlot = {
    title: TitleText;
    /** Stop where it draws in; footer links stay up across both footer stops. */
    chapter: number;
    until: number;
    selector: string;
    cap: number;
    center: boolean;
    /** Footer links move with the list's scroll. */
    scrolls: boolean;
    anchor: HTMLElement | null;
    baseY: number;
    t: number;
    running: boolean;
    /** Deep-dive headlines: shown while this returns true (instead of by scroll distance). */
    mode?: (ui: UiState) => boolean;
    fade: number;
};

/** Seconds the tests picker waits before choosing the first condition itself (reference: 5 s). */
const PICK_AUTO = 5;

export class Engine {
    readonly renderer: THREE.WebGLRenderer;
    readonly scroller: Scroller;
    readonly timeline = new Timeline();
    /** Story position (chapters) and the current chapter's dwell (0..1), from the scroll steps. */
    private story = { pos: 0, dwell: 0 };
    private navArc: SVGCircleElement | null = null;
    private navP = -1;
    private assets!: Assets;
    private composite!: Composite;
    private worlds = new Map<WorldId, World>();
    private firstChapter = new Map<WorldId, number>();
    private titles: TitleSlot[] = [];
    private trail = new Trail();
    private overlayCam = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
    private raf = 0;
    private last = 0;
    private time = 0;
    private w = 1;
    private h = 1;
    private dpr = 1;
    private ptr = new THREE.Vector2();
    private ptrTarget = new THREE.Vector2();
    private ptrPx = new THREE.Vector2(-1e4, -1e4);
    private ptrActive = false;
    private blur = 0;
    private fade = 0;
    private introT = -1;
    private disposed = false;
    private ro: ResizeObserver;
    /** Eased weight of each deep-dive mode (0 closed → 1 open). */
    private hsW: Record<HotspotId, number> = { library: 0, tests: 0, kernel: 0 };
    private hsAny = 0;
    private pickT = 0;
    private dragging = false;

    constructor(
        private host: HTMLElement,
        private opts: EngineOptions = {},
    ) {
        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
        this.renderer.autoClear = false;
        host.appendChild(this.renderer.domElement);
        this.scroller = new Scroller(this.timeline.total, () => {});
        this.ro = new ResizeObserver(() => this.resize());
        CHAPTERS.forEach((c, i) => {
            if (!this.firstChapter.has(c.world)) this.firstChapter.set(c.world, i);
        });
    }

    async init() {
        this.assets = await loadAssets(this.renderer, (progress) => setUi({ progress }));
        if (this.disposed) return disposeAssets(this.assets);
        const a = this.assets;
        this.composite = new Composite(a.lut, a.noise);
        this.worlds.set('hero', new HeroWorld(a));
        this.worlds.set('science', new ScienceWorld(a));
        this.worlds.set('stalk', new StalkWorld(a));
        this.worlds.set('plots', new PlotsWorld(a));
        this.worlds.set('kernel', new KernelWorld(a));

        const slot = (lines: string[], world: WorldId, s: Partial<TitleSlot> & Pick<TitleSlot, 'chapter' | 'selector' | 'cap'>) => {
            const title = new TitleText(a.display, { lines, capPx: s.cap, align: s.center ? 'center' : 'left' }, this.trail);
            this.worlds.get(world)!.overlay.add(title.group);
            this.titles.push({ until: s.chapter, center: false, scrolls: false, anchor: null, baseY: 0, t: 0, running: false, fade: 0, title, ...s });
        };
        CHAPTERS.forEach((c, i) => {
            if (c.title.length) slot(c.title, c.world, { chapter: i, selector: `[data-gl-title="${i}"]`, cap: i === 0 ? CAP.hero : CAP.chapter, center: i === 0 });
        });
        FOOTER_LINKS.forEach((label, k) => slot([label], 'kernel', { chapter: FOOTER, until: LAST, selector: `[data-gl-link="${k}"]`, cap: CAP.link, center: true, scrolls: true }));
        // deep-dive headlines (drawn the same way, shown by mode instead of by scroll)
        const at = (id: HotspotId) => CHAPTERS.findIndex((c) => c.hotspot === id);
        slot(LIBRARY.title, 'science', { chapter: at('library'), selector: '[data-gl-hs="library"]', cap: CAP.chapter, mode: (u) => u.hotspot === 'library' });
        slot(TESTS.title, 'stalk', { chapter: at('tests'), selector: '[data-gl-hs="tests"]', cap: CAP.chapter, mode: (u) => u.hotspot === 'tests' && u.condition < 0 });
        TESTS.conditions.forEach((c, k) =>
            slot([c.label], 'stalk', { chapter: at('tests'), selector: `[data-gl-hs="cond-${k}"]`, cap: CAP.chapter, mode: (u) => u.hotspot === 'tests' && u.condition === k }),
        );
        KERNEL_FACTS.facts.forEach((f, k) =>
            slot([f.label], 'kernel', { chapter: at('kernel'), selector: `[data-gl-hs="fact-${k}"]`, cap: CAP.chapter, mode: (u) => u.hotspot === 'kernel' && u.fact === k }),
        );

        this.bind();
        this.ro.observe(this.host);
        this.resize();
        // compile every world once behind the loader so the first wipe does not hitch
        for (const w of this.worlds.values()) {
            this.renderer.compile(w.scene, w.camera);
            this.renderer.compile(w.fx, w.fxCamera);
        }
        // draw every world once off-screen: post passes compile and their targets allocate now,
        // not on the first wipe into them
        for (const id of this.worlds.keys()) {
            this.renderWorld(id, this.composite.b, this.firstChapter.get(id) ?? 0, 1 / 60, 0);
            this.renderWorld(id, this.composite.bMove, this.firstChapter.get(id) ?? 0, 1 / 60, 0);
        }

        const start = Math.min(LAST, Math.max(0, this.opts.start ?? 0));
        this.scroller.set(this.timeline.starts[start]);
        if (this.opts.skipIntro || start !== 0) {
            this.fade = 1;
            this.introT = 99;
            setUi({ started: true, heroReady: true });
            this.scroller.enabled = true;
        }
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.frame);
    }

    /** The loader hands over: fade the hero up from black, then draw the title. */
    startIntro() {
        if (this.introT >= 0) return;
        this.introT = 0;
        setUi({ started: true });
    }

    /** Debug / menu: jump the story. */
    goTo(chapter: number) {
        this.scroller.goTo(this.timeline.starts[Math.max(0, Math.min(LAST, chapter))]);
    }

    setMenu(open: boolean) {
        if (open) this.closeHotspot();
        setUi({ menuOpen: open });
        this.scroller.enabled = !open && getUi().heroReady;
    }

    /** Open a chapter's deep-dive (only from its own stop); scrolling pauses until it closes. */
    openHotspot(id: HotspotId) {
        const ui = getUi();
        if (ui.menuOpen || ui.hotspot === id) return;
        const at = CHAPTERS.findIndex((c) => c.hotspot === id);
        if (at < 0 || Math.abs(this.story.pos - at) > 0.3) return;
        this.scroller.goTo(Math.round(this.scroller.pos));
        this.scroller.enabled = false;
        this.pickT = 0;
        setUi({ hotspot: id, condition: -1, fact: 0 });
        if (id === 'kernel') (this.worlds.get('kernel') as KernelWorld).openFacts();
        requestAnimationFrame(() => this.measureTitles());
    }

    closeHotspot() {
        const ui = getUi();
        if (!ui.hotspot) return;
        if (ui.hotspot === 'tests') (this.worlds.get('stalk') as StalkWorld).setCondition(0);
        if (ui.hotspot === 'kernel') (this.worlds.get('kernel') as KernelWorld).closeFacts();
        setUi({ hotspot: null, condition: -1 });
        this.scroller.enabled = !ui.menuOpen && ui.heroReady;
    }

    /** Tests mode: 0–4 = wind, drought, disease, soil, density. */
    setCondition(k: number) {
        if (getUi().hotspot !== 'tests') return;
        setUi({ condition: k });
        (this.worlds.get('stalk') as StalkWorld).setCondition(k + 1);
        requestAnimationFrame(() => this.measureTitles());
    }

    /** Kernel mode: spin to a fact (0–2). */
    setFact(k: number) {
        (this.worlds.get('kernel') as KernelWorld).goToFact(k);
    }

    // ── input ───────────────────────────────────────────────────────────────────

    private onPointer = (e: PointerEvent) => {
        this.ptrActive = true;
        if (this.dragging) (this.worlds.get('kernel') as KernelWorld).dragMove(e.clientX);
        this.ptrPx.set(e.clientX, e.clientY);
        this.ptrTarget.set((e.clientX / this.w) * 2 - 1, -((e.clientY / this.h) * 2 - 1));
    };

    private onLeave = () => {
        this.ptrActive = false;
        this.ptrPx.set(-1e4, -1e4);
        this.trail.release();
    };

    /** Press & hold on a drawn title opens the big pointer field (the hold still). */
    private onDown = (e: PointerEvent) => {
        if (getUi().menuOpen) return;
        if (getUi().hotspot === 'kernel' && (e.target as HTMLElement | null)?.closest?.('button, a') == null) {
            this.dragging = true;
            (this.worlds.get('kernel') as KernelWorld).dragStart(e.clientX);
            return;
        }
        const over = this.titles.some((s) => s.title.alpha > 0.5 && s.title.fill > 0.99 && s.title.hits(e.clientX, e.clientY, 20));
        if (over) this.trail.press(e.clientX, e.clientY);
    };

    private onUp = () => {
        this.trail.release();
        if (this.dragging) (this.worlds.get('kernel') as KernelWorld).dragEnd();
        this.dragging = false;
    };

    private onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && getUi().hotspot) {
            this.closeHotspot();
            return;
        }
        if (getUi().hotspot) return;
        this.scroller.onKey(e);
    };

    private bind() {
        window.addEventListener('pointermove', this.onPointer, { passive: true });
        window.addEventListener('pointerdown', this.onDown);
        window.addEventListener('pointerup', this.onUp);
        window.addEventListener('pointercancel', this.onUp);
        document.addEventListener('pointerleave', this.onLeave);
        window.addEventListener('touchend', this.scroller.onTouchEnd, { passive: true });
        window.addEventListener('wheel', this.scroller.onWheel, { passive: false });
        window.addEventListener('keydown', this.onKey);
        window.addEventListener('touchstart', this.scroller.onTouchStart, { passive: true });
        window.addEventListener('touchmove', this.scroller.onTouchMove, { passive: true });
    }

    private unbind() {
        window.removeEventListener('pointermove', this.onPointer);
        window.removeEventListener('pointerdown', this.onDown);
        window.removeEventListener('pointerup', this.onUp);
        window.removeEventListener('pointercancel', this.onUp);
        document.removeEventListener('pointerleave', this.onLeave);
        window.removeEventListener('touchend', this.scroller.onTouchEnd);
        window.removeEventListener('wheel', this.scroller.onWheel);
        window.removeEventListener('keydown', this.onKey);
        window.removeEventListener('touchstart', this.scroller.onTouchStart);
        window.removeEventListener('touchmove', this.scroller.onTouchMove);
    }

    // ── layout ──────────────────────────────────────────────────────────────────

    private resize() {
        const w = this.host.clientWidth;
        const h = this.host.clientHeight;
        if (!w || !h) return;
        this.w = w;
        this.h = h;
        this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(w, h);
        this.composite.setSize(w, h, this.dpr);
        this.overlayCam.right = w;
        this.overlayCam.bottom = h;
        this.overlayCam.updateProjectionMatrix();
        this.worlds.forEach((world) => world.resize(w, h));
        this.measureTitles();
    }

    /**
     * GL titles sit exactly on their DOM headings (transparent text in the traced face, same metrics):
     * the DOM does the layout, the GL draws. Cap top = line top + 0.169 cap for this font's
     * ascent/descent (900/250 per 1000, cap 700) at line-height 1.41 cap.
     */
    measureTitles() {
        const u = this.w / 1920;
        const list = document.querySelector<HTMLElement>('[data-footer-list]');
        if (list) list.style.transform = 'none';
        for (const slot of this.titles) {
            slot.anchor ??= document.querySelector<HTMLElement>(slot.selector);
            const cap = slot.cap * u;
            slot.title.build(cap, this.dpr);
            if (!slot.anchor) continue;
            const r = slot.anchor.getBoundingClientRect();
            const x = slot.center ? r.left + (r.width - slot.title.layout.width) / 2 : r.left;
            slot.baseY = r.top + 0.169 * cap;
            slot.title.setOrigin(x, slot.baseY);
        }
        this.footerShift = -1;
    }

    // ── frame ───────────────────────────────────────────────────────────────────

    private frame = (now: number) => {
        this.raf = requestAnimationFrame(this.frame);
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        this.time += dt;
        const t0 = performance.now();
        this.tick(dt);
        this.tickMs = performance.now() - t0;
    };

    /** CPU time of the last frame (debug / perf scripts). */
    private tickMs = 0;
    /** Debug: skip drawing one world (perf isolation). */
    private skip: WorldId | null = null;

    private tick(dt: number) {
        const ui = getUi();
        this.scroller.update(dt);
        this.story = this.timeline.toStory(this.scroller.pos);
        const pos = this.story.pos;
        this.updateNav();
        const nearest = Math.round(pos) > LAST ? 0 : Math.round(pos);
        if (nearest !== ui.nearest) setUi({ nearest });
        // copy for a stop shows while the scroll is close to it (not only once settled)
        const chapter = Math.abs(pos - Math.round(pos)) < COPY_NEAR ? nearest : -1;
        if (chapter !== ui.chapter) setUi({ chapter });

        this.ptr.x = damp(this.ptr.x, this.ptrTarget.x, 3, dt);
        this.ptr.y = damp(this.ptr.y, this.ptrTarget.y, 3, dt);
        this.blur = damp(this.blur, ui.menuOpen ? 1 : 0, 7, dt);
        this.updateHotspots(ui, dt);
        this.runIntro(dt);
        this.updateTitles(dt, pos);

        // which worlds are on screen, and how they meet
        const i0 = Math.min(Math.floor(pos), LAST + 1);
        const f = pos - i0;
        const worldAt = (i: number) => CHAPTERS[i > LAST ? 0 : i].world;
        const A = worldAt(i0);
        const B = f > 1e-4 ? worldAt(i0 + 1) : A;
        let mode = 0;
        let p = 0;
        if (A !== B) {
            mode = CHAPTERS[i0 + 1 > LAST ? 0 : i0 + 1].enter === 'wipe' ? 1 : 2;
            p = mode === 1 ? smooth(0.12, 0.88, f) : smooth(0, 1, f);
        }
        this.scrollFooter(pos);

        // the dwell belongs to the chapter at floor(pos): the outgoing world keeps it through a wipe;
        // a blend inside one world eases it back while the world's own scroll moves take over
        const dwell = this.story.dwell * (mode === 0 && f > 1e-4 ? 1 - smooth(0, 1, f) : 1);
        this.renderWorld(A, mode ? this.composite.aMove : this.composite.a, pos, dt, dwell);
        if (mode) this.renderWorld(B, this.composite.bMove, pos, dt, 0);
        this.composite.render(this.renderer, mode, p, this.blur, this.fade);
    }

    private renderWorld(id: WorldId, target: THREE.WebGLRenderTarget, pos: number, dt: number, dwell: number) {
        const world = this.worlds.get(id)!;
        let local = pos - this.firstChapter.get(id)!;
        if (id === 'hero' && pos > LAST) local = pos - (LAST + 1);
        const ctx: FrameCtx = { time: this.time, dt, ptr: this.ptr, local, dwell, w: this.w, h: this.h, dpr: this.dpr, ptrActive: this.ptrActive };
        world.update(ctx);
        this.renderer.setRenderTarget(target);
        if (this.skip === id) {
            this.renderer.setClearColor(0x000000, 1);
            this.renderer.clear();
            return;
        }
        if (!world.render?.(this.renderer, target)) {
            this.renderer.setRenderTarget(target);
            this.renderer.setClearColor(world.clear, 1);
            this.renderer.clear();
            this.renderer.render(world.scene, world.camera);
        }
        this.renderer.setRenderTarget(target);
        this.renderer.clearDepth();
        this.renderer.render(world.fx, world.fxCamera);
        this.renderer.clearDepth();
        this.renderer.render(world.overlay, this.overlayCam);
    }

    private updateHotspots(ui: UiState, dt: number) {
        for (const id of ['library', 'tests', 'kernel'] as HotspotId[]) this.hsW[id] = damp(this.hsW[id], ui.hotspot === id ? 1 : 0, 3.2, dt);
        this.hsAny = Math.max(this.hsW.library, this.hsW.tests, this.hsW.kernel);
        (this.worlds.get('science') as ScienceWorld).hotspot = this.hsW.library;
        (this.worlds.get('stalk') as StalkWorld).hotspot = this.hsW.tests;
        const kernel = this.worlds.get('kernel') as KernelWorld;
        kernel.hotspot = this.hsW.kernel;
        if (ui.hotspot === 'kernel' && kernel.fact !== ui.fact) setUi({ fact: kernel.fact });
        // the picker chooses the first condition itself after a while (reference hotspotDelay)
        if (ui.hotspot === 'tests' && ui.condition < 0) {
            this.pickT += dt;
            if (this.pickT > PICK_AUTO) this.setCondition(0);
        }
    }

    private runIntro(dt: number) {
        if (this.introT < 0 || this.introT > 90) return;
        this.introT += dt;
        // reference: hero fades up from black over ≈1.2 s, title starts drawing ≈1.2 s later
        this.fade = smooth(0, 1.4, this.introT);
        (this.worlds.get('hero') as HeroWorld).intro = clamp01(this.introT / 3);
        const hero = this.titles[0];
        if (this.introT > 0.8 && !hero.running) {
            hero.running = true;
            hero.t = 0;
        }
        if (this.introT > 3.9 && !getUi().heroReady) {
            setUi({ heroReady: true });
            this.scroller.enabled = !getUi().menuOpen;
        }
        if (this.introT > 5) this.introT = 99;
    }

    private footerShift = -1;

    /** Side nav: the current section's ring fills with the scroll through its snaps (DOM, no React). */
    private updateNav() {
        const sec = this.timeline.section(Math.min(this.scroller.pos, this.timeline.total - 1e-6));
        const p = sec.index < 0 ? 0 : sec.progress;
        if (Math.abs(p - this.navP) < 0.0005) return;
        this.navP = p;
        this.navArc ??= document.querySelector<SVGCircleElement>('[data-nav-arc]');
        this.navArc?.setAttribute('stroke-dasharray', `${(p * 100).toFixed(2)} 100`);
    }

    /** The footer list (DOM links + their GL titles) scrolls up between the two footer stops. */
    private scrollFooter(pos: number) {
        const shift = smooth(FOOTER, LAST, pos) * FOOTER_SCROLL * (this.w / 1920) + Math.max(0, pos - LAST) * this.h * 0.22;
        if (Math.abs(shift - this.footerShift) < 0.01) return;
        this.footerShift = shift;
        const list = document.querySelector<HTMLElement>('[data-footer-list]');
        if (list) list.style.transform = `translate3d(0, ${-shift}px, 0)`;
        for (const slot of this.titles) if (slot.scrolls) slot.title.setOrigin(slot.title.origin.x, slot.baseY - shift);
    }

    private updateTitles(dt: number, pos: number) {
        const loopPos = pos > LAST ? pos - (LAST + 1) : pos;
        const menuOpen = getUi().menuOpen;
        const ui = getUi();
        for (const slot of this.titles) {
            const t = slot.title;
            if (slot.mode) {
                // deep-dive headline: in while its mode is on, drawn again each time it comes back
                const on = slot.mode(ui) && !menuOpen;
                slot.fade = damp(slot.fade, on ? 1 : 0, on ? 2.2 : 3.2, dt);
                if (on && !slot.running) {
                    slot.running = true;
                    slot.t = -0.35;
                }
                if (slot.running) slot.t += dt;
                if (!on && slot.fade < 0.01 && slot.running) slot.running = false;
                const k = slot.t - DRAW.delay;
                t.draw = slot.running ? gentle(0, DRAW.draw, k) : 0;
                t.fill = slot.running ? gentle(DRAW.fillAt, DRAW.fillAt + DRAW.fill, k) : 0;
                t.alpha = slot.fade * (1 - this.blur);
                t.update(this.time);
                if (on && t.fill > 0.9 && t.hits(this.ptrPx.x, this.ptrPx.y, 10)) this.trail.push(this.ptrPx.x, this.ptrPx.y);
                continue;
            }
            // distance from the stop range [chapter, until]; the hero also counts from the loop stop
            const range = pos < slot.chapter ? slot.chapter - pos : Math.max(0, pos - slot.until);
            const d = Math.min(range, slot.chapter === 0 ? Math.abs(loopPos) : Infinity);
            const vis = (1 - smooth(TITLE_OUT[0], TITLE_OUT[1], d)) * (1 - this.hsAny);
            // start drawing when the stop is reached (the hero waits for the intro)
            const canStart = (slot.chapter !== 0 || this.introT > 90 || slot.running) && !menuOpen && !ui.hotspot;
            // start tracing once the move into the stop is ≈ 70 % done (the slow trace then lands with it)
            if (!slot.running && d < 0.28 && canStart) {
                slot.running = true;
                slot.t = 0;
            }
            if (slot.running) slot.t += dt;
            // the menu hides titles; they draw in again when it closes (reference 26–28 s)
            if ((vis <= 0.001 || (menuOpen && this.blur > 0.95) || (ui.hotspot && this.hsAny > 0.98)) && slot.running) {
                slot.running = false;
                slot.t = 0;
            }
            const k = slot.t - DRAW.delay;
            t.draw = slot.running ? gentle(0, DRAW.draw, k) : 0;
            t.fill = slot.running ? gentle(DRAW.fillAt, DRAW.fillAt + DRAW.fill, k) : 0;
            t.alpha = vis * (1 - this.blur);
            t.update(this.time);
            if (vis > 0.5 && t.fill > 0.9 && !menuOpen && t.hits(this.ptrPx.x, this.ptrPx.y, 10)) {
                this.trail.push(this.ptrPx.x, this.ptrPx.y);
            }
        }
        // the resting field: on while the pointer is over any drawn title (moving or not)
        const over = !menuOpen && this.titles.some((sl) => sl.title.alpha > 0.5 && sl.title.fill > 0.9 && sl.title.hits(this.ptrPx.x, this.ptrPx.y, 10));
        this.trail.rest(this.ptrPx.x, this.ptrPx.y, over);
        this.trail.update(dt);
    }

    /** Debug helpers for the screenshot scripts. */
    debug() {
        return {
            go: (c: number) => this.scroller.set(this.timeline.starts[c]),
            /** Story position (chapters); `dwell` 0..1 inside the chapter. */
            pos: (p: number, dwell = 0) => {
                this.scroller.pos = this.scroller.target = this.timeline.fromStory(p, dwell);
                this.scroller.vel = 0;
            },
            step: (st: number) => {
                this.scroller.pos = this.scroller.target = st;
                this.scroller.vel = 0;
            },
            state: () => ({ pos: this.story.pos, dwell: this.story.dwell, step: this.scroller.pos, target: this.scroller.target, ui: getUi(), tickMs: this.tickMs }),
            skip: (id: WorldId | null) => (this.skip = id),
            world: (id: WorldId) => this.worlds.get(id),
            renderer: this.renderer,
            hold: () => this.trail.hold.toArray(),
            hero: HERO,
        };
    }

    dispose() {
        this.disposed = true;
        cancelAnimationFrame(this.raf);
        this.unbind();
        this.ro.disconnect();
        this.titles.forEach((s) => s.title.dispose());
        this.worlds.forEach((w) => w.dispose());
        this.composite?.dispose();
        if (this.assets) disposeAssets(this.assets);
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
