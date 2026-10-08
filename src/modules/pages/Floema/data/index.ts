import source from './content.json';

export type Photograph = { src: string; alt: string; width?: number; height?: number };
export type RichParagraph = { type: string; text: string; spans: { start: number; end: number; type: string; data?: { url?: string } }[] };
export type Product = (typeof source.products)[number];
export type AboutSection =
    | { type: 'gallery'; images: Photograph[] }
    | { type: 'title'; text: string }
    | { type: 'content'; side: string; label: string; description: RichParagraph[]; image: Photograph }
    | { type: 'highlight'; title: string; label: string; href: string; images: Photograph[] };
export const content = { ...source, about: source.about as AboutSection[] };
export const numbers = ['One', 'Two', 'Three', 'Four'];
export const palette = {
    home: '#c97164',
    collections: '#bc978c',
    about: '#b2b8c3',
    ink: '#37384c',
    paper: '#f9f1e7',
};
export type View = 'home' | 'collections' | 'about';
export const viewFromPath = (path: string): View => (path.endsWith('/about') ? 'about' : path.endsWith('/collections') ? 'collections' : 'home');
