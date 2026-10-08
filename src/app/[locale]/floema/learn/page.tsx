'use client';
import '@/modules/pages/FloemaLearn/learn.css';

import dynamic from 'next/dynamic';

const Guide = dynamic(() => import('@/modules/pages/FloemaLearn/Guide'), { ssr: false });
export default function FloemaLearn() {
    return <Guide />;
}
