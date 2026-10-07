'use client';
import '@/modules/pages/Dithering/dithering.css';
import '@/modules/pages/DitheringLearn/learn.css';

import dynamic from 'next/dynamic';
const Guide = dynamic(() => import('@/modules/pages/DitheringLearn/DitheringLearnPage'), { ssr: false });
export default function DitheringLearn() {
    return <Guide />;
}
