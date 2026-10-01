import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';

// the page's own display font (KH Teka, loaded by the parent /aim-obys layout) + a mono for labels and code
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-al-mono', display: 'swap' });

export const metadata: Metadata = {
    title: 'AIM scroll scenes, decoded — a designer’s field guide',
    description:
        'How the /aim-obys page lays out, reveals and transitions between sections while you scroll: em-based layout, mask reveals, scroll tracks, pinned stages, image entrances with stagger, hovers and overlays — explained for designers with live demos.',
};

export default function AimLearnLayout({ children }: { children: ReactNode }) {
    return <div className={mono.variable}>{children}</div>;
}
