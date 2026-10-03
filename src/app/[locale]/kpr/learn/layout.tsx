import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Fonts come from the parent /kpr layout (Whyte, Hexaframe, IBM Plex Mono as CSS variables).
export const metadata: Metadata = {
    title: 'KPR, decoded — a designer’s field guide',
    description:
        'Reverse-engineering the /kpr page: one film clock in screens, choreography as formulas, the notched card shader, painted 3D scenes, pointer layers, the gallery ring, flipbook wipes and text over WebGL — explained for designers, with live demos to tweak.',
    robots: { index: false, follow: false },
};

export default function KprLearnLayout({ children }: { children: ReactNode }) {
    return children;
}
