import type { ReactNode } from 'react';
import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: 'Cantera, uncovered — a field guide to generative stone',
    description: 'Ten interactive studies of Cantera: seeded worlds, terrain, droplet erosion, architectural carving, orthographic projection, ray tracing, stone grain and living scale.',
    robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
