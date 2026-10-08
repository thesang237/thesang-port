import '@/modules/pages/Floema/floema.css';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import FloemaRouteBoundary from './FloemaRouteBoundary';

export const metadata: Metadata = { title: 'Floema — Handmade Jewelry', description: 'Creating new dialogues between threads and metal.' };
export default function FloemaLayout({ children }: { children: ReactNode }) {
    return <FloemaRouteBoundary>{children}</FloemaRouteBoundary>;
}
