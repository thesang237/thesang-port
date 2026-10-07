'use client';
import '@/modules/pages/ArtCanteraLearn/learn.scss';

import dynamic from 'next/dynamic';
const Guide = dynamic(() => import('@/modules/pages/ArtCanteraLearn/ArtCanteraLearnPage'), { ssr: false });
export default function Page() {
    return <Guide />;
}
