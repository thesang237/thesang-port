// Every route in the app, grouped into projects. One card per project; extra routes become chips.
// Each project has a screenshot in /public/all/<id>.webp — see NOTES.md for adding projects and capturing thumbnails.

export type Category = 'studies' | '3d' | 'art' | 'motion' | 'ui';

export type Tag = '3D' | 'Shader' | 'Scroll' | 'GSAP' | 'Canvas' | 'CSS' | 'Transition';

export type SubPage = { label: string; route: string; guide?: boolean };

export type Project = {
    id: string;
    title: string;
    desc: string;
    route: string;
    category: Category;
    tags: Tag[];
    added: string; // yyyy-mm-dd, first commit of the route folder
    noThumb?: boolean; // the page renders blank in a screenshot; show a typographic cover instead
    pages?: SubPage[];
};

export const CATEGORIES: { id: Category; label: string; short: string; blurb: string }[] = [
    { id: 'studies', label: 'Site studies', short: 'Studies', blurb: 'Full-site recreations of award-winning work, rebuilt from recordings' },
    { id: '3d', label: '3D & WebGL', short: '3D', blurb: 'Three.js and React Three Fiber scenes, shaders and carousels' },
    { id: 'art', label: 'Generative art', short: 'Art', blurb: 'Seeded, noise-driven drawings on canvas' },
    { id: 'motion', label: 'Motion & scroll', short: 'Motion', blurb: 'GSAP timelines, scroll scenes, hovers and page transitions' },
    { id: 'ui', label: 'UI & notes', short: 'UI', blurb: 'Small interface patterns, CSS tricks and reference notes' },
];

