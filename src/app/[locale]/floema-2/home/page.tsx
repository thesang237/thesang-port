import type { Metadata } from 'next';

import Home from '@/modules/pages/FloemaTwo/Home';
export const metadata: Metadata = { title: 'Spaces for people, made for life' };
export default function HomePage() {
    return <Home />;
}
