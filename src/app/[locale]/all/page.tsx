'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Tag = '3D' | 'Art' | 'Scroll' | 'GSAP' | 'UI' | 'Guide' | 'Portfolio' | 'Canvas';

type PageEntry = {
    route: string;
    title: string;
    desc: string;
    tags: Tag[];
};

type Group = {
    label: string;
    color: string; // Tailwind text color class
    border: string; // Tailwind border color class
    bg: string; // Tailwind bg color class
    entries: PageEntry[];
};

const GROUPS: Group[] = [
    {
        label: 'Portfolio Recreations',
        color: 'text-rose-400',
        border: 'border-rose-500/20',
        bg: 'bg-rose-500/5',
        entries: [
            { route: '/', title: 'Home', desc: 'Landing page', tags: ['UI'] },
            { route: '/floema', title: 'Floema — Home', desc: 'Floema design studio site recreation', tags: ['Portfolio', 'Scroll'] },
            { route: '/floema/about', title: 'Floema — About', desc: 'About page of the Floema recreation', tags: ['Portfolio'] },
            { route: '/floema/collections', title: 'Floema — Collections', desc: 'Collections page of the Floema recreation', tags: ['Portfolio'] },
            { route: '/truus', title: 'Truus', desc: 'Truus portfolio site recreation', tags: ['Portfolio'] },
            { route: '/emil', title: 'Emil', desc: 'Emil Kowalski portfolio site recreation', tags: ['Portfolio', 'Scroll'] },
        ],
    },
    {
        label: '3D & WebGL',
        color: 'text-indigo-400',
        border: 'border-indigo-500/20',
        bg: 'bg-indigo-500/5',
        entries: [
            { route: '/3d-map', title: '3D Interactive Map', desc: 'Orthographic 3D map of Plateforme 10, Lausanne — baked textures, OrbitControls, POI labels', tags: ['3D'] },
            { route: '/omma-3d-cubes', title: 'Omma 3D Cubes', desc: 'Noise-driven InstancedMesh cube grid — 9 noise types, orthographic/perspective toggle', tags: ['3D'] },
            {
                route: '/omma-3d-cubes/learn',
                title: 'Omma 3D Cubes — Guide',
                desc: 'Step-by-step: Perlin noise, instanced rendering, camera switch, control panel without re-renders',
                tags: ['3D', 'Guide'],
            },
            { route: '/r3f', title: 'React Three Fiber Basics', desc: 'R3F fundamentals: materials, lighting, shaders, physics in one page', tags: ['3D'] },
            { route: '/r3f-bulge', title: 'Bulge Text Effect', desc: 'Cursor-driven vertex shader bulge/wave distortion on a text mesh', tags: ['3D'] },
            { route: '/r3f-bulge/learn', title: 'Bulge Effect — Guide', desc: 'Custom GLSL vertex shader, uniforms, cursor tracking in R3F', tags: ['3D', 'Guide'] },
            { route: '/r3f-cards', title: '3D Card Carousel', desc: 'Scroll-driven infinite 3D card carousel — curved layout, fragment shader distortion', tags: ['3D', 'Scroll'] },
            { route: '/r3f-cards/learn', title: '3D Cards — Guide', desc: 'Carousel geometry, curve shader math, infinite scroll in R3F', tags: ['3D', 'Guide'] },
            { route: '/r3f-experimental', title: 'R3F Experiments Hub', desc: 'Overview and architecture guide for 6 carousel experiments', tags: ['3D', 'Guide'] },
            { route: '/r3f-experimental/1', title: 'Experiment 1 — Parallax Trio', desc: 'Three vertical carousels with differential scroll speeds creating depth', tags: ['3D'] },
            { route: '/r3f-experimental/2', title: 'Experiment 2 — Mixed Aspect Ratios', desc: 'Wide flanking carousels with opposing curve directions; portrait center', tags: ['3D'] },
            { route: '/r3f-experimental/3', title: 'Experiment 3 — Tilted Five-Column', desc: 'Camera rotated 36deg, five columns with curveStrength gradient, fan-spread feel', tags: ['3D'] },
            { route: '/r3f-experimental/4', title: 'Experiment 4 — Overlapping Clusters', desc: 'Six tiny carousels at same origin, individual Z-rotations, dense interference', tags: ['3D'] },
            { route: '/r3f-experimental/5', title: 'Experiment 5 — Horizontal Stacks', desc: 'Three horizontal carousels stacked vertically; axis-swapped shader', tags: ['3D'] },
            { route: '/r3f-experimental/6', title: 'Experiment 6 — Rotated X Pattern', desc: 'Two groups rotated 45deg, extreme curveStrength=7.5, X-shaped composition', tags: ['3D'] },
            { route: '/r3f-kinetic/paper', title: 'Kinetic Paper', desc: 'R3F kinetic paper folding animation', tags: ['3D'] },
            { route: '/r3f-kinetic/spiral', title: 'Kinetic Spiral', desc: 'R3F spiral kinetic animation', tags: ['3D'] },
            { route: '/r3f-kinetic/tower', title: 'Kinetic Tower', desc: 'R3F kinetic tower animation', tags: ['3D'] },
        ],
    },
    {
        label: 'Generative Art',
        color: 'text-amber-400',
        border: 'border-amber-500/20',
        bg: 'bg-amber-500/5',
        entries: [
            { route: '/art-cantera', title: 'Cantera', desc: 'Generative voxel city — hash-seeded PRNG, 3D block terrain, birds, people, 6 color palettes', tags: ['Art', 'Canvas'] },
            {
                route: '/art-cantera/learn',
                title: 'Cantera — Guide',
                desc: '9-step deep dive: Art Blocks PRNG, simplex noise, erosion, voxelisation, oblique projection, ray marching',
                tags: ['Art', 'Guide', 'Canvas'],
            },
            { route: '/art-sagebrush', title: 'Eucalyptus & Sagebrush', desc: 'Generative landscape — Perlin noise terrain, hydraulic erosion, physics pen, 6 palettes', tags: ['Art', 'Canvas'] },
            { route: '/art-sagebrush/learn', title: 'Sagebrush — Guide', desc: '10-step guide: seeded RNG, fBm, domain warping, erosion, lighting, pen simulation', tags: ['Art', 'Guide', 'Canvas'] },
            { route: '/art-solace', title: 'Solace', desc: 'Generative desert dunes — dot-matrix rendering, 8000 dots/frame, seeded Perlin noise, 18 colour palettes', tags: ['Art', 'Canvas'] },
            {
                route: '/art-solace/learn',
                title: 'Solace — Guide',
                desc: '10-step breakdown: cyrb128+sfc32 PRNG, Box-Muller Gaussian, Perlin noise, diagonal boundary maps, warp transforms, progressive dot rendering',
                tags: ['Art', 'Guide', 'Canvas'],
            },
            { route: '/dithering', title: 'Dithering', desc: 'Generative dithering art using Canvas 2D', tags: ['Art', 'Canvas'] },
            { route: '/dithering/learn', title: 'Dithering — Guide', desc: 'Dithering algorithms explained with interactive demos', tags: ['Art', 'Guide', 'Canvas'] },
            {
                route: '/grid-hover',
                title: 'Grid Item Hover Effect',
                desc: '3 direction-aware hover effects on image cards — GSAP enter/leave animations, char-by-char reveals, clip-path boxes',
                tags: ['Art', 'GSAP'],
            },
            {
                route: '/grid-hover/learn',
                title: 'Grid Hover — Guide',
                desc: '10-step breakdown: useGSAP+contextSafe, timeline labels, function values, direction detection, stagger, asymmetric scale, kill pattern',
                tags: ['GSAP', 'Guide'],
            },
            {
                route: '/codrops-page-transition',
                title: 'Codrops Page Transition',
                desc: 'Async page transition — clip-path reveal on next page, scale/y exit on current, SplitText char/line enter animations',
                tags: ['Art', 'GSAP'],
            },
            {
                route: '/codrops-page-transition/alternative-page',
                title: 'Codrops — Alternative Page',
                desc: 'Second page of the Codrops page transition demo (WV.663)',
                tags: ['Art', 'GSAP'],
            },
        ],
    },
    {
        label: 'Animation & Scroll',
        color: 'text-emerald-400',
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/5',
        entries: [
            { route: '/gsap', title: 'GSAP', desc: 'GSAP animation techniques: timelines, scroll-driven, compositor-friendly transforms, React integration', tags: ['GSAP'] },
            { route: '/scroll/1', title: 'Scroll — 1', desc: 'Scroll animation example 1', tags: ['Scroll', 'GSAP'] },
            { route: '/scroll/2', title: 'Scroll — 2', desc: 'Scroll animation example 2', tags: ['Scroll', 'GSAP'] },
            { route: '/scroll/3', title: 'Scroll — 3', desc: 'Scroll animation example 3', tags: ['Scroll', 'GSAP'] },
            { route: '/scroll/4', title: 'Scroll — 4', desc: 'Scroll animation example 4', tags: ['Scroll', 'GSAP'] },
            { route: '/scroll/component', title: 'Scroll Component', desc: 'Reusable scroll animation component demo', tags: ['Scroll', 'UI'] },
            { route: '/scroll/learn', title: 'Scroll — Guide', desc: 'Scroll animation techniques with GSAP ScrollTrigger', tags: ['Scroll', 'Guide'] },
            { route: '/sticky-scroll', title: 'Sticky Scroll', desc: 'Sticky scroll pinning effect with content transitions', tags: ['Scroll', 'GSAP'] },
            { route: '/sticky-scroll/learn', title: 'Sticky Scroll — Guide', desc: 'How sticky scroll pinning works under the hood', tags: ['Scroll', 'Guide'] },
        ],
    },
    {
        label: 'UI & Patterns',
        color: 'text-sky-400',
        border: 'border-sky-500/20',
        bg: 'bg-sky-500/5',
        entries: [
            { route: '/component', title: 'Components', desc: 'Animation and UI component showcase — fade, chars, lines, words animations', tags: ['UI'] },
            { route: '/responsive', title: 'Responsive', desc: 'Responsive design patterns and layout techniques', tags: ['UI'] },
            { route: '/typescript', title: 'TypeScript', desc: 'TypeScript patterns: generics, discriminated unions, utility types in a Next.js context', tags: ['UI'] },
            { route: '/roadmap', title: 'Roadmap', desc: 'Project roadmap and planned features', tags: ['UI'] },
            { route: '/sooner', title: 'Ship it Sooner', desc: 'Performance and best-practice patterns: what to do (and avoid) for faster shipping', tags: ['UI', 'Guide'] },
        ],
    },
    {
        label: 'Jhey Demos',
        color: 'text-fuchsia-400',
        border: 'border-fuchsia-500/20',
        bg: 'bg-fuchsia-500/5',
        entries: [
            { route: '/jhey/dynamic-toggle', title: 'Dynamic Toggle', desc: 'CSS-only premium tier toggle — sliding pill indicator, nested radio states, no JS animations', tags: ['UI'] },
            { route: '/jhey/hover-disclosures', title: 'Hover Disclosures', desc: 'Expandable card list — pointer/focus-driven grid-template-columns transition with image reveal', tags: ['UI'] },
            { route: '/jhey/svg-slider', title: 'SVG Slider', desc: 'Custom range slider with SVG-based track and thumb styling', tags: ['UI'] },
            {
                route: '/jhey/sticky-scroll',
                title: 'Sticky Scroll',
                desc: 'CSS scroll-driven window effect — subgrid stacking, position:sticky, animation-timeline, 3D explode view',
                tags: ['UI', 'Scroll'],
            },
            { route: '/jhey/context-aware', title: 'Context-Aware Icons', desc: 'App icon cards with pointer-tracking blurred background glow — container queries, SVG/CSS blur toggle', tags: ['UI'] },
            { route: '/jhey/frosted-border', title: 'Frosted Border', desc: 'Draggable sticky product card with frosted glass backdrop-filter border over a scrollable image grid', tags: ['UI'] },
            {
                route: '/jhey/detail-summary',
                title: 'Detail Summary',
                desc: 'Native details/summary disclosure with smooth height transitions, parallax image reveal, and bounce easing',
                tags: ['UI'],
            },
            {
                route: '/jhey/keyboard',
                title: 'Keyboard',
                desc: 'Interactive 3-key keypad with press animation, keyboard bindings, explode-view, and per-key hue/brightness controls via Leva',
                tags: ['UI'],
            },
        ],
    },
];

