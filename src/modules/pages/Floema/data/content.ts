export type ImageData = {
    url: string;
    alt: string;
};
export type Collection = {
    title: string;
    description: string;
};
export type Product = {
    title: string;
    collection: string;
    image: ImageData;
    background: string;
    highlights: Array<{ icon: 'arrow' | 'star'; text: string }>;
    informations: Array<{ label: string; description: string }>;
    linkUrl: string;
    linkText: string;
};

export const collections: Collection[] = [
    {
        title: 'Equinox',
        description:
            'Where light meets shadow in perfect balance. Each piece in the Equinox collection captures the fleeting moment when day transitions into night, embodying the harmony of opposites.',
    },
    {
        title: 'Solstice',
        description: "Inspired by the longest days and the shortest nights, the Solstice collection celebrates the peak of nature's cycles with bold forms and radiant surfaces.",
    },
    {
        title: 'Meridian',
        description: 'At the intersection of time and space, the Meridian collection explores the geometry of precision — each angle deliberate, each curve purposeful.',
    },
    {
        title: 'Zenith',
        description: 'The highest point. The Zenith collection represents the pinnacle of craftsmanship, where material and form transcend function to become pure expression.',
    },
];

export const homeGallery: ImageData[] = Array.from({ length: 10 }, (_, i) => ({
    url: `https://picsum.photos/seed/floema${i + 1}/600/800`,
    alt: `Gallery image ${i + 1}`,
}));

export const aboutGallery: ImageData[] = Array.from({ length: 8 }, (_, i) => ({
    url: `https://picsum.photos/seed/about${i + 1}/500/600`,
    alt: `About gallery image ${i + 1}`,
}));

type AboutSection =
    | { type: 'title'; text: string }
    | { type: 'content'; layout: 'left' | 'right'; label: string; description: string; image: ImageData }
    | { type: 'highlight'; link: string; label?: string; title: string; images: ImageData[] }
    | { type: 'gallery'; images: ImageData[] };

export const aboutContent: AboutSection[] = [
    {
        type: 'title',
        text: 'We create objects\nthat outlive trends.',
    },
    {
        type: 'content',
        layout: 'left',
        label: 'Studio',
        description:
            'Founded in 2019, Floema is an independent design studio specializing in decorative objects and jewelry. We work at the intersection of craft and technology, creating pieces that are both timeless and contemporary.\n\nOur process begins with material — we source sustainably, work locally, and finish by hand.',
        image: { url: 'https://picsum.photos/seed/about-studio/538/808', alt: 'Studio workspace' },
    },
    {
        type: 'highlight',
        link: 'https://floema.com',
        label: 'Featured',
        title: 'Equinox',
        images: [
            { url: 'https://picsum.photos/seed/highlight1/540/760', alt: 'Equinox piece front' },
            { url: 'https://picsum.photos/seed/highlight2/540/760', alt: 'Equinox piece back' },
        ],
    },
    {
        type: 'content',
        layout: 'right',
        label: 'Philosophy',
        description:
            'We believe objects carry meaning. A well-made thing tells a story about attention, time, and care. In an age of disposable goods, we choose the opposite path.\n\nEvery object we create is made to be passed on.',
        image: { url: 'https://picsum.photos/seed/about-philosophy/960/600', alt: 'Design philosophy' },
    },
    {
        type: 'gallery',
        images: Array.from({ length: 4 }, (_, i) => ({
            url: `https://picsum.photos/seed/gallery-section${i}/309/437`,
            alt: `Gallery ${i + 1}`,
        })),
    },
    {
        type: 'content',
        layout: 'left',
        label: 'Materials',
        description:
            'We work with brass, silver, ceramic, and hand-selected natural stones. Every material is chosen for its character — the way it ages, the way it catches light, the way it feels in the hand.\n\nNo material is used without intention.',
        image: { url: 'https://picsum.photos/seed/about-materials/842/520', alt: 'Materials' },
    },
    {
        type: 'highlight',
        link: 'https://floema.com',
        title: 'Meridian',
        images: [
            { url: 'https://picsum.photos/seed/highlight3/360/528', alt: 'Meridian piece 1' },
            { url: 'https://picsum.photos/seed/highlight4/360/528', alt: 'Meridian piece 2' },
        ],
    },
    {
        type: 'content',
        layout: 'right',
        label: 'Process',
        description:
            'Design begins with a sketch. From sketch to prototype, from prototype to production — each step is evaluated against a single question: does this serve the object?\n\nWe prototype slowly and produce deliberately.',
        image: { url: 'https://picsum.photos/seed/about-process/608/858', alt: 'Design process' },
    },
];

const bgColors = ['#bc978c', '#b2b8c3', '#c97164', '#37384c'];

export const products: Product[] = collections
    .map((col, ci) =>
        Array.from({ length: 3 }, (_, pi) => ({
            title: `${col.title} ${['Ring', 'Pendant', 'Brooch'][pi]}`,
            collection: col.title,
            image: {
                url: `https://picsum.photos/seed/product-${ci}-${pi}/554/782`,
                alt: `${col.title} ${['Ring', 'Pendant', 'Brooch'][pi]}`,
            },
            background: bgColors[ci],
            highlights: [
                { icon: 'arrow' as const, text: 'Handcrafted in our studio' },
                { icon: 'star' as const, text: 'Sterling silver, 18k gold plated' },
                { icon: 'star' as const, text: 'Comes with certificate of authenticity' },
            ],
            informations: [
                { label: 'Material', description: 'Sterling silver 925' },
                { label: 'Weight', description: `${8 + pi * 2}g` },
                { label: 'Finish', description: 'Matte brushed' },
                { label: 'Origin', description: 'Studio-made, Paris' },
            ],
            linkUrl: 'https://floema.com',
            linkText: 'Shop now',
        })),
    )
    .flat();
