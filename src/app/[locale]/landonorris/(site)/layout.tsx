import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Instrument_Sans, Libre_Caslon_Display } from 'next/font/google';

import LandoShell from '@/modules/pages/LandoNorris/LandoShell';

const sans = Instrument_Sans({ subsets: ['latin'], axes: ['wdth'], variable: '--ln-font-sans', display: 'swap' });
const serif = Libre_Caslon_Display({ subsets: ['latin'], weight: '400', variable: '--ln-font-serif', display: 'swap' });

export const metadata: Metadata = {
    title: 'Ellis Morrow — Racing Driver',
    description: 'Motion study: preloader, WebGL helmet reveal, pinned scroll story and page transitions.',
};

export default function LandoLayout({ children }: { children: ReactNode }) {
    return <LandoShell className={`${sans.variable} ${serif.variable}`}>{children}</LandoShell>;
}
