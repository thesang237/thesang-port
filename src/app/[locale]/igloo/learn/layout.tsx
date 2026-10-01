import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Igloo, decoded — a designer’s field guide',
    description:
        'Reverse-engineering the /igloo page: smooth scroll, scroll timelines, text motion, three.js worlds, shaders, particles and interaction — explained for designers, with live demos to tweak.',
};

export default function IglooLearnLayout({ children }: { children: ReactNode }) {
    return children;
}
