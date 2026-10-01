'use client';

// loaded with the route (not the lazy chunk) so the theme is ready before the guide mounts
import '@/modules/pages/IglooLearn/learn.scss';

import dynamic from 'next/dynamic';

const IglooLearnPage = dynamic(() => import('@/modules/pages/IglooLearn/IglooLearnPage'), { ssr: false });

export default function IglooLearn() {
    return <IglooLearnPage />;
}