const ALL_TAGS: Tag[] = ['3D', 'Art', 'Scroll', 'GSAP', 'UI', 'Guide', 'Portfolio', 'Canvas'];

const TAG_STYLES: Record<Tag, string> = {
    '3D': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Art: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
    Scroll: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    GSAP: 'bg-green-500/10  text-green-400  border-green-500/20',
    UI: 'bg-sky-500/10    text-sky-400    border-sky-500/20',
    Guide: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Portfolio: 'bg-rose-500/10   text-rose-400   border-rose-500/20',
    Canvas: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

// ─── UI primitives ────────────────────────────────────────────────────────────

function TagBadge({ tag, small }: { tag: Tag; small?: boolean }) {
    return (
        <span
            className={`inline-flex items-center border rounded font-mono shrink-0 ${TAG_STYLES[tag]} ${small ? 'px-1.5 py-px' : 'px-2 py-0.5'}`}
            style={{ fontSize: small ? '9px' : '10px', letterSpacing: '0.08em' }}
        >
            {tag}
        </span>
    );
}

function RouteChip({ route }: { route: string }) {
    return (
        <span className="font-mono text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 rounded px-2 py-0.5 whitespace-nowrap" style={{ fontSize: '12px' }}>
            {route === '/' ? '/' : route}
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllPagesPage() {
    const [query, setQuery] = useState('');
    const [activeTag, setActiveTag] = useState<Tag | null>(null);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return GROUPS.map((group) => ({
            ...group,
            entries: group.entries.filter((e) => {
                const matchesTag = !activeTag || e.tags.includes(activeTag);
                const matchesQuery =
                    !q || e.route.toLowerCase().includes(q) || e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q));
                return matchesTag && matchesQuery;
            }),
        })).filter((g) => g.entries.length > 0);
    }, [query, activeTag]);

    const totalVisible = filtered.reduce((sum, g) => sum + g.entries.length, 0);
    const totalAll = GROUPS.reduce((sum, g) => sum + g.entries.length, 0);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <div className="border-b border-zinc-800/70 sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black tracking-tight text-zinc-100" style={{ fontSize: '18px' }}>
                            All pages
                        </span>
                        <span className="font-mono text-zinc-600" style={{ fontSize: '12px' }}>
                            {totalVisible === totalAll ? totalAll : `${totalVisible} / ${totalAll}`}
                        </span>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-xs sm:max-w-sm">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search routes, titles, tags…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
                            style={{ fontSize: '13px' }}
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tag filters */}
                <div className="max-w-5xl mx-auto px-5 pb-3 flex flex-wrap gap-1.5">
                    {ALL_TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                            className={`inline-flex items-center border rounded font-mono transition-all px-2 py-0.5 ${activeTag === tag ? TAG_STYLES[tag] : 'bg-transparent border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'}`}
                            style={{ fontSize: '10px', letterSpacing: '0.08em' }}
                        >
                            {tag}
                        </button>
                    ))}
                    {(query || activeTag) && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setActiveTag(null);
                            }}
                            className="inline-flex items-center gap-1 border border-zinc-700/50 rounded font-mono text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all px-2 py-0.5"
                            style={{ fontSize: '10px' }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-5 py-8 space-y-10">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600" style={{ fontSize: '14px' }}>
                        No pages match <em className="text-zinc-500">&ldquo;{query}&rdquo;</em>
                    </div>
                ) : (
                    filtered.map((group) => (
                        <section key={group.label}>
                            {/* Group header */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`font-bold tracking-tight ${group.color}`} style={{ fontSize: '13px' }}>
                                    {group.label}
                                </span>
                                <span className="font-mono text-zinc-700" style={{ fontSize: '11px' }}>
                                    {group.entries.length}
                                </span>
                                <div className="flex-1 h-px bg-zinc-800" />
                            </div>

                            {/* Entries */}
                            <div className="border border-zinc-800/80 rounded-xl overflow-hidden divide-y divide-zinc-800/60">
                                {group.entries.map((entry, i) => (
                                    <Link
                                        key={entry.route + i}
                                        href={entry.route}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`group flex items-start sm:items-center gap-3 sm:gap-4 px-4 py-3.5 transition-colors hover:bg-zinc-900/60 ${group.bg} hover:${group.bg}`}
                                    >
                                        {/* Route */}
                                        <RouteChip route={entry.route} />

                                        {/* Title + desc */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors" style={{ fontSize: '14px' }}>
                                                    {entry.title}
                                                </span>
                                            </div>
                                            <p className="text-zinc-500 mt-0.5 leading-snug" style={{ fontSize: '12px' }}>
                                                {entry.desc}
                                            </p>
                                        </div>

                                        {/* Tags */}
                                        <div className="hidden sm:flex items-center gap-1 shrink-0">
                                            {entry.tags.map((t) => (
                                                <TagBadge key={t} tag={t} small />
                                            ))}
                                        </div>

                                        {/* Arrow */}
                                        <svg
                                            className="shrink-0 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    );
}
