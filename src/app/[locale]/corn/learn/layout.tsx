import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JetBrains_Mono, Urbanist } from 'next/font/google';

// The display face (caps) comes from the parent /corn layout as --corn-font-display.
// Body: Urbanist (round and geometric like the page's Gilroy, but readable at length). Mono for labels and code.
const body = Urbanist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--cl-font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--cl-font-mono', display: 'swap' });

export const metadata: Metadata = {
    title: 'Grainline, decoded — a designer’s field guide',
    description:
        'Reverse-engineering the /corn page: a stepped virtual scroll, one story number, render targets and a slanted wipe, MSDF titles that trace and scatter, baked light, bokeh, procedural DNA, springs and faked depth — explained for designers, with live demos to tweak.',
    robots: { index: false, follow: false },
};

export default function CornLearnLayout({ children }: { children: ReactNode }) {
    return <div className={`${body.variable} ${mono.variable}`}>{children}</div>;
}
