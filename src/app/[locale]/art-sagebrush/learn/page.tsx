'use client';

import '@/modules/pages/ArtSagebrushLearn/learn.scss';

import dynamic from 'next/dynamic';

const Guide = dynamic(() => import('@/modules/pages/ArtSagebrushLearn/Guide'), { ssr: false });
export default function Page() {
    return <Guide />;
}
