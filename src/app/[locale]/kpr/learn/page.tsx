'use client';

// loaded with the route (not the lazy chunk) so the theme is ready before the guide mounts
import '@/modules/pages/KprLearn/learn.scss';

import dynamic from 'next/dynamic';

const KprLearnPage = dynamic(() => import('@/modules/pages/KprLearn/KprLearnPage'), { ssr: false });

export default function KprLearn() {
    return <KprLearnPage />;
}
