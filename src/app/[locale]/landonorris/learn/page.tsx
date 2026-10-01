'use client';

// loaded with the route (not the lazy chunk) so the theme is ready before the guide mounts
import '@/modules/pages/LandoLearn/learn.scss';

import dynamic from 'next/dynamic';

const LandoLearnPage = dynamic(() => import('@/modules/pages/LandoLearn/LandoLearnPage'), { ssr: false });

export default function LandoLearn() {
    return <LandoLearnPage />;
}
