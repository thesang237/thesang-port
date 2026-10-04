import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

// Body face as used by the reference (study clone only: swap for a licensed copy before publishing anywhere)
const gilroy = localFont({
    src: '../../../modules/pages/Corn/fonts/Gilroy-Light.woff2',
    variable: '--corn-font-body',
    weight: '300',
    display: 'block',
});
// Headline face rebuilt from the reference's MSDF atlas (traced to vectors, see Corn/NOTES.md "Fonts")
const display = localFont({
    src: '../../../modules/pages/Corn/fonts/ManifoldTraced.woff2',
    variable: '--corn-font-display',
    weight: '700',
    display: 'block',
});

export const metadata: Metadata = {
    title: 'Grainline (study)',
    description: 'Motion study: a chapter-by-chapter WebGL story with MSDF text that draws in and scatters under the pointer.',
    robots: { index: false, follow: false },
};

export default function CornLayout({ children }: { children: ReactNode }) {
    return <div className={`${gilroy.variable} ${display.variable}`}>{children}</div>;
}
