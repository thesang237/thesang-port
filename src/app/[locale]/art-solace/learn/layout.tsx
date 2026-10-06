import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google';

// Body text uses the site's Inter (--font-inter). Display: a quiet serif for chapter titles; mono for labels and code.
const display = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], variable: '--sl-font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--sl-font-mono', display: 'swap' });

export const metadata: Metadata = {
    title: 'Solace, decoded — a field guide to generative sand',
    description:
        'How the /art-solace generative artwork works: seeded randomness, weighted traits, noise, a ridge walk, boundary maps, warping and stochastic stippling, then the same ideas rebuilt as GPU shaders, with three new pieces made from them.',
    robots: { index: false, follow: false },
};

export default function ArtSolaceLearnLayout({ children }: { children: ReactNode }) {
    return <div className={`${display.variable} ${mono.variable}`}>{children}</div>;
}
