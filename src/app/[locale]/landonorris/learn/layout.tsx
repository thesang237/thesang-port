import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono, Libre_Caslon_Display } from 'next/font/google';

// same families as the source page (+ a mono for labels and code)
const sans = Instrument_Sans({ subsets: ['latin'], axes: ['wdth'], variable: '--ll-font-sans', display: 'swap' });
const serif = Libre_Caslon_Display({ subsets: ['latin'], weight: '400', variable: '--ll-font-serif', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-ll-mono', display: 'swap' });

export const metadata: Metadata = {
    title: 'Ellis Morrow, decoded — a designer’s field guide',
    description:
        'Reverse-engineering the /landonorris page: timing from video, smooth scroll, block reveals, menu choreography, pinned and horizontal scroll scenes, WebGL shader effects and page transitions — explained for designers, with live demos to tweak.',
};

export default function LandoLearnLayout({ children }: { children: ReactNode }) {
    return <div className={`${sans.variable} ${serif.variable} ${mono.variable}`}>{children}</div>;
}