export const PROJECTS: Project[] = [
    // ── Site studies ────────────────────────────────────────────────────────
    {
        id: 'corn',
        title: 'Grainline',
        desc: 'Chapter-by-chapter WebGL journey through a corn plant — slanted wipes, a field simulator and three deep dives',
        route: '/corn',
        category: 'studies',
        tags: ['3D', 'Shader', 'Scroll'],
        added: '2026-10-03',
        pages: [{ label: 'Guide', route: '/corn/learn', guide: true }],
    },
    {
        id: 'kpr',
        title: 'KPR',
        desc: 'One-film scroll page with a notched-card shader, live 3D scenes inside cards and a gallery ring',
        route: '/kpr',
        category: 'studies',
        tags: ['3D', 'Shader', 'Scroll', 'GSAP'],
        added: '2026-10-02',
        pages: [{ label: 'Guide', route: '/kpr/learn', guide: true }],
    },
    {
        id: 'landonorris',
        title: 'Ellis Morrow',
        desc: 'Racing-driver site — glyph preloader, block-reveal type, pinned hero, horizontal gallery, helmet trail',
        route: '/landonorris',
        category: 'studies',
        tags: ['3D', 'Scroll', 'GSAP', 'Transition'],
        added: '2026-10-01',
        pages: [
            { label: 'Guide', route: '/landonorris/learn', guide: true },
            { label: 'On Track', route: '/landonorris/on-track' },
        ],
    },
    {
        id: 'aim-obys',
        title: 'AIM',
        desc: 'Editorial page — Lottie logo loader, scroll-scrubbed logo break-up, pinned photo stage, gallery overlay',
        route: '/aim-obys',
        category: 'studies',
        tags: ['Scroll', 'GSAP'],
        added: '2026-10-01',
        pages: [{ label: 'Guide', route: '/aim-obys/learn', guide: true }],
    },
    {
        id: 'igloo',
        title: 'Igloo Inc.',
        desc: 'Scroll-driven WebGL scenes — an igloo, ice crystals, a ring portal and a particle colony',
        route: '/igloo',
        category: 'studies',
        tags: ['3D', 'Shader', 'Scroll'],
        added: '2026-09-30',
        pages: [{ label: 'Guide', route: '/igloo/learn', guide: true }],
    },
    {
        id: 'floema',
        title: 'Floema',
        desc: 'Design-studio site with a WebGL image gallery and three pages',
        route: '/floema',
        category: 'studies',
        tags: ['3D', 'Scroll', 'Transition'],
        added: '2026-03-25',
        pages: [
            { label: 'About', route: '/floema/about' },
            { label: 'Collections', route: '/floema/collections' },
        ],
    },
    { id: 'truus', title: 'Truus', desc: 'Agency site with a cursor bubble, double marquee, motion cards and a showreel', route: '/truus', category: 'studies', tags: ['GSAP'], added: '2026-03-24' },
    {
        id: 'emil',
        title: 'Invisible Details',
        desc: 'Essay on interface craft — why taste is trained and unseen details compound',
        route: '/emil',
        category: 'studies',
        tags: ['Scroll'],
        added: '2026-03-20',
    },

    // ── 3D & WebGL ──────────────────────────────────────────────────────────
    {
        id: 'shoe-finder',
        title: 'Shoe Finder',
        desc: 'Grid of holographic shoe cards that re-forms by brand and collection, with a mini-map',
        route: '/shoe-finder',
        category: '3d',
        tags: ['3D', 'Shader'],
        added: '2026-03-28',
        pages: [{ label: 'Guide', route: '/shoe-finder/learn', guide: true }],
    },
    {
        id: 'google-countdown',
        title: 'Symbiont',
        desc: 'Audio-visual ecosystem that turns biodata into sound — hover the spores to change the music',
        route: '/google-countdown',
        category: '3d',
        tags: ['3D'],
        added: '2026-05-25',
        pages: [{ label: 'Guide', route: '/google-countdown/learn', guide: true }],
    },
    {
        id: '3d-map',
        title: '3D Map',
        desc: 'Orthographic map of a city block — baked textures, orbit controls, point-of-interest labels',
        route: '/3d-map',
        category: '3d',
        tags: ['3D'],
        added: '2026-03-27',
    },
    {
        id: 'omma-3d-cubes',
        title: 'Omma Cubes',
        desc: 'Noise-driven grid of instanced cubes — nine noise types, orthographic or perspective camera',
        route: '/omma-3d-cubes',
        category: '3d',
        tags: ['3D'],
        added: '2026-03-27',
        pages: [{ label: 'Guide', route: '/omma-3d-cubes/learn', guide: true }],
    },
    {
        id: 'r3f-cards',
        title: '3D Card Carousel',
        desc: 'Infinite scroll carousel bent along a curve by a shader',
        route: '/r3f-cards',
        category: '3d',
        tags: ['3D', 'Shader', 'Scroll'],
        added: '2026-03-24',
        pages: [{ label: 'Guide', route: '/r3f-cards/learn', guide: true }],
    },
    {
        id: 'r3f-experimental',
        title: 'Carousel Experiments',
        desc: 'Six variations on the curved carousel — parallax, tilt, clusters, stacks and an X',
        route: '/r3f-experimental',
        category: '3d',
        tags: ['3D', 'Shader', 'Scroll'],
        added: '2026-03-23',
        pages: [
            { label: '1 Parallax', route: '/r3f-experimental/1' },
            { label: '2 Mixed', route: '/r3f-experimental/2' },
            { label: '3 Tilted', route: '/r3f-experimental/3' },
            { label: '4 Clusters', route: '/r3f-experimental/4' },
            { label: '5 Stacks', route: '/r3f-experimental/5' },
            { label: '6 X', route: '/r3f-experimental/6' },
        ],
    },
    {
        id: 'r3f-bulge',
        title: 'Bulge Text',
        desc: 'Text that swells and ripples under the cursor, made with a vertex shader',
        route: '/r3f-bulge',
        category: '3d',
        tags: ['3D', 'Shader'],
        added: '2026-03-23',
        pages: [{ label: 'Guide', route: '/r3f-bulge/learn', guide: true }],
    },
    {
        id: 'r3f-kinetic',
        title: 'Kinetic Type',
        desc: 'Words wrapped around moving 3D shapes — paper, spiral and tower',
        route: '/r3f-kinetic/paper',
        category: '3d',
        tags: ['3D', 'Shader'],
        added: '2026-03-23',
        pages: [
            { label: 'Spiral', route: '/r3f-kinetic/spiral' },
            { label: 'Tower', route: '/r3f-kinetic/tower' },
        ],
    },
    {
        id: 'r3f',
        title: 'React Three Fiber',
        desc: 'Reference guide to R3F — instancing, memoised materials and keeping scenes fast',
        route: '/r3f',
        category: '3d',
        tags: ['3D'],
        added: '2026-03-20',
    },

    // ── Generative art ──────────────────────────────────────────────────────
    {
        id: 'art-cantera',
        title: 'Cantera',
        desc: 'Generative voxel city with terrain, birds and people in six palettes',
        route: '/art-cantera',
        category: 'art',
        tags: ['Canvas'],
        added: '2026-03-28',
        pages: [{ label: 'Guide', route: '/art-cantera/learn', guide: true }],
    },
    {
        id: 'art-solace',
        title: 'Solace',
        desc: 'Desert dunes drawn from thousands of dots per frame, eighteen palettes',
        route: '/art-solace',
        category: 'art',
        tags: ['Canvas'],
        added: '2026-03-28',
        pages: [{ label: 'Guide', route: '/art-solace/learn', guide: true }],
    },
    {
        id: 'art-sagebrush',
        title: 'Sagebrush',
        desc: 'Eroded noise landscapes drawn by a simulated pen',
        route: '/art-sagebrush',
        category: 'art',
        tags: ['Canvas'],
        added: '2026-03-26',
        pages: [{ label: 'Guide', route: '/art-sagebrush/learn', guide: true }],
    },
    {
        id: 'dithering',
        title: 'Dithering',
        desc: 'A 3D helmet rendered through a dithering post-process shader',
        route: '/dithering',
        category: 'art',
        tags: ['Canvas'],
        added: '2026-03-25',
        pages: [{ label: 'Guide', route: '/dithering/learn', guide: true }],
    },

    // ── Motion & scroll ─────────────────────────────────────────────────────
    {
        id: 'grid-hover',
        title: 'Grid Hover',
        desc: 'Three direction-aware hovers on image cards — letter reveals and clip-path boxes',
        route: '/grid-hover',
        category: 'motion',
        tags: ['GSAP'],
        added: '2026-03-28',
        pages: [{ label: 'Guide', route: '/grid-hover/learn', guide: true }],
    },
    {
        id: 'codrops-page-transition',
        title: 'Page Transition',
        desc: 'Clip-path reveal of the next page while the current one scales away',
        route: '/codrops-page-transition',
        category: 'motion',
        tags: ['GSAP', 'Transition'],
        added: '2026-03-28',
        pages: [{ label: 'Second page', route: '/codrops-page-transition/alternative-page' }],
    },
    {
        id: 'sticky-scroll',
        title: 'Sticky Scroll',
        desc: 'Pinned panel whose content changes as you scroll past',
        route: '/sticky-scroll',
        category: 'motion',
        tags: ['Scroll', 'GSAP'],
        added: '2026-03-24',
        pages: [{ label: 'Guide', route: '/sticky-scroll/learn', guide: true }],
    },
    {
        id: 'scroll',
        title: 'Scroll Scenes',
        desc: 'Four ScrollTrigger experiments and a reusable scroll component',
        route: '/scroll/1',
        category: 'motion',
        tags: ['Scroll', 'GSAP'],
        added: '2026-03-23',
        pages: [
            { label: 'Guide', route: '/scroll/learn', guide: true },
            { label: '2', route: '/scroll/2' },
            { label: '3', route: '/scroll/3' },
            { label: '4', route: '/scroll/4' },
            { label: 'Component', route: '/scroll/component' },
        ],
    },
    {
        id: 'gsap',
        title: 'GSAP',
        desc: 'Hands-on guide to timelines and scroll scenes, plus eight focused experiments',
        route: '/gsap',
        category: 'motion',
        tags: ['GSAP', 'Scroll'],
        added: '2026-03-21',
        pages: [
            { label: '3D transform', route: '/gsap/3d-transform' },
            { label: 'Bento', route: '/gsap/bento' },
            { label: 'Horizontal', route: '/gsap/horizontal-scroll' },
            { label: 'Particles', route: '/gsap/particles' },
            { label: 'Rolling text', route: '/gsap/rolling-text' },
            { label: 'Shader scroll', route: '/gsap/shader-scroll' },
            { label: 'SVG morph', route: '/gsap/svg-morph' },
            { label: 'Morph curve', route: '/gsap/svg-morph-curve' },
        ],
    },
    {
        id: 'component',
        title: 'Build a Drawer',
        desc: 'A drawer is a dialog with swipe — the dialog, gesture and animation layers, step by step',
        route: '/component',
        category: 'ui',
        tags: ['Transition'],
        added: '2026-03-21',
    },

    // ── UI & notes ──────────────────────────────────────────────────────────
    { id: 'jhey-dynamic-toggle', title: 'Dynamic Toggle', desc: 'CSS-only pricing toggle with a sliding pill', route: '/jhey/dynamic-toggle', category: 'ui', tags: ['CSS'], added: '2026-03-29' },
    {
        id: 'jhey-hover-disclosures',
        title: 'Hover Disclosures',
        desc: 'Cards that widen to reveal an image on hover or focus',
        route: '/jhey/hover-disclosures',
        category: 'ui',
        tags: ['CSS'],
        added: '2026-03-29',
    },
    {
        id: 'jhey-svg-slider',
        title: 'SVG Slider',
        desc: 'Range slider with a custom SVG track and thumb',
        route: '/jhey/svg-slider',
        category: 'ui',
        tags: ['CSS'],
        added: '2026-03-29',
        noThumb: true,
    },
    {
        id: 'jhey-sticky-scroll',
        title: 'Sticky Window',
        desc: 'CSS scroll-driven stacking window with an exploded 3D view',
        route: '/jhey/sticky-scroll',
        category: 'ui',
        tags: ['CSS', 'Scroll'],
        added: '2026-03-29',
    },
    {
        id: 'jhey-context-aware',
        title: 'Context-Aware Icons',
        desc: 'App icons with a blurred glow that follows the pointer',
        route: '/jhey/context-aware',
        category: 'ui',
        tags: ['CSS'],
        added: '2026-03-29',
    },
    {
        id: 'jhey-frosted-border',
        title: 'Frosted Border',
        desc: 'Draggable product card with a frosted-glass edge over a scrolling grid',
        route: '/jhey/frosted-border',
        category: 'ui',
        tags: ['CSS'],
        added: '2026-03-29',
    },
    {
        id: 'responsive',
        title: 'Responsive',
        desc: 'Responsive layout from 320px phones to 4K — breakpoints, fluid containers, live demos',
        route: '/responsive',
        category: 'ui',
        tags: ['CSS'],
        added: '2026-03-24',
    },
    { id: 'sooner', title: 'Toast System', desc: 'Build swipe-to-dismiss toasts from first principles', route: '/sooner', category: 'ui', tags: ['Transition'], added: '2026-03-22' },
    { id: 'typescript', title: 'TypeScript', desc: 'Why types pay off — documented props, edit-time errors and safe refactors', route: '/typescript', category: 'ui', tags: [], added: '2026-03-20' },
    { id: 'home', title: 'Home', desc: 'Landing page — crafting digital experiences', route: '/', category: 'ui', tags: [], added: '2026-03-18' },
    { id: 'roadmap', title: 'Roadmap', desc: 'Week-by-week learning plan: ship something every week', route: '/roadmap', category: 'ui', tags: [], added: '2026-03-18' },
];

export const ALL_TAGS: Tag[] = ['3D', 'Shader', 'Scroll', 'GSAP', 'Canvas', 'CSS', 'Transition'];

/** Every route the app serves (except /all), for the total count. */
export const routeCount = PROJECTS.reduce((n, p) => n + 1 + (p.pages?.length ?? 0), 0);
