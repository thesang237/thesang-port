import type { ReactNode } from 'react';
import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: 'Small marks, infinite images — Dithering field guide',
    description:
        'Ten hands-on chapters about WebGL printmaking: ordered dithering, seeded stipple, halftone, directional screens, palettes, surface effects and GPU lifecycle. Real shader labs, flashcards and a recipe builder.',
};
export default function LearnLayout({ children }: { children: ReactNode }) {
    return children;
}
