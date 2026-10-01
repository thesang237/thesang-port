'use client';

// loaded with the route (not the lazy chunk) so the theme is ready before the guide mounts
import '@/modules/pages/AimLearn/learn.scss';

import dynamic from 'next/dynamic';

const AimLearnPage = dynamic(() => import('@/modules/pages/AimLearn/AimLearnPage'), { ssr: false });

export default function AimLearn() {
    return <AimLearnPage />;
}
