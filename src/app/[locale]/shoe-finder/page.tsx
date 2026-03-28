'use client';

import dynamic from 'next/dynamic';

const ShoeGrid = dynamic(() => import('@/modules/pages/ShoeFinder/ShoeGrid'), { ssr: false });

export default function ShoeFinderPage() {
    return <ShoeGrid />;
}
