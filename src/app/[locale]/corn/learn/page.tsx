'use client';

// loaded with the route (not the lazy chunk) so the theme is ready before the guide mounts
import '@/modules/pages/CornLearn/learn.scss';

import dynamic from 'next/dynamic';

const CornLearnPage = dynamic(() => import('@/modules/pages/CornLearn/CornLearnPage'), { ssr: false });

export default function CornLearn() {
    return <CornLearnPage />;
}
