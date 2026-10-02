import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

// Fonts as used by the reference (study clone only — swap for licensed copies before publishing anywhere)
const whyte = localFont({
    src: '../../../modules/pages/Kpr/fonts/ABCWhytePlusVariable.woff2',
    variable: '--kpr-font-sans',
    weight: '100 900',
    display: 'block',
});
const hexa = localFont({
    src: '../../../modules/pages/Kpr/fonts/HexaframeCF-Bold.otf',
    variable: '--kpr-font-display',
    weight: '700',
    display: 'block',
});
const plex = localFont({
    src: [
        { path: '../../../modules/pages/Kpr/fonts/IBMPlexMono-Regular.ttf', weight: '400', style: 'normal' },
        { path: '../../../modules/pages/Kpr/fonts/IBMPlexMono-Text.ttf', weight: '450', style: 'normal' },
    ],
    variable: '--kpr-font-mono',
    display: 'block',
});

export const metadata: Metadata = {
    title: 'KPR — Story (study)',
    description: 'Motion study: one-film WebGL scroll story with notched cards, painted parallax scenes, a cylinder gallery and glyph wipes.',
    robots: { index: false, follow: false },
};

export default function KprLayout({ children }: { children: ReactNode }) {
    return <div className={`${whyte.variable} ${hexa.variable} ${plex.variable}`}>{children}</div>;
}
