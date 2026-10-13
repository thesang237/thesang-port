import '@/modules/pages/FloemaTwo/styles.css';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import FloemaShell from '@/modules/pages/FloemaTwo/Shell';

export const metadata: Metadata = {
    title: { default: 'Floema — Spaces for people', template: '%s | Floema' },
    description: 'A private design study of enduring objects and spaces for people.',
    robots: { index: false, follow: false },
};

export default function FloemaTwoLayout({ children }: { children: ReactNode }) {
    return <FloemaShell>{children}</FloemaShell>;
}
