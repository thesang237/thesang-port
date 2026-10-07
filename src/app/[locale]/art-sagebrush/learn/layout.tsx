import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sagebrush, in marks — a generative art field guide',
    description: 'Ten hands-on chapters exploring the real Sagebrush code: Perlin terrain, erosion, ink physics, procedural plants and new creative studies.',
    robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
