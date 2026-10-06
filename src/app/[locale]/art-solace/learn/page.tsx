'use client';

// loaded with the route (not the lazy chunk) so the theme is ready before the guide mounts
import '@/modules/pages/ArtSolaceLearn/learn.scss';

import dynamic from 'next/dynamic';

const ArtSolaceLearnPage = dynamic(() => import('@/modules/pages/ArtSolaceLearn/ArtSolaceLearnPage'), { ssr: false });

export default function ArtSolaceLearn() {
    return <ArtSolaceLearnPage />;
}
