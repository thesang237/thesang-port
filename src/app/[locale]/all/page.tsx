'use client';

// loaded with the route so the theme is ready before the index mounts
import '@/modules/pages/AllPages/all.scss';

import dynamic from 'next/dynamic';

const AllPages = dynamic(() => import('@/modules/pages/AllPages/AllPages'), { ssr: false });

export default function AllPagesRoute() {
    return <AllPages />;
}
