'use client';

import dynamic from 'next/dynamic';

const IglooPage = dynamic(() => import('@/modules/pages/Igloo/IglooPage'), { ssr: false });

export default function Igloo() {
    return <IglooPage />;
}
