import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Igloo Inc.',
    description: 'Scroll-driven WebGL recreation of igloo.inc — igloo, ice crystals, ring portal and a particle colony.',
};

export default function IglooLayout({ children }: { children: ReactNode }) {
    return children;
}
